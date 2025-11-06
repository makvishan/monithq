# Database Setup Guide

## Current Status

The backend API routes are complete, but the database needs to be set up before the application can run.

## Option 1: Using PostgreSQL (Recommended for Production-like Development)

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Create Database:**
```bash
createdb siteuptime
```

**Update `.env` file:**
```env
DATABASE_URL="postgresql://localhost:5432/siteuptime?schema=public"
```

### Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Option 2: Using SQLite (Quick Development Setup)

### Update `.env` file:
```env
DATABASE_URL="file:./dev.db"
```

### Update `prisma/schema.prisma`:
Change the datasource provider from `postgresql` to `sqlite`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Option 3: Using Prisma Cloud Database

### Sign up for Prisma Data Platform:
1. Go to https://console.prisma.io/
2. Create a new project
3. Get your connection string

### Update `.env` file:
Copy the connection string from Prisma console:
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

### Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Option 4: Using Docker PostgreSQL

### Start PostgreSQL with Docker:
```bash
docker run --name siteuptime-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=siteuptime \
  -p 5432:5432 \
  -d postgres:15
```

### Update `.env` file:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/siteuptime?schema=public"
```

### Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Verify Database Setup

After running migrations, verify the setup:

```bash
# Open Prisma Studio to browse the database
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can see all your tables.

## Create First User

You can create your first user either through:

### 1. API Registration (Recommended):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin User",
    "organizationName": "My Organization"
  }'
```

### 2. Prisma Studio:
1. Open `npx prisma studio`
2. Go to Organization table, create an organization
3. Go to User table, create a user with:
   - Email, hashed password (use bcrypt), name
   - Link to the organization
   - Set role to `ORG_ADMIN` or `SUPER_ADMIN`
4. Go to Subscription table, create a free subscription for the organization

## Next Steps

After database is set up:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Go to http://localhost:3000
   - Login with the credentials you created
   - Verify role-based access works

3. **Update frontend pages:**
   - Sites page to use `/api/sites`
   - Incidents page to use `/api/incidents`
   - Team page to use `/api/organizations/team`
   - Admin pages to use `/api/admin/*`

## Troubleshooting

### Can't connect to database
- Make sure PostgreSQL service is running
- Check the DATABASE_URL in `.env` is correct
- Test connection: `psql -U postgres -d siteuptime`

### Migration fails
- Drop existing database: `dropdb siteuptime && createdb siteuptime`
- Delete `prisma/migrations` folder
- Run migrations again

### Prisma Client errors
- Re-generate client: `npx prisma generate`
- Clear cache: `rm -rf node_modules/.prisma`
- Reinstall: `npm install`

## Database Schema Overview

The migration will create these tables:

- **Organization** - Multi-tenant organization data
- **User** - User accounts with roles
- **Session** - Authentication sessions
- **Site** - Monitored websites
- **SiteCheck** - Health check history
- **Incident** - Downtime incidents
- **Subscription** - Billing plans
- **Invitation** - Team invitations
- **Notification** - User notifications
- **AuditLog** - Compliance logging

All relationships and cascades are properly configured.
