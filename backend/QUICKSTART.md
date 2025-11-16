# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 20+
- Redis 7+ running locally

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Start Redis (if not running)
```bash
# macOS with Homebrew
brew services start redis

# Or with Docker
docker run -p 6379:6379 redis:7-alpine

# Or using docker-compose
docker-compose up redis
```

### Step 3: Run Development Server
```bash
npm run dev
```

Server starts at `http://localhost:8000`

### Step 4: Test the API

#### Get Pepe Tokens
```bash
curl "http://localhost:8000/api/tokens?search=pepe&limit=5"
```

#### Check Health
```bash
curl "http://localhost:8000/api/health"
```

#### Get Metrics
```bash
curl "http://localhost:8000/api/metrics"
```

#### WebSocket Connection
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:8000');

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('token:update', (token) => {
  console.log('Token updated:', token.token_ticker);
});
```

## Available Commands

```bash
npm run dev              # Development mode with hot reload
npm run build           # Build for production
npm start               # Start production server
npm test                # Run tests
npm run test:watch      # Watch mode for tests
npm run lint            # Check code quality
npm run format          # Format code with Prettier
npm run typecheck       # Type checking only
```

## Environment Setup

Create `.env` file (copy from `.env.example`):
```env
NODE_ENV=development
PORT=3000
REDIS_URL=redis://localhost:6379
CACHE_TTL=30
LOG_LEVEL=debug
```

## Docker Quick Start

```bash
# Start both app and Redis
docker-compose up

# App runs at http://localhost:3000
```

## API Endpoints Cheat Sheet

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tokens` | GET | List tokens with filters |
| `/api/tokens/:address` | GET | Get single token |
| `/api/health` | GET | Health check |
| `/api/metrics` | GET | System metrics |
| `/home/page` | GET | Home page data |

## Query Examples

```bash
# Top volume tokens
curl "http://localhost:8000/api/tokens?search=pepe&sortBy=volume&limit=10"

# Trending by price change
curl "http://localhost:8000/api/tokens?search=doge&sortBy=priceChange&limit=10"

# Top market cap
curl "http://localhost:8000/api/tokens?search=shib&sortBy=marketCap&limit=10"

# Pagination
curl "http://localhost:8000/api/tokens?search=bonk&limit=5&cursor=NQ=="
```

## Postman Collection

Import `postman-collection.json` into Postman for pre-built requests.

## Debugging

### View Logs
```bash
# Development logs show debug info
npm run dev

# Check specific logs
tail -f logs/error.log
tail -f logs/combined.log
```

### Check Redis
```bash
redis-cli
> ping
PONG
> keys *
> get token:pepe123
```

### Monitor WebSocket
Open browser DevTools → Network → WS
Look for Socket.io connection

## Common Issues

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping
# If "PONG", Redis is good

# Verify REDIS_URL in .env
# Default: redis://localhost:6379
```

### Port 3000 Already in Use
```bash
# Change PORT in .env
PORT=3001
```

### Build Errors
```bash
# Clear and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Next Steps

1. **Explore the API**: Use Postman collection or curl
2. **Connect WebSocket**: Test real-time updates
3. **Review Code**: Check `src/` structure
4. **Run Tests**: `npm test`
5. **Deploy**: Follow DEPLOYMENT.md

## Need Help?

- Check README.md for detailed documentation
- Review IMPLEMENTATION_SUMMARY.md for architecture
- See DEPLOYMENT.md for production setup
- Check error logs in `logs/` directory

## Development Tips

- Hot reload: Changes auto-compile with `npm run dev`
- Linting: Run `npm run lint` before committing
- Formatting: Run `npm run format` to auto-format
- Type safety: TS strict mode catches errors early
- Testing: Write tests in `tests/` directory
