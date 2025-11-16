import { NextResponse } from 'next/server';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import {
  checkFromMultipleRegions,
  formatRegionCheckForDB,
  calculateAverageResponseTime,
  getFastestRegion,
  getSlowestRegion,
  getOverallStatus
} from '@/lib/region-monitor';
import { HTTP_STATUS_CODES } from '@/lib/constants';
import { REGIONS, DEFAULT_REGIONS } from '@/lib/constants';

/**
 * GET /api/sites/[id]/regions
 * Get regional check history for a site
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
        regionChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 100, // Last 100 regional checks
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

    // Group checks by timestamp/session (checks within 1 minute are considered same session)
    const groupedChecks = groupChecksBySession(site.regionChecks);

    return NextResponse.json({
      history: groupedChecks,
      total: site.regionChecks.length,
    });
  } catch (error) {
    console.error('Failed to fetch regional checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regional checks' },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/sites/[id]/regions
 * Run a new multi-region check for a site
 */
export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Parse request body to get regions (optional)
    let selectedRegions = DEFAULT_REGIONS;
    try {
      const body = await request.json();
      if (body.regions && Array.isArray(body.regions)) {
        // Validate regions
        const validRegions = body.regions.filter(r => REGIONS[r]);
        if (validRegions.length > 0) {
          selectedRegions = validRegions;
        }
      }
    } catch (e) {
      // Body is optional, use default regions
    }

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

    // Run multi-region check
    console.log(`Running multi-region check for ${site.name} from regions:`, selectedRegions);
    const regionResults = await checkFromMultipleRegions(site.url, selectedRegions);

    // Save results to database
    const now = new Date();
    const checkPromises = regionResults.map(result => {
      if (!result.success) {
        console.warn(`Region check failed for ${result.region}:`, result.errorMessage);
      }

      return prisma.regionCheck.create({
        data: {
          siteId: id,
          ...formatRegionCheckForDB(result),
          checkedAt: now,
        },
      });
    });

    await Promise.all(checkPromises);

    // Calculate statistics
    const avgResponseTime = calculateAverageResponseTime(regionResults);
    const fastestRegion = getFastestRegion(regionResults);
    const slowestRegion = getSlowestRegion(regionResults);
    const overallStatus = getOverallStatus(regionResults);

    return NextResponse.json({
      success: true,
      results: regionResults,
      statistics: {
        averageResponseTime: avgResponseTime,
        fastestRegion,
        slowestRegion,
        overallStatus,
        regionsChecked: selectedRegions.length,
        successfulChecks: regionResults.filter(r => r.success).length,
      },
      checkedAt: now,
    }, { status: HTTP_STATUS_CODES.OK });

  } catch (error) {
    console.error('Failed to run multi-region check:', error);
    return NextResponse.json(
      { error: 'Failed to run multi-region check', details: error.message },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * Helper function to group regional checks by session
 * Checks within 1 minute of each other are considered part of the same session
 */
function groupChecksBySession(checks) {
  if (!checks || checks.length === 0) {
    return [];
  }

  const sessions = [];
  let currentSession = {
    timestamp: checks[0].checkedAt,
    checks: [checks[0]],
  };

  for (let i = 1; i < checks.length; i++) {
    const check = checks[i];
    const timeDiff = Math.abs(new Date(currentSession.timestamp) - new Date(check.checkedAt));
    const oneMinute = 60 * 1000;

    if (timeDiff < oneMinute) {
      // Same session
      currentSession.checks.push(check);
    } else {
      // New session
      sessions.push(currentSession);
      currentSession = {
        timestamp: check.checkedAt,
        checks: [check],
      };
    }
  }

  // Add the last session
  sessions.push(currentSession);

  return sessions;
}
