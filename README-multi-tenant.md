# Starship Collection Manager - Multi-Tenant Edition

A modern multi-tenant web application for managing collections of Star Trek starships. Built with Next.js, Supabase (PostgreSQL), Row-Level Security, and Docker.

## Features

- **Multi-User Support**: Secure user authentication with Supabase Auth
- **Data Isolation**: Automatic Row-Level Security ensures users only access their own data
- **Admin Portal**: Master catalog management for administrators
- **Personal Collections**: Individual collection tracking with ownership status
- **Real-time Updates**: Live updates through Supabase subscriptions
- **File Management**: Image and PDF upload system integrated with Supabase Storage
- **Advanced Features**: Filtering, statistics, batch operations, and data import/export
- **Modern UI**: Responsive design with Tailwind CSS and modern React patterns
- **Docker Development**: Complete local development stack with Docker Compose

## Architecture

- **Frontend**: Next.js 15.4.1 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Database**: PostgreSQL with Row-Level Security policies
- **Authentication**: Supabase Auth with OAuth support
- **APIs**: Auto-generated REST/GraphQL APIs from database schema
- **Development**: Docker Compose with full Supabase stack

## Prerequisites

- Node.js 18+ 
- Docker Desktop
- Git

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/rjefferyau/Ship-Collection-Multi-Tenant.git
cd Ship-Collection-Multi-Tenant
npm install
```

### 2. Environment Setup
```bash
# Run setup script (creates .env.local and starts Docker services)
chmod +x scripts/setup-local-env.sh
./scripts/setup-local-env.sh
```

### 3. Start Development
```bash
# Start Next.js development server
npm run dev
```

### 4. Access Services
- **Application**: http://localhost:3000
- **Supabase Studio**: http://localhost:3002  
- **REST API**: http://localhost:3001
- **Auth API**: http://localhost:9999

## Development Commands

### Docker & Supabase
```bash
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
npm run docker:reset       # Reset database and restart
npm run supabase:studio    # Open Supabase Studio
npm run supabase:status    # Check service status
```

### Database Management
```bash
npm run db:migrate         # Run database migrations
npm run db:seed           # Seed initial data
npm run db:reset          # Reset database to clean state
```

### Data Migration (from Single-User Version)
```bash
npm run migrate:export     # Export MongoDB data
npm run migrate:transform  # Transform for PostgreSQL
npm run migrate:import     # Import to PostgreSQL
npm run migrate:validate   # Validate migration
```

### Development
```bash
npm run dev               # Start development server
npm run build             # Build for production
npm run lint              # Run ESLint
npm run type-check        # TypeScript type checking
npm run test              # Run test suite
npm run test:coverage     # Run tests with coverage
```

## Project Structure

```
├── components/           # React components
│   ├── admin/           # Admin portal components
│   ├── auth/            # Authentication components
│   ├── collections/     # Collection management
│   └── shared/          # Shared UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── supabase/        # Supabase client and utilities
│   └── utils/           # General utilities
├── pages/               # Next.js pages
│   ├── admin/           # Admin portal pages
│   ├── api/             # API routes (limited, mostly using Supabase)
│   └── dashboard/       # User dashboard pages
├── supabase/            # Database migrations and functions
│   ├── migrations/      # SQL migration files
│   └── functions/       # Edge functions
├── types/               # TypeScript type definitions
├── docker-compose.yml   # Docker services configuration
└── docs/               # Comprehensive documentation
```

## User Roles & Permissions

### Admin Users
- Manage master starship catalog
- Add/edit/remove starships from catalog
- Manage editions, manufacturers, franchises
- View system analytics
- User management capabilities

### Regular Users  
- Browse master catalog (read-only)
- Manage personal collection
- Track ownership, wishlist, and order status
- Upload personal images and notes
- View personal statistics

## Data Model

### Master Catalog (Admin-Controlled)
- **Starships**: Core starship catalog with specifications
- **Editions**: Product editions (Discovery, TNG, etc.)
- **Manufacturers**: Companies producing the models
- **Franchises**: Top-level groupings (Star Trek, BSG, etc.)

### User Collections (User-Controlled)
- **User Collections**: Personal ownership and wishlist data
- **User Sightings**: Price tracking and availability
- **User Profiles**: Extended user information and preferences

### Row-Level Security
All user data is automatically isolated using PostgreSQL Row-Level Security policies. Users can only access their own collection data without any application-level filtering required.

## Migration from Single-User Version

If you're migrating from the single-user MongoDB version:

1. **Export Your Data**: Use the migration scripts to export your current data
2. **Set Up Multi-Tenant**: Follow the setup instructions above
3. **Import Data**: Your data becomes the admin user's collection
4. **Invite Users**: Add additional users who can create their own collections

See [Data Migration Strategy](./docs/technical/data-migration-strategy.md) for detailed instructions.

## Development Workflow

This repository follows modern development practices:

- **TypeScript**: Strict typing throughout
- **ESLint/Prettier**: Code quality and formatting
- **Jest/Playwright**: Unit and E2E testing
- **Docker**: Consistent development environment
- **Row-Level Security**: Security-first database design

## Documentation

Comprehensive documentation is available in the `/docs/` directory:

- [Supabase Migration Plan](./docs/technical/supabase-migration-plan.md)
- [PostgreSQL Schema Design](./docs/technical/postgresql-schema-design.md)
- [Docker Development Setup](./docs/technical/docker-supabase-setup.md)
- [Data Migration Strategy](./docs/technical/data-migration-strategy.md)
- [Development Workflow](./docs/technical/development-workflow.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Ship-Collection-Single](https://github.com/rjefferyau/Ship-Collection-Single) - The original single-user version

## Support

For support, please open an issue on GitHub or refer to the comprehensive documentation in the `/docs/` directory.