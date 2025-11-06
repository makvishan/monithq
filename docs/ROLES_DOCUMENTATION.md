# MonitHQ Role System Documentation

## 🎭 Three-Tier Role Structure

### 1. **USER** (Regular User) 🧑‍💼
**Role Code:** `user`

**Access:**
- ✅ Dashboard (personal overview)
- ✅ Sites (manage their websites)
- ✅ Incidents (view site incidents)
- ✅ Insights (AI-powered recommendations)
- ❌ Billing (hidden for regular users)
- ❌ Settings (hidden for regular users)

**Responsibilities:**
- Monitor their assigned websites
- View and respond to incidents
- Get AI-powered insights
- View dashboard metrics

**Limitations:**
- Cannot manage billing or subscriptions
- Cannot invite/remove team members
- Cannot see organization-wide settings
- No admin access

**Badge:** None (standard user)

---

### 2. **ORG_ADMIN** (Organization Admin) 👨‍💼
**Role Code:** `org_admin`

**Constraint:** **Only ONE per organization**

**Access:**
- ✅ **Everything USER can access** (Dashboard, Sites, Incidents, Insights)
- ✅ **Billing** - Manage payment methods and invoices
- ✅ **Subscriptions** - Upgrade/downgrade plans
- ✅ **Team Management** - Invite, remove, and manage team members
- ✅ **Settings** - Organization-wide settings
- ❌ Platform admin features (no system-wide access)

**Sidebar Menu:**
```
USER SECTION:
- Dashboard
- Sites
- Incidents
- Insights

ORGANIZATION SECTION:
- Billing
- Subscriptions
- Team Management
- Settings
```

**Responsibilities:**
- **Billing & Subscriptions:**
  - Manage payment methods
  - Upgrade/downgrade plans
  - View invoices and payment history
  - Handle subscription renewals

- **Team Management:**
  - Invite new team members (as USER role)
  - Remove team members
  - View team member activity
  - Manage user permissions within org

- **Organization Settings:**
  - Configure organization details
  - Set notification preferences
  - Manage API keys for the organization
  - Configure integrations

**Special Powers:**
- 💳 Control billing and subscriptions
- 👥 Manage organization users (can only add USER role, not other admins)
- ⚙️ Organization-level settings

**Badge:** Green "Org Admin" label with green shield icon

**Database Schema:**
```javascript
Organization {
  id: string
  name: string
  admin_user_id: string  // Only ONE admin per org
  subscription_id: string
  created_at: timestamp
}

User {
  id: string
  email: string
  role: 'user' | 'org_admin' | 'super_admin'
  organization_id: string
}
```

---

### 3. **SUPER_ADMIN** (MonitHQ Platform Maintainer) 🔐
**Role Code:** `super_admin`

**Who:** MonitHQ company employees/founders only

**Access:**
- ✅ **Everything ORG_ADMIN can access**
- ✅ **Platform Admin Dashboard** - System-wide statistics
- ✅ **User Management** - Manage ALL users across ALL organizations
- ✅ **Subscriptions** - View/manage ALL subscriptions
- ✅ **System Monitoring** - Monitor ALL sites across the entire platform

**Sidebar Menu:**
```
USER SECTION:
- Dashboard
- Sites
- Incidents
- Insights
- Billing
- Settings

PLATFORM ADMIN SECTION:
- Admin Dashboard (system stats)
- User Management (all users)
- Subscriptions (all subscriptions)
- System Monitoring (all sites)
```

**Responsibilities:**
- **Platform Oversight:**
  - Monitor overall platform health
  - View system-wide metrics and analytics
  - Track revenue and subscription trends
  - Identify issues across organizations

- **User Management:**
  - View all users across all organizations
  - Suspend/activate user accounts
  - Delete users (with confirmation)
  - Promote users to org_admin
  - View user activity logs

- **Subscription Management:**
  - View all subscriptions across platform
  - Issue refunds via Stripe
  - Cancel subscriptions
  - Apply discounts/promotions
  - Override billing settings

- **System Monitoring:**
  - Monitor ALL sites across ALL organizations
  - View cross-organization performance metrics
  - Track incidents platform-wide
  - Check system health (API, database, memory)

**Super Powers:**
- 🔒 Access to ALL organizations' data
- 💳 Full Stripe integration control
- 🚨 Emergency maintenance mode
- 📊 Platform-wide analytics
- ⚙️ System configuration
- 🗄️ Database access

**Badge:** Red "Super Admin" label with red shield icon

**Security:**
- Should be limited to 2-3 trusted MonitHQ team members
- Requires 2FA (future implementation)
- All actions should be logged (audit trail)

---

## 📊 Role Comparison Matrix

