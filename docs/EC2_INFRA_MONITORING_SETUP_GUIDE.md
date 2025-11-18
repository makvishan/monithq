# EC2 Server Monitoring Setup Guide

This guide explains how to set up MonitHQ infrastructure monitoring for AWS EC2 instances.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Instructions](#detailed-setup-instructions)
- [Monitoring Options](#monitoring-options)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Overview

MonitHQ provides real-time infrastructure monitoring for EC2 instances, tracking:
- **Server Metrics**: CPU usage, RAM usage, Disk usage
- **Docker Containers**: Container health, resource usage, restart counts
- **Kubernetes Clusters**: Node status, pod health, deployment status
- **Database Queries**: Query performance, slow query detection

## Prerequisites

Before you begin, ensure you have:

1. **MonitHQ Account**: Active account with a site created
2. **EC2 Instance**: Running AWS EC2 instance with SSH access
3. **SSH Key**: PEM file for EC2 instance access
4. **Node.js**: Version 16 or higher (will be installed if needed)
5. **Permissions**: Sudo access on EC2 instance

## Quick Start

### 1. Generate API Token in MonitHQ

1. Log in to MonitHQ dashboard
2. Navigate to your site
3. Click the **Infrastructure** tab
4. Click **"Generate Token"** button
5. **Copy the token immediately** (shown only once!)
6. Note your **Site ID** from the URL

### 2. Connect to Your EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### 3. One-Command Setup (Quick Test)

```bash
# Install Node.js and test monitoring
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
sudo apt-get install -y nodejs && \
mkdir -p ~/monithq-monitoring && \
cd ~/monithq-monitoring
```

## Detailed Setup Instructions

### Step 1: Install Node.js on EC2

```bash
# Update package manager
sudo apt-get update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### Step 2: Create Monitoring Directory

```bash
# Create directory for monitoring scripts
mkdir -p ~/monithq-monitoring
cd ~/monithq-monitoring
```

### Step 3: Transfer Monitoring Scripts

**Option A: Using SCP (From Your Local Machine)**

```bash
# Copy scripts from your MonitHQ project to EC2
scp -i /path/to/your-key.pem -r /path/to/monithq/scripts/* ubuntu@your-ec2-ip:~/monithq-monitoring/
```

**Option B: Manual Creation (On EC2)**

Create each file manually on the EC2 instance:

```bash
# Create package.json
cat > package.json << 'EOF'
{
  "name": "monithq-infrastructure-agents",
  "version": "1.0.0",
  "description": "Infrastructure monitoring agents for MonitHQ",
  "main": "send-server-metrics.js",
  "scripts": {
    "server": "node send-server-metrics.js",
    "docker": "node send-docker-metrics.js",
    "k8s": "node send-k8s-metrics.js",
    "query": "node send-query-metrics.js"
  },
  "dependencies": {
    "os-utils": "^0.0.14",
    "systeminformation": "^5.21.0",
    "dockerode": "^4.0.0",
    "@kubernetes/client-node": "^0.20.0",
    "dotenv": "^16.3.1"
  }
}
EOF
```

Then copy the contents of the monitoring scripts from the MonitHQ repository:
- `send-server-metrics.js`
- `send-docker-metrics.js` (if using Docker)
- `send-k8s-metrics.js` (if using Kubernetes)
- `send-query-metrics.js` (if monitoring database queries)

### Step 4: Configure Environment Variables

```bash
# Create .env file with your credentials
cat > .env << 'EOF'
# MonitHQ Configuration
MONIT_SITE_ID=your-site-id-here
MONIT_API_TOKEN=your-api-token-here
MONIT_API_URL=https://your-monithq-domain.com

# Optional: Database configuration
DATABASE_NAME=myapp_production
SLOW_QUERY_THRESHOLD=1000

# Optional: Kubernetes namespace
K8S_NAMESPACE=default
EOF

# Edit the file with your actual values
nano .env
```

Replace the following values:
- `MONIT_SITE_ID`: Your site ID from MonitHQ (found in URL)
- `MONIT_API_TOKEN`: The token you generated in Step 1
- `MONIT_API_URL`: Your MonitHQ instance URL (e.g., `https://monithq.com` or your self-hosted URL)

### Step 5: Install Dependencies

```bash
# Install all required npm packages
npm install

# This will install:
# - os-utils: System resource monitoring
# - systeminformation: Detailed system information
# - dockerode: Docker container monitoring (optional)
# - @kubernetes/client-node: Kubernetes monitoring (optional)
# - dotenv: Environment variable management
```

### Step 6: Test the Setup

```bash
# Test server metrics collection
node send-server-metrics.js

# Expected output:
# ✓ Server metrics sent successfully
# CPU: 25.5%, RAM: 45.2%, Disk: 32.1%
```

If successful, you should see the metrics appear in your MonitHQ dashboard within a few seconds.

### Step 7: Set Up Automated Monitoring

**Option A: Using Cron (Simple)**

```bash
# Edit crontab
crontab -e

# Add this line to collect server metrics every 5 minutes
*/5 * * * * cd /home/ubuntu/monithq-monitoring && /usr/bin/node send-server-metrics.js >> /var/log/monithq.log 2>&1

# Optional: Add Docker monitoring (every 2 minutes)
*/2 * * * * cd /home/ubuntu/monithq-monitoring && /usr/bin/node send-docker-metrics.js >> /var/log/monithq-docker.log 2>&1

# Optional: Add Kubernetes monitoring (every 3 minutes)
*/3 * * * * cd /home/ubuntu/monithq-monitoring && /usr/bin/node send-k8s-metrics.js >> /var/log/monithq-k8s.log 2>&1
```

**Option B: Using systemd (Production Recommended)**

See [Production Deployment](#production-deployment) section below.

## Monitoring Options

### Server Metrics Monitoring (Always Recommended)

Monitors basic server health:
- CPU usage percentage
- RAM usage (used/total/percentage)
- Disk usage (used/total/percentage)
- System information (hostname, OS, uptime)

```bash
# Test
node send-server-metrics.js

# Cron (every 5 minutes)
*/5 * * * * cd /home/ubuntu/monithq-monitoring && /usr/bin/node send-server-metrics.js
```

### Docker Container Monitoring (If Using Docker)

**Prerequisites:**
- Docker installed on EC2
- User has Docker permissions

**Setup:**

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker access
docker ps

# Install dockerode dependency
npm install dockerode

# Test Docker monitoring
node send-docker-metrics.js

# Add to cron (every 2 minutes)
*/2 * * * * cd /home/ubuntu/monithq-monitoring && /usr/bin/node send-docker-metrics.js
```

**Metrics Collected:**
- Container status (running/stopped/paused)
- Container health checks
- CPU and memory usage per container
- Network I/O statistics
- Restart counts and uptime

### Kubernetes Cluster Monitoring (If Using K8s)

**Prerequisites:**
- kubectl installed and configured
- Valid kubeconfig file (~/.kube/config)
- Cluster access permissions

**Setup:**

```bash
# Verify kubectl access
kubectl cluster-info
kubectl get nodes

# Install Kubernetes client
npm install @kubernetes/client-node

# Test K8s monitoring
node send-k8s-metrics.js

# Test with specific namespace
K8S_NAMESPACE=production node send-k8s-metrics.js

# Add to cron (every 3 minutes)
*/3 * * * * cd /home/ubuntu/monithq-monitoring && K8S_NAMESPACE=production /usr/bin/node send-k8s-metrics.js
```

**Metrics Collected:**
- Node status (ready/not ready counts)
- Pod status (running/pending/failed counts)
- Deployment health
- Service and ingress counts
- Recent cluster events (warnings/errors)

### Database Query Performance (Application-Level)

For database query monitoring, integrate the query tracker into your application code. See the main [README.md](README.md) for Prisma middleware integration examples.

## Production Deployment

For production environments, use systemd for more reliable service management.

### Create systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/monithq-server-metrics.service
```

Paste the following configuration:

```ini
[Unit]
Description=MonitHQ Server Metrics Collector
After=network.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/home/ubuntu/monithq-monitoring
Environment="MONIT_SITE_ID=your-site-id"
Environment="MONIT_API_TOKEN=your-api-token"
Environment="MONIT_API_URL=https://your-monithq.com"
ExecStart=/usr/bin/node send-server-metrics.js
StandardOutput=append:/var/log/monithq-server.log
StandardError=append:/var/log/monithq-server.log

[Install]
WantedBy=multi-user.target
```

### Create systemd Timer

```bash
# Create timer file
sudo nano /etc/systemd/system/monithq-server-metrics.timer
```

Paste the following configuration:

```ini
[Unit]
Description=Run MonitHQ Server Metrics every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=1s

[Install]
WantedBy=timers.target
```

### Enable and Start Services

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable the timer (start on boot)
sudo systemctl enable monithq-server-metrics.timer

# Start the timer
sudo systemctl start monithq-server-metrics.timer

# Check timer status
sudo systemctl status monithq-server-metrics.timer

# List all timers
sudo systemctl list-timers --all | grep monithq

# View logs
sudo journalctl -u monithq-server-metrics.service -f
```

### Create Services for Other Monitoring Types

Repeat the same process for Docker and Kubernetes monitoring:

**Docker Metrics:**
- Service: `/etc/systemd/system/monithq-docker-metrics.service`
- Timer: `/etc/systemd/system/monithq-docker-metrics.timer`
- Interval: `OnUnitActiveSec=2min`

**Kubernetes Metrics:**
- Service: `/etc/systemd/system/monithq-k8s-metrics.service`
- Timer: `/etc/systemd/system/monithq-k8s-metrics.timer`
- Interval: `OnUnitActiveSec=3min`

## Troubleshooting

### Issue: "Permission Denied" (Docker)

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Or logout and login again
exit
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Issue: "Module not found" Errors

```bash
# Reinstall dependencies
cd ~/monithq-monitoring
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Connection Refused" or "Failed to send metrics"

**Check 1: Verify environment variables**
```bash
cat .env
# Ensure MONIT_SITE_ID, MONIT_API_TOKEN, and MONIT_API_URL are correct
```

**Check 2: Test API connectivity**
```bash
# Test if MonitHQ API is reachable
curl -v https://your-monithq.com/api/health
```

**Check 3: Verify API token**
- Go to MonitHQ dashboard
- Navigate to Infrastructure tab
- Regenerate token if needed

### Issue: "Kubernetes connection failed"

```bash
# Test kubectl access
kubectl cluster-info
kubectl get nodes

# Check kubeconfig
echo $KUBECONFIG
ls -la ~/.kube/config

# Verify permissions
kubectl auth can-i get pods --all-namespaces
```

### Issue: Metrics Not Appearing in Dashboard

**Check 1: Verify script runs successfully**
```bash
cd ~/monithq-monitoring
node send-server-metrics.js
# Look for success message
```

**Check 2: Check cron logs**
```bash
# View cron logs
sudo tail -f /var/log/syslog | grep CRON

# Check specific log file
tail -f /var/log/monithq.log
```

**Check 3: Verify Site ID matches**
- Ensure the Site ID in `.env` matches the site you're viewing in MonitHQ

### Enable Debug Logging

```bash
# Run with debug output
DEBUG=* node send-server-metrics.js

# Check verbose output
node send-server-metrics.js 2>&1 | tee debug.log
```

## Security Best Practices

### 1. Protect API Tokens

```bash
# Secure .env file permissions
chmod 600 .env

# Never commit .env to version control
echo ".env" >> .gitignore
```

### 2. Use IAM Roles (Recommended)

Instead of storing credentials in .env, use EC2 IAM roles when possible:

```bash
# Example: Using AWS Systems Manager Parameter Store
aws ssm get-parameter --name "/monithq/api-token" --with-decryption --query "Parameter.Value" --output text
```

### 3. Rotate API Tokens Regularly

- Generate new tokens monthly
- Revoke old tokens in MonitHQ dashboard
- Update .env files on all servers

### 4. Limit Token Permissions

- Create site-specific tokens (not account-wide)
- Set expiration dates when generating tokens
- Use separate tokens for dev/staging/production

### 5. Use HTTPS Only

```bash
# Always use HTTPS in production
MONIT_API_URL=https://monithq.com  # ✓ Secure
MONIT_API_URL=http://monithq.com   # ✗ Insecure
```

### 6. Monitor Access Logs

- Regularly check MonitHQ access logs
- Look for unusual API usage patterns
- Set up alerts for failed authentication attempts

### 7. Firewall Configuration

```bash
# Allow outbound HTTPS to MonitHQ
sudo ufw allow out 443/tcp

# Restrict inbound access
sudo ufw allow 22/tcp  # SSH only
sudo ufw enable
```

## Verification Checklist

After setup, verify the following:

- [ ] Node.js installed (v16+)
- [ ] Monitoring scripts transferred to EC2
- [ ] .env file configured with correct values
- [ ] Dependencies installed (`npm install` successful)
- [ ] Test run successful (`node send-server-metrics.js` works)
- [ ] Metrics visible in MonitHQ dashboard
- [ ] Cron job or systemd timer configured
- [ ] Logs being written to log files
- [ ] API token secured (file permissions set)
- [ ] Firewall rules configured (if applicable)

## Monitoring Multiple EC2 Instances

To monitor multiple EC2 instances:

1. **Option A: Same Site** (Recommended for grouped servers)
   - Use the same Site ID and API token on all instances
   - Each server will appear as a separate metric source
   - Best for: Load-balanced servers, auto-scaling groups

2. **Option B: Separate Sites**
   - Create a separate site in MonitHQ for each instance
   - Generate unique tokens for each
   - Best for: Production/staging separation, different applications

## Auto-Scaling Integration

For auto-scaling groups, include monitoring setup in your AMI or user data:

```bash
#!/bin/bash
# EC2 User Data Script

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Download monitoring scripts
cd /home/ubuntu
git clone https://github.com/your-org/monithq-monitoring.git
cd monithq-monitoring

# Configure from Parameter Store
export MONIT_SITE_ID=$(aws ssm get-parameter --name "/monithq/site-id" --query "Parameter.Value" --output text)
export MONIT_API_TOKEN=$(aws ssm get-parameter --name "/monithq/api-token" --with-decryption --query "Parameter.Value" --output text)
export MONIT_API_URL=$(aws ssm get-parameter --name "/monithq/api-url" --query "Parameter.Value" --output text)

# Install and start
npm install
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /home/ubuntu/monithq-monitoring && node send-server-metrics.js") | crontab -
```

## Support

For issues or questions:
- Check the main [README.md](README.md) for general documentation
- Review MonitHQ dashboard for API token and site configuration
- Check EC2 system logs: `/var/log/syslog`
- Review monitoring logs: `/var/log/monithq*.log`

## Next Steps

After setting up basic server monitoring:

1. Configure alert thresholds in MonitHQ dashboard
2. Set up notification channels (email, Slack, webhooks)
3. Create custom dashboards for your metrics
4. Integrate Docker monitoring if using containers
5. Add database query monitoring for your application
6. Set up log aggregation for centralized monitoring

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
**Compatibility**: MonitHQ v2.0+, Node.js 16+, Ubuntu 20.04+
