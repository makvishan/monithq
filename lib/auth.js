// Authentication and Authorization utilities

import { USER_ROLES } from './constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get current user from localStorage (client-side only)
 * TODO: This will be replaced with API call
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Fetch current user from API
 */
export const fetchCurrentUser = async () => {
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
    
    // Store in localStorage for backward compatibility
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    return data.user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

/**
 * Check if user has a specific role
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user?.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  return roles.includes(user?.role);
};

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
    
    // Store user and token in localStorage
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
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
    
    // Store user and token in localStorage
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
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
    // Clear localStorage regardless of API call result
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }
};

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Route permissions configuration
 * Define which roles can access which routes
 */
export const ROUTE_PERMISSIONS = {
  // Public routes (no authentication required)
  '/': ['PUBLIC'],
  '/auth/login': ['PUBLIC'],
  '/auth/register': ['PUBLIC'],
  '/auth/forgot-password': ['PUBLIC'],
  
  // Regular user routes (NOT for super admin)
  '/dashboard': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/sites': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/incidents': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/insights': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/api-keys': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/webhooks': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  '/settings': [USER_ROLES.USER, USER_ROLES.ORG_ADMIN],
  
  // Organization admin only routes
  '/billing': [USER_ROLES.ORG_ADMIN],
  '/org/team': [USER_ROLES.ORG_ADMIN],
  '/org/subscriptions': [USER_ROLES.ORG_ADMIN],
  '/status-page': [USER_ROLES.ORG_ADMIN],
  
  // Super admin only routes
  '/admin': [USER_ROLES.SUPER_ADMIN],
  '/admin/dashboard': [USER_ROLES.SUPER_ADMIN],
  '/admin/users': [USER_ROLES.SUPER_ADMIN],
  '/admin/subscriptions': [USER_ROLES.SUPER_ADMIN],
  '/admin/monitoring': [USER_ROLES.SUPER_ADMIN],
  '/admin/audit-logs': [USER_ROLES.SUPER_ADMIN],
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (path, userRole = null) => {
  const role = userRole || getCurrentUser()?.role;
  
  // Check if route is public
  if (ROUTE_PERMISSIONS[path]?.includes('PUBLIC')) {
    return true;
  }
  
  // If no user, can only access public routes
  if (!role) {
    return false;
  }
  
  // Check exact match first
  const allowedRoles = ROUTE_PERMISSIONS[path];
  
  if (allowedRoles) {
    return allowedRoles.includes(role);
  }
  
  // Sort routes by length (longest first) to match most specific routes first
  const sortedRoutes = Object.entries(ROUTE_PERMISSIONS)
    .sort((a, b) => b[0].length - a[0].length);
  
  // Check for route prefix matches (e.g., /admin/dashboard/xyz -> /admin)
  for (const [routePath, roles] of sortedRoutes) {
    if (path.startsWith(routePath + '/') || path === routePath) {
      return roles.includes(role);
    }
  }
  
  // For undefined routes, deny access by default for security
  return false;
};

/**
 * Get redirect path based on user role
 */
export const getDefaultRedirect = (userRole) => {
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
};

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
