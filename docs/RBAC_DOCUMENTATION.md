# Role-Based Access Control (RBAC) Implementation

## Overview

This application implements a comprehensive Role-Based Access Control (RBAC) system with three distinct user roles and route-level protection.

## User Roles

### 1. Regular User (`user`)
- **Access**: Dashboard, Sites, Incidents, Insights
- **Permissions**: Can view and manage their own sites, view incidents and insights
- **Restrictions**: No access to billing, team management, settings, or admin features

### 2. Organization Admin (`org_admin`)
- **Access**: All user features + Billing, Team Management, Settings
- **Permissions**: 
  - All regular user permissions
  - Manage organization subscription and billing
  - Invite/remove team members
  - Configure organization settings
- **Restrictions**: No access to platform admin features (cross-organization management)

### 3. Super Admin (`super_admin`)
- **Access**: Platform administration only
- **Permissions**:
  - View all users across all organizations
  - Manage all subscriptions
  - Monitor all sites system-wide
  - Access platform analytics
- **Restrictions**: No access to regular user features (by design - platform management only)

## File Structure

```
/lib/auth.js                    # Authentication utilities and RBAC logic
/components/ProtectedRoute.js   # HOC for route protection
/middleware.js                  # Next.js middleware for server-side checks
/app/**/layout.js              # Layout wrappers for protected routes
```

## Key Components

### 1. Authentication Utilities (`/lib/auth.js`)

#### Functions:
- `getCurrentUser()` - Get logged-in user from localStorage
- `isAuthenticated()` - Check if user is logged in
- `hasRole(role)` - Check if user has a specific role
- `hasAnyRole(roles)` - Check if user has any of the specified roles
- `login(userData)` - Store user session
- `logout()` - Clear user session
- `canAccessRoute(path, userRole)` - Check if user can access a route
- `getDefaultRedirect(userRole)` - Get default landing page for role

#### Route Permissions:
```javascript
export const ROUTE_PERMISSIONS = {
  // Public routes
  '/': ['PUBLIC'],
  '/auth/login': ['PUBLIC'],
  
  // Regular user routes
  '/dashboard': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN, USER_ROLES.SUPER_ADMIN],
  '/sites': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/incidents': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/insights': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  
  // Organization admin routes
  '/billing': [USER_ROLES.ORG_ADMIN],
  '/settings': [USER_ROLES.ORG_ADMIN],
  '/org/team': [USER_ROLES.ORG_ADMIN],
  
  // Super admin routes
  '/admin/dashboard': [USER_ROLES.SUPER_ADMIN],
  '/admin/users': [USER_ROLES.SUPER_ADMIN],
  '/admin/subscriptions': [USER_ROLES.SUPER_ADMIN],
  '/admin/monitoring': [USER_ROLES.SUPER_ADMIN],
};
```

### 2. Protected Route Component (`/components/ProtectedRoute.js`)

Higher-Order Component that wraps pages requiring authentication:

```javascript
<ProtectedRoute>
  <YourPageContent />
</ProtectedRoute>
```

**Features:**
- Checks if user is authenticated
- Verifies user has permission to access the route
- Redirects to login if not authenticated
- Redirects to role-appropriate page if unauthorized
- Shows loading state during verification

### 3. Middleware (`/middleware.js`)

Server-side middleware that runs before pages are rendered:
- Allows public routes without authentication
- Passes through protected routes (client-side ProtectedRoute handles auth)
- Configured to match all routes except static files

### 4. Layout Wrappers

Each protected route group has a layout file that wraps all pages in that section:

```
/app/dashboard/layout.js        # Protects dashboard
/app/sites/layout.js           # Protects sites pages
/app/incidents/layout.js       # Protects incidents pages
/app/insights/layout.js        # Protects insights pages
/app/billing/layout.js         # Protects billing (org admin only)
/app/settings/layout.js        # Protects settings (org admin only)
/app/org/layout.js             # Protects organization pages (org admin only)
/app/admin/layout.js           # Protects all admin pages (super admin only)
```

## Usage

### Login Flow

1. User enters credentials at `/auth/login`
2. Credentials validated against demo accounts
3. User data stored in localStorage via `login()` function
4. User redirected to role-appropriate page via `getDefaultRedirect()`

