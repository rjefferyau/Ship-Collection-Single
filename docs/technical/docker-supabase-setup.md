# Docker Supabase Development Setup

## Overview

This document provides the complete Docker Compose configuration for local Supabase development, including PostgreSQL database, authentication, REST API, and the Next.js application. This setup ensures a consistent development environment that mirrors the production Supabase infrastructure.

## Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine + Docker Compose (Linux)
- Git for cloning the repository
- Node.js 18+ (for local development outside Docker)
- 4GB+ available RAM for all services

## Directory Structure

```
Ship-Collection-Multi-Tenant/
├── docker-compose.yml              # Main Docker Compose configuration
├── docker-compose.override.yml     # Local development overrides
├── supabase/
│   ├── config.toml                 # Supabase configuration
│   ├── migrations/                 # Database migration files
│   │   ├── 20250101000001_initial_schema.sql
│   │   ├── 20250101000002_rls_policies.sql
│   │   └── 20250101000003_indexes.sql
│   ├── seed.sql                    # Initial seed data
│   └── functions/                  # Edge functions (if needed)
├── .env.local                      # Environment variables
├── .env.example                    # Environment template
└── scripts/
    ├── setup-local-env.sh          # Setup script
    └── reset-database.sh           # Database reset script
```

## Docker Compose Configuration

### Main Configuration (docker-compose.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: supabase/postgres:15.1.0.147
    container_name: ship-collection-db
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d/migrations:ro
      - ./supabase/seed.sql:/docker-entrypoint-initdb.d/seed.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - supabase

  # Supabase Auth (GoTrue)
  auth:
    image: supabase/gotrue:v2.132.3
    container_name: ship-collection-auth
    depends_on:
      db:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@db:5432/postgres?search_path=auth
      
      # Site configuration
      GOTRUE_SITE_URL: ${SITE_URL:-http://localhost:3000}
      GOTRUE_URI_ALLOW_LIST: ${SITE_URL:-http://localhost:3000}
      
      # JWT configuration
      GOTRUE_JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-token-with-at-least-32-characters-long}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_ADMIN_ROLES: admin
      
      # Auth configuration
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_MAILER_AUTOCONFIRM: true
      GOTRUE_PASSWORD_MIN_LENGTH: 8
      GOTRUE_EXTERNAL_EMAIL_ENABLED: true
      
      # External OAuth providers (optional)
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: false
      GOTRUE_EXTERNAL_GITHUB_ENABLED: false
      
      # Email configuration (for production)
      # GOTRUE_SMTP_HOST: ${SMTP_HOST}
      # GOTRUE_SMTP_PORT: ${SMTP_PORT}
      # GOTRUE_SMTP_USER: ${SMTP_USER}
      # GOTRUE_SMTP_PASS: ${SMTP_PASS}
      
    ports:
      - "${AUTH_PORT:-9999}:9999"
    networks:
      - supabase
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9999/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  # PostgREST API
  rest:
    image: postgrest/postgrest:v12.0.2
    container_name: ship-collection-rest
    depends_on:
      db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-token-with-at-least-32-characters-long}
      PGRST_DB_USE_LEGACY_GUCS: false
      PGRST_APP_SETTINGS_JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-token-with-at-least-32-characters-long}
      PGRST_APP_SETTINGS_JWT_EXP: 3600
    ports:
      - "${REST_PORT:-3001}:3000"
    networks:
      - supabase
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Supabase Studio (Admin UI)
  studio:
    image: supabase/studio:20240101-ce42139
    container_name: ship-collection-studio
    depends_on:
      - rest
      - auth
    environment:
      STUDIO_PG_META_URL: http://rest:3000/
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      
      # Studio configuration
      SUPABASE_URL: http://localhost:${REST_PORT:-3001}
      SUPABASE_ANON_KEY: ${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjIwNzk4NSwiZXhwIjoxOTU3NzgzOTg1fQ.zT8PnrOGYQ3WdT8G8QZz3Q5Q1Q5Q1Q5Q1Q5Q1Q5Q1Q5Q}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQyMjA3OTg1LCJleHAiOjE5NTc3ODM5ODV9.0Fh0VjGhPNaN8O0L0z0z0z0z0z0z0z0z0z0z0z0z0z0z}
      
    ports:
      - "${STUDIO_PORT:-3002}:3000"
    networks:
      - supabase

  # Edge Functions (optional - if using Supabase Edge Functions)
  functions:
    image: supabase/edge-runtime:v1.41.2
    container_name: ship-collection-functions
    depends_on:
      - auth
    environment:
      SUPABASE_URL: http://rest:3000
      SUPABASE_ANON_KEY: ${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjIwNzk4NSwiZXhwIjoxOTU3NzgzOTg1fQ.zT8PnrOGYQ3WdT8G8QZz3Q5Q1Q5Q1Q5Q1Q5Q1Q5Q1Q5Q}
      VERIFY_JWT: true
    volumes:
      - ./supabase/functions:/home/deno/functions:ro
    ports:
      - "${FUNCTIONS_PORT:-54321}:9000"
    networks:
      - supabase
    profiles:
      - functions # Only start when explicitly requested

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
      args:
        NODE_VERSION: 18-alpine
    container_name: ship-collection-app
    depends_on:
      db:
        condition: service_healthy
      auth:
        condition: service_healthy
      rest:
        condition: service_healthy
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SUPABASE_URL=http://localhost:${REST_PORT:-3001}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjIwNzk4NSwiZXhwIjoxOTU3NzgzOTg1fQ.zT8PnrOGYQ3WdT8G8QZz3Q5Q1Q5Q1Q5Q1Q5Q1Q5Q1Q5Q}
      - SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQyMjA3OTg1LCJleHAiOjE5NTc3ODM5ODV9.0Fh0VjGhPNaN8O0L0z0z0z0z0z0z0z0z0z0z0z0z0z0z}
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@db:5432/postgres
    ports:
      - "${APP_PORT:-3000}:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    networks:
      - supabase
    command: npm run dev

