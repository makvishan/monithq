// ============================================
// APPLICATION CONSTANTS
// ============================================

// User Roles
export const USER_ROLES = {
  USER: "USER",             // Regular user - Dashboard, Sites, Insights, Incidents, Settings
  ORG_ADMIN: "ORG_ADMIN",   // Organization Admin - One per org, manages billing & team
  SUPER_ADMIN: "SUPER_ADMIN", // MonitHQ Platform Maintainer - Full system access
};

// Site/Check Status
export const SITE_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  DEGRADED: 'DEGRADED',
  MAINTENANCE: 'MAINTENANCE',
  UNKNOWN: 'UNKNOWN',
};

// Status Display Names
export const STATUS_DISPLAY_NAMES = {
  [SITE_STATUS.ONLINE]: 'Online',
  [SITE_STATUS.OFFLINE]: 'Offline',
  [SITE_STATUS.DEGRADED]: 'Degraded',
  [SITE_STATUS.MAINTENANCE]: 'Maintenance',
  [SITE_STATUS.UNKNOWN]: 'Unknown',
};

// Status Colors
export const STATUS_COLORS = {
  [SITE_STATUS.ONLINE]: '#22c55e',
  [SITE_STATUS.OFFLINE]: '#ef4444',
  [SITE_STATUS.DEGRADED]: '#eab308',
  [SITE_STATUS.MAINTENANCE]: '#3b82f6',
  [SITE_STATUS.UNKNOWN]: '#888888',
};

// Status Emojis
export const STATUS_EMOJIS = {
  [SITE_STATUS.ONLINE]: '✅',
  [SITE_STATUS.OFFLINE]: '❌',
  [SITE_STATUS.DEGRADED]: '⚠️',
  [SITE_STATUS.MAINTENANCE]: '🔧',
  [SITE_STATUS.UNKNOWN]: '❓',
};

// Status CSS Classes for backgrounds and text
export const STATUS_BG_CLASSES = {
  [SITE_STATUS.ONLINE]: 'bg-green-500/10 text-green-500',
  [SITE_STATUS.OFFLINE]: 'bg-red-500/10 text-red-500',
  [SITE_STATUS.DEGRADED]: 'bg-yellow-500/10 text-yellow-500',
  [SITE_STATUS.MAINTENANCE]: 'bg-blue-500/10 text-blue-500',
  [SITE_STATUS.UNKNOWN]: 'bg-gray-500/10 text-gray-500',
};

// Status filter options for UI
export const STATUS_FILTERS = ['all', ...Object.values(SITE_STATUS)];

// Incident Status
export const INCIDENT_STATUS = {
  INVESTIGATING: 'INVESTIGATING',
  IDENTIFIED: 'IDENTIFIED',
  MONITORING: 'MONITORING',
  RESOLVED: 'RESOLVED',
};

// Incident Status Display Names
export const INCIDENT_STATUS_DISPLAY_NAMES = {
  [INCIDENT_STATUS.INVESTIGATING]: 'Investigating',
  [INCIDENT_STATUS.IDENTIFIED]: 'Identified',
  [INCIDENT_STATUS.MONITORING]: 'Monitoring',
  [INCIDENT_STATUS.RESOLVED]: 'Resolved',
};

// Incident Severity Levels
export const INCIDENT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

// Incident Severity Display Names
export const INCIDENT_SEVERITY_DISPLAY_NAMES = {
  [INCIDENT_SEVERITY.LOW]: 'Low',
  [INCIDENT_SEVERITY.MEDIUM]: 'Medium',
  [INCIDENT_SEVERITY.HIGH]: 'High',
  [INCIDENT_SEVERITY.CRITICAL]: 'Critical',
};

// Incident Severity CSS Classes
export const INCIDENT_SEVERITY_BG_CLASSES = {
  [INCIDENT_SEVERITY.LOW]: 'bg-blue-500/10 text-blue-500',
  [INCIDENT_SEVERITY.MEDIUM]: 'bg-yellow-500/10 text-yellow-500',
  [INCIDENT_SEVERITY.HIGH]: 'bg-orange-500/10 text-orange-500',
  [INCIDENT_SEVERITY.CRITICAL]: 'bg-red-500/10 text-red-500',
};

