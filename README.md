# Real-Time Cryptocurrency Data Aggregation Service

Production-ready Node.js service that aggregates real-time cryptocurrency data from multiple DEX APIs with efficient caching, WebSocket updates, and smart data merging.

## Features

- **Multi-Source Data Aggregation**: Fetches from DexScreener and Jupiter APIs
- **Smart Token Deduplication**: Merges same tokens using token address as unique identifier
- **Intelligent Metrics**: Uses highest liquidity source, averages prices, sums volumes
- **Redis Caching**: 30-second TTL with configurable invalidation strategy
- **Real-Time WebSocket Updates**: Socket.io for live token updates and filtering
- **Background Jobs**: Bull queue for periodic data fetching every 30 seconds
- **Rate Limiting**: Exponential backoff with 300 req/min for DexScreener
- **Comprehensive REST API**: Full token search, filtering, pagination, and metrics
- **TypeScript & Strict Mode**: Full type safety and strict checks
- **Production-Ready**: Graceful shutdown, error handling, structured logging

- PUBLIC URL : https://agg-back.onrender.com/

## Tech Stack

- **Runtime**: Node.js 20 with TypeScript (strict mode)
- **Web Framework**: Express.js
- **WebSocket**: Socket.io
- **Cache**: Redis with ioredis
- **HTTP Client**: Axios with exponential backoff retry logic
- **Task Scheduling**: Bull queue
- **Testing**: Jest with supertest
- **Logging**: Winston
- **Validation**: Zod schemas

## Quick Start

### Prerequisites
- Node.js 20+
- Redis 7+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=3000

REDIS_URL=redis://localhost:6379
REDIS_DB=0
CACHE_TTL=30

DEXSCREENER_BASE_URL=https://api.dexscreener.com
JUPITER_BASE_URL=https://lite-api.jup.ag
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3

API_TIMEOUT=10000
MAX_RETRIES=4
BASE_RETRY_DELAY=200
MAX_RETRY_DELAY=10000

RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=300

JOB_FETCH_INTERVAL=30000
JOB_RETRY_ATTEMPTS=3

LOG_LEVEL=debug
CORS_ORIGIN=*
```

### Development

```bash
npm run dev
```

Server runs on http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test
npm run test:coverage
npm run test:watch
```

## Docker Setup

### Run with Docker Compose

```bash
docker-compose up
```

This starts both Redis and the application server.

### Build Docker Image

```bash
docker build -t crypto-aggregator .
```

### Run Docker Container

```bash
docker run -p 3000:3000 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  crypto-aggregator
```

## API Endpoints

### Get Tokens
```bash
GET /api/tokens?search=pepe&sortBy=volume&sortOrder=desc&limit=30
```

**Query Parameters:**
- `search` (string): Token search query (default: "pepe")
- `sortBy` (enum): `volume|priceChange|marketCap|liquidity` (default: "volume")
- `sortOrder` (enum): `asc|desc` (default: "desc")
- `limit` (number): Results per page (default: 30, max: 100)
- `cursor` (string): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "token_address": "0x...",
        "token_name": "Pepe",
        "token_ticker": "PEPE",
        "price_sol": 0.00001,
        "price_usd": 0.000001,
        "market_cap_usd": 500000,
        "volume_usd": 100000,
        "liquidity_usd": 50000,
        "price_24hr_change": 5.2,
        "sources": ["jupiter", "dexscreener"],
        "last_updated": "2024-11-16T10:30:00Z"
      }
    ],
    "meta": {
      "limit": 30,
      "total": 150,
      "hasMore": true,
      "nextCursor": "Mw=="
    },
    "cached": false,
    "timestamp": "2024-11-16T10:30:00Z"
  },
  "requestId": "req-uuid"
}
```

### Get Single Token
```bash
GET /api/tokens/:address
```

### Health Check
```bash
GET /api/health
```

### Metrics
```bash
GET /api/metrics
```

### Home Page
```bash
GET /home/page?query=pepe
```

## WebSocket Events

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => console.log('Connected'));
socket.on('token:update', (token) => console.log('Updated:', token));
socket.on('token:new', (token) => console.log('New:', token));
```

## Architecture

```
src/
├── config/              # Configuration
├── controllers/         # Request handlers
├── services/           # Business logic
├── repositories/       # Data access
├── middleware/         # Express middleware
├── schemas/           # Zod validation
├── utils/             # Helpers
├── jobs/              # Bull queue
├── errors/            # Error classes
├── routes/            # Routes
└── index.ts           # Entry point
```

## Performance Optimizations

- Redis connection pooling
- HTTP keep-alive with Axios
- Cursor-based pagination
- Response compression
- Rate limiting middleware
- Cache hit/miss tracking

## Deployment

### Render.com / Railway.app / Fly.io

1. Connect GitHub repository
2. Set build: `npm install && npm run build`
3. Set start: `npm start`
4. Configure environment variables
5. Add Redis service

## Testing

```bash
npm test          # Run tests
npm run test:coverage  # Coverage report
npm run lint      # ESLint check
npm run format    # Prettier format
```

## License

ISC