volumes:
  db_data:
    driver: local

networks:
  supabase:
    driver: bridge
```

### Development Override (docker-compose.override.yml)

```yaml
version: '3.8'

# Development-specific overrides
services:
  app:
    # Enable hot reloading and debugging
    environment:
      - WATCHPACK_POLLING=true
      - NEXT_PUBLIC_DEBUG=true
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    stdin_open: true
    tty: true
    
  db:
    # Enable query logging for development
    command: >
      postgres
      -c log_statement=all
      -c log_destination=stderr
      -c log_min_duration_statement=0
      -c log_line_prefix='%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d/migrations:ro
      - ./supabase/seed.sql:/docker-entrypoint-initdb.d/seed.sql:ro
      - ./logs/postgres:/var/log/postgresql

  # Add a development mail server for testing auth emails
  mailhog:
    image: mailhog/mailhog:v1.0.1
    container_name: ship-collection-mailhog
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    networks:
      - supabase
```

### Dockerfile for Development (Dockerfile.dev)

```dockerfile
ARG NODE_VERSION=18-alpine
FROM node:${NODE_VERSION}

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

## Environment Configuration

### .env.example

```bash
# Database Configuration
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Supabase URLs
SITE_URL=http://localhost:3000
SUPABASE_URL=http://localhost:3001
SUPABASE_AUTH_URL=http://localhost:9999

# JWT Configuration (Generate new secrets for production!)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjIwNzk4NSwiZXhwIjoxOTU3NzgzOTg1fQ.zT8PnrOGYQ3WdT8G8QZz3Q5Q1Q5Q1Q5Q1Q5Q1Q5Q1Q5Q
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQyMjA3OTg1LCJleHAiOjE5NTc3ODM5ODV9.0Fh0VjGhPNaN8O0L0z0z0z0z0z0z0z0z0z0z0z0z0z0z

# Port Configuration
APP_PORT=3000
REST_PORT=3001
STUDIO_PORT=3002
AUTH_PORT=9999
FUNCTIONS_PORT=54321

# Email Configuration (for production)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# OAuth Configuration (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Next.js Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjIwNzk4NSwiZXhwIjoxOTU3NzgzOTg1fQ.zT8PnrOGYQ3WdT8G8QZz3Q5Q1Q5Q1Q5Q1Q5Q1Q5Q1Q5Q
```

## Database Migrations

### Migration File Structure

**20250101000001_initial_schema.sql**
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE starship_condition AS ENUM (
  'Mint', 'Near Mint', 'Excellent', 'Very Good', 
  'Good', 'Fair', 'Poor', 'Damaged'
);

-- Create auth schema (if not exists)
CREATE SCHEMA IF NOT EXISTS auth;

-- Set up auth users table (Supabase managed, but we can add triggers)
-- This table is managed by Supabase Auth service
```

**20250101000002_rls_policies.sql**
```sql
-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE starships ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = OLD.role);

-- Continue with all RLS policies from schema design...
```

**20250101000003_indexes.sql**
```sql
-- Performance indexes
CREATE INDEX idx_starships_edition ON starships(edition_id);
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_composite ON user_collections(
  user_id, owned, wishlist, on_order, not_interested
);

-- Continue with all indexes from schema design...
```

### Seed Data (seed.sql)

```sql
-- Insert default franchises
INSERT INTO franchises (name, description, is_active) VALUES
('Star Trek', 'Star Trek universe starships', true),
('Battlestar Galactica', 'BSG universe vessels', true),
('Star Wars', 'Star Wars universe ships', true);

