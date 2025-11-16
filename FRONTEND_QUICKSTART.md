# Quick Start Guide - Frontend

## 🚀 Get Started in 2 Minutes

### Option 1: Using Python (Recommended)

```bash
# Navigate to frontend directory
cd /home/advaith/Docs/Code/real-time-aggregator/frontend

# Start HTTP server
python3 -m http.server 3001

# Open browser
# http://localhost:3001
```

### Option 2: Using Node.js

```bash
# Install http-server globally (if not already)
npm install -g http-server

# Navigate to frontend directory
cd /home/advaith/Docs/Code/real-time-aggregator/frontend

# Start server
http-server -p 3001

# Open browser
# http://localhost:3001
```

### Option 3: Using Docker

```bash
# From project root
docker-compose up

# Access frontend at http://localhost:3001
```

---

## 📋 Requirements

Before starting the frontend, ensure:

- ✅ Backend is running on `http://localhost:8000`
- ✅ Redis is running (or service works without it)
- ✅ You have a modern web browser

### Check Backend Status

```bash
# Test API health
curl http://localhost:8000/api/health

# Should return:
# {"success":true,"status":"healthy",...}
```

---

## 🎯 Using the Dashboard

### Search for Tokens

1. Enter token name in the search box (e.g., "pepe", "doge", "shib")
2. Results update automatically as you type
3. Default search is "pepe"

### Sort and Filter

**Sort By:**
- Volume (default)
- Market Cap
- Liquidity
- Price Change

**Order:**
- Descending (default)
- Ascending

**Limit:**
- 10, 20 (default), 50, or 100 results per page

### Navigate Results

- **Previous**: Go to previous page (disabled on page 1)
- **Next**: Go to next page (disabled when no more results)
- **View**: Click "View" button to open token on DexScreener.com

---

## 📊 Understanding the Display

### Pair Info Column
- **Token Name**: Full name of the token
- **Ticker**: Token symbol
- **Address**: First 8 characters of token address

### Market Cap
- Total market capitalization in USD
- Formatted with B (billion), M (million), K (thousand)
- Example: $2.07B

### Liquidity
- Available liquidity for trading
- Higher liquidity = better slippage
- Example: $35.99M

### Volume
- 24-hour trading volume
- Shows trading activity level
- Example: $980K

### Txns
- Total transaction count
- Shows popularity/activity

### Price Change (1h)
- **Green ↑**: Price increased in last hour
- **Red ↓**: Price decreased in last hour
- **N/A**: Data not available
- Shows percentage change

### Protocol
- DEX protocol where token trades
- Examples: Raydium, Uniswap, PumpFun, Serum

---

## 🔄 Real-Time Updates

### Connection Status
- **Green dot + "Connected"**: Live connection established
- **Red dot + "Disconnected"**: Connection lost (will auto-reconnect)
- Socket.io automatically reconnects if connection drops

### Live Data
- Background jobs refresh token data every 30 seconds
- Table updates with fresh data
- Cache hits show in server logs

---

## ⚠️ Troubleshooting

### "Connection Disconnected"
- Check if backend is running: `curl http://localhost:8000/api/health`
- Verify no firewall blocking port 8000
- Check browser console for errors (F12)

### No Tokens Displayed
- Try different search term
- Check browser console for error messages
- Verify backend API: `curl "http://localhost:8000/api/tokens?search=pepe"`

### Slow Loading
- Check network speed
- Verify DexScreener API is responsive
- Try reducing limit (10 instead of 100 results)
- Check backend logs for errors

### Browser Issues
- Clear cache (Ctrl+Shift+Delete)
- Try different browser
- Disable extensions (especially ad blockers)

---

## 🎨 Frontend Features

### Dark Theme
- Easy on the eyes for extended use
- Purple and blue accent colors
- Consistent with DexScreener design

### Responsive Design
- Works on desktop, tablet, and mobile
- Touch-friendly buttons
- Optimized table scrolling

### Performance
- Cursor-based pagination (efficient)
- Server-side caching (30s TTL)
- Gzip compression on responses
- Rate limiting to prevent abuse

---

## 📱 Mobile Access

The frontend works on mobile browsers:

1. Start the server as usual
2. From your phone, open: `http://<your-computer-ip>:3001`
   - Find IP: `hostname -I` (Linux/Mac) or `ipconfig` (Windows)
3. Example: `http://192.168.1.100:3001`

### Mobile Tips
- Use portrait orientation for best view
- Swipe left/right to scroll table
- Tap "View" to open DexScreener on token

---

## 🔗 API Endpoints Used

The frontend automatically calls these endpoints:

```
GET /api/tokens
  Query params: search, sortBy, sortOrder, limit, cursor
  Returns: paginated token list

GET /api/health
  Returns: server health status

GET /api/metrics
  Returns: system metrics and cache stats

Socket.io Connection
  URL: ws://localhost:8000/socket.io
  Events: tokensUpdated, connect, disconnect
```

---

## 🚀 Production Deployment

### Update Backend URL

Edit `index.html` JavaScript section (around line 580):

```javascript
// Change from:
const API_URL = 'http://localhost:8000';
const SOCKET_URL = 'http://localhost:8000';

// To your production domain:
const API_URL = 'https://yourdomain.com';
const SOCKET_URL = 'https://yourdomain.com';
```

### Deploy Frontend

1. Copy `frontend/index.html` to your web server
2. Ensure backend is running on the same domain (or configure CORS)
3. Update API URLs in the HTML file
4. Access at `https://yourdomain.com`

---

## 📚 File Structure

```
frontend/
└── index.html           # Single file with CSS + JavaScript
                        # ~850 lines
                        # All styles and logic included
```

**No build step required!** Just serve the HTML file.

---

## 🔧 Customization

### Change Default Search

In `index.html`, find the state initialization:

```javascript
let currentState = {
  tokens: [],
  search: 'pepe',  // ← Change this
  // ...
};
```

### Change Styling

All CSS is in the `<style>` tag in `index.html`:

```css
/* Example: Change primary color */
.header-left h1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* ↑ Modify these hex values */
}
```

### Add More Columns

Locate the table column headers in the HTML and add new `<th>` tags:

```html
<tr>
  <th>Pair Info</th>
  <!-- Add new column here -->
  <th>New Column</th>
</tr>
```

Then update the token row rendering in JavaScript.

---

## 📞 Support

### Check Logs

**Backend logs:**
```bash
tail -f /tmp/server.log
```

**Browser console:**
- Press F12
- Go to Console tab
- Watch for error messages

### Enable Debug Mode

In browser console:
```javascript
// See all API calls
localStorage.debug = 'socket.io*';
location.reload();
```

---

## 🎉 You're Ready!

The frontend is fully functional and ready to display real-time token data!

**Enjoy trading insights! 📈**

---

Version: 1.0.0  
Last Updated: November 16, 2025
