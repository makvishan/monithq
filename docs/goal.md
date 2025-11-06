Goal:
Build the frontend UI for a SaaS web app called MonitHQ, an AI-powered website monitoring and uptime tracking tool.
It helps organizations track site uptime, get alerts when a site goes down, and view AI-generated summaries of incidents.
The app will use Next.js (App Router) with JavaScript (no TypeScript), TailwindCSS, and Shadcn/UI for components.

⸻

🎯 Requirements Overview

Create:
1.	Landing Page — SEO-optimized, conversion-focused
2.	Dashboard UI — for logged-in users (multi-site monitoring)
3.	Auth Pages — login, register, forgot password
4.	Billing Page — simple Stripe subscription layout
5.	Settings Page — organization + notification settings

⸻

⚙️ Tech Stack
•	Framework: Next.js (no TypeScript)
•	Styling: TailwindCSS
•	Components: Shadcn/UI
•	Charts: Recharts or Chart.js
•	Routing: App Router structure
•	SEO: Use <Head> metadata tags for title, description, canonical, and OG.
•	Responsive Design: Desktop + mobile-friendly
•	Animations: Use Framer Motion for smooth UI transitions

⸻

🧩 Pages to Generate

/ – Landing Page (SEO Optimized) Purpose: Showcase the product, convert visitors.
Sections:
•	Hero section → product tagline (“AI-Powered Website Monitoring & Alerts”)
•	Key Features:
•	Real-time uptime monitoring
•	AI-powered incident summaries
•	Team dashboards
•	Smart notifications
•	“How it Works” 3-step section (Monitor → Analyze → Alert)
•	Pricing Plans (Free / Pro / Enterprise)
•	Testimonials or trust badges
•	CTA: “Start Monitoring for Free”
•	Footer with links (About, Docs, Privacy Policy)

Design tone: clean, minimal, slightly futuristic (AI theme), dark/light mode toggle.

⸻

/dashboard – Main App UI (after login) Purpose: Show uptime and site status.
Layout:
•	Sidebar navigation:
•	Dashboard
•	Sites
•	Incidents
•	Insights (AI)
•	Billing
•	Settings
•	Topbar: User menu + Org name
•	Main content cards:
•	Site summary (name, status, uptime %, response time)
•	Charts:
•	Uptime trend over last 7 days
•	Response time chart
•	Table: Incident history (status, duration, AI summary)
•	Floating action: “+ Add Site” button (opens modal)

Design tone: modern SaaS dashboard (like Linear or Vercel).

⸻

/sites – Manage Websites • List of monitored sites with: • URL • Status (🟢/🔴) • Last checked • Average latency • “Add Site” modal → input URL + friendly name • Delete / Edit options
⸻

/insights – AI-Generated Reports • Show AI summaries: • “Your site had 3 downtimes this week.” • “Average latency increased by 15% yesterday.” • Cards with AI insights, each having: • Summary text • Confidence indicator • Timestamp • Button: “Generate new report” (dummy trigger for now)
⸻

/billing – Subscription Page • Show current plan (Free / Pro / Enterprise) • Button → “Upgrade via Stripe” • Usage stats: monitored sites, AI credits used • Subscription history table (date, amount, status)
⸻

/settings – Organization + Notification Settings • Org name, logo, members • Invite team members • Notification preferences: • Email alerts • Slack webhook • SMS toggle (future) • Save changes button
⸻

/auth/login, /auth/register, /auth/forgot-password • Clean authentication pages using Shadcn UI cards • Branded with logo + tagline • Social login buttons placeholders (Google, GitHub)
⸻

🧭 Design & UX Guidelines
•	Theme: Modern, trustworthy SaaS vibe (like Vercel, Linear, or Supabase)
•	Color palette: Blues, purples, neutrals (AI-tech aesthetic)
•	Typography: Sans-serif (Inter or Poppins)
•	Icons: Lucide-react
•	Layout: 12-column responsive grid
•	Accessibility: Use semantic HTML, aria labels
•	Dark/Light Mode toggle

/app
├── layout.js
├── page.js (Landing Page)
├── dashboard/
│    ├── page.js
│    ├── components/
│    └── charts/
├── sites/
├── insights/
├── billing/
├── settings/
└── auth/
├── login.js
├── register.js
└── forgot-password.js
/components
├── Navbar.js
├── Sidebar.js
├── Card.js
├── ChartCard.js
├── SiteStatusCard.js
/lib
├── utils.js
├── constants.js
/styles
└── globals.css


 •	Generate dummy JSON data for sites and uptime.
•	Use Framer Motion for subtle card hover/entry animations.
•	Include SEO meta tags on landing and pricing pages.
•	Use Recharts for uptime & latency visualizations.
•	Simulate AI summary text placeholders.
Make the design sleek, consistent, and developer-ready for integration with backend APIs later.
Prioritize SEO performance, accessibility, and responsive UI.
Use clean Tailwind classes, modular components, and meaningful naming.
Avoid TypeScript.
Generate realistic dummy data for charts and cards.