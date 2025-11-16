export interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string | null;
  price_sol: number | null;
  price_usd: number | null;
  market_cap_sol: number | null;
  market_cap_usd: number | null;
  volume_sol: number | null;
  volume_usd: number | null;
  volume_24h_change: number | null;
  liquidity_sol: number | null;
  liquidity_usd: number | null;
  transaction_count: number | null;
  transaction_count_24h: number | null;
  price_1hr_change: number | null;
  price_24hr_change: number | null;
  price_7d_change: number | null;
  holders_count: number | null;
  protocol: string | null;
  sources: string[];
  image_url: string | null;
  website_url: string | null;
  twitter_url: string | null;
  last_updated: Date;
  created_at: Date;
}

export interface TokenResponse extends Token {
  fromCache?: boolean;
}

export interface TokensListResponse {
  sol_price_usd: number | null;
  merged_count: number;
  results: Token[];
  cached: boolean;
  timestamp: Date;
}

export interface PaginationMeta {
  limit: number;
  cursor?: string;
  total?: number;
  hasMore?: boolean;
}

export interface DexScreenerPair {
  pairAddress: string;
  chainId: string;
  dexId: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h1: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h1: string;
    h24: string;
  };
  priceChange: {
    h1: string;
    h24: string;
  };
  liquidity?: {
    usd: string;
  };
  marketCap?: string;
  fdv?: string;
}

export interface JupiterToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  price?: number;
  price_usd?: number;
  price_sol?: number;
  price_native?: string;
  priceUsd?: string;
  priceSol?: string;
  mcap?: number;
  mcapUsd?: number;
  liquidity?: number;
  liquidityUsd?: number;
  volume?: number;
  volumeUsd?: number;
  stats1h?: {
    priceChange: number;
  };
  stats24h?: {
    priceChange: number;
    buyVolume: number;
    sellVolume: number;
    numTraders: number;
  };
  holderCount?: number;
}

export interface APIResponse<T> {
  data: T;
  cached: boolean;
  timestamp: Date;
  source: string;
}
