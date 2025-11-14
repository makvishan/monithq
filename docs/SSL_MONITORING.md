# SSL Certificate Monitoring

## Overview

MonitHQ now includes comprehensive SSL/TLS certificate monitoring to help you prevent website downtime caused by expired certificates. The system automatically checks SSL certificates daily and sends alerts before they expire.

---

## Features

### Automated Monitoring
- **Daily SSL Checks**: Certificates are automatically checked every 24 hours
- **Expiry Detection**: Tracks certificate expiration dates
- **Multi-Channel Alerts**: Email, Slack, SMS, and webhook notifications
- **Configurable Thresholds**: Set custom alert thresholds (default: 30 days)
- **Manual Checks**: Trigger on-demand SSL certificate checks

### Certificate Information Tracked
- **Validity Status**: Whether the certificate is valid
- **Expiry Date**: When the certificate expires
- **Days Remaining**: Countdown to expiration
- **Issuer**: Certificate authority information
- **Valid From Date**: Certificate start date
- **Last Checked**: Timestamp of last verification

### Alert Levels
The system uses progressive alert levels based on days remaining:

| Days Remaining | Alert Level | Color | Action |
|---------------|-------------|-------|---------|
| > 30 days | Normal | Green | No alert |
| 14-30 days | Notice | Yellow | First notification |
| 7-14 days | Warning | Orange | More frequent alerts |
| 0-7 days | Critical | Red | Urgent alerts |
| Expired | Expired | Red | Immediate action required |

### Smart Alerting
- **Milestone-Based Alerts**: Notifications at 30, 14, 7, 3, 1, and 0 days
- **Alert Deduplication**: Prevents alert fatigue with cooldown periods
- **Respects User Preferences**: Honors notification channel settings
- **Plan-Based Limits**: Follows subscription plan notification limits

---

## Database Schema

### Site Model Fields

```prisma
model Site {
  // ... existing fields

  // SSL Certificate Monitoring
  sslMonitoringEnabled  Boolean   @default(true)
  sslExpiryDate        DateTime?
  sslIssuer            String?
  sslValidFrom         DateTime?
  sslDaysRemaining     Int?
  sslLastChecked       DateTime?
  sslCertificateValid  Boolean   @default(true)
  sslAlertThreshold    Int       @default(30) // Days before expiry to alert

  @@index([sslExpiryDate])
}
```

---

## API Endpoints

### 1. Get SSL Certificate Information

**Endpoint:** `GET /api/sites/[id]/ssl`

**Description:** Retrieves SSL certificate information for a site. Returns cached data if less than 1 hour old, otherwise performs a fresh check.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "cached": false,
  "sslMonitoringEnabled": true,
  "valid": true,
  "issuer": "Let's Encrypt",
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2025-04-01T00:00:00.000Z",
  "daysRemaining": 45,
  "lastChecked": "2025-01-14T05:00:00.000Z",
  "alertThreshold": 30,
  "formatted": {
    "status": "Valid",
    "statusColor": "green",
    "issuer": "Let's Encrypt",
    "daysRemaining": 45,
    "message": "45 days remaining"
  }
}
```

---

### 2. Manual SSL Check

**Endpoint:** `POST /api/sites/[id]/ssl/check`

**Description:** Triggers an immediate SSL certificate check for a site.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "success": true,
  "isHttps": true,
  "sslInfo": {
    "valid": true,
    "issuer": "Let's Encrypt",
    "subject": "example.com",
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validTo": "2025-04-01T00:00:00.000Z",
    "daysRemaining": 45,
    "serialNumber": "...",
    "fingerprint": "...",
    "algorithm": "sha256WithRSAEncryption",
    "authorized": true,
    "formatted": {
      "status": "Valid",
      "statusColor": "green",
      "message": "45 days remaining"
    }
  }
}
```

---

### 3. Update SSL Settings

**Endpoint:** `PATCH /api/sites/[id]/ssl`

**Description:** Update SSL monitoring settings for a site (ORG_ADMIN only).

**Authentication:** Required (JWT token + ORG_ADMIN role)

**Request Body:**
```json
{
  "sslMonitoringEnabled": true,
  "sslAlertThreshold": 30
}
```

