# Cloudflare Tunnel Setup for viament.alwood.dev

## Overview
This guide explains how to deploy ViaMent using Cloudflare Tunnel to make it accessible at https://viament.alwood.dev

## Architecture

```
Internet (viament.alwood.dev)
         │
         │ HTTPS (Cloudflare)
         ▼
  Cloudflare Tunnel
         │
         │ Port 3000
         ▼
  Frontend Container (Next.js)
         │
         │ Internal Docker Network
         ▼
  Backend Container (FastAPI:8000)
```

## Quick Setup

### 1. Configure Environment Variables

Create/edit `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-your-key-here

# For production with Cloudflare Tunnel
NEXT_PUBLIC_API_URL=https://viament.alwood.dev/api
CORS_ORIGIN=https://viament.alwood.dev
```

### 2. Start Docker Containers

```bash
docker-compose up -d
```

### 3. Configure Cloudflare Tunnel

Point your Cloudflare Tunnel to:
- **Service**: HTTP
- **URL**: `localhost:3000`

Example cloudflared config:
```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: viament.alwood.dev
    service: http://localhost:3000
  - service: http_status:404
```

Or using the command line:
```bash
cloudflared tunnel route dns viament-tunnel viament.alwood.dev
cloudflared tunnel run --url http://localhost:3000 viament-tunnel
```

## How It Works

### Frontend (Port 3000)
- Next.js serves the application on port 3000
- Cloudflare Tunnel exposes port 3000 as https://viament.alwood.dev
- SSL/TLS is handled by Cloudflare

### Backend (Port 8000)
- Backend runs internally in Docker network
- Frontend communicates with backend via internal Docker network
- API requests from browser go through frontend's API routes (Next.js proxy)
- CORS configured to allow requests from viament.alwood.dev

### API Routes
Next.js API routes act as a proxy:
- Browser → `https://viament.alwood.dev/api/mentor/chat`
- Next.js → `http://backend:8000` (internal Docker network)
- Backend responds → Next.js → Browser

## Configuration Files

### .env for Production
```bash
OPENAI_API_KEY=sk-your-actual-key
NEXT_PUBLIC_API_URL=https://viament.alwood.dev/api
CORS_ORIGIN=https://viament.alwood.dev
```

### .env for Local Development
```bash
OPENAI_API_KEY=sk-your-actual-key
# NEXT_PUBLIC_API_URL not set (uses default: http://backend:8000)
# CORS_ORIGIN not set (uses defaults)
```

## Testing

### 1. Verify Docker Containers
```bash
docker-compose ps
# Both frontend and backend should be "Up (healthy)"
```

### 2. Test Locally First
```bash
curl http://localhost:3000
curl http://localhost:8000/api/health
```

### 3. Test Through Cloudflare Tunnel
```bash
curl https://viament.alwood.dev
curl https://viament.alwood.dev/api/health
```

### 4. Check Browser Console
Open https://viament.alwood.dev in browser and check:
- No CORS errors
- API calls succeed
- Application loads correctly

## Troubleshooting

### CORS Errors
**Symptom**: Browser console shows CORS errors

**Solution**: Verify `.env` has correct domain:
```bash
CORS_ORIGIN=https://viament.alwood.dev
```

Then restart containers:
```bash
docker-compose restart
```

### API Calls Failing
**Symptom**: Frontend can't reach backend

**Check 1**: Verify NEXT_PUBLIC_API_URL is set correctly in `.env`
```bash
grep NEXT_PUBLIC_API_URL .env
```

**Check 2**: Verify backend is healthy
```bash
docker-compose exec backend curl http://localhost:8000/api/health
```

**Check 3**: Check frontend can reach backend internally
```bash
docker-compose exec frontend wget -O- http://backend:8000/api/health
```

### Cloudflare Tunnel Not Connecting
**Symptom**: Domain not accessible

**Check 1**: Verify tunnel is running
```bash
cloudflared tunnel info viament-tunnel
```

**Check 2**: Verify frontend is listening
```bash
docker-compose logs frontend | grep "Ready"
```

**Check 3**: Test local port
```bash
curl http://localhost:3000
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key for AI features |
| `NEXT_PUBLIC_API_URL` | ⚠️ Production | `http://backend:8000` | Backend API URL (use domain for production) |
| `CORS_ORIGIN` | ⚠️ Production | - | Additional CORS origin (your domain) |

## Deployment Workflow

### Initial Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd hackathon-team-vibe_coderzy

# 2. Configure environment
cp .env.example .env
nano .env  # Add your keys and domain

# 3. Start containers
docker-compose up -d

# 4. Verify containers are healthy
docker-compose ps

# 5. Configure Cloudflare Tunnel
# Point to localhost:3000

# 6. Test the application
# Visit https://viament.alwood.dev
```

### Updates
```bash
# 1. Pull latest changes
git pull

# 2. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 3. Verify
docker-compose ps
```

## Multiple Environments

You can run both local and production simultaneously on different ports:

### Local Development
```yaml
# docker-compose.dev.yml
services:
  frontend:
    ports:
      - "3001:3000"  # Different port
  backend:
    ports:
      - "8001:8000"
```

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` with real credentials
- Use different API keys for development and production
- Rotate keys regularly

### 2. Cloudflare Settings
- Enable "Always Use HTTPS"
- Configure WAF rules
- Set up rate limiting
- Enable Bot Fight Mode

### 3. Backend Exposure
- Backend port (8000) doesn't need to be exposed publicly
- Only expose through Cloudflare Tunnel on port 3000
- Backend communicates with frontend via internal Docker network

## Advanced: Separate Backend Tunnel

If you want to expose backend separately:

### Option 1: Single Domain with Path Routing
```yaml
# Cloudflare Tunnel config
ingress:
  - hostname: viament.alwood.dev
    path: /api/*
    service: http://localhost:8000
  - hostname: viament.alwood.dev
    service: http://localhost:3000
  - service: http_status:404
```

Update `.env`:
```bash
NEXT_PUBLIC_API_URL=https://viament.alwood.dev
```

### Option 2: Separate Subdomain
```yaml
# Cloudflare Tunnel config
ingress:
  - hostname: viament.alwood.dev
    service: http://localhost:3000
  - hostname: api.viament.alwood.dev
    service: http://localhost:8000
  - service: http_status:404
```

Update `.env`:
```bash
NEXT_PUBLIC_API_URL=https://api.viament.alwood.dev
CORS_ORIGIN=https://viament.alwood.dev
```

## Monitoring

### Health Checks
```bash
# Frontend
curl https://viament.alwood.dev

# Backend (through frontend)
curl https://viament.alwood.dev/api/health
```

### Logs
```bash
# All logs
docker-compose logs -f

# Frontend only
docker-compose logs -f frontend

# Backend only
docker-compose logs -f backend

# Cloudflare Tunnel logs
cloudflared tunnel logs viament-tunnel
```

### Resource Usage
```bash
docker stats
```

## Backup Configuration

Save your working configuration:
```bash
# Backup environment (without secrets)
cp .env.example .env.backup

# Backup Cloudflare Tunnel config
cp ~/.cloudflared/config.yml ~/config.yml.backup
```

## Support

If you encounter issues:
1. Check container logs: `docker-compose logs`
2. Verify environment variables: `cat .env`
3. Test locally first: `curl http://localhost:3000`
4. Check Cloudflare Tunnel status
5. Verify CORS configuration in backend logs

---

**Domain**: viament.alwood.dev  
**Cloudflare Tunnel**: Port 3000  
**Internal Communication**: Docker network (backend:8000)  
**SSL/TLS**: Managed by Cloudflare
