# Quick Reference - Docker Commands

## 🚀 Getting Started (First Time)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit and add your OpenAI API key
nano .env  # or use any editor

# 3. Start application
./deploy.sh up
# OR
make up
# OR
docker-compose up --build -d
```

## 📋 Daily Commands

| Task | Deploy Script | Makefile | Docker Compose |
|------|--------------|----------|----------------|
| **Start** | `./deploy.sh up` | `make up` | `docker-compose up -d` |
| **Stop** | `./deploy.sh down` | `make down` | `docker-compose down` |
| **Restart** | `./deploy.sh restart` | `make restart` | `docker-compose restart` |
| **Logs (all)** | `./deploy.sh logs` | `make logs` | `docker-compose logs -f` |
| **Logs (frontend)** | `./deploy.sh logs frontend` | `make logs-frontend` | `docker-compose logs -f frontend` |
| **Logs (backend)** | `./deploy.sh logs backend` | `make logs-backend` | `docker-compose logs -f backend` |
| **Status** | `./deploy.sh status` | `make status` | `docker-compose ps` |
| **Rebuild** | `./deploy.sh build` | `make build` | `docker-compose build` |

## 🔍 Troubleshooting

```bash
# Check if containers are running
docker-compose ps

# View recent logs
docker-compose logs --tail=50

# Check container resource usage
docker stats

# Restart a specific service
docker-compose restart frontend

# Rebuild a specific service
docker-compose up --build -d backend

# Access container shell
docker-compose exec frontend sh
docker-compose exec backend bash
```

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a

# Remove specific images
docker rmi viament-frontend viament-backend
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/api/health

## ⚙️ Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

Optional:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🔧 Common Issues

### Port Already in Use
```bash
# Change ports in docker-compose.yml
services:
  frontend:
    ports:
      - "3001:3000"  # Change host port to 3001
```

### OpenAI API Key Not Working
```bash
# Verify key is set
cat .env | grep OPENAI_API_KEY

# Restart containers after updating .env
docker-compose down
docker-compose up -d
```

### Container Won't Start
```bash
# Check logs for errors
docker-compose logs backend
docker-compose logs frontend

# Verify configuration
docker-compose config
```

### Out of Disk Space
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Check disk usage
docker system df
```

## 📚 Documentation

- **DOCKER.md** - Complete Docker deployment guide
- **PRODUCTION.md** - Production best practices
- **DOCKER_IMPLEMENTATION.md** - Implementation details
- **README.md** - Project overview and quick start

## 🔄 Update Workflow

```bash
# 1. Pull latest changes
git pull

# 2. Rebuild containers
docker-compose down
docker-compose up --build -d

# 3. Check logs
docker-compose logs -f
```

## 💡 Tips

- Use `./deploy.sh` for simplicity
- Use `make` commands for power users
- Use `docker-compose` for full control
- Always check logs if something doesn't work
- Keep .env file secure and never commit it
- Run `docker-compose down` before making config changes

## ☁️ Cloudflare Tunnel Setup (viament.alwood.dev)

### Quick Production Setup

```bash
# 1. Configure environment
cp .env.production.example .env
nano .env  # Add OPENAI_API_KEY

# 2. Start containers
docker-compose up -d

# 3. Configure Cloudflare Tunnel
# Point to: http://localhost:3000
# Domain: viament.alwood.dev
```

### Cloudflare Tunnel Command
```bash
cloudflared tunnel --url http://localhost:3000
```

### Environment Variables for Production
```bash
OPENAI_API_KEY=sk-your-key
NEXT_PUBLIC_API_URL=https://viament.alwood.dev/api
CORS_ORIGIN=https://viament.alwood.dev
```

### Verify Setup
```bash
# Check containers
docker-compose ps

# Test locally
curl http://localhost:3000

# Test through tunnel
curl https://viament.alwood.dev
```

See [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md) for detailed setup.

