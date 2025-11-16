/**
 * DNS Monitoring
 *
 * This module provides functionality to monitor DNS records, detect changes,
 * and track DNS performance.
 *
 * Supports:
 * - A/AAAA records (IPv4/IPv6)
 * - CNAME records
 * - MX records (mail servers)
 * - NS records (nameservers)
 * - TXT records
 * - SOA records
 * - Change detection
 * - Performance tracking
 */

import { createHash } from 'crypto';

/**
 * Perform comprehensive DNS check
 * @param {string} hostname - Domain to check
 * @returns {Promise<Object>} DNS check results
 */
export async function performDnsCheck(hostname) {
  const startTime = Date.now();

  try {
    // Clean hostname (remove protocol, path, etc.)
    hostname = extractHostname(hostname);

    // Perform all DNS lookups in parallel
    const [
      aRecords,
      aaaaRecords,
      cnameRecords,
      mxRecords,
      nsRecords,
      txtRecords,
      soaRecord,
    ] = await Promise.allSettled([
      lookupA(hostname),
      lookupAAAA(hostname),
      lookupCNAME(hostname),
      lookupMX(hostname),
      lookupNS(hostname),
      lookupTXT(hostname),
      lookupSOA(hostname),
    ]);

    const resolutionTime = Date.now() - startTime;

    // Extract successful results
    const results = {
      hostname,
      resolutionTime,
      aRecords: aRecords.status === 'fulfilled' ? aRecords.value : [],
      aaaaRecords: aaaaRecords.status === 'fulfilled' ? aaaaRecords.value : [],
      cnameRecords: cnameRecords.status === 'fulfilled' ? cnameRecords.value : [],
      mxRecords: mxRecords.status === 'fulfilled' ? mxRecords.value : [],
      nsRecords: nsRecords.status === 'fulfilled' ? nsRecords.value : [],
      txtRecords: txtRecords.status === 'fulfilled' ? txtRecords.value : [],
      soaRecord: soaRecord.status === 'fulfilled' ? soaRecord.value : null,
      success: true,
      errorMessage: null,
    };

    // Calculate hash for change detection
    results.recordsHash = calculateRecordsHash(results);

    return results;
  } catch (error) {
    const resolutionTime = Date.now() - startTime;

    return {
      hostname,
      resolutionTime,
      aRecords: [],
      aaaaRecords: [],
      cnameRecords: [],
      mxRecords: [],
      nsRecords: [],
      txtRecords: [],
      soaRecord: null,
      success: false,
      errorMessage: error.message,
      recordsHash: null,
    };
  }
}

/**
 * Extract hostname from URL
 * @param {string} url - URL or hostname
 * @returns {string} Clean hostname
 */
function extractHostname(url) {
  try {
    // If it's a full URL, parse it
    if (url.includes('://')) {
      const urlObj = new URL(url);
      return urlObj.hostname;
    }

    // Otherwise, clean it
    return url.replace(/^www\./, '').trim();
  } catch (e) {
    // If URL parsing fails, return as-is
    return url.replace(/^www\./, '').trim();
  }
}

/**
 * Lookup A records (IPv4)
 * @param {string} hostname
 * @returns {Promise<string[]>}
 */
async function lookupA(hostname) {
  try {
    // Use DNS-over-HTTPS as fallback for edge runtime
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const data = await response.json();

    if (data.Answer) {
      return data.Answer
        .filter(record => record.type === 1) // A record
        .map(record => record.data);
    }

    return [];
  } catch (error) {
    console.warn(`A record lookup failed for ${hostname}:`, error.message);
    return [];
  }
}

/**
 * Lookup AAAA records (IPv6)
 * @param {string} hostname
 * @returns {Promise<string[]>}
 */