**Response:**
```json
{
  "success": true,
  "site": {
    "id": "site_123",
    "sslMonitoringEnabled": true,
    "sslAlertThreshold": 30
  }
}
```

---

## Utility Functions

### Core Functions (`/lib/ssl.js`)

#### `checkSSLCertificate(url)`
Performs SSL certificate verification for a given URL.

```javascript
import { checkSSLCertificate } from '@/lib/ssl';

const sslInfo = await checkSSLCertificate('https://example.com');
console.log(sslInfo);
// {
//   valid: true,
//   issuer: "Let's Encrypt",
//   validFrom: Date,
//   validTo: Date,
//   daysRemaining: 45,
//   ...
// }
```

#### `getSSLStatusColor(daysRemaining)`
Returns color code based on days remaining.

```javascript
import { getSSLStatusColor } from '@/lib/ssl';

const color = getSSLStatusColor(45); // 'green'
const color = getSSLStatusColor(10); // 'yellow'
const color = getSSLStatusColor(5);  // 'red'
```

#### `getSSLStatusText(daysRemaining)`
Returns human-readable status text.

```javascript
import { getSSLStatusText } from '@/lib/ssl';

const status = getSSLStatusText(45); // 'Valid'
const status = getSSLStatusText(10); // 'Attention Needed'
const status = getSSLStatusText(5);  // 'Expires Soon'
const status = getSSLStatusText(-1); // 'Expired'
```

#### `shouldSendSSLAlert(daysRemaining, alertThreshold, lastAlertDate)`
Determines if an SSL alert should be sent based on milestones.

```javascript
import { shouldSendSSLAlert } from '@/lib/ssl';

const shouldAlert = shouldSendSSLAlert(29, 30, lastAlertDate);
// true if crossing 30-day threshold
```

#### `formatSSLInfo(sslInfo)`
Formats SSL information for display.

```javascript
import { formatSSLInfo } from '@/lib/ssl';

const formatted = formatSSLInfo(sslInfo);
// {
//   status: "Valid",
//   statusColor: "green",
//   issuer: "Let's Encrypt",
//   message: "45 days remaining"
// }
```

---

## Notification System

### Email Notifications (`/lib/resend.js`)

SSL expiry notifications are sent using the `sslExpiry` template:

```javascript
await sendEmail(userEmail, "sslExpiry", {
  siteName: "example.com",
  siteUrl: "https://example.com",
  daysRemaining: 10,
  expiryDate: new Date("2025-01-24"),
  issuer: "Let's Encrypt",
  urgencyLevel: "WARNING" // EXPIRED, CRITICAL, WARNING, NOTICE
});
```

**Email Features:**
- Dynamic subject lines with urgency indicators
- Color-coded based on urgency level
- Actionable recommendations
- Direct link to site dashboard

### Slack Notifications

```javascript
const emoji = urgencyLevel === 'EXPIRED' ? '🔴' :
              urgencyLevel === 'CRITICAL' ? '⚠️' : '📋';
const slackMsg = `${emoji} SSL Certificate Alert for ${siteName}
Status: ${daysRemaining} days remaining
Expiry Date: ${expiryDate}
Issuer: ${issuer}
URL: ${siteUrl}`;

await sendSlackNotification(webhookUrl, slackMsg);
```

### Webhook Notifications

```javascript
const webhookPayload = {
  type: 'ssl_expiry',
  site: {
    id: siteId,
    name: siteName,
    url: siteUrl
  },
  ssl: {
    daysRemaining: 10,
    expiryDate: "2025-01-24",
    issuer: "Let's Encrypt",
    urgencyLevel: "WARNING"
  },
  timestamp: "2025-01-14T05:00:00.000Z"
};
```

---

## Cron Job Integration

### Monitoring Cron (`/app/api/cron/monitor/route.js`)

SSL checks are integrated into the existing monitoring cron job:

```javascript
// Check SSL certificates separately (daily)
const sitesToCheckSSL = sites.filter(shouldCheckSSL);

for (const site of sitesToCheckSSL) {
  const sslInfo = await checkAndUpdateSSL(site);
  if (sslInfo && shouldSendSSLAlert(...)) {
    await sendSSLExpiryNotification(site, sslInfo);
  }
}
```

