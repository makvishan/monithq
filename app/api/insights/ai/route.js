import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOpenAICompletion } from '@/lib/openai';
import { requireAuth } from '@/lib/api-middleware';

// Helper to parse AI response into insight objects
function parseAIInsights(aiText) {
  // Try to parse as JSON array first
  try {
    const parsed = JSON.parse(aiText);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // If not a JSON array, try to extract individual JSON objects from numbered list
    const regex = /\{[^}]*\}/g;
    const matches = aiText.match(regex);
    if (!matches) {
      console.error('Error parsing AI insights:', error);
      return [];
    }
    const objects = matches.map(objStr => {
      try {
        return JSON.parse(objStr);
      } catch (e) {
        console.error('Error parsing individual insight:', e, objStr);
        return null;
      }
    }).filter(Boolean);
    return objects;
  }
}

export async function GET(request) {
  // Get current user and orgId from session
  const user = await requireAuth(request);
  if (user instanceof NextResponse) {
    return user;
  }
  const orgId = user.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: 'No organization found for user.' }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const site = searchParams.get('site'); // e.g., category
  const limit = parseInt(searchParams.get('limit') || '5', 10);
  const skip = parseInt(searchParams.get('skip') || '0', 10);

  // Build Prisma query
  const where = { orgId };
  if (site) {
    where.siteId = site;
  }

  const insights = await prisma.aiInsight.findMany({
    where,
    orderBy: { generatedAt: 'desc' },
    take: limit,
    skip,
  });
  return NextResponse.json({ insights });
}


export async function POST(request) {
  // Get current user and orgId from session
  const user = await requireAuth(request);
  if (user instanceof NextResponse) {
    return user;
  }
  const orgId = user.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: 'No organization found for user.' }, { status: 401 });
  }

  // Parse body for siteId (if provided)
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const siteId = body.site;
  

  // 1. Aggregate SiteCheck data (last 7 days), filter by siteId if present
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const where = {
    checkedAt: { gte: since },
    site: {
      organizationId: orgId
    }
  };
  if (siteId) {
    where.siteId = siteId;
  }
  const checks = await prisma.siteCheck.findMany({
    where,
    include: { site: true },
    orderBy: { checkedAt: 'desc' },
  });

  // 2. Format data for AI
  let summary = '';
  if (checks.length > 0) {
    summary = checks.map(check =>
      `SiteId: ${check.site.id} | Site: ${check.site.name} | Status: ${check.status} | Response: ${check.responseTime}ms | Code: ${check.statusCode ?? '-'} | Error: ${check.errorMessage ?? '-'} | At: ${check.checkedAt.toISOString()}`
    ).join('\n');
  } else {
    summary = 'No site monitoring data is available for the last 7 days.';
  }

  // 3. Send to OpenAI using util
  const prompt = `You are an expert site reliability engineer. Analyze the following site monitoring data and provide up to 5 actionable insights. For each, return a JSON object with: siteId, title, category (performance, alert, pattern, recommendation), summary, confidenceScore (0-1), recommendations.\n${summary}`;
  const aiText = await getOpenAICompletion({ prompt });
  const insights = parseAIInsights(aiText);

  // Only store insights that have a title and summary
  let saved=[]
  if (insights && insights.length > 0) {
  const validInsights =insights.filter(i => i.title && i.summary);
   saved = await Promise.all(
    validInsights.map(async (insight) =>
      prisma.aiInsight.create({
        data: {
          orgId,
          siteId: insight.siteId,
          title: insight.title,
          category: insight.category,
          summary: insight.summary,
          confidenceScore: insight.confidenceScore,
          recommendations: insight.recommendations || '',
          generatedAt: new Date(),
        },
      })
    )
  );
}

  return NextResponse.json({ insights: saved  });
}