# PostgreSQL Schema Design for Multi-Tenant Architecture

## Overview

This document provides the complete PostgreSQL schema design for the multi-tenant Starship Collection Manager, including table structures, relationships, indexes, and Row-Level Security (RLS) policies.

## Design Principles

### Data Separation Strategy
- **Master Catalog**: Admin-controlled reference data (starships, editions, manufacturers)
- **User Collections**: Personal ownership data isolated by user
- **Row-Level Security**: Automatic enforcement of data isolation
- **Referential Integrity**: Foreign key constraints maintain data consistency

### Security-First Approach
- **Authentication**: Handled by Supabase Auth
- **Authorization**: Enforced through RLS policies
- **Data Isolation**: Users can only access their own collection data
- **Admin Controls**: Separate policies for administrative functions

## Complete Schema Definition

### 1. Authentication & User Management

#### Supabase Auth Users (Built-in)
```sql
-- This table is managed by Supabase Auth
-- auth.users contains:
-- - id (UUID)
-- - email
-- - encrypted_password
-- - email_confirmed_at
-- - created_at
-- - updated_at
-- etc.
```

#### User Profiles (Extended Information)
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Profile information
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  
  -- Role and permissions
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  
  -- User preferences stored as JSON
  preferences JSONB DEFAULT '{
    "currency": "USD",
    "timezone": "UTC",
    "theme": "light",
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
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Master Catalog Tables (Admin-Controlled)

#### Franchises
```sql
CREATE TABLE franchises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_franchises_updated_at
  BEFORE UPDATE ON franchises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Editions
```sql
CREATE TABLE editions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  internal_name TEXT NOT NULL UNIQUE,
  description TEXT,
  retail_price DECIMAL(10,2),
  
  -- Franchise relationship
  franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
  franchise TEXT NOT NULL, -- Denormalized for backward compatibility
  
  -- Configuration
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(name, franchise)
);

CREATE TRIGGER update_editions_updated_at
  BEFORE UPDATE ON editions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate internal_name automatically if not provided
CREATE OR REPLACE FUNCTION generate_edition_internal_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.internal_name IS NULL OR NEW.internal_name = '' THEN
    -- Create slug-like internal name from name and franchise
    NEW.internal_name := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name || '-' || NEW.franchise, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_edition_internal_name_trigger
  BEFORE INSERT OR UPDATE ON editions
  FOR EACH ROW
  EXECUTE FUNCTION generate_edition_internal_name();
```

#### Manufacturers
```sql
CREATE TABLE manufacturers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  website TEXT,
  country TEXT,
  
  -- Associated franchises (array for flexibility)
  franchises TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_manufacturers_updated_at
  BEFORE UPDATE ON manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Collection Types
```sql
CREATE TABLE collection_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_collection_types_updated_at
  BEFORE UPDATE ON collection_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Starships (Master Catalog)
```sql
CREATE TABLE starships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic identification
  issue TEXT NOT NULL,
  ship_name TEXT NOT NULL,
  faction TEXT NOT NULL,
  
  -- Relationships (with fallback text fields for backward compatibility)
  edition_id UUID REFERENCES editions(id) ON DELETE SET NULL,
  edition TEXT NOT NULL, -- Denormalized
  edition_internal_name TEXT, -- For lookups
  
  franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
  franchise TEXT, -- Denormalized
  
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL,
  manufacturer TEXT, -- Denormalized
  
  collection_type_id UUID REFERENCES collection_types(id) ON DELETE SET NULL,
  collection_type TEXT, -- Denormalized
  
  -- Product information
  release_date DATE,
  retail_price DECIMAL(10,2),
  description TEXT,
  
  -- Media
  image_url TEXT,
  magazine_pdf_url TEXT,
  
  -- Technical specifications (flexible JSON structure)
  specifications JSONB DEFAULT '{}',
  
  -- Admin metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}', -- For categorization and search
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(issue, edition_id),
  
  -- Check constraints
  CONSTRAINT valid_retail_price CHECK (retail_price >= 0)
);

CREATE TRIGGER update_starships_updated_at
  BEFORE UPDATE ON starships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to sync denormalized fields
