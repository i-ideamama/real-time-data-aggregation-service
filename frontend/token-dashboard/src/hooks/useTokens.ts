import { useState, useMemo } from 'react';
import type { Token, FilterState, PaginationState } from '../types';

export const useTokens = (tokens: Token[]) => {
  const [filters, setFilters] = useState<FilterState>({
    timePeriod: '1h',
    sortBy: 'volume',
    sortOrder: 'desc',
    searchQuery: '',
    limit: 20,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    offset: 0,
    limit: 20,
    hasMore: true,
    nextCursor: null,
  });

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const searchLower = filters.searchQuery.toLowerCase();
      return (
        token.token_name.toLowerCase().includes(searchLower) ||
        token.token_ticker.toLowerCase().includes(searchLower) ||
        token.token_address.toLowerCase().includes(searchLower)
      );
    });
  }, [tokens, filters.searchQuery]);

  // Apply time period filter
  const timeFilteredTokens = useMemo(() => {
    return filteredTokens.filter((token) => {
      if (filters.timePeriod === '1h') {
        // Filter tokens with price change in last 1 hour
        return token.price_1hr_change !== null;
      }
      // For 24h and 7d we'll need more data from backend, for now include all
      return true;
    });
  }, [filteredTokens, filters.timePeriod]);

  // Sort tokens
  const sortedTokens = useMemo(() => {
    const sorted = [...timeFilteredTokens];
    sorted.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (filters.sortBy) {
        case 'volume':
          aValue = a.volume_sol;
          bValue = b.volume_sol;
          break;
        case 'price_change':
          aValue = a.price_1hr_change ?? 0;
          bValue = b.price_1hr_change ?? 0;
          break;
        case 'market_cap':
          aValue = a.market_cap_sol;
          bValue = b.market_cap_sol;
          break;
        case 'liquidity':
          aValue = a.liquidity_sol;
          bValue = b.liquidity_sol;
          break;
        case 'transactions':
          aValue = a.transaction_count;
          bValue = b.transaction_count;
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [timeFilteredTokens, filters.sortBy, filters.sortOrder]);

  // Apply pagination
  const paginatedTokens = useMemo(() => {
    const start = pagination.offset;
    const end = start + pagination.limit;
    const paged = sortedTokens.slice(start, end);
    
    // Update pagination state
    const hasMore = end < sortedTokens.length;
    const nextCursor = hasMore ? end : null;

    return {
      tokens: paged,
      hasMore,
      nextCursor,
      totalCount: sortedTokens.length,
    };
  }, [sortedTokens, pagination.offset, pagination.limit]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Reset pagination when filters change
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const setSearchQuery = (query: string) => {
    updateFilters({ searchQuery: query });
  };

  const setSortBy = (metric: FilterState['sortBy']) => {
    updateFilters({ sortBy: metric });
  };

  const setTimePeriod = (period: FilterState['timePeriod']) => {
    updateFilters({ timePeriod: period });
  };

  const nextPage = () => {
    if (paginatedTokens.hasMore) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
        nextCursor: paginatedTokens.nextCursor,
      }));
    }
  };

  const prevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const goToPage = (offset: number) => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, offset),
    }));
  };

  return {
    tokens: paginatedTokens.tokens,
    filters,
    pagination: {
      ...paginatedTokens,
      offset: pagination.offset,
      limit: pagination.limit,
    },
    setSearchQuery,
    setSortBy,
    setTimePeriod,
    nextPage,
    prevPage,
    goToPage,
    updateFilters,
  };
};
