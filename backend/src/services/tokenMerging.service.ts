import { Token, DexScreenerPair, JupiterToken } from '../types/token';
import { logger } from '../config/logger';

const toNumber = (v: any): number | null => {
  if (v == null) return null;
  const num = Number(String(v).replace('%', ''));
  return isNaN(num) ? null : num;
};

const toLowerCase = (s?: string): string | null => {
  return s ? s.toLowerCase() : null;
};

export class TokenMergingService {
  mergeTokens(
    jupiterTokens: JupiterToken[],
    dexPairs: DexScreenerPair[],
    solPriceUsd: number | null
  ): Token[] {
    const map = new Map<string, { j?: JupiterToken; d?: DexScreenerPair }>();

    const addDex = (pair: DexScreenerPair) => {
      const addr = toLowerCase(pair.baseToken?.address);
      const sym = pair.baseToken?.symbol?.toUpperCase();
      const key = addr || sym;
      if (!key) return;

      const current = map.get(key) || {};
      current.d = current.d || pair;
      map.set(key, current);
    };

    const addJup = (token: JupiterToken) => {
      const addr = toLowerCase(token.id);
      const sym = token.symbol?.toUpperCase();
      const key = addr || sym;
      if (!key) return;

      const current = map.get(key) || {};
      current.j = current.j || token;
      map.set(key, current);
    };

    (dexPairs || []).forEach((p) => addDex(p));
    (jupiterTokens || []).forEach((t) => addJup(t));

    const results: Token[] = [];

    for (const [_key, pair] of map.entries()) {
      const j = pair.j;
      const p = pair.d;

      const tokenAddress =
        toLowerCase(j?.id) ||
        toLowerCase(p?.baseToken?.address) ||
        toLowerCase(p?.pairAddress) ||
        _key ||
        null;

      const tokenName = j?.name || p?.baseToken?.name || _key || 'unknown';
      const tokenTicker = (j?.symbol || p?.baseToken?.symbol || _key)?.toUpperCase() || null;

      const usdPrice = toNumber(j?.price_usd || j?.priceUsd || p?.priceUsd);
      const nativePrice = toNumber(j?.price_native || p?.priceNative);
      const priceSol = nativePrice || (usdPrice && solPriceUsd ? usdPrice / solPriceUsd : null);

      const marketCapUsd =
        toNumber(j?.mcapUsd || j?.mcap) || toNumber(p?.marketCap || p?.fdv) || null;
      const marketCapSol = marketCapUsd && solPriceUsd ? marketCapUsd / solPriceUsd : null;

      const jBuyVol = toNumber(j?.stats24h?.buyVolume);
      const jSellVol = toNumber(j?.stats24h?.sellVolume);
      const jVolUsd = (jBuyVol || 0) + (jSellVol || 0) || null;
      const dexVolUsd = toNumber(p?.volume?.h24) || null;
      const volUsd = jVolUsd || dexVolUsd || null;
      const volSol = volUsd && solPriceUsd ? volUsd / solPriceUsd : null;

      const vol24hChange = toNumber(j?.stats24h?.priceChange) || null;

      const liqUsd = toNumber(j?.liquidityUsd || j?.liquidity) || toNumber(p?.liquidity?.usd) || null;
      const liqSol = liqUsd && solPriceUsd ? liqUsd / solPriceUsd : null;

      const txJ = toNumber(j?.stats24h?.numTraders || j?.holderCount);
      const txDex =
        (toNumber(p?.txns?.h24?.buys) || 0) + (toNumber(p?.txns?.h24?.sells) || 0) || null;
      const txCount = txJ || txDex || null;

      const price1hChange = toNumber(j?.stats1h?.priceChange) || null;
      const price24hChange = toNumber(j?.stats24h?.priceChange) || toNumber(p?.priceChange?.h24) || null;

      if (!tokenAddress) continue;

      const token: Token = {
        token_address: tokenAddress,
        token_name: tokenName,
        token_ticker: tokenTicker,
        price_sol: priceSol,
        price_usd: usdPrice,
        market_cap_sol: marketCapSol,
        market_cap_usd: marketCapUsd,
        volume_sol: volSol,
        volume_usd: volUsd,
        volume_24h_change: vol24hChange,
        liquidity_sol: liqSol,
        liquidity_usd: liqUsd,
        transaction_count: txCount,
        transaction_count_24h: txCount,
        price_1hr_change: price1hChange,
        price_24hr_change: price24hChange,
        price_7d_change: null,
        holders_count: toNumber(j?.holderCount),
        protocol: j?.name ? 'jupiter' : p?.dexId || 'unknown',
        sources: [j?.id ? 'jupiter' : '', p?.pairAddress ? 'dexscreener' : ''].filter(Boolean),
        image_url: j?.logoURI || null,
        website_url: null,
        twitter_url: null,
        last_updated: new Date(),
        created_at: new Date(),
      };

      results.push(token);
    }

    logger.debug(`Merged ${results.length} unique tokens from ${jupiterTokens.length} Jupiter + ${dexPairs.length} DexScreener sources`);
    return results;
  }

