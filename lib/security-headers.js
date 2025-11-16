/**
 * Security Headers Monitoring
 *
 * This module provides functionality to check and analyze security headers
 * for websites, calculate security scores, and provide recommendations.
 */

import {
  SECURITY_HEADERS,
  SECURITY_GRADES,
  SECURITY_WEIGHTS,
  SECURITY_RECOMMENDATIONS,
} from './constants.js';

/**
 * Check security headers for a given URL
 * @param {string} url - The URL to check
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<Object>} Security check results
 */
export async function checkSecurityHeaders(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'MonitHQ Security Scanner/1.0',
      },
    });

    clearTimeout(timeoutId);

    // Extract all headers
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Analyze security headers
    const analysis = analyzeSecurityHeaders(headers);

    return {
      success: true,
      ...analysis,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Security headers check failed:', error);
    return {
      success: false,
      error: error.message,
      securityScore: 0,
      grade: 'F',
      issues: ['Failed to fetch security headers'],
      recommendations: [SECURITY_RECOMMENDATIONS.CONNECTION_FAILED.recommendation],
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Analyze security headers and calculate score
 * @param {Object} headers - HTTP headers object
 * @returns {Object} Analysis results
 */
function analyzeSecurityHeaders(headers) {
  const results = {
    // HSTS
    hasHSTS: false,
    hstsMaxAge: null,
    hstsIncludesSubdomains: false,

    // CSP
    hasCSP: false,
    cspPolicy: null,

    // X-Frame-Options
    hasXFrameOptions: false,
    xFrameOptions: null,

    // X-Content-Type-Options
    hasXContentType: false,

    // X-XSS-Protection
    hasXXSSProtection: false,

    // Referrer-Policy
    hasReferrerPolicy: false,
    referrerPolicy: null,

    // Permissions-Policy
    hasPermissionsPolicy: false,

    // Issues and recommendations
    issues: [],
    recommendations: [],
  };

  // Check HSTS
  const hsts = headers[SECURITY_HEADERS.HSTS.toLowerCase()];
  if (hsts) {
    results.hasHSTS = true;

    // Parse max-age
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    if (maxAgeMatch) {
      results.hstsMaxAge = parseInt(maxAgeMatch[1], 10);

      // Check if max-age is sufficient (recommended: 1 year = 31536000)
      if (results.hstsMaxAge < 31536000) {
        results.issues.push('HSTS max-age is less than 1 year');
        results.recommendations.push(SECURITY_RECOMMENDATIONS.WEAK_HSTS.recommendation);
      }
    }

    // Check includeSubDomains
    results.hstsIncludesSubdomains = /includeSubDomains/i.test(hsts);
    if (!results.hstsIncludesSubdomains) {
      results.recommendations.push(SECURITY_RECOMMENDATIONS.HSTS_SUBDOMAINS.recommendation);
    }
  } else {
    results.issues.push('Missing HSTS header');
    results.recommendations.push(SECURITY_RECOMMENDATIONS.NO_HSTS.recommendation);
  }

  // Check CSP
  const csp = headers[SECURITY_HEADERS.CSP.toLowerCase()];
  if (csp) {
    results.hasCSP = true;
    results.cspPolicy = csp;

    // Check for unsafe directives
    if (/unsafe-inline|unsafe-eval/i.test(csp)) {
      results.issues.push('CSP contains unsafe directives (unsafe-inline or unsafe-eval)');
      results.recommendations.push(SECURITY_RECOMMENDATIONS.WEAK_CSP.recommendation);
    }

    // Check if too permissive
    if (/\*/i.test(csp) && !/nonce-|sha256-|sha384-|sha512-/i.test(csp)) {
      results.issues.push('CSP uses wildcard (*) without nonces or hashes');
      results.recommendations.push(SECURITY_RECOMMENDATIONS.CSP_WILDCARD.recommendation);
    }
  } else {
    results.issues.push('Missing Content-Security-Policy header');
    results.recommendations.push(SECURITY_RECOMMENDATIONS.NO_CSP.recommendation);
  }

  // Check X-Frame-Options
  const xFrameOptions = headers[SECURITY_HEADERS.X_FRAME_OPTIONS.toLowerCase()];
  if (xFrameOptions) {
    results.hasXFrameOptions = true;
    results.xFrameOptions = xFrameOptions;

    // Validate value
    if (!/(DENY|SAMEORIGIN)/i.test(xFrameOptions)) {
      results.issues.push('X-Frame-Options has invalid value');
      results.recommendations.push(SECURITY_RECOMMENDATIONS.INVALID_X_FRAME.recommendation);
    }
  } else {
    results.issues.push('Missing X-Frame-Options header');
    results.recommendations.push(SECURITY_RECOMMENDATIONS.NO_X_FRAME_OPTIONS.recommendation);
  }

  // Check X-Content-Type-Options
  const xContentType = headers[SECURITY_HEADERS.X_CONTENT_TYPE_OPTIONS.toLowerCase()];
  if (xContentType && /nosniff/i.test(xContentType)) {
    results.hasXContentType = true;
  } else {
    results.issues.push('Missing or invalid X-Content-Type-Options header');
    results.recommendations.push(SECURITY_RECOMMENDATIONS.NO_X_CONTENT_TYPE.recommendation);
  }

  // Check X-XSS-Protection (deprecated but still good to have)
  const xXSSProtection = headers[SECURITY_HEADERS.X_XSS_PROTECTION.toLowerCase()];
  if (xXSSProtection && /1/.test(xXSSProtection)) {
    results.hasXXSSProtection = true;
  } else {
    results.issues.push('Missing or disabled X-XSS-Protection header');
    results.recommendations.push(SECURITY_RECOMMENDATIONS.NO_X_XSS_PROTECTION.recommendation);
  }

  // Check Referrer-Policy
  const referrerPolicy = headers[SECURITY_HEADERS.REFERRER_POLICY.toLowerCase()];
  if (referrerPolicy) {
    results.hasReferrerPolicy = true;
    results.referrerPolicy = referrerPolicy;

    // Check for secure policies
    const securePolicies = [
      'no-referrer',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
    ];

    if (!securePolicies.some(policy => referrerPolicy.toLowerCase().includes(policy))) {
      results.issues.push('Referrer-Policy is not secure');
      results.recommendations.push(SECURITY_RECOMMENDATIONS.WEAK_REFERRER_POLICY.recommendation);
    }
  } else {
    results.issues.push('Missing Referrer-Policy header');
    results.recommendations.push(SECURITY_RECOMMENDATIONS.NO_REFERRER_POLICY.recommendation);
  }

  // Check Permissions-Policy (formerly Feature-Policy)
  const permissionsPolicy = headers[SECURITY_HEADERS.PERMISSIONS_POLICY.toLowerCase()];
  const featurePolicy = headers['feature-policy'];
  if (permissionsPolicy || featurePolicy) {
    results.hasPermissionsPolicy = true;
  } else {
    results.recommendations.push(SECURITY_RECOMMENDATIONS.NO_PERMISSIONS_POLICY.recommendation);
  }

  // Calculate security score
  const { score, grade } = calculateSecurityScore(results);
  results.securityScore = score;
  results.grade = grade;

  return results;
}

/**
 * Calculate security score based on header analysis
 * @param {Object} results - Security analysis results
 * @returns {Object} Score and grade
 */
function calculateSecurityScore(results) {
  let score = 0;

  // HSTS (25 points)
  if (results.hasHSTS) {
    score += SECURITY_WEIGHTS.HSTS;
    if (results.hstsMaxAge >= 31536000) {
      score += 5; // Bonus for 1 year+
    }
    if (results.hstsIncludesSubdomains) {
      score += 5; // Bonus for includeSubDomains
    }
  }

  // CSP (25 points)
  if (results.hasCSP) {
    score += SECURITY_WEIGHTS.CSP;
    // Deduct points for unsafe directives
    if (results.cspPolicy && /unsafe-inline|unsafe-eval/i.test(results.cspPolicy)) {
      score -= 10;
    }
  }

  // X-Frame-Options (15 points)
  if (results.hasXFrameOptions) {
    score += SECURITY_WEIGHTS.X_FRAME_OPTIONS;
  }

  // X-Content-Type-Options (15 points)
  if (results.hasXContentType) {
    score += SECURITY_WEIGHTS.X_CONTENT_TYPE_OPTIONS;
  }

  // X-XSS-Protection (10 points)
  if (results.hasXXSSProtection) {
    score += SECURITY_WEIGHTS.X_XSS_PROTECTION;
  }

  // Referrer-Policy (5 points)
  if (results.hasReferrerPolicy) {
    score += SECURITY_WEIGHTS.REFERRER_POLICY;
  }

  // Permissions-Policy (5 points)
  if (results.hasPermissionsPolicy) {
    score += SECURITY_WEIGHTS.PERMISSIONS_POLICY;
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Calculate grade
  const grade = getSecurityGrade(score);

  return { score, grade };
}

/**
 * Get security grade based on score
 * @param {number} score - Security score (0-100)
 * @returns {string} Grade (A+, A, B, C, D, F)
 */
function getSecurityGrade(score) {
  for (const [key, gradeInfo] of Object.entries(SECURITY_GRADES)) {
    if (score >= gradeInfo.min && score <= gradeInfo.max) {
      return gradeInfo.label;
    }
  }
  return 'F';
}

/**
 * Get color class for security score
 * @param {number} score - Security score (0-100)
 * @returns {string} Tailwind color class
 */
export function getSecurityScoreColor(score) {
  for (const gradeInfo of Object.values(SECURITY_GRADES)) {
    if (score >= gradeInfo.min && score <= gradeInfo.max) {
      return gradeInfo.bgColor;
    }
  }
  return SECURITY_GRADES.F.bgColor;
}

/**
 * Format security check results for database storage
 * @param {Object} results - Security check results
 * @returns {Object} Formatted data for Prisma
 */
export function formatSecurityCheckForDB(results) {
  return {
    hasHSTS: results.hasHSTS || false,
    hstsMaxAge: results.hstsMaxAge,
    hstsIncludesSubdomains: results.hstsIncludesSubdomains || false,
    hasCSP: results.hasCSP || false,
    cspPolicy: results.cspPolicy,
    hasXFrameOptions: results.hasXFrameOptions || false,
    xFrameOptions: results.xFrameOptions,
    hasXContentType: results.hasXContentType || false,
    hasXXSSProtection: results.hasXXSSProtection || false,
    hasReferrerPolicy: results.hasReferrerPolicy || false,
    referrerPolicy: results.referrerPolicy,
    hasPermissionsPolicy: results.hasPermissionsPolicy || false,
    securityScore: results.securityScore || 0,
    grade: results.grade || 'F',
    issues: results.issues || [],
    recommendations: results.recommendations || [],
  };
}
