/**
 * Cloudflare Worker: Multi-Region Site Monitor
 *
 * This worker runs on Cloudflare's edge network and performs
 * site checks from the requesting region.
 *
 * Deploy to: workers.cloudflare.com
 * Route: https://monitor.yourdomain.workers.dev
 */

// Allowed origins (CORS)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://monithq.com',
  'https://www.monithq.com',
  // Add your production domain
];

// API key for authentication (set in worker environment variables)
// const API_SECRET = MONITHQ_API_SECRET; // From environment

/**
 * Handle incoming requests
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 */
async function handleRequest(request) {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Verify API key
    const apiKey = request.headers.get('X-MonitHQ-API-Key');
    if (!apiKey || apiKey !== MONITHQ_API_SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Parse request body
    const body = await request.json();
    const { url, timeout = 10000 } = body;

    if (!url) {
      return jsonResponse({ error: 'URL is required' }, 400);
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return jsonResponse({ error: 'Invalid URL' }, 400);
    }

    // Get Cloudflare region information
    const cfData = request.cf || {};
    const region = cfData.colo || 'UNKNOWN'; // Cloudflare colo/datacenter code
    const city = cfData.city || 'Unknown';
    const country = cfData.country || 'Unknown';
    const continent = cfData.continent || 'Unknown';
    const latitude = cfData.latitude;
    const longitude = cfData.longitude;

    // Perform the check
    const checkResult = await performCheck(url, timeout);

    // Return results with regional metadata
    return jsonResponse({
      success: true,
      region: {
        colo: region,        // Cloudflare datacenter code (e.g., 'SJC', 'FRA', 'NRT')
        city,
        country,
        continent,
        latitude,
        longitude,
      },
      check: checkResult,
      timestamp: new Date().toISOString(),
      workerTimestamp: Date.now(),
    }, 200, request);

  } catch (error) {
    console.error('Worker error:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error.message
      },
      500,
      request
    );
  }
}

/**
 * Perform a site check with detailed timing
 */
async function performCheck(url, timeout) {
  const startTime = Date.now();
  const timings = {
    dnsStart: null,
    dnsEnd: null,
    connectStart: null,
    connectEnd: null,
    tlsStart: null,
    tlsEnd: null,
    requestStart: null,
    requestEnd: null,
  };

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    timings.requestStart = Date.now();

    // Perform the fetch
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'MonitHQ-CloudflareWorker/1.0',
      },
      // Use cf property for additional control
      cf: {
        cacheTtl: 0, // Don't cache
        cacheEverything: false,
      },
    });

    clearTimeout(timeoutId);
    timings.requestEnd = Date.now();

    const totalResponseTime = timings.requestEnd - startTime;

    // Get resolved IP (if available in response headers)
    const resolvedIp = response.headers.get('cf-connecting-ip') ||
                       response.headers.get('x-forwarded-for') ||
                       null;

    // Estimate timing breakdown (Cloudflare Workers don't expose detailed timing)
    // In production, these would come from performance APIs
    const estimatedTimings = estimateTimingBreakdown(totalResponseTime, url);

    // Determine status
    let status = 'ONLINE';
    let errorMessage = null;

    if (!response.ok) {
      status = 'OFFLINE';
      errorMessage = `HTTP ${response.status} ${response.statusText}`;
    } else if (totalResponseTime > 5000) {
      status = 'DEGRADED';
    }

    return {
      success: true,
      status,
      responseTime: totalResponseTime,
      statusCode: response.status,
      errorMessage,
      resolvedIp,
      timings: {
        dns: estimatedTimings.dns,
        connect: estimatedTimings.connect,
        tls: estimatedTimings.tls,
        total: totalResponseTime,
      },
      headers: Object.fromEntries(response.headers),
    };

  } catch (error) {
    const totalTime = Date.now() - startTime;

    return {
      success: false,
      status: 'OFFLINE',
      responseTime: totalTime,
      statusCode: null,
      errorMessage: error.message,
      resolvedIp: null,
      timings: {
        dns: null,
        connect: null,
        tls: null,
        total: totalTime,
      },
      headers: {},
    };
  }
}

/**
 * Estimate timing breakdown (approximation)
 * In production, you'd use Performance APIs or actual measurements
 */
function estimateTimingBreakdown(totalTime, url) {
  const isHttps = url.startsWith('https://');

  return {
    dns: Math.floor(totalTime * 0.15),      // ~15% for DNS
    connect: Math.floor(totalTime * 0.20),   // ~20% for TCP connection
    tls: isHttps ? Math.floor(totalTime * 0.15) : null, // ~15% for TLS if HTTPS
  };
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');

  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-MonitHQ-API-Key',
    'Access-Control-Max-Age': '86400',
  };

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200, request = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add CORS headers
  if (request) {
    const origin = request.headers.get('Origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers,
  });
}
