# Token Dashboard Frontend

A modern, responsive React + TypeScript + Vite frontend for displaying, filtering, sorting, and paginating cryptocurrency token data. Inspired by axiom.trade/discover.

## Features

✅ **Search & Filter**
- Search tokens by name, ticker, or address
- Filter by time period (1h, 24h, 7d)
- Real-time search with case-insensitive matching

✅ **Sorting**
- Sort by Volume
- Sort by Price Change (1h)
- Sort by Market Cap
- Sort by Liquidity
- Sort by Transaction Count
- Toggle ascending/descending order by clicking column headers

✅ **Cursor-Based Pagination**
- Configurable page size (default: 20 tokens per page)
- Next/Previous page navigation
- Shows current page, total pages, and result count
- Pagination state resets when filters change

✅ **Professional UI**
- Dark theme optimized for trading dashboards
- Responsive design (desktop, tablet, mobile)
- Smooth animations and transitions
- Real-time data updates from test.json

## Project Structure

```
src/
├── components/
│   ├── FilterBar.tsx          # Filter and search controls
│   ├── FilterBar.css
│   ├── TokenTable.tsx         # Token list display table
│   ├── TokenTable.css
│   ├── Pagination.tsx         # Pagination controls
│   └── Pagination.css
├── hooks/
│   └── useTokens.ts          # Custom hook for filtering, sorting, pagination logic
├── types/
│   └── index.ts              # TypeScript interfaces for Token, FilterState, etc.
├── App.tsx                   # Main app component
├── App.css                   # Global styles and theme variables
├── main.tsx                  # Entry point
├── index.css                 # Base styles
└── public/
    └── test.json            # Sample token data
```

## Getting Started

### Installation

```bash
cd real-time-data-aggregation-service/frontend/token-dashboard
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

Production build output will be in the `dist/` directory.

## Usage

### Component: FilterBar
Handles search, time period selection, and sorting options.

```tsx
<FilterBar
  searchQuery={filters.searchQuery}
  onSearchChange={setSearchQuery}
  timePeriod={filters.timePeriod}
  onTimePeriodChange={setTimePeriod}
  sortBy={filters.sortBy}
  onSortChange={setSortBy}
/>
```

### Component: TokenTable
Displays tokens in a sortable table with formatted metrics.

```tsx
<TokenTable
  tokens={tokens}
  onSortChange={(metric) => setSortBy(metric)}
  currentSort={filters.sortBy}
/>
```

### Component: Pagination
Handles pagination controls with next/previous navigation.

```tsx
<Pagination
  offset={pagination.offset}
  limit={pagination.limit}
  totalCount={pagination.totalCount}
  hasMore={pagination.hasMore}
  onNextPage={nextPage}
  onPrevPage={prevPage}
/>
```

### Hook: useTokens
Core logic for filtering, sorting, and paginating token data.

```tsx
const {
  tokens,              // Current page of tokens
  filters,             // Current filter state
  pagination,          // Pagination information
  setSearchQuery,      // Update search
  setSortBy,           // Update sort metric
  setTimePeriod,       // Update time period
  nextPage,            // Go to next page
  prevPage,            // Go to previous page
  updateFilters,       // Batch filter updates
} = useTokens(tokenData?.results ?? []);
```

## Data Format

The dashboard expects token data in the following format (from test.json):

```json
{
  "sol_price_usd": 140.47,
  "merged_count": 18,
  "results": [
    {
      "token_address": "string",
      "token_name": "string",
      "token_ticker": "string",
      "price_sol": number,
      "market_cap_sol": number,
      "volume_sol": number,
      "liquidity_sol": number,
      "transaction_count": number,
      "price_1hr_change": number | null,
      "protocol": "string"
    }
  ]
}
```

## Styling

The dashboard uses CSS custom properties (variables) for easy theming:

```css
--bg-primary: #0a0e27;           /* Main background */
--bg-secondary: #111632;         /* Secondary background */
--text-primary: #e4e7eb;         /* Primary text */
--text-secondary: #8b92a9;       /* Secondary text */
--primary-color: #3b82f6;        /* Accent color */
--color-gain: #10b981;           /* Positive change color */
--color-loss: #ef4444;           /* Negative change color */
```

To customize, edit the `:root` selector in `App.css`.

## Features for Future Implementation

- 🔄 **WebSocket Integration**: Real-time data updates instead of static JSON
- 📊 **Advanced Charting**: Price charts and volume indicators
- ⭐ **Favorites**: Save and view favorite tokens
- 🔔 **Alerts**: Price alerts for specific tokens
- 📱 **Mobile Optimizations**: Touch-friendly controls
- 🎨 **Theme Switcher**: Light/dark mode toggle
- 💾 **Local Storage**: Persist user preferences

## Technologies

- **React 19.2.0** - UI library
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 7.2** - Fast build tool
- **CSS3** - Styling with custom properties

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized re-renders using React.useMemo
- Virtual scrolling ready (can be added for large datasets)
- CSS grid for responsive layouts
- Lazy loading of components

## Responsive Breakpoints

- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

## Known Limitations

- Time period filtering (24h, 7d) requires additional backend data
- Currently works with static test.json, needs API integration later
- No persistence layer yet

## Next Steps

1. **Connect to Backend API**: Replace static test.json with API calls
2. **WebSocket Integration**: Add real-time data streaming
3. **Enhanced Filtering**: Add more filter options (protocol, liquidity range)
4. **State Management**: Consider Redux/Zustand for complex state
5. **Testing**: Add unit and integration tests

## Contributing

When adding new features:
1. Create components in `src/components/`
2. Add types to `src/types/index.ts`
3. Create hooks in `src/hooks/` for complex logic
4. Add component styles alongside the component file
5. Test responsive design at all breakpoints

## License

MIT
