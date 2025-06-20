# Supabase Migration Guide

This document outlines the plan for migrating the Starship Collection Manager from MongoDB/Mongoose to Supabase. This migration will enable multi-tenancy, improve authentication, and reduce maintenance overhead.

## Table of Contents
- [Why Supabase?](#why-supabase)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Migration Plan](#migration-plan)
- [Database Schema](#database-schema)
- [Migration Script](#migration-script)
- [Code Updates](#code-updates)
- [Deployment Steps](#deployment-steps)
- [Benefits](#benefits)
- [Resources](#resources)

## Why Supabase?

### 1. Built-in Features
- Authentication system
- File storage
- Real-time capabilities
- Row Level Security for multi-tenancy
- Visual database management

### 2. Developer Benefits
- Less custom code to maintain
- Better TypeScript support
- AI-friendly codebase
- Great documentation
- Active community

### 3. Cost Benefits
- Generous free tier
- Predictable pricing
- Built-in scaling

## User Roles and Permissions

The multi-user system will have two primary user roles:

### 1. Admin Users
- Can create and manage the master catalog of starships, editions, franchises, etc.
- Can add new items to the collection catalog
- Have full access to manage all reference data
- Can view usage statistics and user data

### 2. Regular Users
- Cannot create or modify the master catalog
- Can mark items from the catalog as owned in their personal collection
- Can add items to their wishlist and set priorities
- Can track order status, condition, and purchase details for their items
- Can upload photos and notes for their owned items

This approach ensures data consistency while allowing users to maintain their personal collections based on a shared catalog.

## Migration Plan

### 1. Setup
```bash
# Install Supabase dependencies
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Environment Configuration
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # For admin operations
```

## Database Schema

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table (handled by Supabase Auth)
-- Supabase automatically creates auth.users table

-- Create user_roles enum
create type user_role as enum ('admin', 'user');

-- Create profiles table with role
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role user_role not null default 'user',
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create catalog tables (managed by admins)
create table franchises (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table editions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  internal_name text not null unique,
  description text,
  retail_price numeric,
  franchise_id uuid references franchises(id) not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name, franchise_id)
);

create table factions (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  franchise_id uuid references franchises(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table manufacturers (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table catalog_starships (
  id uuid default uuid_generate_v4() primary key,
  issue text not null,
  edition_id uuid references editions(id) not null,
  ship_name text not null,
  faction_id uuid references factions(id),
  manufacturer_id uuid references manufacturers(id),
  release_date date,
  image_url text,
  magazine_pdf_url text,
  retail_price numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(issue, edition_id)
);

-- Create user collection tables (managed by users)
create table user_starships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  catalog_starship_id uuid references catalog_starships(id) not null,
  owned boolean default false,
  wishlist boolean default false,
  wishlist_priority integer,
  on_order boolean default false,
  price_paid numeric,
  order_date date,
  purchase_price numeric,
  purchase_date date,
  market_value numeric,
  condition text,
  condition_notes text,
  condition_photos text[],
  last_inspection_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, catalog_starship_id)
);

create table user_starship_sightings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  catalog_starship_id uuid references catalog_starships(id) not null,
  location text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  price numeric,
  url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index user_starships_user_id_idx on user_starships(user_id);
create index user_starships_catalog_starship_id_idx on user_starships(catalog_starship_id);
create index catalog_starships_edition_id_idx on catalog_starships(edition_id);
create index catalog_starships_faction_id_idx on catalog_starships(faction_id);
create index catalog_starships_manufacturer_id_idx on catalog_starships(manufacturer_id);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table franchises enable row level security;
alter table editions enable row level security;
alter table factions enable row level security;
alter table manufacturers enable row level security;
alter table catalog_starships enable row level security;
alter table user_starships enable row level security;
alter table user_starship_sightings enable row level security;

-- Create policies

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Catalog tables - read-only for all authenticated users
create policy "All users can view franchises"
  on franchises for select
  using (true);

create policy "All users can view editions"
  on editions for select
  using (true);

create policy "All users can view factions"
  on factions for select
  using (true);

create policy "All users can view manufacturers"
  on manufacturers for select
  using (true);

create policy "All users can view catalog starships"
  on catalog_starships for select
  using (true);

-- Catalog tables - admin-only for write operations
create policy "Only admins can insert franchises"
  on franchises for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Only admins can update franchises"
  on franchises for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Only admins can delete franchises"
  on franchises for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Similar admin-only policies for editions, factions, manufacturers, and catalog_starships
-- (Omitted for brevity but follow the same pattern)

-- User collection policies
create policy "Users can view their own starships"
  on user_starships for select
  using (auth.uid() = user_id);

create policy "Users can insert their own starships"
  on user_starships for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own starships"
  on user_starships for update
  using (auth.uid() = user_id);

create policy "Users can delete their own starships"
  on user_starships for delete
  using (auth.uid() = user_id);

-- Sightings policies
create policy "Users can view their own sightings"
  on user_starship_sightings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sightings"
  on user_starship_sightings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sightings"
  on user_starship_sightings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sightings"
  on user_starship_sightings for delete
  using (auth.uid() = user_id);
```

## Migration Script

```typescript
// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import Starship from '../models/Starship';
import Edition from '../models/Edition';
import Faction from '../models/Faction';
import Franchise from '../models/Franchise';
import Manufacturer from '../models/Manufacturer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrateData() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI!);

  // Initialize Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Starting migration...');

  // Create admin user
  const { data: adminUser, error: adminUserError } = await supabase.auth.admin.createUser({
    email: 'admin@example.com',
    password: 'strongpassword',
    email_confirm: true
  });

  if (adminUserError) {
    console.error('Error creating admin user:', adminUserError);
    return;
  }

  // Set admin role
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: adminUser.user.id,
      role: 'admin',
      display_name: 'Admin User'
    });

  if (profileError) {
    console.error('Error creating admin profile:', profileError);
    return;
  }

  console.log('Admin user created');

  // Migrate franchises
  const franchises = await Franchise.find({});
  console.log(`Found ${franchises.length} franchises to migrate`);
  
  const franchiseMap = new Map(); // To store old ID -> new ID mapping
  
  for (const franchise of franchises) {
    const { data, error } = await supabase
      .from('franchises')
      .insert({
        name: franchise.name,
        description: franchise.description
      })
      .select()
      .single();
      
    if (error) {
      console.error(`Error migrating franchise ${franchise.name}:`, error);
      continue;
    }
    
    franchiseMap.set(franchise._id.toString(), data.id);
    console.log(`Migrated franchise: ${franchise.name}`);
  }
  
  // Migrate editions
  const editions = await Edition.find({});
  console.log(`Found ${editions.length} editions to migrate`);
  
  const editionMap = new Map(); // To store old ID -> new ID mapping
  
  for (const edition of editions) {
    const franchiseId = franchiseMap.get(edition.franchise);
    if (!franchiseId) {
      console.error(`Franchise not found for edition: ${edition.name}`);
      continue;
    }
    
    const { data, error } = await supabase
      .from('editions')
      .insert({
        name: edition.name,
        internal_name: edition.internalName,
        description: edition.description,
        retail_price: edition.retailPrice,
        franchise_id: franchiseId,
        is_default: edition.isDefault
      })
      .select()
      .single();
      
    if (error) {
      console.error(`Error migrating edition ${edition.name}:`, error);
      continue;
    }
    
    editionMap.set(edition._id.toString(), data.id);
    console.log(`Migrated edition: ${edition.name}`);
  }
  
  // Migrate factions
  // Similar pattern as above
  
  // Migrate manufacturers
  // Similar pattern as above
  
  // Migrate starships to catalog_starships
  const starships = await Starship.find({});
  console.log(`Found ${starships.length} starships to migrate`);
  
  const batchSize = 50;
  for (let i = 0; i < starships.length; i += batchSize) {
    const batch = starships.slice(i, i + batchSize);
    
    const starshipRecords = batch.map(starship => {
      const editionId = editionMap.get(starship.editionObjectId?.toString());
      
      return {
        issue: starship.issue,
        edition_id: editionId,
        ship_name: starship.shipName,
        faction_id: null, // Will need to be updated after factions are migrated
        manufacturer_id: null, // Will need to be updated after manufacturers are migrated
        release_date: starship.releaseDate,
        image_url: starship.imageUrl,
        magazine_pdf_url: starship.magazinePdfUrl,
        retail_price: starship.retailPrice
      };
    }).filter(record => record.edition_id); // Only include records with valid edition IDs
    
    if (starshipRecords.length > 0) {
      const { error } = await supabase
        .from('catalog_starships')
        .insert(starshipRecords);
  
      if (error) {
        console.error('Error migrating starship batch:', error);
      } else {
        console.log(`Migrated batch ${i/batchSize + 1} of ${Math.ceil(starships.length/batchSize)}`);
      }
    }
  }

  console.log('Migration completed');
  process.exit(0);
}

migrateData().catch(console.error);
```

## Code Updates

### Supabase Client Setup

Create utility functions to access Supabase from both client and server components:

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### Middleware for Auth Session Refresh

```typescript
// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // This will refresh the user's session if needed
  await supabase.auth.getUser()

  return response
}
```

```typescript
// middleware.ts
import { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### User Collection Management Example

```typescript
// app/collection/toggle-ownership/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get starship ID from request
  const { catalogStarshipId } = await request.json()
  
  if (!catalogStarshipId) {
    return NextResponse.json({ error: 'Missing starship ID' }, { status: 400 })
  }
  
  // Check if user already has this starship in their collection
  const { data: existingEntry } = await supabase
    .from('user_starships')
    .select('*')
    .eq('user_id', user.id)
    .eq('catalog_starship_id', catalogStarshipId)
    .single()
  
  if (existingEntry) {
    // Update existing entry
    const { data, error } = await supabase
      .from('user_starships')
      .update({
        owned: !existingEntry.owned
      })
      .eq('id', existingEntry.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } else {
    // Create new entry
    const { data, error } = await supabase
      .from('user_starships')
      .insert({
        user_id: user.id,
        catalog_starship_id: catalogStarshipId,
        owned: true
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  }
}
```

### Admin Catalog Management Example

```typescript
// app/admin/catalog/add-starship/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  // Get user session and verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }
  
  // Get starship data from request
  const starshipData = await request.json()
  
  // Insert new catalog starship
  const { data, error } = await supabase
    .from('catalog_starships')
    .insert(starshipData)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
```

## Deployment Steps

1. **Preparation**
   - Create Supabase account
   - Create new project
   - Save project URL and anon key
   - Install dependencies

2. **Database Setup**
   - Create tables in Supabase Studio
   - Set up indexes and policies
   - Test database structure

3. **Data Migration**
   - Run migration script
   - Verify data integrity
   - Test with sample data

4. **Code Updates**
   - Update API routes
   - Implement authentication
   - Update frontend components
   - Test all features

5. **Deployment**
   - Deploy to production
   - Monitor for issues
   - Roll back plan if needed

## Benefits

### 1. Multi-tenancy
- Built-in user management
- Data isolation
- Shared catalog with personal collections

### 2. Authentication
- Multiple auth providers
- Session management
- User roles

### 3. File Storage
- Built-in storage
- CDN delivery
- Access control

### 4. Real-time Features
- Live updates
- Presence
- Subscriptions

### 5. Maintenance
- Less custom code
- Better error handling
- Easier debugging

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Server-Side Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side)
- [Next.js App Router](https://nextjs.org/docs/app) 