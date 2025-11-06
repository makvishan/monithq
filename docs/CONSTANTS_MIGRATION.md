# Constants Migration Guide

This document explains how to use constants instead of hardcoded values throughout the application.

## 📦 Available Constants

All constants are exported from `/lib/constants.js`:

### User Roles
```javascript
import { USER_ROLES } from '@/lib/constants';

USER_ROLES.USER          // 'USER'
USER_ROLES.ORG_ADMIN     // 'ORG_ADMIN'
USER_ROLES.SUPER_ADMIN   // 'SUPER_ADMIN'
```

### Site/Check Status
```javascript
import { SITE_STATUS } from '@/lib/constants';

SITE_STATUS.ONLINE       // 'ONLINE'
SITE_STATUS.OFFLINE      // 'OFFLINE'
SITE_STATUS.DEGRADED     // 'DEGRADED'
SITE_STATUS.MAINTENANCE  // 'MAINTENANCE'
SITE_STATUS.UNKNOWN      // 'UNKNOWN'
```

### Incident Status
```javascript
import { INCIDENT_STATUS } from '@/lib/constants';

INCIDENT_STATUS.INVESTIGATING  // 'INVESTIGATING'
INCIDENT_STATUS.IDENTIFIED     // 'IDENTIFIED'
INCIDENT_STATUS.MONITORING     // 'MONITORING'
INCIDENT_STATUS.RESOLVED       // 'RESOLVED'
```

### Display Names
```javascript
import { STATUS_DISPLAY_NAMES, INCIDENT_STATUS_DISPLAY_NAMES } from '@/lib/constants';

STATUS_DISPLAY_NAMES[SITE_STATUS.ONLINE]  // 'Online'
INCIDENT_STATUS_DISPLAY_NAMES[INCIDENT_STATUS.RESOLVED]  // 'Resolved'
```

### Colors
```javascript
import { STATUS_COLORS, CHART_COLORS } from '@/lib/constants';

STATUS_COLORS[SITE_STATUS.ONLINE]  // '#22c55e'
CHART_COLORS.PRIMARY               // '#3b82f6'
```

### Response Time Ranges
```javascript
import { RESPONSE_TIME_RANGES, getResponseTimeRange } from '@/lib/constants';

RESPONSE_TIME_RANGES.FAST     // { label: 'Fast (< 100ms)', min: 0, max: 100, color: '#22c55e' }
getResponseTimeRange(250)     // 'NORMAL'
```

### HTTP Status Codes
```javascript
import { HTTP_STATUS } from '@/lib/constants';

HTTP_STATUS.SUCCESS_MIN       // 200
HTTP_STATUS.SUCCESS_MAX       // 299
```

### Other Constants
```javascript
import { TIME_PERIODS, DEFAULT_LIMITS, PAGINATION, NOTIFICATION_TYPES } from '@/lib/constants';

TIME_PERIODS.HOUR_24          // '24h'
DEFAULT_LIMITS.CHECKS         // 50
PAGINATION.DEFAULT_LIMIT      // 20
NOTIFICATION_TYPES.EMAIL      // 'EMAIL'
```

## 🔄 Migration Examples

### Example 1: Role Checking (BEFORE)
```javascript
// ❌ BAD - Hardcoded
if (user.role === 'SUPER_ADMIN') {
  // ...
}

if (user.role === 'ORG_ADMIN' || user.role === 'SUPER_ADMIN') {
  // ...
}
```

### Example 1: Role Checking (AFTER)
```javascript
// ✅ GOOD - Using constants
import { USER_ROLES } from '@/lib/constants';

if (user.role === USER_ROLES.SUPER_ADMIN) {
  // ...
}

if ([USER_ROLES.ORG_ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role)) {
  // ...
}
```

### Example 2: Status Checking (BEFORE)
```javascript
// ❌ BAD - Hardcoded
let status = 'ONLINE';

if (statusCode >= 500) {
  status = 'OFFLINE';
} else if (latency > 5000) {
  status = 'DEGRADED';
}

const onlineCount = sites.filter(s => s.status === 'ONLINE').length;
```

### Example 2: Status Checking (AFTER)
```javascript
// ✅ GOOD - Using constants
import { SITE_STATUS } from '@/lib/constants';

let status = SITE_STATUS.ONLINE;

if (statusCode >= 500) {
  status = SITE_STATUS.OFFLINE;
} else if (latency > 5000) {
  status = SITE_STATUS.DEGRADED;
}

const onlineCount = sites.filter(s => s.status === SITE_STATUS.ONLINE).length;
```

### Example 3: Incident Status (BEFORE)
```javascript
// ❌ BAD - Hardcoded
await prisma.incident.create({
  data: {
    status: 'INVESTIGATING',
    // ...
  }
});

await prisma.incident.update({
  where: { id },
  data: { status: 'RESOLVED' }
});
```

