import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET - Fetch container health metrics for a site
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
    const containerName = searchParams.get('containerName');

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

    // Build query filters
    const where = {
      siteId,
      checkedAt: {
        gte: new Date(Date.now() - hours * 60 * 60 * 1000),
      },
    };

    if (containerName) {
      where.containerName = containerName;
    }

    // Fetch container health metrics
    const containers = await prisma.containerHealth.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });

    // Get unique container names
    const uniqueContainers = [...new Set(containers.map(c => c.containerName))];

    // Calculate statistics
    const statistics = containers.length > 0 ? {
      totalContainers: uniqueContainers.length,
      runningContainers: containers.filter(c => c.status === 'running').length,
      stoppedContainers: containers.filter(c => c.status === 'stopped').length,
      unhealthyContainers: containers.filter(c => c.healthStatus === 'unhealthy').length,
      healthyCount: containers.filter(c => c.healthy).length,
      unhealthyCount: containers.filter(c => !c.healthy).length,
      totalRestarts: containers.reduce((sum, c) => sum + c.restartCount, 0),
      avgCpuUsage: containers.filter(c => c.cpuUsagePercent).reduce((sum, c) => sum + c.cpuUsagePercent, 0) / containers.filter(c => c.cpuUsagePercent).length || 0,
      avgMemoryUsed: containers.filter(c => c.memoryUsedMB).reduce((sum, c) => sum + c.memoryUsedMB, 0) / containers.filter(c => c.memoryUsedMB).length || 0,
    } : null;

    // Get latest metrics per container
    const latestByContainer = {};
    uniqueContainers.forEach(name => {
      const containerMetrics = containers.filter(c => c.containerName === name);
      if (containerMetrics.length > 0) {
        latestByContainer[name] = containerMetrics[0];
      }
    });

    return NextResponse.json({
      containers,
      statistics,
      latestByContainer,
      uniqueContainers,
      total: containers.length,
    });
  } catch (error) {
    console.error('Error fetching container health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch container health' },
      { status: 500 }
    );
  }
}

// POST - Add new container health data
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
      containerId,
      containerName,
      imageName,
      imageTag,
      status,
      state,
      exitCode,
      healthStatus,
      healthChecks,
      cpuUsagePercent,
      memoryUsedMB,
      memoryLimitMB,
      networkRxMB,
      networkTxMB,
      uptime,
      restartCount = 0,
      createdAt,
      startedAt,
      alertOnUnhealthy = true,
      alertOnRestart = true,
    } = body;

    if (!containerId || !containerName || !imageName || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: containerId, containerName, imageName, status' },
        { status: 400 }
      );
    }

    // Determine health status and issues
    const issues = [];

    if (status !== 'running') {
      issues.push({
        type: 'status',
        severity: 'error',
        message: `Container is ${status}`,
      });
    }

    if (healthStatus === 'unhealthy') {
      issues.push({
        type: 'health',
        severity: 'error',
        message: 'Container health check failed',
      });
    }

    if (restartCount > 5) {
      issues.push({
        type: 'restarts',
        severity: 'warning',
        message: `Container has restarted ${restartCount} times`,
      });
    }

    if (cpuUsagePercent && cpuUsagePercent > 90) {
      issues.push({
        type: 'cpu',
        severity: 'warning',
        message: `High CPU usage: ${cpuUsagePercent.toFixed(1)}%`,
      });
    }

    if (memoryUsedMB && memoryLimitMB && (memoryUsedMB / memoryLimitMB) > 0.9) {
      issues.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${((memoryUsedMB / memoryLimitMB) * 100).toFixed(1)}%`,
      });
    }

    const healthy = issues.length === 0;

    // Create container health record
    const containerHealth = await prisma.containerHealth.create({
      data: {
        siteId,
        containerId,
        containerName,
        imageName,
        imageTag,
        status,
        state,
        exitCode,
        healthStatus,
        healthChecks,
        cpuUsagePercent,
        memoryUsedMB,
        memoryLimitMB,
        networkRxMB,
        networkTxMB,
        uptime,
        restartCount,
        createdAt: createdAt ? new Date(createdAt) : null,
        startedAt: startedAt ? new Date(startedAt) : null,
        alertOnUnhealthy,
        alertOnRestart,
        healthy,
        issues: issues.length > 0 ? issues : null,
      },
    });

    return NextResponse.json({
      message: 'Container health recorded successfully',
      containerHealth,
      healthy,
      issueCount: issues.length,
    });
  } catch (error) {
    console.error('Error recording container health:', error);
    return NextResponse.json(
      { error: 'Failed to record container health' },
      { status: 500 }
    );
  }
}
