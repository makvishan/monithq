'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-ai rounded-lg flex items-center justify-center glow-ai">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold gradient-text">MonitHQ</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 gradient-ai rounded-full mb-6 glow-ai">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: November 5, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <p className="text-muted-foreground mb-0">
                Please read these Terms of Service carefully before using MonitHQ. By accessing or using our service, you agree to be bound by these terms.
              </p>
            </div>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using MonitHQ ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-muted-foreground">
                MonitHQ reserves the right to update and change the Terms of Service from time to time without notice. Any new features that augment or enhance the current Service shall be subject to the Terms of Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                MonitHQ provides AI-powered website monitoring and uptime tracking services ("Service"). The Service includes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Website uptime monitoring and alerts</li>
                <li>Performance tracking and analytics</li>
                <li>AI-generated incident summaries and insights</li>
                <li>Real-time notifications via email, SMS, and third-party integrations</li>
                <li>Dashboard and reporting tools</li>
                <li>API access (for applicable plans)</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground mb-4">
                To use MonitHQ, you must:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Be at least 18 years of age or have parental consent</li>
                <li>Accept all risks of unauthorized access to your account and information</li>
              </ul>
              <p className="text-muted-foreground">
                You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Subscription Plans and Billing</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.1 Plans</h3>
              <p className="text-muted-foreground mb-4">
                MonitHQ offers multiple subscription tiers: Free, Starter, Professional, and Enterprise. Each plan has different features, limitations, and pricing as described on our pricing page.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 Billing</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Paid plans are billed on a monthly or annual basis</li>
                <li>Charges are automatically billed to your payment method on file</li>
                <li>All fees are in US Dollars unless otherwise stated</li>
                <li>Prices are subject to change with 30 days notice</li>
                <li>No refunds are provided for partial months of service</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.3 Cancellation</h3>
              <p className="text-muted-foreground">
                You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period. You will continue to have access to paid features until the end of the billing cycle.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-4">
                You agree not to use MonitHQ to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Monitor websites you do not own or have permission to monitor</li>
                <li>Perform any form of network attack, penetration testing, or security scanning</li>
                <li>Generate excessive API requests or attempt to overwhelm our systems</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Transmit any viruses, malware, or malicious code</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe upon the rights of others</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Service Level and Uptime</h2>
              <p className="text-muted-foreground mb-4">
                While we strive to provide reliable service, MonitHQ does not guarantee:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>100% uptime or uninterrupted service</li>
                <li>Error-free operation</li>
                <li>That the Service will meet your specific requirements</li>
                <li>That all bugs or errors will be corrected</li>
              </ul>
              <p className="text-muted-foreground">
                Enterprise plans include an SLA (Service Level Agreement) with specific uptime guarantees as outlined in your contract.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Data and Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Your use of MonitHQ is also governed by our Privacy Policy. By using the Service, you consent to our collection and use of data as described in the Privacy Policy.
              </p>
              <p className="text-muted-foreground">
                We collect monitoring data, performance metrics, and incident information about the websites you monitor. This data is used to provide and improve our Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                MonitHQ and its original content, features, and functionality are owned by MonitHQ and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground">
                You retain all rights to the data you input into MonitHQ, but grant us a license to use, store, and process this data to provide the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Third-Party Integrations</h2>
              <p className="text-muted-foreground mb-4">
                MonitHQ may integrate with third-party services (Slack, email providers, SMS gateways, etc.). Your use of these integrations is subject to the respective third-party's terms and privacy policies.
              </p>
              <p className="text-muted-foreground">
                We are not responsible for the availability, accuracy, or reliability of third-party services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, MonitHQ shall not be liable for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or use</li>
                <li>Damages resulting from unauthorized access to your account</li>
                <li>Interruptions or cessation of Service</li>
                <li>Any damages exceeding the amount you paid to MonitHQ in the past 12 months</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless MonitHQ, its contractors, licensors, directors, officers, employees, and agents from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Breach of these Terms of Service</li>
                <li>Non-payment of fees</li>
                <li>Abusive or fraudulent behavior</li>
                <li>At our discretion for any reason</li>
              </ul>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Service will immediately cease. All provisions of the Terms which by their nature should survive termination shall survive.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms will be resolved in the courts of [Your Jurisdiction].
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">14. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will provide notice of significant changes via email or through the Service. Your continued use of MonitHQ after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">15. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-foreground mb-2"><strong>Email:</strong> legal@monithq.com</p>
                <p className="text-foreground mb-2"><strong>Support:</strong> support@monithq.com</p>
                <p className="text-foreground"><strong>Website:</strong> https://monithq.com</p>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  © 2025 MonitHQ. All rights reserved.
                </p>
                <div className="flex gap-6">
                  <Link href="/privacy" className="text-sm text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/" className="text-sm text-primary hover:underline">
                    Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
