# MonitHQ Component Library

A comprehensive guide to all reusable components in the MonitHQ application.

## 🎨 UI Components

### Card Component
**Location:** `components/Card.js`

A versatile card component with multiple sub-components for structured content.

#### Basic Usage
```javascript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/Card';

<Card>
  <CardHeader>
    <CardTitle>Title Here</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

#### Props
- `hover` (boolean) - Adds hover effect with shadow
- `className` - Additional CSS classes

#### Sub-components
- `CardHeader` - Top section with title/description
- `CardTitle` - Bold heading text
- `CardDescription` - Muted subtitle text
- `CardContent` - Main content area
- `CardFooter` - Bottom section with border-top

### ChartCard Component
**Location:** `components/ChartCard.js`

Wrapper for Recharts with built-in styling and tooltips.

#### Usage
```javascript
import ChartCard from '@/components/ChartCard';
import { generateUptimeData } from '@/lib/utils';

const data = generateUptimeData(7);

<ChartCard
  title="Uptime Trend"
  description="Last 7 days"
  data={data}
  dataKey="uptime"
  type="area"
  color="#10b981"
/>
```

#### Props
- `title` (string) - Chart title
- `description` (string) - Chart subtitle
- `data` (array) - Chart data array
- `dataKey` (string) - Key to plot (e.g., 'uptime', 'responseTime')
- `type` ('line' | 'area') - Chart type
- `color` (string) - Hex color for the line/area

#### Data Format
```javascript
[
  { date: 'Nov 1', uptime: 99.5, responseTime: 120 },
  { date: 'Nov 2', uptime: 99.8, responseTime: 110 },
  // ...
]
```

### SiteStatusCard Component
**Location:** `components/SiteStatusCard.js`

Displays site monitoring information with status indicators.

#### Usage
```javascript
import SiteStatusCard from '@/components/SiteStatusCard';

<SiteStatusCard site={{
  name: 'My Website',
  url: 'https://example.com',
  status: 'online',
  uptime: 99.9,
  averageLatency: 145,
  lastChecked: new Date().toISOString(),
  region: 'US East'
}} />
```

#### Props
- `site` (object) - Site data object with:
  - `name` - Site display name
  - `url` - Website URL
  - `status` - 'online' | 'offline' | 'degraded' | 'maintenance'
  - `uptime` - Percentage (0-100)
  - `averageLatency` - Response time in ms
  - `lastChecked` - ISO date string
  - `region` - Geographic region

### Navbar Component
**Location:** `components/Navbar.js`

Responsive navigation bar for landing page.

#### Usage
```javascript
import Navbar from '@/components/Navbar';

<Navbar />
```

#### Features
- Logo with link to home
- Navigation links (from constants)
- Dark mode toggle
- Mobile hamburger menu
- CTA buttons (Login, Sign Up)
- Sticky positioning

### Sidebar Component
**Location:** `components/Sidebar.js`

Dashboard sidebar navigation with active route highlighting.

#### Usage
```javascript
import Sidebar from '@/components/Sidebar';

<Sidebar />
```

#### Features
- Logo at top
- Navigation links with icons
- Active route highlighting (using usePathname)
- User profile at bottom
- Fixed positioning
- Scrollable navigation

## 🛠️ Utility Functions

### Location: `lib/utils.js`

#### `cn(...inputs)`
Merge Tailwind classes with proper precedence.
```javascript
import { cn } from '@/lib/utils';

<div className={cn('base-class', condition && 'conditional-class', className)} />
```

#### `formatUptime(uptime)`
Format uptime percentage.
```javascript
formatUptime(99.95) // "99.95%"
```

#### `formatResponseTime(ms)`
Format response time.
```javascript
formatResponseTime(145) // "145ms"
formatResponseTime(1500) // "1.50s"
```

#### `formatDate(date)`
Format date to readable string.
```javascript
formatDate('2024-11-04') // "Nov 4, 2024"
```

#### `formatDateTime(date)`
Format date and time.
```javascript
formatDateTime(new Date()) // "Nov 4, 2024, 10:30 AM"
```

#### `formatRelativeTime(date)`
Format as relative time.
```javascript
formatRelativeTime(Date.now() - 120000) // "2m ago"
formatRelativeTime(Date.now() - 3600000) // "1h ago"
formatRelativeTime(Date.now() - 86400000) // "1d ago"
```

#### `getStatusColor(status)`
Get Tailwind classes for status.
```javascript
getStatusColor('online') // "text-green-500 bg-green-500/10"
getStatusColor('offline') // "text-red-500 bg-red-500/10"
```

#### `getStatusBadge(status)`
Get badge background color.
```javascript
getStatusBadge('online') // "bg-green-500"
```

#### `generateUptimeData(days)`
Generate dummy chart data.
```javascript
const data = generateUptimeData(7); // 7 days of data
```

#### `formatDuration(ms)`
Format duration to human readable.
```javascript
formatDuration(3600000) // "1h 0m"
formatDuration(90000) // "1m 30s"
```

## 📊 Constants & Data

### Location: `lib/constants.js`

#### DUMMY_SITES
Array of monitored sites with status information.
```javascript
import { DUMMY_SITES } from '@/lib/constants';

