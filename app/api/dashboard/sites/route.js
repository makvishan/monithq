import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET /api/dashboard/sites - Get limited sites for dashboard display
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4', 10);
    const status = searchParams.get('status'); // Optional filter: ONLINE, OFFLINE, DEGRADED, MAINTENANCE

    // Build base query filters based on user role
    const where = {
      enabled: true,
      ...(user.role === 'SUPER_ADMIN' ? {} : { organizationId: user.organizationId }),
      ...(status ? { status } : {}),
    };

    // Fetch limited sites with minimal data for dashboard cards
    const sites = await prisma.site.findMany({
      where,
      take: limit,
      orderBy: [
        { status: 'asc' }, // Show problematic sites first (OFFLINE before ONLINE)
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        lastCheckedAt: true,
        averageLatency: true,
        enabled: true,
        checkInterval: true,
        region: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            incidents: {
              where: {
                status: {
                  not: 'RESOLVED',
                },
              },
            },
          },
        },
      },
    });

    // Add computed fields for better dashboard display
    const sitesWithMetrics = sites.map(site => ({
      ...site,
      responseTime: site.averageLatency, // Alias for compatibility
      activeIncidents: site._count.incidents,
      isHealthy: site.status === 'ONLINE' && site.uptime >= 99,
      needsAttention: site.status === 'OFFLINE' || site.status === 'DEGRADED',
    }));

    return NextResponse.json({
      success: true,
      sites: sitesWithMetrics,
      total: sites.length,
      limit,
    });

  } catch (error) {
    console.error('Error fetching dashboard sites:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard sites',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
