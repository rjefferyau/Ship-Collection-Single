# Data Migration Strategy: MongoDB to PostgreSQL/Supabase

## Overview

This document outlines the comprehensive strategy for migrating data from the current MongoDB-based single-user application to the new PostgreSQL/Supabase multi-tenant architecture. The migration preserves all existing data while transforming it to support multi-user functionality.

## Migration Objectives

### Primary Goals
1. **Zero Data Loss**: Preserve all existing starship, edition, and manufacturer data
2. **Data Integrity**: Maintain all relationships and constraints
3. **User Continuity**: Convert single-user data to admin user's collection
4. **Rollback Capability**: Ability to revert if migration fails
5. **Validation**: Comprehensive verification of migrated data

### Secondary Goals
1. **Performance Optimization**: Improve query performance through proper indexing
2. **Data Normalization**: Clean up inconsistent data during migration
3. **Future-Proofing**: Structure data for easy multi-tenant expansion
4. **Documentation**: Complete audit trail of migration process

## Pre-Migration Analysis

### Current MongoDB Structure Assessment

#### Collections to Migrate
1. **starshipv5** (main collection)
   - ~377 starship records
   - ObjectId format (recently migrated)
   - Complex nested data structure
   - Personal ownership data mixed with catalog data

2. **editions**
   - Edition definitions
   - Franchise relationships
   - Internal naming conventions

3. **manufacturers**
   - Manufacturer information
   - Franchise associations
   - Contact information

4. **franchises** (if exists)
   - Franchise definitions
   - Basic metadata

#### Data Challenges Identified
1. **Mixed Data Concerns**: Catalog and personal data in same documents
2. **Inconsistent References**: String-based relationships vs ObjectIds
3. **Data Validation**: Some fields may have inconsistent formats
4. **File References**: Image and PDF file paths need validation

### Target PostgreSQL Structure

#### Table Mapping Strategy
```
MongoDB Collection    →    PostgreSQL Tables
=====================================
starshipv5          →    starships (catalog) + user_collections (personal)
editions             →    editions (normalized)
manufacturers        →    manufacturers (normalized)
franchises           →    franchises (new, normalized)
[admin user data]    →    user_profiles (new)
[sightings data]     →    user_sightings (extracted)
```

## Migration Architecture

### Migration Pipeline Components

#### 1. Data Export Layer
```javascript
// scripts/export-mongodb-data.js
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;

class MongoDBExporter {
  constructor(connectionString) {
    this.client = new MongoClient(connectionString);
    this.db = null;
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db('ship-collection-v2');
  }

  async exportCollection(collectionName, filename) {
    const collection = this.db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    
    // Convert ObjectIds to strings for JSON serialization
    const serializable = JSON.stringify(documents, null, 2);
    
    await fs.writeFile(`./migration/exports/${filename}.json`, serializable);
    console.log(`Exported ${documents.length} documents from ${collectionName}`);
    
    return documents.length;
  }

  async exportAll() {
    const results = {};
    
    // Export all collections
    results.starships = await this.exportCollection('starshipv5', 'starships');
    results.editions = await this.exportCollection('editions', 'editions');
    results.manufacturers = await this.exportCollection('manufacturers', 'manufacturers');
    
    // Export metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      collections: results,
      mongoVersion: await this.getMongoVersion(),
      totalDocuments: Object.values(results).reduce((sum, count) => sum + count, 0)
    };
    
    await fs.writeFile('./migration/exports/metadata.json', JSON.stringify(metadata, null, 2));
    
    return metadata;
  }

  async getMongoVersion() {
    const admin = this.db.admin();
    const info = await admin.serverInfo();
    return info.version;
  }

  async close() {
    await this.client.close();
  }
}
```

