import axios from "axios";
import type { Request, Response } from "express";
import { redisClient } from '../redisClient';
import { getIO } from '../socket';
import dotenv from "dotenv";
dotenv.config();
const DEFAULT_EXPIRATION = Number(process.env.REDIS_DEFAULT_EXPIRATION) || 60;


// some helpers
const toNum = (v: any) => (v == null ? null : Number(String(v).replace("%", "")) || null);
const lc = (s?: string) => (s ? s.toLowerCase() : null);

const jupListFrom = (d: any) => (Array.isArray(d) ? d : d?.results ?? d?.data ?? d?.tokens ?? []);
const dexListFrom = (d: any) => (Array.isArray(d) ? d : d?.pairs ?? d?.results ?? []);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


// generic exponential-backoff wrapper
async function withBackoff<T>(
  fn: () => Promise<T>,
  opts: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
    jitter?: boolean;
    retryOn?: (err: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 4,
    baseDelayMs = 200,
    maxDelayMs = 10000,
    factor = 2,
    jitter = true,
    retryOn = () => true,
  } = opts;

  let attempt = 0;
  let lastErr: any = null;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!retryOn(err)) throw err;
      if (attempt === maxRetries) break;

      // compute exponential delay
      let delay = baseDelayMs * Math.pow(factor, attempt);
      if (delay > maxDelayMs) delay = maxDelayMs;

      // random jitter
      if (jitter) {
        const jitterFactor = 0.25;
        const rnd = (Math.random() - 0.5) * 2 * jitterFactor; // -j..+j
        delay = Math.max(0, Math.round(delay * (1 + rnd)));
      }

      // wait then retry
      await sleep(delay);
      attempt++;
    }
  }

  // retries exhausted
  throw lastErr;
}

// MAIN LOGIC :

// fetch all pages from Jupiter with cursor pagination
async function fetchAllJupPages(query: string) {
  let url = `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`;
  const all: any[] = [];
  while (url) {
    const res = await withBackoff(() => axios.get(url), {
      maxRetries: 5,
      baseDelayMs: 150,
      factor: 2,
      maxDelayMs: 5000,
      jitter: true,
      retryOn: (err) => {
        // retry on specific network errors
        const status = err?.response?.status;
        if (!status) return true;
        if (status === 429) return true;
        if (status >= 500) return true;
        return false;
      },
    });
    const data = res.data;
    if (Array.isArray(data.results)) all.push(...data.results);
    url = data.next_url ?? null;
  }
  return all;
}

// merge one coin's jupList + dexList
function mergeLists(jList: any[], dList: any[], solUsd: number | null) {
  const map = new Map<string, { j?: any; d?: any }>();

  const addDex = (p: any) => {
    const addr = lc(p?.baseToken?.address) || lc(p?.pairAddress) || null;
    const sym = p?.baseToken?.symbol?.toString().toUpperCase() ?? null;
    const key = addr ?? sym;
    if (!key) return;
    const cur = map.get(key) ?? {};
    cur.d = cur.d ?? p;
    map.set(key, cur);
  };
  const addJup = (t: any) => {
    const addr = lc(t?.id) ?? lc(t?.tokenProgram) ?? null;
    const sym = t?.symbol?.toString().toUpperCase() ?? null;
    const key = addr ?? sym;
    if (!key) return;
    const cur = map.get(key) ?? {};
    cur.j = cur.j ?? t;
    map.set(key, cur);
  };

  (dList || []).forEach(addDex);
  (jList || []).forEach(addJup);

  const results = Array.from(map.entries()).map(([key, pair]) => {
    const j = pair.j ?? {};
    const p = pair.d ?? {};

    const token_address =
      lc(j?.id) ?? lc(j?.tokenProgram) ?? lc(p?.baseToken?.address) ?? lc(p?.pairAddress) ?? key ?? null;

    const token_name = j?.name ?? j?.token_name ?? p?.baseToken?.name ?? p?.baseToken?.title ?? null;
    const token_ticker = (j?.symbol ?? p?.baseToken?.symbol ?? key)?.toString() ?? null;

    const usdPrice = toNum(j?.usdPrice ?? j?.priceUsd ?? p?.priceUsd ?? p?.baseToken?.priceUsd);
    const explicitPriceSol = toNum(j?.price_sol ?? j?.priceSol ?? p?.priceNative ?? null);
    const price_sol = explicitPriceSol ?? (usdPrice && solUsd ? Number(usdPrice / solUsd) : null);

    const marketUsd = toNum(j?.mcap ?? j?.mcapUsd ?? j?.mcap) ?? toNum(p?.marketCap ?? p?.fdv ?? null);
    const market_cap_sol = marketUsd && solUsd ? Number(marketUsd / solUsd) : null;

    const jBuy = toNum(j?.stats24h?.buyVolume ?? j?.buyVolume ?? j?.stats24h?.buyVolume);
    const jSell = toNum(j?.stats24h?.sellVolume ?? j?.sellVolume ?? j?.stats24h?.sellVolume);
    const jVol = (jBuy || 0) + (jSell || 0) || null;
    const dexVol = toNum(p?.volume?.h24 ?? p?.volume_h24 ?? p?.volume);
    const volUsd = jVol ?? dexVol;
    const volume_sol = volUsd && solUsd ? Number(volUsd / solUsd) : null;

    const liqUsd = toNum(j?.liquidity ?? j?.liquidityUsd ?? p?.liquidity?.usd ?? p?.liquidity ?? null);
    const liquidity_sol = liqUsd && solUsd ? Number(liqUsd / solUsd) : null;

    const txJ = toNum(j?.stats24h?.numTraders ?? j?.numTraders ?? j?.holderCount);
    const txDex = ((toNum(p?.txns?.h24?.buys) || 0) + (toNum(p?.txns?.h24?.sells) || 0)) || null;
    const transaction_count = txJ ?? txDex ?? null;

    const price_1hr_change = toNum(
      j?.stats1h?.priceChange ?? j?.priceChange ?? p?.priceChange?.h1 ?? p?.priceChange?.h1 ?? null
    );

    const protocol = j?.launchpad ?? j?.protocol ?? p?.dexId ?? p?.dex ?? null;

    return {
      token_address,
      token_name: token_name ?? token_ticker ?? "unknown",
      token_ticker,
      price_sol,
      market_cap_sol,
      volume_sol,
      liquidity_sol,
      transaction_count,
      price_1hr_change,
      protocol,
    };
  });

  return results;
}

