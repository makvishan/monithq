#!/bin/bash

# This script helps find files that still have hardcoded values
# Run: chmod +x find-hardcoded.sh && ./find-hardcoded.sh

echo "========================================"
echo "Finding Hardcoded Values in Codebase"
echo "========================================"
echo ""

echo "1. Checking for hardcoded ROLES..."
echo "----------------------------------------"
grep -r "'SUPER_ADMIN'\|'ORG_ADMIN'\|'USER'" app/ lib/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -n | grep -v "constants.js" | grep -v "constants-examples.js" | head -20
echo ""

echo "2. Checking for hardcoded SITE STATUS..."
echo "----------------------------------------"
grep -r "'ONLINE'\|'OFFLINE'\|'DEGRADED'\|'MAINTENANCE'\|'UNKNOWN'" app/ lib/ --include="*.js" --include="*.jsx" -n | grep -v "constants.js" | grep -v "constants-examples.js" | head -20
echo ""

echo "3. Checking for hardcoded INCIDENT STATUS..."
echo "----------------------------------------"
grep -r "'INVESTIGATING'\|'IDENTIFIED'\|'MONITORING'\|'RESOLVED'" app/ lib/ --include="*.js" --include="*.jsx" -n | grep -v "constants.js" | grep -v "constants-examples.js" | head -20
echo ""

echo "========================================"
echo "Files Already Updated:"
echo "========================================"
echo "✅ /lib/constants.js - Constants defined"
echo "✅ /lib/api-middleware.js - Role constants"
echo "✅ /app/api/cron/monitor/route.js - Status and incident constants"
echo "✅ /app/api/auth/register/route.js - Default role"
echo "✅ /app/api/organizations/team/invite/route.js - Default role"
echo "✅ /app/api/organizations/team/[userId]/route.js - Role check"
echo ""

echo "========================================"
echo "Priority Files to Update Next:"
echo "========================================"
echo "📝 app/api/sites/[id]/check/route.js"
echo "📝 app/api/sites/[id]/uptime-trend/route.js"
echo "📝 app/api/sites/[id]/timeline/route.js"
echo "📝 app/api/sites/[id]/distributions/route.js"
echo "📝 app/api/dashboard/stats/route.js"
echo "📝 app/api/dashboard/sites/route.js"
echo "📝 app/api/dashboard/charts/route.js"
echo "📝 app/api/status/[slug]/route.js"
echo "📝 app/api/export/uptime/route.js"
echo "📝 app/api/admin/monitoring/route.js"
echo "📝 app/api/users/settings/route.js"
echo ""

echo "========================================"
echo "To update a file:"
echo "========================================"
echo "1. Add import at top:"
echo "   import { SITE_STATUS, INCIDENT_STATUS, USER_ROLES } from '@/lib/constants';"
echo ""
echo "2. Replace hardcoded strings:"
echo "   'ONLINE' → SITE_STATUS.ONLINE"
echo "   'INVESTIGATING' → INCIDENT_STATUS.INVESTIGATING"
echo "   'SUPER_ADMIN' → USER_ROLES.SUPER_ADMIN"
echo ""
echo "3. Test the changes"
echo "========================================"
