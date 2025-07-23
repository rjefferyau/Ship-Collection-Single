# Supabase Multi-Tenant Migration Plan

## Overview

This document outlines the comprehensive plan for migrating the Starship Collection Manager from a single-user MongoDB application to a multi-tenant Supabase (PostgreSQL) platform. This migration will maintain the current single-user version while creating a separate multi-tenant application.

## Executive Summary

**Goal**: Create a scalable multi-tenant platform using Supabase while preserving the existing single-user application
**Approach**: Repository separation with independent development paths
**Timeline**: 3-month documentation and setup phase, followed by 3-month development phase
**Risk Level**: Low - No changes to existing application during planning phase

## Repository Separation Strategy

### Current Repository: `Ship-Collection-Single`
- **Purpose**: Maintain stable single-user application
- **Technology**: Next.js + MongoDB + Mongoose
- **Development**: Bug fixes and minor enhancements only
- **Users**: Current single-user installations

### New Repository: `Ship-Collection-Multi-Tenant`
- **Purpose**: New multi-tenant platform
- **Technology**: Next.js + Supabase (PostgreSQL) + Docker
- **Development**: Full multi-tenant feature development
- **Users**: New multi-user installations

### Separation Process

#### Phase 1: Documentation & Planning (Current)
1. **Complete Migration Documentation**
   - Technical specifications
   - Database schema design
   - Docker setup instructions
   - Migration scripts planning

2. **Repository Preparation**
   - Finalize current repository state
   - Create comprehensive documentation
   - Prepare for cloning/forking

#### Phase 2: Repository Creation
1. **Clone Current Repository**
   ```bash
   git clone https://github.com/user/Ship-Collection-Single.git Ship-Collection-Multi-Tenant
   cd Ship-Collection-Multi-Tenant
   git remote set-url origin https://github.com/user/Ship-Collection-Multi-Tenant.git
   ```

2. **Repository Configuration**
   - Update package.json metadata
   - Modify README for multi-tenant focus
   - Add Supabase-specific documentation
   - Configure Docker environment

## Why Supabase for Multi-Tenant Architecture

### Technical Advantages
1. **Built-in Authentication**
   - OAuth providers (Google, GitHub, etc.)
   - Magic link authentication
   - JWT token management
   - User management dashboard

2. **Row-Level Security (RLS)**
   - Automatic data isolation between users
   - Policy-based access control
   - No application-level user filtering needed
   - Secure by default

3. **Auto-Generated APIs**
   - REST API automatically created from schema
   - GraphQL API support
   - Real-time subscriptions
   - Automatic OpenAPI documentation

4. **PostgreSQL Benefits**
   - Better for complex multi-user queries
   - ACID compliance for data integrity
   - Advanced indexing and performance
   - JSON support for flexible data

5. **Developer Experience**
   - Auto-generated TypeScript types
   - Local development with Docker
   - Migration management
   - Built-in admin dashboard

### Operational Advantages
1. **Scalability**
   - Handles hundreds of concurrent users
   - Automatic scaling and load balancing
   - CDN for global performance
   - Connection pooling

2. **Maintenance**
   - Managed database service
   - Automatic backups
   - Security updates handled
   - Monitoring and analytics

3. **Cost Effectiveness**
   - Free tier for development
   - Pay-as-you-scale pricing
   - No infrastructure management
   - Reduced operational overhead

## Database Architecture Design

### Current MongoDB Structure Analysis

**Strengths to Preserve:**
- Rich starship data model with 30+ fields
- Flexible schema for varying data types
- Effective indexing strategy
- Well-defined relationships

**Limitations to Address:**
- Single-user design
- Mixed personal/catalog data in same documents
- No built-in user management
- Complex aggregation queries for statistics

### Target PostgreSQL Schema

#### 1. Master Catalog Tables

**starships** (Admin-controlled catalog)
```sql
CREATE TABLE starships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue TEXT NOT NULL,
  edition_id UUID REFERENCES editions(id),
  ship_name TEXT NOT NULL,
  faction TEXT NOT NULL,
  franchise TEXT,
  manufacturer_id UUID REFERENCES manufacturers(id),
  collection_type TEXT,
  release_date DATE,
  image_url TEXT,
  magazine_pdf_url TEXT,
  retail_price DECIMAL(10,2),
  description TEXT,
  specifications JSONB, -- For flexible technical specs
  
  -- Admin metadata
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  tags TEXT[], -- For categorization
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(issue, edition_id)
);
```

**editions**
```sql
CREATE TABLE editions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  internal_name TEXT NOT NULL UNIQUE,
  description TEXT,
  retail_price DECIMAL(10,2),
  franchise TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(name, franchise)
);
```

