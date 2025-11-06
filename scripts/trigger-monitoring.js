#!/usr/bin/env node

/**
 * Manual Monitoring Trigger
 * This script manually triggers monitoring checks on all sites
 */

const fetch = require('node-fetch');

async function triggerMonitoring() {
  try {
    console.log('🔍 Triggering manual monitoring check...\n');

    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET) {
      console.log('⚠️  Warning: CRON_SECRET not found in environment variables');
      console.log('   The request may be rejected if CRON_SECRET is required.\n');
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    }

    console.log(`📡 Calling: ${BASE_URL}/api/cron/monitor`);
    console.log('⏳ Please wait...\n');

    const response = await fetch(`${BASE_URL}/api/cron/monitor`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Monitoring check completed successfully!\n');
      console.log('📊 Results:');
      console.log('═══════════════════════════════════════════════════════════');
      
      if (data.results && data.results.length > 0) {
        data.results.forEach(result => {
          const statusEmoji = result.status === 'ONLINE' ? '🟢' : 
                            result.status === 'DEGRADED' ? '🟡' : '🔴';
          console.log(`${statusEmoji} ${result.siteName}`);
          console.log(`   Status: ${result.status}`);
          console.log(`   Latency: ${result.latency}ms`);
          console.log(`   Uptime: ${result.uptime}%`);
          if (result.error) {
            console.log(`   ⚠️  Error: ${result.error}`);
          }
          console.log('');
        });
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log(`✅ Checked ${data.checked || 0} sites`);
      
      if (data.incidentsCreated && data.incidentsCreated > 0) {
        console.log(`🚨 New incidents: ${data.incidentsCreated}`);
      }
      if (data.incidentsResolved && data.incidentsResolved > 0) {
        console.log(`✅ Resolved incidents: ${data.incidentsResolved}`);
      }
      
      console.log('\n🎉 Done!');
    } else {
      console.error('❌ Monitoring check failed!');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${data.error || 'Unknown error'}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error triggering monitoring:', error.message);
    process.exit(1);
  }
}

// Run the trigger
triggerMonitoring();