#### 2. Data Transformation Layer
```javascript
// scripts/transform-data.js
class DataTransformer {
  constructor() {
    this.uuidMap = new Map(); // Map old ObjectIds to new UUIDs
    this.adminUserId = null;
  }

  generateUUID() {
    // Use crypto.randomUUID() or uuid library
    return crypto.randomUUID();
  }

  transformStarships(mongoStarships, editions, manufacturers) {
    const catalogData = [];
    const collectionData = [];
    const sightingsData = [];

    for (const ship of mongoStarships) {
      // Generate new UUID for this starship
      const starshipId = this.generateUUID();
      this.uuidMap.set(ship._id, starshipId);

      // Transform catalog data (admin-controlled)
      const catalogRecord = {
        id: starshipId,
        issue: ship.issue,
        ship_name: ship.shipName,
        faction: ship.faction,
        franchise: ship.franchise,
        edition: ship.edition,
        edition_internal_name: ship.editionInternalName,
        manufacturer: ship.manufacturer,
        collection_type: ship.collectionType,
        release_date: ship.releaseDate ? new Date(ship.releaseDate) : null,
        retail_price: ship.retailPrice || null,
        image_url: ship.imageUrl,
        magazine_pdf_url: ship.magazinePdfUrl,
        description: ship.description,
        specifications: ship.specifications || {},
        is_active: true,
        created_by: this.adminUserId, // Will be set during user creation
        tags: this.extractTags(ship),
        created_at: ship.createdAt || new Date(),
        updated_at: ship.updatedAt || new Date()
      };

      // Transform personal collection data
      const collectionRecord = {
        id: this.generateUUID(),
        user_id: this.adminUserId, // Will be set during user creation
        starship_id: starshipId,
        owned: ship.owned || false,
        wishlist: ship.wishlist || false,
        wishlist_priority: ship.wishlistPriority,
        on_order: ship.onOrder || false,
        not_interested: ship.notInterested || false,
        price_paid: ship.pricePaid,
        purchase_date: ship.purchaseDate ? new Date(ship.purchaseDate) : null,
        purchase_price: ship.purchasePrice,
        market_value: ship.marketValue,
        condition: ship.condition,
        condition_notes: ship.conditionNotes,
        condition_photos: ship.conditionPhotos || [],
        last_inspection_date: ship.lastInspectionDate ? new Date(ship.lastInspectionDate) : null,
        personal_notes: ship.notes,
        created_at: ship.createdAt || new Date(),
        updated_at: ship.updatedAt || new Date()
      };

      // Transform sightings data
      if (ship.sightings && ship.sightings.length > 0) {
        for (const sighting of ship.sightings) {
          sightingsData.push({
            id: this.generateUUID(),
            user_id: this.adminUserId,
            starship_id: starshipId,
            location: sighting.location,
            sighting_date: sighting.date ? new Date(sighting.date) : new Date(),
            price: sighting.price,
            url: sighting.url,
            notes: sighting.notes,
            created_at: new Date()
          });
        }
      }

      catalogData.push(catalogRecord);
      collectionData.push(collectionRecord);
    }

    return { catalogData, collectionData, sightingsData };
  }

  transformEditions(mongoEditions) {
    return mongoEditions.map(edition => ({
      id: this.generateUUID(),
      name: edition.name,
      internal_name: edition.internalName,
      description: edition.description,
      retail_price: edition.retailPrice,
      franchise: edition.franchise,
      is_default: edition.isDefault || false,
      is_active: true,
      created_at: edition.createdAt || new Date(),
      updated_at: edition.updatedAt || new Date()
    }));
  }

  transformManufacturers(mongoManufacturers) {
    return mongoManufacturers.map(manufacturer => ({
      id: this.generateUUID(),
      name: manufacturer.name,
      description: manufacturer.description,
      website: manufacturer.website,
      country: manufacturer.country,
      franchises: manufacturer.franchises || [],
      is_active: true,
      created_at: manufacturer.createdAt || new Date(),
      updated_at: manufacturer.updatedAt || new Date()
    }));
  }

  extractTags(ship) {
    const tags = [];
    
    // Add franchise as tag
    if (ship.franchise) tags.push(ship.franchise.toLowerCase());
    
    // Add faction as tag
    if (ship.faction) tags.push(ship.faction.toLowerCase());
    
    // Add collection type as tag
    if (ship.collectionType) tags.push(ship.collectionType.toLowerCase());
    
    // Add ownership status tags
    if (ship.owned) tags.push('owned');
    if (ship.wishlist) tags.push('wishlist');
    if (ship.onOrder) tags.push('on-order');
    
    return tags;
  }

  linkForeignKeys(catalogData, editions, manufacturers) {
    // Create lookup maps
    const editionMap = new Map();
    editions.forEach(e => editionMap.set(e.internal_name, e.id));
    
    const manufacturerMap = new Map();
    manufacturers.forEach(m => manufacturerMap.set(m.name, m.id));

    // Update foreign key references
    catalogData.forEach(ship => {
      ship.edition_id = editionMap.get(ship.edition_internal_name) || null;
      ship.manufacturer_id = manufacturerMap.get(ship.manufacturer) || null;
    });

    return catalogData;
  }
}
```

