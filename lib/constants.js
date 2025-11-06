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
  MAX: 3600,
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

// Notification Types
export const NOTIFICATION_TYPES = {
  EMAIL: 'EMAIL',
  WEBHOOK: 'WEBHOOK',
  SLACK: 'SLACK',
  SMS: 'SMS',
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

// ============================================
// DUMMY DATA FOR DEVELOPMENT
// ============================================

export const DUMMY_SITES = [
  {
    id: 1,
    name: "Main Website",
    url: "https://example.com",
    status: "online",
    uptime: 99.98,
    averageLatency: 145,
    lastChecked: new Date(Date.now() - 120000).toISOString(),
    region: "US East",
  },
  {
    id: 2,
    name: "API Server",
    url: "https://api.example.com",
    status: "online",
    uptime: 99.95,
    averageLatency: 89,
    lastChecked: new Date(Date.now() - 60000).toISOString(),
    region: "EU West",
  },
  {
    id: 3,
    name: "Blog",
    url: "https://blog.example.com",
    status: "degraded",
    uptime: 98.5,
    averageLatency: 320,
    lastChecked: new Date(Date.now() - 300000).toISOString(),
    region: "Asia Pacific",
  },
  {
    id: 4,
    name: "Dashboard",
    url: "https://dashboard.example.com",
    status: "online",
    uptime: 100,
    averageLatency: 112,
    lastChecked: new Date(Date.now() - 180000).toISOString(),
    region: "US West",
  },
  {
    id: 5,
    name: "Documentation",
    url: "https://docs.example.com",
    status: "maintenance",
    uptime: 97.2,
    averageLatency: 205,
    lastChecked: new Date(Date.now() - 900000).toISOString(),
    region: "US East",
  },
];

export const DUMMY_INCIDENTS = [
  {
    id: 1,
    siteId: 1,
    siteName: "Main Website",
    status: "resolved",
    startTime: new Date(Date.now() - 7200000).toISOString(),
    endTime: new Date(Date.now() - 5400000).toISOString(),
    duration: 1800000, // 30 minutes in ms
    aiSummary:
      "Server experienced high load due to increased traffic from marketing campaign. Auto-scaled successfully after 30 minutes.",
    severity: "medium",
  },
  {
    id: 2,
    siteId: 2,
    siteName: "API Server",
    status: "resolved",
    startTime: new Date(Date.now() - 172800000).toISOString(),
    endTime: new Date(Date.now() - 172200000).toISOString(),
    duration: 600000, // 10 minutes
    aiSummary:
      "Database connection timeout caused API endpoint failures. Connection pool was exhausted and required restart.",
    severity: "high",
  },
  {
    id: 3,
    siteId: 3,
    siteName: "Blog",
    status: "investigating",
    startTime: new Date(Date.now() - 900000).toISOString(),
    endTime: null,
    duration: 900000, // ongoing
    aiSummary:
      "Elevated response times detected. Currently investigating CDN cache performance issues.",
    severity: "low",
  },
  {
    id: 4,
    siteId: 1,
    siteName: "Main Website",
    status: "resolved",
    startTime: new Date(Date.now() - 604800000).toISOString(),
    endTime: new Date(Date.now() - 601200000).toISOString(),
    duration: 3600000, // 1 hour
    aiSummary:
      "SSL certificate renewal caused brief interruption. Certificate was successfully renewed and service restored.",
    severity: "low",
  },
];

export const DUMMY_AI_INSIGHTS = [
  {
    id: 1,
    title: "Uptime Performance This Week",
    summary:
      "Your monitored sites maintained an average uptime of 99.1% this week, which is 0.3% below your monthly target. The Blog experienced the most downtime with 15 minutes of degraded performance.",
    confidence: 0.95,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: "performance",
    icon: "TrendingUp",
  },
  {
    id: 2,
    title: "Response Time Trend",
    summary:
      "Average latency increased by 15% yesterday across all monitored endpoints. This spike correlates with increased traffic from 2-4 PM UTC. Consider scaling your infrastructure during peak hours.",
    confidence: 0.89,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: "alert",
    icon: "AlertTriangle",
  },
  {
    id: 3,
    title: "Incident Pattern Detection",
    summary:
      "AI detected a recurring pattern: your API Server experiences connection timeouts every Tuesday around 3 AM UTC. This might be related to scheduled database maintenance tasks.",
    confidence: 0.92,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    type: "pattern",
    icon: "Brain",
  },
  {
    id: 4,
    title: "Optimization Opportunity",
    summary:
      "Your Blog could benefit from better CDN caching. 68% of requests are cache misses. Implementing proper cache headers could reduce response time by an estimated 40%.",
    confidence: 0.87,
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    type: "recommendation",
    icon: "Lightbulb",
  },
  {
    id: 5,
    title: "Geographic Performance",
    summary:
      "Users from Asia Pacific region experience 2.3x slower response times compared to US East. Consider deploying edge servers in APAC regions to improve user experience.",
    confidence: 0.91,
    timestamp: new Date(Date.now() - 432000000).toISOString(),
    type: "recommendation",
    icon: "Globe",
  },
];

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

export const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Sites", href: "/sites", icon: "Globe" },
  { label: "Incidents", href: "/incidents", icon: "AlertTriangle" },
  { label: "Insights", href: "/insights", icon: "Brain" },
  { label: "API Keys", href: "/api-keys", icon: "Key" },
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