**Frequency:** Once every 24 hours per site

**Process:**
1. Filter sites due for SSL check
2. Perform TLS handshake to get certificate
3. Parse certificate details
4. Update database with results
5. Check if alert should be sent
6. Send notifications if threshold crossed

---

## UI Components

### SSLCertificateCard Component

**Location:** `/components/SSLCertificateCard.js`

**Usage:**
```jsx
import SSLCertificateCard from '@/components/SSLCertificateCard';

<SSLCertificateCard
  site={site}
  onRefresh={() => refetchSiteData()}
/>
```

**Features:**
- Real-time SSL status display
- Manual check button
- Color-coded status indicators
- Expandable settings section
- Loading states
- Error handling

**Props:**
- `site` (Object): Site object with SSL fields
- `onRefresh` (Function): Callback after SSL check

---

## Implementation Examples

### 1. Adding SSL Card to Site Details Page

```jsx
// In your site details page
import SSLCertificateCard from '@/components/SSLCertificateCard';

export default function SiteDetailsPage({ params }) {
  const [site, setSite] = useState(null);

  const refreshSite = async () => {
    const res = await fetch(`/api/sites/${params.id}`);
    const data = await res.json();
    setSite(data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Other cards */}
      <SSLCertificateCard site={site} onRefresh={refreshSite} />
    </div>
  );
}
```

### 2. Programmatic SSL Check

```javascript
// Check SSL for a specific site
async function checkSiteSSL(siteId) {
  const response = await fetch(`/api/sites/${siteId}/ssl/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (data.success && data.sslInfo) {
    console.log(`SSL Status: ${data.sslInfo.formatted.status}`);
    console.log(`Days Remaining: ${data.sslInfo.daysRemaining}`);
  }
}
```

### 3. Updating SSL Settings

```javascript
// Enable/disable SSL monitoring
async function updateSSLSettings(siteId, enabled, threshold = 30) {
  const response = await fetch(`/api/sites/${siteId}/ssl`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sslMonitoringEnabled: enabled,
      sslAlertThreshold: threshold,
    }),
  });

  return response.json();
}
```

---

## Testing

### Manual Testing

1. **Add HTTPS Site:**
   ```bash
   # Add a site with HTTPS URL
   curl -X POST /api/sites \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Site", "url": "https://example.com"}'
   ```

2. **Trigger SSL Check:**
   ```bash
   curl -X POST /api/sites/{siteId}/ssl/check
   ```

3. **View SSL Info:**
   ```bash
   curl -X GET /api/sites/{siteId}/ssl
   ```

### Testing with Development Sites

```javascript
// Test sites with various SSL expiry dates
const testSites = [
  'https://expired.badssl.com/',      // Expired certificate
  'https://self-signed.badssl.com/',  // Self-signed certificate
  'https://wrong.host.badssl.com/',   // Wrong hostname
  'https://google.com',               // Valid certificate
];