**manufacturers**
```sql
CREATE TABLE manufacturers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  website TEXT,
  country TEXT,
  franchises TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. User Collection Tables

**user_collections** (Personal ownership data)
```sql
CREATE TABLE user_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  starship_id UUID REFERENCES starships(id) NOT NULL,
  
  -- Ownership status
  owned BOOLEAN DEFAULT false,
  wishlist BOOLEAN DEFAULT false,
  wishlist_priority INTEGER,
  on_order BOOLEAN DEFAULT false,
  not_interested BOOLEAN DEFAULT false,
  
  -- Pricing data (personal)
  price_paid DECIMAL(10,2),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  market_value DECIMAL(10,2),
  
  -- Condition tracking (personal)
  condition TEXT,
  condition_notes TEXT,
  condition_photos TEXT[], -- URLs to uploaded photos
  last_inspection_date DATE,
  personal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, starship_id)
);
```

**user_sightings** (Price tracking)
```sql
CREATE TABLE user_sightings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  starship_id UUID REFERENCES starships(id) NOT NULL,
  location TEXT NOT NULL,
  sighting_date DATE DEFAULT CURRENT_DATE,
  price DECIMAL(10,2),
  url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. User Management Tables

**user_profiles** (Extended user information)
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  
  -- Preferences
  preferences JSONB DEFAULT '{}',
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row-Level Security Policies

#### User Collection Security
```sql
-- Enable RLS on user_collections
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own collections
CREATE POLICY "Users can view own collections" ON user_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON user_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON user_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON user_collections
  FOR DELETE USING (auth.uid() = user_id);
```

#### Master Catalog Security
```sql
-- Enable RLS on starships
ALTER TABLE starships ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active starships
CREATE POLICY "All users can view active starships" ON starships
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Only admins can modify starships
CREATE POLICY "Admins can modify starships" ON starships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### User Profile Security
```sql
-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = OLD.role);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Indexes for Performance

```sql
-- Starships indexes
CREATE INDEX idx_starships_edition ON starships(edition_id);
CREATE INDEX idx_starships_faction ON starships(faction);
CREATE INDEX idx_starships_franchise ON starships(franchise);
CREATE INDEX idx_starships_manufacturer ON starships(manufacturer_id);
CREATE INDEX idx_starships_active ON starships(is_active);

-- User collections indexes
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_starship ON user_collections(starship_id);
CREATE INDEX idx_user_collections_owned ON user_collections(user_id, owned);
CREATE INDEX idx_user_collections_wishlist ON user_collections(user_id, wishlist);
CREATE INDEX idx_user_collections_composite ON user_collections(user_id, owned, wishlist, on_order);

-- User sightings indexes
CREATE INDEX idx_user_sightings_user ON user_sightings(user_id);
CREATE INDEX idx_user_sightings_starship ON user_sightings(starship_id);
CREATE INDEX idx_user_sightings_date ON user_sightings(sighting_date);

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
```

## Docker Development Environment

### Docker Compose Configuration

**docker-compose.yml** (for multi-tenant development)
```yaml
version: '3.8'

services:
  # Supabase local development stack
  supabase:
    image: supabase/postgres:14.1.0.21
    container_name: supabase-db
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - supabase_db_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d

  # Supabase Auth & API
  supabase-auth:
    image: supabase/gotrue:v2.100.0
    container_name: supabase-auth
    depends_on:
      - supabase
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:postgres@supabase:5432/postgres?search_path=auth
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_URI_ALLOW_LIST: http://localhost:3000
      GOTRUE_JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_ADMIN_ROLES: admin
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_MAILER_AUTOCONFIRM: true
    ports:
      - "9999:9999"

  # PostgREST API
  supabase-rest:
    image: postgrest/postgrest:v11.2.0
    container_name: supabase-rest
    depends_on:
      - supabase
    environment:
      PGRST_DB_URI: postgres://postgres:postgres@supabase:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
      PGRST_DB_USE_LEGACY_GUCS: false
    ports:
      - "3001:3000"

  # Next.js application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ship-collection-multi-tenant-app
    depends_on:
      - supabase
      - supabase-auth
      - supabase-rest
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNzgxODYxMywiZXhwIjoxOTQzMzk0NjEzfQ.tXCaVE0IxNOdMxFqyFQQq0wGFyMdHQOT5ZCG8UhjdT4
      - SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjI3ODE4NjEzLCJleHAiOjE5NDMzOTQ2MTN9.C2tKKjWMp_r0X1SZjQlHF_4phj9Y1qLrjJPmWv4g9VI
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev

volumes:
  supabase_db_data:
```

### Development Scripts

**package.json additions**
```json
{
  "scripts": {
    "supabase:start": "docker-compose up -d supabase supabase-auth supabase-rest",
    "supabase:stop": "docker-compose down",
    "supabase:reset": "docker-compose down -v && docker-compose up -d",
    "supabase:logs": "docker-compose logs -f supabase",
    "dev:supabase": "docker-compose up",
    "migrate:create": "supabase migration new",
    "migrate:up": "supabase db push",
    "migrate:reset": "supabase db reset",
    "types:generate": "supabase gen types typescript --local > types/database.ts"
  }
}
```

