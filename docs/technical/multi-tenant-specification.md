# Multi-Tenant Architecture Specification (Supabase Edition)

## Overview

This document outlines the complete technical specification for migrating the Starship Collection Manager from a single-user MongoDB application to a multi-tenant Supabase/PostgreSQL platform supporting multiple users with built-in authentication and row-level security.

## Executive Summary

**Goal**: Transform the current single-user collection manager into a scalable multi-user platform where:
- **Admins** control the master catalog of available ships via Supabase RLS policies
- **Users** manage their personal collections with automatic data isolation
- **Authentication** is handled by Supabase Auth with OAuth support
- **APIs** are auto-generated from PostgreSQL schema
- **Real-time features** available through Supabase subscriptions

**Timeline**: 3-month development project (reduced from 6 months due to Supabase capabilities)
**Risk Level**: Medium - Leveraging proven Supabase architecture
**Resource Requirement**: 60% development focus (reduced due to built-in features)

## Current Architecture Analysis

### Existing Data Model
The current `Starship` model combines:
- **Catalog data**: Ship metadata, images, technical specifications
- **Personal data**: Ownership status, pricing, condition, personal notes

### Limitations
- Single-user design with no authentication
- Mixed data responsibilities in single model
- No user management or permissions
- No data isolation capabilities

## Target Architecture

### Database Architecture (PostgreSQL with Supabase)

#### 1. Master Catalog (Admin-Controlled)
**Table**: `starships`

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
  specifications JSONB DEFAULT '{}',
  
  -- Admin metadata
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(issue, edition_id)
);
```

#### 2. User Collections (User-Controlled with RLS)
**Table**: `user_collections`

```sql
CREATE TABLE user_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  starship_id UUID REFERENCES starships(id) NOT NULL,
  
  -- Ownership tracking
  owned BOOLEAN DEFAULT false,
  wishlist BOOLEAN DEFAULT false,
  wishlist_priority INTEGER,
  on_order BOOLEAN DEFAULT false,
  not_interested BOOLEAN DEFAULT false,
  
  -- Personal pricing data
  price_paid DECIMAL(10,2),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  market_value DECIMAL(10,2),
  
  -- Personal condition tracking
  condition TEXT,
  condition_notes TEXT,
  condition_photos TEXT[] DEFAULT '{}',
  last_inspection_date DATE,
  personal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, starship_id)
);

-- Enable Row-Level Security
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own collections
CREATE POLICY "Users can view own collections" ON user_collections
  FOR SELECT USING (auth.uid() = user_id);
```

#### 3. User Sightings (Separated for better normalization)
**Table**: `user_sightings`

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

-- Enable RLS for sightings
ALTER TABLE user_sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sightings" ON user_sightings
  FOR SELECT USING (auth.uid() = user_id);
```

#### 4. User Management (Supabase Auth + Profiles)
**Built-in**: `auth.users` (managed by Supabase)
**Extended**: `user_profiles`

```sql
-- Supabase manages auth.users automatically
-- We extend with user_profiles for additional data

CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  
  -- Profile information
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- Role and permissions
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  
  -- Preferences (stored as JSON for flexibility)
  preferences JSONB DEFAULT '{
    "currency": "USD",
    "timezone": "UTC",
    "notifications": {
      "email": true,
      "newReleases": false,
      "priceAlerts": false
    }
  }',
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = OLD.role);
```

### Authentication System (Supabase Auth)

#### Supabase Client Configuration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Authentication helpers
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password })
}

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

// OAuth providers
export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({ provider: 'google' })
}

export const signInWithGitHub = async () => {
  return await supabase.auth.signInWithOAuth({ provider: 'github' })
}
```

#### Authentication Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protect authenticated routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*']
}
```

#### User Profile Management
```typescript
// hooks/useProfile.ts
import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['user_profiles']['Row']

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      getProfile()
    }
  }, [user])

  async function getProfile() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user!.id)

      if (error) throw error
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  return { profile, loading, updateProfile }
}
```

### API Architecture

#### Admin APIs (`/api/admin/`)
```typescript
// /api/admin/ships/index.ts - Master catalog management
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  switch (req.method) {
    case 'GET':
      // Get all master ships with admin metadata
      break
    case 'POST':
      // Create new ship in master catalog
      break
  }
}

// /api/admin/ships/[id].ts - Individual ship management
// /api/admin/users.ts - User account management
// /api/admin/analytics.ts - System-wide statistics
```

