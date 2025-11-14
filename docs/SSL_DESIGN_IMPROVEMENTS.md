# SSL Monitoring - Design Improvements

## Overview
Based on feedback, we've improved the SSL monitoring design to include **historical tracking** via a separate `SSLCheck` model, similar to how `SiteCheck` tracks uptime history.

---

## Original Design (v1.0)

### ❌ Issues with Original Design
```prisma
model Site {
  // SSL data stored directly in Site model
  sslMonitoringEnabled  Boolean
  sslExpiryDate        DateTime?
  sslIssuer            String?
  sslValidFrom         DateTime?
  sslDaysRemaining     Int?
  sslLastChecked       DateTime?
  sslCertificateValid  Boolean
  sslAlertThreshold    Int
}
```

**Problems:**
- ❌ No historical tracking
- ❌ Can't see when certificates were renewed
- ❌ Can't analyze SSL trends over time
- ❌ No audit trail for certificate changes
- ❌ Limited to current state only

---

## Improved Design (v1.1) ✅

### Hybrid Approach: Current State + Historical Records

```prisma
model Site {
  // Current SSL state (cached for quick access)
  sslMonitoringEnabled  Boolean   @default(true)
  sslExpiryDate        DateTime?  // Cached from last check
  sslIssuer            String?    // Cached
  sslValidFrom         DateTime?  // Cached
  sslDaysRemaining     Int?       // Cached
  sslLastChecked       DateTime?
  sslCertificateValid  Boolean   @default(true)
  sslAlertThreshold    Int       @default(30)

  // Relationship to historical checks
  sslChecks            SSLCheck[]
}

model SSLCheck {
  id                String    @id @default(cuid())
  siteId            String

  // Certificate details
  valid             Boolean   @default(false)
  issuer            String?
  subject           String?
  validFrom         DateTime?
  validTo           DateTime?
  daysRemaining     Int?

  // Security details
  serialNumber      String?
  fingerprint       String?
  algorithm         String?
  authorized        Boolean?
  authorizationError String?
  errorMessage      String?

  checkedAt         DateTime  @default(now())

  site Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@index([checkedAt])
  @@index([validTo])
}
```

---

## Benefits of New Design

### ✅ Advantages

1. **Historical Tracking**
   - See all SSL checks over time
   - Track certificate renewals
   - Audit trail of certificate changes

2. **Performance**
   - Quick access to current state from `Site` model
   - No need to query `SSLCheck` for current status
   - Efficient dashboard queries

3. **Analytics**
   - Trend analysis: How often are certificates renewed?
   - Detect patterns: Certificate expiring on same day every year?
   - Compliance: Prove certificates were valid during specific periods

4. **Debugging**
   - See exactly when a certificate became invalid
   - Track serial number changes (renewals)
   - Identify issuer changes

5. **Consistency**
   - Matches existing `SiteCheck` pattern
   - Familiar structure for developers
   - Easy to extend with new fields

---

## Data Flow

### Every SSL Check (Daily or Manual)

```
┌─────────────────────────────────────┐
│  1. Check SSL Certificate          │
│     (TLS handshake)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Update Site (current state)     │
│     - sslExpiryDate                 │
│     - sslIssuer                     │
│     - sslDaysRemaining              │
│     - sslLastChecked                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Create SSLCheck Record          │
│     (historical snapshot)           │
│     - All certificate details       │
│     - Serial number                 │
│     - Fingerprint                   │
│     - Timestamp                     │
└─────────────────────────────────────┘
```

---

## Use Cases Enabled

### 1. Certificate Renewal Detection
```javascript
// Find when certificate was renewed
const renewals = await prisma.sSLCheck.findMany({
  where: { siteId: 'site_123' },
  orderBy: { checkedAt: 'desc' },
  take: 100
});

// Detect serial number changes
let lastSerial = null;
renewals.forEach(check => {
  if (lastSerial && check.serialNumber !== lastSerial) {
    console.log(`Certificate renewed on ${check.checkedAt}`);
  }
  lastSerial = check.serialNumber;
});
```

