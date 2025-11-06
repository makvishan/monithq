# Email Testing & Troubleshooting Guide

## 🎯 Issue Found

Your email configuration is working correctly! The issue is with **Resend's free tier limitations**.

### The Problem

**Resend free tier only allows sending emails to your verified email address** (`makvishan@gmail.com`).

When trying to send to other addresses, you get:
```
validation_error: You can only send testing emails to your own email address
```

### ✅ Verified Working

- ✅ RESEND_API_KEY is configured correctly
- ✅ Email sending works to `makvishan@gmail.com`
- ✅ Email templates are rendering properly
- ✅ Resend API integration is functional

## 🚀 Solutions

### Option 1: Verify a Custom Domain (Recommended for Production)

1. Go to [Resend Domains](https://resend.com/domains)
2. Add your custom domain (e.g., `monithq.com`)
3. Add DNS records as instructed by Resend
4. Update the `from` address in `/lib/resend.js`:

```javascript
// Change from:
from: 'MonitHQ <onboarding@resend.dev>'

// To:
from: 'MonitHQ <noreply@yourdomain.com>'
```

### Option 2: Use Development/Testing Mode

For development and testing, all emails will be sent to your verified address:

```javascript
// In /lib/resend.js, add a development override:
const isDevelopment = process.env.NODE_ENV === 'development';
const recipientEmail = isDevelopment ? 'makvishan@gmail.com' : to;

await resend.emails.send({
  from: 'MonitHQ <onboarding@resend.dev>',
  to: recipientEmail, // Override in development
  subject: emailContent.subject,
  html: emailContent.html,
});
```

### Option 3: Upgrade Resend Plan

Upgrade to a paid Resend plan to send to any email address without domain verification.

## 📧 Testing Email Delivery

### Using the Test Script

We've created a comprehensive email testing script at `scripts/test-email.js`.

#### Basic Usage

```bash
# Test simple email
node scripts/test-email.js makvishan@gmail.com

# Test team invite email
node scripts/test-email.js makvishan@gmail.com teamInvite

# Test incident alert
node scripts/test-email.js makvishan@gmail.com incidentCreated

# Test incident resolved
node scripts/test-email.js makvishan@gmail.com incidentResolved
```

#### Using npm script

```bash
npm run test:email makvishan@gmail.com simple
```

### Available Templates

1. **simple** - Basic test email (default)
2. **teamInvite** - Team invitation email
3. **incidentCreated** - Incident alert notification
4. **incidentResolved** - Incident resolved notification

## 🔍 Debugging Checklist

If emails aren't being delivered:

- [ ] Check RESEND_API_KEY in `.env` file
- [ ] Verify recipient email matches your Resend account email
- [ ] Check spam/junk folder
- [ ] Ensure Resend account is active
- [ ] Check [Resend Logs](https://resend.com/emails) for delivery status
- [ ] Verify DNS records if using custom domain
- [ ] Check rate limits (free tier: 100 emails/day)

## 📊 Email Delivery Status

You can check email delivery status at:
- **Resend Dashboard:** https://resend.com/emails
- **API Response:** Check the `id` in the response to track the email

## 🛠️ Current Configuration

- **API Key:** Configured in `.env`
- **From Address:** `MonitHQ <onboarding@resend.dev>`
- **Verified Email:** `makvishan@gmail.com`
- **Free Tier Limit:** 100 emails/day
- **Rate Limit:** 2 emails/second

## 📝 Notes

- Emails from `onboarding@resend.dev` may take a few minutes to arrive
- Always check spam folder for test emails
- For production use, domain verification is highly recommended
- The test script shows detailed error messages for troubleshooting

## 🎓 Learn More

- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Setup](https://resend.com/docs/send-with-nextjs)
- [Resend Email Testing](https://resend.com/docs/send-with-nodejs)
