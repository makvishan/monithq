# MonitHQ Webhook Integration Guide

## Overview
MonitHQ can send real-time notifications to your system using webhooks. You can configure your endpoint to receive POST requests with event data in JSON format.

## Example Payload
```
{
  "event": "incident_created",
  "timestamp": "2025-11-05T10:30:00Z",
  "data": {
    "incident_id": "...",
    "site_name": "Main Website",
    "severity": "high"
  }
}
```

## Supported Events
- incident_created
- incident_updated
- incident_resolved
- site_down
- site_up
- site_degraded
- site_created
- site_deleted

## How to Configure Your Endpoint

### 1. Node.js (Express)
```js
import crypto from 'crypto';
import express from 'express';
const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

app.post('/webhook', (req, res) => {
  const secret = 'YOUR_WEBHOOK_SECRET';
  const signature = req.headers['x-monithhq-signature'];
  const computed = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  if (signature !== computed) {
    return res.status(401).send('Invalid signature');
  }
  // Process event
  res.status(200).send('Received');
});
```

### 2. Python (Flask)
```python
import hmac
import hashlib
from flask import Flask, request, abort
app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    secret = b'YOUR_WEBHOOK_SECRET'
    signature = request.headers.get('X-MonitHQ-Signature')
    computed = hmac.new(secret, request.data, hashlib.sha256).hexdigest()
    if signature != computed:
        abort(401)
    # Process event
    return 'Received', 200
```

### 3. PHP
```php
$secret = 'YOUR_WEBHOOK_SECRET';
$body = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_MONITHHQ_SIGNATURE'] ?? '';
$computed = hash_hmac('sha256', $body, $secret);
if ($signature !== $computed) {
    http_response_code(401);
    exit('Invalid signature');
}
// Process event
http_response_code(200);
echo 'Received';
```

## Troubleshooting
- Ensure your endpoint is publicly accessible.
- Validate the signature for security.
- Respond with HTTP 200 to acknowledge receipt.

## Need Help?
Contact MonitHQ support for assistance.
