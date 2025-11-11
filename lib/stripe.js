import Stripe from 'stripe';
import prisma from './prisma';

// Get the Stripe secret key
const stripeSecretKey = 'sk_test_51SQ24EQuBR2IB5zIL9InGJ9tuGynbaL9yZZSdietNinIA7ROmiRhiU1dpT3qgDmZHuWnN50H4rT9raHjjHJvRs5p00CsKqAi9l';

if (!stripeSecretKey) {
  console.error('⚠️  STRIPE_SECRET_KEY is not defined in environment variables');
  throw new Error('STRIPE_SECRET_KEY is required but not defined in .env file');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
};

// Cache for plans to avoid repeated database queries
let plansCache = null;
let plansCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get all plans from database (with caching)
 */
export async function getPlans() {
  const now = Date.now();
  
  // Return cached plans if still valid
  if (plansCache && (now - plansCacheTime) < CACHE_TTL) {
    return plansCache;
  }
  
  // Fetch from database
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  
  // Update cache
  plansCache = plans;
  plansCacheTime = now;
  
  return plans;
}

/**
 * Get a specific plan by name
 */
export async function getPlan(planName) {
  const plans = await getPlans();
  return plans.find(p => p.name === planName) || plans.find(p => p.name === 'FREE');
}

/**
 * Get plan limits for a specific plan
 * Returns an object with: sites, minCheckInterval, maxTeamMembers, allowedChannels
 */
export async function getPlanLimits(planName) {
  const plan = await getPlan(planName);
  
  return {
    sites: plan.maxSites,
    minCheckInterval: plan.minCheckInterval,
    maxTeamMembers: plan.maxTeamMembers,
    allowedChannels: plan.allowedChannels,
    maxAICredits: plan.maxAICredits,
    features: JSON.parse(plan.features)
  };
}

/**
 * Synchronous version of getPlanLimits for backward compatibility
 * Uses cached data only - call getPlans() first to populate cache
 */
export function getPlanLimitsSync(planName) {
  if (!plansCache) {
    // Return FREE plan defaults if cache not populated
    return {
      sites: 1,
      minCheckInterval: 300,
      maxTeamMembers: 1,
      allowedChannels: ['email'],
      maxAICredits: 100,
    };
  }
  
  const plan = plansCache.find(p => p.name === planName) || plansCache.find(p => p.name === 'FREE');
  
  return {
    sites: plan.maxSites,
    minCheckInterval: plan.minCheckInterval,
    maxTeamMembers: plan.maxTeamMembers,
    allowedChannels: plan.allowedChannels,
    maxAICredits: plan.maxAICredits,
  };
}

/**
 * Get plan by Stripe price ID
 */
export async function getPlanByPriceId(stripePriceId) {
  const plans = await getPlans();
  return plans.find(p => p.stripePriceId === stripePriceId);
}

/**
 * Clear plans cache (call this when plans are updated in admin)
 */
export function clearPlansCache() {
  plansCache = null;
  plansCacheTime = 0;
}

/**
 * Format currency amount from cents to dollars
 */
export function formatAmount(amount, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Get subscription status badge styling
 */
export function getSubscriptionStatusBadge(status) {
  const statusMap = {
    ACTIVE: { label: 'Active', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    TRIALING: { label: 'Trial', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    PAST_DUE: { label: 'Past Due', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    CANCELED: { label: 'Canceled', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  };
  
  return statusMap[status] || { label: status, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
}