#### 3. PostgreSQL Import Layer
```sql
-- scripts/import-to-postgresql.sql

-- Create temporary import tables
CREATE TEMP TABLE temp_starships_import (
  data JSONB
);

CREATE TEMP TABLE temp_user_collections_import (
  data JSONB
);

CREATE TEMP TABLE temp_editions_import (
  data JSONB
);

CREATE TEMP TABLE temp_manufacturers_import (
  data JSONB
);

-- Import functions
CREATE OR REPLACE FUNCTION import_from_json(
  table_name TEXT,
  json_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  record_count INTEGER := 0;
  json_record JSONB;
BEGIN
  -- Import each record from JSON array
  FOR json_record IN SELECT jsonb_array_elements(json_data)
  LOOP
    -- Dynamic insert based on table name
    CASE table_name
      WHEN 'editions' THEN
        INSERT INTO editions (
          id, name, internal_name, description, retail_price,
          franchise, is_default, is_active, created_at, updated_at
        ) VALUES (
          (json_record->>'id')::UUID,
          json_record->>'name',
          json_record->>'internal_name',
          json_record->>'description',
          (json_record->>'retail_price')::DECIMAL,
          json_record->>'franchise',
          (json_record->>'is_default')::BOOLEAN,
          (json_record->>'is_active')::BOOLEAN,
          (json_record->>'created_at')::TIMESTAMP,
          (json_record->>'updated_at')::TIMESTAMP
        );
        
      WHEN 'manufacturers' THEN
        INSERT INTO manufacturers (
          id, name, description, website, country,
          franchises, is_active, created_at, updated_at
        ) VALUES (
          (json_record->>'id')::UUID,
          json_record->>'name',
          json_record->>'description',
          json_record->>'website',
          json_record->>'country',
          string_to_array(json_record->>'franchises', ','),
          (json_record->>'is_active')::BOOLEAN,
          (json_record->>'created_at')::TIMESTAMP,
          (json_record->>'updated_at')::TIMESTAMP
        );
        
      WHEN 'starships' THEN
        INSERT INTO starships (
          id, issue, ship_name, faction, franchise,
          edition, edition_internal_name, manufacturer,
          collection_type, release_date, retail_price,
          image_url, magazine_pdf_url, description,
          specifications, is_active, created_by, tags,
          created_at, updated_at
        ) VALUES (
          (json_record->>'id')::UUID,
          json_record->>'issue',
          json_record->>'ship_name',
          json_record->>'faction',
          json_record->>'franchise',
          json_record->>'edition',
          json_record->>'edition_internal_name',
          json_record->>'manufacturer',
          json_record->>'collection_type',
          (json_record->>'release_date')::DATE,
          (json_record->>'retail_price')::DECIMAL,
          json_record->>'image_url',
          json_record->>'magazine_pdf_url',
          json_record->>'description',
          (json_record->>'specifications')::JSONB,
          (json_record->>'is_active')::BOOLEAN,
          (json_record->>'created_by')::UUID,
          string_to_array(json_record->>'tags', ','),
          (json_record->>'created_at')::TIMESTAMP,
          (json_record->>'updated_at')::TIMESTAMP
        );
    END CASE;
    
    record_count := record_count + 1;
  END LOOP;
  
  RETURN record_count;
END;
$$ LANGUAGE plpgsql;
```

