# Constants Audit Report

## Summary

This document provides a comprehensive audit of hardcoded values across the MonitHQ codebase that should be replaced with constants from `lib/constants.js`.

## New Constants Added to `lib/constants.js`

### ✅ Added Constants:
1. **`INCIDENT_SEVERITY`** - Severity levels (LOW, MEDIUM, HIGH, CRITICAL)
2. **`INCIDENT_SEVERITY_DISPLAY_NAMES`** - Display names for severity levels
3. **`INCIDENT_SEVERITY_BG_CLASSES`** - CSS classes for severity badges
4. **`NOTIFICATION_CHANNEL_IDS`** - Lowercase channel IDs for UI
5. **`WEBHOOK_EVENTS`** - Webhook event type constants
6. **`WEBHOOK_EVENT_DISPLAY_NAMES`** - Display names for webhook events
7. **`TIMEOUTS`** - Timeout values in milliseconds
8. **`PERFORMANCE_THRESHOLDS`** - Performance threshold values
9. **`TIME_PERIOD_MS`** - Time period values in milliseconds
10. **`CACHE_TTL`** - Cache time-to-live values
11. **`HTTP_STATUS_CODES`** - Common HTTP status codes

### ✅ Already Existed:
- `USER_ROLES` - User role constants
- `SITE_STATUS` - Site status constants
- `INCIDENT_STATUS` - Incident status constants
- `RESPONSE_TIME_RANGES` - Response time categorization
- `CHECK_INTERVALS` - Check interval limits

---

## Critical Issues by Category

### 🔴 Priority 1: High Impact (20+ occurrences)

#### 1. User Roles Hardcoded (20+ files)
**Impact:** High - Inconsistent role checking, difficult to maintain

**Files Affected:**
- `app/settings/page.js` (8 occurrences)
- `app/admin/users/page.js` (7 occurrences)
- `app/api/sites/route.js`
- `app/api/incidents/route.js`
- `app/api/admin/plans/route.js`
- `app/api/dashboard/stats/route.js`
- `app/api/users/settings/route.js`
- `app/api/organization/settings/route.js`
- And 12+ more files...

**Example Fix:**
```javascript
// ❌ Before
if (user.role === 'SUPER_ADMIN') { ... }
if (userData?.role === 'ORG_ADMIN' || userData?.role === 'SUPER_ADMIN') { ... }

// ✅ After
import { USER_ROLES } from '@/lib/constants';

if (user.role === USER_ROLES.SUPER_ADMIN) { ... }
if (userData?.role === USER_ROLES.ORG_ADMIN || userData?.role === USER_ROLES.SUPER_ADMIN) { ... }
```

---

#### 2. HTTP Status Codes Hardcoded (100+ occurrences)
**Impact:** Medium - Makes API response codes harder to maintain

**Files Affected:**
- `app/api/webhooks/route.js`
- `app/api/webhooks/[id]/route.js`
- `app/api/organization/settings/route.js`
- All API route files

**Example Fix:**
```javascript
// ❌ Before
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ webhook }, { status: 200 });

// ✅ After
import { HTTP_STATUS_CODES } from '@/lib/constants';

return NextResponse.json({ error: 'Not found' }, { status: HTTP_STATUS_CODES.NOT_FOUND });
return NextResponse.json({ webhook }, { status: HTTP_STATUS_CODES.OK });
```

---

#### 3. Incident Severity Hardcoded (10+ occurrences)
**Impact:** High - Inconsistent severity handling

**Files Affected:**
- `app/incidents/page.js`
- `app/sites/[id]/page.js`
- `app/status/[slug]/page.js`
- `app/api/cron/monitor/route.js`
- `lib/notify.js`

**Example Fix:**
```javascript
// ❌ Before
incident.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' :
incident.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500' :
'bg-yellow-500/10 text-yellow-500'

// ✅ After
import { INCIDENT_SEVERITY, INCIDENT_SEVERITY_BG_CLASSES } from '@/lib/constants';

INCIDENT_SEVERITY_BG_CLASSES[incident.severity] || INCIDENT_SEVERITY_BG_CLASSES[INCIDENT_SEVERITY.LOW]
```

---

### 🟡 Priority 2: Medium Impact

#### 4. Timeout Values Hardcoded (5+ files)
**Impact:** Medium - Difficult to tune performance

**Files Affected:**
- `app/api/sites/[id]/check/route.js`
- `app/api/cron/monitor/route.js`
- `lib/webhooks.js`
- `lib/ssl.js`

**Example Fix:**
```javascript
// ❌ Before
const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
if (latency > 5000) { status = 'DEGRADED'; }

// ✅ After
import { TIMEOUTS, PERFORMANCE_THRESHOLDS } from '@/lib/constants';

const timeout = setTimeout(() => controller.abort(), TIMEOUTS.HEALTH_CHECK);
if (latency > PERFORMANCE_THRESHOLDS.DEGRADED_LATENCY) { status = SITE_STATUS.DEGRADED; }
```

---

#### 5. Webhook Event Types Hardcoded (2 files)
**Impact:** Medium - Event type inconsistencies

**Files Affected:**
- `app/webhooks/page.js`
- `lib/webhooks.js` (potentially)

**Example Fix:**
```javascript
// ❌ Before
const WEBHOOK_EVENT_OPTIONS = [
  { value: 'incident_created', label: 'Incident Created' },
  { value: 'incident_updated', label: 'Incident Updated' },
  { value: 'site_down', label: 'Site Down' },
];

// ✅ After
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_DISPLAY_NAMES } from '@/lib/constants';

const WEBHOOK_EVENT_OPTIONS = Object.entries(WEBHOOK_EVENTS).map(([key, value]) => ({
  value,
  label: WEBHOOK_EVENT_DISPLAY_NAMES[value],
}));
```

