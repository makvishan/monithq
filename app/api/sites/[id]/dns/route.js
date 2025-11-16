/**
 * DNS Monitoring API Endpoint
 *
 * Endpoints:
 * - GET: Retrieve DNS check history
 * - POST: Run new DNS check
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import {
  performDnsCheck,
  formatDnsCheckForDB,
  getDnsStatistics,
  detectDnsChanges,
} from '@/lib/dns-monitor';

/**
 * GET - Retrieve DNS check history
 */
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const includeUnchanged = searchParams.get('includeUnchanged') === 'true';

    // Build query filter
    const where = {
      siteId: id,
    };

    // Filter to only changed records if requested
    if (!includeUnchanged) {
      where.changesDetected = true;
    }

    // Fetch DNS check history
    const dnsChecks = await prisma.dnsCheck.findMany({
      where,
      orderBy: {
        checkedAt: 'desc',
      },
      take: limit,
    });

    // Get latest check for current state
    const latestCheck = await prisma.dnsCheck.findFirst({
      where: { siteId: id },
      orderBy: { checkedAt: 'desc' },
    });

    // Calculate statistics if we have a latest check
    let statistics = null;
    if (latestCheck) {
      statistics = getDnsStatistics(latestCheck);
    }

    return NextResponse.json({
      success: true,
      checks: dnsChecks,
      latest: latestCheck,
      statistics,
      count: dnsChecks.length,
    });
  } catch (error) {
    console.error('DNS history fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNS history' },
      { status: 500 }
    );
  }
}

/**
 * POST - Run new DNS check
 */
export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Get the most recent DNS check for comparison
    const previousCheck = await prisma.dnsCheck.findFirst({
      where: { siteId: id },
      orderBy: { checkedAt: 'desc' },
    });

    // Perform DNS check
    console.log(`Running DNS check for ${site.url}...`);
    const dnsResults = await performDnsCheck(site.url);

    // Format for database storage
    const dnsCheckData = formatDnsCheckForDB(dnsResults, previousCheck);

    // Save to database
    const dnsCheck = await prisma.dnsCheck.create({
      data: {
        siteId: id,
        ...dnsCheckData,
      },
    });

    // Calculate statistics
    const statistics = getDnsStatistics(dnsResults);

    // Detect changes if there was a previous check
    let changeDetection = { hasChanges: false, changes: [] };
    if (previousCheck) {
      changeDetection = detectDnsChanges(dnsResults, previousCheck);
    }

    return NextResponse.json({
      success: true,
      check: dnsCheck,
      statistics,
      changeDetection,
    });
  } catch (error) {
    console.error('DNS check failed:', error);
    return NextResponse.json(
      { error: error.message || 'DNS check failed' },
      { status: 500 }
    );
  }
}