## Migration Execution Plan

### Phase 1: Pre-Migration Validation (Week 1)

#### Data Quality Assessment
```bash
#!/bin/bash
# scripts/validate-source-data.sh

echo "🔍 Validating MongoDB source data..."

# Connect to MongoDB and run validation queries
docker exec mongodb mongosh ship-collection-v2 --eval "
  // Count all collections
  const starshipCount = db.starshipv5.countDocuments();
  const editionCount = db.editions.countDocuments();
  const manufacturerCount = db.manufacturers.countDocuments();
  
  print('Collection Counts:');
  print('  Starships: ' + starshipCount);
  print('  Editions: ' + editionCount);
  print('  Manufacturers: ' + manufacturerCount);
  
  // Check for data consistency issues
  const missingEditions = db.starshipv5.countDocuments({
    \$or: [
      { edition: { \$exists: false } },
      { edition: '' },
      { editionInternalName: { \$exists: false } }
    ]
  });
  
  const missingImages = db.starshipv5.countDocuments({
    \$or: [
      { imageUrl: { \$exists: false } },
      { imageUrl: '' },
      { imageUrl: null }
    ]
  });
  
  print('Data Quality Issues:');
  print('  Missing editions: ' + missingEditions);
  print('  Missing images: ' + missingImages);
  
  // Check for duplicate issues within editions
  const duplicates = db.starshipv5.aggregate([
    { \$group: { 
        _id: { issue: '\$issue', edition: '\$edition' },
        count: { \$sum: 1 }
      }
    },
    { \$match: { count: { \$gt: 1 } } }
  ]).toArray();
  
  print('Duplicate entries: ' + duplicates.length);
"

echo "✅ Source data validation complete"
```

#### File Asset Verification
```bash
#!/bin/bash
# scripts/verify-file-assets.sh

echo "📁 Verifying file assets..."

# Check image files
MISSING_IMAGES=0
TOTAL_IMAGES=0

for img in public/uploads/*.{jpg,jpeg,png,gif,webp}; do
  if [ -f "$img" ]; then
    TOTAL_IMAGES=$((TOTAL_IMAGES + 1))
  else
    MISSING_IMAGES=$((MISSING_IMAGES + 1))
    echo "Missing: $img"
  fi
done

# Check PDF files
MISSING_PDFS=0
TOTAL_PDFS=0

for pdf in public/uploads/magazines/*.pdf; do
  if [ -f "$pdf" ]; then
    TOTAL_PDFS=$((TOTAL_PDFS + 1))
  else
    MISSING_PDFS=$((MISSING_PDFS + 1))
    echo "Missing: $pdf"
  fi
done

echo "📊 Asset Summary:"
echo "  Images: $TOTAL_IMAGES found, $MISSING_IMAGES missing"
echo "  PDFs: $TOTAL_PDFS found, $MISSING_PDFS missing"
```

### Phase 2: Data Export and Transformation (Week 2)

#### Execution Steps
```bash
#!/bin/bash
# scripts/export-and-transform.sh

set -e

echo "📤 Starting data export and transformation..."

# 1. Export MongoDB data
echo "Step 1: Exporting MongoDB collections..."
node scripts/export-mongodb-data.js

# 2. Transform data for PostgreSQL
echo "Step 2: Transforming data..."
node scripts/transform-data.js

# 3. Validate transformed data
echo "Step 3: Validating transformed data..."
node scripts/validate-transformed-data.js

# 4. Create backup of current state
echo "Step 4: Creating backup..."
mongodump --db ship-collection-v2 --out ./migration/backup-$(date +%Y%m%d-%H%M%S)

echo "✅ Export and transformation complete"
echo "📁 Files created:"
echo "  - migration/exports/ (original MongoDB data)"
echo "  - migration/transformed/ (PostgreSQL-ready data)"
echo "  - migration/backup-*/ (MongoDB backup)"
```

