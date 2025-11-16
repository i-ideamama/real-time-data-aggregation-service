# Real-Time Token Aggregator Frontend

A modern, responsive web dashboard for viewing real-time cryptocurrency token data with Socket.io integration for live updates.

## Features

✨ **Live Features:**
- Real-time token data aggregation from multiple DEX APIs
- Socket.io WebSocket connection status indicator
- Dynamic filtering and sorting by volume, market cap, liquidity, and price change
- Cursor-based pagination for efficient data loading
- Search functionality for finding specific tokens
- Responsive design that works on desktop, tablet, and mobile
- Dark mode UI with modern gradient design
- Live connection status indicator with pulse animation

📊 **Data Columns:**
- **Pair Info**: Token name, ticker, and address
- **Market Cap**: USD market capitalization (formatted with B, M, K)
- **Liquidity**: Available liquidity in USD
- **Volume**: 24-hour trading volume
- **Txns**: Transaction count
- **Price Change (1h)**: 1-hour price change percentage with color-coded arrows
- **Protocol**: DEX protocol (Raydium, Uniswap, PumpFun, etc.)
- **Action**: View token on DexScreener

## Quick Start

### 1. Serve the Frontend

From the frontend directory:

```bash
# Using Python 3
python3 -m http.server 3001

# OR using Node.js (if you have http-server installed)
npx http-server -p 3001

# OR using any other HTTP server
```

Then open: **http://localhost:3001**

### 2. Ensure Backend is Running

Make sure your Node.js backend is running on port 8000:

```bash
cd backend
npm start
```

### 3. Use the Dashboard

- **Search**: Enter token name (pepe, doge, shib, etc.)
- **Sort**: Choose sorting criteria from the dropdown
- **Filter**: Select ascending/descending order
- **Limit**: Choose how many results to display per page
- **Navigate**: Use Previous/Next buttons to paginate through results
- **View**: Click "View" button to open token on DexScreener

## Architecture

### Frontend Structure

```
index.html                 # Single HTML file with embedded CSS and JavaScript
├── HTML Structure
├── CSS Styling (embedded)
└── JavaScript Logic (embedded)
```

### Key Components

**Header Section:**
- Application title and description
- Search input field
- Live connection status indicator

**Filter Controls:**
- Sort by selector (volume, marketCap, liquidity, priceChange)
- Order selector (ascending/descending)
- Limit selector (10, 20, 50, 100 results)

**Data Table:**
- Responsive table with real-time data
- Color-coded price changes (green for positive, red for negative)
- Protocol badges with custom styling
- Loading states and error handling
- Empty state when no results found

**Pagination:**
- Previous/Next buttons
- Page information display
- Cursor-based pagination support

## JavaScript Features

### State Management
```javascript
currentState = {
  tokens: [],           // Current page tokens
  cursor: null,         // Cursor for pagination
  nextCursor: null,     // Next page cursor
  search: 'pepe',       // Search query
  sortBy: 'volume',     // Sort field
  sortOrder: 'desc',    // Sort order
  limit: 20,            // Results per page
  page: 1,              // Current page number
  cached: false         // Cache status
}
```

### API Integration
- Fetches from `/api/tokens` endpoint
- Supports query parameters: `search`, `sortBy`, `sortOrder`, `limit`, `cursor`
- Automatic error handling with user-friendly messages
- Loading states and empty state handling

### Socket.io Integration
- Real-time connection status monitoring
- Automatic reconnection with exponential backoff
- Event listeners for token updates (ready for real-time features)
- Visual connection indicator (green when connected, red when disconnected)

## Styling Features

### Color Scheme
- **Background**: Dark gradient (#0f0f23 to #1a1a3f)
- **Primary Color**: Purple (#667eea, #764ba2)
- **Text**: Light gray (#e0e0e0)
- **Success**: Green (#4caf50)
- **Danger**: Red (#f44336)

### Responsive Breakpoints
- **Desktop**: Full table with all columns visible
- **Tablet (1024px)**: Compact padding and reduced font sizes
- **Mobile (768px)**: Single column layout, horizontal scroll for table

### Interactive Elements
- Hover effects on rows with subtle background change
- Smooth transitions on all interactive elements
- Animated pulse effect on connection status indicator
- Loading spinner animation
- Button hover effects with scale transform

## Data Display

### Number Formatting
- Values >= 1B: Formatted with "B" suffix (e.g., "1.23B")
- Values >= 1M: Formatted with "M" suffix (e.g., "1.23M")
- Values >= 1K: Formatted with "K" suffix (e.g., "1.23K")
- Values < 0.0001: Scientific notation (e.g., "1.23e-7")
- Price changes: Percentage format with directional arrow

### Conditional Styling
- **Green**: Positive price changes and positive percentages
- **Red**: Negative price changes and negative percentages
- **Gray**: N/A or unavailable data

## Error Handling

- Network error messages displayed at top of page
- Auto-dismiss after 5 seconds
- Graceful fallback for missing data
- Connection status updates in real-time
- User-friendly error messages

## Performance Optimizations

1. **Pagination**: Cursor-based pagination for efficient data loading
2. **Search Debouncing**: Immediate search response with server-side filtering
3. **Caching**: Server-side caching with frontend awareness
4. **Compression**: Gzip compression on backend responses
5. **Rate Limiting**: Protected against abuse with rate limiting

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Configuration

Edit the API and Socket URL constants in the JavaScript section:

```javascript
const API_URL = 'http://localhost:8000';
const SOCKET_URL = 'http://localhost:8000';
```

For production, update these to your deployed backend URL.

## Troubleshooting

### Connection Issues
- Ensure backend is running on port 8000
- Check browser console for error messages
- Verify CORS is enabled on backend
- Check firewall settings

### No Data Displayed
- Check network tab in browser DevTools
- Verify API endpoint `/api/tokens` is accessible
- Ensure DexScreener and Jupiter APIs are responding
- Check backend logs for errors

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check for CSS media query conflicts
- Verify all CDN resources are loading (Socket.io library)

## Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Advanced filtering (by protocol, liquidity range, etc.)
- [ ] Token comparison view
- [ ] Price charts and candlestick data
- [ ] Watchlist functionality
- [ ] Export to CSV
- [ ] Mobile app version
- [ ] Real-time price alerts
- [ ] WebSocket token update subscriptions

## Security Notes

- Frontend makes direct API calls - ensure backend CORS is properly configured
- No sensitive data is stored in local storage
- All external links open in new tabs to prevent navigation away
- Rate limiting protects against abuse

---

**Created**: November 16, 2025  
**Version**: 1.0.0  
**License**: MIT
