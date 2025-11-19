import Navbar from '@/components/Navbar';

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Guides</h1>
        <p className="text-lg text-muted-foreground mb-8">Step-by-step guides to help you get the most out of MonitHQ.</p>
        <div className="text-muted-foreground">No guides available yet.</div>
      </div>
    </div>
  );
}