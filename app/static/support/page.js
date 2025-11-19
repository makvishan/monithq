import Navbar from '@/components/Navbar';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Support</h1>
        <p className="text-lg text-muted-foreground mb-8">Need help? Our support team is here for you. Check our documentation or contact us for assistance.</p>
      </div>
    </div>
  );
}