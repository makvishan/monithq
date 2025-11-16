/**
 * API Endpoint Monitoring
 *
 * This module provides functionality to monitor REST API endpoints
 * with support for custom headers, authentication, request bodies,
 * and response validation.
 */

import { TIMEOUTS, HTTP_STATUS_CODES } from './constants.js';

/**
 * Check an API endpoint
 * @param {Object} config - API endpoint configuration
 * @returns {Promise<Object>} Check results
 */
export async function checkApiEndpoint(config) {
  const {
    url,
    method = 'GET',
    headers = {},
    body = null,
    expectedStatus = [200],
    authType = null,
    authValue = null,
    validation = null,
    timeout = TIMEOUTS.HEALTH_CHECK,
  } = config;

  const startTime = Date.now();

  try {
    // Build request headers
    const requestHeaders = buildRequestHeaders(headers, authType, authValue);

    // Build request options
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions = {
      method,
      headers: requestHeaders,
      signal: controller.signal,
    };

    // Add body for POST, PUT, PATCH
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Make the request
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Get response body
    let responseBody = null;
    let responseHeaders = {};

    // Capture response headers
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Try to parse response body
    const contentType = response.headers.get('content-type');
    try {
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        const text = await response.text();
        // Truncate large responses
        responseBody = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
      }
    } catch (error) {
      console.warn('Failed to parse response body:', error);
    }

    // Validate status code
    const statusValid = expectedStatus.includes(response.status);

    // Validate response if validation rules provided
    const validationResult = validation
      ? validateResponse(responseBody, validation)
      : { passed: true, errors: [] };

    return {
      success: true,
      requestMethod: method,
      requestHeaders,
      requestBody: body,
      responseTime,
      statusCode: response.status,
      responseBody: typeof responseBody === 'object'
        ? responseBody
        : { _raw: responseBody },
      responseHeaders,
      validationPassed: statusValid && validationResult.passed,
      validationErrors: [
        ...(!statusValid ? [`Expected status code ${expectedStatus.join(' or ')}, got ${response.status}`] : []),
        ...validationResult.errors,
      ],
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      success: false,
      requestMethod: method,
      requestHeaders: headers,
      requestBody: body,
      responseTime,
      statusCode: 0,
      responseBody: null,
      responseHeaders: {},
      validationPassed: false,
      validationErrors: [],
      errorMessage: error.message || 'Request failed',
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Build request headers with authentication
 * @param {Object} customHeaders - Custom headers
 * @param {String} authType - Authentication type
 * @param {String} authValue - Authentication value
 * @returns {Object} Complete headers object
 */
function buildRequestHeaders(customHeaders, authType, authValue) {
  const headers = {
    'User-Agent': 'MonitHQ API Monitor/1.0',
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Add authentication header based on type
  if (authType && authValue) {
    switch (authType.toUpperCase()) {
      case 'BEARER':
        headers['Authorization'] = `Bearer ${authValue}`;
        break;
      case 'API_KEY':
        // Support common API key header patterns
        if (customHeaders['X-API-Key']) {
          headers['X-API-Key'] = authValue;
        } else if (customHeaders['API-Key']) {
          headers['API-Key'] = authValue;
        } else {
          headers['X-API-Key'] = authValue;
        }
        break;
      case 'BASIC':
        headers['Authorization'] = `Basic ${authValue}`;
        break;
      default:
        break;
    }
  }

  return headers;
}

/**
 * Validate API response against validation rules
 * @param {*} responseBody - Response body to validate
 * @param {Object} validation - Validation rules
 * @returns {Object} Validation result
 */
function validateResponse(responseBody, validation) {
  const errors = [];

  if (!validation || typeof validation !== 'object') {
    return { passed: true, errors: [] };
  }

  // JSON Schema validation (simple version)
  if (validation.schema) {
    const schemaErrors = validateJsonSchema(responseBody, validation.schema);
    errors.push(...schemaErrors);
  }

  // Field existence validation
  if (validation.requiredFields && Array.isArray(validation.requiredFields)) {
    for (const field of validation.requiredFields) {
      if (!hasNestedProperty(responseBody, field)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Field value validation
  if (validation.fieldValues && typeof validation.fieldValues === 'object') {
    for (const [field, expectedValue] of Object.entries(validation.fieldValues)) {
      const actualValue = getNestedProperty(responseBody, field);
      if (actualValue !== expectedValue) {
        errors.push(`Field ${field}: expected ${expectedValue}, got ${actualValue}`);
      }
    }
  }

  // Response time validation
  if (validation.maxResponseTime && typeof validation.maxResponseTime === 'number') {
    // This would need to be checked by the caller
    // Including here for completeness
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Simple JSON Schema validator
 * @param {*} data - Data to validate
 * @param {Object} schema - JSON Schema
 * @returns {Array} Validation errors
 */
function validateJsonSchema(data, schema) {
  const errors = [];

  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${actualType}`);
      return errors; // Early return on type mismatch
    }
  }

  if (schema.type === 'object' && schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (schema.required && schema.required.includes(key)) {
        if (!(key in data)) {
          errors.push(`Missing required property: ${key}`);
          continue;
        }
      }

      if (key in data) {
        const propErrors = validateJsonSchema(data[key], propSchema);
        errors.push(...propErrors.map(err => `${key}.${err}`));
      }
    }
  }

  if (schema.type === 'array' && schema.items && Array.isArray(data)) {
    data.forEach((item, index) => {
      const itemErrors = validateJsonSchema(item, schema.items);
      errors.push(...itemErrors.map(err => `[${index}].${err}`));
    });
  }

  return errors;
}

/**
 * Check if object has nested property
 * @param {Object} obj - Object to check
 * @param {String} path - Dot-notation path (e.g., 'user.name')
 * @returns {Boolean}
 */
function hasNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current == null || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }

  return true;
}

/**
 * Get nested property value
 * @param {Object} obj - Object to get from
 * @param {String} path - Dot-notation path
 * @returns {*} Property value or undefined
 */
function getNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Format API check for database storage
 * @param {Object} checkResult - API check result
 * @returns {Object} Formatted data for Prisma
 */
export function formatApiCheckForDB(checkResult) {
  return {
    requestMethod: checkResult.requestMethod,
    requestHeaders: checkResult.requestHeaders || {},
    requestBody: checkResult.requestBody,
    responseTime: checkResult.responseTime,
    statusCode: checkResult.statusCode,
    responseBody: checkResult.responseBody,
    responseHeaders: checkResult.responseHeaders || {},
    validationPassed: checkResult.validationPassed,
    validationErrors: checkResult.validationErrors || [],
    errorMessage: checkResult.errorMessage,
  };
}

/**
 * Determine site status from API check
 * @param {Object} checkResult - API check result
 * @returns {String} Site status (ONLINE, DEGRADED, OFFLINE)
 */
export function getSiteStatusFromApiCheck(checkResult) {
  if (!checkResult.success) {
    return 'OFFLINE';
  }

  if (!checkResult.validationPassed) {
    return 'DEGRADED';
  }

  // Check response time thresholds
  if (checkResult.responseTime > 5000) {
    return 'DEGRADED';
  }

  return 'ONLINE';
}
