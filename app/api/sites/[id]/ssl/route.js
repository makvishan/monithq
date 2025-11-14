import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkSSLCertificate, formatSSLInfo } from '@/lib/ssl';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';

/**
 * GET /api/sites/[id]/ssl
 * Get SSL certificate details for a site
 */
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    // Get the site
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        organization: true
      }
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

    // Return cached SSL info if available and recent (less than 1 hour old)
    if (site.sslLastChecked && site.sslExpiryDate) {
      const hoursSinceCheck = (Date.now() - new Date(site.sslLastChecked).getTime()) / (1000 * 60 * 60);

      if (hoursSinceCheck < 1) {
        return NextResponse.json({
          cached: true,
          sslMonitoringEnabled: site.sslMonitoringEnabled,
          valid: site.sslCertificateValid,
          issuer: site.sslIssuer,
          validFrom: site.sslValidFrom,
          validTo: site.sslExpiryDate,
          daysRemaining: site.sslDaysRemaining,
          lastChecked: site.sslLastChecked,
          alertThreshold: site.sslAlertThreshold,
          formatted: formatSSLInfo({
            valid: site.sslCertificateValid,
            issuer: site.sslIssuer,
            validFrom: site.sslValidFrom,
            validTo: site.sslExpiryDate,
            daysRemaining: site.sslDaysRemaining
          })
        });
      }
    }

    // Perform fresh SSL check
    const sslInfo = await checkSSLCertificate(site.url);

    // Update site with SSL information
    if (sslInfo.valid) {
      await prisma.site.update({
        where: { id },
        data: {
          sslCertificateValid: sslInfo.valid,
          sslIssuer: sslInfo.issuer,
          sslValidFrom: sslInfo.validFrom,
          sslExpiryDate: sslInfo.validTo,
          sslDaysRemaining: sslInfo.daysRemaining,
          sslLastChecked: new Date()
        }
      });
    } else {
      await prisma.site.update({
        where: { id },
        data: {
          sslCertificateValid: false,
          sslLastChecked: new Date()
        }
      });
    }

    return NextResponse.json({
      cached: false,
      sslMonitoringEnabled: site.sslMonitoringEnabled,
      ...sslInfo,
      formatted: formatSSLInfo(sslInfo),
      alertThreshold: site.sslAlertThreshold
    });

  } catch (error) {
    console.error('Error fetching SSL info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SSL certificate information' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sites/[id]/ssl
 * Update SSL monitoring settings for a site
 */
export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const body = await request.json();

    // Get the site
    const site = await prisma.site.findUnique({
      where: { id }
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

    // Only ORG_ADMIN can modify SSL settings
    if (user.role !== 'ORG_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only organization admins can modify SSL settings' },
        { status: 403 }
      );
    }

    // Update SSL settings
    const updateData = {};

    if (typeof body.sslMonitoringEnabled === 'boolean') {
      updateData.sslMonitoringEnabled = body.sslMonitoringEnabled;
    }

    if (body.sslAlertThreshold && Number.isInteger(body.sslAlertThreshold)) {
      updateData.sslAlertThreshold = body.sslAlertThreshold;
    }

    const updatedSite = await prisma.site.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      site: {
        id: updatedSite.id,
        sslMonitoringEnabled: updatedSite.sslMonitoringEnabled,
        sslAlertThreshold: updatedSite.sslAlertThreshold
      }
    });

  } catch (error) {
    console.error('Error updating SSL settings:', error);
    return NextResponse.json(
      { error: 'Failed to update SSL settings' },
      { status: 500 }
    );
  }
}
