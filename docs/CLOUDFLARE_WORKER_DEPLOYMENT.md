# Cloudflare Worker Deployment Guide

Complete guide for deploying MonitHQ's multi-region monitoring Cloudflare Worker.

## 🌍 What is This?

The Cloudflare Worker enables **true multi-region site monitoring** by running checks from Cloudflare's edge network across 300+ cities worldwide. This provides:

- ✅ Real global performance data
- ✅ Sub-100ms latency from anywhere
- ✅ Automatic failover and redundancy
- ✅ No infrastructure to manage
- ✅ 100,000 free requests/day

## 📋 Prerequisites

1. **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)
2. **Node.js** - Version 16 or higher
3. **Wrangler CLI** - Cloudflare's deployment tool

## 🚀 Quick Start (5 minutes)

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate.

### Step 3: Generate API Secret

Generate a secure random secret:

```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output - you'll need it for both the worker and MonitHQ.

### Step 4: Deploy the Worker

```bash
cd cloudflare-workers
wrangler deploy
```

You'll see output like:
```
✨  Built successfully, built project size is 5 KiB.
✨  Successfully published your script to
 https://monithq-region-monitor.your-username.workers.dev
```

**Copy this URL!** You'll need it for MonitHQ configuration.

### Step 5: Set Worker API Secret

```bash
wrangler secret put MONITHQ_API_SECRET
```

When prompted, paste the secret you generated in Step 3.

### Step 6: Configure MonitHQ

Add to your `.env` file:

```bash
# Cloudflare Worker Configuration
CLOUDFLARE_WORKER_URL="https://monithq-region-monitor.your-username.workers.dev"
CLOUDFLARE_WORKER_API_SECRET="your-secret-from-step-3"
```

### Step 7: Restart MonitHQ

```bash
npm run dev
# or for production:
npm run build && npm start
```

### Step 8: Test It!

1. Go to any site detail page
2. Scroll to "Multi-Region Performance"
3. Click "Run Check"
4. You should see real regional data from Cloudflare's network!

## 🔧 Advanced Configuration

### Custom Domain

Want to use `monitor.monithq.com` instead of `*.workers.dev`?

1. Add your domain to Cloudflare (if not already)

2. Edit `cloudflare-workers/wrangler.toml`:

```toml
routes = [
  { pattern = "monitor.monithq.com/*", zone_name = "monithq.com" }
]
```

3. Redeploy:

```bash
wrangler deploy
```

4. Update `.env`:

```bash
CLOUDFLARE_WORKER_URL="https://monitor.monithq.com"
```

### CORS Configuration

To allow requests from your production domain, edit `cloudflare-workers/region-monitor.js`:

```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://monithq.com',      // Add your domain
  'https://www.monithq.com',  // And www subdomain
];
```

Redeploy:

```bash
wrangler deploy
```

### Regional Routing (Advanced)

For true multi-region checks, you have several options:

#### Option 1: Multiple Workers (Recommended)

Deploy the same worker to different accounts/projects and use regional proxies.

#### Option 2: Durable Objects

Use Cloudflare Durable Objects to pin execution to specific regions:

```javascript
// In wrangler.toml:
[[durable_objects.bindings]]
name = "REGIONAL_CHECKER"
class_name = "RegionalChecker"
script_name = "regional-checker"
```

#### Option 3: Third-Party Integration

Integrate with services that provide regional endpoints:
- Pingdom API
- StatusCake API
- AWS Lambda@Edge
- Self-hosted monitoring nodes

## 📊 Monitoring & Logs

### View Real-Time Logs

```bash
wrangler tail
```

### Check Worker Stats

```bash
wrangler metrics
```

Or visit: https://dash.cloudflare.com/workers

### Debug Issues

```bash
# Test locally
wrangler dev

# Then in another terminal:
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -H "X-MonitHQ-API-Key: your-secret" \
  -d '{"url": "https://example.com"}'
