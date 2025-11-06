import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

// GET /api/export/incidents - Export incidents data
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {
      site: {
        organizationId: user.organizationId,
      },
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        site: {
          select: {
            name: true,
            url: true,
          },
        },
        resolvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (format === 'csv') {
      const headers = [
        'ID',
        'Site Name',
        'Site URL',
        'Status',
        'Severity',
        'Start Time',
        'End Time',
        'Duration (minutes)',
        'AI Summary',
        'Resolved By',
        'Created At',
      ];

      const rows = incidents.map(incident => [
        incident.id,
        incident.site.name,
        incident.site.url,
        incident.status,
        incident.severity,
        new Date(incident.startTime).toISOString(),
        incident.endTime ? new Date(incident.endTime).toISOString() : 'Ongoing',
        incident.duration ? Math.floor(incident.duration / 1000 / 60) : '',
        incident.aiSummary || '',
        incident.resolvedBy?.name || '',
        new Date(incident.createdAt).toISOString(),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="incidents-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      incidents,
      exported_at: new Date().toISOString(),
      total: incidents.length,
      filter: {
        start_date: startDate,
        end_date: endDate,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Export incidents error:', error);
    return NextResponse.json(
      { error: 'Failed to export incidents' },
      { status: 500 }
    );
  }
}
