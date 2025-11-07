// Authentication and Authorization utilities

import { USER_ROLES } from './constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Cookie-based and async authentication utilities
export async function fetchCurrentUser() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.user || data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Login user via API
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // No localStorage storage for user or token
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register user via API
 */
export const register = async (email, password, name, organizationName) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, organizationName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    
    // No localStorage storage for user or token
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout user via API
 */
export const logout = async () => {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // No localStorage cleanup needed
  }
};

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

export function canAccessRoute(path, userRole = null) {
  const role = userRole;
  // Check if route is public
  if (ROUTE_PERMISSIONS[path]?.includes('PUBLIC')) {
    return true;
  }
  if (!role) {
    return false;
  }
  const allowedRoles = ROUTE_PERMISSIONS[path];
  if (allowedRoles) {
    return allowedRoles.includes(role);
  }
  const sortedRoutes = Object.entries(ROUTE_PERMISSIONS)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [routePath, roles] of sortedRoutes) {
    if (path.startsWith(routePath + '/') || path === routePath) {
      return roles.includes(role);
    }
  }
  return false;
}

export function getDefaultRedirect(userRole) {
  switch (userRole) {
    case USER_ROLES.SUPER_ADMIN:
      return '/admin/dashboard';
    case USER_ROLES.ORG_ADMIN:
      return '/dashboard';
    case USER_ROLES.USER:
      return '/dashboard';
    default:
      return '/auth/login';
  }
}
  
// Route permissions object
export const ROUTE_PERMISSIONS = {
  // Regular user and org admin
  '/dashboard': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/sites': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/incidents': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/insights': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/api-keys': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/webhooks': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/settings': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],

  // Org admin only
  '/billing': [USER_ROLES.ORG_ADMIN],
  '/org/team': [USER_ROLES.ORG_ADMIN],
  '/status-page': [USER_ROLES.ORG_ADMIN],

  // Super admin only
  '/admin': [USER_ROLES.SUPER_ADMIN],
  '/admin/dashboard': [USER_ROLES.SUPER_ADMIN],
  '/admin/users': [USER_ROLES.SUPER_ADMIN],
  '/admin/plans': [USER_ROLES.SUPER_ADMIN],
  '/admin/subscriptions': [USER_ROLES.SUPER_ADMIN],
  '/admin/monitoring': [USER_ROLES.SUPER_ADMIN],
  '/admin/audit-logs': [USER_ROLES.SUPER_ADMIN],
  '/admin/cron': [USER_ROLES.SUPER_ADMIN],
  '/analytics': [USER_ROLES.SUPER_ADMIN],
  '/admin/app-settings': [USER_ROLES.SUPER_ADMIN],
}

/**
 * Check if user can access a specific route
 */
// Removed duplicate canAccessRoute export

/**
 * Get redirect path based on user role
 */
// Removed duplicate getDefaultRedirect export

/**
 * Check if user is regular user
 */
export const isRegularUser = () => {
  return hasRole(USER_ROLES.USER);
};

/**
 * Check if user is organization admin
 */
export const isOrgAdmin = () => {
  return hasRole(USER_ROLES.ORG_ADMIN);
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = () => {
  return hasRole(USER_ROLES.SUPER_ADMIN);
};
