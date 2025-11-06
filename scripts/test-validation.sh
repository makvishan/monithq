#!/bin/bash

# Test Stripe Price Validation
# This script demonstrates the validation feature

echo "🧪 Testing Stripe Price Validation"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Current Plans in Stripe:"
echo ""
stripe prices list --limit 4 | grep -E "id|unit_amount|product" | head -12
echo ""
echo "=================================="
echo ""

echo "🔍 Testing validation scenarios:"
echo ""

# Test 1: Valid price
echo "1️⃣  Test: STARTER plan with CORRECT price"
echo "   Database: \$10.00 (1000 cents)"
echo "   Stripe Price ID: price_1SQN82QuBR2IB5zIwvJntBTh"
echo ""
echo "   Expected: ✅ PASS"
echo ""

# Test 2: Invalid price
echo "2️⃣  Test: STARTER plan with WRONG price"
echo "   Database: \$29.00 (2900 cents)"
echo "   Stripe Price ID: price_1SQN82QuBR2IB5zIwvJntBTh (Stripe has \$10.00)"
echo ""
echo "   Expected: ❌ FAIL - Price mismatch detected"
echo ""

# Test 3: Invalid Price ID
echo "3️⃣  Test: Invalid Stripe Price ID"
echo "   Database: \$29.00 (2900 cents)"
echo "   Stripe Price ID: price_INVALID123"
echo ""
echo "   Expected: ❌ FAIL - Invalid Stripe Price ID"
echo ""

# Test 4: FREE plan
echo "4️⃣  Test: FREE plan (no Stripe Price ID)"
echo "   Database: \$0.00 (0 cents)"
echo "   Stripe Price ID: (empty)"
echo ""
echo "   Expected: ✅ PASS - FREE plans don't need Stripe Price ID"
echo ""

echo "=================================="
echo ""
echo "📊 What happens in the Admin UI:"
echo ""
echo "✅ Valid:"
echo "   • Green checkmark icon appears"
echo "   • Shows '✅ Valid! Stripe price matches \$XX.XX'"
echo "   • Save button is ENABLED"
echo ""
echo "❌ Invalid:"
echo "   • Red X icon appears"
echo "   • Shows error message with details"
echo "   • Shows both Stripe and Database amounts"
echo "   • Save button is DISABLED until fixed"
echo ""
echo "🔄 Validating:"
echo "   • Spinner icon appears"
echo "   • Shows 'Validating...' in save button"
echo "   • Validation happens 500ms after you stop typing"
echo ""

echo "=================================="
echo ""
echo "🎯 To fix current discrepancies:"
echo ""
echo "Option 1: Update Stripe prices to match database"
echo "---------------------------------------------"
echo "stripe prices create --product prod_TN7MG6Ev7IvON4 --unit-amount 2900 --currency usd --recurring[interval]=month # STARTER"
echo "stripe prices create --product prod_TN7N1d8KsKBOts --unit-amount 7900 --currency usd --recurring[interval]=month # PRO"
echo "stripe prices create --product prod_TN7NVH12nttOp1 --unit-amount 29900 --currency usd --recurring[interval]=month # ENTERPRISE"
echo ""
echo "Option 2: Update database via Admin UI"
echo "---------------------------------------------"
echo "1. Open http://localhost:3000/admin/plans"
echo "2. Click Edit on each plan"
echo "3. Change price to match Stripe (validation will show green ✅)"
echo "4. Save"
echo ""
