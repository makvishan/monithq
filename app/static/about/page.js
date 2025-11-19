import Navbar from '@/components/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-6">About MonitHQ</h1>
        <p className="text-lg text-muted-foreground mb-8">
          MonitHQ is a leading provider of AI-powered website monitoring solutions, trusted by organizations worldwide to ensure uptime, performance, and security. Our platform empowers teams to proactively manage incidents, optimize digital experiences, and deliver reliability to their users.
        </p>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Our Vision</h2>
          <p className="text-muted-foreground text-base mb-4">
            We envision a world where every website and application is resilient, secure, and always available. By harnessing the power of artificial intelligence, MonitHQ helps businesses stay ahead of issues, reduce downtime, and build trust with their customers.
          </p>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Our Values</h2>
          <ul className="list-disc pl-6 text-muted-foreground text-base">
            <li><span className="font-semibold text-foreground">Innovation:</span> We continuously improve our technology to deliver smarter, faster, and more reliable monitoring.</li>
            <li><span className="font-semibold text-foreground">Integrity:</span> We operate transparently and ethically, prioritizing the privacy and security of our customers.</li>
            <li><span className="font-semibold text-foreground">Customer Success:</span> We are committed to helping our clients achieve their goals with world-class support and expertise.</li>
            <li><span className="font-semibold text-foreground">Collaboration:</span> We believe in teamwork, both within our company and with our customers, to solve complex challenges together.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Why Choose MonitHQ?</h2>
          <ul className="list-disc pl-6 text-muted-foreground text-base">
            <li>Advanced AI-driven incident detection and response</li>
            <li>Comprehensive analytics and reporting</li>
            <li>Seamless integrations with popular tools</li>
            <li>Scalable solutions for businesses of all sizes</li>
            <li>Dedicated support from monitoring experts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}