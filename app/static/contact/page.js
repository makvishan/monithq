import Navbar from '@/components/Navbar';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-8">Have questions or need support? Reach out to our team and we'll get back to you as soon as possible.</p>
        <div className="text-muted-foreground">Email: support@monithq.com</div>
      </div>
    </div>
  );
}