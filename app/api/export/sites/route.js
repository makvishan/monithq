import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET /api/export/sites - Export sites data
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json or csv

    const sites = await prisma.site.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            incidents: true,
            checks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Name',
        'URL',
        'Status',
        'Uptime %',
        'Avg Latency (ms)',
        'Check Interval (s)',
        'Region',
        'Enabled',
        'Incidents Count',
        'Checks Count',
        'Created By',
        'Created At',
        'Last Checked',
      ];

      const rows = sites.map(site => [
        site.id,
        site.name,
        site.url,
        site.status,
        site.uptime.toFixed(2),
        site.averageLatency,
        site.checkInterval,
        site.region || '',
        site.enabled ? 'Yes' : 'No',
        site._count.incidents,
        site._count.checks,
        site.createdBy.name,
        new Date(site.createdAt).toISOString(),
        site.lastCheckedAt ? new Date(site.lastCheckedAt).toISOString() : 'Never',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sites-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      sites,
      exported_at: new Date().toISOString(),
      total: sites.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Export sites error:', error);
    return NextResponse.json(
      { error: 'Failed to export sites' },
      { status: 500 }
    );
  }
}
