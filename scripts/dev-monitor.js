#!/usr/bin/env node

/**
 * Local development monitoring daemon
 * Simulates Vercel Cron by calling the monitoring endpoint every minute
 * Run with: node scripts/dev-monitor.js
 */

const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log(`✅ Loaded .env from ${envPath}`);
} catch (err) {
  console.warn('⚠️  Could not load .env file, using defaults');
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;
const INTERVAL_MS = 60 * 1000; // 1 minute

console.log('🚀 Starting local monitoring daemon...');
console.log(`URL: ${BASE_URL}/api/cron/monitor`);
console.log(`Secret: ${CRON_SECRET ? '***' + CRON_SECRET.slice(-4) : 'NOT SET'}`);
console.log(`Checking sites every ${INTERVAL_MS / 1000} seconds\n`);

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in .env file!');
  process.exit(1);
}


async function runMonitoring() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] Running monitoring check...`);

  try {
    const response = await fetch(`${BASE_URL}/api/cron/monitor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Error:`, data);
      return;
    }

    console.log(`✅ Total sites: ${data.totalSites || 0}`);
    console.log(`✅ Checked: ${data.checked || 0} sites`);
    console.log(`⏭️  Skipped: ${data.skipped || 0} sites (not due yet)`);
    
    if (data.results && data.results.length > 0) {
      console.log('\nResults:');
      data.results.forEach(result => {
        if (result.error) {
          console.log(`  ❌ ${result.site}: ERROR - ${result.error}`);
        } else {
          const icon = result.status === 'ONLINE' ? '🟢' : 
                       result.status === 'DEGRADED' ? '🟡' : '🔴';
          console.log(`  ${icon} ${result.site}: ${result.status} (${result.latency}ms) - checks every ${result.interval}s`);
        }
      });
    }

  } catch (error) {
    console.error(`❌ Failed:`, error.message);
  }

  console.log('---\n');
}

// Run immediately
runMonitoring();

// Then run every minute
setInterval(runMonitoring, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping monitoring daemon...');
  process.exit(0);
});