### Phase 3: PostgreSQL Import (Week 2)

#### Database Preparation
```sql
-- scripts/prepare-target-database.sql

-- Create admin user first (will be linked to Supabase auth later)
INSERT INTO user_profiles (
  id,
  user_id, -- This will be updated when first admin authenticates
  username,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(), -- Temporary UUID, will be replaced
  'admin',
  'admin',
  true,
  NOW()
) RETURNING id;

-- Store admin user ID for foreign key references
CREATE TEMP TABLE migration_context (
  admin_user_id UUID
);

INSERT INTO migration_context (admin_user_id)
SELECT id FROM user_profiles WHERE username = 'admin';
```

#### Import Execution
```bash
#!/bin/bash
# scripts/import-to-postgresql.sh

set -e

echo "📥 Starting PostgreSQL import..."

# 1. Prepare target database
echo "Step 1: Preparing target database..."
docker-compose exec -T db psql -U postgres -d postgres -f /app/scripts/prepare-target-database.sql

# 2. Import reference data first (editions, manufacturers)
echo "Step 2: Importing reference data..."
docker-compose exec -T db psql -U postgres -d postgres << EOF
\copy editions FROM '/app/migration/transformed/editions.csv' WITH CSV HEADER;
\copy manufacturers FROM '/app/migration/transformed/manufacturers.csv' WITH CSV HEADER;
EOF

# 3. Import starships (master catalog)
echo "Step 3: Importing starships catalog..."
docker-compose exec -T db psql -U postgres -d postgres << EOF
\copy starships FROM '/app/migration/transformed/starships.csv' WITH CSV HEADER;
EOF

# 4. Import user collections
echo "Step 4: Importing user collections..."
docker-compose exec -T db psql -U postgres -d postgres << EOF
\copy user_collections FROM '/app/migration/transformed/user_collections.csv' WITH CSV HEADER;
EOF

# 5. Import sightings
echo "Step 5: Importing sightings..."
docker-compose exec -T db psql -U postgres -d postgres << EOF
\copy user_sightings FROM '/app/migration/transformed/user_sightings.csv' WITH CSV HEADER;
EOF

echo "✅ PostgreSQL import complete"
```

### Phase 4: Data Validation and Verification (Week 3)

