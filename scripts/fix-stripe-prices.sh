#!/bin/bash

# Quick script to create new Stripe prices that match database
# Run this to fix the price discrepancies

echo "🔧 Creating New Stripe Prices to Match Database"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This will create NEW Stripe prices matching your database:${NC}"
echo "  • STARTER: \$29.00/month (2900 cents)"
echo "  • PRO: \$79.00/month (7900 cents)"
echo "  • ENTERPRISE: \$299.00/month (29900 cents)"
echo ""
echo "⚠️  This will NOT delete old prices (they'll remain in Stripe)"
echo "⚠️  After running this, you'll need to update your database with new Price IDs"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Creating prices..."
echo ""

# Create STARTER price ($29)
echo "1/3 Creating STARTER price (\$29)..."
STARTER_PRICE=$(stripe prices create \
  --product prod_TN7MG6Ev7IvON4 \
  --unit-amount 2900 \
  --currency usd \
  --recurring[interval]=month \
  --format json 2>&1)

if [ $? -eq 0 ]; then
    STARTER_ID=$(echo $STARTER_PRICE | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "   ${GREEN}✅ Created: $STARTER_ID${NC}"
else
    echo "   ❌ Failed to create STARTER price"
    echo "$STARTER_PRICE"
fi

echo ""

# Create PRO price ($79)
echo "2/3 Creating PRO price (\$79)..."
PRO_PRICE=$(stripe prices create \
  --product prod_TN7N1d8KsKBOts \
  --unit-amount 7900 \
  --currency usd \
  --recurring[interval]=month \
  --format json 2>&1)

if [ $? -eq 0 ]; then
    PRO_ID=$(echo $PRO_PRICE | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "   ${GREEN}✅ Created: $PRO_ID${NC}"
else
    echo "   ❌ Failed to create PRO price"
    echo "$PRO_PRICE"
fi

echo ""

# Create ENTERPRISE price ($299)
echo "3/3 Creating ENTERPRISE price (\$299)..."
ENTERPRISE_PRICE=$(stripe prices create \
  --product prod_TN7NVH12nttOp1 \
  --unit-amount 29900 \
  --currency usd \
  --recurring[interval]=month \
  --format json 2>&1)

if [ $? -eq 0 ]; then
    ENTERPRISE_ID=$(echo $ENTERPRISE_PRICE | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "   ${GREEN}✅ Created: $ENTERPRISE_ID${NC}"
else
    echo "   ❌ Failed to create ENTERPRISE price"
    echo "$ENTERPRISE_PRICE"
fi

echo ""
echo "================================================"
echo ""
echo -e "${GREEN}✅ Done!${NC} New Stripe prices created."
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update database with new Price IDs via Admin UI:"
echo "   http://localhost:3000/admin/plans"
echo ""
echo "2. For STARTER plan, update Stripe Price ID to:"
echo "   $STARTER_ID"
echo ""
echo "3. For PRO plan, update Stripe Price ID to:"
echo "   $PRO_ID"
echo ""
echo "4. For ENTERPRISE plan, update Stripe Price ID to:"
echo "   $ENTERPRISE_ID"
echo ""
echo "5. Validation will show ✅ green checkmark when correct!"
echo ""
echo "💡 Tip: The old price IDs will still exist in Stripe but won't be used."
echo "    You can archive them later if needed."
echo ""
