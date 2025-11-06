import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Validates that a Stripe price ID exists and matches the expected amount
 * @param {string} stripePriceId - The Stripe price ID to validate
 * @param {number} expectedAmount - The expected amount in cents
 * @returns {Promise<{valid: boolean, error?: string, actualAmount?: number, currency?: string}>}
 */
export async function validateStripePrice(stripePriceId, expectedAmount) {
  // Skip validation for free plans (no Stripe price ID)
  if (!stripePriceId || stripePriceId.trim() === '') {
    if (expectedAmount === 0) {
      return { valid: true };
    }
    return {
      valid: false,
      error: 'Stripe Price ID is required for paid plans',
    };
  }

  // Skip validation if price is 0 but has a Stripe price ID (shouldn't happen, but handle it)
  if (expectedAmount === 0 && stripePriceId) {
    return {
      valid: false,
      error: 'Free plans should not have a Stripe Price ID',
    };
  }

  try {
    // Fetch the price from Stripe
    const price = await stripe.prices.retrieve(stripePriceId);

    // Check if price is active
    if (!price.active) {
      return {
        valid: false,
        error: 'This Stripe price is inactive',
        actualAmount: price.unit_amount,
        currency: price.currency,
      };
    }

    // Check if it's a recurring price
    if (price.type !== 'recurring') {
      return {
        valid: false,
        error: 'Stripe price must be a recurring subscription price',
        actualAmount: price.unit_amount,
        currency: price.currency,
      };
    }

    // Check if currency is USD
    if (price.currency !== 'usd') {
      return {
        valid: false,
        error: `Stripe price currency must be USD, but found ${price.currency.toUpperCase()}`,
        actualAmount: price.unit_amount,
        currency: price.currency,
      };
    }

    // Check if the amount matches
    if (price.unit_amount !== expectedAmount) {
      return {
        valid: false,
        error: `Price mismatch: Database has $${(expectedAmount / 100).toFixed(2)} but Stripe has $${(price.unit_amount / 100).toFixed(2)}`,
        actualAmount: price.unit_amount,
        currency: price.currency,
      };
    }

    // All validations passed
    return {
      valid: true,
      actualAmount: price.unit_amount,
      currency: price.currency,
    };
  } catch (error) {
    // Handle Stripe API errors
    if (error.type === 'StripeInvalidRequestError') {
      return {
        valid: false,
        error: `Invalid Stripe Price ID: ${error.message}`,
      };
    }

    // Handle other errors
    return {
      valid: false,
      error: `Failed to validate Stripe price: ${error.message}`,
    };
  }
}

/**
 * Validates Stripe Price ID format
 * @param {string} stripePriceId - The Stripe price ID to validate
 * @returns {boolean}
 */
export function isValidStripePriceIdFormat(stripePriceId) {
  if (!stripePriceId) return false;
  // Stripe price IDs start with 'price_' followed by alphanumeric characters
  return /^price_[a-zA-Z0-9]{24,}$/.test(stripePriceId);
}
