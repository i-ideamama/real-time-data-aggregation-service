# Quick Start Guide

## Running the Dashboard

### 1. Start Development Server
```bash
cd frontend/token-dashboard
npm install  # Only needed first time
npm run dev
```

Visit `http://localhost:5173/` in your browser.

## Key Features You Can Try Now

### 🔍 Search
- Click the search box at the top
- Search by token name (e.g., "PEPE")
- Search by ticker (e.g., "PEPE")
- Search by contract address

### ⏱️ Time Period Filtering
- Click **1h**, **24h**, or **7d** buttons
- Currently 1h shows only tokens with price change data
- 24h and 7d will show all tokens (future: needs backend data)

### 📊 Sorting
Use the dropdown or click column headers:
- **Volume** ↕ - Sort by trading volume
- **Price Change** ↕ - Sort by 1-hour price change
- **Market Cap** ↕ - Sort by market capitalization
- **Liquidity** ↕ - Sort by available liquidity
- **Transactions** ↕ - Sort by transaction count

### 📄 Pagination
- View **20 tokens per page** by default
- Use **Previous** and **Next** buttons
- See current page and total count

## Data Display

### What the Colors Mean
- 🟢 **Green numbers**: Positive price change
- 🔴 **Red numbers**: Negative price change
- ⚪ **Gray**: No data available (N/A)

### Number Formatting
- Millions: `$1.5M`
- Thousands: `$1.2K`
- Scientific: `1.58e-9` (for very small numbers)

## File Location
Your test.json is loaded from: `public/test.json`

To update with new data, replace the JSON file and refresh the page.

## Customization

### Change Default Page Size
Edit `src/hooks/useTokens.ts`:
```tsx
const [filters, setFilters] = useState<FilterState>({
  // ...
  limit: 20,  // Change this number
});
```

### Change Colors/Theme
Edit `src/App.css`:
```css
:root {
  --primary-color: #3b82f6;  // Change button color
  --color-gain: #10b981;     // Change positive color
  --color-loss: #ef4444;     // Change negative color
}
```

### Change Tokens per Page
Update the `limit` value in `useTokens.ts` hook initialization.

## Troubleshooting

### Port 5173 already in use?
```bash
npm run dev -- --port 3000
```

### Data not loading?
1. Check browser console (F12)
2. Ensure `public/test.json` exists
3. Refresh the page

### Styles not applying?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Run `npm run build` to check for CSS errors

## Next: Connect to Backend

When ready to use real API data:

1. Update `src/App.tsx` - fetch from your backend instead of test.json
2. Add WebSocket integration for real-time updates
3. Extend filtering for 24h and 7d periods

```tsx
// Replace fetch('/test.json') with:
const response = await fetch('http://your-backend/api/tokens');
```

## File Structure at a Glance

```
frontend/token-dashboard/
├── src/
│   ├── components/          # UI components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   ├── App.tsx             # Main component
│   └── App.css             # Global styles
├── public/
│   └── test.json           # Sample data
└── package.json            # Dependencies
```

That's it! You now have a fully functional token discovery dashboard. 🚀
