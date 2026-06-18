## Deployment Guide

### Prerequisites for All Platforms
- Build the project: `npm run build`
- Ensure Redis is available
- Generate `.env` with all required variables

### Render.com

1. **Create Web Service**
   - Connect GitHub repository
   - Select the `backend` directory as root

2. **Build Configuration**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Environment Variables**
   - Set all variables from `.env.example`
   - Important: Redis URL from Render Redis add-on

4. **Add Redis**
   - Create Redis instance
   - Link to the web service
   - Use provided Redis URL

5. **Deploy**
   - Push to GitHub
   - Render auto-deploys on push

### Railway.app

1. **Create Project**
   - New Project → GitHub Repo

2. **Add Services**
   - Add Redis plugin (built-in)
   - Main app service

3. **Configuration**
   - Set Start Command: `npm run build && npm start`
   - Add all environment variables
   - Railway auto-generates REDIS_URL

4. **Deploy**
   - Auto-deploys on git push
   - View logs in Railway dashboard

### Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Authenticate**
   ```bash
   flyctl auth login
   ```

3. **Launch**
   ```bash
   cd backend
   flyctl launch
   ```

4. **Configure fly.toml**
   ```toml
   [env]
   NODE_ENV = "production"
   PORT = "3000"
   ```

5. **Add Redis**
   ```bash
   flyctl redis create
   ```

6. **Set Secrets**
   ```bash
   flyctl secrets set REDIS_URL="redis://..."
   flyctl secrets set LOG_LEVEL="info"
   ```

7. **Deploy**
   ```bash
   flyctl deploy
   ```

### DigitalOcean App Platform

1. **Connect Repository**
   - Create App → GitHub

2. **Configure Backend Service**
   ```yaml
   name: backend
   github:
     repo: your-repo
     branch: main
   build_command: npm install && npm run build
   run_command: npm start
   envs:
     - key: NODE_ENV
       value: production
   ```

3. **Add Redis Database**
   - Create managed Redis
   - Link to app
   - Use connection string

4. **Deploy**
   - Save and deploy
   - Monitor via dashboard

### Docker/K8s (Self-Hosted)

1. **Build Image**
   ```bash
   docker build -t crypto-aggregator:latest .
   ```

2. **Push to Registry**
   ```bash
   docker tag crypto-aggregator:latest your-registry/crypto-aggregator:latest
   docker push your-registry/crypto-aggregator:latest
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Kubernetes Deployment**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: crypto-aggregator
   spec:
     replicas: 2
     template:
       spec:
         containers:
         - name: app
           image: your-registry/crypto-aggregator:latest
           ports:
           - containerPort: 3000
           env:
           - name: REDIS_URL
             valueFrom:
               secretKeyRef:
                 name: app-secrets
                 key: redis-url
   ```

### Production Environment Variables

```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis (use managed service)
REDIS_URL=redis://user:pass@host:6379
REDIS_DB=0

# API Configuration
CACHE_TTL=30
API_TIMEOUT=10000
MAX_RETRIES=3

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=300

# Jobs
JOB_FETCH_INTERVAL=30000
JOB_RETRY_ATTEMPTS=3

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### Monitoring & Logs

- **Render**: View in Render dashboard
- **Railway**: Real-time logs tab
- **Fly**: `flyctl logs`
- **DigitalOcean**: App Platform dashboard

### Health Check URLs

- Health: `https://your-domain/api/health`
- Metrics: `https://your-domain/api/metrics`

### Performance Tips

1. Use connection pooling (already configured)
2. Set appropriate CACHE_TTL for your needs
3. Monitor cache hit rate via `/api/metrics`
4. Scale horizontally if needed (stateless service)
5. Use CDN for static assets

### Troubleshooting

**Redis Connection Failed**
- Verify Redis URL in environment
- Check Redis service is running
- Verify network connectivity

**High Memory Usage**
- Reduce CACHE_TTL
- Check WebSocket connection limits
- Monitor job queue size

**Slow API Response**
- Check external API rate limits
- Verify cache hit rate
- Monitor database load

### Backup & Recovery

- Redis: Use managed backup from provider
- Code: GitHub repository is source of truth
- Environment: Document all secrets securely
