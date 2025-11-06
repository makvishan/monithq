# Notification Channel Restrictions - Test Plan

## Overview
Notification channels are now restricted based on subscription plan. Users can only enable channels that are included in their plan tier.

## Plan Limits

| Plan | Allowed Channels |
|------|-----------------|
| **FREE** | Email only |
| **STARTER** | Email + Slack |
| **PRO** | Email + Slack + SMS + Webhook |
| **ENTERPRISE** | Email + Slack + SMS + Webhook |

## Changes Made

### 1. `/lib/stripe.js` - Added `allowedChannels` to Plan Limits
```javascript
FREE: {
  limits: {
    sites: 1,
    minCheckInterval: 300,
    maxTeamMembers: 1,
    allowedChannels: ['email'],  // ✅ NEW
  }
}

STARTER: {
  limits: {
    allowedChannels: ['email', 'slack'],  // ✅ NEW
  }
}

PRO: {
  limits: {
    allowedChannels: ['email', 'slack', 'sms', 'webhook'],  // ✅ NEW
  }
}

ENTERPRISE: {
  limits: {
    allowedChannels: ['email', 'slack', 'sms', 'webhook'],  // ✅ NEW
  }
}
```

### 2. `/app/settings/page.js` - UI Restrictions
**Added:**
- Import `getPlanLimits` from stripe.js
- State for `subscription` data
- Fetch subscription in `loadUserSettings()`
- Check allowed channels in UI rendering
- Show "Upgrade Required" badge for restricted channels
- Disable toggle switches for unavailable channels
- Show "View plans" link to pricing page
- Validate on toggle with error message

**Features:**
- Channels grayed out if not allowed
- Toggle switches disabled for restricted channels
- Error toast when trying to enable restricted channel
- Link to pricing page for upgrades

### 3. `/app/api/users/settings/route.js` - API Validation
**Added:**
- Import `getPlanLimits` from stripe.js
- Fetch user's subscription before saving
- Validate notification channels against plan limits
- Return 403 error if trying to enable restricted channel

**Validation Logic:**
```javascript
// Maps notification settings keys to channel IDs
channelMap = {
  emailSlack: 'slack',
  emailSms: 'sms', 
  emailWebhook: 'webhook',
}

// Returns 403 if channel not in allowedChannels
{
  error: "Slack notifications are not available on your current plan",
  channel: "slack",
  plan: "FREE",
  requiredPlan: "STARTER"
}
```

## Test Cases

### Test 1: FREE User - Email Only
**Setup:** User on FREE plan

**Expected Behavior:**
1. Settings page shows 4 channels: email, slack, sms, webhook
2. Email toggle is **enabled** and functional
3. Slack, SMS, Webhook show "Upgrade Required" badge
4. Slack, SMS, Webhook toggles are **disabled** (grayed out)
5. "View plans" link shown under restricted channels
6. Clicking disabled toggle shows error toast

**API Test:**
```bash
# Should succeed
PUT /api/users/settings
{ "notifications": { "emailEmail": true } }
→ 200 OK

# Should fail
PUT /api/users/settings  
{ "notifications": { "emailSlack": true } }
→ 403 Forbidden
{
  "error": "Slack notifications are not available on your current plan",
  "channel": "slack",
  "plan": "FREE",
  "requiredPlan": "STARTER"
}
```

### Test 2: STARTER User - Email + Slack
**Setup:** User on STARTER plan

**Expected Behavior:**
1. Email toggle is **enabled**
2. Slack toggle is **enabled**
3. SMS and Webhook show "Upgrade Required" badge
4. SMS and Webhook toggles are **disabled**
5. Can successfully enable/disable Email and Slack

**API Test:**
```bash
# Should succeed
PUT /api/users/settings
{ "notifications": { "emailSlack": true } }
→ 200 OK

# Should fail
PUT /api/users/settings
{ "notifications": { "emailSms": true } }
→ 403 Forbidden
```

### Test 3: PRO User - All Channels
**Setup:** User on PRO plan

