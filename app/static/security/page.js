import Navbar from '@/components/Navbar';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Security</h1>
        <p className="text-lg text-muted-foreground mb-8">MonitHQ takes security seriously. Learn about our practices to keep your data safe.</p>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>End-to-end encryption</li>
          <li>Regular security audits</li>
          <li>Compliance with industry standards</li>
        </ul>
      </div>
    </div>
  );
}