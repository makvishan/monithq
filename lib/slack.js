// Slack notification utility

/**
 * Send a message to a Slack webhook URL
 * @param {string} webhookUrl - Slack Incoming Webhook URL
 * @param {string} message - Message text to send
 * @returns {Promise<boolean>} Success status
 */
export async function sendSlackNotification(webhookUrl, message) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    console.log(`Slack notification sent to ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return false;
  }
}