**Expected Behavior:**
1. All 4 channels are **enabled**
2. No "Upgrade Required" badges
3. All toggles functional
4. Can enable any combination of channels

**API Test:**
```bash
# Should succeed
PUT /api/users/settings
{ 
  "notifications": { 
    "emailEmail": true,
    "emailSlack": true,
    "emailSms": true,
    "emailWebhook": true
  } 
}
→ 200 OK
```

### Test 4: Plan Upgrade Flow
**Setup:** User upgrades from FREE to STARTER

**Expected Behavior:**
1. Before upgrade: Only email available
2. User clicks "View plans" → Goes to pricing page
3. User subscribes to STARTER plan
4. Stripe webhook updates subscription in database
5. User refreshes settings page
6. Now Email + Slack are available
7. SMS and Webhook still require upgrade

### Test 5: Plan Downgrade Scenario
**Setup:** User downgrades from PRO to STARTER

**Expected Behavior:**
1. If user had SMS or Webhook enabled
2. After downgrade, those channels disabled in UI
3. User sees "Upgrade Required" on SMS/Webhook
4. Email and Slack remain functional
5. Attempting to re-enable SMS/Webhook blocked

## Manual Testing Steps

1. **Test FREE Plan:**
   ```bash
   # In browser console
   localStorage.getItem('currentUser')
   # Check organization subscription status
   ```
   - Go to Settings
   - Try toggling each channel
   - Verify only email works

2. **Test STARTER Plan:**
   - Create test subscription with STARTER plan
   - Go to Settings
   - Verify Email + Slack work
   - Verify SMS + Webhook blocked

3. **Test API Validation:**
   ```bash
   # Use browser dev tools Network tab
   # Watch PUT /api/users/settings requests
   # Verify 403 responses for restricted channels
   ```

4. **Test Upgrade Flow:**
   - As FREE user, click "View plans" link
   - Subscribe to STARTER
   - Return to Settings
   - Verify Slack is now available

## Error Messages

### Client-Side (Toast)
```
"Slack notifications require a plan upgrade."
"Sms notifications require a plan upgrade."
"Webhook notifications require a plan upgrade."
```

### Server-Side (API)
```json
{
  "error": "Slack notifications are not available on your current plan",
  "channel": "slack",
  "plan": "FREE",
  "requiredPlan": "STARTER"
}
```

## UI Screenshots Checklist

- [ ] FREE user settings page with restricted channels
- [ ] STARTER user with Slack enabled
- [ ] PRO user with all channels available
- [ ] Error toast when clicking restricted channel
- [ ] "Upgrade Required" badge display
- [ ] Disabled toggle switch appearance

## Edge Cases

1. **No Subscription Data:**
   - Defaults to FREE plan limits
   - Only email available

2. **Invalid Channel in Settings:**
   - API validates and rejects
   - Returns 403 with error message

3. **Subscription Sync Delay:**
   - Settings page fetches fresh subscription data
   - Shows current plan limits

4. **Multiple Channels Toggle:**
   - Each channel validated independently
   - First restricted channel triggers error

## Success Criteria

✅ FREE users can only enable email notifications
✅ STARTER users can enable email + slack
✅ PRO/ENTERPRISE users can enable all channels
✅ Restricted channels show "Upgrade Required" badge
✅ Restricted channels have disabled toggles
✅ "View plans" link navigates to pricing page
✅ Error toast shown when clicking restricted channel
✅ API returns 403 when saving restricted channel
✅ Plan upgrades immediately unlock new channels
✅ Plan downgrades immediately restrict channels

## Related Files

- `/lib/stripe.js` - Plan limits definition
- `/lib/constants.js` - NOTIFICATION_CHANNELS array
- `/app/settings/page.js` - Settings UI with restrictions
- `/app/api/users/settings/route.js` - API validation
- `/app/pricing/page.js` - Pricing page for upgrades

## Notes

- Notification preferences are stored per-user, not per-organization
- Email channel is always available on all plans
- SMS and Webhook require PRO or higher
- Slack available on STARTER and above
- Settings page refetches subscription on load to get latest plan
