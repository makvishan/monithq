# 🚀 Fresh Start - Monitoring Setup Guide

## ✅ What Was Done

### 1. **Cleaned All Monitoring Data**
- ✅ Deleted **9 incidents**
- ✅ Deleted **133 site checks**
- ✅ Reset **4 sites** to ONLINE status (100% uptime)

### 2. **Sites Ready for Monitoring**

| Site | URL | Status | Uptime | Enabled |
|------|-----|--------|--------|---------|
| 🟢 Makvishan | https://makvishan.om | ONLINE | 100% | ✅ |
| 🟢 TechStart Landing Page | https://techstart.io | ONLINE | 100% | ✅ |
| 🟢 TechStart App | https://app.techstart.io | ONLINE | 100% | ✅ |
| 🟢 Acme Main Website | https://acme.com | ONLINE | 100% | ✅ |

---

## 🔧 How Monitoring Works Now

### **Automatic Monitoring (Cron Job)**
- **Frequency:** Every 1 minute
- **Configuration:** `vercel.json` → `/api/cron/monitor`
- **What it does:**
  1. Checks all enabled sites
  2. Records status (ONLINE/DEGRADED/OFFLINE)
  3. Measures response time
  4. **Calculates uptime:** (successful checks / total checks) × 100
  5. Creates incidents for failures
  6. Auto-resolves incidents when back online

### **Uptime Calculation (Fixed)**
```javascript
// ✅ NEW (Accurate): Check-based calculation
const totalChecks = count of last 30 days checks
const successfulChecks = count of ONLINE checks
const uptime = (successfulChecks / totalChecks) × 100

// Example:
// 90 successful checks out of 100 total = 90% uptime
```

### **Incident Creation Logic**
- Site goes from ONLINE → OFFLINE/DEGRADED
- Severity:
  - `OFFLINE` = HIGH severity
  - `DEGRADED` (slow) = MEDIUM severity
- Status: Starts as `INVESTIGATING`

### **Auto-Resolution**
- Site goes from OFFLINE/DEGRADED → ONLINE
- All open incidents for that site are auto-resolved

---

## 🎯 What to Expect Now

### **First 30 Days (Building History)**
- New checks create history
- Uptime % will be based on actual performance
- If site has no failures: 100% uptime ✅
- If site has 5 failures out of 100 checks: 95% uptime ✅

### **After 30 Days (Steady State)**
- Rolling 30-day window
- Older checks drop off
- Recent performance always reflected

### **Dashboard Updates**
1. **User Dashboard** (`/dashboard`):
   - Shows real uptime from site.uptime field
   - Charts display 7-day trends from SiteCheck table
   - Incidents list shows active incidents

2. **Admin Dashboard** (`/admin/dashboard`):
   - System-wide uptime average
   - All organization stats
   - Revenue metrics

---

## 📝 Testing Monitoring

### **Option 1: Wait for Cron (Automatic)**
```bash
# Cron runs every minute automatically
# Just wait 1 minute and check dashboard
```

### **Option 2: Manual Trigger (Immediate)**
```bash
# Run the trigger script
node scripts/trigger-monitoring.js

# Or use the API directly
curl http://localhost:3000/api/cron/monitor
```

### **Option 3: Check Individual Site**
```bash
# Replace {site-id} with actual site ID
curl -X POST http://localhost:3000/api/sites/{site-id}/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Test Scenarios

### **Scenario 1: Site Goes Down**
1. Site check fails (OFFLINE)
2. Incident created automatically
3. Notification sent (if configured)
4. Uptime percentage drops
5. Dashboard shows incident

### **Scenario 2: Site Recovers**
1. Site check succeeds (ONLINE)
2. Incident auto-resolved
3. Resolution notification sent
4. Uptime recalculated
5. Dashboard updates

### **Scenario 3: Site is Slow**
1. Response time > 5000ms
2. Status = DEGRADED (not OFFLINE)
3. Incident created (MEDIUM severity)
4. Uptime still counts as "up" but flagged

---

## 🔍 Monitoring the Monitoring

### **Check Cron is Running**
```bash
# View cron logs (if deployed on Vercel)
vercel logs --follow

# Or check local logs
# The cron output will show in terminal
```

### **Verify Site Checks are Being Created**
```bash
# Open Prisma Studio
npx prisma studio

# Go to SiteCheck table
# Should see new entries every minute
```

### **Check Dashboard Stats**
1. Open user dashboard: http://localhost:3000/dashboard
2. Should see:
   - Site count
   - Online status
   - Uptime %
   - Charts filling in

---

## 🐛 Troubleshooting

### **Issue: Cron Not Running Locally**
**Solution:** Cron jobs only work on Vercel, not locally. Use manual trigger:
```bash
node scripts/trigger-monitoring.js
```

### **Issue: All Sites Show 100% Uptime**
**Reason:** No check history yet (fresh start)
**Solution:** Wait for checks to accumulate. After 10-20 checks, uptime will be accurate.

### **Issue: Sites Not Being Checked**
**Check:**
1. Sites are `enabled: true` ✅
2. Cron secret is correct (if required)
3. Database connection working
4. No errors in logs

### **Issue: Incidents Not Creating**
**Check:**
1. Site actually failed (not just slow)
2. Status changed from ONLINE → OFFLINE
3. Check logs for errors in incident creation

---

## 📊 Expected Data Flow

```
Every 1 minute:
  ├─ Cron triggers /api/cron/monitor
  ├─ For each enabled site:
  │   ├─ Perform health check
  │   ├─ Create SiteCheck record
  │   ├─ Calculate new uptime (last 30 days)
  │   ├─ Update Site status & uptime
  │   └─ Create/Resolve incidents if status changed
  └─ Return results
```

---

## 🎯 Success Criteria

After 10 minutes, you should see:
- ✅ 10+ site checks per site in database
- ✅ Uptime calculations based on real data
- ✅ Charts showing actual trends
- ✅ Sites with failures showing < 100% uptime

---

## 🚨 Important Notes

1. **First Check After Cleanup:**
   - All sites start at 100% uptime
   - First failures will immediately affect percentage
   - Example: 1 failure out of 10 checks = 90% uptime

2. **Uptime Calculation:**
   - Based on last 30 days only
   - Rolling window (old checks drop off)
   - More checks = more accurate percentage

3. **Incident Lifecycle:**
   - Created: When site goes down
   - Investigating: Initial status
   - Resolved: When site comes back up
   - Auto-resolved by system

4. **Notifications:**
   - Configure channels in `/settings`
   - Email, Slack, SMS, Webhook available
   - Only sent if user preferences enabled

---

## 📁 Useful Scripts

### **Clean Data (Reset Everything)**
```bash
node scripts/clean-monitoring-data.js
```

### **Trigger Manual Check**
```bash
node scripts/trigger-monitoring.js
```

### **View Database**
```bash
npx prisma studio
```

---

## 🎉 You're All Set!

Monitoring is now running with:
- ✅ Clean slate (no old data)
- ✅ Accurate uptime calculation (check-based)
- ✅ Real-time charts (dynamic data)
- ✅ Automatic incident management
- ✅ Fresh start for all 4 sites

**Next Steps:**
1. Wait 5-10 minutes for checks to accumulate
2. View dashboard to see real-time data
3. Monitor sites for any failures
4. Verify uptime percentages are accurate

Happy monitoring! 🚀