async function lookupAAAA(hostname) {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=AAAA`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const data = await response.json();

    if (data.Answer) {
      return data.Answer
        .filter(record => record.type === 28) // AAAA record
        .map(record => record.data);
    }

    return [];
  } catch (error) {
    console.warn(`AAAA record lookup failed for ${hostname}:`, error.message);
    return [];
  }
}

/**
 * Lookup CNAME records
 * @param {string} hostname
 * @returns {Promise<string[]>}
 */
async function lookupCNAME(hostname) {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=CNAME`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const data = await response.json();

    if (data.Answer) {
      return data.Answer
        .filter(record => record.type === 5) // CNAME record
        .map(record => record.data);
    }

    return [];
  } catch (error) {
    console.warn(`CNAME record lookup failed for ${hostname}:`, error.message);
    return [];
  }
}

/**
 * Lookup MX records (mail servers)
 * @param {string} hostname
 * @returns {Promise<Object[]>}
 */
async function lookupMX(hostname) {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=MX`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const data = await response.json();

    if (data.Answer) {
      return data.Answer
        .filter(record => record.type === 15) // MX record
        .map(record => {
          // MX data format: "10 mail.example.com"
          const parts = record.data.split(' ');
          return {
            priority: parseInt(parts[0], 10),
            exchange: parts.slice(1).join(' '),
          };
        });
    }

    return [];
  } catch (error) {
    console.warn(`MX record lookup failed for ${hostname}:`, error.message);
    return [];
  }
}

/**
 * Lookup NS records (nameservers)
 * @param {string} hostname
 * @returns {Promise<string[]>}
 */
async function lookupNS(hostname) {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=NS`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const data = await response.json();

    if (data.Answer) {
      return data.Answer
        .filter(record => record.type === 2) // NS record
        .map(record => record.data);
    }

    return [];
  } catch (error) {
    console.warn(`NS record lookup failed for ${hostname}:`, error.message);
    return [];
  }
}

/**
 * Lookup TXT records
 * @param {string} hostname
 * @returns {Promise<string[]>}
 */
async function lookupTXT(hostname) {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=TXT`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const data = await response.json();

    if (data.Answer) {
      return data.Answer
        .filter(record => record.type === 16) // TXT record
        .map(record => record.data.replace(/^"|"$/g, '')); // Remove quotes
    }

    return [];
  } catch (error) {
    console.warn(`TXT record lookup failed for ${hostname}:`, error.message);
    return [];
  }
}

/**
 * Lookup SOA record (Start of Authority)
 * @param {string} hostname
 * @returns {Promise<Object|null>}
 */
async function lookupSOA(hostname) {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=SOA`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    const data = await response.json();

    if (data.Answer && data.Answer.length > 0) {
      const soaData = data.Answer[0].data;
      // SOA format: "ns1.example.com admin.example.com 2024010101 3600 600 86400 300"
      const parts = soaData.split(' ');

      return {
        mname: parts[0], // Primary nameserver
        rname: parts[1], // Responsible party email
        serial: parseInt(parts[2], 10), // Serial number
        refresh: parseInt(parts[3], 10), // Refresh interval
        retry: parseInt(parts[4], 10), // Retry interval
        expire: parseInt(parts[5], 10), // Expire time
        minimum: parseInt(parts[6], 10), // Minimum TTL
      };
    }

    return null;
  } catch (error) {
    console.warn(`SOA record lookup failed for ${hostname}:`, error.message);
    return null;
  }
}

/**
 * Calculate hash of DNS records for change detection
 * @param {Object} dnsResults - DNS check results
 * @returns {string} SHA-256 hash
 */
function calculateRecordsHash(dnsResults) {
  const recordsData = {
    a: dnsResults.aRecords || [],
    aaaa: dnsResults.aaaaRecords || [],
    cname: dnsResults.cnameRecords || [],
    mx: dnsResults.mxRecords || [],
    ns: dnsResults.nsRecords || [],
    txt: dnsResults.txtRecords || [],
    soa: dnsResults.soaRecord || null,
  };

  const dataString = JSON.stringify(recordsData, Object.keys(recordsData).sort());
  return createHash('sha256').update(dataString).digest('hex');
}

/**
 * Compare two DNS check results to detect changes
 * @param {Object} current - Current DNS check
 * @param {Object} previous - Previous DNS check
 * @returns {Object} Change detection results
 */