## Data Migration Strategy

### Migration Planning

#### Phase 1: Schema Preparation
1. **Create PostgreSQL Schema**
   - Run schema creation scripts
   - Set up RLS policies
   - Create indexes
   - Verify schema integrity

2. **Data Mapping Analysis**
   - Map MongoDB collections to PostgreSQL tables
   - Identify data transformation requirements
   - Plan reference resolution (ObjectIds to UUIDs)
   - Design data validation checks

#### Phase 2: Migration Scripts

**MongoDB Export Script**
```javascript
// scripts/export-mongodb-data.js
const mongoose = require('mongoose');
const fs = require('fs');

// Export current MongoDB data to JSON files
async function exportData() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Export starships
  const starships = await Starship.find({}).lean();
  fs.writeFileSync('./migration/starships.json', JSON.stringify(starships, null, 2));
  
  // Export editions
  const editions = await Edition.find({}).lean();
  fs.writeFileSync('./migration/editions.json', JSON.stringify(editions, null, 2));
  
  // Export manufacturers
  const manufacturers = await Manufacturer.find({}).lean();
  fs.writeFileSync('./migration/manufacturers.json', JSON.stringify(manufacturers, null, 2));
  
  console.log('Export completed');
}
```

**PostgreSQL Import Script**
```sql
-- scripts/import-data.sql
-- Import editions first (referenced by starships)
INSERT INTO editions (name, internal_name, franchise, retail_price, is_default)
SELECT 
  name,
  internal_name,
  franchise,
  retail_price,
  is_default
FROM json_populate_recordset(null::editions, '[JSON_DATA]');

-- Import manufacturers
INSERT INTO manufacturers (name, description, website, country, franchises)
SELECT 
  name,
  description,
  website,
  country,
  franchises
FROM json_populate_recordset(null::manufacturers, '[JSON_DATA]');

-- Import starships with proper foreign key references
INSERT INTO starships (
  issue, ship_name, faction, franchise, collection_type,
  release_date, image_url, magazine_pdf_url, retail_price,
  edition_id, manufacturer_id, is_active
)
SELECT 
  issue,
  ship_name,
  faction,
  franchise,
  collection_type,
  release_date,
  image_url,
  magazine_pdf_url,
  retail_price,
  e.id as edition_id,
  m.id as manufacturer_id,
  true as is_active
FROM json_populate_recordset(null::temp_starships, '[JSON_DATA]') s
LEFT JOIN editions e ON e.internal_name = s.edition_internal_name
LEFT JOIN manufacturers m ON m.name = s.manufacturer;
```

#### Phase 3: Data Validation

**Validation Checks**
```sql
-- Verify data integrity after migration
SELECT 
  'starships' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN edition_id IS NULL THEN 1 END) as missing_editions,
  COUNT(CASE WHEN manufacturer_id IS NULL THEN 1 END) as missing_manufacturers
FROM starships

UNION ALL

SELECT 
  'editions' as table_name,
  COUNT(*) as total_records,
  0 as missing_editions,
  0 as missing_manufacturers
FROM editions

UNION ALL

SELECT 
  'manufacturers' as table_name,
  COUNT(*) as total_records,
  0 as missing_editions,
  0 as missing_manufacturers
FROM manufacturers;
```

### User Data Migration

#### Creating Admin User
```sql
-- Create initial admin user from current single-user data
INSERT INTO user_profiles (user_id, username, role, is_active)
VALUES (
  auth.uid(), -- Current authenticated user
  'admin',
  'admin',
  true
);

-- Migrate current single-user collection as admin's collection
INSERT INTO user_collections (
  user_id, starship_id, owned, wishlist, wishlist_priority,
  on_order, not_interested, price_paid, purchase_date,
  purchase_price, market_value, condition, condition_notes,
  personal_notes
)
SELECT 
  auth.uid() as user_id,
  s.id as starship_id,
  owned, wishlist, wishlist_priority,
  on_order, not_interested, price_paid, order_date,
  purchase_price, market_value, condition, condition_notes,
  notes
FROM temp_starship_data t
JOIN starships s ON s.issue = t.issue AND s.edition_id = (
  SELECT id FROM editions WHERE internal_name = t.edition_internal_name
);
```

## Development Workflow

### Parallel Development Strategy

#### Single-User Repository (Maintenance Mode)
- **Focus**: Bug fixes, security updates, stability
- **Changes**: Minimal, well-tested modifications only
- **Deployment**: Existing deployment pipeline
- **Users**: Current single-user installations