CREATE OR REPLACE FUNCTION sync_starship_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync edition fields
  IF NEW.edition_id IS NOT NULL THEN
    SELECT name, internal_name, franchise 
    INTO NEW.edition, NEW.edition_internal_name, NEW.franchise
    FROM editions WHERE id = NEW.edition_id;
  END IF;
  
  -- Sync manufacturer field
  IF NEW.manufacturer_id IS NOT NULL THEN
    SELECT name INTO NEW.manufacturer
    FROM manufacturers WHERE id = NEW.manufacturer_id;
  END IF;
  
  -- Sync collection_type field
  IF NEW.collection_type_id IS NOT NULL THEN
    SELECT name INTO NEW.collection_type
    FROM collection_types WHERE id = NEW.collection_type_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_starship_references_trigger
  BEFORE INSERT OR UPDATE ON starships
  FOR EACH ROW
  EXECUTE FUNCTION sync_starship_references();
```

### 3. User Collection Tables

#### User Collections (Personal Ownership Data)
```sql
CREATE TABLE user_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  starship_id UUID REFERENCES starships(id) ON DELETE CASCADE NOT NULL,
  
  -- Ownership status
  owned BOOLEAN DEFAULT false,
  wishlist BOOLEAN DEFAULT false,
  wishlist_priority INTEGER,
  on_order BOOLEAN DEFAULT false,
  not_interested BOOLEAN DEFAULT false,
  
  -- Pricing data (personal)
  price_paid DECIMAL(10,2),
  purchase_date DATE,
  purchase_price DECIMAL(10,2), -- Alternative to price_paid
  market_value DECIMAL(10,2),
  order_date DATE, -- When ordered (if on_order = true)
  
  -- Condition tracking (personal)
  condition TEXT CHECK (condition IN (
    'Mint', 'Near Mint', 'Excellent', 'Very Good', 
    'Good', 'Fair', 'Poor', 'Damaged'
  )),
  condition_notes TEXT,
  condition_photos TEXT[] DEFAULT '{}', -- URLs to uploaded photos
  last_inspection_date DATE,
  
  -- Personal notes
  personal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, starship_id),
  
  -- Check constraints
  CONSTRAINT valid_prices CHECK (
    price_paid >= 0 AND 
    purchase_price >= 0 AND 
    market_value >= 0
  ),
  CONSTRAINT valid_wishlist_priority CHECK (wishlist_priority > 0)
);

CREATE TRIGGER update_user_collections_updated_at
  BEFORE UPDATE ON user_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### User Sightings (Price Tracking)
```sql
CREATE TABLE user_sightings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  starship_id UUID REFERENCES starships(id) ON DELETE CASCADE NOT NULL,
  
  -- Sighting information
  location TEXT NOT NULL, -- Store name, website, etc.
  sighting_date DATE DEFAULT CURRENT_DATE,
  price DECIMAL(10,2),
  url TEXT, -- Link to listing if available
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Check constraints
  CONSTRAINT valid_sighting_price CHECK (price >= 0)
);
```

### 4. System Tables

#### Migration History
```sql
CREATE TABLE migration_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Migration metadata
  mongodb_records_processed INTEGER,
  postgresql_records_created INTEGER,
  data_validation_passed BOOLEAN
);
```

## Indexes for Performance

### Primary Indexes
```sql
-- Starships performance indexes
CREATE INDEX idx_starships_edition ON starships(edition_id);
CREATE INDEX idx_starships_edition_text ON starships(edition);
CREATE INDEX idx_starships_faction ON starships(faction);
CREATE INDEX idx_starships_franchise ON starships(franchise_id);
CREATE INDEX idx_starships_franchise_text ON starships(franchise);
CREATE INDEX idx_starships_manufacturer ON starships(manufacturer_id);
CREATE INDEX idx_starships_active ON starships(is_active);
CREATE INDEX idx_starships_tags ON starships USING GIN(tags);
CREATE INDEX idx_starships_created_by ON starships(created_by);

-- Full-text search index for starships
CREATE INDEX idx_starships_search ON starships USING GIN(
  to_tsvector('english', ship_name || ' ' || COALESCE(description, ''))
);

-- User collections performance indexes
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_starship ON user_collections(starship_id);
CREATE INDEX idx_user_collections_owned ON user_collections(user_id, owned) WHERE owned = true;
CREATE INDEX idx_user_collections_wishlist ON user_collections(user_id, wishlist) WHERE wishlist = true;
CREATE INDEX idx_user_collections_on_order ON user_collections(user_id, on_order) WHERE on_order = true;
CREATE INDEX idx_user_collections_priority ON user_collections(user_id, wishlist_priority) 
  WHERE wishlist = true AND wishlist_priority IS NOT NULL;

-- Composite index for common queries
CREATE INDEX idx_user_collections_status_composite ON user_collections(
  user_id, owned, wishlist, on_order, not_interested
);

-- User sightings indexes
CREATE INDEX idx_user_sightings_user ON user_sightings(user_id);
CREATE INDEX idx_user_sightings_starship ON user_sightings(starship_id);
CREATE INDEX idx_user_sightings_date ON user_sightings(sighting_date DESC);
CREATE INDEX idx_user_sightings_user_starship ON user_sightings(user_id, starship_id);

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Reference table indexes
CREATE INDEX idx_editions_franchise ON editions(franchise_id);
CREATE INDEX idx_editions_active ON editions(is_active);
CREATE INDEX idx_editions_internal_name ON editions(internal_name);
```

