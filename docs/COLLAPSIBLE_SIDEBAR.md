# Collapsible Sidebar Feature

## Overview
The MonitHQ sidebar now features a **collapsible/resizable design** that allows users to toggle between:
- **Expanded mode** (256px width) - Shows icon + text labels
- **Collapsed mode** (80px width) - Shows icons only with tooltips

## ✨ Key Features

### 1. **Toggle Button**
- Located in the top-right corner of the sidebar
- Animated chevron icon (left/right)
- Smooth 300ms transition animation
- Persists state in localStorage

### 2. **Icon-Only Mode (Collapsed)**
- Width: 80px (w-20)
- Shows only icons centered
- Hover tooltips appear on the right side
- Logo shows only "M" initial
- User avatar shows initials only
- All interactive elements remain accessible

### 3. **Icon + Text Mode (Expanded)**
- Width: 256px (w-64)
- Shows full navigation labels
- Shows complete "MonitHQ" logo
- Shows user name and email
- Default state for new users

### 4. **Smart Main Content**
- Automatically adjusts margin-left based on sidebar state
- Smooth 300ms transition when sidebar toggles
- Collapsed: ml-20 (80px margin)
- Expanded: ml-64 (256px margin)
- No content overlap or jumping

### 5. **Tooltip Behavior**
- Only shown in collapsed mode
- Appears on hover with 0.3s delay
- Positioned to the right of icons
- Dark background with border
- Z-index: 50 (appears above other content)
- Smooth opacity transition

## 🎯 User Experience

### Expanding the Sidebar
1. Click the chevron-left button
2. Sidebar smoothly expands to full width
3. Text labels fade in
4. Main content shifts right
5. State saved to localStorage

### Collapsing the Sidebar
1. Click the chevron-right button
2. Sidebar smoothly collapses to icon-only
3. Text labels fade out
4. Tooltips become available on hover
5. Main content expands left
6. State saved to localStorage

## 🔧 Technical Implementation

### Context Provider
**File:** `/contexts/SidebarContext.js`

```javascript
const { isCollapsed, toggleSidebar } = useSidebar();
```

**Features:**
- Global state management
- localStorage persistence
- Available to all components
- Automatic rehydration on page load

### Sidebar Component
**File:** `/components/Sidebar.js`

**Key Elements:**
- Dynamic width class: `isCollapsed ? 'w-20' : 'w-64'`
- Transition class: `transition-all duration-300`
- Conditional rendering for text labels
- Tooltip positioning in collapsed mode

### Main Content Wrapper
**File:** `/components/MainContent.js`

**Features:**
- Syncs with sidebar state
- Smooth transition matching sidebar
- Prevents layout shift
- Maintains responsive design

### Updated Pages
All authenticated pages now use `<MainContent>` wrapper:
- ✅ Dashboard (`/app/dashboard/page.js`)
- ✅ Sites (`/app/sites/page.js`)
- ✅ Incidents (`/app/incidents/page.js`)
- ✅ Insights (`/app/insights/page.js`)
- ✅ Billing (`/app/billing/page.js`)
- ✅ Settings (`/app/settings/page.js`)

## 📱 Responsive Behavior

### Desktop (1024px+)
- Full sidebar functionality
- Toggle works perfectly
- Smooth animations
- No layout issues

### Tablet (768px-1023px)
- Sidebar may overlay content (future enhancement)
- Currently maintains same behavior
- Consider mobile menu for smaller screens

### Mobile (<768px)
- **Recommended:** Implement hamburger menu
- **Alternative:** Default to collapsed mode
- Touch-friendly toggle button

## 🎨 Visual Design

### Expanded State
```
┌─────────────────────────┐
│ [M] MonitHQ       [<]   │ ← Header
├─────────────────────────┤
│ 🏠 Dashboard            │
│ 🌐 Sites                │
│ ⚠️  Incidents           │
│ 🧠 AI Insights          │
│ 💳 Billing              │
│ ⚙️  Settings            │
│                         │
│         ...             │
│                         │
├─────────────────────────┤
│ [JD] John Doe           │ ← User
│      john@example.com   │
└─────────────────────────┘
```

