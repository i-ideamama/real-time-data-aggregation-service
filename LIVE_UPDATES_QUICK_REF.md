# ⚡ QUICK REFERENCE - See Live Updates

## 🎯 RIGHT NOW - What to do:

### 1️⃣ Open Frontend
```
http://localhost:3001
```

### 2️⃣ Open Browser Console
Press `F12` → Click "Console" tab

### 3️⃣ Watch for Live Updates
- **Every 30 seconds:** Green notification appears in top-right
- **Console shows:** `🔄 Live update received: {...}`
- **Timestamp updates:** "Last update: [NEW TIME]"

---

## 📊 What You'll See (Immediate)

```
🎯 Top-Right Corner (after 30 seconds):
   ✅ Data updated live!

📍 Below Filters:
   Last update: 3:45:23 PM
   🔴 LIVE (pulsing red badge)

💻 Browser Console:
   🔄 Live update received: {results: Array(18), cached: false}
```

---

## 🔍 Testing Live Updates

### Test 1: Search (Instant)
1. Type "doge" in search box
2. **INSTANT**: Table updates with doge tokens
3. See timestamp change

### Test 2: Sort (Instant)
1. Change "Sort By" to "Market Cap"
2. **INSTANT**: Table re-sorts
3. Different tokens appear on top

### Test 3: Auto-Updates (Every 30 seconds)
1. Keep page open and watch
2. **After 30 seconds**: Green notification pops up
3. **Console shows**: 🔄 Update message
4. **Table changes**: New token data appears

---

## 📺 Console Debug Commands

**Check connection status:**
```javascript
socket.connected  // true = good, false = reconnecting
```

**Count updates received:**
```javascript
let updates = 0;
socket.on('home:update', () => { console.log(++updates); });
```

**See all console messages:**
- Look for lines starting with: `🔄`, `✅`, `❌`

---

## 🚨 If Nothing Updates

### Check 1: Is Backend Running?
```bash
curl http://localhost:8000/api/health
# Should show: "healthy"
```

### Check 2: Check Connection
- Top-right: Should show green dot + "Connected"
- If red = backend is offline

### Check 3: Check Console for Errors
- Press F12 → Console
- Look for red error messages
- Common: "Failed to connect", "API error"

### Check 4: Restart Everything
```bash
# Terminal 1: Kill and restart backend
pkill -f "node dist"
npm start

# Terminal 2: Keep frontend running
# Refresh http://localhost:3001
```

---

## ⚡ Quick Commands

**Restart Backend:**
```bash
cd backend
npm run build
npm start
```

**Check Live Logs:**
```bash
tail -f /tmp/server.log | grep -E "update|emit|Connected"
```

**Test API Directly:**
```bash
curl "http://localhost:8000/api/tokens?search=pepe&limit=3"
```

---

## 📊 Real-Time Data Flow

```
Backend (every 30s)
   ↓ Fetches from DexScreener + Jupiter
   ↓ Emits 'home:update' via Socket.io
   
Frontend (Socket.io listener)
   ↓ Receives 'home:update' event
   ↓ Shows green notification
   ↓ Updates timestamp
   ↓ Refreshes table with new data
   ↓ Highlights new rows briefly
```

---

## 🎬 Live Demo (What You'll See)

**Minute 0-0.5:**
- Page loads
- Table shows tokens
- Status: "Connected" (green)
- Last update: "3:45:23 PM"

**Minute 0.5-1.0:**
- Search for "shib"
- **INSTANT**: Table updates
- Shows shib tokens
- Last update: "3:45:25 PM"

**Minute 1-1.5:**
- Wait without doing anything
- Just watch the page

**Minute 1.5-2.0:**
- **BING!** Green notification: ✅ Data updated live!
- Table refreshes with new data
- Last update: "3:45:53 PM" (changed!)
- Console shows: 🔄 Live update received

**Minute 2-2.5:**
- Notification disappears
- Page remains updated with fresh data

**Minute 2.5-3.0:**
- Wait another 30 seconds
- Another notification arrives
- Cycle repeats!

---

## 🎯 Key Timestamps to Watch

- **Last update time** changes every 30 seconds
- **Notification appears** = Socket.io working
- **Console message** = Data received
- **Table changes** = Frontend updated

---

## 📱 Mobile/Tablet View

Same functionality works on all devices:
- Notification slides in from right
- Timestamp updates normally
- Table responsive and updates smoothly

---

## ✅ Success Indicators

- ✅ Green dot top-right (Connected)
- ✅ Notification appears every 30 seconds
- ✅ Timestamp keeps changing
- ✅ Console shows 🔄 messages
- ✅ Table data looks fresh
- ✅ Searching works instantly

---

## ❌ Failure Indicators

- ❌ Red dot top-right (Disconnected)
- ❌ No notification in 2 minutes
- ❌ Timestamp frozen
- ❌ Red errors in console
- ❌ Table data stale
- ❌ Backend not responding

---

## 🔧 Pro Tips

1. **Keep DevTools Open** - See console messages in real-time
2. **Filter Console** - Type "home:update" to see just updates
3. **Set Breakpoint** - Debug the update function
4. **Speed Up Testing** - Change backend refresh from 30s to 5s
5. **Mobile Testing** - Use your phone's IP: `http://[YOUR-IP]:3001`

---

**Go to http://localhost:3001 and watch for the 🔄 updates! 🚀**

