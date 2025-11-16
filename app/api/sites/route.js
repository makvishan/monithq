import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, checkOrganizationAccess, createAuditLog } from '@/lib/api-middleware';
import { checkSubscriptionLimit, getPlanLimits } from '@/lib/stripe';

// GET /api/sites - List all sites for user's organization with pagination and filtering
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status'); // ONLINE, OFFLINE, DEGRADED, MAINTENANCE
    const search = searchParams.get('search'); // Search by name or URL
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, name, uptime, status
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc

    // Build base where clause
    const where = {
      enabled: true,
      ...(user.role === 'SUPER_ADMIN' ? {} : { organizationId: user.organizationId }),
    };

    // Add status filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.site.count({ where });

    // Fetch sites with pagination
    const sites = await prisma.site.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        checkInterval: true,
        averageLatency: true,
        lastCheckedAt: true,
        region: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        // SSL Certificate fields
        sslMonitoringEnabled: true,
        sslExpiryDate: true,
        sslDaysRemaining: true,
        sslCertificateValid: true,
        // Security monitoring fields
        securityScore: true,
        lastSecurityCheck: true,
        // API monitoring fields
        siteType: true,
        httpMethod: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            incidents: {
              where: {
                status: { not: 'RESOLVED' },
              },
            },
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Add computed fields
    const sitesWithMetrics = sites.map(site => ({
      ...site,
      lastChecked: site.lastCheckedAt, // Alias for backward compatibility
      activeIncidents: site._count.incidents,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      sites: sitesWithMetrics,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get sites error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

// POST /api/sites - Create new site
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }
    // Restrict ORG_ADMIN from creating site if email not verified
    if (user.role === 'ORG_ADMIN' && !user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email verification is pending. Please verify your email before creating a site.',
          verify: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      url,
      checkInterval,
      region,
      sslMonitoringEnabled,
      sslAlertThreshold,
      // API monitoring fields
      siteType,
      httpMethod,
      requestHeaders,
      requestBody,
      expectedStatus,
      authType,
      authValue,
      responseValidation,
    } = body;

    // Validation
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if user has reached site limit based on subscription
   const membership = await prisma.user.findFirst({
  where: {
    id: user.id,
  },
  include: {
    organization: {
      include: {
        subscription: true,
      },
    },
  },
});

    const subscription = membership?.organization?.subscription;
    const planLimits = await getPlanLimits(subscription?.plan || 'FREE');

    const siteCount = await prisma.site.count({
      where: { organizationId: user.organizationId },
    });

    // Check if can add more sites (-1 means unlimited)
    if (planLimits.sites !== -1 && siteCount >= planLimits.sites) {
      return NextResponse.json(
        {
          error: `Site limit reached for ${subscription?.plan || 'FREE'} plan`,
          limit: planLimits.sites,
          current: siteCount,
          upgrade: subscription?.plan === 'FREE' ? 'Upgrade to add more sites' : null,
        },
        { status: 403 }
      );
    }

    // Validate check interval against plan limits
    const requestedInterval = checkInterval || 300;
    if (requestedInterval < planLimits.minCheckInterval) {
      return NextResponse.json(
        {
          error: `Check interval too fast for ${subscription?.plan || 'FREE'} plan`,
          minInterval: planLimits.minCheckInterval,
          requested: requestedInterval,
          message: `${subscription?.plan || 'FREE'} plan allows minimum ${planLimits.minCheckInterval}s intervals. Upgrade for faster monitoring.`,
        },
        { status: 403 }
      );
    }

    // Create site
    const site = await prisma.site.create({
      data: {
        name,
        url,
        checkInterval: requestedInterval,
        region: region || 'US East',
        organizationId: user.organizationId,
        createdById: user.id,
        // SSL Monitoring settings (only for HTTPS sites)
        ...(url.startsWith('https://') && {
          sslMonitoringEnabled: sslMonitoringEnabled ?? true,
          sslAlertThreshold: sslAlertThreshold || 30,
        }),
        // API Monitoring settings
        siteType: siteType || 'WEB',
        ...(siteType === 'API' && {
          httpMethod: httpMethod || 'GET',
          requestHeaders: requestHeaders || {},
          requestBody: requestBody || null,
          expectedStatus: expectedStatus || [200],
          authType: authType || 'NONE',
          authValue: authValue || null,
          responseValidation: responseValidation || null,
        }),
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

    // Create audit log
    await createAuditLog('create', 'site', site.id, user.id, { name, url }, request);

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error('Create site error:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
