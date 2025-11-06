#!/usr/bin/env node

/**
 * Cleanup script - Reset all monitoring data
 * Deletes all incidents, site checks, and resets site status
 * Run with: node scripts/cleanup-monitoring.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting cleanup...\n');

  try {
    // 1. Delete all incidents
    const deletedIncidents = await prisma.incident.deleteMany({});
    console.log(`✅ Deleted ${deletedIncidents.count} incidents`);

    // 2. Delete all site checks
    const deletedChecks = await prisma.siteCheck.deleteMany({});
    console.log(`✅ Deleted ${deletedChecks.count} site checks`);

    // 3. Reset all sites to initial state
    const updatedSites = await prisma.site.updateMany({
      data: {
        status: 'ONLINE',
        uptime: 100,
        averageLatency: 0,
        lastCheckedAt: null,
      },
    });
    console.log(`✅ Reset ${updatedSites.count} sites to initial state`);

    // 4. Show current state
    const sites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        checkInterval: true,
        enabled: true,
      },
    });

    console.log('\n📊 Current Sites:');
    sites.forEach(site => {
      console.log(`  • ${site.name} (${site.url})`);
      console.log(`    Status: ${site.status}, Uptime: ${site.uptime}%, Interval: ${site.checkInterval}s`);
      console.log(`    Enabled: ${site.enabled}`);
    });

    console.log('\n✨ Cleanup complete! Ready to start fresh monitoring.');
    console.log('💡 Run: node scripts/dev-monitor.js to start monitoring\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
