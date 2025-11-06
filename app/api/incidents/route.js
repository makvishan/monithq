import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';

// GET /api/incidents - List all incidents
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    // Build where clause
    const where = {};

    if (user.role !== 'SUPER_ADMIN') {
      // Regular users see only their org's incidents
      where.site = {
        organizationId: user.organizationId,
      };
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json({ incidents }, { status: 200 });
  } catch (error) {
    console.error('Get incidents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
