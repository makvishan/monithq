import Navbar from '@/components/Navbar';

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">API Reference</h1>
        <p className="text-lg text-muted-foreground mb-8">Explore MonitHQ's API endpoints and integration options.</p>
        <div className="text-muted-foreground">API documentation coming soon.</div>
      </div>
    </div>
  );
}