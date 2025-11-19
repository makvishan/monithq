import Navbar from '@/components/Navbar';

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Product Roadmap</h1>
        <p className="text-lg text-muted-foreground mb-8">See what's coming next for MonitHQ. Stay tuned for new features and improvements!</p>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>AI-powered incident prediction</li>
          <li>Multi-region monitoring</li>
          <li>Advanced analytics dashboard</li>
          <li>More integrations (Slack, Teams, PagerDuty)</li>
        </ul>
      </div>
    </div>
  );
}