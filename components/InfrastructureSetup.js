'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import {
  Copy,
  Check,
  Key,
  Terminal,
  Download,
  Server,
  Container,
  Cloud,
  Database,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

export default function InfrastructureSetup({ siteId }) {
  const [apiToken, setApiToken] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState({});

  const generateApiToken = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Infrastructure Monitoring - ${new Date().toLocaleDateString()}`,
          siteId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setApiToken(data.token);
        setShowToken(true);
      } else {
        alert(data.error || 'Failed to generate API token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Failed to generate API token');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => {
        setCopied({ ...copied, [key]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const envConfig = `# MonitHQ Infrastructure Monitoring Configuration

# Required: Your MonitHQ site ID
MONIT_SITE_ID=${siteId}

# Required: Your MonitHQ API token (generate below)
MONIT_API_TOKEN=${apiToken || 'your-api-token-here'}

# Required: MonitHQ API URL
MONIT_API_URL=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}

# Optional: Database configuration for query monitoring
DATABASE_NAME=myapp_production

# Optional: Slow query threshold in milliseconds (default: 1000)
SLOW_QUERY_THRESHOLD=1000

# Optional: Kubernetes namespace to monitor (default: default)
K8S_NAMESPACE=default
`;

  const serverScript = `#!/bin/bash
# Quick setup script for server monitoring

# Install dependencies
npm install systeminformation dotenv

# Create .env file
cat > .env << 'EOF'
${envConfig}EOF

# Download and run server metrics script
curl -o send-server-metrics.js https://raw.githubusercontent.com/your-repo/monithq/main/scripts/send-server-metrics.js

# Test the script
node send-server-metrics.js

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $(pwd) && node send-server-metrics.js >> monitoring.log 2>&1") | crontab -

echo "✅ Server monitoring configured successfully!"
`;

  const dockerScript = `#!/bin/bash
# Quick setup script for Docker monitoring

# Install dependencies
npm install dockerode dotenv

# Create .env file (if not exists)
[ ! -f .env ] && cat > .env << 'EOF'
${envConfig}EOF

# Download and run Docker metrics script
curl -o send-docker-metrics.js https://raw.githubusercontent.com/your-repo/monithq/main/scripts/send-docker-metrics.js

# Test the script
node send-docker-metrics.js

# Add to crontab (runs every 2 minutes)
(crontab -l 2>/dev/null; echo "*/2 * * * * cd $(pwd) && node send-docker-metrics.js >> monitoring.log 2>&1") | crontab -

echo "✅ Docker monitoring configured successfully!"
`;

  const CopyButton = ({ text, id }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
      title="Copy to clipboard"
    >
      {copied[id] ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* API Token Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Step 1: Generate API Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate an API token to authenticate monitoring agents with MonitHQ.
          </p>

          {!apiToken ? (
            <button
              onClick={generateApiToken}
              disabled={generating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all inline-flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Generate API Token
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium text-green-500 mb-2">
                  ✅ API Token Generated Successfully
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded bg-background/50 text-sm font-mono">
                    {showToken ? apiToken : '••••••••••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
                  >
                    {showToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <CopyButton text={apiToken} id="apiToken" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Save this token securely. It won't be shown again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Step 2: Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Site ID */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Your Site ID
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 rounded-lg bg-background/50 border border-border text-sm font-mono">
                  {siteId}
                </code>
                <CopyButton text={siteId} id="siteId" />
              </div>
            </div>

            {/* Environment Variables */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Environment Configuration (.env file)
              </label>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-background/50 border border-border text-xs font-mono overflow-x-auto">
                  {envConfig}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={envConfig} id="envConfig" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup Scripts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Step 3: Install Monitoring Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Server Monitoring */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-foreground">Server Metrics (CPU, RAM, Disk)</h3>
              </div>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-background/50 border border-border text-xs font-mono overflow-x-auto max-h-48">
                  {serverScript}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={serverScript} id="serverScript" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Monitors CPU usage, RAM usage, and disk space. Runs every 5 minutes.
              </p>
            </div>

            {/* Docker Monitoring */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Container className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-foreground">Docker Container Health</h3>
              </div>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-background/50 border border-border text-xs font-mono overflow-x-auto max-h-48">
                  {dockerScript}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={dockerScript} id="dockerScript" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Monitors Docker containers status, resource usage, and health. Runs every 2 minutes.
              </p>
            </div>

            {/* Kubernetes Monitoring */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-cyan-500" />
                <h3 className="font-semibold text-foreground">Kubernetes Cluster</h3>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-foreground mb-2">Install Kubernetes monitoring:</p>
                <code className="block p-3 rounded bg-background text-xs font-mono">
                  kubectl apply -f https://your-repo/monithq/k8s-monitoring.yaml
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Monitors cluster nodes, pods, deployments, and services.
              </p>
            </div>

            {/* Database Query Monitoring */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-foreground">Database Query Performance</h3>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-foreground mb-2">Add to your application code:</p>
                <pre className="p-3 rounded bg-background text-xs font-mono overflow-x-auto">
{`// For Prisma (in your main app file)
import { QueryPerformanceTracker } from './lib/query-tracker';

const tracker = new QueryPerformanceTracker(
  '${siteId}',
  '${apiToken || 'YOUR_API_TOKEN'}',
  '${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}'
);

// Add Prisma middleware
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  if (duration > 100) {
    await tracker.trackQuery({
      queryText: \`\${params.model}.\${params.action}\`,
      executionTimeMs: duration,
      queryType: params.action.toUpperCase(),
    });
  }

  return result;
});`}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Automatically tracks slow queries (&gt; 1000ms) and provides optimization suggestions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Installation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Installation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Option 1: Using npm scripts (recommended)</h4>
              <pre className="p-3 rounded-lg bg-background/50 border border-border font-mono text-xs">
{`# Clone monitoring scripts
git clone https://github.com/your-repo/monithq-agents.git
cd monithq-agents

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run monitoring
npm run monitor:server
npm run monitor:docker
npm run monitor:k8s
npm run monitor:queries`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Option 2: Using Docker Compose</h4>
              <pre className="p-3 rounded-lg bg-background/50 border border-border font-mono text-xs">
{`# docker-compose.yml
version: '3.8'
services:
  monithq-agent:
    image: monithq/monitoring-agent:latest
    environment:
      - MONIT_SITE_ID=${siteId}
      - MONIT_API_TOKEN=${apiToken || 'YOUR_API_TOKEN'}
      - MONIT_API_URL=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Option 3: Using systemd service</h4>
              <p className="mb-2">Create <code>/etc/systemd/system/monithq-monitor.service</code>:</p>
              <pre className="p-3 rounded-lg bg-background/50 border border-border font-mono text-xs">
{`[Unit]
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
WantedBy=multi-user.target`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