#### Comprehensive Validation Suite
```sql
-- scripts/validate-migration.sql

-- Record migration start
INSERT INTO migration_history (
  migration_name,
  executed_at,
  success,
  mongodb_records_processed,
  postgresql_records_created
) VALUES (
  'initial_migration',
  NOW(),
  false, -- Will be updated on success
  0,     -- Will be updated with actual counts
  0      -- Will be updated with actual counts
);

-- Validation queries
DO $$
DECLARE
  starship_count INTEGER;
  collection_count INTEGER;
  sighting_count INTEGER;
  edition_count INTEGER;
  manufacturer_count INTEGER;
  validation_errors TEXT[] := '{}';
  total_source_records INTEGER := 377; -- From MongoDB export
BEGIN
  -- Count imported records
  SELECT COUNT(*) INTO starship_count FROM starships;
  SELECT COUNT(*) INTO collection_count FROM user_collections;
  SELECT COUNT(*) INTO sighting_count FROM user_sightings;
  SELECT COUNT(*) INTO edition_count FROM editions;
  SELECT COUNT(*) INTO manufacturer_count FROM manufacturers;
  
  RAISE NOTICE 'Import counts:';
  RAISE NOTICE '  Starships: %', starship_count;
  RAISE NOTICE '  User Collections: %', collection_count;
  RAISE NOTICE '  Sightings: %', sighting_count;
  RAISE NOTICE '  Editions: %', edition_count;
  RAISE NOTICE '  Manufacturers: %', manufacturer_count;
  
  -- Validate record counts
  IF starship_count != total_source_records THEN
    validation_errors := array_append(validation_errors, 
      'Starship count mismatch: expected ' || total_source_records || ', got ' || starship_count);
  END IF;
  
  -- Validate foreign key relationships
  IF EXISTS (
    SELECT 1 FROM starships s 
    LEFT JOIN editions e ON s.edition_id = e.id 
    WHERE s.edition_id IS NOT NULL AND e.id IS NULL
  ) THEN
    validation_errors := array_append(validation_errors, 'Invalid edition references found');
  END IF;
  
  -- Validate user collection relationships
  IF EXISTS (
    SELECT 1 FROM user_collections uc
    LEFT JOIN starships s ON uc.starship_id = s.id
    WHERE s.id IS NULL
  ) THEN
    validation_errors := array_append(validation_errors, 'Invalid starship references in user collections');
  END IF;
  
  -- Check for required fields
  IF EXISTS (SELECT 1 FROM starships WHERE ship_name IS NULL OR ship_name = '') THEN
    validation_errors := array_append(validation_errors, 'Starships with missing names found');
  END IF;
  
  -- Report results
  IF array_length(validation_errors, 1) IS NULL THEN
    RAISE NOTICE '✅ All validations passed!';
    
    -- Update migration history
    UPDATE migration_history 
    SET 
      success = true,
      mongodb_records_processed = total_source_records,
      postgresql_records_created = starship_count + collection_count + sighting_count,
      execution_time_ms = EXTRACT(EPOCH FROM (NOW() - executed_at)) * 1000,
      data_validation_passed = true
    WHERE migration_name = 'initial_migration' 
      AND executed_at = (SELECT MAX(executed_at) FROM migration_history WHERE migration_name = 'initial_migration');
      
  ELSE
    RAISE NOTICE '❌ Validation errors found:';
    FOR i IN 1..array_length(validation_errors, 1) LOOP
      RAISE NOTICE '  - %', validation_errors[i];
    END LOOP;
    
    -- Update migration history with errors
    UPDATE migration_history 
    SET 
      success = false,
      error_message = array_to_string(validation_errors, '; '),
      data_validation_passed = false
    WHERE migration_name = 'initial_migration' 
      AND executed_at = (SELECT MAX(executed_at) FROM migration_history WHERE migration_name = 'initial_migration');
  END IF;
END $$;
```

#### Data Integrity Checks
```bash
#!/bin/bash
# scripts/integrity-checks.sh

echo "🔍 Running data integrity checks..."

# Compare record counts
echo "📊 Comparing record counts:"
MONGO_COUNT=$(docker exec mongodb mongosh ship-collection-v2 --quiet --eval "db.starshipv5.countDocuments()")
PG_COUNT=$(docker-compose exec -T db psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM starships;")

echo "  MongoDB starships: $MONGO_COUNT"
echo "  PostgreSQL starships: $PG_COUNT"

if [ "$MONGO_COUNT" -eq "$PG_COUNT" ]; then
  echo "  ✅ Record counts match"
else
  echo "  ❌ Record count mismatch!"
  exit 1
fi

# Sample data verification
echo "🔬 Verifying sample records..."
docker-compose exec -T db psql -U postgres -d postgres << EOF
-- Check that first 5 records have expected structure
SELECT 
  issue,
  ship_name,
  faction,
  franchise,
  CASE WHEN edition_id IS NOT NULL THEN 'LINKED' ELSE 'UNLINKED' END as edition_status,
  CASE WHEN created_by IS NOT NULL THEN 'HAS_ADMIN' ELSE 'NO_ADMIN' END as admin_status
FROM starships 
ORDER BY issue 
LIMIT 5;

-- Check user collection linkage
SELECT 
  COUNT(*) as total_collections,
  COUNT(CASE WHEN owned THEN 1 END) as owned_count,
  COUNT(CASE WHEN wishlist THEN 1 END) as wishlist_count
FROM user_collections;
EOF

echo "✅ Integrity checks complete"
```

