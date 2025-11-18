# Infrastructure Monitoring Scripts

These scripts collect infrastructure metrics and send them to MonitHQ for monitoring.

## 📖 Guides

- **[EC2 Setup Guide](EC2_SETUP_GUIDE.md)** - Complete guide for monitoring AWS EC2 instances
- **[General Setup](#-quick-start)** - Setup for any server or local machine

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **MonitHQ API Token** - Generate from Settings > API Keys
4. **Site ID** - Get from your site's URL in MonitHQ

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd scripts
npm install
```

### 2. Set Environment Variables

Create a `.env` file in the `scripts` directory:

```bash
# MonitHQ Configuration
MONIT_SITE_ID=your-site-id
MONIT_API_TOKEN=your-api-token
MONIT_API_URL=https://your-monithq-instance.com

# Optional: Database configuration
DATABASE_NAME=myapp_production
SLOW_QUERY_THRESHOLD=1000

# Optional: Kubernetes namespace
K8S_NAMESPACE=default
```

## 📊 Server Metrics Monitoring

Monitors CPU, RAM, and Disk usage.

### Installation

```bash
npm install os-utils systeminformation
```

### Usage

**One-time run:**
```bash
node send-server-metrics.js <siteId> <apiToken>
```

**Automated collection (every 5 minutes):**

Add to crontab:
```bash
crontab -e
```

Add this line:
```
*/5 * * * * cd /path/to/monithq/scripts && node send-server-metrics.js
```

**Using environment variables:**
```bash
export MONIT_SITE_ID="your-site-id"
export MONIT_API_TOKEN="your-api-token"
node send-server-metrics.js
```

### Metrics Collected

- **CPU**: Usage %, Load average, Core count
- **RAM**: Used/Total MB, Usage %
- **Disk**: Used/Total GB, Usage %
- **System**: Hostname, OS type, OS version

## 🐳 Docker Container Monitoring

Monitors Docker container health and resource usage.

### Installation

```bash
npm install dockerode
```

### Requirements

- Docker must be running
- User must have permission to access Docker socket
- On Linux: Add user to `docker` group

### Usage

**One-time run:**
```bash
node send-docker-metrics.js <siteId> <apiToken>
```

**Automated collection:**
```bash
# Every 2 minutes
*/2 * * * * cd /path/to/monithq/scripts && node send-docker-metrics.js
```

### Metrics Collected

- **Container Info**: ID, Name, Image, Tag
- **Status**: Running/Stopped/Paused state
- **Health**: Health check status
- **Resources**: CPU %, Memory usage, Network I/O
- **Runtime**: Uptime, Restart count

## ☸️ Kubernetes Cluster Monitoring

Monitors Kubernetes cluster health and resources.

### Installation

```bash
npm install @kubernetes/client-node
```

### Requirements

- `kubectl` configured with cluster access
- Valid `~/.kube/config` or `KUBECONFIG` environment variable

### Usage

**Monitor default namespace:**
```bash
node send-k8s-metrics.js <siteId> <apiToken>
```

**Monitor specific namespace:**
```bash
node send-k8s-metrics.js <siteId> <apiToken> production
```

**Automated collection:**
```bash
# Every 3 minutes
*/3 * * * * cd /path/to/monithq/scripts && K8S_NAMESPACE=production node send-k8s-metrics.js
```

### Metrics Collected

- **Nodes**: Ready/Not Ready counts
- **Pods**: Running/Pending/Failed counts
- **Workloads**: Deployments, Services, Ingresses, PVCs
- **Events**: Recent warnings and errors
- **Health**: Overall cluster health status

## 🗄️ Database Query Performance

Monitors database query performance and detects slow queries.

### Method 1: Prisma Middleware (Recommended)

Add to your application code:

```javascript
// lib/prisma.js
const { PrismaClient } = require('@prisma/client');
const { queryPerformanceMiddleware } = require('./scripts/send-query-metrics');

const prisma = new PrismaClient();

// Add the middleware
prisma.$use(queryPerformanceMiddleware);

module.exports = prisma;
```

### Method 2: Manual Tracking

For non-Prisma databases:

```javascript
const { QueryPerformanceTracker } = require('./scripts/send-query-metrics');

const tracker = new QueryPerformanceTracker('postgres', 'mydb');

// Track a query
const users = await tracker.trackQuery(
  'SELECT * FROM users WHERE email = $1',
  () => db.query('SELECT * FROM users WHERE email = $1', [email]),
  {
    rowsAffected: 1,
    useIndex: true,
    endpoint: '/api/users/login',
  }
);
```

### Metrics Collected

- **Query Info**: Type (SELECT/INSERT/etc), Hash, Text
- **Performance**: Execution time, Row counts
- **Analysis**: Slow query detection, Index usage
- **Context**: Endpoint, User (anonymized)

## 🔄 Automated Setup with systemd (Linux)

For production servers, use systemd for reliable service management.

### Create Service Files

**Server metrics service:**
```bash
sudo nano /etc/systemd/system/monithq-server-metrics.service
```

```ini
[Unit]
Description=MonitHQ Server Metrics Collector
After=network.target

[Service]
Type=oneshot
User=youruser
WorkingDirectory=/path/to/monithq/scripts
Environment="MONIT_SITE_ID=your-site-id"
Environment="MONIT_API_TOKEN=your-api-token"
ExecStart=/usr/bin/node send-server-metrics.js

[Install]
WantedBy=multi-user.target
```

**Create timer:**
```bash
sudo nano /etc/systemd/system/monithq-server-metrics.timer
```

```ini
[Unit]
Description=Run MonitHQ Server Metrics every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

**Enable and start:**
```bash
sudo systemctl enable monithq-server-metrics.timer
sudo systemctl start monithq-server-metrics.timer
sudo systemctl status monithq-server-metrics.timer
```

## 🐋 Docker Compose Integration

Add metrics collection to your Docker Compose setup:

```yaml
version: '3.8'

services:
  # Your application services...

  monithq-metrics:
    image: node:18-alpine
    volumes:
      - ./scripts:/app
      - /var/run/docker.sock:/var/run/docker.sock
    working_dir: /app
    environment:
      - MONIT_SITE_ID=${MONIT_SITE_ID}
      - MONIT_API_TOKEN=${MONIT_API_TOKEN}
      - MONIT_API_URL=${MONIT_API_URL}
    command: sh -c "npm install && while true; do node send-docker-metrics.js; sleep 120; done"
```

## 📈 Viewing Metrics in MonitHQ

1. Navigate to your site in MonitHQ
2. Click the **"Infrastructure"** tab
3. View real-time metrics for:
   - Server resources
   - Docker containers
   - Kubernetes clusters
   - Database queries

## 🔔 Alerts

Metrics automatically trigger alerts when thresholds are exceeded:

- **CPU** > 80%
- **RAM** > 85%
- **Disk** > 90%
- **Container** unhealthy or restarting
- **Kubernetes** pods failing or nodes not ready
- **Database** slow queries (> 1000ms)

Configure alert thresholds in the API POST requests or via environment variables.

## 🐛 Troubleshooting

### Permission Denied (Docker)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Kubernetes Connection Failed

```bash
# Test kubectl access
kubectl cluster-info

# Check KUBECONFIG
echo $KUBECONFIG
```

### Metrics Not Appearing

1. Check API token is valid
2. Verify site ID is correct
3. Check MonitHQ API URL
4. Review script output for errors

### Enable Debug Logging

```bash
DEBUG=* node send-server-metrics.js
```

## 📦 Dependencies

Create `package.json` in scripts directory:

```json
{
  "name": "monithq-infrastructure-agents",
  "version": "1.0.0",
  "description": "Infrastructure monitoring agents for MonitHQ",
  "scripts": {
    "server": "node send-server-metrics.js",
    "docker": "node send-docker-metrics.js",
    "k8s": "node send-k8s-metrics.js",
    "install-all": "npm install os-utils systeminformation dockerode @kubernetes/client-node"
  },
  "dependencies": {
    "os-utils": "^0.0.14",
    "systeminformation": "^5.21.0",
    "dockerode": "^4.0.0",
    "@kubernetes/client-node": "^0.20.0"
  }
}
```

## 🔐 Security Best Practices

1. **Never commit API tokens** to version control
2. Use **environment variables** for sensitive data
3. **Restrict API token** permissions to minimum required
4. **Rotate tokens** regularly
5. Use **HTTPS** for API URLs in production

## 📝 Example Cron Setup (All Services)

```bash
# MonitHQ Infrastructure Monitoring
*/5 * * * * cd /path/to/monithq/scripts && node send-server-metrics.js >> /var/log/monithq-server.log 2>&1
*/2 * * * * cd /path/to/monithq/scripts && node send-docker-metrics.js >> /var/log/monithq-docker.log 2>&1
*/3 * * * * cd /path/to/monithq/scripts && K8S_NAMESPACE=production node send-k8s-metrics.js >> /var/log/monithq-k8s.log 2>&1
```

## 🆘 Support

For issues or questions:
- Check the [MonitHQ Documentation](https://docs.monithq.com)
- Open an issue on GitHub
- Contact support at support@monithq.com