```javascript
// Default redirects by role:
- USER → /dashboard
- ORG_ADMIN → /dashboard
- SUPER_ADMIN → /admin/dashboard
```

### Accessing Protected Pages

1. User navigates to a protected route
2. Layout wrapper calls `<ProtectedRoute>`
3. ProtectedRoute checks:
   - Is user authenticated? If no → redirect to login
   - Does user have permission? If no → redirect to role default
4. If authorized, page content is rendered

### Logout Flow

1. User clicks logout button in UserInfo component
2. `logout()` function clears localStorage
3. User redirected to `/auth/login`

## Demo Accounts

### Regular User
```
Email: user@monithq.com
Password: user123
Access: Dashboard, Sites, Incidents, Insights
```

### Organization Admin
```
Email: admin@monithq.com
Password: admin123
Access: All user features + Billing, Team Management, Settings
```

### Super Admin
```
Email: super@monithq.com
Password: super123
Access: Admin Dashboard, User Management, All Subscriptions, System Monitoring
```

## Testing RBAC

### Test Regular User Access:
1. Login as `user@monithq.com`
2. Verify can access: Dashboard, Sites, Incidents, Insights
3. Try to access `/billing` → should redirect to /dashboard
4. Try to access `/admin/dashboard` → should redirect to /dashboard

### Test Org Admin Access:
1. Login as `admin@monithq.com`
2. Verify can access all user routes + Billing, Settings, Team Management
3. Try to access `/admin/dashboard` → should redirect to /dashboard

### Test Super Admin Access:
1. Login as `super@monithq.com`
2. Verify can access: Admin Dashboard, User Management, All Subscriptions, System Monitoring
3. Verify CANNOT access: Sites, Incidents, Insights (by design)
4. Dashboard access allowed for profile/settings

## Security Notes

### Current Implementation (Demo/Development):
- ✅ Client-side authentication using localStorage
- ✅ Route protection with automatic redirects
- ✅ Role-based menu rendering
- ⚠️ No server-side session validation
- ⚠️ No API route protection
- ⚠️ Data not scoped by organization

### Production Requirements:
- 🔒 Backend authentication with JWT/sessions
- 🔒 Server-side route protection
- 🔒 API route authorization middleware
- 🔒 Database row-level security
- 🔒 Organization-scoped data queries
- 🔒 CSRF protection
- 🔒 Rate limiting
- 🔒 Audit logging

## Adding New Protected Routes

### Step 1: Add route to permissions
```javascript
// In /lib/auth.js
export const ROUTE_PERMISSIONS = {
  ...existing,
  '/new-route': [USER_ROLES.ORG_ADMIN], // Specify allowed roles
};
```

### Step 2: Create layout (if new route group)
```javascript
// /app/new-route/layout.js
'use client';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function NewRouteLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
```

### Step 3: Create page
```javascript
// /app/new-route/page.js
'use client';

export default function NewRoutePage() {
  // Page content here
  // No need to wrap in ProtectedRoute (layout handles it)
}
```

### Step 4: Add to sidebar (if applicable)
```javascript
// In /lib/constants.js
export const ORG_ADMIN_SIDEBAR_LINKS = [
  ...existing,
  { label: 'New Route', href: '/new-route', icon: 'Icon' },
];
```

## Troubleshooting

### Issue: Infinite redirect loop
**Cause**: Route permission not defined or user doesn't have access
**Solution**: Add route to `ROUTE_PERMISSIONS` with appropriate roles

### Issue: Can access route that should be restricted
**Cause**: Missing layout wrapper or route permission too permissive
**Solution**: Add layout.js file or update ROUTE_PERMISSIONS

### Issue: "Verifying access..." never completes
**Cause**: No user in localStorage or canAccessRoute returning false
**Solution**: Check browser console, clear localStorage, re-login

### Issue: User sees wrong menu items
**Cause**: Sidebar.js not reading user role correctly
**Solution**: Verify localStorage has currentUser with role property

## Future Enhancements

- [ ] Add organization context (multi-tenancy)
- [ ] Implement backend API authentication
- [ ] Add API route protection middleware
- [ ] Create permission-based component rendering utility
- [ ] Add audit logging for role changes
- [ ] Implement session timeout
- [ ] Add "remember me" functionality
- [ ] Create admin panel for role management
- [ ] Add 2FA for super admins
- [ ] Implement organization switching for users in multiple orgs
