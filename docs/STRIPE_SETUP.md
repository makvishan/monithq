# Stripe Payment Integration Setup Guide

## Overview
This guide will help you set up Stripe payment integration for MonitHQ's billing system.

## Current Status
✅ **Demo Mode Active** - The billing page is currently running in demo mode.
🔧 **Production Setup Required** - Follow this guide to enable real payment processing.

---

## Step 1: Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

**Packages:**
- `stripe` - Server-side Stripe SDK (for API routes)
- `@stripe/stripe-js` - Client-side Stripe library (for checkout)

---

## Step 2: Create Stripe Account & Get API Keys

1. **Sign up at [https://stripe.com](https://stripe.com)**
   - Create a free account
   - Complete the business verification

2. **Get your API keys:**
   - Go to [Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
   - Copy your **Publishable key** (starts with `pk_test_...`)
   - Copy your **Secret key** (starts with `sk_test_...`)
   - ⚠️ Never commit secret keys to version control!

3. **Get your Webhook secret:**
   - Go to [Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the **Signing secret** (starts with `whsec_...`)

---

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production (.env.production):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Step 4: Create Stripe Products & Pricing

1. **Go to [Dashboard > Products](https://dashboard.stripe.com/products)**

2. **Create these products:**

### Free Plan
- Name: MonitHQ Free
- Description: Perfect for trying out MonitHQ
- Pricing: $0/month
- Copy the **Price ID** (starts with `price_...`)

### Starter Plan
- Name: MonitHQ Starter
- Description: Essential monitoring for small projects
- Pricing: $29/month
- Copy the **Price ID**

### Professional Plan
- Name: MonitHQ Professional
- Description: Advanced monitoring for growing teams
- Pricing: $79/month
- Copy the **Price ID**

### Enterprise Plan
- Name: MonitHQ Enterprise
- Description: Complete monitoring solution for large teams
- Pricing: $199/month
- Copy the **Price ID**

3. **Update `/lib/stripe.js` with your Price IDs:**

```javascript
export const STRIPE_PRICE_IDS = {
  free: 'price_your_free_price_id',
  starter: 'price_your_starter_price_id',
  professional: 'price_your_pro_price_id',
  enterprise: 'price_your_enterprise_price_id',
};
```

---

## Step 5: Enable Production Code

### Update `/lib/stripe.js`

**Remove the demo mode check and uncomment production code:**

```javascript
// Before (Demo Mode):
export async function createCheckoutSession(priceId, planName) {
  // Demo mode
  return {
    sessionId: 'demo_session_' + Date.now(),
    url: null,
    error: 'Demo mode: Install stripe package and configure API keys'
  };
}

// After (Production):
export async function createCheckoutSession(priceId, planName) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        planName,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    return { error: error.message };
  }
}
```

### Update all 3 API routes

1. **`/app/api/stripe/create-checkout-session/route.js`**
2. **`/app/api/stripe/create-portal-session/route.js`**
3. **`/app/api/stripe/webhook/route.js`**

Uncomment the production code and remove the demo responses.

---

## Step 6: Test the Integration

### Local Testing

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Test a payment:**
   - Go to http://localhost:3000/billing
   - Click "Upgrade Plan" on any paid plan
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

5. **Verify webhook events:**
   - Check the Stripe CLI output
   - Check your browser console
   - Check [Dashboard > Events](https://dashboard.stripe.com/events)

---

## Step 7: Database Integration (Optional but Recommended)

Currently, subscription data is mocked. For production, you should:

1. **Store subscription data in your database:**
   ```javascript
   // Example schema
   {
     userId: String,
     customerId: String,        // Stripe customer ID
     subscriptionId: String,    // Stripe subscription ID
     planName: String,          // 'starter', 'professional', etc.
     status: String,            // 'active', 'canceled', 'past_due'
     currentPeriodEnd: Date,
     paymentMethod: {
       last4: String,
       brand: String,
       expiryMonth: Number,
       expiryYear: Number
     }
   }
   ```

2. **Update webhook handler to save to database:**
   ```javascript
   // In /app/api/stripe/webhook/route.js
   case 'checkout.session.completed':
     const session = event.data.object;
     // Save to database
     await db.subscriptions.create({
       userId: session.client_reference_id,
       customerId: session.customer,
       subscriptionId: session.subscription,
       // ... other fields
     });
     break;
   ```

3. **Update billing page to fetch real data:**
   ```javascript
   // In /app/billing/page.js
   useEffect(() => {
     async function fetchSubscription() {
       const response = await fetch('/api/user/subscription');
       const data = await response.json();
       setSubscriptionData(data);
     }
     fetchSubscription();
   }, []);
   ```

---

## Step 8: Production Deployment

### Before deploying:

1. **Switch to live API keys:**
   - Use `pk_live_...` and `sk_live_...`
   - Update environment variables in your hosting platform

2. **Configure webhook endpoint:**
   - Add your production URL: `https://yourdomain.com/api/stripe/webhook`
   - Copy the new webhook secret to `STRIPE_WEBHOOK_SECRET`

3. **Test thoroughly:**
   - Subscription creation
   - Subscription upgrades/downgrades
   - Subscription cancellation
   - Failed payments
   - Refunds

4. **Enable Stripe Radar:**
   - Go to [Dashboard > Radar](https://dashboard.stripe.com/radar)
   - Configure fraud prevention rules

5. **Set up tax collection (if needed):**
   - Go to [Dashboard > Settings > Tax](https://dashboard.stripe.com/settings/tax)
   - Configure automatic tax calculation

---

## Security Checklist

- ✅ Never expose `STRIPE_SECRET_KEY` in client-side code
- ✅ Always verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Validate all amounts server-side
- ✅ Implement rate limiting on API routes
- ✅ Log all payment events for auditing
- ✅ Set up monitoring for failed payments
- ✅ Have a process for handling disputes/chargebacks

---

## Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution:** 
- Verify webhook URL is correct
- Check webhook signing secret
- Ensure endpoint is publicly accessible
- Check Stripe Dashboard > Webhooks for failed deliveries

### Issue: Checkout session not redirecting
**Solution:**
- Verify success_url and cancel_url are correct
- Check NEXT_PUBLIC_APP_URL environment variable
- Ensure URLs are absolute (not relative)

### Issue: "No such price" error
**Solution:**
- Verify price IDs in `STRIPE_PRICE_IDS` are correct
- Check you're using test prices with test keys
- Check you're using live prices with live keys

### Issue: Customer portal not loading
**Solution:**
- Verify customer ID exists in Stripe
- Check STRIPE_SECRET_KEY is set correctly
- Ensure customer has an active subscription

---

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

## Support

For Stripe-specific issues:
- [Stripe Support](https://support.stripe.com)
- [Stripe Discord](https://stripe.com/discord)

For MonitHQ integration issues:
- Check the browser console for errors
- Check Next.js server logs
- Review Stripe Dashboard > Events for webhook issues

---

## Next Steps

After completing this setup, you should:

1. ✅ Install stripe packages
2. ✅ Configure environment variables
3. ✅ Create products and prices
4. ✅ Update price IDs in code
5. ✅ Enable production code
6. ✅ Test with Stripe CLI
7. ✅ Integrate with database
8. ✅ Deploy to production

**Current Status:** Demo mode - ready for production setup!
