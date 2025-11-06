# Stripe Price Validation System

## 🎯 What Was Implemented

A comprehensive validation system that ensures Stripe prices always match your database prices before creating or updating plans.

## 📁 Files Created/Modified

### New Files
1. **`lib/stripe-validator.js`** - Core validation logic
   - `validateStripePrice(stripePriceId, expectedAmount)` - Validates price matches Stripe
   - `isValidStripePriceIdFormat(stripePriceId)` - Validates Price ID format

2. **`app/api/admin/plans/validate-stripe-price/route.js`** - Validation API endpoint
   - Called by frontend for real-time validation
   - Returns validation status, error details, and actual amounts

3. **`scripts/compare-stripe-plans.js`** - Database vs Stripe comparison tool
   - Compares all plans between database and Stripe
   - Shows discrepancies with recommendations

4. **`scripts/test-validation.sh`** - Testing guide
   - Explains validation scenarios
   - Provides commands to fix discrepancies

### Modified Files
1. **`app/api/admin/plans/route.js`** (POST endpoint)
   - Added Stripe price validation before creating plans
   - Validates Price ID format
   - Blocks creation if validation fails

2. **`app/api/admin/plans/[id]/route.js`** (PUT endpoint)
   - Added Stripe price validation before updating plans
   - Only validates when price or stripePriceId changes
   - Blocks updates if validation fails

3. **`app/admin/plans/page.js`** - Admin UI
   - Added real-time validation with 500ms debounce
   - Visual feedback: ✅ green checkmark / ❌ red X / 🔄 spinner
   - Detailed error messages showing both amounts
   - Save button disabled when validation fails
   - Smart button states: "Validating..." / "Fix Stripe Price" / "Save"

## 🔍 How Validation Works

### Backend Validation (API)
```javascript
// When creating/updating a plan:
1. Check if stripePriceId format is valid (starts with "price_")
2. Fetch price from Stripe API
3. Verify:
   - Price exists in Stripe
   - Price is active
   - Price type is "recurring"
   - Currency is USD
   - Amount matches database exactly
4. Block save if any validation fails
```

### Frontend Validation (UI)
```javascript
// Real-time validation as user types:
1. Debounce 500ms after user stops typing
2. Call /api/admin/plans/validate-stripe-price
3. Show visual feedback:
   ✅ Green checkmark - Valid
   ❌ Red X - Invalid with error message
   🔄 Spinner - Validating
4. Disable save button if invalid
```

## 🎨 UI States

### ✅ Valid State
- **Icon**: Green checkmark
- **Message**: "✅ Valid! Stripe price matches $XX.XX"
- **Button**: Enabled with "Create/Update Plan"
- **Border**: Green

### ❌ Invalid State
- **Icon**: Red X
- **Message**: Error details + amount comparison
- **Example**: "Price mismatch: Database has $29.00 but Stripe has $10.00"
- **Button**: Disabled with "Fix Stripe Price"
- **Border**: Red

### 🔄 Validating State
- **Icon**: Spinner (animated)
- **Message**: None
- **Button**: Disabled with "Validating..."
- **Border**: Default

### 💡 FREE Plan State
- **Icon**: None
- **Message**: "Leave empty for FREE plans"
- **Validation**: Skipped (no Stripe Price ID needed)

## 🚨 Current Issue Detected

### Price Discrepancies Found:

| Plan | Database | Stripe | Difference |
|------|----------|--------|------------|
| STARTER | $29.00 | $10.00 | -$19.00 |
| PRO | $79.00 | $20.00 | -$59.00 |
| ENTERPRISE | $299.00 | $30.00 | -$269.00 |

## 🔧 How to Fix Discrepancies

### Option 1: Update Stripe to Match Database (Production Prices)
```bash
# Update STARTER to $29
stripe prices create \
  --product prod_TN7MG6Ev7IvON4 \
  --unit-amount 2900 \
  --currency usd \
  --recurring[interval]=month

# Update PRO to $79
stripe prices create \
  --product prod_TN7N1d8KsKBOts \
  --unit-amount 7900 \
  --currency usd \
  --recurring[interval]=month

# Update ENTERPRISE to $299
stripe prices create \
  --product prod_TN7NVH12nttOp1 \
  --unit-amount 29900 \
  --currency usd \
  --recurring[interval]=month

# Then update database with new Price IDs via Admin UI
```

### Option 2: Update Database to Match Stripe (Test Prices)
```bash
# Open Admin UI
# Navigate to: http://localhost:3000/admin/plans
# Edit each plan:
# - Change price to match Stripe
# - Validation will show ✅ when correct
# - Save
```

### Option 3: Keep Test Prices for Development
- Use current low Stripe prices for testing
- Create new production prices when going live
- Update database before production deployment

## 🧪 Testing the Validation

### Run Comparison Script:
```bash
cd /Users/veera/Workspace/site
node scripts/compare-stripe-plans.js
```

### Test Validation in Admin UI:
1. Open: http://localhost:3000/admin/plans
2. Click "Edit" on any plan
3. Try changing the price:
   - Enter a price that matches Stripe → See ✅
   - Enter a price that doesn't match → See ❌
4. Try changing Stripe Price ID:
   - Valid format with matching price → ✅
   - Invalid format → ❌ "Invalid Stripe Price ID format"
   - Valid format but wrong amount → ❌ with amount comparison
5. Save button will only enable when validation passes

### Test Scenarios:
```bash
# View test guide
./scripts/test-validation.sh
```

## 📊 API Error Responses

### Validation Failed (400)
```json
{
  "error": "Stripe price validation failed",
  "details": "Price mismatch: Database has $29.00 but Stripe has $10.00",
  "actualStripeAmount": 1000,
  "expectedAmount": 2900
}
```

### Invalid Format (400)
```json
{
  "error": "Invalid Stripe Price ID format. Must start with \"price_\""
}
```

### Inactive Price (400)
```json
{
  "error": "Stripe price validation failed",
  "details": "This Stripe price is inactive",
  "actualStripeAmount": 2900,
  "currency": "usd"
}
```

### Invalid Price ID (400)
```json
{
  "error": "Stripe price validation failed",
  "details": "Invalid Stripe Price ID: No such price: 'price_INVALID123'"
}
```

## ✅ Benefits

1. **Prevents Price Mismatches**
   - No more situations where database says $29 but Stripe charges $10
   - Billing displays always accurate

2. **Real-Time Feedback**
   - Admins see validation errors immediately
   - No need to submit form to discover issues

3. **Clear Error Messages**
   - Shows both expected and actual amounts
   - Explains exactly what's wrong

4. **User-Friendly UX**
   - Visual indicators (colors, icons)
   - Smart button states
   - Helpful hints ("Leave empty for FREE plans")

5. **Production Safety**
   - Can't accidentally create/update plans with wrong prices
   - Validation happens both client and server side
   - Catches issues before they affect customers

## 🔐 Security

- All validation requires SUPER_ADMIN role
- Server-side validation in addition to client-side
- Stripe API calls use secure secret key
- No price IDs exposed to non-admin users

## 🚀 Next Steps

1. **Fix Current Discrepancies** (Choose Option 1 or 2 above)
2. **Test Validation in Admin UI**
3. **Test Plan Creation/Update with Various Scenarios**
4. **Document Price Change Process for Team**

## 📝 Notes

- Validation runs with 500ms debounce to avoid excessive API calls
- FREE plans (price = 0) don't require Stripe Price IDs
- Validation checks: exists, active, recurring, USD, amount match
- Cache automatically clears after plan updates
- All validation logic is reusable for future features
