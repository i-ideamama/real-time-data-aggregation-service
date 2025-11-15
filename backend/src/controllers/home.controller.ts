import axios from "axios";
import type { Request, Response } from "express";

const toNum = (v: any) => (v == null ? null : Number(v) || null);
const lc = (s?: string) => (s ? s.toLowerCase() : null);

const jupListFrom = (d: any) => (Array.isArray(d) ? d : d?.results ?? d?.data ?? d?.tokens ?? []);
const dexListFrom = (d: any) => (Array.isArray(d) ? d : d?.pairs ?? d?.results ?? []);

const currentCoin = "pepe";

async function fetchAllJupPages(query: string) {
  let url = `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`;
  const all: any[] = [];

  while (url) {
    const res = await axios.get(url);
    const data = res.data;

    if (Array.isArray(data.results)) {
      all.push(...data.results);
    }

    url = data.next_url ?? null; // follow cursor
  }

  return all;
}


export const checkAPI = async (_req: Request, res: Response) => {
  try {
    const [jupResp, dexResp, cgResp] = await Promise.allSettled([
      axios.get("https://lite-api.jup.ag/tokens/v2/search?query="+currentCoin),
      axios.get("https://api.dexscreener.com/latest/dex/search?q="+currentCoin),
      axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd").catch(() => null),
    ]);
    const jup = jupResp.status === "fulfilled" ? jupResp.value.data : null;
    const dex = dexResp.status === "fulfilled" ? dexResp.value.data : null;
    const cg = cgResp.status === "fulfilled" && cgResp.value ? cgResp.value.data : null;

    const jList = await fetchAllJupPages(currentCoin);
    const dList = dexListFrom(dex);

    // prefer SOL price from dex pairs where baseToken.symbol === "SOL"
    let solUsd: number | null = null;
    for (const p of dList || []) {
      const baseSym = p?.baseToken?.symbol?.toString().toUpperCase();
      const priceUsd = toNum(p?.priceUsd);
      if (baseSym === "SOL" && priceUsd) {
        solUsd = priceUsd;
        break;
      }
    }
    // fallback to CoinGecko
    if (!solUsd) solUsd = toNum(cg?.solana?.usd ?? cg?.sol?.usd) ?? null;

    // build map by address (lowercase) or symbol fallback
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

      // PRICE: prefer j.usdPrice (Jupiter) then p.priceUsd (Dexscreener); prefer explicit SOL price fields if present
      const usdPrice = toNum(j?.usdPrice ?? j?.priceUsd ?? p?.priceUsd ?? p?.baseToken?.priceUsd);
      const explicitPriceSol = toNum(j?.price_sol ?? j?.priceSol ?? p?.priceNative ?? null);
      const price_sol = explicitPriceSol ?? (usdPrice && solUsd ? Number(usdPrice / solUsd) : null);

      // MARKET CAP: Jupiter uses mcap; Dex uses marketCap/fdv
      const marketUsd =
        toNum(j?.mcap ?? j?.mcapUsd ?? j?.mcap) ?? toNum(p?.marketCap ?? p?.fdv ?? null);
      const market_cap_sol = marketUsd && solUsd ? Number(marketUsd / solUsd) : null;

      // VOLUME: Jupiter sample has stats24h.buyVolume / sellVolume / buyVolume; Dex has volume.h24
      const jBuy = toNum(j?.stats24h?.buyVolume ?? j?.buyVolume ?? j?.stats24h?.buyVolume);
      const jSell = toNum(j?.stats24h?.sellVolume ?? j?.sellVolume ?? j?.stats24h?.sellVolume);
      const jVol = (jBuy || 0) + (jSell || 0) || null;
      const dexVol = toNum(p?.volume?.h24 ?? p?.volume_h24 ?? p?.volume);
      const volUsd = jVol ?? dexVol;
      const volume_sol = volUsd && solUsd ? Number(volUsd / solUsd) : null;

      // LIQUIDITY: Jupiter has liquidity, dex has liquidity.usd
      const liqUsd = toNum(j?.liquidity ?? j?.liquidityUsd ?? p?.liquidity?.usd ?? p?.liquidity ?? null);
      const liquidity_sol = liqUsd && solUsd ? Number(liqUsd / solUsd) : null;

      // TRANSACTION COUNT: j.stats24h.numTraders or j.numTraders; dex sum buys+sells in txns.h24
      const txJ = toNum(j?.stats24h?.numTraders ?? j?.numTraders ?? j?.holderCount);
      const txDex =
        (toNum(p?.txns?.h24?.buys) || 0) + (toNum(p?.txns?.h24?.sells) || 0) || null;
      const transaction_count = txJ ?? txDex ?? null;

      // PRICE 1H CHANGE: j.stats1h.priceChange or p.priceChange.h1
      const price_1hr_change = toNum(j?.stats1h?.priceChange ?? j?.priceChange ?? p?.priceChange?.h1 ?? p?.priceChange?.h1 ?? null);

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

    return res.status(200).json({ sol_price_usd: solUsd, merged_count: results.length, results });
  } catch (err: any) {
    console.error("merge error:", err);
    return res.status(500).json({ message: "internal error", error: err?.message ?? String(err) });
  }
};
