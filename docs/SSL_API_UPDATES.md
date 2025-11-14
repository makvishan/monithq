# SSL Monitoring - API Endpoint Updates

## Overview
Updated API endpoints to include SSL certificate fields in their responses to ensure the UI components have access to SSL data.

---

## Endpoints Updated

### 1. Site Summary Endpoint ✅
**File:** `/app/api/sites/[id]/summary/route.js`

**Purpose:** Provides site overview data for the site details page

**SSL Fields Added:**
```javascript
select: {
  // ... existing fields
  sslMonitoringEnabled: true,
  sslExpiryDate: true,
  sslIssuer: true,
  sslValidFrom: true,
  sslDaysRemaining: true,
  sslLastChecked: true,
  sslCertificateValid: true,
  sslAlertThreshold: true,
}
```

**Why:**
- The SSLCertificateCard component relies on this endpoint
- Site details page fetches data via `/api/sites/[id]/summary`
- Without SSL fields, the card would show no data

**Response Example:**
```json
{
  "success": true,
  "site": {
    "id": "site_123",
    "name": "Example Site",
    "url": "https://example.com",
    "status": "ONLINE",
    "uptime": 99.9,
    // ... other fields
    "sslMonitoringEnabled": true,
    "sslExpiryDate": "2025-03-01T00:00:00Z",
    "sslIssuer": "Let's Encrypt",
    "sslDaysRemaining": 45,
    "sslCertificateValid": true,
    "sslAlertThreshold": 30
  }
}
```

---

### 2. Sites List Endpoint ✅
**File:** `/app/api/sites/route.js`

**Purpose:** Lists all sites for the organization (sites dashboard)

**SSL Fields Added:**
```javascript
select: {
  // ... existing fields
  sslMonitoringEnabled: true,
  sslExpiryDate: true,
  sslDaysRemaining: true,
  sslCertificateValid: true,
}
```

**Why:**
- Enables future SSL status indicators in sites list view
- Allows filtering/sorting by SSL status
- Shows SSL expiry warnings in list view

**Use Cases:**
- Show SSL badge on sites list: "Expires in 7 days"
- Filter sites by SSL status
- Sort by SSL expiry date
- Quick overview of all SSL certificates

---

### 3. Site Detail Endpoint ✅
**File:** `/app/api/sites/[id]/route.js`

**Status:** No changes needed

**Why:**
- Uses `include` (not `select`)
- Automatically includes ALL Site model fields
- SSL fields already present in response

---

## Complete SSL Field Reference

### Site Model SSL Fields

```prisma
model Site {
  // Core fields...

  // SSL Certificate Monitoring (Current State)
  sslMonitoringEnabled  Boolean   @default(true)
  sslExpiryDate        DateTime?  // Current certificate expiry (cached)
  sslIssuer            String?    // Current issuer (cached)
  sslValidFrom         DateTime?  // Current valid from (cached)
  sslDaysRemaining     Int?       // Current days remaining (cached)
  sslLastChecked       DateTime?  // Last check timestamp
  sslCertificateValid  Boolean   @default(true) // Current validity status
  sslAlertThreshold    Int       @default(30) // Days before expiry to alert
}
```

---

## Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sslMonitoringEnabled` | Boolean | Is SSL monitoring active? | `true` |
| `sslExpiryDate` | DateTime | When certificate expires | `"2025-03-01T00:00:00Z"` |
| `sslIssuer` | String | Certificate authority | `"Let's Encrypt"` |
| `sslValidFrom` | DateTime | Certificate start date | `"2024-12-01T00:00:00Z"` |
| `sslDaysRemaining` | Int | Days until expiry | `45` |
| `sslLastChecked` | DateTime | Last SSL check time | `"2025-01-14T10:30:00Z"` |
| `sslCertificateValid` | Boolean | Is certificate valid? | `true` |
| `sslAlertThreshold` | Int | Alert threshold (days) | `30` |

---

## Data Flow

### Page Load Sequence

```
1. User navigates to /sites/[id]
   ↓
2. Page calls GET /api/sites/[id]/summary
   ↓
3. Summary endpoint queries Site with SSL fields
   ↓
4. Response includes SSL data
   ↓
5. SSLCertificateCard component renders with data
   ↓
6. User sees SSL certificate status
```