#### User APIs (`/api/user/`)
```typescript
// /api/user/collection/index.ts - Personal collection
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  switch (req.method) {
    case 'GET':
      // Get user's personal collection with master ship data joined
      const userCollection = await UserCollection.aggregate([
        { $match: { userId: new ObjectId(session.user.id) } },
        {
          $lookup: {
            from: 'master_starships',
            localField: 'masterShipId',
            foreignField: '_id',
            as: 'ship'
          }
        }
      ])
      break
  }
}

// /api/user/collection/[shipId].ts - Individual collection item
// /api/user/wishlist.ts - Wishlist management
// /api/user/profile.ts - User profile management
```

#### Shared APIs (`/api/catalog/`)
```typescript
// /api/catalog/ships.ts - Read-only master catalog for users
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Public read access to master catalog
  if (req.method === 'GET') {
    const ships = await MasterStarship.find({ isActive: true })
    return res.json({ success: true, data: ships })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
```

### Frontend Architecture

#### Route Structure
```
/                    # Public landing page
/login               # Authentication
/register            # User registration
/dashboard           # User's personal collection
/wishlist            # User's wishlist
/profile             # User profile management

/admin               # Admin portal (protected)
/admin/catalog       # Master ship catalog management
/admin/users         # User management
/admin/analytics     # System analytics
```

#### Component Architecture
```typescript
// components/admin/MasterCatalogManager.tsx
interface MasterCatalogManagerProps {
  ships: IMasterStarship[];
  onShipCreate: (ship: Partial<IMasterStarship>) => void;
  onShipUpdate: (id: string, updates: Partial<IMasterStarship>) => void;
  onShipDelete: (id: string) => void;
}

// components/user/PersonalCollection.tsx
interface PersonalCollectionProps {
  userCollection: (IUserCollection & { ship: IMasterStarship })[];
  onCollectionUpdate: (shipId: string, updates: Partial<IUserCollection>) => void;
  onAddToCollection: (masterShipId: string) => void;
}

// components/shared/ShipCard.tsx - Reusable ship display
interface ShipCardProps {
  ship: IMasterStarship;
  userCollection?: IUserCollection;
  mode: 'catalog' | 'collection' | 'admin';
  onAction?: (action: string, data: any) => void;
}
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
**Database & Authentication Setup**

1. **Week 1**: Database Architecture
   - Create new MongoDB collections
   - Define Mongoose models for all entities
   - Set up development database with sample data
   - Create data migration scripts

2. **Week 2**: Authentication System
   - Install and configure NextAuth.js
   - Implement user registration/login flows
   - Create authentication middleware
   - Set up protected routes

**Deliverables**: 
- Database schema with sample data
- Working authentication system
- Basic user registration/login

### Phase 2: API Layer (Weeks 3-4)
**Backend Services & Data Access**

3. **Week 3**: Core API Development
   - Implement admin APIs for master catalog
   - Create user APIs for personal collections
   - Set up permission middleware
   - Build data aggregation for user collections

4. **Week 4**: API Integration & Testing
   - Complete all CRUD operations
   - Implement error handling
   - Add API validation
   - Create API documentation

**Deliverables**:
- Complete API layer with documentation
- Permission system working
- Data validation and error handling

### Phase 3: Admin Interface (Weeks 5-6)
**Administrative Portal**

5. **Week 5**: Admin Portal Core
   - Master catalog management interface
   - Ship creation/editing forms
   - Image upload for ships
   - Bulk operations

6. **Week 6**: Admin Advanced Features
   - User management interface
   - System analytics dashboard
   - Data import/export tools
   - Admin configuration panel

**Deliverables**:
- Complete admin portal
- User management system
- Analytics and reporting

### Phase 4: User Interface (Weeks 7-8)
**User-Facing Application**

7. **Week 7**: User Collection Interface
   - Personal collection dashboard
   - Ship browsing and adding
   - Wishlist management
   - Personal data tracking

8. **Week 8**: Polish & Testing
   - Mobile responsiveness
   - Performance optimization
   - Integration testing
   - User acceptance testing

**Deliverables**:
- Complete user interface
- Mobile-responsive design
- Fully tested application

## Data Migration Strategy

### Migration Process

#### Step 1: Backup Current Data
```bash
# Create comprehensive backup
mongodump --db ship-collection-v2 --out ./backup-$(date +%Y%m%d)
```

#### Step 2: Split Current Data
```javascript
// scripts/migrate-to-multi-tenant.js
async function migrateData() {
  // 1. Create master ships from current starships
  const starships = await Starship.find({})
  
  for (const ship of starships) {
    await MasterStarship.create({
      issue: ship.issue,
      edition: ship.edition,
      shipName: ship.shipName,
      faction: ship.faction,
      franchise: ship.franchise,
      // ... other catalog fields
      createdBy: adminUserId,
      isActive: true
    })
  }
  
  // 2. Create admin user collection entries
  for (const ship of starships) {
    const masterShip = await MasterStarship.findOne({
      issue: ship.issue,
      edition: ship.edition
    })
    
    await UserCollection.create({
      userId: adminUserId,
      masterShipId: masterShip._id,
      owned: ship.owned,
      wishlist: ship.wishlist,
      // ... other personal fields
    })
  }
}
```

#### Step 3: Create Admin User
```javascript
// Create first admin user from current data
const adminUser = await User.create({
  username: 'admin',
  email: 'admin@example.com',
  passwordHash: await hash('temp-password', 12),
  role: 'admin',
  isActive: true,
  isVerified: true
})
```

### Rollback Strategy

1. **Backup Preservation**: Keep original collections with timestamp
2. **Rollback Script**: Automated restoration to previous state
3. **Data Validation**: Verification scripts to ensure migration success
4. **Staged Deployment**: Feature flags for gradual rollout

## Security Considerations

### Authentication Security
- Password hashing with bcrypt (minimum 12 rounds)
- Session management via NextAuth.js
- CSRF protection on state-changing operations
- Rate limiting on authentication endpoints

### Authorization Security
- Role-based access control (RBAC)
- API endpoint protection with middleware
- Data isolation via user-scoped queries
- Admin operation audit logging

### Data Security
- Input validation on all user inputs
- SQL injection prevention via Mongoose
- File upload security (image/PDF validation)
- Personal data encryption for sensitive fields

## Performance Considerations

### Database Optimization
```javascript
// Optimized indexes for multi-tenant queries
// Master catalog indexes
db.master_starships.createIndex({ "edition": 1, "faction": 1 })
db.master_starships.createIndex({ "franchise": 1, "isActive": 1 })

