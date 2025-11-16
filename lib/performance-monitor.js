/**
 * Performance Monitoring
 *
 * This module provides functionality to monitor website performance metrics including:
 * - Time to First Byte (TTFB)
 * - Page load times
 * - Resource loading analysis
 * - Core Web Vitals estimation
 * - Performance scoring and recommendations
 */

/**
 * Perform comprehensive performance check
 * @param {string} url - URL to check
 * @returns {Promise<Object>} Performance check results
 */
export async function performPerformanceCheck(url) {
  const startTime = Date.now();

  try {
    // Normalize URL
    const normalizedUrl = normalizeUrl(url);

    // Perform timed HTTP request with detailed metrics
    const performanceData = await measurePerformance(normalizedUrl);

    // Analyze HTML response for resource insights
    const resourceAnalysis = await analyzeResources(performanceData.html, normalizedUrl);

    // Calculate performance score and grade
    const { score, grade } = calculatePerformanceScore(performanceData);

    // Generate issues and recommendations
    const issues = detectPerformanceIssues(performanceData, resourceAnalysis);
    const recommendations = generateRecommendations(performanceData, resourceAnalysis, issues);

    return {
      url: normalizedUrl,
      totalTime: performanceData.totalTime,
      dnsTime: performanceData.dnsTime,
      tcpTime: performanceData.tcpTime,
      tlsTime: performanceData.tlsTime,
      ttfb: performanceData.ttfb,
      downloadTime: performanceData.downloadTime,
      responseSize: performanceData.responseSize,
      transferSpeed: performanceData.transferSpeed,
      compression: performanceData.compression,
      statusCode: performanceData.statusCode,
      redirectCount: performanceData.redirectCount,
      redirectTime: performanceData.redirectTime,
      estimatedFCP: resourceAnalysis.estimatedFCP,
      estimatedLCP: resourceAnalysis.estimatedLCP,
      resourceCount: resourceAnalysis.resourceCount,
      resourceSizes: resourceAnalysis.resourceSizes,
      performanceScore: score,
      grade,
      issues,
      recommendations,
      success: true,
      errorMessage: null,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;

    return {
      url,
      totalTime,
      success: false,
      errorMessage: error.message,
    };
  }
}

/**
 * Normalize URL for consistency
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Measure performance metrics with detailed timing
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function measurePerformance(url) {
  const timings = {
    start: Date.now(),
    dnsLookup: null,
    tcpConnection: null,
    tlsHandshake: null,
    firstByte: null,
    contentTransfer: null,
    end: null,
  };

  let redirectCount = 0;
  let finalUrl = url;

  try {
    const response = await fetch(url, {
      redirect: 'follow',
    });

    timings.firstByte = Date.now();

    const html = await response.text();
    timings.end = Date.now();

    // Calculate timing breakdowns
    const totalTime = timings.end - timings.start;
    const downloadTime = timings.end - timings.firstByte;
    const ttfb = timings.firstByte - timings.start;

    // Estimate timing phases (approximations for edge runtime)
    const dnsTime = Math.max(Math.floor(ttfb * 0.1), 5);
    const tcpTime = Math.max(Math.floor(ttfb * 0.2), 10);
    const tlsTime = url.startsWith('https://') ? Math.max(Math.floor(ttfb * 0.3), 15) : 0;

    // Response size and transfer speed
    const responseSize = new Blob([html]).size;
    const transferSpeed = downloadTime > 0 ? (responseSize / 1024) / (downloadTime / 1000) : 0;

    // Check for compression
    const contentEncoding = response.headers.get('content-encoding');
    const compression = !!(contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('br') || contentEncoding.includes('deflate')));

    // Check for redirects
    if (response.redirected) {
      finalUrl = response.url;
      redirectCount = 1; // We can't get exact count in edge runtime
    }

    return {
      totalTime,
      dnsTime,
      tcpTime,
      tlsTime,
      ttfb,
      downloadTime,
      responseSize,
      transferSpeed,
      compression,
      statusCode: response.status,
      redirectCount,
      redirectTime: redirectCount > 0 ? Math.floor(ttfb * 0.2) : 0,
      html,
      finalUrl,
    };
  } catch (error) {
    throw new Error(`Performance measurement failed: ${error.message}`);
  }
}

/**
 * Analyze HTML content for resource insights
 * @param {string} html
 * @param {string} baseUrl
 * @returns {Object}
 */
function analyzeResources(html, baseUrl) {
  try {
    const resources = {
      scripts: [],
      stylesheets: [],
      images: [],
      fonts: [],
      other: [],
    };

    // Parse HTML for resource tags (simple regex-based parsing)
    const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["']/gi) || [];
    const linkMatches = html.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
    const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["']/gi) || [];

    resources.scripts = scriptMatches.length;

    // Differentiate stylesheets from other links
    const stylesheets = linkMatches.filter(link => link.includes('stylesheet'));
    const fonts = linkMatches.filter(link => link.includes('font'));
    resources.stylesheets = stylesheets.length;
    resources.fonts = fonts.length;

    resources.images = imgMatches.length;

    const totalResources = resources.scripts + resources.stylesheets + resources.images + resources.fonts;

    // Estimate Core Web Vitals (simplified)
    // FCP: First Contentful Paint - estimated based on critical resources
    const criticalResources = resources.stylesheets + Math.min(resources.scripts, 3);
    const estimatedFCP = 500 + (criticalResources * 100); // Base + blocking resources

    // LCP: Largest Contentful Paint - estimated based on images and total resources
    const estimatedLCP = estimatedFCP + 200 + (resources.images > 0 ? 300 : 0);

    // Estimate resource sizes (rough approximations)
    const resourceSizes = {
      scripts: resources.scripts * 50, // KB estimate
      stylesheets: resources.stylesheets * 30,
      images: resources.images * 100,
      fonts: resources.fonts * 40,
      total: (resources.scripts * 50) + (resources.stylesheets * 30) + (resources.images * 100) + (resources.fonts * 40),
    };

    return {
      resourceCount: totalResources,
      resourceBreakdown: resources,
      resourceSizes,
      estimatedFCP,
      estimatedLCP,
    };
  } catch (error) {
    console.warn('Resource analysis failed:', error.message);
    return {
      resourceCount: 0,
      resourceBreakdown: {},
      resourceSizes: {},
      estimatedFCP: null,
      estimatedLCP: null,
    };
  }
}

/**
 * Calculate overall performance score (0-100)
 * @param {Object} performanceData
 * @returns {Object} {score, grade}
 */
function calculatePerformanceScore(performanceData) {
  let score = 100;

  // TTFB scoring (40% weight)
  const ttfb = performanceData.ttfb || performanceData.totalTime;
  if (ttfb > 1800) score -= 40;
  else if (ttfb > 1200) score -= 30;
  else if (ttfb > 600) score -= 20;
  else if (ttfb > 300) score -= 10;

  // Download time scoring (30% weight)
  if (performanceData.downloadTime > 2000) score -= 30;
  else if (performanceData.downloadTime > 1500) score -= 20;
  else if (performanceData.downloadTime > 1000) score -= 15;
  else if (performanceData.downloadTime > 500) score -= 10;

  // Compression scoring (10% weight)
  if (!performanceData.compression) score -= 10;

  // Redirect scoring (10% weight)
  if (performanceData.redirectCount > 2) score -= 10;
  else if (performanceData.redirectCount > 0) score -= 5;

  // Response size scoring (10% weight)
  if (performanceData.responseSize > 500 * 1024) score -= 10; // > 500KB
  else if (performanceData.responseSize > 200 * 1024) score -= 5; // > 200KB

  score = Math.max(0, Math.min(100, score));

  // Calculate grade
  let grade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade };
}

/**
 * Detect performance issues
 * @param {Object} performanceData
 * @param {Object} resourceAnalysis
 * @returns {Array}
 */
function detectPerformanceIssues(performanceData, resourceAnalysis) {
  const issues = [];

  // Slow TTFB
  const ttfb = performanceData.ttfb || performanceData.totalTime;
  if (ttfb > 1200) {
    issues.push({
      severity: 'high',
      type: 'slow_ttfb',
      message: `Slow Time to First Byte (${ttfb}ms). Server response time should be under 600ms.`,
    });
  } else if (ttfb > 600) {
    issues.push({
      severity: 'medium',
      type: 'slow_ttfb',
      message: `Moderate Time to First Byte (${ttfb}ms). Consider optimizing server response time.`,
    });
  }

  // Large response size
  if (performanceData.responseSize > 500 * 1024) {
    issues.push({
      severity: 'high',
      type: 'large_response',
      message: `Large response size (${(performanceData.responseSize / 1024).toFixed(0)}KB). Consider minification and code splitting.`,
    });
  }

  // No compression
  if (!performanceData.compression) {
    issues.push({
      severity: 'medium',
      type: 'no_compression',
      message: 'Response is not compressed. Enable gzip or Brotli compression.',
    });
  }

  // Too many redirects
  if (performanceData.redirectCount > 1) {
    issues.push({
      severity: 'medium',
      type: 'multiple_redirects',
      message: `Multiple redirects detected (${performanceData.redirectCount}). Minimize redirect chains.`,
    });
  }

  // Slow download
  if (performanceData.downloadTime > 2000) {
    issues.push({
      severity: 'high',
      type: 'slow_download',
      message: `Slow content download (${performanceData.downloadTime}ms). Check network connectivity or CDN.`,
    });
  }

  // Too many resources
  if (resourceAnalysis.resourceCount > 100) {
    issues.push({
      severity: 'medium',
      type: 'many_resources',
      message: `High resource count (${resourceAnalysis.resourceCount}). Consider resource consolidation.`,
    });
  }

  // Poor estimated LCP
  if (resourceAnalysis.estimatedLCP > 2500) {
    issues.push({
      severity: 'high',
      type: 'slow_lcp',
      message: `Slow Largest Contentful Paint (~${resourceAnalysis.estimatedLCP}ms). Optimize critical rendering path.`,
    });
  }

  return issues;
}

/**
 * Generate performance recommendations
 * @param {Object} performanceData
 * @param {Object} resourceAnalysis
 * @param {Array} issues
 * @returns {Array}
 */
function generateRecommendations(performanceData, resourceAnalysis, issues) {
  const recommendations = [];

  // TTFB recommendations
  if (issues.some(i => i.type === 'slow_ttfb')) {
    recommendations.push({
      priority: 'high',
      category: 'server',
      title: 'Optimize Server Response Time',
      description: 'Use server-side caching, optimize database queries, or consider a CDN.',
    });
  }

  // Compression recommendations
  if (issues.some(i => i.type === 'no_compression')) {
    recommendations.push({
      priority: 'high',
      category: 'compression',
      title: 'Enable Compression',
      description: 'Configure your server to use gzip or Brotli compression for text-based resources.',
    });
  }

  // Redirect recommendations
  if (issues.some(i => i.type === 'multiple_redirects')) {
    recommendations.push({
      priority: 'medium',
      category: 'redirects',
      title: 'Minimize Redirects',
      description: 'Reduce redirect chains by updating links to point directly to final URLs.',
    });
  }

  // Resource optimization
  if (resourceAnalysis.resourceCount > 50) {
    recommendations.push({
      priority: 'medium',
      category: 'resources',
      title: 'Optimize Resource Loading',
      description: 'Bundle and minify CSS/JS files, use lazy loading for images, and implement code splitting.',
    });
  }

  // Image optimization
  if (resourceAnalysis.resourceBreakdown?.images > 10) {
    recommendations.push({
      priority: 'medium',
      category: 'images',
      title: 'Optimize Images',
      description: 'Use modern image formats (WebP, AVIF), implement responsive images, and lazy load below-the-fold images.',
    });
  }

  // CDN recommendation
  if (performanceData.ttfb > 800 || performanceData.downloadTime > 1500) {
    recommendations.push({
      priority: 'high',
      category: 'cdn',
      title: 'Use a Content Delivery Network',
      description: 'Distribute static assets via a CDN to reduce latency and improve global performance.',
    });
  }

  // Caching recommendation
  recommendations.push({
    priority: 'low',
    category: 'caching',
    title: 'Implement Browser Caching',
    description: 'Set appropriate cache headers for static resources to reduce repeat visits\' load times.',
  });

  return recommendations;
}

/**
 * Format performance check results for database storage
 * @param {Object} performanceResults
 * @returns {Object}
 */
export function formatPerformanceCheckForDB(performanceResults) {
  return {
    totalTime: performanceResults.totalTime,
    dnsTime: performanceResults.dnsTime,
    tcpTime: performanceResults.tcpTime,
    tlsTime: performanceResults.tlsTime,
    ttfb: performanceResults.ttfb,
    downloadTime: performanceResults.downloadTime,
    responseSize: performanceResults.responseSize,
    transferSpeed: performanceResults.transferSpeed,
    compression: performanceResults.compression,
    statusCode: performanceResults.statusCode,
    redirectCount: performanceResults.redirectCount,
    redirectTime: performanceResults.redirectTime,
    estimatedFCP: performanceResults.estimatedFCP,
    estimatedLCP: performanceResults.estimatedLCP,
    resourceCount: performanceResults.resourceCount,
    resourceSizes: performanceResults.resourceSizes,
    performanceScore: performanceResults.performanceScore,
    grade: performanceResults.grade,
    issues: performanceResults.issues,
    recommendations: performanceResults.recommendations,
    success: performanceResults.success,
    errorMessage: performanceResults.errorMessage,
  };
}

/**
 * Get performance statistics
 * @param {Object} performanceResult
 * @returns {Object}
 */
export function getPerformanceStatistics(performanceResult) {
  return {
    performanceScore: performanceResult.performanceScore,
    grade: performanceResult.grade,
    totalTime: performanceResult.totalTime,
    ttfb: performanceResult.ttfb,
    downloadTime: performanceResult.downloadTime,
    responseSize: performanceResult.responseSize,
    compression: performanceResult.compression,
    issueCount: performanceResult.issues?.length || 0,
    recommendationCount: performanceResult.recommendations?.length || 0,
    highSeverityIssues: performanceResult.issues?.filter(i => i.severity === 'high').length || 0,
  };
}

/**
 * Compare performance trends
 * @param {Array} checks - Array of performance checks ordered by time
 * @returns {Object}
 */
export function analyzePerformanceTrend(checks) {
  if (!checks || checks.length < 2) {
    return {
      trend: 'stable',
      scoreChange: 0,
      ttfbChange: 0,
    };
  }

  const latest = checks[0];
  const previous = checks[1];

  const scoreChange = (latest.performanceScore || 0) - (previous.performanceScore || 0);
  const ttfbChange = (latest.ttfb || 0) - (previous.ttfb || 0);

  let trend;
  if (scoreChange > 5) trend = 'improving';
  else if (scoreChange < -5) trend = 'degrading';
  else trend = 'stable';

  return {
    trend,
    scoreChange,
    ttfbChange,
    averageScore: checks.reduce((sum, c) => sum + (c.performanceScore || 0), 0) / checks.length,
    averageTTFB: checks.reduce((sum, c) => sum + (c.ttfb || 0), 0) / checks.length,
  };
}
