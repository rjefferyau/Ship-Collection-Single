# Supabase Migration Guide

This document outlines the plan for migrating the Starship Collection Manager from MongoDB/Mongoose to Supabase. This migration will enable multi-tenancy, improve authentication, and reduce maintenance overhead.

## Table of Contents
- [Why Supabase?](#why-supabase)
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
```

## Database Schema

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tenants table
create table tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create starships table
create table starships (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) not null,
  issue text not null,
  edition text not null,
  edition_internal_name text,
  ship_name text not null,
  faction text not null,
  franchise text,
  manufacturer text,
  release_date date,
  image_url text,
  magazine_pdf_url text,
  owned boolean default false,
  wishlist boolean default false,
  wishlist_priority integer,
  on_order boolean default false,
  price_paid numeric,
  order_date date,
  retail_price numeric,
  purchase_price numeric,
  market_value numeric,
  condition text,
  condition_notes text,
  condition_photos text[],
  last_inspection_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index starships_tenant_id_idx on starships(tenant_id);
create unique index starships_tenant_issue_edition_idx on starships(tenant_id, issue, edition);
create index starships_faction_idx on starships(tenant_id, faction);
create index starships_franchise_idx on starships(tenant_id, franchise);

-- Enable Row Level Security
alter table starships enable row level security;

-- Create policies
create policy "Users can view their tenant's starships"
  on starships for select
  using (tenant_id = auth.uid());

create policy "Users can insert their tenant's starships"
  on starships for insert
  with check (tenant_id = auth.uid());

create policy "Users can update their tenant's starships"
  on starships for update
  using (tenant_id = auth.uid());

create policy "Users can delete their tenant's starships"
  on starships for delete
  using (tenant_id = auth.uid());
```

## Migration Script

```typescript
// scripts/migrate-to-supabase.ts
import { supabase } from '../lib/supabase'
import mongoose from 'mongoose'
import Starship from '../models/Starship'

async function migrateData() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI!)

  // Get all starships
  const starships = await Starship.find({})

  // Create a default tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Default Tenant',
      slug: 'default'
    })
    .select()
    .single()

  if (tenantError) {
    console.error('Error creating tenant:', tenantError)
    return
  }

  // Migrate starships
  for (const starship of starships) {
    const { error } = await supabase
      .from('starships')
      .insert({
        tenant_id: tenant.id,
        issue: starship.issue,
        edition: starship.edition,
        edition_internal_name: starship.editionInternalName,
        ship_name: starship.shipName,
        faction: starship.faction,
        franchise: starship.franchise,
        manufacturer: starship.manufacturer,
        release_date: starship.releaseDate,
        image_url: starship.imageUrl,
        magazine_pdf_url: starship.magazinePdfUrl,
        owned: starship.owned,
        wishlist: starship.wishlist,
        wishlist_priority: starship.wishlistPriority,
        on_order: starship.onOrder,
        price_paid: starship.pricePaid,
        order_date: starship.orderDate,
        retail_price: starship.retailPrice,
        purchase_price: starship.purchasePrice,
        market_value: starship.marketValue,
        condition: starship.condition,
        condition_notes: starship.conditionNotes,
        condition_photos: starship.conditionPhotos,
        last_inspection_date: starship.lastInspectionDate
      })

    if (error) {
      console.error('Error migrating starship:', error)
    }
  }

  console.log('Migration completed')
  process.exit(0)
}

migrateData().catch(console.error)
```

## Code Updates

### Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### API Route Example
```typescript
// pages/api/starships/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/ssr'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  // Create authenticated Supabase client for the request
  const supabase = createClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    req,
    res,
  })

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (method === 'GET') {
    const { data: starships, error } = await supabase
      .from('starships')
      .select('*')
      .eq('tenant_id', session.user.id) // Filter by tenant ID

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data: starships })
  }

  // ... other methods (POST, PUT, DELETE) should also use `supabase` and filter by `tenant_id`
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
- Tenant-specific settings

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
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 