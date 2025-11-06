const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupPortal() {
  try {
    console.log('Creating Stripe Customer Portal configuration...\n');
    
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
  headline: 'Manage your MonitHQ subscription',
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address'],
        },
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
        },
        subscription_pause: {
          enabled: false,
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity'],
          proration_behavior: 'create_prorations',
        },
      },
    });
    
    console.log('✅ Customer Portal configured successfully!');
    console.log('Configuration ID:', configuration.id);
    console.log('\nYou can now use the "Manage Subscription" button.');
    console.log('Users can:');
    console.log('  - Update payment methods');
    console.log('  - View billing history');
    console.log('  - Cancel subscriptions');
    console.log('  - Upgrade/downgrade plans');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupPortal();
