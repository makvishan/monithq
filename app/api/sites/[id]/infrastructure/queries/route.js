import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import crypto from 'crypto';

// Helper function to generate query hash
function generateQueryHash(queryText) {
  return crypto.createHash('sha256').update(queryText).digest('hex').substring(0, 16);
}

// GET - Fetch query performance metrics for a site
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { id: siteId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const hours = parseInt(searchParams.get('hours') || '24');
    const databaseType = searchParams.get('databaseType');
    const slowOnly = searchParams.get('slowOnly') === 'true';
    const queryHash = searchParams.get('queryHash');

    // Verify site belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query filters
    const where = {
      siteId,
      checkedAt: {
        gte: new Date(Date.now() - hours * 60 * 60 * 1000),
      },
    };

    if (databaseType) {
      where.databaseType = databaseType;
    }

    if (slowOnly) {
      where.isSlowQuery = true;
    }

    if (queryHash) {
      where.queryHash = queryHash;
    }

    // Fetch query performance metrics
    const queries = await prisma.queryPerformance.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });

    // Get unique query hashes
    const uniqueQueries = [...new Set(queries.map(q => q.queryHash))];

    // Calculate statistics
    const statistics = queries.length > 0 ? {
      totalQueries: queries.length,
      uniqueQueries: uniqueQueries.length,
      slowQueries: queries.filter(q => q.isSlowQuery).length,
      avgExecutionTime: queries.reduce((sum, q) => sum + q.executionTimeMs, 0) / queries.length,
      maxExecutionTime: Math.max(...queries.map(q => q.executionTimeMs)),
      minExecutionTime: Math.min(...queries.map(q => q.executionTimeMs)),
      healthyCount: queries.filter(q => q.healthy).length,
      unhealthyCount: queries.filter(q => !q.healthy).length,
      byDatabaseType: {},
      byQueryType: {},
    } : null;

    // Group by database type
    if (statistics) {
      queries.forEach(q => {
        if (!statistics.byDatabaseType[q.databaseType]) {
          statistics.byDatabaseType[q.databaseType] = {
            count: 0,
            avgExecutionTime: 0,
            slowQueries: 0,
          };
        }
        statistics.byDatabaseType[q.databaseType].count++;
        statistics.byDatabaseType[q.databaseType].avgExecutionTime += q.executionTimeMs;
        if (q.isSlowQuery) statistics.byDatabaseType[q.databaseType].slowQueries++;
      });

      // Calculate averages
      Object.keys(statistics.byDatabaseType).forEach(type => {
        const count = statistics.byDatabaseType[type].count;
        statistics.byDatabaseType[type].avgExecutionTime /= count;
      });

      // Group by query type
      queries.forEach(q => {
        if (q.queryType) {
          if (!statistics.byQueryType[q.queryType]) {
            statistics.byQueryType[q.queryType] = {
              count: 0,
              avgExecutionTime: 0,
              slowQueries: 0,
            };
          }
          statistics.byQueryType[q.queryType].count++;
          statistics.byQueryType[q.queryType].avgExecutionTime += q.executionTimeMs;
          if (q.isSlowQuery) statistics.byQueryType[q.queryType].slowQueries++;
        }
      });

      // Calculate averages for query types
      Object.keys(statistics.byQueryType).forEach(type => {
        const count = statistics.byQueryType[type].count;
        statistics.byQueryType[type].avgExecutionTime /= count;
      });
    }

    // Get slowest queries
    const slowestQueries = queries
      .filter(q => q.isSlowQuery)
      .sort((a, b) => b.executionTimeMs - a.executionTimeMs)
      .slice(0, 10);

    return NextResponse.json({
      queries,
      statistics,
      slowestQueries,
      uniqueQueries: uniqueQueries.length,
      total: queries.length,
    });
  } catch (error) {
    console.error('Error fetching query performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query performance' },
      { status: 500 }
    );
  }
}

// POST - Add new query performance data
export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { id: siteId } = await params;
    const body = await request.json();

    // Verify site belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    const {
      databaseType,
      databaseName,
      databaseHost,
      queryText,
      queryType,
      executionTimeMs,
      rowsAffected,
      rowsExamined,
      slowQueryThreshold = 1000.0,
      useIndex,
      explainPlan,
      endpoint,
      userId,
      queryCount = 1,
      performanceScore,
      optimizationTips,
      avgExecutionMs,
      maxExecutionMs,
      minExecutionMs,
      p95ExecutionMs,
      p99ExecutionMs,
    } = body;

    if (!databaseType || executionTimeMs === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: databaseType, executionTimeMs' },
        { status: 400 }
      );
    }

    // Generate query hash
    const queryHash = queryText ? generateQueryHash(queryText) : crypto.randomBytes(8).toString('hex');

    // Determine if slow query
    const isSlowQuery = executionTimeMs > slowQueryThreshold;

    // Determine health status and issues
    const issues = [];

    if (isSlowQuery) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: `Slow query detected: ${executionTimeMs.toFixed(2)}ms (threshold: ${slowQueryThreshold}ms)`,
      });
    }

    if (useIndex === false) {
      issues.push({
        type: 'optimization',
        severity: 'warning',
        message: 'Query is not using an index',
      });
    }

    if (rowsExamined && rowsAffected && rowsExamined > rowsAffected * 10) {
      issues.push({
        type: 'efficiency',
        severity: 'warning',
        message: `Query examined ${rowsExamined} rows but only affected ${rowsAffected} rows`,
      });
    }

    const healthy = issues.length === 0;

    // Create query performance record
    const queryPerformance = await prisma.queryPerformance.create({
      data: {
        siteId,
        databaseType,
        databaseName,
        databaseHost,
        queryHash,
        queryText: queryText ? queryText.substring(0, 5000) : null, // Truncate long queries
        queryType,
        executionTimeMs,
        rowsAffected,
        rowsExamined,
        isSlowQuery,
        slowQueryThreshold,
        useIndex,
        explainPlan,
        endpoint,
        userId,
        queryCount,
        performanceScore,
        optimizationTips,
        avgExecutionMs,
        maxExecutionMs,
        minExecutionMs,
        p95ExecutionMs,
        p99ExecutionMs,
        healthy,
        issues: issues.length > 0 ? issues : null,
      },
    });

    return NextResponse.json({
      message: 'Query performance recorded successfully',
      queryPerformance,
      healthy,
      isSlowQuery,
      issueCount: issues.length,
      queryHash,
    });
  } catch (error) {
    console.error('Error recording query performance:', error);
    return NextResponse.json(
      { error: 'Failed to record query performance' },
      { status: 500 }
    );
  }
}
