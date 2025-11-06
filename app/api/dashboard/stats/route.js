import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET /api/dashboard/stats - Get aggregated dashboard statistics
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d

    // Calculate time threshold based on range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeRange) {
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 24);
    }

    // Build base query filters based on user role
    const baseFilter = user.role === 'SUPER_ADMIN' 
      ? {} 
      : { organizationId: user.organizationId };

    // 1. Get total sites count and status breakdown
    const [totalSites, sitesByStatus] = await Promise.all([
      prisma.site.count({
        where: {
          ...baseFilter,
          enabled: true,
        },
      }),
      prisma.site.groupBy({
        by: ['status'],
        where: {
          ...baseFilter,
          enabled: true,
        },
        _count: true,
      }),
    ]);

    // 2. Calculate average uptime across all sites
    const sites = await prisma.site.findMany({
      where: {
        ...baseFilter,
        enabled: true,
      },
      select: {
        uptime: true,
      },
    });

    const avgUptime = sites.length > 0
      ? (sites.reduce((acc, site) => acc + (site.uptime || 0), 0) / sites.length)
      : 100;

    // 3. Get active incidents count (not resolved)
    const activeIncidentsCount = await prisma.incident.count({
      where: {
        site: baseFilter.organizationId 
          ? { organizationId: baseFilter.organizationId }
          : undefined,
        status: {
          not: 'RESOLVED',
        },
      },
    });

    // 4. Get recent incidents count (within time range)
    const recentIncidentsCount = await prisma.incident.count({
      where: {
        site: baseFilter.organizationId 
          ? { organizationId: baseFilter.organizationId }
          : undefined,
        startTime: {
          gte: startTime,
        },
      },
    });

    // 5. Get resolved incidents in time range (for trend)
    const resolvedIncidentsCount = await prisma.incident.count({
      where: {
        site: baseFilter.organizationId 
          ? { organizationId: baseFilter.organizationId }
          : undefined,
        status: 'RESOLVED',
        endTime: {
          gte: startTime,
        },
      },
    });

    // 6. Calculate average response time
    const recentChecks = await prisma.siteCheck.findMany({
      where: {
        site: baseFilter.organizationId 
          ? { organizationId: baseFilter.organizationId }
          : undefined,
        checkedAt: {
          gte: startTime,
        },
        status: 'ONLINE',
      },
      select: {
        responseTime: true,
      },
    });

    const avgResponseTime = recentChecks.length > 0
      ? Math.round(recentChecks.reduce((acc, check) => acc + check.responseTime, 0) / recentChecks.length)
      : 0;

    // 7. Get checks count for the period
    const totalChecks = await prisma.siteCheck.count({
      where: {
        site: baseFilter.organizationId 
          ? { organizationId: baseFilter.organizationId }
          : undefined,
        checkedAt: {
          gte: startTime,
        },
      },
    });

    const successfulChecks = await prisma.siteCheck.count({
      where: {
        site: baseFilter.organizationId 
          ? { organizationId: baseFilter.organizationId }
          : undefined,
        checkedAt: {
          gte: startTime,
        },
        status: 'ONLINE',
      },
    });

    // 8. Calculate uptime percentage for the period
    const periodUptime = totalChecks > 0
      ? ((successfulChecks / totalChecks) * 100)
      : 100;

    // 9. Get sites with issues (OFFLINE or DEGRADED)
    const sitesWithIssues = sitesByStatus
      .filter(s => s.status === 'OFFLINE' || s.status === 'DEGRADED')
      .reduce((acc, s) => acc + s._count, 0);

    // 10. Format status breakdown
    const statusBreakdown = {
      online: sitesByStatus.find(s => s.status === 'ONLINE')?._count || 0,
      offline: sitesByStatus.find(s => s.status === 'OFFLINE')?._count || 0,
      degraded: sitesByStatus.find(s => s.status === 'DEGRADED')?._count || 0,
      maintenance: sitesByStatus.find(s => s.status === 'MAINTENANCE')?._count || 0,
    };

    // 11. Calculate trends (compare with previous period)
    const previousStartTime = new Date(startTime);
    
    switch (timeRange) {
      case '24h':
        previousStartTime.setHours(previousStartTime.getHours() - 24);
        break;
      case '7d':
        previousStartTime.setDate(previousStartTime.getDate() - 7);
        break;
      case '30d':
        previousStartTime.setDate(previousStartTime.getDate() - 30);
        break;
    }

    const previousIncidentsCount = await prisma.incident.count({
      where: {
        site: baseFilter.organizationId 
          ? { organizationId: baseFilter.organizationId }
          : undefined,
        startTime: {
          gte: previousStartTime,
          lt: startTime,
        },
      },
    });

    const incidentsTrend = previousIncidentsCount > 0
      ? (((recentIncidentsCount - previousIncidentsCount) / previousIncidentsCount) * 100)
      : 0;

    // Return aggregated stats
    return NextResponse.json({
      success: true,
      timeRange,
      stats: {
        // Site stats
        totalSites,
        onlineSites: statusBreakdown.online,
        offlineSites: statusBreakdown.offline,
        degradedSites: statusBreakdown.degraded,
        maintenanceSites: statusBreakdown.maintenance,
        sitesWithIssues,
        
        // Uptime stats
        avgUptime: Math.round(avgUptime * 100) / 100,
        periodUptime: Math.round(periodUptime * 100) / 100,
        
        // Performance stats
        avgResponseTime,
        totalChecks,
        successfulChecks,
        failedChecks: totalChecks - successfulChecks,
        
        // Incident stats
        activeIncidents: activeIncidentsCount,
        recentIncidents: recentIncidentsCount,
        resolvedIncidents: resolvedIncidentsCount,
        incidentsTrend: Math.round(incidentsTrend * 100) / 100,
        
        // Breakdown
        statusBreakdown,
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