// Response Time Ranges
export const RESPONSE_TIME_RANGES = {
  FAST: {
    label: 'Fast (< 100ms)',
    min: 0,
    max: 100,
    color: '#22c55e',
  },
  NORMAL: {
    label: 'Normal (100-300ms)',
    min: 100,
    max: 300,
    color: '#3b82f6',
  },
  SLOW: {
    label: 'Slow (300-1000ms)',
    min: 300,
    max: 1000,
    color: '#eab308',
  },
  VERY_SLOW: {
    label: 'Very Slow (> 1000ms)',
    min: 1000,
    max: Infinity,
    color: '#ef4444',
  },
};

// Time Periods
export const TIME_PERIODS = {
  HOUR_24: '24h',
  DAYS_7: '7d',
  DAYS_30: '30d',
};

// Time Period Values (in milliseconds)
export const TIME_PERIOD_MS = {
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
};

// Cache TTL (in milliseconds)
export const CACHE_TTL = {
  STRIPE_PRICES: 60000, // 1 minute
  DEFAULT: 60000, // 1 minute
};

// Default Limits
export const DEFAULT_LIMITS = {
  CHECKS: 50,
  INCIDENTS: 10,
  SITES: 20,
  DISTRIBUTION_CHECKS: 50,
};

// Check Intervals (in seconds)
export const CHECK_INTERVALS = {
  MIN: 30,
  DEFAULT: 60,
  DEFAULT_FALLBACK: 300, // 5 minutes
  MAX: 3600,
};

// Timeout Values (in milliseconds)
export const TIMEOUTS = {
  HEALTH_CHECK: 10000, // 10 seconds for site health checks
  WEBHOOK: 10000, // 10 seconds for webhook calls
  SSL_CHECK: 10000, // 10 seconds for SSL certificate checks
};

// Performance Thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  DEGRADED_LATENCY: 5000, // 5 seconds - latency above this is considered degraded
  FAST_RESPONSE: 100,
  NORMAL_RESPONSE: 300,
  SLOW_RESPONSE: 1000,
};

// HTTP Status Code Ranges
export const HTTP_STATUS = {
  SUCCESS_MIN: 200,
  SUCCESS_MAX: 299,
  REDIRECT_MIN: 300,
  REDIRECT_MAX: 399,
  CLIENT_ERROR_MIN: 400,
  CLIENT_ERROR_MAX: 499,
  SERVER_ERROR_MIN: 500,
  SERVER_ERROR_MAX: 599,
};

// Common HTTP Status Codes
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Notification Types
export const NOTIFICATION_TYPES = {
  EMAIL: 'EMAIL',
  WEBHOOK: 'WEBHOOK',
  SLACK: 'SLACK',
  SMS: 'SMS',
};

// Notification Channel IDs (lowercase for UI)
export const NOTIFICATION_CHANNEL_IDS = {
  EMAIL: 'email',
  SLACK: 'slack',
  SMS: 'sms',
  WEBHOOK: 'webhook',
};

// Webhook Event Types
export const WEBHOOK_EVENTS = {
  INCIDENT_CREATED: 'incident_created',
  INCIDENT_UPDATED: 'incident_updated',
  INCIDENT_RESOLVED: 'incident_resolved',
  SITE_DOWN: 'site_down',
  SITE_UP: 'site_up',
  SITE_DEGRADED: 'site_degraded',
  SITE_CREATED: 'site_created',
  SITE_DELETED: 'site_deleted',
};

// Webhook Event Display Names
export const WEBHOOK_EVENT_DISPLAY_NAMES = {
  [WEBHOOK_EVENTS.INCIDENT_CREATED]: 'Incident Created',
  [WEBHOOK_EVENTS.INCIDENT_UPDATED]: 'Incident Updated',
  [WEBHOOK_EVENTS.INCIDENT_RESOLVED]: 'Incident Resolved',
  [WEBHOOK_EVENTS.SITE_DOWN]: 'Site Down',
  [WEBHOOK_EVENTS.SITE_UP]: 'Site Up',
  [WEBHOOK_EVENTS.SITE_DEGRADED]: 'Site Degraded',
  [WEBHOOK_EVENTS.SITE_CREATED]: 'Site Created',
  [WEBHOOK_EVENTS.SITE_DELETED]: 'Site Deleted',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Chart Colors (for consistency)
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#22c55e',
  WARNING: '#eab308',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
  SECONDARY: '#8b5cf6',
};

// ============================================
// API MONITORING CONSTANTS
// ============================================