## Rollback Strategy

### Automated Rollback Script
```bash
#!/bin/bash
# scripts/rollback-migration.sh

set -e

echo "🔄 Rolling back migration..."

# 1. Stop application
docker-compose stop app

# 2. Backup current PostgreSQL state (in case we need to investigate)
echo "📦 Backing up current PostgreSQL state..."
docker-compose exec -T db pg_dump -U postgres postgres > ./migration/rollback-backup-$(date +%Y%m%d-%H%M%S).sql

# 3. Reset PostgreSQL database
echo "🗑️ Resetting PostgreSQL database..."
docker-compose down db
docker volume rm ship-collection-multi-tenant_db_data
docker-compose up -d db

# 4. Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T db pg_isready -U postgres; do
  sleep 2
done

# 5. Restore MongoDB as primary (if needed)
echo "🔙 MongoDB remains as primary database"
echo "   - Original single-user application is still available"
echo "   - No data has been lost from MongoDB"

# 6. Clean up migration artifacts
echo "🧹 Cleaning up migration files..."
rm -rf ./migration/transformed/
rm -rf ./migration/exports/

echo "✅ Rollback complete"
echo "   - PostgreSQL database reset"
echo "   - MongoDB data intact"
echo "   - Ready to retry migration or continue with single-user version"
```

## Migration Monitoring and Logging

### Progress Tracking
```javascript
// scripts/migration-monitor.js
class MigrationMonitor {
  constructor() {
    this.startTime = Date.now();
    this.stages = [];
    this.currentStage = null;
  }

  startStage(name, description) {
    if (this.currentStage) {
      this.endStage();
    }
    
    this.currentStage = {
      name,
      description,
      startTime: Date.now(),
      progress: 0,
      status: 'running'
    };
    
    console.log(`🚀 Starting: ${description}`);
  }

  updateProgress(percentage, details = '') {
    if (this.currentStage) {
      this.currentStage.progress = percentage;
      const elapsed = ((Date.now() - this.currentStage.startTime) / 1000).toFixed(1);
      console.log(`   ${percentage}% complete (${elapsed}s) ${details}`);
    }
  }

  endStage(status = 'completed') {
    if (this.currentStage) {
      this.currentStage.endTime = Date.now();
      this.currentStage.duration = this.currentStage.endTime - this.currentStage.startTime;
      this.currentStage.status = status;
      
      const duration = (this.currentStage.duration / 1000).toFixed(1);
      const icon = status === 'completed' ? '✅' : '❌';
      console.log(`${icon} ${this.currentStage.description} (${duration}s)`);
      
      this.stages.push({ ...this.currentStage });
      this.currentStage = null;
    }
  }

  getSummary() {
    const totalDuration = (Date.now() - this.startTime) / 1000;
    const completed = this.stages.filter(s => s.status === 'completed').length;
    const failed = this.stages.filter(s => s.status === 'failed').length;
    
    return {
      totalDuration: totalDuration.toFixed(1),
      stagesCompleted: completed,
      stagesFailed: failed,
      stages: this.stages
    };
  }
}
```

## Post-Migration Tasks

