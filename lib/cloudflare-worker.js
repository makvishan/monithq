/**
 * Cloudflare Worker Client
 *
 * Client library for interacting with MonitHQ Cloudflare Workers
 * for multi-region monitoring.
 */

import { REGIONS } from './constants.js';

// Worker configuration
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
const WORKER_API_SECRET = process.env.CLOUDFLARE_WORKER_API_SECRET;

// Cloudflare datacenter (colo) to MonitHQ region mapping
const COLO_TO_REGION = {
  // US East
  IAD: REGIONS.US_EAST,
  JFK: REGIONS.US_EAST,
  EWR: REGIONS.US_EAST,
  BOS: REGIONS.US_EAST,
  ATL: REGIONS.US_EAST,
  MIA: REGIONS.US_EAST,
  DFW: REGIONS.US_EAST,
  IAH: REGIONS.US_EAST,
  ORD: REGIONS.US_EAST,

  // US West
  SJC: REGIONS.US_WEST,
  LAX: REGIONS.US_WEST,
  SEA: REGIONS.US_WEST,
  SFO: REGIONS.US_WEST,
  PDX: REGIONS.US_WEST,
  PHX: REGIONS.US_WEST,
  DEN: REGIONS.US_WEST,

  // EU West
  DUB: REGIONS.EU_WEST,
  LHR: REGIONS.EU_WEST,
  MAN: REGIONS.EU_WEST,
  AMS: REGIONS.EU_WEST,
  CDG: REGIONS.EU_WEST,

  // EU Central
  FRA: REGIONS.EU_CENTRAL,
  MUC: REGIONS.EU_CENTRAL,
  VIE: REGIONS.EU_CENTRAL,
  ZRH: REGIONS.EU_CENTRAL,
  WAW: REGIONS.EU_CENTRAL,
  PRG: REGIONS.EU_CENTRAL,

  // Asia East
  NRT: REGIONS.ASIA_EAST,
  HND: REGIONS.ASIA_EAST,
  KIX: REGIONS.ASIA_EAST,
  ICN: REGIONS.ASIA_EAST,
  TPE: REGIONS.ASIA_EAST,
  HKG: REGIONS.ASIA_EAST,

  // Asia Southeast
  SIN: REGIONS.ASIA_SOUTHEAST,
  KUL: REGIONS.ASIA_SOUTHEAST,
  BKK: REGIONS.ASIA_SOUTHEAST,
  CGK: REGIONS.ASIA_SOUTHEAST,
  MNL: REGIONS.ASIA_SOUTHEAST,

  // Australia
  SYD: REGIONS.AUSTRALIA,
  MEL: REGIONS.AUSTRALIA,
  PER: REGIONS.AUSTRALIA,
  BNE: REGIONS.AUSTRALIA,
  ADL: REGIONS.AUSTRALIA,

  // South America
  GRU: REGIONS.SOUTH_AMERICA,
  SCL: REGIONS.SOUTH_AMERICA,
  BOG: REGIONS.SOUTH_AMERICA,
  EZE: REGIONS.SOUTH_AMERICA,
  LIM: REGIONS.SOUTH_AMERICA,
};

/**
 * Check if Cloudflare Worker is configured
 * @returns {boolean}
 */
export function isCloudflareWorkerEnabled() {
  return !!(WORKER_URL && WORKER_API_SECRET);
}

/**
 * Perform a site check using Cloudflare Worker
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Check result
 */
export async function checkWithCloudflareWorker(url, timeout = 10000) {
  if (!isCloudflareWorkerEnabled()) {
    throw new Error('Cloudflare Worker not configured');
  }

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MonitHQ-API-Key': WORKER_API_SECRET,
      },
      body: JSON.stringify({
        url,
        timeout,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Transform Cloudflare response to MonitHQ format
    return transformWorkerResponse(data);
  } catch (error) {
    console.error('Cloudflare Worker check failed:', error);
    throw error;
  }
}

/**
 * Transform Cloudflare Worker response to MonitHQ format
 * @param {Object} workerResponse - Response from Cloudflare Worker
 * @returns {Object} Transformed response
 */
function transformWorkerResponse(workerResponse) {
  const { region: cfRegion, check, timestamp } = workerResponse;

  // Map Cloudflare colo to MonitHQ region
  const monithqRegion = COLO_TO_REGION[cfRegion.colo] || REGIONS.US_EAST;

  return {
    success: check.success,
    region: monithqRegion,
    status: check.status,
    responseTime: check.responseTime,
    statusCode: check.statusCode,
    errorMessage: check.errorMessage,
    resolvedIp: check.resolvedIp,
    dnsLookupTime: check.timings?.dns || null,
    connectTime: check.timings?.connect || null,
    tlsHandshakeTime: check.timings?.tls || null,
    checkedAt: timestamp,
    metadata: {
      cloudflare: {
        colo: cfRegion.colo,
        city: cfRegion.city,
        country: cfRegion.country,
        continent: cfRegion.continent,
        latitude: cfRegion.latitude,
        longitude: cfRegion.longitude,
      },
    },
  };
}

/**
 * Perform checks from multiple regions using regional proxies/VPNs
 * This requires additional infrastructure (proxy network, VPN endpoints, etc.)
 *
 * For production, consider:
 * - AWS Lambda@Edge in multiple regions
 * - Third-party monitoring APIs (Pingdom, StatusCake, etc.)
 * - Cloudflare Durable Objects with regional pinning
 * - Self-hosted monitoring nodes in different regions
 *
 * @param {string} url - URL to check
 * @param {string[]} regions - Regions to check from
 * @returns {Promise<Object[]>} Check results from all regions
 */
export async function checkFromMultipleRegionsWithWorker(url, regions) {
  // Note: Cloudflare Workers automatically route to the nearest datacenter
  // based on the requester's location. To check from specific regions,
  // you would need to:
  //
  // 1. Use regional proxy services
  // 2. Deploy separate workers with regional routing
  // 3. Use Cloudflare Durable Objects with location hints
  // 4. Integrate with third-party APIs that support regional checks
  //
  // For MVP, we'll perform a single check and note the automatic region

  console.warn('Multi-region checks with Cloudflare Workers require additional setup');
  console.warn('Current implementation performs check from worker\'s auto-selected region');

  const result = await checkWithCloudflareWorker(url);

  return [result];
}

/**
 * Map Cloudflare colo code to MonitHQ region
 * @param {string} colo - Cloudflare datacenter code
 * @returns {string} MonitHQ region
 */
export function mapColoToRegion(colo) {
  return COLO_TO_REGION[colo] || REGIONS.US_EAST;
}

/**
 * Get all Cloudflare colos for a MonitHQ region
 * @param {string} region - MonitHQ region
 * @returns {string[]} Array of Cloudflare colo codes
 */
export function getColosForRegion(region) {
  return Object.entries(COLO_TO_REGION)
    .filter(([colo, mappedRegion]) => mappedRegion === region)
    .map(([colo]) => colo);
}
