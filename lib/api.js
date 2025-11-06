// API client utilities

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Make an API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    credentials: 'include',
    headers: getAuthHeaders(),
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Sites API
export const sitesAPI = {
  getAll: async () => {
    return apiRequest('/api/sites');
  },
  
  getById: async (id) => {
    return apiRequest(`/api/sites/${id}`);
  },
  
  create: async (siteData) => {
    return apiRequest('/api/sites', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
  },
  
  update: async (id, siteData) => {
    return apiRequest(`/api/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(siteData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/sites/${id}`, {
      method: 'DELETE',
    });
  },

  check: async (id) => {
    return apiRequest(`/api/sites/${id}/check`, {
      method: 'POST',
    });
  },
};

// Incidents API
export const incidentsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.siteId) params.append('siteId', filters.siteId);
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/api/incidents${query}`);
  },
  
  getById: async (id) => {
    return apiRequest(`/api/incidents/${id}`);
  },
  
  update: async (id, incidentData) => {
    return apiRequest(`/api/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
  },
  
  resolve: async (id, aiSummary = '') => {
    return apiRequest(`/api/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'RESOLVED',
        aiSummary,
      }),
    });
  },
};

// Organizations API
export const organizationsAPI = {
  getTeam: async () => {
    return apiRequest('/api/organizations/team');
  },
  
  inviteMember: async (email, role = 'USER') => {
    return apiRequest('/api/organizations/team/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },
  
  removeMember: async (userId) => {
    return apiRequest(`/api/organizations/team/${userId}`, {
      method: 'DELETE',
    });
  },
  
  getSettings: async () => {
    return apiRequest('/api/organizations/settings');
  },
  
  updateSettings: async (settings) => {
    return apiRequest('/api/organizations/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// Admin API
export const adminAPI = {
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.organizationId) params.append('organizationId', filters.organizationId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/api/admin/users${query}`);
  },
  
  getSubscriptions: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.plan) params.append('plan', filters.plan);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/api/admin/subscriptions${query}`);
  },
  
  getMonitoring: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.region) params.append('region', filters.region);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/api/admin/monitoring${query}`);
  },
};

export default {
  sites: sitesAPI,
  incidents: incidentsAPI,
  organizations: organizationsAPI,
  admin: adminAPI,
};
