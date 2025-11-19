import Navbar from '@/components/Navbar';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Documentation</h1>
        <p className="text-lg text-muted-foreground mb-8">Welcome to MonitHQ Documentation. Here you'll find everything you need to understand, use, and customize our AI-powered website monitoring platform.</p>
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Platform Overview</h2>
            <ul className="list-disc pl-6 text-muted-foreground text-base">
              <li>AI-powered uptime and incident monitoring</li>
              <li>Real-time dashboards and analytics</li>
              <li>Role-based access control (RBAC)</li>
              <li>Modern, responsive UI with dark mode</li>
              <li>Serverless, Vercel-ready deployment</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Core Features</h2>
            <ul className="list-disc pl-6 text-muted-foreground text-base">
              <li>Landing page with SEO, hero, features, pricing, testimonials</li>
              <li>Dashboard: stats, charts, site status, incident summaries</li>
              <li>Sites management: add/edit/delete, status indicators</li>
              <li>AI Insights: reports, confidence scoring, categories</li>
              <li>Billing & settings: subscription, organization, team</li>
              <li>Incident tracking: view/manage incidents with AI summaries</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Component Library</h2>
            <ul className="list-disc pl-6 text-muted-foreground text-base">
              <li>Card: header, content, footer</li>
              <li>ChartCard: Recharts wrapper, tooltips</li>
              <li>SiteStatusCard: site info/status</li>
              <li>Navbar: responsive navigation</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">RBAC & Security</h2>
            <ul className="list-disc pl-6 text-muted-foreground text-base">
              <li>Three user roles: User, Org Admin, Super Admin</li>
              <li>Protected routes and layouts</li>
              <li>Authentication utilities and middleware</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Deployment & Customization</h2>
            <ul className="list-disc pl-6 text-muted-foreground text-base">
              <li>Serverless deployment on Vercel</li>
              <li>Environment setup and database migration</li>
              <li>Real-time notifications (Pusher), email (Resend)</li>
              <li>Customizable colors and dummy data</li>
              <li>Accessibility: semantic HTML, ARIA, keyboard navigation</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Support & Next Steps</h2>
            <ul className="list-disc pl-6 text-muted-foreground text-base">
              <li>Test accounts for all roles</li>
              <li>Links to Vercel, Pusher, Resend, Prisma docs</li>
              <li>Suggestions for further features and improvements</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}