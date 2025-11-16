# Site Details Page Refactoring Plan

## Current Issues
- All monitoring features displayed in one long scrolling page
- Hard to find specific information
- Poor mobile experience
- Information overload

## Proposed Solution: Tabbed Interface

### Tab 1: Overview (Default)
**Purpose:** Key metrics and quick status at a glance

**Contents:**
- ✅ Hero Section (Site name, URL, status badge, Check Now, Edit buttons)
- ✅ 4 Stat Cards (Uptime, Response Time, Last Checked, Total Checks)
- ✅ Uptime Statistics Chart
- ✅ Status Timeline Heatmap (24-hour)
- ✅ Recent Incidents (Top 5)
- ✅ Latest AI Insights

**Benefits:**
- Quick overview of site health
- Most important info visible immediately
- No scrolling needed for key metrics

---

### Tab 2: Advanced Monitoring
**Purpose:** All monitoring features in one organized place

**Contents:**
- 🔒 SSL Certificate Monitoring (if HTTPS)
- 🛡️ Security Headers Score
- 🌍 Multi-Region Performance Map
- 🌐 DNS Records & Change Detection
- ⚡ Performance Metrics & Web Vitals

**Benefits:**
- All advanced features grouped logically
- Less overwhelming than current layout
- Easy to find specific monitoring data

---

### Tab 3: Analytics & Performance
**Purpose:** Historical data and trends

**Contents:**
- 📊 Response Time Distribution Chart
- 📈 Uptime Trend Chart (24h/7d/30d selector)
- 🕐 Status Timeline (detailed)
- 📉 Performance Over Time
- 📊 Regional Performance Comparison

**Benefits:**
- Focus on data analysis
- Better chart visibility
- Compare metrics side-by-side

---

### Tab 4: History & Incidents
**Purpose:** Complete audit trail

**Contents:**
- 🚨 All Incidents (with filters)
- 📝 Recent Checks Table (last 50)
- 🤖 AI Insights History
- 💬 Incident Comments/Notes
- 📥 Export Options

**Benefits:**
- Complete historical record
- Easier incident investigation
- Better for compliance/reporting

---

## Implementation Steps

### Phase 1: Add Tab Navigation ✅
1. Add tab state
2. Add Shield icon import
3. Add tab navigation UI
4. Style active/inactive tabs

### Phase 2: Reorganize Overview Tab
1. Keep header as-is
2. Keep 4 stat cards
3. Move Uptime Statistics here
4. Move Status Timeline here
5. Add "Recent Incidents" widget (top 5)
6. Add "Latest AI Insight" widget

### Phase 3: Create Advanced Monitoring Tab
1. Move SSL Certificate card
2. Move Security Score card
3. Move Multi-Region card
4. Move DNS Monitoring card
5. Move Performance Monitoring card

### Phase 4: Create Analytics Tab
1. Move Response Time Distribution
2. Move detailed timeline
3. Add performance trend chart
4. Add time range selector

### Phase 5: Create History Tab
1. Move full incidents list
2. Move recent checks table
3. Add AI insights history
4. Add export functionality

### Phase 6: Polish & Mobile
1. Test tab switching
2. Optimize mobile layout
3. Add loading states per tab
4. Add empty states

---

## Benefits Summary

✅ **Better Organization** - Logical grouping of related features
✅ **Improved Performance** - Load only active tab data
✅ **Better Mobile UX** - Tabs work well on mobile
✅ **Easier Navigation** - Find what you need faster
✅ **Less Overwhelming** - Information presented in digestible chunks
✅ **Scalable** - Easy to add new features to appropriate tabs

---

## Color Coding
- 🔵 Overview - Blue (Activity icon)
- 🟢 Monitoring - Green (Shield icon)
- 🟡 Analytics - Yellow (BarChart3 icon)
- 🔴 History - Red (Clock icon)
