# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**
- `npm run dev` - Start development server (uses 4GB memory allocation)
- `npm run dev:fast` - Fast development (disables telemetry)
- `npm run dev:clean` - Clean build and start dev server
- `npm run dev:auto` - Auto-restart server using node server.js

**Build & Production:**
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run analyze` - Bundle analysis

**Code Quality:**
- `npm run lint` - ESLint
- `npm run type-check` - TypeScript type checking (manual - disabled in dev builds)

**Testing:**
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI environment

**Database Scripts:**
- `npm run fix-editions` - Fix edition data issues
- `npm run simple-fix` - Simple database fixes
- `npm run list-editions` - List all editions
- `npm run repair-editions` - Repair edition relationships
- `npm run direct-repair` - Direct database repair
- `npm run fix-ship-editions` - Fix ship-edition relationships
- `npm run fix-bsg-ship` - Fix Battlestar Galactica ships

**Backup & Restore:**
- `npm run backup:create` - Create database backup
- `npm run backup:restore` - Restore database (interactive)
- `npm run backup:restore-latest` - Restore latest backup
- `npm run backup:list` - List available backups

**Docker Commands:**
- `npm run docker:build` - Build Docker containers
- `npm run docker:up` - Start Docker environment
- `npm run docker:down` - Stop Docker environment
- `npm run docker:logs` - View container logs
- `npm run docker:dev` - Development Docker setup
- `npm run docker:prod` - Production Docker setup

**Cache Management:**
- `npm run clear-cache` - Clear Next.js cache and npm cache
- `npm run clean` - PowerShell cleanup script

## Architecture Overview

### Core Data Model
The application centers around **Starships** with complex relationships:
- **Starship** (models/Starship.ts): Main entity with 30+ fields including pricing, conditions, sightings
- **Edition**: References to specific product editions (e.g., "Discovery", "TNG")  
- **Franchise**: Top-level groupings (Star Trek, Battlestar Galactica)
- **Manufacturer**: Physical manufacturers (Eaglemoss, etc.)
- **Faction**: In-universe factions (Federation, Klingon Empire)
- **CollectionType**: User-defined collection categories

### Database Architecture
- **MongoDB** with Mongoose ODM using **ObjectId format throughout**
- Main collection: `starshipv5` (migrated from earlier versions)
- **All documents use MongoDB ObjectIds** (migrated from string IDs in July 2025)
- Compound unique index on `issue + edition`
- Multiple performance indexes on commonly queried fields
- Uses centralized API handler pattern via `lib/apiHandler.ts`
- Development and Docker environments synchronized with ObjectId format

### API Design Pattern
Uses factory-based API handlers with **ObjectId-only handling**:
- `createResourceApiHandler()` for single resource routes (`/api/starships/[id]`)
- `createCollectionApiHandler()` for collection routes (`/api/starships`)
- **All ID parameters converted to ObjectIds** using `mongoose.Types.ObjectId()`
- Uses `findById()`, `findByIdAndUpdate()`, `findByIdAndDelete()` for consistency
- Standardized error handling, validation, and response format
- All APIs return `{ success: boolean, data?: any, message?: string, error?: string }`
- **Starships API Enhancement**: `/api/starships` includes `statusCounts` and `pagination` objects for intelligent UI updates

### Frontend Architecture
**Next.js** with TypeScript:
- **Pages Router** (not App Router) - Uses traditional file-based routing
- **Component Structure**: 40+ React components in `/components/` organized by category
- **Dynamic Imports**: Performance optimization with `next/dynamic` for large components
- **Custom Hooks**: `useStarshipFilters`, `useBatchOperations`, `useForm`
- **State Management**: React Context for Theme and Currency, local state with useState/useEffect
- **Styling**: Tailwind CSS with custom theme extensions and color palette
- **UI Framework**: Custom components built on Headless UI for modals and interactions
- **Icons**: Font Awesome integration for consistent iconography

### Key Component Categories
- **Data Management**: `StarshipList`, `DataTable`, `BatchActionManager`  
- **Specialized Views**: `FancyStarshipView`, `ExcelView`, `PriceVault`
- **Management Tools**: `ManufacturerManager`, `DatabaseFix`, `CollectionTypeManager`
- **Modals**: `BaseModal`, `PricingEditModal`, `SightingsModal`
- **Searchable Selectors**: `SearchableFactionSelect`, `SearchableManufacturerSelect` - Use Headless UI Combobox for type-ahead search functionality
- **Checklist & PDF**: `ChecklistGenerator`, `ChecklistPDF` - Generate printable PDF checklists with filtering and image support

### View Modes and Pagination System
The application supports three distinct view modes with intelligent pagination:

**View Modes:**
- **Table View**: Paginated display (50 items per page) with full CRUD operations, filtering, and sorting
- **Gallery View**: Non-paginated thumbnail grid showing all items for visual browsing
- **Overview View**: Non-paginated summary view with status badges and edition tabs

**Smart Pagination Logic:**
- **Table Mode**: Uses `limit=50` with pagination controls for performance
- **Gallery/Overview Modes**: Uses `limit=1000` to fetch all items for complete collection view
- **Price Vault & Non-Paginated Views**: Always use `limit=1000` to ensure all items are loaded for accurate calculations
- **Automatic Refetch**: Data automatically refetches when switching between view modes

**Status Count System:**
- **API Level**: `/api/starships` returns `statusCounts` object with total counts across all pages
- **Badge Display**: All count badges (Owned, Wishlist, On Order, Not Owned) show totals, not current page counts
- **Edition Switching**: Status counts update when switching between edition tabs
- **Consistent Data**: Same total counts displayed across all view modes

### File Upload System
- Images: Stored in `/public/uploads/` with MongoDB ObjectId naming
- PDFs: Stored in `/public/uploads/magazines/`
- Upload API: `/api/upload/csv`, `/api/upload/image`, `/api/upload/pdf`

### Database Migration History
The app has undergone multiple schema migrations:
- Started with basic starship tracking
- Added manufacturer relationships and franchise groupings
- Migrated to `starshipv5` collection with improved indexing
- Added pricing tracking, condition monitoring, and sightings system
- **July 2025: Major ObjectId Migration** - Converted all string IDs to MongoDB ObjectIds
  - Migrated 377 starship records from string to ObjectId format
  - Updated all API handlers to use ObjectId-only pattern
  - Synchronized development and Docker environments
  - Fixed image upload and all CRUD operations for ObjectId compatibility

### Performance Optimizations
**Next.js Config**:
- React Strict Mode disabled (compatibility with react-beautiful-dnd)
- Custom webpack config for faster development builds
- Bundle splitting optimizations for React and common dependencies  
- TypeScript checking disabled in development (run manually with `npm run type-check`)
- Image optimization configured for localhost domain
- Standalone output for Docker deployment

**Development Optimizations**:
- Uses absolute imports with `@/*` path mapping for cleaner imports
- Memory allocation increased to 4GB for large datasets (NODE_OPTIONS in package.json)
- File watching optimized to prevent lock issues
- Dynamic component loading to reduce initial bundle size
- CSS source maps disabled in development for faster compilation
- Custom cache configuration for improved hot reloading

### TypeScript Configuration
- Strict mode enabled with comprehensive error checking
- Path aliases: `@/*` maps to project root for absolute imports
- Custom type definitions in `/types/index.ts` with complete interface coverage
- Interface definitions match Mongoose schemas exactly for type safety
- JSX preserve mode for Next.js compilation
- ES5 target for broad browser compatibility
- Incremental compilation for faster builds

## Key Patterns to Follow

### API Route Pattern
```typescript
import { createResourceApiHandler } from '../../../lib/apiHandler';
import Model from '../../../models/Model';
import mongoose from 'mongoose';

export default createResourceApiHandler(Model, 'ModelName', {
  allowedMethods: ['GET', 'PUT', 'DELETE'],
  customHandlers: {
    // Custom logic if needed - all IDs are ObjectIds
    // Example: const objectId = new mongoose.Types.ObjectId(id);
  }
});
```

**Critical: All ID handling uses ObjectId format**
- Frontend sends ObjectId strings (e.g., "687c2b5129bc04632f78e5cc")
- API handlers convert to ObjectId: `new mongoose.Types.ObjectId(id)`
- Database queries use ObjectId format throughout
- No string/ObjectId dual-format handling

### Component Pattern
```typescript
// Component structure follows this pattern
interface ComponentProps {
  // Props typed according to /types/index.ts interfaces
  data: Starship[];
  onAction: (id: string) => Promise<void>;
}

const Component: React.FC<ComponentProps> = ({ data, onAction }) => {
  // Use Tailwind classes with custom theme extensions
  // Utilize Headless UI for interactive elements
  // Implement proper error boundaries and loading states
};
```

**Component Guidelines**:
- Use TypeScript interfaces from `/types/index.ts`
- Follow established UI patterns using Tailwind classes with custom theme
- Implement proper loading states and error handling
- Use dynamic imports for large components to improve performance
- Follow React hooks patterns for state management
- Utilize Font Awesome icons consistently
- **For dropdowns with many options**: Use `SearchableFactionSelect` or `SearchableManufacturerSelect` instead of standard `<select>` elements
- **For API calls needing all data**: Always include `limit=1000` parameter (Price Vault, Gallery, Overview, PDF generation)

### Database Query Pattern
Always use the centralized `dbConnect()` from `lib/mongodb.ts` and leverage the existing indexes for performance.

**ObjectId Query Examples:**
```typescript
// Single record operations
const objectId = new mongoose.Types.ObjectId(id);
const starship = await Starship.findById(objectId);
const updated = await Starship.findByIdAndUpdate(objectId, data, { new: true });
const deleted = await Starship.findByIdAndDelete(objectId);

// Collection operations with ObjectId filters
const ships = await Starship.find({ 
  manufacturer: new mongoose.Types.ObjectId(manufacturerId) 
});
```

**Important Notes:**
- Always convert string IDs to ObjectId before database operations
- Use Mongoose methods (`findById`, `findByIdAndUpdate`) for ObjectId operations
- Frontend receives ObjectId strings via `toJSON` transform in models

### Searchable Component Pattern
For dropdowns with many options, use searchable components instead of standard `<select>` elements:

```typescript
// Instead of standard select dropdown
<select name="faction" value={value} onChange={handleChange}>
  <option value="">Select a faction</option>
  {factions.map(faction => (
    <option key={faction._id} value={faction.name}>
      {faction.name}
    </option>
  ))}
</select>

// Use searchable component
<SearchableFactionSelect
  factions={availableFactions}
  value={formData.faction}
  onChange={(value) => setFormData(prev => ({ ...prev, faction: value }))}
  loading={loadingFactions}
  disabled={loadingFactions || !formData.franchise}
  placeholder="Select a faction"
  className="w-full"
/>
```

**Available Searchable Components:**
- `SearchableFactionSelect` - For faction/race selection with type-ahead search
- `SearchableManufacturerSelect` - For manufacturer selection with type-ahead search
- Built on Headless UI Combobox with consistent styling and accessibility

**When to Use:**
- Any dropdown with 10+ options where users might need to scroll
- Forms where quick selection improves user experience
- Replace existing `<select>` elements that users find cumbersome

### Error Handling
Use the standardized error handling in `apiHandler.ts` which provides consistent error responses and handles MongoDB-specific errors (validation, duplicate keys, cast errors).

## Docker & Environment Management

### Docker Architecture
- **Multi-container setup** with Next.js app and MongoDB
- Development port: `localhost:3000`
- MongoDB port: `localhost:27017`
- Docker Compose configuration for easy deployment

### Database Synchronization
Both development and Docker environments use identical ObjectId format:
- Use `mongodump` and `mongorestore` for data synchronization
- Example: `mongodump --db ship-collection-v2 --out /tmp/backup`
- Example: `mongorestore --host localhost:27017 --db ship-collection-v2 --drop /tmp/backup/ship-collection-v2/`

### Environment Consistency
- **Identical database schemas** across environments
- **ObjectId format standardized** in both dev and Docker
- **API compatibility** ensures seamless environment switching
- Regular synchronization maintains data consistency

### Docker Commands
```bash
# Complete rebuild with fresh database
docker compose down
docker compose build --no-cache app
docker compose up -d

# Restart just the app container
docker compose restart app

# Check container status
docker ps
docker logs ship-collection-single-app-1

# Start with MongoDB Express admin tool
docker compose --profile tools up -d

# Database administration (MongoDB Express available at :8081)
# Username: admin, Password: shipCollection2025
```

## Migration & Maintenance

### Database Migration Scripts
Located in `/scripts/` directory for major database operations:
- `migrate-ids-to-objectid.js` - Converts string IDs to ObjectIds
- Includes backup procedures and rollback capabilities
- Handles batch processing for large datasets
- Comprehensive error handling and verification

### Migration Best Practices
1. **Always backup before migration**: Create timestamped backup collections
2. **Test in development first**: Verify migration scripts work correctly
3. **Use batch processing**: Process documents in chunks to avoid memory issues
4. **Verify results**: Count documents and spot-check converted data
5. **Synchronize environments**: Apply migrations to both dev and Docker

### Backup Procedures
```bash
# Create backup with timestamp
mongodump --db ship-collection-v2 --out /tmp/backup-$(date +%Y%m%d-%H%M%S)

# Create backup collection within database
db.starshipv5.aggregate([{ $out: "starshipv5_backup_" + Date.now() }])
```

### Common Maintenance Tasks
- **Database cleanup**: Remove old backup collections
- **Index optimization**: Monitor and update indexes for performance
- **Schema validation**: Ensure data consistency across collections
- **Environment sync**: Regular synchronization between dev and Docker
- **Image cleanup**: Remove orphaned files from `/public/uploads/`

## Troubleshooting

### Common Issues & Solutions

**Badge counts showing limited numbers (e.g., 50 instead of total):**
- **Cause**: Component calculating counts from paginated results instead of using API statusCounts
- **Solution**: Ensure components use `statusCounts` prop from API response, not `filteredStarships.filter().length`
- **Check**: Verify `/api/starships` returns `statusCounts` object with `{owned, wishlist, onOrder, notOwned}`
- **Implementation**: Components should use `statusCounts?.owned ?? fallback` pattern

**Gallery/Overview/Price Vault modes showing only 50 items:**
- **Cause**: View mode not triggering appropriate API limit parameter
- **Solution**: Verify `fetchStarships()` uses different limits based on `viewMode` state
- **Check**: Table view should use `limit=50`, Gallery/Overview/Price Vault should use `limit=1000`
- **Testing**: Switch between view modes and verify network requests in browser dev tools
- **Common Fix**: Add `queryParams.push('limit=1000');` to API calls that need all data

**"Failed to update item" errors:**
- **Cause**: ID format mismatch between frontend and API
- **Solution**: Verify all IDs use ObjectId format, check API handler conversions
- **Check**: `new mongoose.Types.ObjectId(id)` in API handlers

**Image upload failures:**
- **Cause**: API handlers not updated for ObjectId format
- **Solution**: Update upload APIs to use `findByIdAndUpdate()` with ObjectId
- **Verify**: Check `/api/upload/image` uses ObjectId conversion

**Docker environment issues:**
- **Cause**: Database state differs between dev and Docker
- **Solution**: Use `mongodump`/`mongorestore` to synchronize databases
- **Check**: Verify ObjectId format in both environments

**API 404 errors after migration:**
- **Cause**: Frontend sending old string IDs to ObjectId-only APIs
- **Solution**: Ensure frontend refreshes data to get new ObjectId strings
- **Check**: Browser dev tools for ID format in network requests

### Debugging Commands
```bash
# Check database document format
docker exec ship-collection-single-mongodb-1 mongosh ship-collection-v2 --eval "db.starshipv5.findOne({}, {_id: 1})"

# Verify API response format
curl -s "http://localhost:3000/api/starships" | jq '.data[0]._id'

# Check Docker app logs
docker logs ship-collection-single-app-1 --tail 20

# Test specific ship update
curl -X PUT "http://localhost:3000/api/starships/[OBJECT_ID]" -H "Content-Type: application/json" -d '{"retailPrice": 29.99}'

# Test pagination and status counts
curl -s "http://localhost:3000/api/starships?limit=50&page=1" | jq '{statusCounts, pagination}'

# Test large limit for Gallery/Overview modes
curl -s "http://localhost:3000/api/starships?limit=1000&page=1" | jq '.data | length'

# Test edition-specific status counts
curl -s "http://localhost:3000/api/starships?edition=regular-star-trek&limit=1" | jq '.statusCounts'

# Jest Testing Commands
npm test                    # Run all tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report
npm run test:ci             # CI-optimized test run
```

### Performance Monitoring
- **API Response Times**: Monitor for slow ObjectId conversions
- **Database Query Performance**: Check index usage with ObjectId queries
- **Memory Usage**: Watch for ObjectId conversion overhead
- **Error Rates**: Track API errors during ID format transitions