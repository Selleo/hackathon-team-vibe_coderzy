# Production Deployment Best Practices

## Security

### 1. Environment Variables
- ❌ Never commit `.env` files with real credentials
- ✅ Use secrets management services:
  - AWS: Secrets Manager or Parameter Store
  - GCP: Secret Manager
  - Azure: Key Vault
  - Kubernetes: Secrets
  - Docker Swarm: Docker Secrets

### 2. Container Security
- ✅ Non-root users (already configured)
- ✅ Multi-stage builds (already configured)
- ✅ Minimal base images (alpine/slim)
- 🔄 Regular image updates for security patches
- 🔄 Scan images with tools like:
  ```bash
  docker scan viament-frontend
  docker scan viament-backend
  ```

### 3. Network Security
- Use private networks for inter-service communication
- Implement API rate limiting
- Configure firewall rules
- Use HTTPS/TLS in production
- Implement CORS properly (already configured for development)

## Scalability

### 1. Horizontal Scaling
Configure replicas in production:

```yaml
# docker-compose.prod.yml
services:
  frontend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
  backend:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
```

### 2. Load Balancing
- Use Nginx or cloud load balancers
- Configure health checks
- Implement session affinity if needed

### 3. Caching
- Add Redis for session management
- Implement CDN for static assets
- Use HTTP caching headers

## Monitoring & Logging

### 1. Container Monitoring
```yaml
# Add to docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

### 2. Log Aggregation
- Use centralized logging (ELK Stack, CloudWatch, Stackdriver)
- Configure log rotation
- Set appropriate log levels

### 3. Health Checks
Already configured in docker-compose.yml:
- Backend: `/api/health` endpoint
- Frontend: HTTP check on root path

## Performance

### 1. Image Optimization
Current optimizations:
- Multi-stage builds
- Next.js standalone output (~200MB)
- Slim Python base image (~150MB)

Further optimizations:
```dockerfile
# Frontend - consider distroless
FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app/.next/standalone ./
CMD ["node", "server.js"]
```

### 2. Build Cache
Use BuildKit for faster builds:
```bash
DOCKER_BUILDKIT=1 docker-compose build
```

### 3. Resource Limits
Set appropriate limits in production:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Database & State

### 1. Add Database Service
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: viament
      POSTGRES_USER: viament
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U viament"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 2. Redis for Caching
```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
```

## Backup & Recovery

### 1. Volume Backups
```bash
# Backup
docker run --rm -v viament_postgres_data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm -v viament_postgres_data:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/backup-20250109.tar.gz -C /
```

### 2. Database Dumps
```bash
# Automated backup script
docker-compose exec -T postgres pg_dump -U viament viament > backup.sql
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push
        run: |
          docker build -t registry/viament-frontend:${{ github.sha }} frontend/
          docker build -t registry/viament-backend:${{ github.sha }} backend/
          docker push registry/viament-frontend:${{ github.sha }}
          docker push registry/viament-backend:${{ github.sha }}
      
      - name: Deploy
        run: |
          # Your deployment commands here
```

## Environment-Specific Configs

### Development
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

Create `docker-compose.prod.yml`:
```yaml
services:
  frontend:
    environment:
      - NODE_ENV=production
    restart: always
    
  backend:
    environment:
      - ENVIRONMENT=production
    restart: always
```

## Cost Optimization

### 1. Cloud Provider Specific
- Use spot/preemptible instances for non-critical workloads
- Implement auto-scaling based on metrics
- Use CDN for static assets
- Enable container registry caching

### 2. Resource Optimization
- Set appropriate resource limits
- Use smaller base images
- Implement graceful shutdown
- Optimize build cache usage

## Compliance & Auditing

### 1. Logging Requirements
- Log all API access
- Store logs for required retention period
- Implement log analysis
- Set up alerts for suspicious activities

### 2. Access Control
- Use role-based access control (RBAC)
- Implement least privilege principle
- Regular access audits
- Multi-factor authentication for production access

## Disaster Recovery

### 1. Multi-Region Deployment
- Deploy to multiple regions
- Use DNS-based routing
- Implement data replication
- Regular disaster recovery drills

### 2. Backup Strategy
- Automated daily backups
- Off-site backup storage
- Regular restore testing
- Document recovery procedures

## Checklist for Production

- [ ] Secrets in secrets manager (not .env files)
- [ ] HTTPS/TLS certificates configured
- [ ] Health checks configured
- [ ] Monitoring and alerting set up
- [ ] Log aggregation configured
- [ ] Database backups automated
- [ ] Resource limits set
- [ ] Auto-scaling configured
- [ ] CI/CD pipeline implemented
- [ ] Disaster recovery plan documented
- [ ] Security scanning enabled
- [ ] Regular image updates scheduled
- [ ] Load testing performed
- [ ] Documentation updated
