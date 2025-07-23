# Repository Split Setup Guide

## Manual Steps for Creating Multi-Tenant Repository

Since you'll be creating the new repository manually, follow these exact steps:

### Step 1: Create New Repository
```bash
# In /Users/ryanjeffery/webdev/
git clone Ship-Collection-Single Ship-Collection-Multi-Tenant
cd Ship-Collection-Multi-Tenant

# Update remote origin (you'll need to create the GitHub repo first)
git remote set-url origin https://github.com/rjefferyau/Ship-Collection-Multi-Tenant.git
```

### Step 2: Copy Configuration Files
After cloning, you'll need to copy these files that I'm preparing:

1. **docker-compose.yml** - Complete Supabase stack
2. **docker-compose.override.yml** - Development overrides
3. **Dockerfile.dev** - Development container
4. **.env.example** - Environment template
5. **Updated package.json** - With Supabase dependencies
6. **Setup scripts** in `/scripts/` directory

### Step 3: File Migration
```bash
# Copy upload files (preserve structure)
# All your images and PDFs need to be copied exactly as they are
cp -r ../Ship-Collection-Single/public/uploads/* public/uploads/
```

### Step 4: Install Dependencies
```bash
# Remove old dependencies and install new ones
npm uninstall mongodb mongoose @types/mongodb
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react
npm install postgres @types/pg
npm install --save-dev @supabase/cli
```

### Step 5: Run Setup
```bash
# Make scripts executable
chmod +x scripts/*.sh
# Run setup
./scripts/setup-local-env.sh
```

## Files Being Prepared

I'm creating all the necessary configuration files that you'll need to copy into the new repository. These include:
- Complete Docker Compose configuration for Supabase
- Environment configuration templates  
- Setup and migration scripts
- Updated package.json with correct dependencies
- Database migration scripts for your data

## Next Steps After Repository Creation

1. Create the new GitHub repository: `Ship-Collection-Multi-Tenant`
2. Clone the single-user repo to create the multi-tenant version
3. Copy the configuration files I'm preparing
4. Run the setup scripts
5. Test the development environment
6. Migrate your database and upload files

Let me know when you've created the new repository and I'll guide you through the specific file updates and migration process!