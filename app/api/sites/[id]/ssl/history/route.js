import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';

/**
 * GET /api/sites/[id]/ssl/history
 * Get historical SSL certificate checks for a site
 */
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get the site
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, site.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get SSL check history
    const sslChecks = await prisma.sSLCheck.findMany({
      where: {
        siteId: id
      },
      orderBy: {
        checkedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.sSLCheck.count({
      where: {
        siteId: id
      }
    });

    // Analyze certificate changes
    const certificateChanges = [];
    for (let i = 0; i < sslChecks.length - 1; i++) {
      const current = sslChecks[i];
      const previous = sslChecks[i + 1];

      // Detect certificate renewal
      if (current.serialNumber !== previous.serialNumber && current.valid && previous.valid) {
        certificateChanges.push({
          type: 'renewal',
          date: current.checkedAt,
          from: {
            serialNumber: previous.serialNumber,
            validTo: previous.validTo,
            issuer: previous.issuer
          },
          to: {
            serialNumber: current.serialNumber,
            validTo: current.validTo,
            issuer: current.issuer
          }
        });
      }

      // Detect validity change
      if (current.valid !== previous.valid) {
        certificateChanges.push({
          type: current.valid ? 'became_valid' : 'became_invalid',
          date: current.checkedAt,
          details: current.valid ? null : current.errorMessage
        });
      }
    }

    return NextResponse.json({
      success: true,
      sslChecks,
      certificateChanges,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching SSL history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SSL check history' },
      { status: 500 }
    );
  }
}
