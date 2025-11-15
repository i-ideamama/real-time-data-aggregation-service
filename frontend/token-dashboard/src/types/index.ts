export interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number | null;
  protocol: string;
}

export interface TokenData {
  sol_price_usd: number;
  merged_count: number;
  results: Token[];
}

export type TimePeriod = '1h' | '24h' | '7d';
export type SortMetric = 'volume' | 'price_change' | 'market_cap' | 'liquidity' | 'transactions';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  timePeriod: TimePeriod;
  sortBy: SortMetric;
  sortOrder: SortOrder;
  searchQuery: string;
  limit: number;
}

export interface PaginationState {
  offset: number;
  limit: number;
  hasMore: boolean;
  nextCursor: number | null;
}
