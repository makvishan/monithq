import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkSSLCertificate, formatSSLInfo, shouldSendSSLAlert } from '@/lib/ssl';
import { requireAuth, checkOrganizationAccess } from '@/lib/api-middleware';
import { sendSSLExpiryNotification } from '@/lib/notify';

/**
 * POST /api/sites/[id]/ssl/check
 * Manually trigger an SSL certificate check for a site
 */
export async function POST(request, { params }) {
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

    // Perform SSL check
    const sslInfo = await checkSSLCertificate(site.url);

    if (!sslInfo.isHttps) {
      return NextResponse.json({
        success: true,
        message: 'Site is not using HTTPS',
        isHttps: false,
        sslInfo: null
      });
    }

    const now = new Date();

    // Update site with SSL information
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
      if (site.sslMonitoringEnabled) {
        const shouldAlert = shouldSendSSLAlert(
          sslInfo.daysRemaining,
          site.sslAlertThreshold,
          site.sslLastChecked
        );

        if (shouldAlert) {
          // Send SSL expiry notification
          await sendSSLExpiryNotification(site, sslInfo);
        }
      }
    } else {
      updateData.sslCertificateValid = false;
      updateData.sslIssuer = null;
      updateData.sslValidFrom = null;
      updateData.sslExpiryDate = null;
      updateData.sslDaysRemaining = null;
    }

    await prisma.site.update({
      where: { id },
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

    return NextResponse.json({
      success: true,
      isHttps: true,
      sslInfo: {
        ...sslInfo,
        formatted: formatSSLInfo(sslInfo)
      }
    });

  } catch (error) {
    console.error('Error checking SSL certificate:', error);
    return NextResponse.json(
      { error: 'Failed to check SSL certificate' },
      { status: 500 }
    );
  }
}
