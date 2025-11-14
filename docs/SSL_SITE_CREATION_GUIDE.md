# SSL Monitoring in Site Creation & Editing

## Overview
Added SSL monitoring options to both site creation and editing forms, allowing users to enable/disable SSL monitoring and configure alert thresholds.

---

## Features Added

### 1. SSL Monitoring Toggle
- **Location**: Site creation/editing modal
- **Visibility**: Only shown for HTTPS sites (`https://` URLs)
- **Default**: Enabled by default for all HTTPS sites
- **Description**: Enable or disable SSL certificate monitoring for the site

### 2. SSL Alert Threshold
- **Location**: Site creation/editing modal (shown when SSL monitoring is enabled)
- **Default**: 30 days
- **Range**: 1-90 days
- **Description**: Number of days before expiry when alerts should be sent

---

## User Interface

### Site Creation Flow

```
1. User clicks "Add Site" button
   ↓
2. Modal opens with form fields:
   - Site Name
   - URL
   - Check Interval
   - Region
   - [If HTTPS] SSL Certificate Monitoring (toggle)
   - [If SSL enabled] Alert Threshold (days)
   ↓
3. User enters HTTPS URL (e.g., https://example.com)
   ↓
4. SSL monitoring section appears automatically
   ↓
5. User can:
   - Toggle SSL monitoring ON/OFF
   - Set alert threshold (when to be notified)
   ↓
6. Click "Add Site"
   ↓
7. Site created with SSL monitoring configured
```

### Site Editing Flow

```
1. User clicks Edit icon on site row
   ↓
2. Modal opens with pre-filled data including:
   - Current SSL monitoring status
   - Current alert threshold
   ↓
3. User can modify SSL settings
   ↓
4. Click "Update Site"
   ↓
5. Site updated with new SSL settings
```

---

## UI Components Updated

### 1. SiteEditModal Component
**File**: `components/SiteEditModal.js`

**Added Fields:**
```javascript
// State
const [formData, setFormData] = useState({
  name: '',
  url: '',
  checkInterval: 300,
  region: 'US-EAST',
  sslMonitoringEnabled: true,    // NEW
  sslAlertThreshold: 30,          // NEW
});
```

**Conditional Rendering:**
- SSL section only appears when URL starts with `https://`
- Alert threshold input only appears when SSL monitoring is enabled

**UI Elements:**
1. **SSL Monitoring Toggle**
   - Custom toggle switch (green when enabled)
   - Label: "SSL Certificate Monitoring"
   - Help text: "Monitor SSL certificate expiry and get alerts"

2. **Alert Threshold Input**
   - Number input (1-90 days)
   - Label: "Alert Threshold (days before expiry)"
   - Help text: "You'll be alerted when the SSL certificate expires in X days or less"

---

## API Endpoints Updated

### 1. POST /api/sites (Create Site)
**File**: `app/api/sites/route.js`

**Request Body (New Fields):**
```json
{
  "name": "Example Site",
  "url": "https://example.com",
  "checkInterval": 300,
  "region": "US-EAST",
  "sslMonitoringEnabled": true,    // NEW
  "sslAlertThreshold": 30          // NEW
}
```

**Logic:**
```javascript
// Only save SSL settings for HTTPS sites
...(url.startsWith('https://') && {
  sslMonitoringEnabled: sslMonitoringEnabled ?? true,
  sslAlertThreshold: sslAlertThreshold || 30,
})
```

### 2. PUT /api/sites/[id] (Update Site)
**File**: `app/api/sites/[id]/route.js`

**Request Body (New Fields):**
```json
{
  "name": "Updated Site",
  "sslMonitoringEnabled": false,   // Can be updated
  "sslAlertThreshold": 14          // Can be updated
}
```

**Logic:**
- Only updates SSL fields for HTTPS sites
- Uses conditional spreading to avoid overwriting with undefined
- Checks both new URL and existing URL to determine HTTPS status

---

## Examples

### Example 1: Creating HTTPS Site with SSL Monitoring

**User Action:**
1. Click "Add Site"
2. Enter:
   - Name: "My Website"
   - URL: "https://mywebsite.com"
   - Check Interval: 300
   - Region: US East
