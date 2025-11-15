import type { Token } from '../types';
import './TokenTable.css';

interface TokenTableProps {
  tokens: Token[];
  onSortChange: (metric: string) => void;
  currentSort: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  return num.toExponential(2);
};

const formatPercent = (num: number | null): string => {
  if (num === null) return 'N/A';
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

const TokenTable = ({ tokens, onSortChange, currentSort }: TokenTableProps) => {
  const isSortActive = (metric: string) => currentSort === metric;

  return (
    <div className="token-table-container">
      <table className="token-table">
        <thead>
          <tr>
            <th className="col-rank">#</th>
            <th className="col-name">Token</th>
            <th className="col-protocol">Protocol</th>
            <th 
              className={`col-marketcap sortable ${isSortActive('market_cap') ? 'active' : ''}`}
              onClick={() => onSortChange('market_cap')}
            >
              Market Cap ↕
            </th>
            <th 
              className={`col-liquidity sortable ${isSortActive('liquidity') ? 'active' : ''}`}
              onClick={() => onSortChange('liquidity')}
            >
              Liquidity ↕
            </th>
            <th 
              className={`col-volume sortable ${isSortActive('volume') ? 'active' : ''}`}
              onClick={() => onSortChange('volume')}
            >
              Volume ↕
            </th>
            <th 
              className={`col-change sortable ${isSortActive('price_change') ? 'active' : ''}`}
              onClick={() => onSortChange('price_change')}
            >
              1h Change ↕
            </th>
            <th 
              className={`col-txns sortable ${isSortActive('transactions') ? 'active' : ''}`}
              onClick={() => onSortChange('transactions')}
            >
              Txns ↕
            </th>
            <th className="col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {tokens.length === 0 ? (
            <tr className="empty-row">
              <td colSpan={8}>No tokens found</td>
            </tr>
          ) : (
            tokens.map((token, index) => (
              <tr key={token.token_address} className="token-row">
                <td className="col-rank">{index + 1}</td>
                <td className="col-name">
                  <div className="token-info">
                    <div className="token-name">{token.token_name}</div>
                    <div className="token-ticker">{token.token_ticker}</div>
                  </div>
                </td>
                <td className="col-protocol">
                  <span className="protocol-badge">{token.protocol}</span>
                </td>
                <td className="col-marketcap">{formatNumber(token.market_cap_sol)}</td>
                <td className="col-liquidity">{formatNumber(token.liquidity_sol)}</td>
                <td className="col-volume">{formatNumber(token.volume_sol)}</td>
                <td className={`col-change ${token.price_1hr_change ? (token.price_1hr_change > 0 ? 'positive' : 'negative') : 'neutral'}`}>
                  {formatPercent(token.price_1hr_change)}
                </td>
                <td className="col-txns">{token.transaction_count}</td>
                <td className="col-action">
                  <button className="buy-btn">Buy</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTable;
