# Phase 2: Advanced Monitoring - Implementation Plan

## 📋 Overview
This document outlines the implementation strategy for Phase 2 advanced monitoring features.

---

## 🎯 Implementation Priority (Recommended Order)

### Priority 1: Quick Wins (Week 1-2)
**Goal:** Deliver immediate value with minimal complexity

#### 1. Security Headers Monitoring ✅ START HERE
- **Effort:** Low (2-3 days)
- **Value:** Medium
- **Dependencies:** None
- **Why First:** Easiest to implement, immediate security value

#### 2. API Endpoint Monitoring
- **Effort:** Medium (5-7 days)
- **Value:** High
- **Dependencies:** None
- **Why Second:** High demand, moderate complexity, uses existing infrastructure

---

### Priority 2: Core Features (Week 3-6)

#### 3. Multi-Region Monitoring
- **Effort:** High (10-14 days)
- **Value:** Very High
- **Dependencies:** Need edge function deployment setup
- **Why Third:** Highest value feature, requires infrastructure changes

#### 4. DNS Monitoring
- **Effort:** Medium (5-7 days)
- **Value:** Medium
- **Dependencies:** None
- **Why Fourth:** Good complement to existing monitoring

---

### Priority 3: Advanced Features (Week 7-12)

#### 5. Performance Monitoring (Lighthouse/Web Vitals)
- **Effort:** High (10-14 days)
- **Value:** High
- **Dependencies:** Lighthouse API integration, performance budget logic
- **Why Fifth:** Complex but high value for end users

#### 6. Multi-Step Transaction Monitoring
- **Effort:** Very High (14-21 days)
- **Value:** High
- **Dependencies:** Playwright/Puppeteer, screenshot storage, session management
- **Why Last:** Most complex, but enterprise-level feature

---

## 📦 Implementation Plan for Each Feature

### 1. Security Headers Monitoring

#### Database Changes
```prisma
model SecurityCheck {
  id          String   @id @default(cuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  // Security Headers
  hasHSTS             Boolean  @default(false)
  hstsMaxAge          Int?
  hasCSP              Boolean  @default(false)
  cspPolicy           String?  @db.Text
  hasXFrameOptions    Boolean  @default(false)
  xFrameOptions       String?
  hasXContentType     Boolean  @default(false)
  hasXXSSProtection   Boolean  @default(false)
  hasReferrerPolicy   Boolean  @default(false)
  referrerPolicy      String?
  hasPermissionsPolicy Boolean @default(false)

  // Security Score
  securityScore       Int      @default(0) // 0-100
  issues              Json?    // Array of security issues found
  recommendations     Json?    // Array of recommendations

  checkedAt           DateTime @default(now())

  @@index([siteId])
  @@index([checkedAt])
  @@index([securityScore])
}

// Update Site model
model Site {
  // ... existing fields
  securityChecks      SecurityCheck[]
  securityScore       Int?     // Latest security score (cached)
  lastSecurityCheck   DateTime?
}
```

#### Implementation Files
1. `lib/security-headers.js` - Security header checking logic
2. `app/api/sites/[id]/security/route.js` - API endpoint
3. `components/SecurityScoreCard.js` - UI component
4. Update `app/sites/[id]/page.js` - Add security tab

#### Constants to Add
```javascript
// In lib/constants.js

export const SECURITY_HEADERS = {
  HSTS: 'Strict-Transport-Security',
  CSP: 'Content-Security-Policy',
  X_FRAME_OPTIONS: 'X-Frame-Options',
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  X_XSS_PROTECTION: 'X-XSS-Protection',
  REFERRER_POLICY: 'Referrer-Policy',
  PERMISSIONS_POLICY: 'Permissions-Policy',
};

export const SECURITY_GRADES = {
  A_PLUS: { min: 95, label: 'A+', color: 'green' },
  A: { min: 85, label: 'A', color: 'green' },
  B: { min: 70, label: 'B', color: 'blue' },
  C: { min: 50, label: 'C', color: 'yellow' },
  D: { min: 30, label: 'D', color: 'orange' },
  F: { min: 0, label: 'F', color: 'red' },
};

export const SECURITY_RECOMMENDATIONS = {
  NO_HSTS: 'Add Strict-Transport-Security header to enforce HTTPS',
  NO_CSP: 'Implement Content-Security-Policy to prevent XSS attacks',
  NO_X_FRAME_OPTIONS: 'Add X-Frame-Options to prevent clickjacking',
  NO_X_CONTENT_TYPE: 'Add X-Content-Type-Options: nosniff',
  WEAK_CSP: 'Content-Security-Policy is too permissive',
};
```

---

### 2. API Endpoint Monitoring