async function processCoin(query: string, solUsdFallback: number | null) {
  try {
    const [jList, dexResp] = await Promise.all([
      fetchAllJupPages(query),
      // Dexscreener with backoff and same retry policy
      withBackoff(
        () =>
          axios
            .get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`)
            .then((r) => r.data),
        {
          maxRetries: 4,
          baseDelayMs: 200,
          factor: 2,
          maxDelayMs: 5000,
          jitter: true,
          retryOn: (err) => {
            const status = err?.response?.status;
            if (!status) return true;
            if (status === 429) return true;
            if (status >= 500) return true;
            return false;
          },
        }
      ).catch(() => null),
    ]);

    const dList = dexListFrom(dexResp);

    // try to find SOL price in this dex response (helps when coin query returns SOL pairs)
    let solUsdLocal: number | null = null;
    for (const p of dList || []) {
      const baseSym = p?.baseToken?.symbol?.toString().toUpperCase();
      const priceUsd = toNum(p?.priceUsd);
      if (baseSym === "SOL" && priceUsd) {
        solUsdLocal = priceUsd;
        break;
      }
    }

    const solUsd = solUsdLocal ?? solUsdFallback;

    const merged = mergeLists(jList, dList, solUsd);
    return { query, merged, counts: { jup: jList.length, dex: dList.length } };
  } catch (err) {
    console.error(`error processing ${query}:`, err);
    return { query, merged: [], counts: { jup: 0, dex: 0 }, error: (err as any)?.message ?? String(err) };
  }
}

export const checkAPI = async (_req: Request, res: Response) => {
  const coins = ["meme", "guru"];

  try {
    // redisClient is created/imported from redisClient.ts and connects on import

    const cacheKey = `merged:${coins.join(",")}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // emit cached payload to connected clients so frontend updates even on cache hits
        try {
          const io = getIO();
          if (io) {
            console.log('[controller] emitting home:update (cache) to clients');
            (io as any).emit('home:update', parsed);
          } else {
            console.log('[controller] no io instance available (cache)');
          }
        } catch (emitErr) {
          console.error('socket emit error (cache):', emitErr);
        }
        return res.status(200).json({ fromCache: true, ...parsed });
      }
    } catch (rcErr) {
      console.error("Redis GET error:", rcErr);
    }
    const cgResp = await withBackoff(
      () => axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"),
      {
        maxRetries: 4,
        baseDelayMs: 200,
        factor: 2,
        maxDelayMs: 5000,
        jitter: true,
        retryOn: (err) => {
          const status = err?.response?.status;
          if (!status) return true;
          if (status === 429) return true;
          if (status >= 500) return true;
          return false;
        },
      }
    ).catch(() => null);

    const solUsdFallback = toNum(cgResp?.data?.solana?.usd ?? cgResp?.data?.sol?.usd) ?? null;
    const settled = await Promise.allSettled(coins.map((c) => processCoin(c, solUsdFallback)));

    const aggregated: any[] = [];
    const perCoinSummary: any[] = [];

    for (const s of settled) {
      if (s.status === "fulfilled") {
        const { query, merged, counts, error } = s.value;
        perCoinSummary.push({ query, merged_count: merged.length, counts, error });
        aggregated.push(...merged.map((item: any) => ({ ...item, _query: query })));
      } else {
        perCoinSummary.push({ query: "unknown", merged_count: 0, error: s.reason?.message ?? String(s.reason) });
      }
    }

    const payload = {
      coins,
      sol_price_usd_hint: solUsdFallback,
      total_merged: aggregated.length,
      per_coin: perCoinSummary,
      results: aggregated,
    };

    try {
      await redisClient.setEx(cacheKey, DEFAULT_EXPIRATION, JSON.stringify(payload));

      // emit socket update to connected clients
      try {
        const io = getIO();
        if (io) {
          console.log('[controller] emitting home:update (fresh) to clients');
          (io as any).emit('home:update', payload);
        } else {
          console.log('[controller] no io instance available (fresh)');
        }
      } catch (emitErr) {
        console.error('socket emit error', emitErr);
      }
    } catch (rcErr) {
      console.error("Redis SETEX error:", rcErr);
    }

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("overall error:", err);
    return res.status(500).json({ message: "internal error", error: err?.message ?? String(err) });
  }
};