### 2. SSL Uptime Calculation
```javascript
// Calculate SSL uptime over last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const checks = await prisma.sSLCheck.findMany({
  where: {
    siteId: 'site_123',
    checkedAt: { gte: thirtyDaysAgo }
  }
});

const validChecks = checks.filter(c => c.valid).length;
const sslUptime = (validChecks / checks.length) * 100;
console.log(`SSL Uptime: ${sslUptime}%`);
```

### 3. Compliance Reports
```javascript
// Prove certificate was valid during specific period
const proof = await prisma.sSLCheck.findMany({
  where: {
    siteId: 'site_123',
    checkedAt: {
      gte: new Date('2025-01-01'),
      lte: new Date('2025-01-31')
    },
    valid: true
  }
});

console.log(`Valid SSL checks in January: ${proof.length}`);
```

### 4. Trend Analysis
```javascript
// See certificate expiry date changes over time
const history = await prisma.sSLCheck.findMany({
  where: { siteId: 'site_123' },
  orderBy: { checkedAt: 'desc' },
  select: {
    checkedAt: true,
    validTo: true,
    daysRemaining: true,
    issuer: true
  }
});

// Chart showing days remaining over time
```

---

## API Endpoints

### New: SSL Check History

**GET /api/sites/[id]/ssl/history**

```bash
curl -X GET /api/sites/site_123/ssl/history?limit=30&offset=0
```

**Response:**
```json
{
  "success": true,
  "sslChecks": [
    {
      "id": "check_001",
      "siteId": "site_123",
      "valid": true,
      "issuer": "Let's Encrypt",
      "subject": "example.com",
      "validFrom": "2024-01-01T00:00:00Z",
      "validTo": "2025-04-01T00:00:00Z",
      "daysRemaining": 45,
      "serialNumber": "ABC123",
      "checkedAt": "2025-01-14T05:00:00Z"
    }
  ],
  "certificateChanges": [
    {
      "type": "renewal",
      "date": "2025-01-10T00:00:00Z",
      "from": {
        "serialNumber": "OLD123",
        "validTo": "2025-01-15T00:00:00Z",
        "issuer": "Let's Encrypt"
      },
      "to": {
        "serialNumber": "NEW456",
        "validTo": "2025-04-15T00:00:00Z",
        "issuer": "Let's Encrypt"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 30,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Migration Applied

**Migration:** `20251114052336_add_ssl_check_history`

```sql
-- CreateTable
CREATE TABLE "SSLCheck" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT false,
    "issuer" TEXT,
    "subject" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "daysRemaining" INTEGER,
    "serialNumber" TEXT,
    "fingerprint" TEXT,
    "algorithm" TEXT,
    "authorized" BOOLEAN,
    "authorizationError" TEXT,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSLCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SSLCheck_siteId_idx" ON "SSLCheck"("siteId");
CREATE INDEX "SSLCheck_checkedAt_idx" ON "SSLCheck"("checkedAt");
CREATE INDEX "SSLCheck_validTo_idx" ON "SSLCheck"("validTo");

-- AddForeignKey
ALTER TABLE "SSLCheck" ADD CONSTRAINT "SSLCheck_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Code Changes

### Updated Files

1. **[prisma/schema.prisma](../prisma/schema.prisma)**
   - Added `SSLCheck` model
   - Added `sslChecks` relationship to `Site`

2. **[app/api/cron/monitor/route.js](../app/api/cron/monitor/route.js)**
   - Now creates `SSLCheck` record on every check
   - Maintains current state in `Site` model

3. **[app/api/sites/[id]/ssl/check/route.js](../app/api/sites/[id]/ssl/check/route.js)**
   - Manual checks also create `SSLCheck` records

4. **[app/api/sites/[id]/ssl/history/route.js](../app/api/sites/[id]/ssl/history/route.js)** (NEW)
   - Retrieve SSL check history
   - Detect certificate renewals
   - Pagination support

---

## Storage Considerations

### Data Retention

**Estimated Storage:**
- Each `SSLCheck` record: ~500 bytes
- Daily checks for 1 site: ~365 records/year
- Storage per site per year: ~182 KB