// Site Types
export const SITE_TYPES = {
  WEB: 'WEB',
  API: 'API',
  PING: 'PING',
};

export const SITE_TYPE_DISPLAY_NAMES = {
  [SITE_TYPES.WEB]: 'Website',
  [SITE_TYPES.API]: 'API Endpoint',
  [SITE_TYPES.PING]: 'Ping/Port',
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
};

// Auth Types
export const AUTH_TYPES = {
  NONE: 'NONE',
  BEARER: 'BEARER',
  API_KEY: 'API_KEY',
  BASIC: 'BASIC',
};

export const AUTH_TYPE_DISPLAY_NAMES = {
  [AUTH_TYPES.NONE]: 'None',
  [AUTH_TYPES.BEARER]: 'Bearer Token',
  [AUTH_TYPES.API_KEY]: 'API Key',
  [AUTH_TYPES.BASIC]: 'Basic Auth',
};

// ============================================
// SECURITY MONITORING CONSTANTS
// ============================================

// Security Header Names
export const SECURITY_HEADERS = {
  HSTS: 'Strict-Transport-Security',
  CSP: 'Content-Security-Policy',
  X_FRAME_OPTIONS: 'X-Frame-Options',
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  X_XSS_PROTECTION: 'X-XSS-Protection',
  REFERRER_POLICY: 'Referrer-Policy',
  PERMISSIONS_POLICY: 'Permissions-Policy',
};

// Security Grades
export const SECURITY_GRADES = {
  A_PLUS: { min: 95, max: 100, label: 'A+', color: '#22c55e', bgColor: 'bg-green-500/10 text-green-500' },
  A: { min: 85, max: 94, label: 'A', color: '#22c55e', bgColor: 'bg-green-500/10 text-green-500' },
  B: { min: 70, max: 84, label: 'B', color: '#3b82f6', bgColor: 'bg-blue-500/10 text-blue-500' },
  C: { min: 50, max: 69, label: 'C', color: '#eab308', bgColor: 'bg-yellow-500/10 text-yellow-500' },
  D: { min: 30, max: 49, label: 'D', color: '#f97316', bgColor: 'bg-orange-500/10 text-orange-500' },
  F: { min: 0, max: 29, label: 'F', color: '#ef4444', bgColor: 'bg-red-500/10 text-red-500' },
};

// Security Score Weights (total should be 100)
export const SECURITY_WEIGHTS = {
  HSTS: 20,
  CSP: 25,
  X_FRAME_OPTIONS: 15,
  X_CONTENT_TYPE_OPTIONS: 10,
  X_XSS_PROTECTION: 10,
  REFERRER_POLICY: 10,
  PERMISSIONS_POLICY: 10,
};

// Security Recommendations
export const SECURITY_RECOMMENDATIONS = {
  NO_HSTS: {
    issue: 'Missing Strict-Transport-Security header',
    recommendation: 'Add Strict-Transport-Security header to enforce HTTPS connections',
    example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    severity: 'high',
  },
  WEAK_HSTS: {
    issue: 'HSTS max-age is too low',
    recommendation: 'Increase HSTS max-age to at least 1 year (31536000 seconds)',
    example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    severity: 'medium',
  },
  NO_CSP: {
    issue: 'Missing Content-Security-Policy header',
    recommendation: 'Implement Content-Security-Policy to prevent XSS and injection attacks',
    example: "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'",
    severity: 'critical',
  },
  WEAK_CSP: {
    issue: 'Content-Security-Policy is too permissive',
    recommendation: 'Tighten CSP policy by removing unsafe-inline and unsafe-eval',
    example: "Content-Security-Policy: default-src 'self'",
    severity: 'high',
  },
  NO_X_FRAME_OPTIONS: {
    issue: 'Missing X-Frame-Options header',
    recommendation: 'Add X-Frame-Options to prevent clickjacking attacks',
    example: 'X-Frame-Options: DENY or SAMEORIGIN',
    severity: 'high',
  },
  NO_X_CONTENT_TYPE: {
    issue: 'Missing X-Content-Type-Options header',
    recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME-type sniffing',
    example: 'X-Content-Type-Options: nosniff',
    severity: 'medium',
  },
  NO_X_XSS_PROTECTION: {
    issue: 'Missing X-XSS-Protection header',
    recommendation: 'Add X-XSS-Protection header (or use CSP for modern browsers)',
    example: 'X-XSS-Protection: 1; mode=block',
    severity: 'low',
  },
  NO_REFERRER_POLICY: {
    issue: 'Missing Referrer-Policy header',
    recommendation: 'Add Referrer-Policy to control referrer information',
    example: 'Referrer-Policy: strict-origin-when-cross-origin',
    severity: 'low',
  },
  NO_PERMISSIONS_POLICY: {
    issue: 'Missing Permissions-Policy header',
    recommendation: 'Add Permissions-Policy to control browser features',
    example: 'Permissions-Policy: geolocation=(), microphone=(), camera=()',
    severity: 'low',
  },
};

