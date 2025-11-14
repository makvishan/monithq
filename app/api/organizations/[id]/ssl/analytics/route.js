import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

/**
 * GET /api/organizations/[id]/ssl/analytics
 * Get SSL analytics for an entire organization
 */
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Check if user has access to this organization
    if (user.organizationId !== id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all sites for organization
    const sites = await prisma.site.findMany({
      where: {
        organizationId: id,
        sslMonitoringEnabled: true
      },
      select: {
        id: true,
        name: true,
        url: true,
        sslExpiryDate: true,
        sslDaysRemaining: true,
        sslCertificateValid: true,
        sslIssuer: true,
        sslLastChecked: true
      }
    });

    // Get SSL check history for the organization
    const sslChecks = await prisma.sSLCheck.findMany({
      where: {
        organizationId: id,
        checkedAt: {
          gte: startDate
        }
      },
      orderBy: {
        checkedAt: 'desc'
      }
    });

    // Calculate SSL uptime per site
    const siteMetrics = sites.map(site => {
      const siteChecks = sslChecks.filter(c => c.siteId === site.id);
      const validChecks = siteChecks.filter(c => c.valid);
      const uptime = siteChecks.length > 0
        ? (validChecks.length / siteChecks.length) * 100
        : (site.sslCertificateValid ? 100 : 0);

      return {
        siteId: site.id,
        siteName: site.name,
        siteUrl: site.url,
        currentlyValid: site.sslCertificateValid,
        daysRemaining: site.sslDaysRemaining,
        expiryDate: site.sslExpiryDate,
        issuer: site.sslIssuer,
        lastChecked: site.sslLastChecked,
        uptime: Math.round(uptime * 100) / 100,
        totalChecks: siteChecks.length,
        validChecks: validChecks.length
      };
    });

    // Categorize sites by urgency
    const sitesByUrgency = {
      expired: siteMetrics.filter(s => s.daysRemaining !== null && s.daysRemaining < 0),
      critical: siteMetrics.filter(s => s.daysRemaining !== null && s.daysRemaining >= 0 && s.daysRemaining < 7),
      warning: siteMetrics.filter(s => s.daysRemaining !== null && s.daysRemaining >= 7 && s.daysRemaining < 30),
      healthy: siteMetrics.filter(s => s.daysRemaining !== null && s.daysRemaining >= 30),
      unknown: siteMetrics.filter(s => s.daysRemaining === null)
    };

    // Calculate organization-wide SSL uptime
    const totalChecks = sslChecks.length;
    const validChecks = sslChecks.filter(c => c.valid).length;
    const organizationSSLUptime = totalChecks > 0
      ? (validChecks / totalChecks) * 100
      : 0;

    // Detect certificate renewals
    const renewals = [];
    const checksBySite = sslChecks.reduce((acc, check) => {
      if (!acc[check.siteId]) acc[check.siteId] = [];
      acc[check.siteId].push(check);
      return acc;
    }, {});

    Object.entries(checksBySite).forEach(([siteId, checks]) => {
      checks.sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));

      for (let i = 0; i < checks.length - 1; i++) {
        const current = checks[i];
        const previous = checks[i + 1];

        if (current.serialNumber !== previous.serialNumber &&
            current.valid && previous.valid) {
          const site = sites.find(s => s.id === siteId);
          renewals.push({
            siteId,
            siteName: site?.name || 'Unknown',
            date: current.checkedAt,
            fromSerial: previous.serialNumber,
            toSerial: current.serialNumber,
            fromExpiry: previous.validTo,
            toExpiry: current.validTo,
            daysExtended: current.daysRemaining - previous.daysRemaining
          });
        }
      }
    });

    // Group checks by issuer
    const issuerStats = sslChecks.reduce((acc, check) => {
      if (check.issuer) {
        if (!acc[check.issuer]) {
          acc[check.issuer] = { count: 0, valid: 0 };
        }
        acc[check.issuer].count++;
        if (check.valid) acc[check.issuer].valid++;
      }
      return acc;
    }, {});

    const issuers = Object.entries(issuerStats).map(([name, stats]) => ({
      name,
      count: stats.count,
      validCount: stats.valid,
      successRate: (stats.valid / stats.count) * 100
    })).sort((a, b) => b.count - a.count);

    // SSL checks over time (daily aggregation)
    const dailyChecks = sslChecks.reduce((acc, check) => {
      const date = new Date(check.checkedAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, valid: 0 };
      }
      acc[date].total++;
      if (check.valid) acc[date].valid++;
      return acc;
    }, {});

    const timeline = Object.entries(dailyChecks).map(([date, stats]) => ({
      date,
      total: stats.total,
      valid: stats.valid,
      uptime: (stats.valid / stats.total) * 100
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      period: {
        days,
        startDate,
        endDate: new Date()
      },
      summary: {
        totalSites: sites.length,
        monitoredSites: sites.length,
        organizationSSLUptime: Math.round(organizationSSLUptime * 100) / 100,
        totalChecks,
        validChecks,
        invalidChecks: totalChecks - validChecks
      },
      sitesByUrgency: {
        expired: sitesByUrgency.expired.length,
        critical: sitesByUrgency.critical.length,
        warning: sitesByUrgency.warning.length,
        healthy: sitesByUrgency.healthy.length,
        unknown: sitesByUrgency.unknown.length
      },
      siteDetails: siteMetrics,
      urgentSites: [
        ...sitesByUrgency.expired,
        ...sitesByUrgency.critical
      ],
      renewals,
      issuers,
      timeline
    });

  } catch (error) {
    console.error('Error fetching organization SSL analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SSL analytics' },
      { status: 500 }
    );
  }
}