## Row-Level Security Policies

### Enable RLS on All User Tables
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE starships ENABLE ROW LEVEL SECURITY;
ALTER TABLE editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_types ENABLE ROW LEVEL SECURITY;
```

### User Profile Policies
```sql
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = OLD.role); -- Can't change own role

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### User Collection Policies
```sql
-- Users can only access their own collections
CREATE POLICY "Users can view own collections" ON user_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON user_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON user_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON user_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all collections (for analytics)
CREATE POLICY "Admins can view all collections" ON user_collections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### User Sightings Policies
```sql
-- Users can only access their own sightings
CREATE POLICY "Users can view own sightings" ON user_sightings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sightings" ON user_sightings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sightings" ON user_sightings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sightings" ON user_sightings
  FOR DELETE USING (auth.uid() = user_id);
```

### Master Catalog Policies
```sql
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

-- Similar policies for editions, manufacturers, etc.
CREATE POLICY "All users can view active editions" ON editions
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins can modify editions" ON editions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All users can view active manufacturers" ON manufacturers
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins can modify manufacturers" ON manufacturers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All users can view active franchises" ON franchises
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins can modify franchises" ON franchises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All users can view active collection_types" ON collection_types
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Admins can modify collection_types" ON collection_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

## Views for Common Queries

### User Collection View with Starship Details
```sql
CREATE VIEW user_collection_details AS
SELECT 
  uc.*,
  s.issue,
  s.ship_name,
  s.faction,
  s.franchise,
  s.manufacturer,
  s.edition,
  s.collection_type,
  s.release_date,
  s.retail_price,
  s.image_url,
  s.magazine_pdf_url,
  s.description,
  s.specifications
FROM user_collections uc
JOIN starships s ON uc.starship_id = s.id
WHERE s.is_active = true;
```

### User Statistics View
```sql
CREATE VIEW user_collection_stats AS
SELECT 
  uc.user_id,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE uc.owned = true) as owned_count,
  COUNT(*) FILTER (WHERE uc.wishlist = true) as wishlist_count,
  COUNT(*) FILTER (WHERE uc.on_order = true) as on_order_count,
  COUNT(*) FILTER (WHERE uc.not_interested = true) as not_interested_count,
  ROUND(
    (COUNT(*) FILTER (WHERE uc.owned = true)::decimal / COUNT(*)) * 100, 
    2
  ) as owned_percentage,
  SUM(uc.price_paid) as total_spent,
  AVG(uc.price_paid) as average_price_paid,
  SUM(uc.market_value) as total_market_value
FROM user_collections uc
JOIN starships s ON uc.starship_id = s.id
WHERE s.is_active = true
GROUP BY uc.user_id;
```

### Admin Analytics View
```sql
CREATE VIEW admin_system_stats AS
SELECT 
  (SELECT COUNT(*) FROM user_profiles WHERE is_active = true) as active_users,
  (SELECT COUNT(*) FROM starships WHERE is_active = true) as total_starships,
  (SELECT COUNT(*) FROM user_collections) as total_collection_items,
  (SELECT COUNT(*) FROM user_collections WHERE owned = true) as total_owned_items,
  (SELECT COUNT(*) FROM user_sightings) as total_sightings,
  (SELECT COUNT(DISTINCT user_id) FROM user_collections WHERE created_at > NOW() - INTERVAL '30 days') as active_users_30d;
```

## Data Migration Support

