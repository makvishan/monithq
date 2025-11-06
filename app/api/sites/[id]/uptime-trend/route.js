import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';

// GET /api/sites/[id]/uptime-trend - Get uptime and response time trend data
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 24h, 7d, 30d

    // Verify site access
    const site = await prisma.site.findFirst({
      where: {
        id,
        ...(user.role === 'SUPER_ADMIN' ? {} : { organizationId: user.organizationId }),
      },
      select: { id: true, organizationId: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    let groupBy = 'hour'; // How to group data points

    switch (period) {
      case '24h':
        startTime.setHours(now.getHours() - 24);
        groupBy = 'hour';
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        groupBy = 'day';
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        groupBy = 'day';
        break;
      default:
        startTime.setHours(now.getHours() - 24);
    }

    // Fetch checks within period
    const checks = await prisma.siteCheck.findMany({
      where: {
        siteId: id,
        checkedAt: {
          gte: startTime,
        },
      },
      orderBy: {
        checkedAt: 'asc',
      },
      select: {
        status: true,
        responseTime: true,
        checkedAt: true,
      },
    });

    // Group data by time period
    const groupedData = new Map();

    checks.forEach(check => {
      let key;
      const date = new Date(check.checkedAt);

      if (groupBy === 'hour') {
        // Group by hour
        key = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
      } else {
        // Group by day
        key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, {
          time: key,
          checks: [],
          onlineCount: 0,
          totalCount: 0,
          totalResponseTime: 0,
        });
      }

      const group = groupedData.get(key);
      group.checks.push(check);
      group.totalCount++;
      group.totalResponseTime += check.responseTime;
      if (check.status === 'ONLINE') {
        group.onlineCount++;
      }
    });

    // Calculate averages and format for chart
    const trendData = Array.from(groupedData.values()).map(group => ({
      time: new Date(group.time).toLocaleString('en-US', 
        groupBy === 'hour' 
          ? { month: 'short', day: 'numeric', hour: '2-digit' }
          : { month: 'short', day: 'numeric' }
      ),
      timestamp: group.time,
      avgResponseTime: group.totalCount > 0 ? Math.round(group.totalResponseTime / group.totalCount) : 0,
      uptime: group.totalCount > 0 ? ((group.onlineCount / group.totalCount) * 100).toFixed(1) : 100,
      checksCount: group.totalCount,
    }));

    // Calculate overall stats for the period
    const totalChecks = checks.length;
    const onlineChecks = checks.filter(c => c.status === 'ONLINE').length;
    const periodUptime = totalChecks > 0 ? ((onlineChecks / totalChecks) * 100).toFixed(2) : 100;
    const avgResponseTime = totalChecks > 0 
      ? Math.round(checks.reduce((sum, c) => sum + c.responseTime, 0) / totalChecks)
      : 0;

    return NextResponse.json({
      success: true,
      period,
      groupBy,
      stats: {
        periodUptime: parseFloat(periodUptime),
        avgResponseTime,
        totalChecks,
        onlineChecks,
        offlineChecks: totalChecks - onlineChecks,
      },
      trendData,
    });

  } catch (error) {
    console.error('Error fetching uptime trend:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch uptime trend',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
