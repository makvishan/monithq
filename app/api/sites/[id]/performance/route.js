/**
 * Performance Monitoring API Endpoint
 *
 * Endpoints:
 * - GET: Retrieve performance check history
 * - POST: Run new performance check
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import {
  performPerformanceCheck,
  formatPerformanceCheckForDB,
  getPerformanceStatistics,
  analyzePerformanceTrend,
} from '@/lib/performance-monitor';

/**
 * GET - Retrieve performance check history
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

    // Fetch performance check history
    const performanceChecks = await prisma.performanceCheck.findMany({
      where: { siteId: id },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });

    // Get latest check for current state
    const latestCheck = performanceChecks[0] || null;

    // Calculate statistics if we have a latest check
    let statistics = null;
    if (latestCheck) {
      statistics = getPerformanceStatistics(latestCheck);
    }

    // Analyze performance trend
    const trend = analyzePerformanceTrend(performanceChecks);

    return NextResponse.json({
      success: true,
      checks: performanceChecks,
      latest: latestCheck,
      statistics,
      trend,
      count: performanceChecks.length,
    });
  } catch (error) {
    console.error('Performance history fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance history' },
      { status: 500 }
    );
  }
}

/**
 * POST - Run new performance check
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

    // Perform performance check
    console.log(`Running performance check for ${site.url}...`);
    const performanceResults = await performPerformanceCheck(site.url);

    // Format for database storage
    const performanceCheckData = formatPerformanceCheckForDB(performanceResults);

    // Save to database
    const performanceCheck = await prisma.performanceCheck.create({
      data: {
        siteId: id,
        ...performanceCheckData,
      },
    });

    // Calculate statistics
    const statistics = getPerformanceStatistics(performanceResults);

    // Get recent checks for trend analysis
    const recentChecks = await prisma.performanceCheck.findMany({
      where: { siteId: id },
      orderBy: { checkedAt: 'desc' },
      take: 10,
    });

    const trend = analyzePerformanceTrend(recentChecks);

    return NextResponse.json({
      success: true,
      check: performanceCheck,
      statistics,
      trend,
    });
  } catch (error) {
    console.error('Performance check failed:', error);
    return NextResponse.json(
      { error: error.message || 'Performance check failed' },
      { status: 500 }
    );
  }
}
