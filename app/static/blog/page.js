import Navbar from '@/components/Navbar';

const posts = [
  {
    title: 'How AI is Transforming Website Monitoring',
    date: 'November 10, 2025',
    summary: 'Discover how MonitHQ leverages artificial intelligence to detect incidents faster, reduce downtime, and provide actionable insights for your web infrastructure.',
    content: `
      Website monitoring has evolved rapidly in recent years. With MonitHQ, AI-driven algorithms analyze uptime, performance, and security data in real time, allowing teams to respond to issues before they impact users. Our platform provides smart incident summaries, predictive analytics, and automated recommendations, making monitoring proactive rather than reactive.
    `
  },
  {
    title: 'Best Practices for Incident Management in SaaS',
    date: 'October 28, 2025',
    summary: 'Learn how MonitHQ helps SaaS teams streamline incident response, improve communication, and maintain high availability for their customers.',
    content: `
      Incident management is critical for SaaS businesses. MonitHQ offers real-time alerts, collaborative dashboards, and AI-powered root cause analysis to help teams resolve issues quickly. By integrating with popular tools and providing clear status updates, MonitHQ ensures transparency and reliability for both technical and non-technical stakeholders.
    `
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">MonitHQ Blog</h1>
        <p className="text-lg text-muted-foreground mb-8">Insights, updates, and best practices for website monitoring, incident management, and DevOps.</p>
        <div className="space-y-8">
          {posts.map((post, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground mb-2">{post.title}</h2>
              <div className="text-sm text-muted-foreground mb-2">{post.date}</div>
              <p className="mb-3 text-muted-foreground">{post.summary}</p>
              <details className="text-muted-foreground">
                <summary className="cursor-pointer text-primary font-semibold">Read more</summary>
                <div className="mt-2 whitespace-pre-line">{post.content}</div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}