// Helper function to get response time range
export function getResponseTimeRange(responseTime) {
  if (responseTime < RESPONSE_TIME_RANGES.FAST.max) {
    return 'FAST';
  } else if (responseTime < RESPONSE_TIME_RANGES.NORMAL.max) {
    return 'NORMAL';
  } else if (responseTime < RESPONSE_TIME_RANGES.SLOW.max) {
    return 'SLOW';
  } else {
    return 'VERY_SLOW';
  }
}

// Helper function to determine site status from response
export function determineSiteStatus(statusCode, responseTime) {
  if (statusCode >= HTTP_STATUS.SUCCESS_MIN && statusCode <= HTTP_STATUS.SUCCESS_MAX) {
    if (responseTime > RESPONSE_TIME_RANGES.SLOW.max) {
      return SITE_STATUS.DEGRADED;
    }
    return SITE_STATUS.ONLINE;
  } else if (statusCode >= HTTP_STATUS.SERVER_ERROR_MIN) {
    return SITE_STATUS.OFFLINE;
  } else {
    return SITE_STATUS.DEGRADED;
  }
}



export const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for personal projects",
    features: [
      "Up to 3 monitored sites",
      "5-minute check intervals",
      "Email notifications",
      "7-day data retention",
      "Basic uptime reports",
      "Community support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For growing teams and businesses",
    features: [
      "Up to 25 monitored sites",
      "1-minute check intervals",
      "Email + SMS + Slack notifications",
      "90-day data retention",
      "AI-powered insights",
      "Custom status pages",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact sales",
    description: "For large organizations",
    features: [
      "Unlimited monitored sites",
      "30-second check intervals",
      "All notification channels",
      "Unlimited data retention",
      "Advanced AI models",
      "White-label options",
      "SSO & SAML",
      "SLA guarantees",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export const FEATURES = [
  {
    title: "Real-Time Monitoring",
    description:
      "Monitor your websites and APIs 24/7 with customizable check intervals from 30 seconds to 1 hour.",
    icon: "Activity",
  },
  {
    title: "AI-Powered Insights",
    description:
      "Get intelligent summaries of incidents, pattern detection, and proactive recommendations.",
    icon: "Brain",
  },
  {
    title: "Instant Alerts",
    description:
      "Receive notifications via email, SMS, Slack, or webhooks the moment an issue is detected.",
    icon: "Bell",
  },
  {
    title: "Team Collaboration",
    description:
      "Invite team members, share dashboards, and collaborate on incident resolution.",
    icon: "Users",
  },
  {
    title: "Advanced Analytics",
    description:
      "Visualize uptime trends, response times, and performance metrics with beautiful charts.",
    icon: "BarChart3",
  },
  {
    title: "Status Pages",
    description:
      "Create beautiful public or private status pages to keep your users informed.",
    icon: "Globe",
  },
];

export const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "CTO at TechCorp",
    avatar: "SC",
    content:
      "MonitHQ has been a game-changer for our DevOps team. The AI insights help us catch issues before they become critical.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Founder at StartupXYZ",
    avatar: "MR",
    content:
      "Simple, powerful, and affordable. The monitoring just works, and the alerts are lightning fast.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Engineering Lead at DataFlow",
    avatar: "EW",
    content:
      "Best monitoring tool we've used. The dashboard is beautiful and the AI summaries save us hours of investigation time.",
    rating: 5,
  },
];

export const NAVIGATION_LINKS = [
  { label: "Product", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
];

export const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Status", href: "/status" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/api" },
    { label: "Guides", href: "/guides" },
    { label: "Support", href: "/support" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Security", href: "/security" },
  ],
};

// ============================================
// MULTI-REGION MONITORING
// ============================================

