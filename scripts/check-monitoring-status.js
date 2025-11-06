#!/usr/bin/env node

/**
 * Monitor Status Check
 * Quick status check to verify monitoring is working
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    console.log('🔍 Checking monitoring status...\n');

    // 1. Check sites
    const sites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        enabled: true,
        lastCheckedAt: true,
        _count: {
          select: {
            incidents: true,
          },
        },
      },
    });

    console.log('📊 Sites Status:');
    console.log('═══════════════════════════════════════════════════════════');
    sites.forEach(site => {
      const statusEmoji = site.status === 'ONLINE' ? '🟢' : 
                         site.status === 'DEGRADED' ? '🟡' : '🔴';
      const enabledEmoji = site.enabled ? '✅' : '❌';
      
      console.log(`${statusEmoji} ${site.name} ${enabledEmoji}`);
      console.log(`   Status: ${site.status} | Uptime: ${site.uptime.toFixed(2)}%`);
      console.log(`   Last Check: ${site.lastCheckedAt ? site.lastCheckedAt.toLocaleString() : 'Never'}`);
      console.log(`   Incidents: ${site._count.incidents}`);
      console.log('');
    });

    // 2. Check recent site checks
    const recentChecks = await prisma.siteCheck.findMany({
      take: 10,
      orderBy: {
        checkedAt: 'desc',
      },
      include: {
        site: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🕐 Recent Checks (last 10):');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (recentChecks.length === 0) {
      console.log('   ⚠️  No checks found yet. Waiting for first cron run...\n');
    } else {
      recentChecks.forEach((check, index) => {
        const statusEmoji = check.status === 'ONLINE' ? '🟢' : 
                           check.status === 'DEGRADED' ? '🟡' : '🔴';
        console.log(`${index + 1}. ${statusEmoji} ${check.site.name}`);
        console.log(`   Time: ${check.checkedAt.toLocaleString()}`);
        console.log(`   Response: ${check.responseTime}ms`);
        if (check.errorMessage) {
          console.log(`   Error: ${check.errorMessage}`);
        }
        console.log('');
      });
    }

    // 3. Check incidents
    const openIncidents = await prisma.incident.findMany({
      where: {
        status: {
          not: 'RESOLVED',
        },
      },
      include: {
        site: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🚨 Open Incidents: ${openIncidents.length}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (openIncidents.length === 0) {
      console.log('   ✅ No open incidents - All systems operational!\n');
    } else {
      openIncidents.forEach((incident, index) => {
        const severityEmoji = incident.severity === 'CRITICAL' ? '🔴' :
                             incident.severity === 'HIGH' ? '🟠' :
                             incident.severity === 'MEDIUM' ? '🟡' : '🔵';
        console.log(`${index + 1}. ${severityEmoji} ${incident.site.name}`);
        console.log(`   Severity: ${incident.severity} | Status: ${incident.status}`);
        console.log(`   Started: ${incident.startTime.toLocaleString()}`);
        console.log(`   Summary: ${incident.aiSummary}`);
        console.log('');
      });
    }

    // 4. Check statistics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalChecks, onlineChecks, checks24h] = await Promise.all([
      prisma.siteCheck.count(),
      prisma.siteCheck.count({
        where: {
          status: 'ONLINE',
        },
      }),
      prisma.siteCheck.count({
        where: {
          checkedAt: {
            gte: last24h,
          },
        },
      }),
    ]);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📈 Statistics:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   Online Checks: ${onlineChecks} (${totalChecks > 0 ? ((onlineChecks/totalChecks)*100).toFixed(2) : 0}%)`);
    console.log(`   Checks (24h): ${checks24h}`);
    console.log(`   Enabled Sites: ${sites.filter(s => s.enabled).length}/${sites.length}`);
    console.log(`   Open Incidents: ${openIncidents.length}`);
    console.log('');

    // 5. Status summary
    console.log('═══════════════════════════════════════════════════════════');
    
    if (totalChecks === 0) {
      console.log('⏳ Monitoring Status: WAITING FOR FIRST CHECK');
      console.log('   💡 Run: node scripts/trigger-monitoring.js');
    } else if (checks24h < sites.filter(s => s.enabled).length * 10) {
      console.log('⚠️  Monitoring Status: WARMING UP');
      console.log('   💡 Collecting initial data... (< 10 checks per site)');
    } else {
      console.log('✅ Monitoring Status: ACTIVE');
      console.log('   💡 All systems running normally');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error checking status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkStatus()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
