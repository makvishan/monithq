import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET /api/dashboard/charts - Get chart data for dashboard
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause based on user role
    const siteWhere = user.role === 'SUPER_ADMIN' 
      ? {}
      : { organizationId: user.organizationId };

    // Get all sites for the user
    const sites = await prisma.site.findMany({
      where: siteWhere,
      select: { id: true },
    });

    const siteIds = sites.map(s => s.id);

    if (siteIds.length === 0) {
      // No sites, return empty data
      return NextResponse.json({
        chartData: Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          return {
            date: date.toISOString().split('T')[0],
            uptime: 100,
            responseTime: 0,
            checks: 0,
          };
        }),
      });
    }

    // Get site checks for the date range
    const checks = await prisma.siteCheck.findMany({
      where: {
        siteId: { in: siteIds },
        checkedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        checkedAt: true,
        responseTime: true,
        status: true,
      },
      orderBy: {
        checkedAt: 'asc',
      },
    });

    // Group checks by day and calculate metrics
    const dailyData = {};
    
    checks.forEach(check => {
      const date = check.checkedAt.toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          totalChecks: 0,
          successfulChecks: 0,
          totalResponseTime: 0,
          avgResponseTime: 0,
          uptime: 100,
        };
      }

      dailyData[date].totalChecks++;
      if (check.status === 'ONLINE') {
        dailyData[date].successfulChecks++;
      }
      if (check.responseTime) {
        dailyData[date].totalResponseTime += check.responseTime;
      }
    });

    // Calculate averages and fill in missing days
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      if (dailyData[dateStr]) {
        const data = dailyData[dateStr];
        data.uptime = data.totalChecks > 0 
          ? parseFloat(((data.successfulChecks / data.totalChecks) * 100).toFixed(2))
          : 100;
        data.avgResponseTime = data.totalChecks > 0 
          ? Math.round(data.totalResponseTime / data.totalChecks)
          : 0;
        
        chartData.push({
          date: dateStr,
          uptime: data.uptime,
          responseTime: data.avgResponseTime,
          checks: data.totalChecks,
        });
      } else {
        // No checks for this day
        chartData.push({
          date: dateStr,
          uptime: 100,
          responseTime: 0,
          checks: 0,
        });
      }
    }

    return NextResponse.json({ chartData });
  } catch (error) {
    console.error('Get chart data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
