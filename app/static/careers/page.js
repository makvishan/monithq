import Navbar from '@/components/Navbar';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Careers at MonitHQ</h1>
        <p className="text-lg text-muted-foreground mb-8">We're always looking for talented people to join our team. Check back soon for open positions!</p>
      </div>
    </div>
  );
}