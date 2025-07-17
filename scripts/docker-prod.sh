#!/bin/bash

# Docker Production Script
# This script helps manage the production Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Ship Collection - Docker Production Environment${NC}"
echo -e "${YELLOW}===============================================${NC}"

# Function to display usage
usage() {
    echo "Usage: $0 {start|stop|restart|logs|build|clean|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the production environment"
    echo "  stop    - Stop the production environment"
    echo "  restart - Restart the production environment"
    echo "  logs    - View logs from all services"
    echo "  build   - Build the Docker images"
    echo "  clean   - Clean up Docker resources"
    echo "  status  - Show status of all services"
    exit 1
}

# Function to start production environment
start_prod() {
    echo -e "${GREEN}🚀 Starting production environment...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Production environment started!${NC}"
    echo -e "${YELLOW}📱 Application: http://localhost:3000${NC}"
    echo -e "${YELLOW}📊 Use 'docker-compose logs -f' to view logs${NC}"
}

# Function to stop production environment
stop_prod() {
    echo -e "${YELLOW}🛑 Stopping production environment...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Production environment stopped!${NC}"
}

# Function to restart production environment
restart_prod() {
    echo -e "${YELLOW}🔄 Restarting production environment...${NC}"
    stop_prod
    start_prod
}

# Function to view logs
show_logs() {
    echo -e "${GREEN}📋 Viewing logs (Press Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Function to build images
build_images() {
    echo -e "${GREEN}🔨 Building Docker images...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Images built successfully!${NC}"
}

# Function to clean up Docker resources
clean_docker() {
    echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
    docker-compose down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Docker resources cleaned!${NC}"
}

# Function to show status
show_status() {
    echo -e "${GREEN}📊 Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${GREEN}📈 Resource Usage:${NC}"
    docker stats --no-stream
}

# Main command handling
case "$1" in
    start)
        start_prod
        ;;
    stop)
        stop_prod
        ;;
    restart)
        restart_prod
        ;;
    logs)
        show_logs
        ;;
    build)
        build_images
        ;;
    clean)
        clean_docker
        ;;
    status)
        show_status
        ;;
    *)
        usage
        ;;
esac