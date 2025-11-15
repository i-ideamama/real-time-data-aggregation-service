import type { TimePeriod, SortMetric } from '../types';
import './FilterBar.css';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  sortBy: SortMetric;
  onSortChange: (metric: SortMetric) => void;
}

const FilterBar = ({
  searchQuery,
  onSearchChange,
  timePeriod,
  onTimePeriodChange,
  sortBy,
  onSortChange,
}: FilterBarProps) => {
  const timePeriods: TimePeriod[] = ['1h', '24h', '7d'];
  const sortMetrics: { label: string; value: SortMetric }[] = [
    { label: 'Volume', value: 'volume' },
    { label: 'Price Change', value: 'price_change' },
    { label: 'Market Cap', value: 'market_cap' },
    { label: 'Liquidity', value: 'liquidity' },
    { label: 'Transactions', value: 'transactions' },
  ];

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, ticker, or address..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Time Period</label>
        <div className="button-group">
          {timePeriods.map((period) => (
            <button
              key={period}
              className={`period-btn ${timePeriod === period ? 'active' : ''}`}
              onClick={() => onTimePeriodChange(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Sort By</label>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortMetric)}
        >
          {sortMetrics.map((metric) => (
            <option key={metric.value} value={metric.value}>
              {metric.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