// User collection indexes  
db.user_collections.createIndex({ "userId": 1, "owned": 1 })
db.user_collections.createIndex({ "userId": 1, "wishlist": 1 })
db.user_collections.createIndex({ "masterShipId": 1 })
```

### Query Optimization
```javascript
// Efficient user collection queries with joins
const getUserCollection = async (userId: string) => {
  return await UserCollection.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    {
      $lookup: {
        from: 'master_starships',
        localField: 'masterShipId',
        foreignField: '_id',
        as: 'ship'
      }
    },
    { $unwind: '$ship' },
    { $match: { 'ship.isActive': true } }
  ])
}
```

### Caching Strategy
- Redis for session storage
- Application-level caching for master catalog
- CDN for static assets (images, PDFs)
- Database query result caching

## Testing Strategy

### Unit Testing
- Model validation tests
- API endpoint tests
- Authentication/authorization tests
- Data transformation tests

### Integration Testing
- Database integration tests
- API workflow tests
- Authentication flow tests
- Permission enforcement tests

### End-to-End Testing
- User registration/login flows
- Collection management workflows
- Admin portal operations
- Cross-user data isolation verification

## Deployment Strategy

### Environment Setup
- **Development**: Local MongoDB + Next.js dev server
- **Staging**: Docker containers with test data
- **Production**: Docker Compose with MongoDB cluster

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Multi-Tenant App
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Run E2E tests
        run: npm run test:e2e
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: docker-compose -f docker-compose.staging.yml up -d
```

## Success Metrics

### Technical Metrics
- **Response Time**: <2 seconds for all user operations
- **Scalability**: Support 100+ concurrent users
- **Uptime**: 99.9% availability
- **Security**: Zero data breaches, proper isolation

### Business Metrics
- **User Growth**: Track user registration and retention
- **Usage Patterns**: Monitor collection management activity
- **Performance**: Database query optimization success
- **Support**: Reduced support tickets vs single-user version

## Risk Mitigation

### High-Risk Areas
1. **Data Migration**: Complex transformation with rollback plan
2. **Performance**: Multi-user database queries require optimization
3. **Security**: Authentication and authorization critical for data isolation
4. **User Experience**: Major interface changes may confuse existing users

### Mitigation Strategies
1. **Thorough Testing**: Comprehensive test suite before migration
2. **Gradual Rollout**: Feature flags for staged deployment
3. **Documentation**: Detailed user guides for new features
4. **Support Plan**: Dedicated support during transition period

## Future Enhancements

### Phase 2 Features (Post-Launch)
- Collection sharing between users
- Social features (friend collections, recommendations)
- Marketplace integration for buying/selling
- Advanced analytics and reporting
- Mobile app development

### Scalability Considerations
- Database sharding for large user bases
- Microservices architecture for component scaling
- CDN integration for global performance
- Real-time features with WebSocket support

---

*Document Version: 1.0*
*Last Updated: July 2025*
*Next Review: Upon project approval*