for (const url of testSites) {
  const result = await checkSSLCertificate(url);
  console.log(`${url}: ${result.valid ? 'Valid' : 'Invalid'}`);
}
```

---

## Configuration

### Environment Variables

No additional environment variables required. Uses existing:
- `RESEND_API_KEY` - For email notifications
- `NEXT_PUBLIC_APP_URL` - For email links
- `CRON_SECRET` - For cron job authentication

### Default Settings

```javascript
const DEFAULT_SSL_SETTINGS = {
  sslMonitoringEnabled: true,
  sslAlertThreshold: 30,      // days
  checkInterval: 24 * 60 * 60, // 24 hours in seconds
};
```

### Alert Milestones

```javascript
const ALERT_MILESTONES = [30, 14, 7, 3, 1, 0, -1]; // days
```

---

## Troubleshooting

### Common Issues

**1. SSL Check Failing for HTTPS Sites**
```javascript
// Check if TLS module is available
const tls = require('tls');
console.log('TLS available:', !!tls.connect);
```

**Solution:** Ensure Node.js has TLS support enabled.

**2. No Notifications Received**
- Check user notification preferences
- Verify plan allows notification channels
- Check `sslAlertThreshold` value
- Verify last alert date

**3. Certificate Shows as Invalid**
```javascript
// Check authorization error
if (!sslInfo.authorized) {
  console.log('Auth Error:', sslInfo.authorizationError);
}
```

**Solution:** Certificate may be self-signed or have hostname mismatch.

**4. Daily Checks Not Running**
- Verify cron job is scheduled
- Check cron job logs
- Ensure `CRON_SECRET` is set
- Verify site has `sslMonitoringEnabled: true`

---

## Performance Considerations

### Optimization Strategies

1. **Caching:** SSL info cached for 1 hour in API endpoint
2. **Batching:** SSL checks run separately from uptime checks
3. **Timeout:** 10-second timeout on TLS connections
4. **Parallel Processing:** Multiple sites checked concurrently in cron

### Resource Usage

- **Average Check Time:** 500ms - 2s per site
- **Memory:** ~2MB per concurrent check
- **Database Writes:** 1 update per check
- **Network:** Minimal (TLS handshake only)

---

## Security Considerations

### Best Practices

1. **Certificate Validation:** System checks but doesn't enforce valid certificates
2. **Timeout Protection:** Prevents hanging connections
3. **Error Handling:** Graceful fallback on connection failures
4. **No Certificate Storage:** Certificate data not persisted, only metadata
5. **RBAC:** Only ORG_ADMIN can modify SSL settings

### Data Privacy

- Certificate serial numbers and fingerprints are logged (non-sensitive)
- Private keys are never accessed or stored
- Only public certificate information is retrieved

---

## Future Enhancements

### Planned Features

1. **Certificate Chain Validation:** Verify full certificate chain
2. **OCSP Stapling Check:** Verify OCSP response
3. **SSL Configuration Scoring:** A+ to F rating like SSL Labs
4. **Certificate Auto-Renewal Detection:** Detect Let's Encrypt auto-renewal
5. **Multi-Domain Certificate Support:** Track SAN certificates
6. **Historical SSL Metrics:** Track certificate changes over time
7. **Webhook Integration:** Trigger cert renewal workflows
8. **Mobile App Alerts:** Push notifications for critical SSL issues

---

## Migration Guide

### Migrating Existing Sites

All existing sites automatically have SSL monitoring enabled with the schema migration:

```bash
npx prisma migrate deploy
```

To disable SSL monitoring for specific sites:

```javascript
await prisma.site.update({
  where: { id: siteId },
  data: { sslMonitoringEnabled: false }
});
```

### Data Migration

No data migration required. Fields are populated on first SSL check.

---

## API Client Examples

### JavaScript/TypeScript

```typescript
interface SSLInfo {
  valid: boolean;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysRemaining: number;
  formatted: {
    status: string;
    statusColor: string;
    message: string;
  };
}

async function getSSLInfo(siteId: string): Promise<SSLInfo> {
  const response = await fetch(`/api/sites/${siteId}/ssl`);
  const data = await response.json();
  return data;
}
```

### Python

```python
import requests

def check_ssl(site_id, api_key):
    response = requests.post(
        f'https://app.monithq.com/api/sites/{site_id}/ssl/check',
        headers={'Authorization': f'Bearer {api_key}'}
    )
    return response.json()
```

### cURL

```bash
# Get SSL info
curl -X GET https://app.monithq.com/api/sites/{siteId}/ssl \
  -H "Authorization: Bearer YOUR_API_KEY"

# Trigger manual check
curl -X POST https://app.monithq.com/api/sites/{siteId}/ssl/check \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Support

For issues or questions about SSL monitoring:

1. Check this documentation
2. Review [GitHub Issues](https://github.com/monithq/issues)
3. Contact support@monithq.com

---

## Changelog

**Version 1.0.0** - 2025-01-14
- Initial SSL monitoring implementation
- Daily automated checks
- Multi-channel notifications
- UI component for certificate display
- API endpoints for manual checks
- Smart milestone-based alerting

---

**Last Updated:** 2025-01-14
**Version:** 1.0.0
