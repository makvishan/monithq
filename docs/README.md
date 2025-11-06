# MonitHQ - AI-Powered Website Monitoring & Uptime Tracking

A modern, sleek SaaS web application for monitoring website uptime with AI-powered insights and incident analysis.

![MonitHQ](https://img.shields.io/badge/Next.js-16.0-black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.0-ff0055)

## 🚀 Features

### Landing Page (/)
- **SEO-optimized** with proper meta tags and OpenGraph
- Hero section with animated dashboard preview
- Feature showcase with icon cards
- "How It Works" 3-step process
- Pricing plans comparison (Free, Pro, Enterprise)
- Customer testimonials
- Fully responsive design
- Dark/Light mode toggle

### Dashboard (/dashboard)
- Real-time stats overview (Total Sites, Sites Online, Average Uptime, Active Incidents)
- Interactive charts (Uptime Trend & Response Time)
- Site status cards with live data
- Recent incidents list with AI summaries
- Smooth animations and transitions

### Sites Management (/sites)
- Comprehensive sites table
- Add/Edit/Delete functionality
- Modal for adding new sites
- Status indicators and metrics

### AI Insights (/insights)
- AI-generated reports and recommendations
- Confidence scoring for each insight
- Categorized insights (Performance, Alert, Pattern, Recommendation)
- Visual progress indicators

### Additional Pages
- **Billing** (/billing) - Subscription management
- **Settings** (/settings) - Organization & team settings
- **Incidents** (/incidents) - Incident tracking
- **Auth Pages** - Login, Register, Forgot Password

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript (No TypeScript)
- **Styling:** TailwindCSS 4
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 📁 Project Structure

```
/app
├── layout.js                 # Root layout with SEO metadata
├── page.js                   # Landing page
├── dashboard/page.js         # Main dashboard
├── sites/page.js             # Sites management
├── insights/page.js          # AI insights
├── billing/page.js           # Subscription & billing
├── settings/page.js          # Organization settings
├── incidents/page.js         # Incident tracking
└── auth/
    ├── login/page.js
    ├── register/page.js
    └── forgot-password/page.js

/components
├── Navbar.js                 # Landing page navigation
├── Sidebar.js                # Dashboard sidebar
├── Card.js                   # Reusable card component
├── ChartCard.js              # Chart wrapper
└── SiteStatusCard.js         # Site status display

/lib
├── utils.js                  # Helper functions
└── constants.js              # Dummy data & constants
```

## 🚦 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎨 Design Philosophy

- **Modern SaaS Aesthetic:** Clean, minimal design inspired by Linear, Vercel, and Supabase
- **AI-Themed Gradients:** Vibrant gradient effects and glowing elements for modern AI aesthetic
- **Color Palette:** Blues and purples for an AI/tech feel with dynamic gradients
- **Typography:** Inter font for excellent readability with gradient text effects
- **Responsive:** Mobile-first approach, works on all devices
- **Animations:** Subtle, purposeful animations using Framer Motion + CSS gradient animations
- **Dark Mode:** Full dark mode support with optimized glow effects

### ✨ Gradient Features
MonitHQ features a comprehensive gradient system with:
- **7 gradient utility classes** for various use cases
- **3 glow effect classes** for depth and emphasis
- **Animated gradients** with smooth color transitions
- **Glass morphism** effects on AI-related components
- **Gradient text** for headings and important values
- **Gradient borders** for premium cards and CTAs
- **🆕 Status-based gradients** for visual differentiation:
  - 🟢 **Green** for success/positive metrics (uptime, online sites)
  - � **Red** for errors/incidents (problems that need attention)
  - 🔵 **Blue** for neutral information (counts, stats)
  - 🟣 **Purple** for AI features and primary actions
  - 🟠 **Orange** for warnings and caution states

�📚 **See detailed documentation:**
- [GRADIENT_ENHANCEMENTS.md](./GRADIENT_ENHANCEMENTS.md) - Complete technical guide
- [GRADIENT_QUICK_REFERENCE.md](./GRADIENT_QUICK_REFERENCE.md) - Quick developer reference
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Overview of all changes
- [STATUS_GRADIENTS.md](./STATUS_GRADIENTS.md) - Status-based color system guide
- [VISUAL_IMPROVEMENTS.md](./VISUAL_IMPROVEMENTS.md) - Before/after visual improvements

## 📊 Dummy Data

The application uses realistic dummy data for demonstration purposes, located in `/lib/constants.js`. This includes:
- 5 monitored sites with various statuses
- 4 incident records with AI summaries
- 5 AI insights with different categories
- Team members and billing history

## 🎯 Pages Overview

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing page with hero, features, pricing | ✅ Complete |
| `/dashboard` | Main dashboard with charts & stats | ✅ Complete |
| `/sites` | Manage monitored websites | ✅ Complete |
| `/insights` | AI-generated reports | ✅ Complete |
| `/billing` | Subscription management | ✅ Complete |
| `/settings` | Organization & team settings | ✅ Complete |
| `/incidents` | Incident tracking | ✅ Complete |
| `/auth/login` | User login | ✅ Complete |
| `/auth/register` | User registration | ✅ Complete |
| `/auth/forgot-password` | Password reset | ✅ Complete |

## 🔧 Customization

### Colors
Edit CSS variables in `app/globals.css`:
```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  /* ... more variables */
}
```

### Dummy Data
Replace data in `lib/constants.js` with real API calls.

## 🚀 Next Steps for Production

To make this production-ready:
1. **Backend Integration** - Set up API endpoints and database
2. **Authentication** - Add NextAuth.js or similar
3. **Real-time Features** - WebSocket connections for live updates
4. **Payment Integration** - Stripe for subscriptions
5. **Monitoring Logic** - Actual website pinging and AI integration

## ♿ Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## 📝 License

This project is a demonstration/portfolio piece. Feel free to use it as a template for your own projects.

---

**Built with ❤️ using Next.js, TailwindCSS, and Framer Motion**


Looking at the todo list, there's only one remaining task: Migrate to NextAuth.js (Optional).

However, since all the core features are complete, here are some suggestions for what could come next:

Option 1: Deploy to Production
Set up PostgreSQL database on a hosting provider (Supabase, Neon, Railway, etc.)
Deploy to Vercel
Configure environment variables
Set up Pusher and Resend API keys
Test all features in production
Option 2: Additional Features
Some nice-to-have features that could enhance the platform:

Status Pages - Public status pages for organizations to share with customers
Webhooks - Allow users to send notifications to custom endpoints
2FA (Two-Factor Authentication) - Add extra security layer
Email Templates - Rich HTML email templates for notifications
Dashboard Widgets - Customizable dashboard with drag-and-drop widgets
Export Data - Allow users to export their monitoring data (CSV/JSON)
API Keys - Generate API keys for programmatic access
Integrations - Slack, Discord, PagerDuty integrations
Mobile Responsive - Ensure all pages work well on mobile
Dark Mode - Theme toggle for better user experience
Option 3: Testing & Documentation
Write API documentation
Add unit tests
Add integration tests
Create user documentation/help center