---

#### 6. Time Periods Hardcoded (5+ files)
**Impact:** Medium - Inconsistent time calculations

**Files Affected:**
- `app/api/export/uptime/route.js`
- `app/api/sites/[id]/check/route.js`
- `app/api/insights/ai/route.js`
- `app/api/sites/[id]/uptime-trend/route.js`

**Example Fix:**
```javascript
// ❌ Before
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// ✅ After
import { TIME_PERIOD_MS } from '@/lib/constants';

const thirtyDaysAgo = new Date(Date.now() - TIME_PERIOD_MS.THIRTY_DAYS);
const since = new Date(Date.now() - TIME_PERIOD_MS.SEVEN_DAYS);
```

---

#### 7. Notification Channels Hardcoded (2 files)
**Impact:** Medium - Channel name inconsistencies

**Files Affected:**
- `lib/notify.js`
- `app/settings/page.js` (already using constants ✓)

**Example Fix:**
```javascript
// ❌ Before
if (channel === 'email' && config.email) { ... }
if (channel === 'slack' && config.slackWebhookUrl) { ... }

const sentChannels = { email: 0, slack: 0, sms: 0, webhook: 0 };

// ✅ After
import { NOTIFICATION_CHANNEL_IDS } from '@/lib/constants';

if (channel === NOTIFICATION_CHANNEL_IDS.EMAIL && config.email) { ... }
if (channel === NOTIFICATION_CHANNEL_IDS.SLACK && config.slackWebhookUrl) { ... }

const sentChannels = {
  [NOTIFICATION_CHANNEL_IDS.EMAIL]: 0,
  [NOTIFICATION_CHANNEL_IDS.SLACK]: 0,
  [NOTIFICATION_CHANNEL_IDS.SMS]: 0,
  [NOTIFICATION_CHANNEL_IDS.WEBHOOK]: 0,
};
```

---

### 🟢 Priority 3: Lower Impact

#### 8. Response Time Thresholds (1 file)
**Impact:** Low - Already have constants, just duplicated

**Files Affected:**
- `app/api/sites/[id]/distributions/route.js`

**Example Fix:**
```javascript
// ❌ Before
if (rt < 100) distribution['Fast (< 100ms)']++;
else if (rt < 300) distribution['Normal (100-300ms)']++;
else if (rt < 1000) distribution['Slow (300-1000ms)']++;
else distribution['Very Slow (> 1000ms)']++;

// ✅ After
import { RESPONSE_TIME_RANGES } from '@/lib/constants';

if (rt < RESPONSE_TIME_RANGES.FAST.max) distribution[RESPONSE_TIME_RANGES.FAST.label]++;
else if (rt < RESPONSE_TIME_RANGES.NORMAL.max) distribution[RESPONSE_TIME_RANGES.NORMAL.label]++;
else if (rt < RESPONSE_TIME_RANGES.SLOW.max) distribution[RESPONSE_TIME_RANGES.SLOW.label]++;
else distribution[RESPONSE_TIME_RANGES.VERY_SLOW.label]++;
```

---

## Files Requiring Updates

### Critical Priority Files (update first):

1. **`app/settings/page.js`** - 8 role checks
2. **`app/admin/users/page.js`** - 7 role checks
3. **`app/incidents/page.js`** - Severity CSS classes
4. **`app/sites/[id]/page.js`** - Severity CSS classes
5. **`lib/notify.js`** - Notification channels, severity checks
6. **`app/webhooks/page.js`** - Webhook event types
7. **`app/api/cron/monitor/route.js`** - Timeouts, thresholds, severity
8. **`app/api/sites/[id]/check/route.js`** - Timeouts, thresholds, severity

### All API Routes:
Replace HTTP status codes (200, 201, 400, 403, 404, 500) with `HTTP_STATUS_CODES` constants

---

## Recommended Action Plan

### Phase 1: High Priority (Week 1)
1. ✅ Update `lib/constants.js` with all new constants
2. Update all files with role checks to use `USER_ROLES`
3. Update all files with severity checks to use `INCIDENT_SEVERITY`
4. Update webhook event handling to use `WEBHOOK_EVENTS`

### Phase 2: Medium Priority (Week 2)
1. Update all timeout/threshold values to use constants
2. Update notification channel references
3. Update time period calculations

### Phase 3: Low Priority (Week 3)
1. Update all HTTP status codes in API routes
2. Update response time distribution logic
3. Final audit and testing

---

## Testing Checklist

After updating each file:
- [ ] Verify role-based access control still works
- [ ] Test severity filtering and display
- [ ] Verify webhook events trigger correctly
- [ ] Check notification channels work
- [ ] Validate timeout behavior
- [ ] Test API error responses

---

## Benefits of Using Constants

✅ **Single Source of Truth** - Change values in one place
✅ **Type Safety** - No typos in string literals
✅ **Better IntelliSense** - Auto-completion in IDEs
✅ **Easier Refactoring** - Find all usages easily
✅ **Better Testability** - Mock constants in tests
✅ **Maintainability** - Clear intent and documentation

---

## Notes

- The constants file is located at: `lib/constants.js`
- All new constants have been added and are ready to use
- Some files already use constants correctly (marked with ✓)
- Focus on high-priority files first for maximum impact