### Temporary Migration Tables
```sql
-- Temporary table for MongoDB data import
CREATE TABLE temp_mongodb_starships (
  mongodb_id TEXT,
  issue TEXT,
  edition TEXT,
  edition_internal_name TEXT,
  ship_name TEXT,
  faction TEXT,
  franchise TEXT,
  manufacturer TEXT,
  collection_type TEXT,
  release_date DATE,
  image_url TEXT,
  magazine_pdf_url TEXT,
  retail_price DECIMAL(10,2),
  owned BOOLEAN,
  wishlist BOOLEAN,
  wishlist_priority INTEGER,
  on_order BOOLEAN,
  not_interested BOOLEAN,
  price_paid DECIMAL(10,2),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  market_value DECIMAL(10,2),
  condition TEXT,
  condition_notes TEXT,
  personal_notes TEXT,
  sightings JSONB
);
```

### Migration Functions
```sql
-- Function to create user collection from migrated data
CREATE OR REPLACE FUNCTION migrate_user_collection(
  p_user_id UUID,
  p_mongodb_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_starship_id UUID;
  v_collection_id UUID;
BEGIN
  -- Find or create starship
  SELECT id INTO v_starship_id
  FROM starships
  WHERE issue = (p_mongodb_data->>'issue')
    AND edition = (p_mongodb_data->>'edition');
  
  -- Create user collection entry
  INSERT INTO user_collections (
    user_id, starship_id, owned, wishlist, wishlist_priority,
    on_order, not_interested, price_paid, purchase_date,
    purchase_price, market_value, condition, condition_notes,
    personal_notes
  ) VALUES (
    p_user_id, v_starship_id,
    (p_mongodb_data->>'owned')::boolean,
    (p_mongodb_data->>'wishlist')::boolean,
    (p_mongodb_data->>'wishlist_priority')::integer,
    (p_mongodb_data->>'on_order')::boolean,
    (p_mongodb_data->>'not_interested')::boolean,
    (p_mongodb_data->>'price_paid')::decimal,
    (p_mongodb_data->>'purchase_date')::date,
    (p_mongodb_data->>'purchase_price')::decimal,
    (p_mongodb_data->>'market_value')::decimal,
    p_mongodb_data->>'condition',
    p_mongodb_data->>'condition_notes',
    p_mongodb_data->>'personal_notes'
  ) RETURNING id INTO v_collection_id;
  
  -- Import sightings if present
  IF p_mongodb_data->'sightings' IS NOT NULL THEN
    INSERT INTO user_sightings (user_id, starship_id, location, sighting_date, price, url, notes)
    SELECT 
      p_user_id,
      v_starship_id,
      sight->>'location',
      (sight->>'date')::date,
      (sight->>'price')::decimal,
      sight->>'url',
      sight->>'notes'
    FROM jsonb_array_elements(p_mongodb_data->'sightings') AS sight;
  END IF;
  
  RETURN v_collection_id;
END;
$$ LANGUAGE plpgsql;
```

## Schema Validation

### Constraint Validation
```sql
-- Validate all foreign key relationships
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint 
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace;

-- Validate RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Validate indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Performance Considerations

### Query Optimization Guidelines

1. **Use Appropriate Indexes**
   - Always filter by user_id first in user tables
   - Use composite indexes for common query patterns
   - Consider partial indexes for boolean fields

2. **Leverage RLS Efficiently**
   - RLS policies are automatically applied to all queries
   - Design policies to use indexed columns
   - Avoid complex subqueries in policies when possible

3. **Optimize Common Queries**
   - User collection with starship details (use join)
   - Statistics calculations (use aggregation functions)
   - Search functionality (use full-text search indexes)

### Monitoring Queries
```sql
-- Query to identify slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 100 -- queries taking more than 100ms
ORDER BY mean_time DESC;

-- Index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

## Conclusion

This PostgreSQL schema design provides a robust foundation for the multi-tenant Starship Collection Manager. Key benefits include:

- **Data Isolation**: RLS ensures users can only access their own data
- **Performance**: Comprehensive indexing for fast queries
- **Flexibility**: JSON fields for extensible data structures
- **Integrity**: Foreign key constraints maintain data consistency
- **Scalability**: Designed to handle hundreds of concurrent users

The schema maintains backward compatibility with the existing MongoDB structure while providing the benefits of a relational database and built-in multi-tenancy features.

---

*Document Version: 1.0*
*Last Updated: July 2025*
*Next Review: Upon implementation start*