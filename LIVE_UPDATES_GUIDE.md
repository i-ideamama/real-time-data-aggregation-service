# 🔄 Live Changes Guide - Real-Time Updates

## How to See Live Changes Fast

Your frontend is now set up to receive real-time updates from the backend via Socket.io. Here's what's happening:

### What You'll See

1. **Update Notification** (Top-right corner)
   - Green notification appears: "✅ Data updated live!"
   - Appears for 2 seconds when new data arrives

2. **Last Updated Timestamp**
   - Shows exact time of last update (e.g., "Last update: 3:45:23 PM")
   - Updates every time fresh data arrives

3. **Live Indicator Badge**
   - Red pulsing "LIVE" badge appears during active updates
   - Shows the system is receiving real-time data

4. **Data Table**
   - Table updates instantly with new token data
   - No page refresh needed
   - Rows highlight briefly in green when updated

---

## How It Works

### Backend Flow
```
Background Job (every 30s)
    ↓
Fetches fresh token data from DexScreener + Jupiter
    ↓
Emits 'home:update' via Socket.io
    ↓
Frontend receives update
```

### Frontend Flow
```
Socket.io receives 'home:update' event
    ↓
Shows notification "✅ Data updated live!"
    ↓
Updates last refresh timestamp
    ↓
Re-renders data table with new tokens
    ↓
Highlights changed rows briefly
```

---

## Two Ways to See Live Updates

### Method 1: Watch via Socket.io (FASTEST - Real-time)

**What it does:**
- Backend job runs every 30 seconds
- Fetches fresh data from DexScreener + Jupiter
- Sends update via Socket.io to all connected browsers
- Your frontend receives and displays instantly

**How to trigger it:**
1. Open browser DevTools (F12 → Console tab)
2. You'll see messages like:
   ```
   🔄 Live update received: {results: [...], cached: false, ...}
   ```
3. Keep the console open while watching updates
4. Every 30 seconds, a new update should arrive

**Best for:** Real-time monitoring and seeing data changes

---

### Method 2: Manual Refresh via Search/Filters (IMMEDIATE)

**What it does:**
- Change search term → fetches new data instantly
- Change sort order → re-sorts and displays immediately
- Change limit → loads different number of tokens
- Change sort field → updates sorting

**How to trigger it:**
1. Type in search box (e.g., search for "doge")
2. Change sorting dropdown
3. Change limit dropdown
4. Each action triggers immediate API call and display update

**Best for:** Exploring specific tokens and testing filters

---

## Console Debugging (See Everything)

Open Browser Console (F12 → Console tab) to see:

```javascript
// Connection events
Connected to server ✅
Disconnected from server ❌

// Data updates
🔄 Live update received: {...}

// API calls
Fetch error: ...
Cache hit for tokens list pepe

// Metrics
Total API calls: 25
Page 1, showing 20 tokens
```

---

## Verify It's Working

### Check 1: Connection Status
- Look at top-right corner
- Should show green dot with "Connected"
- If red = connection lost (will auto-reconnect)

### Check 2: Last Update Time
- Below filters, you'll see: "Last update: [time]"
- Should update every 30 seconds
- If stuck = backend not sending updates

### Check 3: Browser Console
1. Press F12
2. Go to Console tab
3. Search for "🔄" 
4. Should see messages like: "🔄 Live update received"
5. If no messages = Socket.io not receiving

---

## Real-Time Data Timestamps

The frontend displays:
- **Last update**: When data was last refreshed (updates every 30s)
- **Created at**: When token data was first indexed
- **Last updated**: When token info was last updated in blockchain

You can see all these in the detailed view by clicking "View" button.

---

## Triggering Updates Manually (For Testing)

### Via Backend API
```bash
# Fetch latest tokens (triggers update internally)
curl "http://localhost:8000/api/tokens?search=pepe"

# Check metrics (shows update counts)
curl "http://localhost:8000/api/metrics"
```

### Via Frontend
1. Search for different tokens
2. Change sort options
3. Clear search box and type again

---

## Performance Tips

### To See Updates Faster:
1. **Reduce browser tab count** - Focus on one browser tab
2. **Check network speed** - Make sure connection is stable
3. **Watch console** - See when updates arrive
4. **Close dev tools** - Sometimes slows browser
5. **Increase browser zoom** - Makes notification easier to spot

### If Updates Are Slow:
1. Check backend logs: `tail -f /tmp/server.log | grep -i update`
2. Check for "Cache hit" messages (means data reused)
3. Check external API responsiveness
4. Verify Redis is running: `redis-cli ping`

---

## Example Workflow

**1. Open Dashboard**
```
http://localhost:3001
```

**2. Open Console (F12)**
```
Console tab ready
Connection Status: ✅ Connected
Last update: 3:45:23 PM
```

**3. Wait 30 seconds**
```
✅ Data updated live! (notification)
Last update: 3:45:53 PM (timestamp updated)
🔄 Live update received (in console)
Table refreshes with new data
```

**4. Try a Search**
```
Type "doge" in search box
Table instantly updates
Shows doge tokens
Last update: 3:45:55 PM
```

---

## Monitoring Real-Time Updates

### Console Spy Method
```javascript
// Paste in console to track all updates
let updateCount = 0;
socket.on('home:update', (data) => {
    updateCount++;
    console.log(`📊 Update #${updateCount}:`, data.results.length, 'tokens');
});
```

### Visual Feedback
- **Green notification** = Live update received
- **Timestamp update** = Data refreshed
- **Row highlighting** = New data loaded
- **Connection status** = System health

---

## Testing Real-Time Functionality

### Test 1: Verify Socket.io Connection
```
Expected: ✅ Connected (green dot, top right)
Actual: Check your status indicator
```

### Test 2: Monitor Updates
```
Expected: Every 30 seconds, notification appears
Actual: Watch for "✅ Data updated live!" message
```

### Test 3: Check Data Freshness
```
Expected: "Last update" timestamp changes every 30s
Actual: Look below filter controls
```

### Test 4: Search Updates Data Instantly
```
Expected: Change search term → instant results
Actual: Type in search box → verify table updates
```

---

## Troubleshooting Live Updates

| Issue | Cause | Fix |
|-------|-------|-----|
| No notification | Socket.io not connected | Check connection status, restart backend |
| Timestamp not updating | Backend job not running | Check `npm start` output for "Scheduled token refresh" |
| Table not changing | Data not fetching | Try manual search, check backend logs |
| Console showing errors | API connection issue | Verify backend is running on port 8000 |

---

## Next Steps

1. **Watch the live updates flow** - Monitor for 2-3 minutes
2. **Try different searches** - See instant updates
3. **Check console messages** - Understand the flow
4. **Explore the data** - Click View buttons to see full token info
5. **Deploy to production** - When ready, follow DEPLOYMENT.md

---

**Your system is now set up for real-time updates! 🚀**

Updates arrive every 30 seconds automatically from the backend.
Try searching for different tokens to see instant updates.

Happy monitoring!
