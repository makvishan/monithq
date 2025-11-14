// lib/apiNotify.js
// Utility for sending notifications to external APIs/webhooks

import fetch from 'node-fetch';

/**
 * Send a notification payload to an external API/webhook URL.
 * @param {string} url - The webhook/API endpoint.
 * @param {object} payload - The notification data to send.
 * @returns {Promise<object>} - The response from the API.
 */
export const sendApiNotification = async (url, payload) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
