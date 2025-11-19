

# MonitHQ Infrastructure Setup Guide

This guide provides a step-by-step walkthrough for setting up MonitHQ infrastructure monitoring. Follow each step in order for a complete setup.

---

## Step 1: Prepare Environment Configuration

Create a `.env` file with the following content:
```env
# MonitHQ Infrastructure Monitoring Configuration
MONIT_SITE_ID=
MONIT_API_TOKEN=
MONIT_API_URL=
DATABASE_NAME=myapp_production
SLOW_QUERY_THRESHOLD=1000
K8S_NAMESPACE=default
```
Fill in your site ID, API token, and API URL.

---

## Step 2: Server Monitoring Setup

Create a file named `server-setup.sh` with the following content:
```bash
#!/bin/bash
# Quick setup script for server monitoring
npm install systeminformation dotenv
cat > .env << 'EOF'
# MonitHQ Infrastructure Monitoring Configuration
MONIT_SITE_ID=
MONIT_API_TOKEN=
MONIT_API_URL=
DATABASE_NAME=myapp_production
SLOW_QUERY_THRESHOLD=1000
K8S_NAMESPACE=default
EOF
curl -o send-server-metrics.js https://raw.githubusercontent.com/your-repo/monithq/main/scripts/send-server-metrics.js
node send-server-metrics.js
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $(pwd) && node send-server-metrics.js >> monitoring.log 2>&1") | crontab -
echo "✅ Server monitoring configured successfully!"
```
Run this script on your server to install dependencies and schedule monitoring.

---

## Step 3: Docker Monitoring Setup

Create a file named `docker-setup.sh` with the following content:
```bash
#!/bin/bash
# Quick setup script for Docker monitoring
npm install dockerode dotenv
[ ! -f .env ] && cat > .env << 'EOF'
# MonitHQ Infrastructure Monitoring Configuration
MONIT_SITE_ID=
MONIT_API_TOKEN=
MONIT_API_URL=
DATABASE_NAME=myapp_production
SLOW_QUERY_THRESHOLD=1000
K8S_NAMESPACE=default
EOF
curl -o send-docker-metrics.js https://raw.githubusercontent.com/your-repo/monithq/main/scripts/send-docker-metrics.js
node send-docker-metrics.js
(crontab -l 2>/dev/null; echo "*/2 * * * * cd $(pwd) && node send-docker-metrics.js >> monitoring.log 2>&1") | crontab -
echo "✅ Docker monitoring configured successfully!"
```
Run this script in your Docker host environment.

---

## Step 4: Docker Compose Deployment

Create a file named `docker-compose.yml` with the following content:
```yaml
version: '3.8'
services:
  monithq-agent:
    image: monithq/monitoring-agent:latest
    environment:
      - MONIT_SITE_ID=
      - MONIT_API_TOKEN=
      - MONIT_API_URL=
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```
Edit environment variables as needed and deploy with Docker Compose.

---

## Step 5: systemd Service Setup

Create a file named `monithq-monitor.service` with the following content:
```ini
[Unit]
Description=MonitHQ Infrastructure Monitoring
After=network.target

[Service]
Type=simple
User=monitoring
WorkingDirectory=/opt/monithq-agents
EnvironmentFile=/opt/monithq-agents/.env
ExecStart=/usr/bin/node /opt/monithq-agents/send-server-metrics.js
Restart=always
RestartSec=300

[Install]
WantedBy=multi-user.target
```
Place this file in `/etc/systemd/system/`, edit paths as needed, then enable and start the service:
```bash
sudo systemctl enable monithq-monitor
sudo systemctl start monithq-monitor
```

---

## Support

For more details, see the MonitHQ documentation or contact support.