### 1. User Onboarding
```sql
-- scripts/setup-admin-user.sql
-- This will be run after first admin authentication

CREATE OR REPLACE FUNCTION link_admin_user(auth_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the temporary admin profile with real auth user ID
  UPDATE user_profiles 
  SET user_id = auth_user_id
  WHERE username = 'admin' AND role = 'admin';
  
  -- Update all collections to link to real admin user
  UPDATE user_collections 
  SET user_id = auth_user_id
  WHERE user_id = (
    SELECT user_id FROM user_profiles 
    WHERE username = 'admin' AND role = 'admin'
  );
  
  -- Update all sightings to link to real admin user
  UPDATE user_sightings 
  SET user_id = auth_user_id
  WHERE user_id = (
    SELECT user_id FROM user_profiles 
    WHERE username = 'admin' AND role = 'admin'
  );
  
  -- Update starships created_by reference
  UPDATE starships 
  SET created_by = auth_user_id
  WHERE created_by = (
    SELECT user_id FROM user_profiles 
    WHERE username = 'admin' AND role = 'admin'
  );
  
  RAISE NOTICE 'Admin user linked successfully';
END;
$$ LANGUAGE plpgsql;
```

### 2. Performance Optimization
```sql
-- scripts/post-migration-optimization.sql

-- Analyze tables for query planner
ANALYZE starships;
ANALYZE user_collections;
ANALYZE user_sightings;
ANALYZE editions;
ANALYZE manufacturers;

-- Update table statistics
VACUUM ANALYZE;

-- Create additional indexes based on usage patterns
CREATE INDEX CONCURRENTLY idx_starships_search_text 
ON starships USING GIN (to_tsvector('english', ship_name || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY idx_user_collections_status_dashboard
ON user_collections (user_id, owned, wishlist, on_order)
WHERE owned = true OR wishlist = true OR on_order = true;

-- Check index usage
SELECT 
  indexname,
  indexdef,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
JOIN pg_indexes USING (indexname)
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;
```

## Success Criteria

### Technical Success Metrics
- ✅ **Zero Data Loss**: All MongoDB records successfully migrated
- ✅ **Referential Integrity**: All foreign key relationships established
- ✅ **Performance**: Query response times < 2 seconds
- ✅ **Data Validation**: All validation checks pass
- ✅ **File Assets**: All images and PDFs accessible

### Functional Success Metrics
- ✅ **Admin Authentication**: Admin user can log in and access all data
- ✅ **Collection Management**: All collection operations work correctly
- ✅ **Search and Filtering**: All search functionality operational
- ✅ **Statistics**: Accurate collection statistics displayed
- ✅ **Image Display**: All starship images display correctly

### Operational Success Metrics
- ✅ **Migration Time**: Complete migration in < 4 hours
- ✅ **Rollback Capability**: Successful rollback test completed
- ✅ **Documentation**: Complete audit trail of migration process
- ✅ **Monitoring**: All monitoring and logging systems operational

## Risk Assessment

### High-Risk Areas
1. **Data Loss During Transformation**: Mitigated by comprehensive backups and validation
2. **Foreign Key Relationship Errors**: Mitigated by careful mapping and validation scripts
3. **File Asset Migration**: Mitigated by pre-migration verification and post-migration testing
4. **Authentication Integration**: Mitigated by staged user linking process

### Contingency Plans
1. **Migration Failure**: Automated rollback to MongoDB-based system
2. **Data Corruption**: Restore from multiple backup points
3. **Performance Issues**: Immediate index creation and query optimization
4. **User Access Issues**: Manual admin user setup procedures

## Conclusion

This comprehensive data migration strategy ensures a safe, reliable transition from MongoDB to PostgreSQL/Supabase while preserving all existing data and functionality. The multi-phase approach with extensive validation and rollback capabilities minimizes risk and provides confidence in the migration process.

Key benefits of this approach:
- **Safety First**: Multiple backup points and rollback capabilities
- **Data Integrity**: Comprehensive validation at every stage
- **Auditability**: Complete logging and monitoring of migration process
- **Performance**: Optimized database structure with proper indexing
- **Future-Proof**: Clean separation of catalog and user data for multi-tenancy

The migration process is designed to be repeatable, testable, and reversible, ensuring a successful transition to the multi-tenant Supabase architecture.

---

*Document Version: 1.0*
*Last Updated: July 2025*
*Next Review: Upon migration execution*