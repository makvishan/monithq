import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';
import { RESPONSE_TIME_RANGES } from '@/lib/constants';

// GET /api/sites/[id]/distributions - Get status and response time distributions
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify site access
    const site = await prisma.site.findFirst({
      where: {
        id,
        ...(user.role === 'SUPER_ADMIN' ? {} : { organizationId: user.organizationId }),
      },
      select: { id: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Fetch recent checks for distribution analysis
    const checks = await prisma.siteCheck.findMany({
      where: { siteId: id },
      orderBy: { checkedAt: 'desc' },
      take: limit,
      select: {
        status: true,
        responseTime: true,
      },
    });

    // Calculate status distribution
    const statusCounts = {
      ONLINE: 0,
      OFFLINE: 0,
      DEGRADED: 0,
    };

    checks.forEach(check => {
      if (statusCounts.hasOwnProperty(check.status)) {
        statusCounts[check.status]++;
      }
    });

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0) + status.slice(1).toLowerCase(),
      value: count,
      percentage: checks.length > 0 ? ((count / checks.length) * 100).toFixed(1) : 0,
    }));

    // Calculate response time distribution (buckets)
    const responseTimeBuckets = {
      [RESPONSE_TIME_RANGES.FAST.label]: 0,
      [RESPONSE_TIME_RANGES.NORMAL.label]: 0,
      [RESPONSE_TIME_RANGES.SLOW.label]: 0,
      [RESPONSE_TIME_RANGES.VERY_SLOW.label]: 0,
    };

    checks.forEach(check => {
      const rt = check.responseTime;
      if (rt < RESPONSE_TIME_RANGES.FAST.max) {
        responseTimeBuckets[RESPONSE_TIME_RANGES.FAST.label]++;
      } else if (rt < RESPONSE_TIME_RANGES.NORMAL.max) {
        responseTimeBuckets[RESPONSE_TIME_RANGES.NORMAL.label]++;
      } else if (rt < RESPONSE_TIME_RANGES.SLOW.max) {
        responseTimeBuckets[RESPONSE_TIME_RANGES.SLOW.label]++;
      } else {
        responseTimeBuckets[RESPONSE_TIME_RANGES.VERY_SLOW.label]++;
      }
    });

    const responseTimeDistribution = Object.entries(responseTimeBuckets).map(([range, count]) => ({
      name: range,
      value: count,
      percentage: checks.length > 0 ? ((count / checks.length) * 100).toFixed(1) : 0,
    }));

    // Calculate stats
    const avgResponseTime = checks.length > 0
      ? Math.round(checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length)
      : 0;

    const minResponseTime = checks.length > 0
      ? Math.min(...checks.map(c => c.responseTime))
      : 0;

    const maxResponseTime = checks.length > 0
      ? Math.max(...checks.map(c => c.responseTime))
      : 0;

    return NextResponse.json({
      success: true,
      checksAnalyzed: checks.length,
      statusDistribution,
      responseTimeDistribution,
      stats: {
        avgResponseTime,
        minResponseTime,
        maxResponseTime,
      },
    });

  } catch (error) {
    console.error('Error fetching distributions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch distributions',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