export const REGIONS = {
  US_EAST: 'US_EAST',
  US_WEST: 'US_WEST',
  EU_WEST: 'EU_WEST',
  EU_CENTRAL: 'EU_CENTRAL',
  ASIA_EAST: 'ASIA_EAST',
  ASIA_SOUTHEAST: 'ASIA_SOUTHEAST',
  AUSTRALIA: 'AUSTRALIA',
  SOUTH_AMERICA: 'SOUTH_AMERICA',
};

export const REGION_INFO = {
  [REGIONS.US_EAST]: {
    name: 'North America East',
    shortName: 'US East',
    location: 'Virginia, USA',
    flag: '🇺🇸',
    coordinates: { lat: 37.4316, lng: -78.6569 },
    color: '#3b82f6',
  },
  [REGIONS.US_WEST]: {
    name: 'North America West',
    shortName: 'US West',
    location: 'California, USA',
    flag: '🇺🇸',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    color: '#8b5cf6',
  },
  [REGIONS.EU_WEST]: {
    name: 'Europe West',
    shortName: 'EU West',
    location: 'Ireland',
    flag: '🇮🇪',
    coordinates: { lat: 53.3498, lng: -6.2603 },
    color: '#10b981',
  },
  [REGIONS.EU_CENTRAL]: {
    name: 'Europe Central',
    shortName: 'EU Central',
    location: 'Frankfurt, Germany',
    flag: '🇩🇪',
    coordinates: { lat: 50.1109, lng: 8.6821 },
    color: '#06b6d4',
  },
  [REGIONS.ASIA_EAST]: {
    name: 'Asia East',
    shortName: 'Asia East',
    location: 'Tokyo, Japan',
    flag: '🇯🇵',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    color: '#f43f5e',
  },
  [REGIONS.ASIA_SOUTHEAST]: {
    name: 'Asia Southeast',
    shortName: 'Asia SE',
    location: 'Singapore',
    flag: '🇸🇬',
    coordinates: { lat: 1.3521, lng: 103.8198 },
    color: '#f59e0b',
  },
  [REGIONS.AUSTRALIA]: {
    name: 'Australia',
    shortName: 'Australia',
    location: 'Sydney, Australia',
    flag: '🇦🇺',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    color: '#ec4899',
  },
  [REGIONS.SOUTH_AMERICA]: {
    name: 'South America',
    shortName: 'S. America',
    location: 'São Paulo, Brazil',
    flag: '🇧🇷',
    coordinates: { lat: -23.5505, lng: -46.6333 },
    color: '#14b8a6',
  },
};

export const DEFAULT_REGIONS = [
  REGIONS.US_EAST,
  REGIONS.EU_WEST,
  REGIONS.ASIA_EAST,
];

export const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Sites", href: "/sites", icon: "Globe" },
  { label: "Incidents", href: "/incidents", icon: "AlertTriangle" },
  { label: "Insights", href: "/insights", icon: "Brain" },
  // { label: "API Keys", href: "/api-keys", icon: "Key" },
  { label: "Webhooks", href: "/webhooks", icon: "Webhook" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

// Admin (Organization Admin) - Additional organization management links
// Note: Billing already covers subscriptions, so only team management is added here
// Settings is already in SIDEBAR_LINKS, so no need to duplicate here
export const ORG_ADMIN_SIDEBAR_LINKS = [
  { label: "Billing", href: "/billing", icon: "CreditCard" },
  { label: "Team", href: "/org/team", icon: "Users" },
  { label: "Status Page", href: "/status-page", icon: "Globe" },
];

// Super Admin (MonitHQ Platform Maintainer)
export const ADMIN_SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "Shield" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Plans", href: "/admin/plans", icon: "Package" },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: "CreditCard" },
  { label: "System Monitoring", href: "/admin/monitoring", icon: "Activity" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "FileText" },
  { label: "Cron Jobs", href: "/admin/cron", icon: "Clock" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
  { label: "App Settings", href: "/admin/app-settings", icon: "Settings" },
];

export const NOTIFICATION_CHANNELS = [
  {
    id: "email",
    name: "Email",
    description: "Receive alerts via email",
    enabled: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send alerts to Slack channels",
    enabled: false,
  },
  {
    id: "sms",
    name: "SMS",
    description: "Get text message alerts",
    enabled: false,
    premium: true,
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "POST alerts to custom endpoints",
    enabled: false,
  },
];
