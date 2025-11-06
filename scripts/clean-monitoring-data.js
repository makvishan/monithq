#!/usr/bin/env node

/**
 * Clean Monitoring Data Script
 * This script removes all incidents and site checks to start fresh
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanMonitoringData() {
  try {
    console.log('🧹 Starting monitoring data cleanup...\n');

    // 1. Delete all incidents
    console.log('📋 Deleting all incidents...');
    const deletedIncidents = await prisma.incident.deleteMany({});
    console.log(`   ✅ Deleted ${deletedIncidents.count} incidents\n`);

    // 2. Delete all site checks
    console.log('📊 Deleting all site check history...');
    const deletedChecks = await prisma.siteCheck.deleteMany({});
    console.log(`   ✅ Deleted ${deletedChecks.count} site checks\n`);

    // 3. Reset all sites to ONLINE status with 100% uptime
    console.log('🔄 Resetting all sites to default state...');
    const sites = await prisma.site.findMany({
      select: { id: true, name: true, status: true, uptime: true }
    });

    for (const site of sites) {
      await prisma.site.update({
        where: { id: site.id },
        data: {
          status: 'ONLINE',
          uptime: 100,
          averageLatency: 0,
          lastCheckedAt: new Date(),
        },
      });
      console.log(`   ✅ Reset: ${site.name}`);
    }
    console.log(`\n   Total sites reset: ${sites.length}\n`);

    // 4. Get summary
    const summary = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        enabled: true,
      },
    });

    console.log('📊 Current Site Status:');
    console.log('═══════════════════════════════════════════════════════════');
    summary.forEach(site => {
      const statusEmoji = site.enabled ? '🟢' : '🔴';
      console.log(`${statusEmoji} ${site.name}`);
      console.log(`   URL: ${site.url}`);
      console.log(`   Status: ${site.status} | Uptime: ${site.uptime}% | Enabled: ${site.enabled}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Cleanup complete!\n');
    console.log('📝 Summary:');
    console.log(`   • ${deletedIncidents.count} incidents removed`);
    console.log(`   • ${deletedChecks.count} site checks removed`);
    console.log(`   • ${sites.length} sites reset to ONLINE (100% uptime)`);
    console.log('\n🚀 Ready for fresh monitoring!');
    console.log('💡 The cron job will start monitoring sites automatically.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanMonitoringData()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