```

## 💰 Pricing & Limits

### Free Tier
- ✅ 100,000 requests/day
- ✅ 10ms CPU time per request
- ✅ No credit card required

**MonitHQ Usage Estimate:**
- 100 sites × 12 checks/hour × 24 hours = 28,800 requests/day
- Regional checks: ~20,000 additional requests/day
- **Total: ~50,000 requests/day** ✅ Well within free tier!

### Paid Tier ($5/month)
- 10 million requests/month
- 50ms CPU time per request
- Additional features

## 🔒 Security Checklist

- ✅ API secret is stored securely (Cloudflare Secrets)
- ✅ CORS configured for allowed origins only
- ✅ No sensitive data logged
- ✅ Rate limiting (automatic via Cloudflare)
- ✅ DDoS protection (automatic via Cloudflare)

## 🐛 Troubleshooting

### "Unauthorized" errors

**Problem:** Worker returns 401 Unauthorized

**Solutions:**
1. Check API secret matches between worker and MonitHQ:
   ```bash
   # Reset worker secret
   wrangler secret put MONITHQ_API_SECRET

   # Update MonitHQ .env
   CLOUDFLARE_WORKER_API_SECRET="same-secret-here"
   ```

2. Restart MonitHQ after changing `.env`

### "CORS" errors in browser

**Problem:** Browser console shows CORS errors

**Solutions:**
1. Add your domain to `ALLOWED_ORIGINS` in `region-monitor.js`
2. Redeploy worker: `wrangler deploy`
3. Hard refresh browser (Ctrl+Shift+R)

### Worker not receiving requests

**Problem:** MonitHQ falls back to simulated checks

**Solutions:**
1. Verify worker URL is correct in `.env`:
   ```bash
   # Test manually:
   curl -X POST $CLOUDFLARE_WORKER_URL \
     -H "X-MonitHQ-API-Key: $CLOUDFLARE_WORKER_API_SECRET" \
     -d '{"url": "https://google.com"}'
   ```

2. Check worker is deployed:
   ```bash
   wrangler list
   ```

3. View worker logs:
   ```bash
   wrangler tail
   ```

### Slow response times

**Problem:** Worker takes >1 second to respond

**Solutions:**
1. Check target site is responsive
2. Increase CPU limit in `wrangler.toml`:
   ```toml
   [limits]
   cpu_ms = 100  # Increase from 50
   ```

3. Consider upgrading to "unbound" usage model:
   ```toml
   usage_model = "unbound"
   ```

### "Script too large" error

**Problem:** Deployment fails with script size error

**Solutions:**
1. Worker script is currently ~5 KiB, well under 1 MB limit
2. If you added dependencies, ensure they're compatible with Workers
3. Use `wrangler bundle` to check bundle size

## 🔄 Updating the Worker

When you make changes to `region-monitor.js`:

```bash
cd cloudflare-workers
wrangler deploy
```

No need to restart MonitHQ - changes are live immediately!

## 📈 Performance Tips

1. **Enable caching** for static checks (same URL repeatedly):
   ```javascript
   cf: {
     cacheTtl: 60, // Cache for 60 seconds
   }
   ```

2. **Use HEAD requests** (already implemented) instead of GET to reduce bandwidth

3. **Set appropriate timeouts** to avoid slow checks blocking others

4. **Monitor usage** to stay within free tier limits

## 🌐 Regional Coverage

Cloudflare's network automatically routes requests to the nearest datacenter. Here are the major regions:

| Region | Cities | Cloudflare Colos |
|--------|--------|------------------|
| US East | New York, Miami, Atlanta | JFK, EWR, MIA, ATL |
| US West | San Francisco, Los Angeles, Seattle | SFO, LAX, SEA |
| EU West | London, Dublin, Amsterdam | LHR, DUB, AMS |
| EU Central | Frankfurt, Warsaw, Vienna | FRA, WAW, VIE |
| Asia East | Tokyo, Seoul, Hong Kong | NRT, ICN, HKG |
| Asia SE | Singapore, Bangkok, Jakarta | SIN, BKK, CGK |
| Australia | Sydney, Melbourne | SYD, MEL |
| S. America | São Paulo, Buenos Aires | GRU, EZE |

[View full network map →](https://www.cloudflare.com/network/)

## 🎯 Next Steps

After deployment:

1. ✅ Test regional checks in MonitHQ UI
2. ✅ Monitor worker usage in Cloudflare dashboard
3. ✅ Set up alerts for worker errors
4. ✅ Consider adding more advanced features:
   - Historical regional performance tracking
   - Email alerts for regional degradation
   - Regional uptime percentages
   - Latency comparison charts

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Network Status](https://www.cloudflarestatus.com/)

## 💬 Support

Issues with deployment? Check:

1. Cloudflare Workers Dashboard
2. MonitHQ GitHub Issues
3. `wrangler tail` for error logs
4. This troubleshooting guide

---

Happy monitoring! 🚀