  deduplicateByAddress(tokens: Token[]): Token[] {
    const map = new Map<string, Token>();

    for (const token of tokens) {
      if (!token.token_address) continue;

      const existing = map.get(token.token_address);
      if (!existing) {
        map.set(token.token_address, token);
        continue;
      }

      const merged = this.mergeTokenData(existing, token);
      map.set(token.token_address, merged);
    }

    return Array.from(map.values());
  }

  private mergeTokenData(existing: Token, incoming: Token): Token {
    return {
      ...existing,
      price_sol: existing.price_sol || incoming.price_sol,
      price_usd: existing.price_usd || incoming.price_usd,
      market_cap_sol: existing.market_cap_sol || incoming.market_cap_sol,
      market_cap_usd: existing.market_cap_usd || incoming.market_cap_usd,
      volume_sol: Math.max(
        existing.volume_sol || 0,
        incoming.volume_sol || 0
      ) || null,
      volume_usd: Math.max(
        existing.volume_usd || 0,
        incoming.volume_usd || 0
      ) || null,
      liquidity_sol: Math.max(
        existing.liquidity_sol || 0,
        incoming.liquidity_sol || 0
      ) || null,
      liquidity_usd: Math.max(
        existing.liquidity_usd || 0,
        incoming.liquidity_usd || 0
      ) || null,
      transaction_count: Math.max(
        existing.transaction_count || 0,
        incoming.transaction_count || 0
      ) || null,
      sources: Array.from(new Set([...existing.sources, ...incoming.sources])),
      last_updated: new Date(),
    };
  }

  sortTokens(
    tokens: Token[],
    sortBy: 'volume' | 'priceChange' | 'marketCap' | 'liquidity',
    sortOrder: 'asc' | 'desc'
  ): Token[] {
    const sorted = [...tokens].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortBy) {
        case 'volume':
          aVal = a.volume_usd || 0;
          bVal = b.volume_usd || 0;
          break;
        case 'marketCap':
          aVal = a.market_cap_usd || 0;
          bVal = b.market_cap_usd || 0;
          break;
        case 'liquidity':
          aVal = a.liquidity_usd || 0;
          bVal = b.liquidity_usd || 0;
          break;
        case 'priceChange':
          aVal = a.price_24hr_change || 0;
          bVal = b.price_24hr_change || 0;
          break;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return sorted;
  }

  paginateTokens(tokens: Token[], limit: number, cursor?: string): {
    tokens: Token[];
    nextCursor?: string;
  } {
    let startIndex = 0;

    if (cursor) {
      try {
        startIndex = parseInt(Buffer.from(cursor, 'base64').toString('utf-8'));
      } catch {
        startIndex = 0;
      }
    }

    const endIndex = startIndex + limit;
    const paginatedTokens = tokens.slice(startIndex, endIndex);
    const nextCursor =
      endIndex < tokens.length
        ? Buffer.from(String(endIndex)).toString('base64')
        : undefined;

    return { tokens: paginatedTokens, nextCursor };
  }
}

export const tokenMergingService = new TokenMergingService();
