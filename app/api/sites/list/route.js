import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/sites/list - Returns array of monitored site URLs
export async function GET(request) {
  try {
    const sites = await prisma.site.findMany({
      where: { enabled: true },
      select: { url: true },
    });
    const urls = sites.map(site => site.url);
    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error fetching site list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
