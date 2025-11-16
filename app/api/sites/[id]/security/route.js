import { NextResponse } from 'next/server';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { checkSecurityHeaders, formatSecurityCheckForDB } from '@/lib/security-headers';
import { HTTP_STATUS_CODES, USER_ROLES } from '@/lib/constants';

/**
 * GET /api/sites/[id]/security
 * Get security check history for a site
 */
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Get the site and verify access
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        organization: true,
        securityChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 30, // Last 30 checks
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: HTTP_STATUS_CODES.NOT_FOUND }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, site.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: HTTP_STATUS_CODES.FORBIDDEN }
      );
    }

    return NextResponse.json({
      currentScore: site.securityScore,
      lastChecked: site.lastSecurityCheck,
      history: site.securityChecks,
    });
  } catch (error) {
    console.error('Failed to fetch security checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security checks' },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/sites/[id]/security
 * Run a new security check for a site
 */
export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Get the site and verify access
    const site = await prisma.site.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: HTTP_STATUS_CODES.NOT_FOUND }
      );
    }

    // Check access
    const hasAccess = await checkOrganizationAccess(user, site.organizationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: HTTP_STATUS_CODES.FORBIDDEN }
      );
    }

    // Run security check
    const checkResults = await checkSecurityHeaders(site.url);

    if (!checkResults.success) {
      return NextResponse.json(
        {
          error: 'Security check failed',
          details: checkResults.error,
        },
        { status: HTTP_STATUS_CODES.BAD_REQUEST }
      );
    }

    // Format for database
    const dbData = formatSecurityCheckForDB(checkResults);

    // Save security check to database
    const securityCheck = await prisma.securityCheck.create({
      data: {
        siteId: id,
        ...dbData,
      },
    });

    // Update site's current security score
    await prisma.site.update({
      where: { id },
      data: {
        securityScore: dbData.securityScore,
        lastSecurityCheck: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      check: securityCheck,
      score: dbData.securityScore,
      grade: dbData.grade,
      issues: dbData.issues,
      recommendations: dbData.recommendations,
    });
  } catch (error) {
    console.error('Failed to run security check:', error);
    return NextResponse.json(
      { error: 'Failed to run security check', details: error.message },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}