export function detectDnsChanges(current, previous) {
  if (!previous) {
    return {
      hasChanges: false,
      changes: [],
    };
  }

  const changes = [];

  // Compare A records
  if (JSON.stringify(current.aRecords) !== JSON.stringify(previous.aRecords)) {
    changes.push({
      type: 'A',
      previous: previous.aRecords,
      current: current.aRecords,
    });
  }

  // Compare AAAA records
  if (JSON.stringify(current.aaaaRecords) !== JSON.stringify(previous.aaaaRecords)) {
    changes.push({
      type: 'AAAA',
      previous: previous.aaaaRecords,
      current: current.aaaaRecords,
    });
  }

  // Compare CNAME records
  if (JSON.stringify(current.cnameRecords) !== JSON.stringify(previous.cnameRecords)) {
    changes.push({
      type: 'CNAME',
      previous: previous.cnameRecords,
      current: current.cnameRecords,
    });
  }

  // Compare MX records
  if (JSON.stringify(current.mxRecords) !== JSON.stringify(previous.mxRecords)) {
    changes.push({
      type: 'MX',
      previous: previous.mxRecords,
      current: current.mxRecords,
    });
  }

  // Compare NS records
  if (JSON.stringify(current.nsRecords) !== JSON.stringify(previous.nsRecords)) {
    changes.push({
      type: 'NS',
      previous: previous.nsRecords,
      current: current.nsRecords,
    });
  }

  // Compare TXT records
  if (JSON.stringify(current.txtRecords) !== JSON.stringify(previous.txtRecords)) {
    changes.push({
      type: 'TXT',
      previous: previous.txtRecords,
      current: current.txtRecords,
    });
  }

  return {
    hasChanges: changes.length > 0,
    changes,
  };
}

/**
 * Format DNS check results for database storage
 * @param {Object} dnsResults - DNS check results
 * @param {Object|null} previousCheck - Previous DNS check for comparison
 * @returns {Object} Formatted data for Prisma
 */
export function formatDnsCheckForDB(dnsResults, previousCheck = null) {
  const changeDetection = previousCheck
    ? detectDnsChanges(dnsResults, previousCheck)
    : { hasChanges: false, changes: [] };

  return {
    hostname: dnsResults.hostname,
    resolutionTime: dnsResults.resolutionTime,
    aRecords: dnsResults.aRecords,
    aaaaRecords: dnsResults.aaaaRecords,
    cnameRecords: dnsResults.cnameRecords,
    mxRecords: dnsResults.mxRecords,
    nsRecords: dnsResults.nsRecords,
    txtRecords: dnsResults.txtRecords,
    soaRecord: dnsResults.soaRecord,
    nameservers: dnsResults.nsRecords, // Use NS records as nameservers
    recordsHash: dnsResults.recordsHash,
    changesDetected: changeDetection.hasChanges,
    previousHash: previousCheck?.recordsHash || null,
    success: dnsResults.success,
    errorMessage: dnsResults.errorMessage,
  };
}

/**
 * Get DNS record statistics
 * @param {Object} dnsResults - DNS check results
 * @returns {Object} Statistics
 */
export function getDnsStatistics(dnsResults) {
  return {
    totalRecords: [
      ...dnsResults.aRecords,
      ...dnsResults.aaaaRecords,
      ...dnsResults.cnameRecords,
      ...dnsResults.mxRecords,
      ...dnsResults.nsRecords,
      ...dnsResults.txtRecords,
    ].length,
    recordTypes: {
      A: dnsResults.aRecords.length,
      AAAA: dnsResults.aaaaRecords.length,
      CNAME: dnsResults.cnameRecords.length,
      MX: dnsResults.mxRecords.length,
      NS: dnsResults.nsRecords.length,
      TXT: dnsResults.txtRecords.length,
      SOA: dnsResults.soaRecord ? 1 : 0,
    },
    hasIPv6: dnsResults.aaaaRecords.length > 0,
    hasMailServers: dnsResults.mxRecords.length > 0,
    nameserverCount: dnsResults.nsRecords.length,
  };
}
