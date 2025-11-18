#!/usr/bin/env node

/**
 * Database Query Performance Agent
 *
 * Monitors database query performance and sends metrics to MonitHQ.
 *
 * This is a Prisma middleware that can be integrated into your application.
 *
 * Installation:
 *   Add this middleware to your Prisma client configuration
 *
 * Usage in your application:
 *   const { PrismaClient } = require('@prisma/client');
 *   const { queryPerformanceMiddleware } = require('./send-query-metrics');
 *
 *   const prisma = new PrismaClient();
 *   prisma.$use(queryPerformanceMiddleware);
 */

const crypto = require('crypto');

const SITE_ID = process.env.MONIT_SITE_ID;
const API_TOKEN = process.env.MONIT_API_TOKEN;
const API_URL = process.env.MONIT_API_URL || 'http://localhost:3000';
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'); // ms

function generateQueryHash(query) {
  return crypto.createHash('sha256').update(query).digest('hex').substring(0, 16);
}

async function sendQueryMetrics(metrics) {
  if (!SITE_ID || !API_TOKEN) {
    console.warn('MONIT_SITE_ID and MONIT_API_TOKEN not set, skipping query metrics');
    return;
  }

  try {
    await fetch(`${API_URL}/api/sites/${SITE_ID}/infrastructure/queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(metrics),
    });
  } catch (error) {
    console.error('Error sending query metrics:', error.message);
  }
}

/**
 * Prisma Middleware for Query Performance Monitoring
 *
 * Usage:
 *   prisma.$use(queryPerformanceMiddleware);
 */
async function queryPerformanceMiddleware(params, next) {
  const startTime = Date.now();

  try {
    const result = await next(params);
    const executionTime = Date.now() - startTime;

    // Only track queries that take longer than 100ms or are slow queries
    if (executionTime > 100 || executionTime > SLOW_QUERY_THRESHOLD) {
      const queryText = `${params.model}.${params.action}`;
      const queryHash = generateQueryHash(queryText);

      const metrics = {
        databaseType: 'prisma',
        databaseName: process.env.DATABASE_NAME,
        queryHash,
        queryText,
        queryType: params.action.toUpperCase(),
        executionTimeMs: executionTime,
        isSlowQuery: executionTime > SLOW_QUERY_THRESHOLD,
        slowQueryThreshold: SLOW_QUERY_THRESHOLD,
        queryCount: 1,
      };

      // Send asynchronously without blocking
      setImmediate(() => sendQueryMetrics(metrics));
    }

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Track failed queries
    const queryText = `${params.model}.${params.action}`;
    const queryHash = generateQueryHash(queryText);

    const metrics = {
      databaseType: 'prisma',
      queryHash,
      queryText,
      queryType: params.action.toUpperCase(),
      executionTimeMs: executionTime,
      isSlowQuery: true,
      slowQueryThreshold: SLOW_QUERY_THRESHOLD,
      healthy: false,
      issues: [{
        type: 'error',
        severity: 'error',
        message: error.message,
      }],
    };

    setImmediate(() => sendQueryMetrics(metrics));

    throw error;
  }
}

/**
 * Manual Query Tracking (for non-Prisma databases)
 *
 * Usage:
 *   const tracker = new QueryPerformanceTracker('postgres', 'mydb');
 *   await tracker.trackQuery('SELECT * FROM users WHERE id = ?', async () => {
 *     return await db.query('SELECT * FROM users WHERE id = ?', [userId]);
 *   });
 */
class QueryPerformanceTracker {
  constructor(databaseType, databaseName) {
    this.databaseType = databaseType;
    this.databaseName = databaseName;
  }

  async trackQuery(queryText, queryFn, options = {}) {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;

      const metrics = {
        databaseType: this.databaseType,
        databaseName: this.databaseName,
        queryHash: generateQueryHash(queryText),
        queryText: queryText.substring(0, 5000), // Truncate long queries
        queryType: this.extractQueryType(queryText),
        executionTimeMs: executionTime,
        rowsAffected: options.rowsAffected,
        rowsExamined: options.rowsExamined,
        isSlowQuery: executionTime > SLOW_QUERY_THRESHOLD,
        slowQueryThreshold: SLOW_QUERY_THRESHOLD,
        useIndex: options.useIndex,
        explainPlan: options.explainPlan,
        endpoint: options.endpoint,
        queryCount: 1,
      };

      if (executionTime > 100) {
        setImmediate(() => sendQueryMetrics(metrics));
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      const metrics = {
        databaseType: this.databaseType,
        databaseName: this.databaseName,
        queryHash: generateQueryHash(queryText),
        queryText: queryText.substring(0, 5000),
        queryType: this.extractQueryType(queryText),
        executionTimeMs: executionTime,
        isSlowQuery: true,
        healthy: false,
        issues: [{
          type: 'error',
          severity: 'error',
          message: error.message,
        }],
      };

      setImmediate(() => sendQueryMetrics(metrics));

      throw error;
    }
  }

  extractQueryType(queryText) {
    const firstWord = queryText.trim().split(/\s+/)[0].toUpperCase();
    if (['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'].includes(firstWord)) {
      return firstWord;
    }
    return 'OTHER';
  }
}

module.exports = {
  queryPerformanceMiddleware,
  QueryPerformanceTracker,
  sendQueryMetrics,
};

// Example usage as a standalone script (for testing)
if (require.main === module) {
  const testMetrics = {
    databaseType: 'postgres',
    databaseName: 'test_db',
    queryHash: 'abc123',
    queryText: 'SELECT * FROM users WHERE id = $1',
    queryType: 'SELECT',
    executionTimeMs: 1500,
    rowsAffected: 1,
    isSlowQuery: true,
    slowQueryThreshold: 1000,
  };

  console.log('📊 Sending test query metrics...');
  sendQueryMetrics(testMetrics).then(() => {
    console.log('✅ Test metrics sent');
  }).catch(error => {
    console.error('❌ Error:', error.message);
  });
}
