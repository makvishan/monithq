# MonitHQ Cloudflare Worker - Multi-Region Monitoring

This Cloudflare Worker enables true multi-region site monitoring by running checks from Cloudflare's edge network (300+ locations worldwide).

## Features

- 🌍 **Global Coverage**: Runs on Cloudflare's edge network across 300+ cities
- ⚡ **Low Latency**: Checks execute from the nearest edge location
- 🔒 **Secure**: API key authentication
- 📊 **Detailed Metrics**: Response time, DNS, connection, TLS timings
- 🗺️ **Regional Metadata**: Returns datacenter location, city, country, coordinates

## Prerequisites

1. **Cloudflare Account** (free tier works)
2. **Wrangler CLI** installed globally:
   ```bash
   npm install -g wrangler
   ```

## Setup & Deployment

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

### 2. Set API Secret

Create a secure API key and set it as a secret:

```bash
cd cloudflare-workers
wrangler secret put MONITHQ_API_SECRET
# When prompted, enter your secret API key (same as in your .env file)
```

### 3. Update Configuration

Edit `wrangler.toml` and update:
- `name`: Worker name (optional)
- `ALLOWED_ORIGINS`: Add your production domain in `region-monitor.js`

### 4. Deploy the Worker

```bash
cd cloudflare-workers
wrangler deploy
```

The worker will be deployed to: `https://monithq-region-monitor.your-subdomain.workers.dev`

### 5. Custom Domain (Optional)

To use a custom domain:

1. Add a route in `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "monitor.monithq.com/*", zone_name = "monithq.com" }
   ]
   ```

2. Redeploy:
   ```bash
   wrangler deploy
   ```

## Environment Variables

Add these to your MonitHQ `.env` file:

```bash
# Cloudflare Worker URL
CLOUDFLARE_WORKER_URL=https://monithq-region-monitor.your-subdomain.workers.dev

# API Secret (must match the secret set in Cloudflare)
CLOUDFLARE_WORKER_API_SECRET=your-secure-secret-key-here
```

## Usage

The worker accepts POST requests:

```javascript
const response = await fetch('https://your-worker.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-MonitHQ-API-Key': 'your-api-secret',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    timeout: 10000, // optional, default 10s
  }),
});

const data = await response.json();
console.log(data);
```

Response format:

```json
{
  "success": true,
  "region": {
    "colo": "SJC",
    "city": "San Jose",
    "country": "US",
    "continent": "NA",
    "latitude": 37.3394,
    "longitude": -121.895
  },
  "check": {
    "success": true,
    "status": "ONLINE",
    "responseTime": 245,
    "statusCode": 200,
    "errorMessage": null,
    "resolvedIp": "93.184.216.34",
    "timings": {
      "dns": 36,
      "connect": 49,
      "tls": 36,
      "total": 245
    },
    "headers": { ... }
  },
  "timestamp": "2024-11-15T23:50:00.000Z",
  "workerTimestamp": 1700089800000
}
```

## Regional Distribution

Cloudflare automatically routes requests to the nearest datacenter based on the client's location. To test from different regions, you can:

1. **Use VPN**: Connect to different countries
2. **Use Proxy Services**: Route through regional proxies
3. **Use Cloudflare Durable Objects**: Pin execution to specific regions

### Mapping Cloudflare Colos to MonitHQ Regions

The worker returns a `colo` code (e.g., 'SJC', 'FRA', 'NRT'). Map these to MonitHQ regions:

- **US_EAST**: IAD, JFK, EWR, BOS, ATL, MIA, DFW, IAH, ORD
- **US_WEST**: SJC, LAX, SEA, SFO, PDX, PHX, DEN
- **EU_WEST**: DUB, LHR, MAN, AMS, CDG
- **EU_CENTRAL**: FRA, MUC, VIE, ZRH, WAW
- **ASIA_EAST**: NRT, HND, KIX, ICN, TPE, HKG
- **ASIA_SOUTHEAST**: SIN, KUL, BKK, CGK, MNL
- **AUSTRALIA**: SYD, MEL, PER, BNE
- **SOUTH_AMERICA**: GRU, SCL, BOG, EZE, LIM

Full list: https://www.cloudflarestatus.com/

## Development

Test locally:

```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`

## Monitoring & Logs

View worker logs:

```bash
wrangler tail
```

## Cost

- **Free Tier**: 100,000 requests/day
- **Paid Plans**: $5/month for 10M requests

For MonitHQ, the free tier should be sufficient for:
- 100 sites × 12 checks/hour × 24 hours = 28,800 requests/day
- Plus regional checks: ~50,000 requests/day total

## Security

- ✅ API key authentication required
- ✅ CORS configured for allowed origins
- ✅ Rate limiting (Cloudflare automatic)
- ✅ DDoS protection (Cloudflare automatic)

## Troubleshooting

**Worker not receiving requests:**
- Check CORS settings in `ALLOWED_ORIGINS`
- Verify API secret matches between worker and MonitHQ

**Slow response times:**
- Check worker CPU limits in `wrangler.toml`
- Consider upgrading to "unbound" usage model

**Authentication errors:**
- Regenerate API secret: `wrangler secret put MONITHQ_API_SECRET`
- Update `.env` file with new secret

## Links

- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Platform](https://developers.cloudflare.com/workers/)
- [Cloudflare Network Map](https://www.cloudflare.com/network/)
