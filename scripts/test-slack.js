// Test script to send a message to Slack using your webhook URL
import { sendSlackNotification } from "../lib/slack.js";

const webhookUrl = "YOUR_SLACK_WEBHOOK_URL_HERE"; // Replace with your Slack webhook URL
const testMessage = "This is a test message from MonitHQ Slack integration.";

(async () => {
  const result = await sendSlackNotification(webhookUrl, testMessage);
  console.log("Slack notification result:", result);
})();
