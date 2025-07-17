# Docker Setup for Ship Collection Application

This document provides comprehensive instructions for running the Ship Collection application in Docker containers.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 4GB of available RAM for optimal performance

## Quick Start

### Development Environment

```bash
# Start development environment
npm run docker:dev start

# View logs
npm run docker:dev logs

# Stop development environment
npm run docker:dev stop
```

### Production Environment

```bash
# Start production environment
npm run docker:prod start

# View status
npm run docker:prod status

# Stop production environment
npm run docker:prod stop
```

## Detailed Commands

### Development Commands

```bash
# Build development images
npm run docker:dev build

# Start development environment
npm run docker:dev start

# Restart development environment
npm run docker:dev restart

# View logs (follow mode)
npm run docker:dev logs

# Open shell in app container
npm run docker:dev shell

# Clean up resources
npm run docker:dev clean
```

### Production Commands

```bash
# Build production images
npm run docker:prod build

# Start production environment
npm run docker:prod start

# Restart production environment
npm run docker:prod restart

# View logs
npm run docker:prod logs

# Check service status
npm run docker:prod status

# Clean up resources
npm run docker:prod clean
```

## Services

### Application (app)
- **Port**: 3000
- **Environment**: Development or Production
- **Features**: Hot reload (dev), optimized build (prod)

### MongoDB (mongodb)
- **Port**: 27017
- **Database**: ship-collection-v2
- **Persistent Storage**: Yes (Docker volume)

### MongoDB Express (mongo-express)
- **Port**: 8081
- **Username**: admin
- **Password**: shipCollection2025
- **Enabled**: Development mode only (by default)

## Environment Variables

### Development (.env.docker.dev)
```env
MONGODB_URI=mongodb://mongodb:27017/ship-collection-v2
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=4096
PORT=3000
```

### Production (.env.docker)
```env
MONGODB_URI=mongodb://mongodb:27017/ship-collection-v2
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

## Persistent Data

### Volumes
- **mongodb_data**: Database files
- **mongodb_config**: MongoDB configuration
- **uploads**: Application file uploads
- **magazines**: Magazine PDF files

### Backup and Migration
Your local MongoDB data can be migrated to the containerized environment:

```bash
# Export from local MongoDB
mongodump --db ship-collection-v2 --out backup

# Import to containerized MongoDB
docker-compose exec mongodb mongorestore --db ship-collection-v2 /backup/ship-collection-v2
```

## Health Checks

All services include health checks:
- **Application**: HTTP check on `/api/health`
- **MongoDB**: MongoDB ping command
- **Mongo Express**: HTTP availability check

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   # Kill the process if needed
   kill -9 <PID>
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   # Restart MongoDB service
   docker-compose restart mongodb
   ```

3. **Container won't start**
   ```bash
   # Check container logs
   docker-compose logs app
   # Rebuild containers
   npm run docker:dev build
   ```

### Performance Tuning

1. **Increase memory allocation**
   - Edit `NODE_OPTIONS` in environment files
   - Increase Docker Desktop memory limit

2. **Optimize build time**
   - Use Docker layer caching
   - Minimize context sent to Docker daemon

## Security Considerations

1. **Non-root user**: All containers run as non-root users
2. **Network isolation**: Services communicate through isolated Docker network
3. **Environment variables**: Sensitive data stored in environment files
4. **Health checks**: Continuous monitoring of service health

## Production Deployment

For production deployment, consider:

1. **Environment variables**: Use secrets management
2. **SSL/TLS**: Add reverse proxy (nginx) for HTTPS
3. **Monitoring**: Add logging and monitoring solutions
4. **Backup**: Implement automated database backups
5. **Scaling**: Consider orchestration platforms (Kubernetes)

## File Structure

```
├── Dockerfile              # Production container
├── Dockerfile.dev          # Development container
├── docker-compose.yml      # Base compose configuration
├── docker-compose.dev.yml  # Development overrides
├── .dockerignore           # Files to exclude from context
├── .env.docker            # Production environment variables
├── .env.docker.dev        # Development environment variables
└── scripts/
    ├── docker-dev.sh       # Development management script
    └── docker-prod.sh      # Production management script
```

## Next Steps

1. **Configure CI/CD**: Automate Docker builds and deployments
2. **Add monitoring**: Implement application and infrastructure monitoring
3. **Set up backups**: Automated database backup strategy
4. **Security audit**: Regular security scanning of containers
5. **Performance optimization**: Monitor and optimize container performance