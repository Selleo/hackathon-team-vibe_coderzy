# Docker Deployment Guide

This guide explains how to deploy the ViaMent application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- OpenAI API key (for AI mentor features)

## Quick Start

1. **Clone the repository and navigate to the project root**
   ```bash
   cd hackathon-team-vibe_coderzy
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Build and start the containers**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Container Architecture

- **frontend**: Next.js application (React 19, TypeScript)
  - Port: 3000
  - Multi-stage build for optimized production image
  - Includes standalone output for minimal size

- **backend**: FastAPI application (Python 3.11)
  - Port: 8000
  - Health check endpoint: `/api/health`

## Development vs Production

### Development (Local)
```bash
# Frontend
cd frontend
pnpm install
pnpm dev

# Backend
cd backend
pip install -e .
uvicorn app.main:app --reload
```

### Production (Docker)
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## Docker Commands

### Build containers
```bash
docker-compose build
```

### Start containers (detached mode)
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Stop containers
```bash
docker-compose down
```

### Rebuild and restart
```bash
docker-compose down
docker-compose up --build -d
```

### Remove all containers and volumes
```bash
docker-compose down -v
```

## Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key for AI mentor features

### Optional
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://backend:8000)

## Troubleshooting

### Container health checks failing
```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs frontend
```

### Port conflicts
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change host port
  backend:
    ports:
      - "8001:8000"  # Change host port
```

### OpenAI API errors
Ensure your `.env` file contains a valid `OPENAI_API_KEY`:
```bash
cat .env | grep OPENAI_API_KEY
```

## Production Deployment

For production deployment to cloud platforms:

### Using Docker Hub
```bash
# Tag and push images
docker tag hackathon-team-vibe_coderzy-frontend:latest your-registry/viament-frontend:latest
docker tag hackathon-team-vibe_coderzy-backend:latest your-registry/viament-backend:latest

docker push your-registry/viament-frontend:latest
docker push your-registry/viament-backend:latest
```

### Using Cloud Platforms

#### AWS ECS
1. Push images to ECR
2. Create ECS task definitions
3. Configure load balancer
4. Set environment variables in task definition

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/viament-frontend frontend/
gcloud builds submit --tag gcr.io/PROJECT-ID/viament-backend backend/

gcloud run deploy viament-frontend --image gcr.io/PROJECT-ID/viament-frontend --platform managed
gcloud run deploy viament-backend --image gcr.io/PROJECT-ID/viament-backend --platform managed
```

#### Heroku
```bash
# Using container registry
heroku container:push web -a your-app-name
heroku container:release web -a your-app-name
```

## Monitoring

### Health Checks
- Frontend: `curl http://localhost:3000`
- Backend: `curl http://localhost:8000/api/health`

### Resource Usage
```bash
# View container stats
docker stats

# View specific container
docker stats hackathon-team-vibe_coderzy-frontend-1
```

## Security Notes

- Never commit `.env` files with real API keys
- Use secrets management in production (AWS Secrets Manager, Google Secret Manager, etc.)
- Update base images regularly for security patches
- Use non-root users in containers (already configured)

## Support

For issues or questions, please refer to the main README.md or contact the development team.
