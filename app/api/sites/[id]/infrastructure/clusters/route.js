import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET - Fetch cluster metrics for a site
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
    const clusterName = searchParams.get('clusterName');
    const namespace = searchParams.get('namespace');

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

    if (clusterName) {
      where.clusterName = clusterName;
    }

    if (namespace) {
      where.namespace = namespace;
    }

    // Fetch cluster metrics
    const clusters = await prisma.clusterMetrics.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });

    // Get unique cluster names
    const uniqueClusters = [...new Set(clusters.map(c => c.clusterName))];

    // Calculate statistics
    const statistics = clusters.length > 0 ? {
      totalClusters: uniqueClusters.length,
      healthyClusters: clusters.filter(c => c.healthStatus === 'healthy').length,
      degradedClusters: clusters.filter(c => c.healthStatus === 'degraded').length,
      criticalClusters: clusters.filter(c => c.healthStatus === 'critical').length,
      totalNodes: clusters.reduce((sum, c) => sum + c.nodeCount, 0) / clusters.length || 0,
      totalPods: clusters.reduce((sum, c) => sum + c.podCount, 0) / clusters.length || 0,
      avgNodesReady: clusters.reduce((sum, c) => sum + c.nodesReady, 0) / clusters.length || 0,
      avgPodsRunning: clusters.reduce((sum, c) => sum + c.podsRunning, 0) / clusters.length || 0,
      healthyCount: clusters.filter(c => c.healthy).length,
      unhealthyCount: clusters.filter(c => !c.healthy).length,
    } : null;

    // Get latest metrics per cluster
    const latestByCluster = {};
    uniqueClusters.forEach(name => {
      const clusterMetrics = clusters.filter(c => c.clusterName === name);
      if (clusterMetrics.length > 0) {
        latestByCluster[name] = clusterMetrics[0];
      }
    });

    return NextResponse.json({
      clusters,
      statistics,
      latestByCluster,
      uniqueClusters,
      total: clusters.length,
    });
  } catch (error) {
    console.error('Error fetching cluster metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cluster metrics' },
      { status: 500 }
    );
  }
}

// POST - Add new cluster metrics data
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
      clusterName,
      namespace,
      nodeCount,
      nodesReady,
      nodesNotReady = 0,
      podCount,
      podsRunning,
      podsPending = 0,
      podsFailed = 0,
      cpuRequestPercent,
      cpuLimitPercent,
      memRequestPercent,
      memLimitPercent,
      healthStatus = 'healthy',
      componentStatus,
      deploymentCount,
      serviceCount,
      ingressCount,
      pvcCount,
      warningEvents,
      errorEvents,
      nodeReadyThreshold = 80.0,
      podRunningThreshold = 90.0,
    } = body;

    if (!clusterName || nodeCount === undefined || nodesReady === undefined ||
        podCount === undefined || podsRunning === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: clusterName, nodeCount, nodesReady, podCount, podsRunning' },
        { status: 400 }
      );
    }

    // Determine health status and issues
    const issues = [];

    const nodeReadyPercent = (nodesReady / nodeCount) * 100;
    if (nodeReadyPercent < nodeReadyThreshold) {
      issues.push({
        type: 'nodes',
        severity: 'error',
        message: `Only ${nodeReadyPercent.toFixed(1)}% of nodes are ready (threshold: ${nodeReadyThreshold}%)`,
      });
    }

    const podRunningPercent = (podsRunning / podCount) * 100;
    if (podRunningPercent < podRunningThreshold) {
      issues.push({
        type: 'pods',
        severity: 'warning',
        message: `Only ${podRunningPercent.toFixed(1)}% of pods are running (threshold: ${podRunningThreshold}%)`,
      });
    }

    if (podsFailed > 0) {
      issues.push({
        type: 'pods',
        severity: 'error',
        message: `${podsFailed} pod(s) have failed`,
      });
    }

    if (cpuLimitPercent && cpuLimitPercent > 90) {
      issues.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU limit usage is high: ${cpuLimitPercent.toFixed(1)}%`,
      });
    }

    if (memLimitPercent && memLimitPercent > 90) {
      issues.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory limit usage is high: ${memLimitPercent.toFixed(1)}%`,
      });
    }

    if (errorEvents && Array.isArray(errorEvents) && errorEvents.length > 0) {
      issues.push({
        type: 'events',
        severity: 'error',
        message: `${errorEvents.length} error event(s) detected`,
      });
    }

    const healthy = issues.length === 0;

    // Create cluster metrics record
    const clusterMetrics = await prisma.clusterMetrics.create({
      data: {
        siteId,
        clusterName,
        namespace,
        nodeCount,
        nodesReady,
        nodesNotReady,
        podCount,
        podsRunning,
        podsPending,
        podsFailed,
        cpuRequestPercent,
        cpuLimitPercent,
        memRequestPercent,
        memLimitPercent,
        healthStatus,
        componentStatus,
        deploymentCount,
        serviceCount,
        ingressCount,
        pvcCount,
        warningEvents,
        errorEvents,
        nodeReadyThreshold,
        podRunningThreshold,
        healthy,
        issues: issues.length > 0 ? issues : null,
      },
    });

    return NextResponse.json({
      message: 'Cluster metrics recorded successfully',
      clusterMetrics,
      healthy,
      issueCount: issues.length,
    });
  } catch (error) {
    console.error('Error recording cluster metrics:', error);
    return NextResponse.json(
      { error: 'Failed to record cluster metrics' },
      { status: 500 }
    );
  }
}