#### Database Changes
```prisma
enum SiteType {
  WEB
  API
  PING
}

enum HttpMethod {
  GET
  POST
  PUT
  PATCH
  DELETE
  HEAD
  OPTIONS
}

model Site {
  // ... existing fields
  siteType           SiteType   @default(WEB)
  httpMethod         HttpMethod @default(GET)
  requestHeaders     Json?      // Custom headers {"Authorization": "Bearer xxx"}
  requestBody        Json?      // Request payload for POST/PUT
  expectedStatus     Int[]      @default([200]) // Expected status codes
  responseValidation Json?      // JSON schema or validation rules
  authType           String?    // NONE, BEARER, API_KEY, BASIC
  authValue          String?    // Encrypted auth value
}

model ApiCheck {
  id              String   @id @default(cuid())
  siteId          String
  site            Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  requestMethod   String
  requestHeaders  Json?
  requestBody     Json?
  responseTime    Int      // ms
  statusCode      Int
  responseBody    Json?    // Store sample response
  responseHeaders Json?
  validationPassed Boolean  @default(true)
  validationErrors Json?   // Array of validation errors

  checkedAt       DateTime @default(now())

  @@index([siteId])
  @@index([checkedAt])
  @@index([statusCode])
}
```

#### Implementation Files
1. `lib/api-monitor.js` - API checking logic with auth support
2. `app/api/sites/route.js` - Update to support API sites
3. `components/ApiEndpointForm.js` - Form for API configuration
4. `components/ApiResponseViewer.js` - View API responses

---

### 3. Multi-Region Monitoring

#### Database Changes
```prisma
enum MonitoringRegion {
  GLOBAL
  US_EAST
  US_WEST
  EU_WEST
  EU_CENTRAL
  ASIA_PACIFIC
  ASIA_SOUTH
  SA_EAST
}

model Site {
  // ... existing fields
  monitorRegions  MonitoringRegion[] @default([GLOBAL])
  regionalChecks  RegionalCheck[]
}

model SiteCheck {
  // ... existing fields
  region          MonitoringRegion @default(GLOBAL)
  regionLatency   Int?             // Region-specific latency
}

model RegionalCheck {
  id              String           @id @default(cuid())
  siteId          String
  site            Site             @relation(fields: [siteId], references: [id], onDelete: Cascade)
  region          MonitoringRegion
  status          SiteStatus
  responseTime    Int
  statusCode      Int?
  errorMessage    String?
  checkedAt       DateTime         @default(now())

  @@index([siteId, region])
  @@index([checkedAt])
}

model RegionalIncident {
  id          String           @id @default(cuid())
  siteId      String
  region      MonitoringRegion
  status      IncidentStatus   @default(INVESTIGATING)
  severity    IncidentSeverity @default(MEDIUM)
  startTime   DateTime         @default(now())
  endTime     DateTime?
  aiSummary   String?          @db.Text

  @@index([siteId, region])
  @@index([startTime])
}
```

#### Implementation Files
1. `lib/regions.js` - Region configuration and edge function setup
2. `api/monitor/[region]/route.js` - Regional monitoring endpoints
3. `components/RegionalMap.js` - Geographic availability map
4. `components/RegionalLatencyChart.js` - Regional comparison

#### Constants
```javascript
export const MONITORING_REGIONS = {
  GLOBAL: { id: 'GLOBAL', name: 'Global', location: null },
  US_EAST: { id: 'US_EAST', name: 'US East', location: 'us-east-1', flag: '🇺🇸' },
  US_WEST: { id: 'US_WEST', name: 'US West', location: 'us-west-1', flag: '🇺🇸' },
  EU_WEST: { id: 'EU_WEST', name: 'EU West', location: 'eu-west-1', flag: '🇪🇺' },
  EU_CENTRAL: { id: 'EU_CENTRAL', name: 'EU Central', location: 'eu-central-1', flag: '🇪🇺' },
  ASIA_PACIFIC: { id: 'ASIA_PACIFIC', name: 'Asia Pacific', location: 'ap-southeast-1', flag: '🌏' },
  ASIA_SOUTH: { id: 'ASIA_SOUTH', name: 'Asia South', location: 'ap-south-1', flag: '🇮🇳' },
  SA_EAST: { id: 'SA_EAST', name: 'South America', location: 'sa-east-1', flag: '🌎' },
};
```

---

### 4. DNS Monitoring

#### Database Changes
```prisma
enum DnsRecordType {
  A
  AAAA
  CNAME
  MX
  TXT
  NS
  SOA
}

model DnsMonitoring {
  id                 String   @id @default(cuid())
  siteId             String
  site               Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  enabled            Boolean  @default(false)
  recordTypes        DnsRecordType[] // Which records to monitor
  alertOnChange      Boolean  @default(true)
  checkInterval      Int      @default(3600) // 1 hour
  lastChecked        DateTime?
  createdAt          DateTime @default(now())

  dnsRecords         DnsRecord[]
  dnsChanges         DnsChange[]

  @@index([siteId])
}

model DnsRecord {
  id                 String       @id @default(cuid())
  dnsMonitoringId    String
  dnsMonitoring      DnsMonitoring @relation(fields: [dnsMonitoringId], references: [id], onDelete: Cascade)
  type               DnsRecordType
  name               String
  value              String
  ttl                Int?
  priority           Int?       // For MX records
  lastSeen           DateTime   @default(now())
  firstSeen          DateTime   @default(now())
  isActive           Boolean    @default(true)

  @@index([dnsMonitoringId, type])
  @@index([lastSeen])
}

model DnsChange {
  id                 String       @id @default(cuid())
  dnsMonitoringId    String
  dnsMonitoring      DnsMonitoring @relation(fields: [dnsMonitoringId], references: [id], onDelete: Cascade)
  recordType         DnsRecordType
  changeType         String       // ADDED, REMOVED, MODIFIED
  oldValue           String?
  newValue           String?
  detectedAt         DateTime     @default(now())

  @@index([dnsMonitoringId])
  @@index([detectedAt])
}
```

