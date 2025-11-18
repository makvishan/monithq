import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET - Fetch server metrics for a site
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { id: siteId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const hours = parseInt(searchParams.get('hours') || '24');

    // Verify site belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch server metrics
    const metrics = await prisma.serverMetrics.findMany({
      where: {
        siteId,
        checkedAt: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000),
        },
      },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });

    // Calculate statistics
    const statistics = metrics.length > 0 ? {
      avgCpuUsage: metrics.reduce((sum, m) => sum + m.cpuUsagePercent, 0) / metrics.length,
      avgRamUsage: metrics.reduce((sum, m) => sum + m.ramUsagePercent, 0) / metrics.length,
      avgDiskUsage: metrics.reduce((sum, m) => sum + m.diskUsagePercent, 0) / metrics.length,
      maxCpuUsage: Math.max(...metrics.map(m => m.cpuUsagePercent)),
      maxRamUsage: Math.max(...metrics.map(m => m.ramUsagePercent)),
      maxDiskUsage: Math.max(...metrics.map(m => m.diskUsagePercent)),
      healthyCount: metrics.filter(m => m.healthy).length,
      unhealthyCount: metrics.filter(m => !m.healthy).length,
    } : null;

    // Get latest metric
    const latest = metrics.length > 0 ? metrics[0] : null;

    return NextResponse.json({
      metrics,
      statistics,
      latest,
      total: metrics.length,
    });
  } catch (error) {
    console.error('Error fetching server metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server metrics' },
      { status: 500 }
    );
  }
}

// POST - Add new server metrics data
export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { id: siteId } = await params;
    const body = await request.json();

    // Verify site belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    const {
      cpuUsagePercent,
      cpuLoadAverage,
      cpuCoreCount,
      ramUsedMB,
      ramTotalMB,
      ramUsagePercent,
      diskUsedGB,
      diskTotalGB,
      diskUsagePercent,
      cpuThreshold = 80.0,
      ramThreshold = 85.0,
      diskThreshold = 90.0,
      hostname,
      osType,
      osVersion,
    } = body;

    if (cpuUsagePercent === undefined || ramUsedMB === undefined || ramTotalMB === undefined ||
        ramUsagePercent === undefined || diskUsedGB === undefined || diskTotalGB === undefined ||
        diskUsagePercent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine health status and issues
    const issues = [];
    if (cpuUsagePercent > cpuThreshold) {
      issues.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage (${cpuUsagePercent.toFixed(1)}%) exceeds threshold (${cpuThreshold}%)`,
      });
    }
    if (ramUsagePercent > ramThreshold) {
      issues.push({
        type: 'ram',
        severity: 'warning',
        message: `RAM usage (${ramUsagePercent.toFixed(1)}%) exceeds threshold (${ramThreshold}%)`,
      });
    }
    if (diskUsagePercent > diskThreshold) {
      issues.push({
        type: 'disk',
        severity: 'warning',
        message: `Disk usage (${diskUsagePercent.toFixed(1)}%) exceeds threshold (${diskThreshold}%)`,
      });
    }

    const healthy = issues.length === 0;

    // Create server metrics record
    const metrics = await prisma.serverMetrics.create({
      data: {
        siteId,
        cpuUsagePercent,
        cpuLoadAverage,
        cpuCoreCount,
        ramUsedMB,
        ramTotalMB,
        ramUsagePercent,
        diskUsedGB,
        diskTotalGB,
        diskUsagePercent,
        cpuThreshold,
        ramThreshold,
        diskThreshold,
        hostname,
        osType,
        osVersion,
        healthy,
        issues: issues.length > 0 ? issues : null,
      },
    });

    return NextResponse.json({
      message: 'Server metrics recorded successfully',
      metrics,
      healthy,
      issueCount: issues.length,
    });
  } catch (error) {
    console.error('Error recording server metrics:', error);
    return NextResponse.json(
      { error: 'Failed to record server metrics' },
      { status: 500 }
    );
  }
}
