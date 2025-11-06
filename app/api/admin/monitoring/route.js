import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/api-middleware';

// GET /api/admin/monitoring - Get all sites monitoring data across all organizations
export async function GET(request) {
  try {
    const user = await requireSuperAdmin(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const region = searchParams.get('region');

    const where = {};
    if (status) where.status = status;
    if (region) where.region = region;

    const sites = await prisma.site.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            incidents: true,
            checks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get stats
    const stats = {
      total: await prisma.site.count(),
      online: await prisma.site.count({ where: { status: 'ONLINE' } }),
      offline: await prisma.site.count({ where: { status: 'OFFLINE' } }),
      degraded: await prisma.site.count({ where: { status: 'DEGRADED' } }),
      maintenance: await prisma.site.count({ where: { status: 'MAINTENANCE' } }),
    };

    // Get recent incidents count
    const recentIncidents = await prisma.incident.count({
      where: {
        startTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    stats.recentIncidents = recentIncidents;

    return NextResponse.json({ 
      sites,
      stats,
    }, { status: 200 });
  } catch (error) {
    console.error('Get monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}
