#!/usr/bin/env node

/**
 * Server Metrics Agent
 *
 * This script collects server metrics (CPU, RAM, Disk) and sends them to MonitHQ.
 *
 * Installation:
 *   npm install os-utils systeminformation
 *
 * Usage:
 *   node send-server-metrics.js <siteId> <apiToken>
 *
 * Or add to crontab for automatic collection:
 *   */5 * * * * node /path/to/send-server-metrics.js <siteId> <apiToken>
 */

const os = require('os');
const si = require('systeminformation');

const SITE_ID = process.argv[2] || process.env.MONIT_SITE_ID;
const API_TOKEN = process.argv[3] || process.env.MONIT_API_TOKEN;
const API_URL = process.env.MONIT_API_URL || 'http://localhost:3000';

if (!SITE_ID || !API_TOKEN) {
  console.error('Usage: node send-server-metrics.js <siteId> <apiToken>');
  console.error('Or set MONIT_SITE_ID and MONIT_API_TOKEN environment variables');
  process.exit(1);
}

async function collectServerMetrics() {
  try {
    // Get CPU info
    const cpuLoad = await si.currentLoad();
    const cpuInfo = await si.cpu();

    // Get memory info
    const mem = await si.mem();

    // Get disk info
    const disk = await si.fsSize();
    const mainDisk = disk[0]; // Primary disk

    // Get OS info
    const osInfo = await si.osInfo();

    const metrics = {
      // CPU Metrics
      cpuUsagePercent: cpuLoad.currentLoad,
      cpuLoadAverage: cpuLoad.avgLoad,
      cpuCoreCount: cpuInfo.cores,

      // RAM Metrics
      ramUsedMB: Math.round((mem.used) / 1024 / 1024),
      ramTotalMB: Math.round(mem.total / 1024 / 1024),
      ramUsagePercent: (mem.used / mem.total) * 100,

      // Disk Metrics
      diskUsedGB: mainDisk.used / 1024 / 1024 / 1024,
      diskTotalGB: mainDisk.size / 1024 / 1024 / 1024,
      diskUsagePercent: mainDisk.use,

      // Thresholds (optional - uses defaults if not provided)
      cpuThreshold: 80.0,
      ramThreshold: 85.0,
      diskThreshold: 90.0,

      // Server Info
      hostname: os.hostname(),
      osType: osInfo.platform,
      osVersion: osInfo.release,
    };

    return metrics;
  } catch (error) {
    console.error('Error collecting metrics:', error);
    throw error;
  }
}

async function sendMetrics(metrics) {
  try {
    const response = await fetch(`${API_URL}/api/sites/${SITE_ID}/infrastructure/server`, {
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

    const result = await response.json();
    console.log('✅ Server metrics sent successfully');
    console.log(`   Healthy: ${result.healthy}`);
    console.log(`   Issues: ${result.issueCount}`);

    return result;
  } catch (error) {
    console.error('❌ Error sending metrics:', error.message);
    throw error;
  }
}

async function main() {
  console.log('📊 Collecting server metrics...');
  const metrics = await collectServerMetrics();

  console.log('📤 Sending to MonitHQ...');
  await sendMetrics(metrics);
}

main().catch(console.error);
