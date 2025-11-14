import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';

// GET /api/sites/[id]/summary - Get site summary (card + basic stats)
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Fetch site with minimal data
    const site = await prisma.site.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        checkInterval: true,
        averageLatency: true,
        lastCheckedAt: true,
        region: true,
        enabled: true,
        createdAt: true,
        // SSL Certificate fields
        sslMonitoringEnabled: true,
        sslExpiryDate: true,
        sslIssuer: true,
        sslValidFrom: true,
        sslDaysRemaining: true,
        sslLastChecked: true,
        sslCertificateValid: true,
        sslAlertThreshold: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            incidents: {
              where: { status: { not: 'RESOLVED' } },
            },
            checks: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, site.organization.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get last check for status info
    const lastCheck = await prisma.siteCheck.findFirst({
      where: { siteId: id },
      orderBy: { checkedAt: 'desc' },
      select: {
        status: true,
        responseTime: true,
        statusCode: true,
        checkedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      site: {
        ...site,
        lastChecked: site.lastCheckedAt,
        activeIncidents: site._count.incidents,
        totalChecks: site._count.checks,
        lastCheck,
      },
    });

  } catch (error) {
    console.error('Error fetching site summary:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch site summary',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
