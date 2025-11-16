import axios from "axios";
import type { Request, Response } from "express";
import { createClient } from "redis";


// use URL here when hosting
const redisClient = createClient();
redisClient.on("error", (err) => console.error("Redis Client Error", err));

const DEFAULT_EXPIRATION = 60;

const toNum = (v: any) => (v == null ? null : Number(String(v).replace("%", "")) || null);
const lc = (s?: string) => (s ? s.toLowerCase() : null);

const jupListFrom = (d: any) => (Array.isArray(d) ? d : d?.results ?? d?.data ?? d?.tokens ?? []);
const dexListFrom = (d: any) => (Array.isArray(d) ? d : d?.pairs ?? d?.results ?? []);

/** fetch all pages from Jupiter lite (cursor pagination) */
async function fetchAllJupPages(query: string) {
  let url = `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`;
  const all: any[] = [];
  while (url) {
    const res = await axios.get(url);
    const data = res.data;
    if (Array.isArray(data.results)) all.push(...data.results);
    url = data.next_url ?? null;
  }
  return all;
}

/** merge one coin's jupList + dexList into the output shape (reuses your logic) */
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

/** Process a single coin query: fetch jup pages + dex list, return merged results. */
async function processCoin(query: string, solUsdFallback: number | null) {
  try {
    const [jList, dexResp] = await Promise.all([
      fetchAllJupPages(query),
      axios.get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`).then(r => r.data).catch(() => null),
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

/** Handler: runs for multiple coins and aggregates results */
export const checkAPI = async (_req: Request, res: Response) => {
  // update this list to the coins you want to run
  const coins = ["bonk", "dogecoin"];

  try {
    // ensure redis connection (lazy connect)
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // build a cache key per coins array (order matters)
    const cacheKey = `merged:${coins.join(",")}`;

    // try to return cached result
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.status(200).json({ fromCache: true, ...parsed });
      }
    } catch (rcErr) {
      // don't fail hard on cache read errors; log and continue
      console.error("Redis GET error:", rcErr);
    }

    // fetch global CoinGecko SOL price once (fallback)
    const cgResp = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd").catch(() => null);
    const solUsdFallback = toNum(cgResp?.data?.solana?.usd ?? cgResp?.data?.sol?.usd) ?? null;

    // process all coins concurrently but safe with Promise.allSettled
    const settled = await Promise.allSettled(coins.map(c => processCoin(c, solUsdFallback)));

    // collect results (ignore failed ones but include error message)
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

    // cache the payload (best-effort; log errors)
    try {
      await redisClient.setEx(cacheKey, DEFAULT_EXPIRATION, JSON.stringify(payload));
    } catch (rcErr) {
      console.error("Redis SETEX error:", rcErr);
    }

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("overall error:", err);
    return res.status(500).json({ message: "internal error", error: err?.message ?? String(err) });
  }
};
