import { useEffect, useState } from 'react';
import type { TokenData } from './types';
import { useTokens } from './hooks/useTokens';
import FilterBar from './components/FilterBar';
import TokenTable from './components/TokenTable';
import Pagination from './components/Pagination';
import './App.css';

function App() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load test data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/test.json');
        if (!response.ok) {
          throw new Error('Failed to load token data');
        }
        const data = await response.json();
        setTokenData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setTokenData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const {
    tokens,
    filters,
    pagination,
    setSearchQuery,
    setSortBy,
    setTimePeriod,
    nextPage,
    prevPage,
  } = useTokens(tokenData?.results ?? []);

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Token Dashboard</h1>
          <p className="app-subtitle">
            SOL Price: ${tokenData?.sol_price_usd.toFixed(2)} • Total Tokens: {tokenData?.merged_count}
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard-container">
          <FilterBar
            searchQuery={filters.searchQuery}
            onSearchChange={setSearchQuery}
            timePeriod={filters.timePeriod}
            onTimePeriodChange={setTimePeriod}
            sortBy={filters.sortBy}
            onSortChange={setSortBy}
          />

          <TokenTable
            tokens={tokens}
            onSortChange={(metric) => setSortBy(metric as any)}
            currentSort={filters.sortBy}
          />

          <Pagination
            offset={pagination.offset}
            limit={pagination.limit}
            totalCount={pagination.totalCount}
            hasMore={pagination.hasMore}
            onNextPage={nextPage}
            onPrevPage={prevPage}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