#### Multi-Tenant Repository (Active Development)
- **Focus**: New features, scalability, user management
- **Changes**: Major architectural modifications
- **Deployment**: New Docker-based pipeline
- **Users**: New multi-tenant installations

### Synchronization Strategy

#### Bug Fixes
```bash
# In multi-tenant repository
git remote add single-user https://github.com/user/Ship-Collection-Single.git
git fetch single-user

# Cherry-pick bug fixes from single-user
git cherry-pick <commit-hash>

# Or apply fixes to both repositories independently
```

#### Feature Backporting
- Evaluate multi-tenant features for single-user applicability
- Create simplified versions that don't require multi-tenant architecture
- Apply changes to single-user repository if beneficial

### Documentation Strategy

#### Single-User Repository
- Maintain current documentation
- Add note about multi-tenant version availability
- Focus on simplicity and single-user use cases

#### Multi-Tenant Repository
- Comprehensive multi-tenant documentation
- User management and admin guides
- Docker deployment instructions
- Migration guides for single-user to multi-tenant

## Success Metrics

### Technical Metrics
- **Performance**: API response times < 2 seconds
- **Scalability**: Support 100+ concurrent users
- **Security**: Zero data leakage between users
- **Reliability**: 99.9% uptime
- **Data Integrity**: Zero data loss during migration

### Development Metrics
- **Code Quality**: 80%+ test coverage
- **Documentation**: Comprehensive guides for all features
- **Developer Experience**: Easy local development setup
- **Maintenance**: Reduced operational overhead vs MongoDB

### User Metrics
- **Adoption**: User registration and retention rates
- **Usage**: Active user engagement metrics
- **Support**: Reduced support ticket volume
- **Satisfaction**: User feedback and ratings

## Risk Assessment & Mitigation

### High-Risk Areas

1. **Data Migration Complexity**
   - **Risk**: Data loss or corruption during migration
   - **Mitigation**: Comprehensive testing, rollback plans, staged migration

2. **User Experience Changes**
   - **Risk**: User confusion with new multi-tenant features
   - **Mitigation**: Thorough documentation, migration guides, user support

3. **Performance Impact**
   - **Risk**: PostgreSQL queries may perform differently than MongoDB
   - **Mitigation**: Performance testing, query optimization, proper indexing

4. **Authentication Integration**
   - **Risk**: Supabase auth integration issues
   - **Mitigation**: Thorough testing, staged rollout, fallback options

### Medium-Risk Areas

1. **Docker Environment Complexity**
   - **Risk**: Local development setup difficulties
   - **Mitigation**: Detailed documentation, automated scripts, support

2. **Feature Parity**
   - **Risk**: Missing features from original application
   - **Mitigation**: Feature checklist, thorough testing, user feedback

### Mitigation Strategies

1. **Comprehensive Testing**
   - Unit tests for all new components
   - Integration tests for API endpoints
   - End-to-end tests for user workflows
   - Performance tests under load

2. **Staged Deployment**
   - Local development environment first
   - Staging environment with test data
   - Limited production rollout
   - Full production deployment

3. **Documentation & Support**
   - Detailed migration guides
   - Video tutorials for complex processes
   - Dedicated support during transition
   - Community forums for assistance

## Timeline & Milestones

### Phase 1: Documentation & Planning (Month 1)
- ✅ Week 1: Create comprehensive migration documentation
- Week 2: Design PostgreSQL schema and RLS policies
- Week 3: Plan Docker development environment
- Week 4: Create data migration scripts and validation

### Phase 2: Repository Preparation (Month 2)
- Week 1: Finalize current repository documentation
- Week 2: Create repository separation strategy
- Week 3: Prepare Docker configurations
- Week 4: Create development workflow documentation

### Phase 3: Implementation Preparation (Month 3)
- Week 1: Clone repository and initial setup
- Week 2: Configure Supabase local development
- Week 3: Test data migration scripts
- Week 4: Final documentation review and approval

### Future Development (Months 4-6)
- Month 4: Authentication and basic multi-user functionality
- Month 5: Admin portal and user management
- Month 6: Advanced features and production deployment

## Conclusion

This Supabase migration plan provides a comprehensive roadmap for transforming the Starship Collection Manager into a scalable multi-tenant platform while preserving the existing single-user application. The approach prioritizes safety, documentation, and parallel development to minimize risk and maximize success.

The use of Supabase significantly reduces development complexity by providing built-in authentication, automatic API generation, and Row-Level Security for data isolation. The Docker-based development environment ensures consistency across different development setups.

**Next Steps:**
1. Review and approve this migration plan
2. Begin PostgreSQL schema design and documentation
3. Create Docker development environment configuration
4. Prepare for repository separation and cloning process

---

*Document Version: 1.0*
*Last Updated: July 2025*
*Next Review: Upon implementation phase start*