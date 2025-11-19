import Navbar from '@/components/Navbar';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Cookie Policy</h1>
        <p className="text-lg text-muted-foreground mb-8">Learn how MonitHQ uses cookies to improve your experience and keep your data secure.</p>
        <ul className="list-disc pl-6 text-muted-foreground">
          <li>Cookies are used for authentication and analytics.</li>
          <li>No personal data is sold or shared.</li>
          <li>You can manage cookie preferences in your browser settings.</li>
        </ul>
      </div>
    </div>
  );
}