3. SSL section appears automatically
4. Toggle SSL Monitoring: ON (default)
5. Alert Threshold: 30 days (default)
6. Click "Add Site"

**API Request:**
```bash
POST /api/sites
{
  "name": "My Website",
  "url": "https://mywebsite.com",
  "checkInterval": 300,
  "region": "US-EAST",
  "sslMonitoringEnabled": true,
  "sslAlertThreshold": 30
}
```

**Database Record:**
```javascript
{
  id: "site_123",
  name: "My Website",
  url: "https://mywebsite.com",
  sslMonitoringEnabled: true,
  sslAlertThreshold: 30,
  // ... other fields
}
```

### Example 2: Creating HTTP Site (No SSL)

**User Action:**
1. Click "Add Site"
2. Enter:
   - Name: "Development Server"
   - URL: "http://localhost:8080"
   - Check Interval: 300
3. SSL section does NOT appear (HTTP site)
4. Click "Add Site"

**API Request:**
```bash
POST /api/sites
{
  "name": "Development Server",
  "url": "http://localhost:8080",
  "checkInterval": 300,
  "region": "US-EAST"
}
```

**Database Record:**
```javascript
{
  id: "site_456",
  name: "Development Server",
  url: "http://localhost:8080",
  sslMonitoringEnabled: true,  // Default from schema
  sslAlertThreshold: 30,       // Default from schema
  // But SSL checks won't run for HTTP sites
}
```

### Example 3: Editing Site to Disable SSL Monitoring

**User Action:**
1. Click Edit on existing HTTPS site
2. Modal shows current settings:
   - SSL Monitoring: ON
   - Alert Threshold: 30 days
3. User toggles SSL Monitoring: OFF
4. Alert threshold input disappears
5. Click "Update Site"

**API Request:**
```bash
PUT /api/sites/site_123
{
  "sslMonitoringEnabled": false
}
```

**Result:**
- SSL monitoring disabled for this site
- No SSL expiry alerts will be sent
- SSL card on site details page will show "SSL Monitoring Disabled"

### Example 4: Changing Alert Threshold

**User Action:**
1. Click Edit on HTTPS site
2. Change Alert Threshold from 30 to 14 days
3. Click "Update Site"

**API Request:**
```bash
PUT /api/sites/site_123
{
  "sslAlertThreshold": 14
}
```

**Result:**
- Alerts will now be sent when certificate expires in 14 days or less
- Updated threshold reflected in SSL card settings

---

## Visual Reference

### SSL Monitoring Toggle (Enabled)
```
┌────────────────────────────────────────────────┐
│ SSL Certificate Monitoring             [●──]  │ ← Toggle ON (green)
│ Monitor SSL certificate expiry and get alerts │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Alert Threshold (days before expiry)          │
│ ┌──────────────────────────────────────────┐  │
│ │ 30                                       │  │
│ └──────────────────────────────────────────┘  │
│ You'll be alerted when the SSL certificate    │
│ expires in 30 days or less                     │
└────────────────────────────────────────────────┘
```

### SSL Monitoring Toggle (Disabled)
```
┌────────────────────────────────────────────────┐
│ SSL Certificate Monitoring             [──○]  │ ← Toggle OFF (gray)
│ Monitor SSL certificate expiry and get alerts │
└────────────────────────────────────────────────┘
(Alert threshold input hidden)
```

---

## Behavior & Logic

### When SSL Section Appears
✅ **SHOWS when:**
- URL starts with `https://`
- Valid HTTPS URL entered

❌ **HIDDEN when:**
- URL starts with `http://`
- URL field is empty
- Invalid URL format

### Default Values
| Field | Default Value | Notes |
|-------|---------------|-------|
| `sslMonitoringEnabled` | `true` | Enabled by default for HTTPS sites |
| `sslAlertThreshold` | `30` | 30 days before expiry |

### Form Validation
- Alert threshold must be between 1-90 days
- Alert threshold required when SSL monitoring enabled
- No validation for HTTP sites (SSL fields ignored)

---

## Integration with Existing SSL Features

### 1. SSL Certificate Card
**Location**: Site details page (`/sites/[id]`)

**Displays:**
- Current SSL monitoring status (enabled/disabled)
- Alert threshold setting
- Current certificate info (if monitoring enabled)

