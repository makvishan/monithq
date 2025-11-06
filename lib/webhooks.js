import crypto from 'crypto';
import prisma from './prisma';

/**
 * Trigger webhooks for a specific event
 * @param {string} organizationId - Organization ID
 * @param {string} eventType - Event type (incident_created, site_down, etc.)
 * @param {object} payload - Event data
 */
export async function triggerWebhooks(organizationId, eventType, payload) {
  try {
    // Get all active webhooks for this organization that listen to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId,
        isActive: true,
        events: {
          has: eventType,
        },
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    // Trigger each webhook
    const promises = webhooks.map(webhook => sendWebhook(webhook, eventType, payload));
    await Promise.allSettled(promises);

  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

/**
 * Send webhook HTTP request
 * @param {object} webhook - Webhook configuration
 * @param {string} eventType - Event type
 * @param {object} payload - Event data
 */
async function sendWebhook(webhook, eventType, payload) {
  try {
    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers = {
      'Content-Type': 'application/json',
  'User-Agent': 'MonitHQ-Webhook/1.0',
  'X-MonitHQ-Event': eventType,
    };

    // Add signature if webhook has a secret
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');
  headers['X-MonitHQ-Signature'] = signature;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    // Update last triggered time
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() },
    });

    if (!response.ok) {
      console.error(`Webhook ${webhook.id} failed with status ${response.status}`);
    }

  } catch (error) {
    console.error(`Error sending webhook ${webhook.id}:`, error.message);
  }
}

/**
 * Available webhook event types
 */
export const WEBHOOK_EVENTS = {
  INCIDENT_CREATED: 'incident_created',
  INCIDENT_UPDATED: 'incident_updated',
  INCIDENT_RESOLVED: 'incident_resolved',
  SITE_DOWN: 'site_down',
  SITE_UP: 'site_up',
  SITE_DEGRADED: 'site_degraded',
  SITE_CREATED: 'site_created',
  SITE_DELETED: 'site_deleted',
};
