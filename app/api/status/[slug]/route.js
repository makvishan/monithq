import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/status/[slug] - Get public status page data
export async function GET(request, { params }) {
  try {
    const { slug } = params;

    // Get status page
    const statusPage = await prisma.statusPage.findUnique({
      where: { slug },
      include: {
        organization: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!statusPage) {
      return NextResponse.json(
        { error: 'Status page not found' },
        { status: 404 }
      );
    }

    if (!statusPage.isPublic) {
      return NextResponse.json(
        { error: 'This status page is private' },
        { status: 403 }
      );
    }

    // Get sites for this organization
    const sites = await prisma.site.findMany({
      where: {
        organizationId: statusPage.organizationId,
        enabled: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        averageLatency: true,
        lastCheckedAt: true,
        region: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get recent incidents if enabled
    let incidents = [];
    if (statusPage.showIncidents) {
      incidents = await prisma.incident.findMany({
        where: {
          site: {
            organizationId: statusPage.organizationId,
          },
        },
        include: {
          site: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        take: 10,
      });
    }

    // Calculate overall status
    const allOnline = sites.every(site => site.status === 'ONLINE');
    const anyDown = sites.some(site => site.status === 'OFFLINE');
    const anyDegraded = sites.some(site => site.status === 'DEGRADED');
    
    let overallStatus = 'operational';
    if (anyDown) {
      overallStatus = 'major_outage';
    } else if (anyDegraded) {
      overallStatus = 'degraded_performance';
    } else if (!allOnline) {
      overallStatus = 'partial_outage';
    }

    // Calculate average uptime
    const avgUptime = sites.length > 0
      ? sites.reduce((sum, site) => sum + site.uptime, 0) / sites.length
      : 100;

    return NextResponse.json({
      statusPage: {
        title: statusPage.title,
        description: statusPage.description,
        logoUrl: statusPage.logoUrl || statusPage.organization.logo,
        organizationName: statusPage.organization.name,
        showUptime: statusPage.showUptime,
        showIncidents: statusPage.showIncidents,
      },
      overallStatus,
      avgUptime,
      sites,
      incidents,
      lastUpdated: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Get public status page error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status page' },
      { status: 500 }
    );
  }
}
