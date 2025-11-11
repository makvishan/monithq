import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOpenAICompletion } from '@/lib/openai';

export async function GET(request) {
  // 1. Aggregate SiteCheck data (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const checks = await prisma.siteCheck.findMany({
    where: { checkedAt: { gte: since } },
    include: { site: true },
    orderBy: { checkedAt: 'desc' },
  });

  // 2. Format data for AI
  const summary = checks.map(check =>
    `Site: ${check.site.name} | Status: ${check.status} | Response: ${check.responseTime}ms | Code: ${check.statusCode ?? '-'} | Error: ${check.errorMessage ?? '-'} | At: ${check.checkedAt.toISOString()}`
  ).join('\n');

  // 3. Send to OpenAI using util
  const prompt = `Analyze this site monitoring data and provide insights, trends, and recommendations.\n${summary}`;
  const insights = await getOpenAICompletion({ prompt });

  // 4. Return AI insights
  return NextResponse.json({ insights });
}