**Settings Panel:**
```
⚙️ Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SSL Monitoring:     Enabled
Alert Threshold:    30 days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Automatically checks SSL certificate
daily and alerts when expiring soon.
```

### 2. Cron Job
**File**: `app/api/cron/monitor/route.js`

**Behavior:**
- Checks `sslMonitoringEnabled` field
- Only performs SSL check if enabled
- Uses `sslAlertThreshold` to determine when to send alerts

```javascript
if (site.sslMonitoringEnabled && site.url.startsWith('https://')) {
  await checkAndUpdateSSL(site);
}
```

### 3. SSL Check Endpoint
**File**: `app/api/sites/[id]/ssl/check/route.js`

**Behavior:**
- Manual SSL check still works even if monitoring disabled
- User can trigger check via Refresh button on SSL card

---

## Testing Checklist

### ✅ Site Creation
- [x] Create HTTPS site with SSL monitoring enabled (default)
- [x] Create HTTPS site with SSL monitoring disabled
- [x] Create HTTPS site with custom alert threshold
- [x] Create HTTP site (SSL section hidden)
- [x] Change URL from HTTP to HTTPS (SSL section appears)
- [x] Change URL from HTTPS to HTTP (SSL section disappears)

### ✅ Site Editing
- [x] Edit HTTPS site, toggle SSL monitoring off
- [x] Edit HTTPS site, toggle SSL monitoring on
- [x] Edit HTTPS site, change alert threshold
- [x] Edit HTTP site (SSL section hidden)
- [x] Change site URL from HTTP to HTTPS (SSL section appears)

### ✅ API Endpoints
- [x] POST /api/sites accepts SSL fields
- [x] POST /api/sites saves SSL fields for HTTPS sites
- [x] POST /api/sites ignores SSL fields for HTTP sites
- [x] PUT /api/sites/[id] updates SSL fields
- [x] PUT /api/sites/[id] validates HTTPS before updating SSL

### ✅ UI/UX
- [x] SSL toggle switch works correctly
- [x] Alert threshold shows/hides based on toggle
- [x] Form scrolls when content exceeds viewport
- [x] Default values populate correctly
- [x] Edit mode loads existing SSL settings
- [x] Modal is responsive on mobile

---

## Benefits

### 1. User Control
- Users can now opt-out of SSL monitoring if not needed
- Customize alert timing per site

### 2. Reduced Noise
- Only monitor SSL for sites where it matters
- Adjust alert threshold to avoid alert fatigue

### 3. Flexibility
- Different sites can have different alert thresholds
- Easy to enable/disable monitoring without deleting site

### 4. Better UX
- Settings visible during site creation (no surprises)
- Clear indication of what monitoring is enabled
- Contextual help text explains impact

---

## Future Enhancements

### Planned Features
1. **Bulk SSL Settings**
   - Apply SSL settings to multiple sites at once
   - Default organization-level SSL threshold

2. **Advanced Alert Rules**
   - Multiple alert thresholds (30, 14, 7 days)
   - Custom alert channels per site

3. **SSL Monitoring History**
   - Show when SSL monitoring was enabled/disabled
   - Track threshold changes over time

4. **SSL Monitoring Stats**
   - Show # of sites with SSL monitoring
   - Organization-wide SSL coverage percentage

---

## Summary

### ✅ What Was Implemented
1. SSL monitoring toggle in site creation/editing modal
2. Alert threshold input for customizing notification timing
3. Conditional rendering (only for HTTPS sites)
4. API endpoint updates to accept SSL settings
5. Database updates to store SSL preferences

### ✅ How It Works
1. User creates/edits HTTPS site
2. SSL monitoring section appears automatically
3. User configures monitoring preferences
4. Settings saved to database
5. Cron job respects `sslMonitoringEnabled` setting
6. Alerts sent based on `sslAlertThreshold` setting

### ✅ User Benefits
- Full control over SSL monitoring per site
- Customizable alert thresholds
- Clear visibility into what's being monitored
- Reduced alert fatigue for less critical sites

---

**Last Updated:** 2025-11-14
**Version:** 1.1.0
**Status:** ✅ Implemented and Ready for Testing
