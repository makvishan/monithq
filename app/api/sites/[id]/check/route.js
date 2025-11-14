import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';
import { notifySiteStatusChanged, notifyIncidentCreated } from '@/lib/pusher-server';
import { notifyTeamOfIncident } from '@/lib/notify';

// Helper function to check a single site
const checkSite = async (site) => {
  const startTime = Date.now();
  let status = 'ONLINE';
  let latency = 0;
  let error = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(site.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'MonitHQ-HealthCheck/1.0',
      },
    });

    clearTimeout(timeout);
    latency = Date.now() - startTime;

    if (!response.ok) {
      status = 'OFFLINE';
      error = `HTTP ${response.status} ${response.statusText}`;
    } else if (latency > 5000) {
      status = 'DEGRADED';
    }
  } catch (err) {
    console.error(`Error checking ${site.url}:`, err.message);
    status = 'OFFLINE';
    latency = Date.now() - startTime;
    error = err.message;
  }

  return { status, latency, error };
};

// POST /api/sites/[id]/check - Manually trigger site health check
export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Get site
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        organization: true,
      },
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

    // Perform health check
    const { status, latency, error } = await checkSite(site);
    const previousStatus = site.status;
    const now = new Date();

    // Calculate uptime based on check history (more accurate)
    // Get total checks and successful checks from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const checksStats = await prisma.siteCheck.aggregate({
      where: {
        siteId: id,
        checkedAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    const successfulChecksCount = await prisma.siteCheck.count({
      where: {
        siteId: id,
        status: 'ONLINE',
        checkedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const totalChecks = checksStats._count.id || 0;
    const successfulChecks = successfulChecksCount || 0;

    // Calculate uptime percentage: (successful checks / total checks) * 100
    // If no checks exist yet, default to 100% for new sites
    const newUptime = totalChecks > 0 
      ? (successfulChecks / totalChecks) * 100 
      : (status === 'ONLINE' ? 100 : 0);

    // Update average latency
    const newAverageLatency = site.averageLatency 
      ? (site.averageLatency * 0.8 + latency * 0.2)
      : latency;

    // Update site
    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        status,
        uptime: Math.min(100, Math.max(0, newUptime)),
        averageLatency: Math.round(newAverageLatency),
        lastCheckedAt: now,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create check record
    await prisma.siteCheck.create({
      data: {
        siteId: id,
        status,
        responseTime: latency,
        statusCode: status === 'ONLINE' ? 200 : null,
        errorMessage: error,
        checkedAt: now,
      },
    });

    // If status changed to OFFLINE or DEGRADED, create an incident
    if (
      (status === 'OFFLINE' || status === 'DEGRADED') &&
      previousStatus === 'ONLINE'
    ) {
      const incident = await prisma.incident.create({
        data: {
          siteId: id,
          status: 'INVESTIGATING',
          severity: status === 'OFFLINE' ? 'HIGH' : 'MEDIUM',
          startTime: now,
          aiSummary: `Manual check detected: ${site.name} is ${status.toLowerCase()}. Response time: ${latency}ms.${error ? ' Error: ' + error : ''}`,
        },
        include: {
          site: {
            select: {
              id: true,
              name: true,
              url: true,
              organizationId: true,
            },
          },
        },
      });

      // Broadcast incident creation
      await notifyIncidentCreated(incident, site.organizationId);
      
      // Check if email notifications for manual checks are enabled
      const appSettings = await prisma.appSettings.findUnique({
        where: { id: 'app_settings' },
      });
      
      if (appSettings?.notifyOnManualCheck) {
        // Send email notification
        await notifyTeamOfIncident(incident, updatedSite);
      }
    }

    // If status changed, broadcast the update
    if (previousStatus !== status) {
      await notifySiteStatusChanged(updatedSite, site.organizationId);
    }

    return NextResponse.json({
      success: true,
      site: updatedSite,
      check: {
        status,
        latency,
        timestamp: now,
        statusChanged: previousStatus !== status,
        previousStatus,
        error,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Check site error:', error);
    return NextResponse.json(
      { error: 'Failed to check site', details: error.message },
      { status: 500 }
    );
  }
}
