#!/usr/bin/env node

/**
 * Docker Container Health Agent
 *
 * Collects Docker container metrics and sends them to MonitHQ.
 *
 * Installation:
 *   npm install dockerode
 *
 * Usage:
 *   node send-docker-metrics.js <siteId> <apiToken>
 *
 * Requirements:
 *   - Docker must be installed and running
 *   - User must have permission to access Docker socket
 */

const Docker = require('dockerode');
const docker = new Docker();

const SITE_ID = process.argv[2] || process.env.MONIT_SITE_ID;
const API_TOKEN = process.argv[3] || process.env.MONIT_API_TOKEN;
const API_URL = process.env.MONIT_API_URL || 'http://localhost:3000';

if (!SITE_ID || !API_TOKEN) {
  console.error('Usage: node send-docker-metrics.js <siteId> <apiToken>');
  process.exit(1);
}

async function getContainerMetrics(container) {
  try {
    const info = await container.inspect();
    const stats = await container.stats({ stream: false });

    // Calculate CPU usage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuUsagePercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // Calculate memory usage
    const memoryUsedMB = stats.memory_stats.usage / 1024 / 1024;
    const memoryLimitMB = stats.memory_stats.limit / 1024 / 1024;

    // Calculate network usage
    let networkRxMB = 0;
    let networkTxMB = 0;
    if (stats.networks) {
      Object.values(stats.networks).forEach(net => {
        networkRxMB += net.rx_bytes / 1024 / 1024;
        networkTxMB += net.tx_bytes / 1024 / 1024;
      });
    }

    // Calculate uptime
    const startedAt = new Date(info.State.StartedAt);
    const uptime = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    const metrics = {
      containerId: info.Id,
      containerName: info.Name.replace('/', ''),
      imageName: info.Config.Image.split(':')[0],
      imageTag: info.Config.Image.split(':')[1] || 'latest',

      status: info.State.Status,
      state: info.State.Status,
      exitCode: info.State.ExitCode,

      healthStatus: info.State.Health?.Status || 'none',
      healthChecks: info.State.Health?.Log ? info.State.Health.Log.slice(-5) : null,

      cpuUsagePercent: cpuUsagePercent || 0,
      memoryUsedMB: Math.round(memoryUsedMB),
      memoryLimitMB: Math.round(memoryLimitMB),
      networkRxMB: networkRxMB,
      networkTxMB: networkTxMB,

      uptime: uptime,
      restartCount: info.RestartCount,
      createdAt: info.Created,
      startedAt: info.State.StartedAt,

      alertOnUnhealthy: true,
      alertOnRestart: true,
    };

    return metrics;
  } catch (error) {
    console.error(`Error getting metrics for container:`, error.message);
    return null;
  }
}

async function sendContainerMetrics(metrics) {
  try {
    const response = await fetch(`${API_URL}/api/sites/${SITE_ID}/infrastructure/containers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(metrics),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send metrics');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error sending container metrics:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🐳 Collecting Docker container metrics...');

  try {
    const containers = await docker.listContainers({ all: true });
    console.log(`   Found ${containers.length} containers`);

    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      const metrics = await getContainerMetrics(container);

      if (metrics) {
        console.log(`📤 Sending metrics for: ${metrics.containerName}`);
        const result = await sendContainerMetrics(metrics);
        console.log(`   ✅ Sent (Healthy: ${result.healthy}, Issues: ${result.issueCount})`);
      }
    }

    console.log('✅ All container metrics sent successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
