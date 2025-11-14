// Test script to send a message to Slack using your webhook URL
import { sendSlackNotification } from "../lib/slack.js";

const webhookUrl = "https://hooks.slack.com/services/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";
const testMessage = "This is a test message from MonitHQ Slack integration.";

(async () => {
  const result = await sendSlackNotification(webhookUrl, testMessage);
  console.log("Slack notification result:", result);
})();
