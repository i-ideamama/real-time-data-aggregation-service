# Deployment Guide - Real-Time Token Aggregator

Complete guide for deploying the real-time token aggregator service to production.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment (Linux/Ubuntu)](#production-deployment)
4. [Nginx Configuration](#nginx-configuration)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites
- Node.js 20+
- npm or yarn
- Redis 7+ (optional, service works without it)
- Python 3 (for serving frontend)

### Setup

1. **Install Backend Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment**
```bash
# Copy example env
cp .env.example .env

# Edit .env with your settings
nano .env
```

3. **Build TypeScript**
```bash
npm run build
```

4. **Start Backend**
```bash
npm start
# Server will listen on http://localhost:8000
```

5. **Serve Frontend** (in another terminal)
```bash
cd frontend
python3 -m http.server 3001
# Open http://localhost:3001
```

---

## Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Quick Start

```bash
# Build and run with docker-compose
docker-compose up --build

# Access services
# Frontend: http://localhost:3001
# Backend API: http://localhost:8000
# Redis: localhost:6379
```

### Docker Compose Configuration

The `docker-compose.yml` includes:
- **Backend Service**: Node.js app on port 8000
- **Frontend Service**: Python HTTP server on port 3001
- **Redis Service**: Cache layer on port 6379

### Build for Production

```bash
# Build backend image
docker build -t token-aggregator:latest .

# Run container
docker run -d \
  --name token-aggregator \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -e PORT=8000 \
  -e REDIS_URL=redis://redis:6379 \
  token-aggregator:latest
```

---

## Production Deployment (Linux/Ubuntu)

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 20+ installed via NVM or apt
- Redis 7+ (for caching)
- Nginx (for reverse proxy)
- SSL certificate (Let's Encrypt)
- Systemd (for service management)

### Step 1: Clone Repository

```bash
cd /opt
git clone <repository-url> token-aggregator
cd token-aggregator
```

### Step 2: Install Backend

```bash
cd backend
npm install --production
npm run build
```

### Step 3: Create System User

```bash
# Create dedicated user for the service
sudo useradd -r -m -s /bin/false token-aggregator
sudo chown -R token-aggregator:token-aggregator /opt/token-aggregator
```

### Step 4: Create Systemd Service

Create `/etc/systemd/system/token-aggregator.service`:

```ini
[Unit]
Description=Real-Time Token Aggregator Service
After=network.target redis-server.service
Requires=redis-server.service

[Service]
Type=simple
User=token-aggregator
WorkingDirectory=/opt/token-aggregator/backend
ExecStart=/usr/bin/node /opt/token-aggregator/backend/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="NODE_ENV=production"
Environment="PORT=8000"
Environment="REDIS_URL=redis://localhost:6379"

[Install]
WantedBy=multi-user.target
```

### Step 5: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service on boot
sudo systemctl enable token-aggregator

# Start service
sudo systemctl start token-aggregator

# Check status
sudo systemctl status token-aggregator

# View logs
sudo journalctl -u token-aggregator -f
```

### Step 6: Install Redis

```bash
# Install Redis
sudo apt install redis-server

# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### Step 7: Configure Nginx

Copy `nginx.conf` to `/etc/nginx/sites-available/token-aggregator`:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/token-aggregator
sudo ln -s /etc/nginx/sites-available/token-aggregator /etc/nginx/sites-enabled/
```

Edit the config to match your domain:

```bash
sudo nano /etc/nginx/sites-available/token-aggregator
```

Replace `localhost` with your domain name.

### Step 8: Configure SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain and configure SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 9: Deploy Frontend

```bash
# Create web directory
sudo mkdir -p /var/www/token-aggregator/frontend

# Copy frontend files
sudo cp -r frontend/* /var/www/token-aggregator/frontend/

# Set permissions
sudo chown -R www-data:www-data /var/www/token-aggregator

# Update frontend to point to your domain
sudo nano /var/www/token-aggregator/frontend/index.html
# Update API_URL and SOCKET_URL to your domain
```

---

## Nginx Configuration

### Basic Configuration

The provided `nginx.conf` includes:

- **Frontend serving**: Static files from `/var/www/real-time-aggregator/frontend`
- **API proxy**: Routes `/api/` to backend service
- **Socket.io proxy**: Special handling for WebSocket connections
- **Caching**: Static assets cached for 7 days
- **Security headers**: X-Frame-Options, CORS handling
- **Gzip compression**: Enabled for all text assets

### SSL Configuration

For HTTPS with Let's Encrypt:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Rest of config...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=8000

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
CACHE_TTL=30

# External APIs
DEXSCREENER_API_URL=https://api.dexscreener.com/latest
DEXSCREENER_API_KEY=
JUPITER_API_URL=https://api.jup.ag
JUPITER_API_KEY=
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### Frontend (index.html)

Update in the JavaScript section:

```javascript
const API_URL = 'https://yourdomain.com';  // or https://api.yourdomain.com
const SOCKET_URL = 'https://yourdomain.com';
```

---

## Monitoring and Logs

### Backend Logs

```bash
# Real-time logs
sudo journalctl -u token-aggregator -f

# Last 100 lines
sudo journalctl -u token-aggregator -n 100

# By date
sudo journalctl -u token-aggregator --since "2025-11-16 00:00:00"
```

### Check Service Status

```bash
# Service status
sudo systemctl status token-aggregator

# Redis status
sudo systemctl status redis-server

# Nginx status
sudo systemctl status nginx
```

### Health Check

```bash
# API health
curl https://yourdomain.com/api/health

# Token endpoint
curl "https://yourdomain.com/api/tokens?search=pepe&limit=5"

# Metrics
curl https://yourdomain.com/api/metrics
```

---

## Performance Tuning

### Redis Optimization

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Increase max memory
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### Nginx Optimization

```bash
# Edit Nginx config
sudo nano /etc/nginx/nginx.conf

# Increase worker connections
worker_processes auto;
worker_connections 4096;

# Enable keepalive
keepalive_timeout 65;
```

### Node.js Optimization

```bash
# Set NODE_ENV to production (already in systemd)
# Increase max old space size if needed
NODE_OPTIONS="--max-old-space-size=4096"
```

---

## Backup and Recovery

### Database Backup

```bash
# Backup Redis database
redis-cli --rdb /backup/redis.rdb

# Restore from backup
redis-cli shutdown
cp /backup/redis.rdb /var/lib/redis/dump.rdb
sudo systemctl start redis-server
```

### Configuration Backup

```bash
# Backup all configs
sudo tar -czf /backup/token-aggregator-config-$(date +%Y%m%d).tar.gz \
  /etc/nginx/sites-available/token-aggregator \
  /etc/systemd/system/token-aggregator.service \
  /opt/token-aggregator/backend/.env
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u token-aggregator -n 50

# Verify config
cat /opt/token-aggregator/backend/.env

# Test manually
cd /opt/token-aggregator/backend
node dist/index.js
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis status
sudo systemctl status redis-server

# Restart Redis
sudo systemctl restart redis-server
```

### Nginx Proxy Issues

```bash
# Test Nginx config
sudo nginx -t

# View error log
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Frontend Not Loading

```bash
# Check if files exist
ls -la /var/www/token-aggregator/frontend/

# Check permissions
sudo chown -R www-data:www-data /var/www/token-aggregator

# Clear browser cache and hard refresh (Ctrl+Shift+R)
```

### Socket.io Connection Issues

```bash
# Check if websocket is working
curl -i http://localhost:8000/socket.io/?transport=websocket

# Check firewall
sudo ufw allow 8000/tcp
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
```

---

## Scaling Considerations

### Multiple Backend Instances

For high traffic, use a load balancer (HAProxy or AWS ELB):

```bash
# Install HAProxy
sudo apt install haproxy

# Configure to balance between multiple backend instances
# Update /etc/haproxy/haproxy.cfg
```

### Caching Strategy

- Increase `CACHE_TTL` for stable data
- Use Redis Sentinel for HA
- Consider Redis Cluster for large datasets

### Database

- Monitor Redis memory usage
- Implement data expiration policies
- Consider using separate Redis instances for different data types

---

## Security Hardening

### Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct backend access
sudo ufw default deny incoming
```

### SSL Security

```bash
# Strong SSL configuration
sudo nano /etc/nginx/nginx.conf

# Add to http section:
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### Rate Limiting

Already configured in backend, but can be tuned:

```bash
# Edit backend .env
RATE_LIMIT_MAX=100  # requests per window
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
```

---

## Next Steps

1. Monitor performance in production
2. Set up automated backups
3. Configure log aggregation
4. Implement status monitoring (Uptime Robot, Datadog, etc.)
5. Plan for scaling if needed

---

**Last Updated**: November 16, 2025  
**Version**: 1.0.0