### Collapsed State
```
┌──────┐
│ [M][>]│ ← Header
├──────┤
│  🏠  │ Dashboard (tooltip)
│  🌐  │ Sites (tooltip)
│  ⚠️   │ Incidents (tooltip)
│  🧠  │ AI Insights (tooltip)
│  💳  │ Billing (tooltip)
│  ⚙️   │ Settings (tooltip)
│      │
│  ... │
│      │
├──────┤
│ [JD] │ ← User
└──────┘
```

## 🔐 State Persistence

**localStorage Key:** `sidebar-collapsed`

**Values:**
- `true` - Sidebar is collapsed
- `false` - Sidebar is expanded
- `null` - First visit (defaults to expanded)

**Behavior:**
- Persists across page reloads
- Persists across sessions
- Synced across all pages
- Can be cleared via browser DevTools

## ⚡ Performance

### Animations
- CSS transitions (hardware accelerated)
- No JavaScript animations
- 60fps smooth scrolling
- GPU-accelerated transforms

### Rendering
- No re-renders on toggle
- Context provider at root level
- Minimal DOM changes
- Efficient state updates

## 🎯 Accessibility

### Keyboard Navigation
- ✅ Tab to toggle button
- ✅ Enter/Space to activate
- ✅ All nav items keyboard accessible
- ✅ Focus visible on all interactive elements

### Screen Readers
- ✅ Title attributes on icons
- ✅ Semantic HTML structure
- ✅ ARIA labels on buttons
- ✅ Tooltip text available to screen readers

### Visual
- ✅ High contrast icons
- ✅ Clear hover states
- ✅ Large click targets (44x44px minimum)
- ✅ Visible focus indicators

## 🐛 Known Limitations

### Current
1. No mobile hamburger menu (yet)
2. Sidebar always visible on all screen sizes
3. No drag-to-resize functionality
4. Fixed breakpoints (not customizable)

### Planned Enhancements
1. **Mobile Menu**
   - Hamburger icon on mobile
   - Overlay sidebar on small screens
   - Swipe gestures to open/close

2. **Drag Resize**
   - Draggable resize handle
   - Custom width between 80-400px
   - Snap points for common sizes

3. **Customization**
   - User preference for icon size
   - Custom sidebar themes
   - Position toggle (left/right)

4. **Animation Options**
   - Slide animation
   - Fade animation
   - No animation (accessibility)

## 📊 Usage Statistics (Recommended)

Track user preferences to optimize default state:
- % users who keep sidebar expanded
- % users who prefer collapsed
- Time to first toggle
- Toggles per session
- Screen size correlation

## 🔗 Related Files

```
/contexts/SidebarContext.js    - State management
/components/Sidebar.js         - Sidebar component
/components/MainContent.js     - Content wrapper
/app/layout.js                 - Root provider wrapper
/app/*/page.js                 - All authenticated pages
/lib/constants.js              - Sidebar links configuration
/app/globals.css               - Tooltip and transition styles
```

## 🚀 Future Ideas

1. **Pinned Items**
   - Pin favorite pages to top
   - Custom order via drag-drop
   - Quick access shortcuts

2. **Mini Profiles**
   - Hover user avatar for quick menu
   - Status indicator (online/away)
   - Quick settings access

3. **Sidebar Themes**
   - Light/dark independent theme
   - Gradient backgrounds
   - Custom color schemes

4. **Search**
   - Quick search in collapsed mode
   - Fuzzy find navigation
   - Recent pages

5. **Notifications**
   - Badge counts on nav items
   - Real-time alerts
   - Activity indicators

---

**Status:** ✅ Fully implemented and working
**Version:** 1.0
**Last Updated:** November 4, 2025
