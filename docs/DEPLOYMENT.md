# 🚀 Vercel Deployment Guide - MonitHQ

## ✅ Refactor Complete!

Your application has been successfully refactored to be **100% serverless** and **Vercel-ready**!

### What Changed?

| Before | After | Why? |
|--------|-------|------|
| Socket.io | Pusher | Vercel doesn't support WebSocket servers |
| node-cron | Vercel Cron | Serverless functions are stateless |
| Nodemailer | Resend | Better API, built for serverless |
| Custom server.js | Next.js only | Vercel optimized for standard Next.js |

---

## 📦 Required Services

### 1. Pusher (Real-time Notifications)
- Sign up: https://pusher.com
- Free tier: 200,000 messages/day
- Get: App ID, Key, Secret, Cluster

### 2. Resend (Email)
- Sign up: https://resend.com  
- Free tier: 100 emails/day
- Get: API Key

### 3. Vercel Postgres (Database)
- Included in Vercel deployment
- Or use existing PostgreSQL

---

## 🔧 Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` file

```bash
# Copy example
cp .env.example .env

# Add your values:
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-min-32-chars"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Pusher
PUSHER_APP_ID="your-app-id"
NEXT_PUBLIC_PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"

# Resend
RESEND_API_KEY="re_..."

# Cron security
CRON_SECRET="random-secret"
```

### 3. Setup Database
```bash
npx prisma migrate dev
npm run db:seed
```

### 4. Start Dev Server
```bash
npm run dev
```

---

## ☁️ Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Serverless refactor complete"
git push
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework: **Next.js**
   - Build Command: `next build`
   - Output Directory: `.next`

### Step 3: Add Environment Variables

In Vercel dashboard, add all `.env` variables:

```
DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_APP_URL
PUSHER_APP_ID
NEXT_PUBLIC_PUSHER_KEY
PUSHER_SECRET
NEXT_PUBLIC_PUSHER_CLUSTER
RESEND_API_KEY
CRON_SECRET
```

### Step 4: Setup Database

**Option A: Vercel Postgres**
1. In project → Storage → Create Database
2. Select "Postgres"
3. Connection string auto-added to env

**Option B: External PostgreSQL**
- Add `DATABASE_URL` manually

### Step 5: Run Migrations

After deployment:
```bash
# In Vercel deployment terminal
npx prisma migrate deploy
npx prisma db seed
```

### Step 6: Verify

✅ Check deployment logs  
✅ Visit your app URL  
✅ Test login with seeded accounts  
✅ Check Pusher connection in browser console  
✅ Wait 5 minutes and verify cron ran (check Function logs)

---

## 🧪 Testing Cron Jobs

### Local Testing
```bash
curl http://localhost:3000/api/cron/monitor
```

### Production Testing
```bash
curl https://your-app.vercel.app/api/cron/monitor \
  -H "Authorization: Bearer your-cron-secret"
```

### Verify in Vercel
1. Go to your project dashboard
2. Click "Deployments"
3. Select latest deployment
4. Click "Functions"
5. Find `/api/cron/monitor`
6. Check execution logs

---

## 🔔 Testing Real-time Notifications

1. Login to your deployed app
2. Open browser DevTools → Console
3. Look for: `Pusher connected`
4. Open two browser windows
5. In one window, trigger an action (e.g., create incident)
6. See real-time toast in other window!

---

## 📧 Testing Emails

### Development
```javascript
// lib/resend.js uses onboarding@resend.dev for testing
```

### Production
1. Verify your domain in Resend dashboard
2. Update `from` email in `/lib/resend.js`:
```javascript
from: 'MonitHQ <alerts@yourdomain.com>'
```

---

## 🐛 Common Issues

### "Pusher connection failed"
- ✅ Check `NEXT_PUBLIC_PUSHER_KEY` is set in Vercel
- ✅ Verify cluster matches (us2, eu, ap3, etc.)
- ✅ Check Pusher dashboard for connection logs

### "Cron job not running"
- ✅ Verify `vercel.json` exists in root
- ✅ Check Vercel Pro plan required for cron (Free tier limited)
- ✅ Add `CRON_SECRET` to environment variables

### "Email not sending"
- ✅ Check `RESEND_API_KEY` is correct
- ✅ Verify domain in Resend dashboard
- ✅ Check Resend logs for errors

### "Database connection error"
- ✅ Verify `DATABASE_URL` format
- ✅ Check database is accessible from Vercel
- ✅ Run `npx prisma generate` after schema changes

---

## 📊 Monitoring

### Vercel Analytics
- Enabled by default
- View in project dashboard

### Custom Monitoring
- Check `/app/analytics/page.js`
- Real-time uptime charts
- Incident frequency graphs

### Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs <your-deployment-url>
```

---

## 💡 Performance Tips

### Edge Functions
Convert API routes to Edge for faster response:
```javascript
export const runtime = 'edge';
```

### Database Connection Pooling
Use Prisma Accelerate or PgBouncer for production

### Caching
Add caching headers to static API responses:
```javascript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
});
```

---

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all features
3. ⚠️ (Optional) Migrate to NextAuth.js
4. ⚠️ Add user settings page
5. ⚠️ Implement audit logs
6. 🚀 Launch!

---

## 📱 Test Accounts

After running `npm run db:seed`:

```
Super Admin: admin@monithq.com / admin123
Org Admin:   admin@acme.com / admin123  
User:        user@acme.com / user123
```

---

## 🎉 Success Checklist

- [ ] Pushed to GitHub
- [ ] Imported to Vercel
- [ ] Added all environment variables
- [ ] Database migrated and seeded
- [ ] Pusher connected (check browser console)
- [ ] Cron job running (check Function logs)
- [ ] Emails sending (test team invite)
- [ ] Real-time notifications working
- [ ] Analytics dashboard loading
- [ ] Custom domain connected (optional)

---

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Pusher Docs: https://pusher.com/docs
- Resend Docs: https://resend.com/docs
- Prisma Docs: https://www.prisma.io/docs

---

**Deployment Time**: ~15 minutes  
**Cost (Free Tier)**: $0/month  
**Scalability**: Auto-scaling to millions of users

🚀 Happy deploying!