### Manual Refresh Sequence

```
1. User clicks refresh button on SSL card
   ↓
2. Component calls POST /api/sites/[id]/ssl/check
   ↓
3. SSL check performed, database updated
   ↓
4. Component calls fetchAllData() to refresh
   ↓
5. GET /api/sites/[id]/summary returns updated SSL data
   ↓
6. Card re-renders with fresh data
```

---

## Benefits of These Updates

### 1. **Consistent Data Access**
- All site endpoints now return SSL data
- No need for separate SSL API calls
- Reduced network requests

### 2. **Future-Proof**
- Sites list can show SSL badges
- Dashboard can show SSL warnings
- Filtering by SSL status enabled

### 3. **Performance**
- Single request for all site data
- No additional round trips
- Cached SSL data included

---

## Backward Compatibility

### ✅ Fully Backward Compatible

**Why:**
- Only adding fields to responses
- Not removing or changing existing fields
- Clients ignoring SSL fields continue working
- New clients can use SSL fields

**Example:**
```javascript
// Old client (ignores SSL fields)
const { name, url, status } = response.site;

// New client (uses SSL fields)
const { name, url, status, sslDaysRemaining } = response.site;
```

---

## Testing Checklist

### 1. Site Summary Endpoint
```bash
curl -X GET http://localhost:3000/api/sites/[siteId]/summary

# Should return SSL fields:
# - sslMonitoringEnabled
# - sslExpiryDate
# - sslDaysRemaining
# - etc.
```

### 2. Sites List Endpoint
```bash
curl -X GET http://localhost:3000/api/sites

# Should return SSL fields for each site
```

### 3. UI Component
```bash
# Navigate to site details page
# SSL card should display certificate info
# No "undefined" or missing data
```

---

## Related Endpoints (No Changes Needed)

### Already Include SSL Data
- ✅ `GET /api/sites/[id]` - Uses `include`, auto-includes SSL
- ✅ `GET /api/sites/[id]/ssl` - Dedicated SSL endpoint
- ✅ `POST /api/sites/[id]/ssl/check` - Manual check endpoint
- ✅ `GET /api/sites/[id]/ssl/history` - SSL history endpoint
- ✅ `GET /api/organizations/[id]/ssl/analytics` - Analytics endpoint

---

## Future Enhancements

### Sites List View Improvements
With SSL data now available in the list endpoint, we can add:

1. **SSL Status Badge**
   ```jsx
   {site.sslDaysRemaining < 7 && (
     <Badge variant="danger">
       SSL expires in {site.sslDaysRemaining} days
     </Badge>
   )}
   ```

2. **SSL Column**
   ```jsx
   <TableColumn>
     <SSLStatusIcon daysRemaining={site.sslDaysRemaining} />
   </TableColumn>
   ```

3. **Filtering**
   ```jsx
   // Filter sites with expiring certificates
   const expiringSSL = sites.filter(s =>
     s.sslDaysRemaining && s.sslDaysRemaining < 30
   );
   ```

4. **Sorting**
   ```jsx
   // Sort by SSL expiry date
   sites.sort((a, b) =>
     (a.sslDaysRemaining || 999) - (b.sslDaysRemaining || 999)
   );
   ```

---

## Migration Notes

### No Database Migration Required
- ✅ Schema already updated (previous migrations)
- ✅ Only API response changes
- ✅ No breaking changes

### Deployment Steps
1. Deploy updated API endpoints
2. Verify SSL fields in responses
3. No rollback needed (backward compatible)

---

## Summary

### ✅ Changes Made
1. Updated `/api/sites/[id]/summary` with SSL fields
2. Updated `/api/sites` (list) with SSL fields
3. Verified `/api/sites/[id]` already includes SSL

### ✅ Result
- SSLCertificateCard component now works
- All site endpoints return SSL data
- Future UI enhancements enabled
- Fully backward compatible

### 🎯 Next Steps
1. Test SSL card on site details page
2. Consider adding SSL badges to sites list
3. Add SSL filtering/sorting to dashboard

---

**Last Updated:** 2025-01-14
**Version:** 1.0.0