-- Insert default editions
INSERT INTO editions (name, internal_name, franchise, is_default) VALUES
('The Official Starships Collection', 'official-star-trek', 'Star Trek', true),
('Discovery', 'discovery-star-trek', 'Star Trek', false),
('Ships of the Line', 'ships-of-line-star-trek', 'Star Trek', false);

-- Insert default manufacturers
INSERT INTO manufacturers (name, description, franchises) VALUES
('Eaglemoss', 'Eaglemoss Collections Ltd', ARRAY['Star Trek', 'Star Wars']),
('Diamond Select', 'Diamond Select Toys', ARRAY['Star Trek']),
('AMT/Ertl', 'Model kit manufacturer', ARRAY['Star Trek', 'Star Wars']);

-- Create default admin user profile (will be linked to first authenticated user)
-- This will be handled by the application on first admin login
```

## Setup Scripts

### setup-local-env.sh

```bash
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
mkdir -p public/uploads

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
echo "   📧 MailHog:        http://localhost:8025"
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
```

### reset-database.sh

```bash
#!/bin/bash

# Reset database to clean state
set -e

echo "🗑️  Resetting database..."

# Stop application to prevent connections
docker-compose stop app

# Reset database volume
echo "📦 Removing database volume..."
docker-compose down db
docker volume rm ship-collection-multi-tenant_db_data 2>/dev/null || true

# Restart database
echo "🔄 Restarting database..."
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to initialize..."
until docker-compose exec -T db pg_isready -U postgres; do
    sleep 2
done

# Wait additional time for initialization scripts
sleep 10

# Restart all services
echo "🚀 Restarting all services..."
docker-compose up -d

echo "✅ Database reset complete!"
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    
    "docker:setup": "./scripts/setup-local-env.sh",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:reset": "./scripts/reset-database.sh",
    "docker:logs": "docker-compose logs -f",
    "docker:logs:app": "docker-compose logs -f app",
    "docker:logs:db": "docker-compose logs -f db",
    
    "supabase:start": "docker-compose up -d db auth rest studio",
    "supabase:stop": "docker-compose stop",
    "supabase:status": "docker-compose ps",
    "supabase:studio": "open http://localhost:3002",
    
    "db:migrate": "docker-compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/",
    "db:seed": "docker-compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/seed.sql",
    "db:reset": "npm run docker:reset",
    
    "types:generate": "supabase gen types typescript --local > types/database.ts"
  }
}
```

## Development Workflow

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/user/Ship-Collection-Multi-Tenant.git
cd Ship-Collection-Multi-Tenant

# Run setup script
chmod +x scripts/*.sh
./scripts/setup-local-env.sh

# Install Node.js dependencies
npm install
```

### 2. Daily Development
```bash
# Start all services
npm run docker:up

# Start Next.js development (in separate terminal)
npm run dev

# View logs
npm run docker:logs:app
```

### 3. Database Operations
```bash
# Reset database to clean state
npm run db:reset

# View database logs
npm run docker:logs:db

# Connect to PostgreSQL directly
docker-compose exec db psql -U postgres -d postgres
```

### 4. Troubleshooting
```bash
# Check service status
npm run supabase:status

# View all logs
npm run docker:logs

# Stop everything
npm run docker:down

# Clean restart
npm run docker:down && npm run docker:up
```

## Production Considerations

### Environment Variables for Production

```bash
# Use strong, unique secrets
JWT_SECRET=$(openssl rand -base64 64)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Configure proper SMTP for email
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password

# Set production URLs
SITE_URL=https://your-domain.com
SUPABASE_URL=https://your-project.supabase.co
```

### Security Considerations

1. **Change Default Passwords**: Never use default passwords in production
2. **Use HTTPS**: Always use HTTPS in production
3. **Secure JWT Secrets**: Generate strong, unique JWT secrets
4. **Database Security**: Use connection pooling and SSL
5. **CORS Configuration**: Configure CORS properly for your domain

### Performance Optimization

1. **Connection Pooling**: Configure PostgreSQL connection pooling
2. **Caching**: Use Redis for session and query caching
3. **CDN**: Use CDN for static assets
4. **Database Tuning**: Optimize PostgreSQL settings for your workload

## Conclusion

This Docker Compose setup provides a complete local development environment that mirrors the production Supabase infrastructure. It includes:

- Full Supabase stack (PostgreSQL, Auth, REST API, Studio)
- Automated database migrations and seeding
- Development tools and debugging capabilities
- Easy reset and cleanup procedures
- Production-ready configuration templates

The setup ensures consistency across different development environments and provides a smooth path to production deployment.

---

*Document Version: 1.0*
*Last Updated: July 2025*
*Next Review: Upon implementation start*