**For 1000 sites:**
- ~182 MB per year
- ~910 MB over 5 years

### Cleanup Strategy (Optional)

If storage becomes a concern, implement data retention:

```javascript
// Delete SSL checks older than 1 year
await prisma.sSLCheck.deleteMany({
  where: {
    checkedAt: {
      lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    }
  }
});
```

**Recommended:** Keep at least 90 days for compliance.

---

## Comparison: Old vs New

| Feature | Old Design | New Design |
|---------|-----------|------------|
| Current SSL state | ✅ Fast access | ✅ Fast access |
| Historical tracking | ❌ Not available | ✅ Full history |
| Certificate renewals | ❌ Can't detect | ✅ Automatic detection |
| Trend analysis | ❌ No data | ✅ Rich analytics |
| Audit trail | ❌ None | ✅ Complete trail |
| Storage efficiency | ✅ Minimal | ⚠️ ~182MB/year/1000 sites |
| Query performance | ✅ Excellent | ✅ Good (with indexes) |
| Compliance reports | ❌ Not possible | ✅ Easy to generate |

---

## Future Enhancements

With historical data, we can now build:

1. **SSL Uptime Dashboard**
   - Show SSL certificate uptime %
   - Compare across sites
   - Identify problematic certificates

2. **Renewal Reminders**
   - Detect typical renewal patterns
   - Predict when renewal will happen
   - Alert if renewal is delayed

3. **Certificate Lifecycle View**
   - Timeline of all certificates for a site
   - See issuer changes
   - Track from purchase to renewal

4. **Analytics Charts**
   - Days remaining over time
   - Certificate duration trends
   - Renewal frequency

5. **Automated Reporting**
   - Monthly SSL health reports
   - Certificate expiry forecasts
   - Renewal success rates

---

## Best Practices

### 1. Data Retention
```javascript
// Keep 1 year of data, summarize older data
// Run monthly cleanup job
```

### 2. Querying Historical Data
```javascript
// Always use indexes
await prisma.sSLCheck.findMany({
  where: {
    siteId: id,          // Indexed
    checkedAt: { gte }   // Indexed
  },
  orderBy: {
    checkedAt: 'desc'    // Uses index
  }
});
```

### 3. Detecting Changes
```javascript
// Compare sequential records to detect changes
// Look for serialNumber differences
```

---

## Testing

### Verify Historical Recording

```bash
# 1. Trigger manual check
curl -X POST /api/sites/{id}/ssl/check

# 2. Check history
curl -X GET /api/sites/{id}/ssl/history

# 3. Verify SSLCheck record was created
```

### Test Certificate Renewal Detection

```javascript
// Simulate certificate renewal
// 1. Check site with cert A (serial: ABC123)
// 2. Site renews certificate to B (serial: XYZ789)
// 3. Check site again
// 4. Query history - should show renewal detected
```

---

## Summary

### What Changed ✅
- ✅ Added `SSLCheck` model for historical tracking
- ✅ Updated cron job to save historical records
- ✅ Updated manual check endpoint to save records
- ✅ Added `/ssl/history` API endpoint
- ✅ Site model retains current state (cached)
- ✅ Automatic certificate renewal detection

### Benefits ✅
- ✅ Complete audit trail
- ✅ Certificate renewal tracking
- ✅ Trend analysis capabilities
- ✅ Compliance reporting
- ✅ Performance maintained (hybrid approach)
- ✅ Consistent with existing patterns

### Migration Status ✅
- ✅ Schema updated
- ✅ Migration applied: `20251114052336_add_ssl_check_history`
- ✅ Database in sync
- ✅ Prisma client regenerated
- ✅ All endpoints updated

---

## Recommendation

**This improved design is production-ready and should be the standard approach.**

The hybrid model (current state + historical records) provides:
- Fast access for dashboards
- Rich historical data for analytics
- Scalable storage requirements
- Familiar pattern for developers

---

**Version:** 1.1.0
**Last Updated:** 2025-01-14
**Status:** ✅ Implemented and Tested
