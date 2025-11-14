import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fetch from 'node-fetch';
import { notifyIncidentCreated, notifySiteStatusChanged } from '@/lib/pusher-server';
import { notifyTeamOfIncident, notifyTeamOfResolution, sendSSLExpiryNotification } from '@/lib/notify';
import { SITE_STATUS, INCIDENT_STATUS } from '@/lib/constants';
import { checkSSLCertificate, shouldSendSSLAlert } from '@/lib/ssl';

// Verify cron secret to prevent unauthorized access
const verifyCronSecret = (request) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }
  return true;
};

const checkSite = async (site) => {
  const startTime = Date.now();
  let status = SITE_STATUS.ONLINE;
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
      status = SITE_STATUS.OFFLINE;
      error = `HTTP ${response.status} ${response.statusText}`;
    } else if (latency > 5000) {
      status = SITE_STATUS.DEGRADED;
    }
  } catch (err) {
    console.error(`Error checking ${site.url}:`, err.message);
    status = SITE_STATUS.OFFLINE;
    latency = Date.now() - startTime;
    error = err.message;
  }

  return { status, latency, error };
};

const updateSiteStatus = async (site, newStatus, latency, error = null) => {
  const previousStatus = site.status;
  const now = new Date();

  // Calculate uptime based on check history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const checksStats = await prisma.siteCheck.aggregate({
    where: {
      siteId: site.id,
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
      siteId: site.id,
      status: SITE_STATUS.ONLINE,
      checkedAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const totalChecks = checksStats._count.id || 0;
  const successfulChecks = successfulChecksCount || 0;

  // Calculate uptime percentage: (successful checks / total checks) * 100
  const newUptime = totalChecks > 0 
    ? (successfulChecks / totalChecks) * 100 
    : (newStatus === SITE_STATUS.ONLINE ? 100 : 0);

  // Update average latency
  const newAverageLatency = site.averageLatency 
    ? (site.averageLatency * 0.8 + latency * 0.2)
    : latency;

  // Update site
  const updatedSite = await prisma.site.update({
    where: { id: site.id },
    data: {
      status: newStatus,
      uptime: Math.min(100, Math.max(0, newUptime)),
      averageLatency: Math.round(newAverageLatency),
      lastCheckedAt: now,
    },
    include: {
      organization: true,
    },
  });

  // Create check record
  await prisma.siteCheck.create({
    data: {
      siteId: site.id,
      status: newStatus,
      responseTime: latency,
      statusCode: newStatus === SITE_STATUS.ONLINE ? 200 : null,
      errorMessage: error,
      checkedAt: now,
    },
  });

  // If status changed to OFFLINE or DEGRADED, create an incident
  if (
    (newStatus === SITE_STATUS.OFFLINE || newStatus === SITE_STATUS.DEGRADED) &&
    previousStatus === SITE_STATUS.ONLINE
  ) {
    const incident = await prisma.incident.create({
      data: {
        siteId: site.id,
        status: INCIDENT_STATUS.INVESTIGATING,
        severity: newStatus === SITE_STATUS.OFFLINE ? 'HIGH' : 'MEDIUM',
        startTime: now,
        aiSummary: `Automated detection: ${site.name} is ${newStatus.toLowerCase()}. Response time: ${latency}ms.${error ? ' Error: ' + error : ''}`,
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
    
    // Send email notification
    await notifyTeamOfIncident(incident, site);
  }

  // If status changed back to ONLINE, auto-resolve any open incidents
  if (
    newStatus === SITE_STATUS.ONLINE &&
    (previousStatus === SITE_STATUS.OFFLINE || previousStatus === SITE_STATUS.DEGRADED)
  ) {
    // Find open incidents for this site
    const openIncidents = await prisma.incident.findMany({
      where: {
        siteId: site.id,
        status: {
          not: INCIDENT_STATUS.RESOLVED,
        },
        endTime: null,
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

    // Auto-resolve them
    for (const incident of openIncidents) {
      const duration = now - incident.startTime;
      const resolvedIncident = await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: INCIDENT_STATUS.RESOLVED,
          endTime: now,
          duration,
          aiSummary: incident.aiSummary 
            ? `${incident.aiSummary} - Auto-resolved: Site back online.`
            : `Auto-resolved: Site back online after ${Math.round(duration / 60000)} minutes.`,
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

      // Send resolution notifications
      await notifyTeamOfResolution(resolvedIncident, resolvedIncident.site);
    }
  }

  // If status changed, broadcast the update
  if (previousStatus !== newStatus) {
    await notifySiteStatusChanged(updatedSite, site.organizationId);
  }

  return updatedSite;
};


const shouldCheckSite = (site) => {
  if (!site.lastCheckedAt) return true; // Never checked before

  const now = new Date();
  const secondsSinceLastCheck = (now - site.lastCheckedAt) / 1000;
  const checkInterval = site.checkInterval || 60; // Default 60 seconds

  return secondsSinceLastCheck >= checkInterval;
};

const shouldCheckSSL = (site) => {
  // Check SSL every 24 hours
  if (!site.sslMonitoringEnabled) return false;
  if (!site.sslLastChecked) return true; // Never checked before

  const now = new Date();
  const hoursSinceLastCheck = (now - new Date(site.sslLastChecked)) / (1000 * 60 * 60);

  return hoursSinceLastCheck >= 24; // Check once per day
};

const checkAndUpdateSSL = async (site) => {
  try {
    const sslInfo = await checkSSLCertificate(site.url);

    if (!sslInfo.isHttps) {
      // Not an HTTPS site, disable SSL monitoring
      await prisma.site.update({
        where: { id: site.id },
        data: {
          sslMonitoringEnabled: false,
          sslLastChecked: new Date()
        }
      });
      return null;
    }

    const now = new Date();
    const updateData = {
      sslLastChecked: now
    };

    if (sslInfo.valid) {
      updateData.sslCertificateValid = sslInfo.valid;
      updateData.sslIssuer = sslInfo.issuer;
      updateData.sslValidFrom = sslInfo.validFrom;
      updateData.sslExpiryDate = sslInfo.validTo;
      updateData.sslDaysRemaining = sslInfo.daysRemaining;

      // Check if we should send an alert
      const shouldAlert = shouldSendSSLAlert(
        sslInfo.daysRemaining,
        site.sslAlertThreshold,
        site.sslLastChecked
      );

      if (shouldAlert) {
        // Send SSL expiry notification
        await sendSSLExpiryNotification(site, sslInfo);
      }
    } else {
      updateData.sslCertificateValid = false;
      updateData.sslIssuer = null;
      updateData.sslValidFrom = null;
      updateData.sslExpiryDate = null;
      updateData.sslDaysRemaining = null;
    }

    // Update site with current SSL state
    await prisma.site.update({
      where: { id: site.id },
      data: updateData
    });

    // Create historical SSL check record
    await prisma.sSLCheck.create({
      data: {
        siteId: site.id,
        organizationId: site.organizationId,
        valid: sslInfo.valid || false,
        issuer: sslInfo.issuer,
        subject: sslInfo.subject,
        validFrom: sslInfo.validFrom,
        validTo: sslInfo.validTo,
        daysRemaining: sslInfo.daysRemaining,
        serialNumber: sslInfo.serialNumber,
        fingerprint: sslInfo.fingerprint,
        algorithm: sslInfo.algorithm,
        authorized: sslInfo.authorized,
        authorizationError: sslInfo.authorizationError,
        errorMessage: sslInfo.error,
        checkedAt: now
      }
    });

    return sslInfo;
  } catch (error) {
    console.error(`[SSL Check] Error checking SSL for ${site.name}:`, error.message);
    return null;
  }
};

export async function POST(request) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sites = await prisma.site.findMany({
      where: {
        enabled: true,
      },
      include: {
        organization: true,
      },
    });

    console.log(`[Cron] Found ${sites.length} enabled sites`);

    // Filter sites that need to be checked based on their interval
    const sitesToCheck = sites.filter(shouldCheckSite);
    const sitesToCheckSSL = sites.filter(shouldCheckSSL);
    console.log(`[Cron] Checking ${sitesToCheck.length} sites (${sites.length - sitesToCheck.length} skipped based on interval)`);
    console.log(`[Cron] Checking SSL for ${sitesToCheckSSL.length} sites`);

    const results = [];

    for (const site of sitesToCheck) {
      try {
        const { status, latency, error } = await checkSite(site);
        await updateSiteStatus(site, status, latency, error);

        results.push({
          site: site.name,
          status,
          latency,
          interval: site.checkInterval,
          error,
        });

        console.log(`[Cron] ${site.name}: ${status} (${latency}ms) [interval: ${site.checkInterval}s]${error ? ' - ' + error : ''}`);
      } catch (error) {
        console.error(`[Cron] Error updating ${site.name}:`, error);
        results.push({
          site: site.name,
          error: error.message,
        });
      }
    }

    // Check SSL certificates separately
    const sslResults = [];
    for (const site of sitesToCheckSSL) {
      try {
        const sslInfo = await checkAndUpdateSSL(site);
        if (sslInfo) {
          sslResults.push({
            site: site.name,
            valid: sslInfo.valid,
            daysRemaining: sslInfo.daysRemaining,
            issuer: sslInfo.issuer
          });
          console.log(`[SSL Check] ${site.name}: ${sslInfo.valid ? `Valid (${sslInfo.daysRemaining} days remaining)` : 'Invalid'}`);
        }
      } catch (error) {
        console.error(`[SSL Check] Error checking ${site.name}:`, error);
      }
    }

    console.log('[Cron] Health checks complete');

    return NextResponse.json({
      success: true,
      totalSites: sites.length,
      checked: sitesToCheck.length,
      skipped: sites.length - sitesToCheck.length,
      sslChecked: sitesToCheckSSL.length,
      results,
      sslResults,
    }, { status: 200 });

  } catch (error) {
    console.error('[Cron] Error in monitoring job:', error);
    return NextResponse.json(
      { error: 'Monitoring job failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing
export async function GET(request) {
  // Allow manual trigger in development
  if (process.env.NODE_ENV === 'development') {
    return POST(request);
  }
  
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
