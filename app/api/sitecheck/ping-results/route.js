import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SITE_STATUS } from '@/lib/constants';

// POST /api/sitecheck/ping-results - Accepts ping results from Cloudflare Worker
export async function POST(request) {
  try {
    const body = await request.json();
    const { results, timestamp } = body;

    if (!Array.isArray(results)) {
      return NextResponse.json({ error: 'Invalid results format' }, { status: 400 });
    }

    for (const result of results) {
      // Find site by URL
      const site = await prisma.site.findUnique({ where: { url: result.url } });
      if (!site) continue;

      // Create SiteCheck record
      await prisma.siteCheck.create({
        data: {
          siteId: site.id,
          status: result.ok ? SITE_STATUS.ONLINE : SITE_STATUS.OFFLINE,
          responseTime: result.latency,
          statusCode: result.status === 'error' ? null : result.status,
          errorMessage: result.error || null,
          checkedAt: timestamp ? new Date(timestamp) : new Date(),
          region: result.region || null,
        },
      });

      // Optionally, update site status/metrics here
      // ...existing logic for updating site status and triggering incidents...
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing ping results:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
