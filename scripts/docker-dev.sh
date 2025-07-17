#!/bin/bash

# Docker Development Script
# This script helps manage the development Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Ship Collection - Docker Development Environment${NC}"
echo -e "${YELLOW}=======================================${NC}"

# Function to display usage
usage() {
    echo "Usage: $0 {start|stop|restart|logs|build|clean|shell}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the development environment"
    echo "  stop    - Stop the development environment"
    echo "  restart - Restart the development environment"
    echo "  logs    - View logs from all services"
    echo "  build   - Build the Docker images"
    echo "  clean   - Clean up Docker resources"
    echo "  shell   - Open shell in the app container"
    exit 1
}

# Function to start development environment
start_dev() {
    echo -e "${GREEN}🚀 Starting development environment...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo -e "${YELLOW}📱 Application: http://localhost:3000${NC}"
    echo -e "${YELLOW}🗃️  MongoDB Admin: http://localhost:8081${NC}"
    echo -e "${YELLOW}📊 Use 'docker-compose logs -f' to view logs${NC}"
}

# Function to stop development environment
stop_dev() {
    echo -e "${YELLOW}🛑 Stopping development environment...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    echo -e "${GREEN}✅ Development environment stopped!${NC}"
}

# Function to restart development environment
restart_dev() {
    echo -e "${YELLOW}🔄 Restarting development environment...${NC}"
    stop_dev
    start_dev
}

# Function to view logs
show_logs() {
    echo -e "${GREEN}📋 Viewing logs (Press Ctrl+C to exit)...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
}

# Function to build images
build_images() {
    echo -e "${GREEN}🔨 Building Docker images...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
    echo -e "${GREEN}✅ Images built successfully!${NC}"
}

# Function to clean up Docker resources
clean_docker() {
    echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Docker resources cleaned!${NC}"
}

# Function to open shell in app container
open_shell() {
    echo -e "${GREEN}🐚 Opening shell in app container...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec app sh
}

# Main command handling
case "$1" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
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
    shell)
        open_shell
        ;;
    *)
        usage
        ;;
esac