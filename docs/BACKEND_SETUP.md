# Backend Setup Guide

## ✅ What's Been Created

### Database Schema (Prisma ORM)
- ✅ **User** model with role-based access (USER, ORG_ADMIN, SUPER_ADMIN)
- ✅ **Organization** model for multi-tenancy
- ✅ **Site** model for monitored websites
- ✅ **Incident** model for downtime tracking
- ✅ **Subscription** model with Stripe integration
- ✅ **Session** model for JWT token management
- ✅ **Invitation** model for team member invites
- ✅ **Notification** model for alerts
- ✅ **SiteCheck** model for uptime history
- ✅ **AuditLog** model for compliance

### API Routes Created
✅ **Authentication:**
- `POST /api/auth/register` - Create account + organization
- `POST /api/auth/login` - Login with JWT token
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/me` - Get current user info

✅ **Sites:**
- `GET /api/sites` - List all sites (org-scoped)
- `POST /api/sites` - Create new site
- `GET /api/sites/[id]` - Get site details
- `PUT /api/sites/[id]` - Update site
- `DELETE /api/sites/[id]` - Delete site

### Utilities Created
- ✅ `/lib/prisma.js` - Prisma client instance
- ✅ `/lib/crypto.js` - Password hashing & JWT functions
- ✅ `/lib/api-middleware.js` - Auth & RBAC middleware

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

Dependencies installed:
- `prisma` - ORM tool
- `@prisma/client` - Prisma client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT auth tokens
- `cookie` - Cookie management

### Step 2: Configure Database

You have two options:

#### Option A: Use Prisma Postgres (Easiest - Already Configured)
The project is already configured to use Prisma's local Postgres server.

```bash
# Start Prisma Postgres server (if not running)
npx prisma dev

# This will start a local PostgreSQL database
```

#### Option B: Use Your Own PostgreSQL Database
1. Install PostgreSQL locally or use a cloud provider
2. Update `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/monithq?schema=public"
```

### Step 3: Run Database Migrations
```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# This will create all tables defined in schema.prisma
```

### Step 4: Seed Database (Optional)
Create demo data for testing:

```bash
# Create seed file
npx prisma db seed
```

Or manually create test users via API (see Testing section).

### Step 5: View Database
```bash
# Open Prisma Studio (visual database browser)
npx prisma studio

# This opens http://localhost:5555
# You can view/edit all database records
```

## 🧪 Testing the API

### 1. Register First User (becomes Org Admin)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@monithq.com",
    "password": "admin123456",
    "name": "Admin User",
    "organizationName": "MonitHQ Demo"
  }'
```

Response:
```json
{
  "user": {
    "id": "...",
    "email": "admin@monithq.com",
    "name": "Admin User",
    "role": "ORG_ADMIN",
    "organizationId": "..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@monithq.com",
    "password": "admin123456"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create a Site
```bash
curl -X POST http://localhost:3000/api/sites \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Website",
    "url": "https://example.com",
    "checkInterval": 300,
    "region": "US East"
  }'
```

### 5. List Sites
```bash
curl -X GET http://localhost:3000/api/sites \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Update Site
```bash
curl -X PUT http://localhost:3000/api/sites/SITE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "enabled": true
  }'
```

### 7. Delete Site
```bash
curl -X DELETE http://localhost:3000/api/sites/SITE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Database Schema Overview

```
Organizations (multi-tenancy root)
  ├── Users (team members)
  │   ├── Sessions (JWT tokens)
  │   └── Notifications (alerts)
  ├── Sites (monitored websites)
  │   ├── SiteChecks (uptime history)
  │   └── Incidents (downtime records)
  ├── Subscription (billing)
  └── Invitations (pending team members)

AuditLogs (compliance tracking)
```

## 🔐 Security Features

✅ **Password Security:**
- Bcrypt hashing with salt rounds
- Minimum 8 characters enforced

✅ **JWT Authentication:**
- HTTP-only cookies
- 7-day expiration
- Secure in production

✅ **Role-Based Access Control:**
- USER - Can view/manage own sites
- ORG_ADMIN - Full org access + billing
- SUPER_ADMIN - Cross-org platform access

✅ **Organization Scoping:**
- All queries filtered by organizationId
- Super admins can bypass for platform management

✅ **Audit Logging:**
- All CRUD operations logged
- IP address and user agent captured
- Queryable for compliance

## 🎯 Next Steps (To Do)

### Remaining API Routes to Build:

1. **Organizations API** (`/api/organizations`)
   - GET /team - List team members
   - POST /team/invite - Send invitation
   - DELETE /team/:userId - Remove member
   - PUT /settings - Update org settings

2. **Incidents API** (`/api/incidents`)
   - GET / - List incidents
   - GET /:id - Get incident details
   - PUT /:id - Update incident status
   - POST /:id/resolve - Mark as resolved

3. **Super Admin API** (`/api/admin`)
   - GET /users - All users across orgs
   - GET /subscriptions - All subscriptions
   - GET /monitoring - All sites monitoring
   - PUT /users/:id/role - Change user role

4. **Subscription API** (`/api/subscriptions`)
   - GET / - Current subscription
   - POST /upgrade - Upgrade plan
   - POST /cancel - Cancel subscription
   - GET /invoices - Billing history

### Frontend Integration:
- Replace localStorage auth with API calls
- Update all pages to fetch from backend
- Add loading states
- Add error handling
- Implement real-time updates

### Background Jobs:
- Site monitoring cron job
- Incident detection
- Email notifications
- AI insights generation

### Additional Features:
- Email verification
- Password reset
- 2FA for admins
- Stripe payment integration
- Webhook handlers

## 📝 Environment Variables

Make sure these are set in `.env`:

```env
# Database
DATABASE_URL="postgresql://..."

# JWT (CHANGE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# App
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"

# Email (for invitations)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@monithq.com"

# Stripe (for payments)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

## 🐛 Troubleshooting

### Error: "Can't reach database server"
```bash
# Make sure Prisma Postgres is running
npx prisma dev

# Or check your PostgreSQL service is running
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

### Error: "Invalid token"
- Token may be expired (7 day limit)
- Try logging in again to get new token

### View Database Contents:
```bash
npx prisma studio
```

### Reset Database:
```bash
npx prisma migrate reset
# WARNING: This deletes all data!
```

## 📚 Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [JWT Best Practices](https://jwt.io/introduction)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

## ✅ Verification Checklist

- [ ] Database running (Prisma Postgres or PostgreSQL)
- [ ] Migrations completed (`npx prisma migrate dev`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] `.env` file configured with JWT_SECRET
- [ ] Can register new user via API
- [ ] Can login and receive JWT token
- [ ] Can create site with auth token
- [ ] Can view sites in Prisma Studio

Once all checked, backend is ready! 🎉