DUMMY_SITES.forEach(site => {
  console.log(site.name, site.status);
});
```

#### DUMMY_INCIDENTS
Array of incident records with AI summaries.
```javascript
import { DUMMY_INCIDENTS } from '@/lib/constants';
```

#### DUMMY_AI_INSIGHTS
Array of AI-generated insights.
```javascript
import { DUMMY_AI_INSIGHTS } from '@/lib/constants';
```

#### PRICING_PLANS
Array of subscription plans (Free, Pro, Enterprise).
```javascript
import { PRICING_PLANS } from '@/lib/constants';

<div>
  {PRICING_PLANS.map(plan => (
    <PricingCard key={plan.name} plan={plan} />
  ))}
</div>
```

#### FEATURES
Array of product features for landing page.
```javascript
import { FEATURES } from '@/lib/constants';
```

#### TESTIMONIALS
Customer testimonials.
```javascript
import { TESTIMONIALS } from '@/lib/constants';
```

#### NAVIGATION_LINKS
Landing page navigation links.
```javascript
import { NAVIGATION_LINKS } from '@/lib/constants';
```

#### SIDEBAR_LINKS
Dashboard sidebar links with icons.
```javascript
import { SIDEBAR_LINKS } from '@/lib/constants';

// Structure:
{
  label: 'Dashboard',
  href: '/dashboard',
  icon: 'LayoutDashboard' // Lucide icon name
}
```

#### NOTIFICATION_CHANNELS
Available notification methods.
```javascript
import { NOTIFICATION_CHANNELS } from '@/lib/constants';
```

#### SUBSCRIPTION_HISTORY
Past billing records.
```javascript
import { SUBSCRIPTION_HISTORY } from '@/lib/constants';
```

#### TEAM_MEMBERS
Organization team members.
```javascript
import { TEAM_MEMBERS } from '@/lib/constants';
```

## 🎭 Animation Patterns

### Framer Motion Usage

#### Fade In Up (Landing Page)
```javascript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

<motion.div {...fadeInUp}>
  Content
</motion.div>
```

#### Scroll Reveal
```javascript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

#### Staggered List
```javascript
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
  >
    {item.content}
  </motion.div>
))}
```

#### Modal Animation
```javascript
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.2 }}
  className="modal"
>
  Modal Content
</motion.div>
```

#### Progress Bar
```javascript
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 1 }}
  className="progress-bar"
/>
```

## 🎨 Styling Patterns

### Card Hover Effect
```javascript
<Card hover className="custom-class">
  Content
</Card>
```

### Status Indicators
```javascript
<span className={getStatusBadge(status)} />
```

### Gradient Backgrounds
```css
bg-gradient-to-br from-primary to-secondary
```

### Glass Morphism
```css
bg-background/80 backdrop-blur-lg
```

## 🔌 Integration Examples

### Adding a New Stat Card
```javascript
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Label</p>
        <p className="text-3xl font-bold text-foreground">Value</p>
      </div>
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Adding a Table
```javascript
<Card>
  <CardContent className="p-0">
    <table className="w-full">
      <thead className="border-b border-border bg-muted/50">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold">Header</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {data.map(item => (
          <tr key={item.id} className="hover:bg-muted/50">
            <td className="px-6 py-4">{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </CardContent>
</Card>
```

## 📱 Responsive Patterns

### Grid Layouts
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### Flex Responsive
```css
flex flex-col sm:flex-row gap-4
```

### Hidden on Mobile
```css
hidden md:flex
```

### Mobile Menu
```css
md:hidden
```

## 🎯 Best Practices

1. **Always use utility functions** for formatting
2. **Import from constants** for data
3. **Use motion.div** for animations
4. **Keep components small** and focused
5. **Use TypeScript types** (when adding TS)
6. **Follow existing patterns** for consistency
7. **Test responsive** on multiple screens
8. **Add hover states** for interactivity

---

**Component library complete!** Use these building blocks to extend your application.