| Feature | USER | ORG_ADMIN | SUPER_ADMIN |
|---------|------|-----------|-------------|
| **Access Level** |
| Dashboard | ✅ | ✅ | ✅ |
| Sites | ✅ | ✅ | ✅ |
| Incidents | ✅ | ✅ | ✅ |
| Insights | ✅ | ✅ | ✅ |
| Billing | ❌ | ✅ (Own Org) | ✅ (All Orgs) |
| Team Management | ❌ | ✅ (Own Org) | ✅ (All Orgs) |
| Platform Admin | ❌ | ❌ | ✅ |
| **Capabilities** |
| Manage own sites | ✅ | ✅ | ✅ |
| View org sites | ✅ | ✅ | ✅ |
| View all platform sites | ❌ | ❌ | ✅ |
| Invite users | ❌ | ✅ | ✅ |
| Remove users | ❌ | ✅ (Own Org) | ✅ (All) |
| Change subscriptions | ❌ | ✅ (Own Org) | ✅ (All) |
| Issue refunds | ❌ | ❌ | ✅ |
| System configuration | ❌ | ❌ | ✅ |
| **Limitations** |
| Max per organization | Unlimited | **1 Only** | Platform-wide |

---

## 🔄 Role Promotion Flow

```
1. User signs up → USER role (default)
2. First user in organization → Automatically ORG_ADMIN
3. Organization owner can invite more users → They get USER role
4. Only MonitHQ team → Can set SUPER_ADMIN
```

**Important Rules:**
- ❌ Org Admin CANNOT promote themselves or others to org_admin
- ❌ Org Admin CANNOT create super_admin
- ✅ Super Admin CAN promote any user to org_admin
- ✅ Super Admin CAN demote org_admin back to user
- ✅ Only ONE org_admin per organization at any time

---

## 🎯 Implementation in Code

### Current Testing Setup
**File:** `/components/Sidebar.js` (line 13)

```javascript
// Change this to test different roles:

// Regular user (Dashboard, Sites, Incidents, Insights only)
const userRole = USER_ROLES.USER;

// Organization Admin (+ Billing, Subscriptions, Team Management)
const userRole = USER_ROLES.ORG_ADMIN;

// Super Admin (+ Platform Admin features)
const userRole = USER_ROLES.SUPER_ADMIN;
```

### Production Setup (Future)
```javascript
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();
const userRole = user?.role || USER_ROLES.USER;
const organizationId = user?.organization_id;
```

---

## 🗄️ Database Schema

```javascript
// Users Table
{
  id: string,
  email: string,
  name: string,
  role: 'user' | 'org_admin' | 'super_admin',
  organization_id: string,  // null for super_admin
  created_at: timestamp
}

// Organizations Table
{
  id: string,
  name: string,
  admin_user_id: string,      // ONE org_admin user ID
  subscription_id: string,
  plan: 'starter' | 'professional' | 'enterprise',
  created_at: timestamp
}

// Sites Table
{
  id: string,
  name: string,
  url: string,
  organization_id: string,    // All sites belong to an org
  created_by_user_id: string,
  status: string,
  created_at: timestamp
}
```

---

## 🚀 Navigation Structure by Role

### USER
```
Sidebar:
├── Dashboard
├── Sites
├── Incidents
└── Insights
```

### ORG_ADMIN
```
Sidebar:
├── Dashboard
├── Sites
├── Incidents
├── Insights
├── ─────────────── ORGANIZATION
├── Billing
├── Subscriptions
├── Team Management
└── Settings
```

### SUPER_ADMIN
```
Sidebar:
├── Dashboard
├── Sites
├── Incidents
├── Insights
├── Billing
├── Settings
├── ─────────────── PLATFORM ADMIN
├── Admin Dashboard
├── User Management
├── Subscriptions
└── System Monitoring
```

---

## 🔐 Security Best Practices

1. **Role Assignment:**
   - New signups → USER
   - First user in org → ORG_ADMIN automatically
   - Additional users → USER (invited by org_admin)
   - SUPER_ADMIN → Manual database update only

2. **One Admin Rule:**
   - Database constraint: `UNIQUE(organization_id, role='org_admin')`
   - Before promoting to org_admin → Check if org already has one
   - Transfer admin rights → Demote current admin, then promote new admin

3. **Audit Logging:**
   - Log all admin actions (especially super_admin)
   - Track billing changes
   - Monitor user role changes

4. **Future Enhancements:**
   - 2FA required for org_admin and super_admin
   - IP whitelist for super_admin access
   - Session timeout for admin roles
   - Email notifications for sensitive actions

---

## 📝 Testing the Role System

**Test as Regular User:**
```javascript
const userRole = USER_ROLES.USER;
```
**Expected:** Only see Dashboard, Sites, Incidents, Insights

**Test as Org Admin:**
```javascript
const userRole = USER_ROLES.ORG_ADMIN;
```
**Expected:** See user links + Organization section (Billing, Subscriptions, Team, Settings)

**Test as Super Admin:**
```javascript
const userRole = USER_ROLES.SUPER_ADMIN;
```
**Expected:** See everything + Platform Admin section

---

## 🎨 Visual Indicators

- **USER:** No badge, blue avatar
- **ORG_ADMIN:** Green "Org Admin" badge, green shield icon
- **SUPER_ADMIN:** Red "Super Admin" badge, red shield icon

Active menu items glow:
- USER/ORG_ADMIN links → Blue glow (`gradient-ai`)
- Organization links → Green glow (`gradient-success`)
- Platform Admin links → Orange glow (`gradient-warning`)

---

**Last Updated:** November 5, 2025
**Documentation Version:** 1.0
