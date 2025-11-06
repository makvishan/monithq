// ============================================
// CONSTANTS QUICK REFERENCE
// ============================================
// Import this file to see all available constants and their usage

import {
  // User Roles
  USER_ROLES,
  
  // Site/Check Status
  SITE_STATUS,
  STATUS_DISPLAY_NAMES,
  STATUS_COLORS,
  
  // Incident Status
  INCIDENT_STATUS,
  INCIDENT_STATUS_DISPLAY_NAMES,
  
  // Response Time
  RESPONSE_TIME_RANGES,
  
  // Time Periods
  TIME_PERIODS,
  
  // Limits
  DEFAULT_LIMITS,
  CHECK_INTERVALS,
  PAGINATION,
  
  // HTTP
  HTTP_STATUS,
  
  // Notifications
  NOTIFICATION_TYPES,
  
  // Charts
  CHART_COLORS,
  
  // Helper Functions
  getResponseTimeRange,
  determineSiteStatus,
} from '@/lib/constants';

// ============================================
// EXAMPLES
// ============================================

// 1. USER ROLES
// ============================================
console.log(USER_ROLES.USER);          // 'USER'
console.log(USER_ROLES.ORG_ADMIN);     // 'ORG_ADMIN'
console.log(USER_ROLES.SUPER_ADMIN);   // 'SUPER_ADMIN'

// Usage:
if (user.role === USER_ROLES.SUPER_ADMIN) {
  // Super admin access
}

// 2. SITE STATUS
// ============================================
console.log(SITE_STATUS.ONLINE);       // 'ONLINE'
console.log(SITE_STATUS.OFFLINE);      // 'OFFLINE'
console.log(SITE_STATUS.DEGRADED);     // 'DEGRADED'
console.log(SITE_STATUS.MAINTENANCE);  // 'MAINTENANCE'
console.log(SITE_STATUS.UNKNOWN);      // 'UNKNOWN'

// Display names:
console.log(STATUS_DISPLAY_NAMES[SITE_STATUS.ONLINE]); // 'Online'

// Colors:
console.log(STATUS_COLORS[SITE_STATUS.ONLINE]); // '#22c55e'

// Usage:
let status = SITE_STATUS.ONLINE;
if (responseTime > 5000) {
  status = SITE_STATUS.DEGRADED;
}

// 3. INCIDENT STATUS
// ============================================
console.log(INCIDENT_STATUS.INVESTIGATING); // 'INVESTIGATING'
console.log(INCIDENT_STATUS.IDENTIFIED);    // 'IDENTIFIED'
console.log(INCIDENT_STATUS.MONITORING);    // 'MONITORING'
console.log(INCIDENT_STATUS.RESOLVED);      // 'RESOLVED'

// Display names:
console.log(INCIDENT_STATUS_DISPLAY_NAMES[INCIDENT_STATUS.RESOLVED]); // 'Resolved'

// Usage:
await prisma.incident.create({
  data: {
    status: INCIDENT_STATUS.INVESTIGATING,
    // ...
  }
});

// 4. RESPONSE TIME RANGES
// ============================================
console.log(RESPONSE_TIME_RANGES.FAST);
// {
//   label: 'Fast (< 100ms)',
//   min: 0,
//   max: 100,
//   color: '#22c55e'
// }

// Helper function:
const category = getResponseTimeRange(250); // 'NORMAL'
const range = RESPONSE_TIME_RANGES[category];
console.log(range.label); // 'Normal (100-300ms)'
console.log(range.color); // '#3b82f6'

// 5. TIME PERIODS
// ============================================
console.log(TIME_PERIODS.HOUR_24); // '24h'
console.log(TIME_PERIODS.DAYS_7);  // '7d'
console.log(TIME_PERIODS.DAYS_30); // '30d'

// 6. LIMITS & PAGINATION
// ============================================
console.log(DEFAULT_LIMITS.CHECKS);           // 50
console.log(DEFAULT_LIMITS.INCIDENTS);        // 10
console.log(PAGINATION.DEFAULT_LIMIT);        // 20
console.log(CHECK_INTERVALS.MIN);             // 30 seconds
console.log(CHECK_INTERVALS.DEFAULT);         // 60 seconds

// 7. HTTP STATUS
// ============================================
console.log(HTTP_STATUS.SUCCESS_MIN);         // 200
console.log(HTTP_STATUS.SUCCESS_MAX);         // 299
console.log(HTTP_STATUS.SERVER_ERROR_MIN);    // 500

// Helper function:
const siteStatus = determineSiteStatus(200, 150);
console.log(siteStatus); // SITE_STATUS.ONLINE

// 8. NOTIFICATIONS
// ============================================
console.log(NOTIFICATION_TYPES.EMAIL);    // 'EMAIL'
console.log(NOTIFICATION_TYPES.WEBHOOK);  // 'WEBHOOK'
console.log(NOTIFICATION_TYPES.SLACK);    // 'SLACK'
console.log(NOTIFICATION_TYPES.SMS);      // 'SMS'

// 9. CHART COLORS
// ============================================
console.log(CHART_COLORS.PRIMARY);   // '#3b82f6'
console.log(CHART_COLORS.SUCCESS);   // '#22c55e'
console.log(CHART_COLORS.WARNING);   // '#eab308'
console.log(CHART_COLORS.DANGER);    // '#ef4444'

// ============================================
// COMMON PATTERNS
// ============================================

// Pattern 1: Prisma Query with Status
const onlineSites = await prisma.site.findMany({
  where: { 
    status: SITE_STATUS.ONLINE,
    organizationId: user.organizationId
  }
});

// Pattern 2: Status Counts
const counts = {
  online: await prisma.site.count({ 
    where: { status: SITE_STATUS.ONLINE } 
  }),
  offline: await prisma.site.count({ 
    where: { status: SITE_STATUS.OFFLINE } 
  }),
  degraded: await prisma.site.count({ 
    where: { status: SITE_STATUS.DEGRADED } 
  }),
};

// Pattern 3: Role Check
if ([USER_ROLES.ORG_ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role)) {
  // Admin access
}

// Pattern 4: Status Change Detection
if (newStatus === SITE_STATUS.ONLINE && 
    oldStatus === SITE_STATUS.OFFLINE) {
  // Site recovered
  await prisma.incident.updateMany({
    where: { 
      siteId,
      status: { not: INCIDENT_STATUS.RESOLVED }
    },
    data: { 
      status: INCIDENT_STATUS.RESOLVED,
      endTime: new Date()
    }
  });
}

// Pattern 5: Frontend Display
function StatusBadge({ status }) {
  return (
    <div 
      className="badge"
      style={{ 
        backgroundColor: STATUS_COLORS[status],
        color: 'white'
      }}
    >
      {STATUS_DISPLAY_NAMES[status]}
    </div>
  );
}

// Pattern 6: Response Time Chart
const chartData = checks.map(check => {
  const range = getResponseTimeRange(check.responseTime);
  return {
    time: check.timestamp,
    responseTime: check.responseTime,
    category: RESPONSE_TIME_RANGES[range].label,
    color: RESPONSE_TIME_RANGES[range].color
  };
});

// ============================================
// BENEFITS
// ============================================

// ✅ Single source of truth
// ✅ Easy to update (change once, applies everywhere)
// ✅ No typos (IDE autocomplete)
// ✅ Type safety (can add TypeScript later)
// ✅ Better refactoring support
// ✅ Consistent values across app
// ✅ Self-documenting code
