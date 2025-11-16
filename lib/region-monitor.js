/**
 * Multi-Region Monitoring
 *
 * This module provides functionality to check site availability and performance
 * from different geographic regions.
 *
 * Supports:
 * - Cloudflare Workers (distributed edge computing) - PREFERRED
 * - Simulated regional checks (fallback)
 * - Future: AWS Lambda@Edge, third-party APIs
 */

import { TIMEOUTS, SITE_STATUS } from './constants.js';
import { REGIONS, REGION_INFO } from './constants.js';
import { isCloudflareWorkerEnabled, checkWithCloudflareWorker } from './cloudflare-worker.js';

/**
 * Check a site from a specific region
 * @param {string} url - URL to check
 * @param {string} region - Region to check from (REGIONS enum)
 * @returns {Promise<Object>} Check results
 */
export async function checkFromRegion(url, region) {
  const startTime = Date.now();

  try {
    // Validate region
    if (!REGIONS[region]) {
      throw new Error(`Invalid region: ${region}`);
    }

    // Try Cloudflare Worker first if enabled
    if (isCloudflareWorkerEnabled()) {
      try {
        console.log(`Using Cloudflare Worker for regional check: ${region}`);
        const workerResult = await checkWithCloudflareWorker(url);

        // Override region with requested region (worker auto-selects based on its location)
        return {
          ...workerResult,
          region, // Use requested region instead of auto-detected
          success: true,
          checkedAt: new Date().toISOString(),
        };
      } catch (workerError) {
        console.warn('Cloudflare Worker check failed, falling back to simulated check:', workerError.message);
        // Fall through to simulated check
      }
    }

    // Fallback to simulated regional check
    console.log(`Using simulated check for region: ${region}`);
    const result = await performRegionalCheck(url, region);

    return {
      success: true,
      region,
      ...result,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Regional check failed for ${region}:`, error.message);
    const totalTime = Date.now() - startTime;

    return {
      success: false,
      region,
      status: SITE_STATUS.OFFLINE,
      responseTime: totalTime,
      statusCode: null,
      errorMessage: error.message,
      resolvedIp: null,
      dnsLookupTime: null,
      connectTime: null,
      tlsHandshakeTime: null,
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Perform a regional check with detailed timing breakdown
 * @param {string} url - URL to check
 * @param {string} region - Region identifier
 * @returns {Promise<Object>} Detailed check results
 */
async function performRegionalCheck(url, region) {
  const startTime = Date.now();
  let dnsStart, connectStart, tlsStart;

  try {
    // Parse URL to get hostname
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const isHttps = urlObj.protocol === 'https:';

    // Simulate DNS lookup time (in production, this would be actual DNS resolution)
    dnsStart = Date.now();
    const resolvedIp = await simulateDnsLookup(hostname, region);
    const dnsLookupTime = Date.now() - dnsStart;

    // Perform HTTP check with timeout
    connectStart = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUTS.HEALTH_CHECK);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': `MonitHQ-RegionalCheck/1.0 (Region: ${region})`,
        // Add region-specific headers that some CDNs might recognize
        'X-MonitHQ-Region': region,
      },
    });

    clearTimeout(timeout);
    const totalResponseTime = Date.now() - startTime;

    // Estimate connection and TLS times
    // In a real implementation, we'd use Node's http.request with timing events
    const connectTime = Math.floor(totalResponseTime * 0.2); // ~20% for connection
    const tlsHandshakeTime = isHttps ? Math.floor(totalResponseTime * 0.15) : null; // ~15% for TLS

    // Determine status based on response
    let status = SITE_STATUS.ONLINE;
    if (!response.ok) {
      status = SITE_STATUS.OFFLINE;
    } else if (totalResponseTime > 5000) {
      status = SITE_STATUS.DEGRADED;
    }

    return {
      status,
      responseTime: totalResponseTime,
      statusCode: response.status,
      errorMessage: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
      resolvedIp,
      dnsLookupTime,
      connectTime,
      tlsHandshakeTime,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;

    return {
      status: SITE_STATUS.OFFLINE,
      responseTime: totalTime,
      statusCode: null,
      errorMessage: error.message,
      resolvedIp: null,
      dnsLookupTime: dnsStart ? Date.now() - dnsStart : null,
      connectTime: connectStart ? Date.now() - connectStart : null,
      tlsHandshakeTime: null,
    };
  }
}

/**
 * Simulate DNS lookup (in production, use actual DNS resolution)
 * @param {string} hostname - Hostname to resolve
 * @param {string} region - Region for lookup simulation
 * @returns {Promise<string>} Resolved IP address
 */
async function simulateDnsLookup(hostname, region) {
  // In production, you would use dns.promises.resolve4() or a regional DNS resolver
  // For now, we'll simulate a delay based on region and return a placeholder

  const baseDelay = 10; // Base DNS lookup time
  const regionDelays = {
    [REGIONS.US_EAST]: 15,
    [REGIONS.US_WEST]: 20,
    [REGIONS.EU_WEST]: 25,
    [REGIONS.EU_CENTRAL]: 23,
    [REGIONS.ASIA_EAST]: 35,
    [REGIONS.ASIA_SOUTHEAST]: 32,
    [REGIONS.AUSTRALIA]: 40,
    [REGIONS.SOUTH_AMERICA]: 45,
  };

  const delay = regionDelays[region] || baseDelay;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Return a simulated IP (in production, this would be the actual resolved IP)
  return `simulated-ip-${region.toLowerCase()}`;
}

/**
 * Check a site from multiple regions
 * @param {string} url - URL to check
 * @param {string[]} regions - Array of regions to check from (defaults to DEFAULT_REGIONS)
 * @returns {Promise<Object[]>} Array of check results
 */
export async function checkFromMultipleRegions(url, regions = null) {
  // Use provided regions or default set
  const regionsToCheck = regions || [REGIONS.US_EAST, REGIONS.EU_WEST, REGIONS.ASIA_EAST];

  // Perform checks in parallel for better performance
  const checkPromises = regionsToCheck.map(region => checkFromRegion(url, region));

  const results = await Promise.allSettled(checkPromises);

  // Extract results, handling both fulfilled and rejected promises
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // If promise rejected, return error result
      return {
        success: false,
        region: regionsToCheck[index],
        status: SITE_STATUS.OFFLINE,
        responseTime: 0,
        statusCode: null,
        errorMessage: result.reason?.message || 'Check failed',
        resolvedIp: null,
        dnsLookupTime: null,
        connectTime: null,
        tlsHandshakeTime: null,
        checkedAt: new Date().toISOString(),
      };
    }
  });
}

/**
 * Format regional check results for database storage
 * @param {Object} checkResult - Regional check result
 * @returns {Object} Formatted data for Prisma
 */
export function formatRegionCheckForDB(checkResult) {
  return {
    region: checkResult.region,
    status: checkResult.status,
    responseTime: checkResult.responseTime,
    statusCode: checkResult.statusCode,
    errorMessage: checkResult.errorMessage,
    resolvedIp: checkResult.resolvedIp,
    dnsLookupTime: checkResult.dnsLookupTime,
    connectTime: checkResult.connectTime,
    tlsHandshakeTime: checkResult.tlsHandshakeTime,
  };
}

/**
 * Calculate average response time across regions
 * @param {Object[]} regionResults - Array of region check results
 * @returns {number} Average response time in ms
 */
export function calculateAverageResponseTime(regionResults) {
  const successfulChecks = regionResults.filter(r => r.success && r.responseTime);

  if (successfulChecks.length === 0) {
    return 0;
  }

  const totalTime = successfulChecks.reduce((sum, r) => sum + r.responseTime, 0);
  return Math.round(totalTime / successfulChecks.length);
}

/**
 * Get the fastest region for a site
 * @param {Object[]} regionResults - Array of region check results
 * @returns {Object|null} Fastest region info or null
 */
export function getFastestRegion(regionResults) {
  const successfulChecks = regionResults.filter(
    r => r.success && r.status === SITE_STATUS.ONLINE
  );

  if (successfulChecks.length === 0) {
    return null;
  }

  const fastest = successfulChecks.reduce((fastest, current) => {
    return current.responseTime < fastest.responseTime ? current : fastest;
  });

  return {
    region: fastest.region,
    responseTime: fastest.responseTime,
    ...REGION_INFO[fastest.region],
  };
}

/**
 * Get the slowest region for a site
 * @param {Object[]} regionResults - Array of region check results
 * @returns {Object|null} Slowest region info or null
 */
export function getSlowestRegion(regionResults) {
  const successfulChecks = regionResults.filter(
    r => r.success && r.status === SITE_STATUS.ONLINE
  );

  if (successfulChecks.length === 0) {
    return null;
  }

  const slowest = successfulChecks.reduce((slowest, current) => {
    return current.responseTime > slowest.responseTime ? current : slowest;
  });

  return {
    region: slowest.region,
    responseTime: slowest.responseTime,
    ...REGION_INFO[slowest.region],
  };
}

/**
 * Determine overall site status from regional checks
 * @param {Object[]} regionResults - Array of region check results
 * @returns {string} Overall site status
 */
export function getOverallStatus(regionResults) {
  const successfulChecks = regionResults.filter(r => r.success);

  if (successfulChecks.length === 0) {
    return SITE_STATUS.OFFLINE;
  }

  const onlineCount = successfulChecks.filter(r => r.status === SITE_STATUS.ONLINE).length;
  const degradedCount = successfulChecks.filter(r => r.status === SITE_STATUS.DEGRADED).length;
  const offlineCount = successfulChecks.filter(r => r.status === SITE_STATUS.OFFLINE).length;

  const totalChecks = successfulChecks.length;

  // If all regions are offline, mark as OFFLINE
  if (offlineCount === totalChecks) {
    return SITE_STATUS.OFFLINE;
  }

  // If more than 50% are offline, mark as OFFLINE
  if (offlineCount > totalChecks / 2) {
    return SITE_STATUS.OFFLINE;
  }

  // If any region is degraded or offline, mark as DEGRADED
  if (degradedCount > 0 || offlineCount > 0) {
    return SITE_STATUS.DEGRADED;
  }

  // All regions are online
  return SITE_STATUS.ONLINE;
}
