import tls from 'tls';
import { URL } from 'url';

/**
 * Check SSL certificate for a given URL
 * @param {string} url - The URL to check
 * @returns {Promise<object>} SSL certificate information
 */
export async function checkSSLCertificate(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      const port = parsedUrl.port || 443;

      // Only check HTTPS URLs
      if (parsedUrl.protocol !== 'https:') {
        return resolve({
          valid: false,
          error: 'Not an HTTPS URL',
          isHttps: false
        });
      }

      const socket = tls.connect(port, hostname, {
        servername: hostname,
        rejectUnauthorized: false // We want to check even invalid certificates
      }, () => {
        const cert = socket.getPeerCertificate();

        if (!cert || Object.keys(cert).length === 0) {
          socket.destroy();
          return resolve({
            valid: false,
            error: 'No certificate found',
            isHttps: true
          });
        }

        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
        const isValid = now >= validFrom && now <= validTo;

        const result = {
          valid: isValid,
          isHttps: true,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
          subject: cert.subject?.CN || hostname,
          validFrom: validFrom,
          validTo: validTo,
          daysRemaining: daysRemaining,
          serialNumber: cert.serialNumber,
          fingerprint: cert.fingerprint,
          algorithm: cert.sigalg || 'Unknown',
          authorized: socket.authorized,
          authorizationError: socket.authorizationError
        };

        socket.destroy();
        resolve(result);
      });

      socket.on('error', (error) => {
        resolve({
          valid: false,
          error: error.message,
          isHttps: true
        });
      });

      // Timeout after 10 seconds
      socket.setTimeout(10000);
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          valid: false,
          error: 'SSL check timeout',
          isHttps: true
        });
      });

    } catch (error) {
      resolve({
        valid: false,
        error: error.message,
        isHttps: false
      });
    }
  });
}

/**
 * Get SSL status color based on days remaining
 * @param {number} daysRemaining - Days until certificate expires
 * @returns {string} Status color
 */
export function getSSLStatusColor(daysRemaining) {
  if (daysRemaining < 0) return 'red'; // Expired
  if (daysRemaining < 7) return 'red'; // Critical
  if (daysRemaining < 14) return 'orange'; // Warning
  if (daysRemaining < 30) return 'yellow'; // Caution
  return 'green'; // Good
}

/**
 * Get SSL status text based on days remaining
 * @param {number} daysRemaining - Days until certificate expires
 * @returns {string} Status text
 */
export function getSSLStatusText(daysRemaining) {
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining < 7) return 'Expires Soon';
  if (daysRemaining < 14) return 'Expiring';
  if (daysRemaining < 30) return 'Attention Needed';
  return 'Valid';
}

/**
 * Check if SSL alert should be sent
 * @param {number} daysRemaining - Days until certificate expires
 * @param {number} alertThreshold - Alert threshold in days
 * @param {Date} lastAlertDate - Last time an alert was sent
 * @returns {boolean} Whether to send alert
 */
export function shouldSendSSLAlert(daysRemaining, alertThreshold = 30, lastAlertDate = null) {
  // Alert if certificate is expired or expiring within threshold
  if (daysRemaining > alertThreshold) {
    return false;
  }

  // If no previous alert, send one
  if (!lastAlertDate) {
    return true;
  }

  // Send alerts at specific milestones
  const milestones = [30, 14, 7, 3, 1, 0, -1];

  // Check if we've crossed a milestone since last alert
  for (const milestone of milestones) {
    if (daysRemaining <= milestone && daysRemaining > milestone - 1) {
      const daysSinceLastAlert = Math.floor((new Date() - new Date(lastAlertDate)) / (1000 * 60 * 60 * 24));
      // Only send if at least 1 day has passed since last alert
      return daysSinceLastAlert >= 1;
    }
  }

  return false;
}

/**
 * Format SSL certificate information for display
 * @param {object} sslInfo - SSL certificate information
 * @returns {object} Formatted SSL information
 */
export function formatSSLInfo(sslInfo) {
  if (!sslInfo || !sslInfo.valid) {
    return {
      status: 'Invalid',
      statusColor: 'red',
      message: sslInfo?.error || 'No SSL certificate found'
    };
  }

  const statusColor = getSSLStatusColor(sslInfo.daysRemaining);
  const statusText = getSSLStatusText(sslInfo.daysRemaining);

  return {
    status: statusText,
    statusColor,
    issuer: sslInfo.issuer,
    validFrom: sslInfo.validFrom,
    validTo: sslInfo.validTo,
    daysRemaining: sslInfo.daysRemaining,
    subject: sslInfo.subject,
    algorithm: sslInfo.algorithm,
    message: `${sslInfo.daysRemaining} days remaining`
  };
}
