# RBAC Quick Reference

## 🔐 Demo Login Credentials

| Role | Email | Password | Default Redirect |
|------|-------|----------|-----------------|
| **Regular User** | user@monithq.com | user123 | /dashboard |
| **Org Admin** | admin@monithq.com | admin123 | /dashboard |
| **Super Admin** | super@monithq.com | super123 | /admin/dashboard |

## 📊 Access Matrix

| Route | User | Org Admin | Super Admin |
|-------|------|-----------|-------------|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/sites` | ✅ | ✅ | ❌ |
| `/incidents` | ✅ | ✅ | ❌ |
| `/insights` | ✅ | ✅ | ❌ |
| `/billing` | ❌ | ✅ | ❌ |
| `/settings` | ❌ | ✅ | ❌ |
| `/org/team` | ❌ | ✅ | ❌ |
| `/admin/dashboard` | ❌ | ❌ | ✅ |
| `/admin/users` | ❌ | ❌ | ✅ |
| `/admin/subscriptions` | ❌ | ❌ | ✅ |
| `/admin/monitoring` | ❌ | ❌ | ✅ |

## 🎯 Menu Items by Role

### Regular User (4 items)
- Dashboard
- Sites
- Incidents
- Insights

### Org Admin (4 user items + 3 org items)
**User Features:**
- Dashboard
- Sites
- Incidents
- Insights

**ORGANIZATION Section:**
- Billing
- Team Management
- Settings

### Super Admin (4 admin items only)
- Admin Dashboard
- User Management
- All Subscriptions
- System Monitoring

## 🚀 Testing Checklist

### Test Regular User:
- [ ] Login with user@monithq.com
- [ ] See 4 menu items
- [ ] Can access /dashboard
- [ ] Can access /sites
- [ ] Redirected from /billing to /dashboard
- [ ] Redirected from /admin/dashboard to /dashboard

### Test Org Admin:
- [ ] Login with admin@monithq.com
- [ ] See 7 menu items (4 user + 3 org)
- [ ] Can access all user routes
- [ ] Can access /billing
- [ ] Can access /org/team
- [ ] Redirected from /admin/dashboard to /dashboard

### Test Super Admin:
- [ ] Login with super@monithq.com
- [ ] See 4 admin menu items only
- [ ] Can access /admin/dashboard
- [ ] Can access /admin/users
- [ ] CANNOT access /sites
- [ ] Can access /dashboard (profile access)

## 📁 Key Files

```
/lib/auth.js                    # RBAC logic & route permissions
/lib/constants.js               # Role definitions & menu links
/components/ProtectedRoute.js   # Route protection wrapper
/components/Sidebar.js          # Role-based menu rendering
/components/UserInfo.js         # User display & logout
/middleware.js                  # Server-side route middleware
/app/**/layout.js              # Route group protection
```

## 🔧 Common Functions

```javascript
// Check if logged in
isAuthenticated()

// Get current user
getCurrentUser() // Returns { name, email, role }

// Check specific role
hasRole('org_admin')

// Check any of multiple roles
hasAnyRole(['user', 'org_admin'])

// Check route access
canAccessRoute('/billing', 'org_admin')

// Login
login({ name: 'John', email: 'john@ex.com', role: 'user' })

// Logout
logout()
```

## 🎨 Role Indicators

### Sidebar Badges:
- **Org Admin**: Green badge with shield icon
- **Super Admin**: Red badge with shield icon
- **User**: No badge (default)

### Sidebar Glow:
- **User**: Blue glow
- **Org Admin**: Green glow
- **Super Admin**: Orange glow

## ⚠️ Important Notes

1. **Super Admin Design**: Intentionally has NO access to user features (Sites, Incidents, Insights). This is by design - super admins manage the platform, not individual sites.

2. **Dashboard Access**: All roles can access /dashboard for profile/settings, but content varies by role.

3. **Organization Scope**: In production, org admins should only see their organization's data. Currently shows dummy data.

4. **localStorage Only**: This is a demo implementation. Production requires backend authentication.

5. **No Duplicates**: Each feature appears in only ONE menu section to avoid confusion.
