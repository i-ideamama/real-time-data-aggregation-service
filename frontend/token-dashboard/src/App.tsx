import { useEffect, useState } from 'react';
import getSocket from './socket';
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

  // Load live data from backend which reads Redis
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${import.meta.env.VITE_API_BASE ?? 'http://localhost:5001'}/home/getHomePage`);
        if (!resp.ok) throw new Error(`status ${resp.status}`);
        const data = await resp.json();

        // backend payload shape: { sol_price_usd_hint, total_merged, results }
        const mapped = {
          sol_price_usd: data?.sol_price_usd_hint ?? data?.sol_price_usd ?? 0,
          merged_count: data?.total_merged ?? data?.merged_count ?? (Array.isArray(data?.results) ? data.results.length : 0),
          results: Array.isArray(data?.results) ? data.results : [],
        };

        setTokenData(mapped);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setTokenData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // simple polling every 10s to get fresh cache
    const t = setInterval(loadData, Number(import.meta.env.VITE_POLL_MS ?? 10000));

    // socket realtime updates (ESM import)
    const sock = getSocket();
    sock.on('home:update', (data: any) => {
      const mapped = {
        sol_price_usd: data?.sol_price_usd_hint ?? data?.sol_price_usd ?? 0,
        merged_count: data?.total_merged ?? data?.merged_count ?? (Array.isArray(data?.results) ? data.results.length : 0),
        results: Array.isArray(data?.results) ? data.results : [],
      };
      setTokenData(mapped);
    });

    return () => {
      clearInterval(t);
      if (sock && sock.disconnect) sock.disconnect();
    };
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
