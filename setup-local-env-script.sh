#!/bin/bash

# Ship Collection Multi-Tenant - Local Environment Setup
set -e

echo "🚀 Setting up Ship Collection Multi-Tenant development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please review and update as needed"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs/postgres
mkdir -p supabase/functions
mkdir -p supabase/migrations
mkdir -p public/uploads
mkdir -p migration/exports
mkdir -p migration/assets

# Generate JWT secrets if not set
if grep -q "your-super-secret" .env.local; then
    echo "🔐 Generating JWT secrets..."
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s/your-super-secret-jwt-token-with-at-least-32-characters-long/$JWT_SECRET/g" .env.local
    rm .env.local.bak
    echo "✅ Generated new JWT secrets"
fi

# Start the development environment
echo "🐳 Starting Docker containers..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T db pg_isready -U postgres; do
    sleep 2
done

# Start all other services
echo "🔧 Starting all services..."
docker-compose up -d

# Wait for all services to be healthy
echo "⏳ Waiting for all services to be ready..."
sleep 10

# Check service health
echo "🩺 Checking service health..."
services=("db" "auth" "rest")
for service in "${services[@]}"; do
    if docker-compose ps $service | grep -q "Up (healthy)"; then
        echo "✅ $service is healthy"
    else
        echo "⚠️  $service may not be ready yet"
    fi
done

echo ""
echo "🎉 Setup complete! Services are available at:"
echo "   📱 Application:    http://localhost:3000"
echo "   🗄️  REST API:      http://localhost:3001"
echo "   🔐 Auth API:       http://localhost:9999"
echo "   🎨 Studio UI:      http://localhost:3002"
echo ""
echo "🔧 Useful commands:"
echo "   docker-compose logs -f app    # View app logs"
echo "   docker-compose logs -f db     # View database logs" 
echo "   ./scripts/reset-database.sh   # Reset database"
echo "   docker-compose down           # Stop all services"
echo ""
echo "📚 Next steps:"
echo "   1. Review .env.local settings"
echo "   2. Run database migrations if needed"
echo "   3. Start development: npm run dev"