---

### 5. Performance Monitoring

#### Database Changes
```prisma
model PerformanceMonitoring {
  id                  String   @id @default(cuid())
  siteId              String
  site                Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  enabled             Boolean  @default(false)
  checkInterval       Int      @default(21600) // 6 hours
  device              String   @default("desktop") // desktop, mobile
  performanceMetrics  PerformanceMetric[]
  performanceBudgets  PerformanceBudget[]

  @@index([siteId])
}

model PerformanceMetric {
  id                    String  @id @default(cuid())
  performanceMonitoringId String
  performanceMonitoring PerformanceMonitoring @relation(fields: [performanceMonitoringId], references: [id], onDelete: Cascade)

  // Lighthouse Scores
  performanceScore      Int?    // 0-100
  accessibilityScore    Int?    // 0-100
  bestPracticesScore    Int?    // 0-100
  seoScore              Int?    // 0-100
  pwaScore              Int?    // 0-100

  // Core Web Vitals
  lcp                   Float?  // Largest Contentful Paint (ms)
  fid                   Float?  // First Input Delay (ms)
  cls                   Float?  // Cumulative Layout Shift
  fcp                   Float?  // First Contentful Paint (ms)
  ttfb                  Float?  // Time to First Byte (ms)
  tti                   Float?  // Time to Interactive (ms)
  tbt                   Float?  // Total Blocking Time (ms)
  si                    Float?  // Speed Index

  // Resource Metrics
  pageSize              Int?    // Total bytes
  requestCount          Int?    // Number of requests
  domSize               Int?    // DOM elements

  device                String  @default("desktop")
  checkedAt             DateTime @default(now())

  @@index([performanceMonitoringId])
  @@index([checkedAt])
}

model PerformanceBudget {
  id                    String  @id @default(cuid())
  performanceMonitoringId String
  performanceMonitoring PerformanceMonitoring @relation(fields: [performanceMonitoringId], references: [id], onDelete: Cascade)

  metric                String  // lcp, fid, cls, performanceScore, etc.
  threshold             Float   // Maximum allowed value
  alertOnViolation      Boolean @default(true)

  @@unique([performanceMonitoringId, metric])
}
```

---

### 6. Transaction Monitoring

#### Database Changes
```prisma
model TransactionMonitor {
  id              String   @id @default(cuid())
  siteId          String
  site            Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  name            String
  description     String?
  enabled         Boolean  @default(true)
  checkInterval   Int      @default(300) // 5 minutes
  timeout         Int      @default(30000) // 30 seconds

  steps           TransactionStep[]
  checks          TransactionCheck[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([siteId])
}

model TransactionStep {
  id                  String   @id @default(cuid())
  transactionMonitorId String
  transactionMonitor  TransactionMonitor @relation(fields: [transactionMonitorId], references: [id], onDelete: Cascade)

  stepNumber          Int
  stepType            String   // NAVIGATE, CLICK, TYPE, WAIT, ASSERT
  selector            String?  // CSS selector
  value               String?  // Value to type or expected value
  waitTime            Int?     // Wait time in ms
  screenshotOnFail    Boolean  @default(true)
  required            Boolean  @default(true)

  @@index([transactionMonitorId])
  @@unique([transactionMonitorId, stepNumber])
}

model TransactionCheck {
  id                  String   @id @default(cuid())
  transactionMonitorId String
  transactionMonitor  TransactionMonitor @relation(fields: [transactionMonitorId], references: [id], onDelete: Cascade)

  success             Boolean
  totalDuration       Int      // Total time in ms
  failedStep          Int?     // Step number that failed
  errorMessage        String?
  screenshots         Json?    // Array of screenshot URLs
  stepResults         Json?    // Detailed step results

  checkedAt           DateTime @default(now())

  @@index([transactionMonitorId])
  @@index([checkedAt])
  @@index([success])
}
```

---

## 🚀 Getting Started

### Step 1: Start with Security Headers Monitoring
This is the quickest win and will help us establish patterns for the other features.

**Next Steps:**
1. Create migration for SecurityCheck model
2. Implement lib/security-headers.js
3. Create API endpoint
4. Build UI components
5. Test and deploy

Would you like me to start implementing Security Headers Monitoring now?