### Example 3: Incident Status (AFTER)
```javascript
// ✅ GOOD - Using constants
import { INCIDENT_STATUS } from '@/lib/constants';

await prisma.incident.create({
  data: {
    status: INCIDENT_STATUS.INVESTIGATING,
    // ...
  }
});

await prisma.incident.update({
  where: { id },
  data: { status: INCIDENT_STATUS.RESOLVED }
});
```

### Example 4: Prisma Queries (BEFORE)
```javascript
// ❌ BAD - Hardcoded
const sites = await prisma.site.findMany({
  where: {
    status: 'ONLINE',
    organizationId: user.organizationId
  }
});

const counts = {
  online: await prisma.site.count({ where: { status: 'ONLINE' } }),
  offline: await prisma.site.count({ where: { status: 'OFFLINE' } }),
  degraded: await prisma.site.count({ where: { status: 'DEGRADED' } }),
};
```

### Example 4: Prisma Queries (AFTER)
```javascript
// ✅ GOOD - Using constants
import { SITE_STATUS } from '@/lib/constants';

const sites = await prisma.site.findMany({
  where: {
    status: SITE_STATUS.ONLINE,
    organizationId: user.organizationId
  }
});

const counts = {
  online: await prisma.site.count({ where: { status: SITE_STATUS.ONLINE } }),
  offline: await prisma.site.count({ where: { status: SITE_STATUS.OFFLINE } }),
  degraded: await prisma.site.count({ where: { status: SITE_STATUS.DEGRADED } }),
};
```

### Example 5: Frontend Display (BEFORE)
```javascript
// ❌ BAD - Hardcoded colors and labels
const getStatusColor = (status) => {
  if (status === 'ONLINE') return '#22c55e';
  if (status === 'OFFLINE') return '#ef4444';
  if (status === 'DEGRADED') return '#eab308';
  return '#888888';
};

const getStatusLabel = (status) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};
```

### Example 5: Frontend Display (AFTER)
```javascript
// ✅ GOOD - Using constants
import { STATUS_COLORS, STATUS_DISPLAY_NAMES } from '@/lib/constants';

const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#888888';
};

const getStatusLabel = (status) => {
  return STATUS_DISPLAY_NAMES[status] || 'Unknown';
};
```

## 📝 Files Already Updated

✅ `/lib/constants.js` - Constants defined
✅ `/lib/api-middleware.js` - Role constants
✅ `/app/api/cron/monitor/route.js` - Status and incident constants

## 🔍 Files That Need Updates

Run these searches to find files with hardcoded values:

```bash
# Find hardcoded roles
grep -r "'SUPER_ADMIN'\\|'ORG_ADMIN'\\|'USER'" app/ --include="*.js"

# Find hardcoded statuses
grep -r "'ONLINE'\\|'OFFLINE'\\|'DEGRADED'" app/ --include="*.js"

# Find hardcoded incident statuses
grep -r "'INVESTIGATING'\\|'RESOLVED'\\|'MONITORING'" app/ --include="*.js"
```

### High Priority Files to Update:
1. `/app/api/sites/[id]/check/route.js` - Site checking logic
2. `/app/api/auth/register/route.js` - Default role assignment
3. `/app/api/organizations/team/*` - Role management
4. `/app/api/sites/[id]/uptime-trend/route.js` - Status filtering
5. `/app/api/dashboard/*` - Status aggregations
6. Frontend components using status colors/labels

## 🎯 Benefits

1. **Easy to Change**: Update in one place, applies everywhere
2. **Type Safety**: Reduces typos and string errors
3. **Consistency**: Same values across backend and frontend
4. **Maintainability**: Clear source of truth
5. **Autocomplete**: Better IDE support
6. **Refactoring**: Easy to find all usages

## ⚠️ Important Notes

- Always import from `@/lib/constants` or `'@/lib/constants'`
- Don't mix hardcoded strings with constants
- Use constants in both Prisma queries and comparisons
- Update related tests when migrating
- Consider creating helper functions for common checks

## 🚀 Helper Functions

The constants file includes helpful utilities:

```javascript
import { getResponseTimeRange, determineSiteStatus } from '@/lib/constants';

// Determine response time category
const category = getResponseTimeRange(responseTime);  // 'FAST', 'NORMAL', 'SLOW', 'VERY_SLOW'

// Determine site status from HTTP response
const status = determineSiteStatus(statusCode, responseTime);  // SITE_STATUS.*
```

## 📚 Next Steps

1. Update API routes in priority order
2. Update frontend components
3. Update utility functions
4. Add constants for any new hardcoded values found
5. Consider TypeScript for even better type safety
