# SSL Monitoring - UI Access Guide

## How to Access SSL Monitoring in the UI

### 🎯 **Main Access Point: Site Details Page**

The SSL Certificate Card is automatically displayed on the **Site Details page** for any HTTPS site.

---

## Step-by-Step Access

### 1. Navigate to Sites
- Go to the sidebar
- Click **"Sites"**

### 2. Select a Site
- Click on any site from the list
- You'll be taken to the Site Details page: `/sites/[siteId]`

### 3. View SSL Certificate Card
- **Automatically shown** for HTTPS sites (URLs starting with `https://`)
- Located below the Stats Grid, above Uptime Statistics
- Hidden for HTTP sites (no SSL certificate to check)

---

## What You'll See

### SSL Certificate Card Features

#### **Status Display**
- **🟢 Valid** - Certificate is valid, > 30 days remaining
- **🟡 Attention Needed** - 14-30 days remaining
- **🟠 Expiring** - 7-14 days remaining
- **🔴 Expires Soon** - < 7 days remaining
- **🔴 Expired** - Certificate has expired

#### **Information Shown**
- **Status badge** - Color-coded urgency level
- **Days Remaining** - Countdown to expiration
- **Expiry Date** - When certificate expires
- **Issuer** - Certificate authority (Let's Encrypt, DigiCert, etc.)
- **Last Checked** - When SSL was last verified

#### **Actions Available**
- **🔄 Refresh Button** - Trigger manual SSL check
- **⚙️ Settings Button** - View SSL monitoring settings
  - SSL monitoring enabled/disabled
  - Alert threshold (days before expiry)

---

## File Structure

### Page Location
```
app/
  sites/
    [id]/
      page.js  ← Site Details Page (SSL card added here)
```

### Component Location
```
components/
  SSLCertificateCard.js  ← SSL certificate display component
```

### Code Integration

**In `/app/sites/[id]/page.js`:**

```jsx
import SSLCertificateCard from '@/components/SSLCertificateCard';

// Inside the page component:
{/* SSL Certificate Card */}
{site && site.url && site.url.startsWith('https://') && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.4 }}
    className="mb-8"
  >
    <SSLCertificateCard
      site={{
        ...site,
        ...summary
      }}
      onRefresh={fetchAllData}
    />
  </motion.div>
)}
```

---

## Screenshots (Expected UI)

### Example: Valid Certificate (> 30 days)
```
┌─────────────────────────────────────────────────┐
│ 🛡️ SSL Certificate              🔄  ⚙️          │
├─────────────────────────────────────────────────┤
│ Status            [✅ Valid]                     │
│ Days Remaining    45 days                       │
│ Expiry Date       Mar 1, 2025                   │
│ Issuer            Let's Encrypt                 │
│ Last Checked      Jan 14, 2025, 10:30 AM        │
└─────────────────────────────────────────────────┘
```

### Example: Expiring Soon (< 7 days)
```
┌─────────────────────────────────────────────────┐
│ ⚠️ SSL Certificate              🔄  ⚙️          │
├─────────────────────────────────────────────────┤
│ Status            [🔴 Expires Soon]             │
│ Days Remaining    5 days                        │
│ Expiry Date       Jan 19, 2025                  │
│ Issuer            DigiCert                      │
│ Last Checked      Jan 14, 2025, 10:30 AM        │
└─────────────────────────────────────────────────┘
```

### Example: Expired Certificate
```
┌─────────────────────────────────────────────────┐
│ 🔴 SSL Certificate              🔄  ⚙️          │
├─────────────────────────────────────────────────┤
│ Status            [🔴 Expired]                  │
│ Days Remaining    Expired 2 days ago            │
│ Expiry Date       Jan 12, 2025                  │
│ Issuer            Sectigo                       │
│ Last Checked      Jan 14, 2025, 10:30 AM        │
└─────────────────────────────────────────────────┘
```

---

## User Actions

### 1. Manual SSL Check
**How:**
1. Click the **🔄 Refresh** button on the SSL card
2. Wait for check to complete (~1-2 seconds)
3. Card updates with latest certificate info
4. Toast notification shows result

**When to use:**
- After renewing a certificate
- To verify certificate installation
- Before making changes

### 2. View Settings
**How:**
1. Click the **⚙️ Settings** button
2. Panel expands showing:
   - SSL Monitoring: Enabled/Disabled
   - Alert Threshold: X days
   - Description of how it works

**What you'll see:**
- Current monitoring status
- When alerts will be sent
- Explanation of daily checks

---

## API Endpoints Used

The SSL Card makes calls to:

1. **GET `/api/sites/[id]/ssl`**
   - Fetches current SSL certificate info
   - Cached for 1 hour
   - Called on page load

2. **POST `/api/sites/[id]/ssl/check`**
   - Triggers manual SSL check
   - Updates database
   - Called when clicking Refresh button

---

## Conditional Display Logic

### When SSL Card Shows
✅ Site URL starts with `https://`
✅ Site exists and is loaded
✅ User has access to the site

### When SSL Card Hidden
❌ Site URL starts with `http://` (non-SSL)
❌ Site not yet loaded
❌ SSL monitoring disabled for site

---

## Color Coding System

| Days Remaining | Badge Color | Text Color | Status |
|---------------|-------------|------------|---------|
| > 30 days | 🟢 Green | Green | Valid |
| 14-30 days | 🟡 Yellow | Yellow | Attention Needed |
| 7-14 days | 🟠 Orange | Orange | Expiring |
| 0-7 days | 🔴 Red | Red | Expires Soon |
| < 0 (expired) | 🔴 Red | Red | Expired |

---

## Testing Locally

### 1. Add HTTPS Site
```bash
# Via UI:
1. Go to /sites
2. Click "Add Site"
3. Enter HTTPS URL (e.g., https://google.com)
4. Click "Create"
```

### 2. View SSL Info
```bash
# Navigate to:
/sites/[siteId]

# SSL card should appear automatically
```

### 3. Trigger Manual Check
```bash
# Click refresh button on SSL card
# Should see toast: "SSL certificate checked successfully"
```

---

## Future Enhancements

### Planned UI Improvements

1. **SSL History View**
   - Show certificate renewal timeline
   - Chart of days remaining over time
   - Access via new tab on site details page

2. **Organization SSL Dashboard**
   - Overview of all site certificates
   - Urgent sites highlighted
   - Bulk actions (check all, export report)
   - Access: `/dashboard` or `/ssl-overview`

3. **SSL Analytics Charts**
   - Certificate issuer breakdown
   - Renewal frequency
   - SSL uptime percentage
   - Access: New "SSL" tab

4. **SSL Settings Page**
   - Configure alert thresholds per site
   - Enable/disable SSL monitoring
   - Export SSL reports
   - Access: `/sites/[id]/settings` → SSL tab

---

## Common User Workflows

### Workflow 1: Check SSL Status
```
1. Navigate to Sites page (/sites)
2. Click on site name
3. Scroll to SSL Certificate Card
4. View current status and expiry date
```

### Workflow 2: Verify New Certificate
```
1. Renew certificate on hosting provider
2. Go to MonitHQ site details page
3. Click 🔄 Refresh on SSL card
4. Verify new expiry date appears
```

### Workflow 3: Investigate Expiring Certificate
```
1. Receive email alert: "SSL expiring in 7 days"
2. Click link in email to site details
3. View SSL card showing expiry date
4. Renew certificate
5. Click 🔄 Refresh to verify
```

---

## Troubleshooting

### SSL Card Not Showing
**Check:**
- ✅ Site URL uses `https://` (not `http://`)
- ✅ Page has fully loaded (no loading spinner)
- ✅ You're on the site details page (`/sites/[id]`)

### "Invalid or no SSL certificate found"
**Reasons:**
- Site certificate is self-signed
- Certificate has hostname mismatch
- Site is not actually using HTTPS
- Certificate chain is incomplete

**Solution:**
- Check site in browser
- Verify SSL installation on server
- Contact hosting provider

### Refresh Button Does Nothing
**Check:**
- Network tab for errors
- Console for JavaScript errors
- API endpoint: `/api/sites/[id]/ssl/check`

---

## Related Documentation

- [SSL_MONITORING.md](SSL_MONITORING.md) - Full SSL feature documentation
- [SSL_DESIGN_IMPROVEMENTS.md](SSL_DESIGN_IMPROVEMENTS.md) - Database design
- [SSL_ORGANIZATION_ANALYTICS.md](SSL_ORGANIZATION_ANALYTICS.md) - Analytics API

---

## Summary

✅ **Access**: Site Details page (`/sites/[siteId]`)
✅ **Automatic**: Shows for all HTTPS sites
✅ **Real-time**: Manual refresh button
✅ **Visual**: Color-coded status indicators
✅ **Informative**: Days remaining, expiry date, issuer

The SSL Certificate Card provides at-a-glance SSL monitoring directly in the site details page, making it easy to track certificate health alongside uptime metrics.

---

**Last Updated:** 2025-01-14
**Version:** 1.0.0
