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

**Database Scripts:**
- `npm run fix-editions` - Fix edition data issues
- `npm run simple-fix` - Simple database fixes
- `npm run list-editions` - List all editions
- `npm run repair-editions` - Repair edition relationships
- `npm run direct-repair` - Direct database repair
- `npm run fix-ship-editions` - Fix ship-edition relationships
- `npm run fix-bsg-ship` - Fix Battlestar Galactica ships

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
- **MongoDB** with Mongoose ODM
- Main collection: `starshipv5` (migrated from earlier versions)
- Compound unique index on `issue + edition`
- Multiple performance indexes on commonly queried fields
- Uses centralized API handler pattern via `lib/apiHandler.ts`

### API Design Pattern
Uses factory-based API handlers:
- `createResourceApiHandler()` for single resource routes (`/api/starships/[id]`)
- `createCollectionApiHandler()` for collection routes (`/api/starships`)
- Standardized error handling, validation, and response format
- All APIs return `{ success: boolean, data?: any, message?: string, error?: string }`

### Frontend Architecture
**Next.js** with TypeScript:
- **Pages Router** (not App Router)
- **Component Structure**: 40+ React components in `/components/`
- **Custom Hooks**: `useStarshipFilters`, `useBatchOperations`, `useForm`
- **State Management**: React Context for Theme and Currency
- **Styling**: Tailwind CSS with custom theme extensions

### Key Component Categories
- **Data Management**: `StarshipList`, `DataTable`, `BatchActionManager`  
- **Specialized Views**: `FancyStarshipView`, `ExcelView`, `PriceVault`
- **Management Tools**: `ManufacturerManager`, `DatabaseFix`, `CollectionTypeManager`
- **Modals**: `BaseModal`, `PricingEditModal`, `SightingsModal`

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
- Uses current database IDs with automatic refresh on page load

### Performance Optimizations
**Next.js Config**:
- React Strict Mode disabled (compatibility with react-beautiful-dnd)
- Custom webpack config for faster development builds
- Bundle splitting optimizations for React and common dependencies
- TypeScript checking disabled in development (run manually)

**Development Notes**:
- Uses absolute imports with `@/*` path mapping
- Memory allocation increased to 4GB for large datasets
- File watching optimized to prevent lock issues

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` maps to project root
- Custom type definitions in `/types/index.ts`
- Interface definitions match Mongoose schemas exactly

## Key Patterns to Follow

### API Route Pattern
```typescript
import { createResourceApiHandler } from '../../../lib/apiHandler';
import Model from '../../../models/Model';

export default createResourceApiHandler(Model, 'ModelName', {
  allowedMethods: ['GET', 'PUT', 'DELETE'],
  customHandlers: {
    // Custom logic if needed
  }
});
```

### Component Pattern
Components use TypeScript interfaces from `/types/index.ts` and follow the established UI patterns using Tailwind classes with the custom theme.

### Database Query Pattern
Always use the centralized `dbConnect()` from `lib/mongodb.ts` and leverage the existing indexes for performance.

### Error Handling
Use the standardized error handling in `apiHandler.ts` which provides consistent error responses and handles MongoDB-specific errors (validation, duplicate keys, cast errors).