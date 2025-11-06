import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET /api/export/uptime - Export uptime reports
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const siteId = searchParams.get('siteId');
    const days = parseInt(searchParams.get('days') || '30');

    const where = {
      siteId: siteId || undefined,
      site: {
        organizationId: user.organizationId,
      },
      checkedAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    const checks = await prisma.siteCheck.findMany({
      where,
      include: {
        site: {
          select: {
            name: true,
            url: true,
          },
        },
      },
      orderBy: {
        checkedAt: 'desc',
      },
    });

    if (format === 'csv') {
      const headers = [
        'Site Name',
        'Site URL',
        'Status',
        'Response Time (ms)',
        'Status Code',
        'Error Message',
        'Checked At',
      ];

      const rows = checks.map(check => [
        check.site.name,
        check.site.url,
        check.status,
        check.responseTime,
        check.statusCode || '',
        check.errorMessage || '',
        new Date(check.checkedAt).toISOString(),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="uptime-report-${Date.now()}.csv"`,
        },
      });
    }

    // Calculate statistics
    const totalChecks = checks.length;
    const successfulChecks = checks.filter(c => c.status === 'ONLINE').length;
    const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
    const avgResponseTime = totalChecks > 0
      ? checks.reduce((sum, c) => sum + c.responseTime, 0) / totalChecks
      : 0;

    return NextResponse.json({
      checks,
      statistics: {
        total_checks: totalChecks,
        successful_checks: successfulChecks,
        failed_checks: totalChecks - successfulChecks,
        uptime_percentage: uptime.toFixed(2),
        average_response_time: Math.round(avgResponseTime),
      },
      exported_at: new Date().toISOString(),
      period_days: days,
    }, { status: 200 });
  } catch (error) {
    console.error('Export uptime error:', error);
    return NextResponse.json(
      { error: 'Failed to export uptime data' },
      { status: 500 }
    );
  }
}
