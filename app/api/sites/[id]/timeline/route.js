import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';
import { SITE_STATUS, USER_ROLES } from '@/lib/constants';

// GET /api/sites/[id]/timeline - Get 24-hour status timeline
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h'; // 24h, 7d

    // Verify site access
    const site = await prisma.site.findFirst({
      where: {
        id,
        ...(user.role === USER_ROLES.SUPER_ADMIN ? {} : { organizationId: user.organizationId }),
      },
      select: { id: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    let intervalMinutes = 60; // Default hourly buckets

    switch (period) {
      case '24h':
        startTime.setHours(now.getHours() - 24);
        intervalMinutes = 60; // 1 hour buckets = 24 points
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        intervalMinutes = 360; // 6 hour buckets = 28 points
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
        checkedAt: true,
      },
    });

    // Create time buckets
    const buckets = [];
    let currentTime = new Date(startTime);
    const intervalMs = intervalMinutes * 60 * 1000;

    while (currentTime <= now) {
      buckets.push({
        time: new Date(currentTime).toISOString(),
        status: null,
        checksInBucket: [],
      });
      currentTime = new Date(currentTime.getTime() + intervalMs);
    }

    // Assign checks to buckets
    checks.forEach(check => {
      const checkTime = new Date(check.checkedAt).getTime();
      const bucketIndex = Math.floor((checkTime - startTime.getTime()) / intervalMs);
      
      if (bucketIndex >= 0 && bucketIndex < buckets.length) {
        buckets[bucketIndex].checksInBucket.push(check);
      }
    });

    // Determine status for each bucket (most common status, or last check status)
    // First pass: calculate status for buckets with checks
    const timeline = buckets.map((bucket, index) => {
      let status = SITE_STATUS.UNKNOWN;
      
      if (bucket.checksInBucket.length > 0) {
        // Use the most recent status in the bucket
        status = bucket.checksInBucket[bucket.checksInBucket.length - 1].status;
      }

      return {
        time: new Date(bucket.time).toLocaleString('en-US', 
          period === '24h'
            ? { month: 'short', day: 'numeric', hour: '2-digit' }
            : { month: 'short', day: 'numeric' }
        ),
        timestamp: bucket.time,
        status,
        checksCount: bucket.checksInBucket.length,
      };
    });

    // Second pass: fill in UNKNOWN statuses with previous bucket's status
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].status === SITE_STATUS.UNKNOWN && timeline[i - 1].status !== SITE_STATUS.UNKNOWN) {
        timeline[i].status = timeline[i - 1].status;
      }
    }

    // Calculate uptime for the period
    const totalBuckets = timeline.length;
    const onlineBuckets = timeline.filter(t => t.status === SITE_STATUS.ONLINE).length;
    const uptime = totalBuckets > 0 ? ((onlineBuckets / totalBuckets) * 100).toFixed(2) : 100;

    return NextResponse.json({
      success: true,
      period,
      intervalMinutes,
      stats: {
        uptime: parseFloat(uptime),
        totalBuckets,
        onlineBuckets,
        totalChecks: checks.length,
      },
      timeline,
    });

  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch timeline',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
