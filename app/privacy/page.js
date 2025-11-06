'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Cookie } from 'lucide-react';

export default function PrivacyPage() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 gradient-success rounded-full mb-6 glow-success">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: November 5, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <p className="text-muted-foreground mb-0">
                At MonitHQ, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website monitoring service.
              </p>
            </div>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
              
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 gradient-info rounded-lg flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">1.1 Personal Information</h3>
                    <p className="text-muted-foreground mb-3">
                      When you register for MonitHQ, we collect:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      <li>Name and email address</li>
                      <li>Organization name</li>
                      <li>Password (encrypted and hashed)</li>
                      <li>Billing information (processed securely through Stripe)</li>
                      <li>Payment method details (stored by our payment processor)</li>
                      <li>Profile information you choose to provide</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 gradient-ai rounded-lg flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">1.2 Monitoring Data</h3>
                    <p className="text-muted-foreground mb-3">
                      To provide our monitoring service, we collect:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      <li>URLs of websites you choose to monitor</li>
                      <li>Response times and uptime statistics</li>
                      <li>HTTP status codes and error messages</li>
                      <li>Server response headers</li>
                      <li>Incident and downtime data</li>
                      <li>Performance metrics and analytics</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 gradient-warning rounded-lg flex items-center justify-center shrink-0">
                    <Cookie className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">1.3 Automatically Collected Information</h3>
                    <p className="text-muted-foreground mb-3">
                      When you use MonitHQ, we automatically collect:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      <li>IP address and location data</li>
                      <li>Browser type and version</li>
                      <li>Device information</li>
                      <li>Operating system</li>
                      <li>Usage data and patterns</li>
                      <li>Cookies and similar tracking technologies</li>
                      <li>Log data (access times, pages viewed, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Provide the Service:</strong> Monitor your websites, send alerts, generate reports</li>
                <li><strong>AI Insights:</strong> Generate AI-powered recommendations and incident summaries</li>
                <li><strong>Account Management:</strong> Create and manage your account, process payments</li>
                <li><strong>Communication:</strong> Send service updates, security alerts, and marketing (with consent)</li>
                <li><strong>Improvement:</strong> Analyze usage to improve our Service and develop new features</li>
                <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security issues</li>
                <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms</li>
                <li><strong>Customer Support:</strong> Respond to your inquiries and provide technical support</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Share Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.1 Service Providers</h3>
              <p className="text-muted-foreground mb-4">
                We share data with trusted third-party service providers who help us operate our business:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li><strong>Payment Processing:</strong> Stripe (for billing and subscriptions)</li>
                <li><strong>Cloud Hosting:</strong> AWS, Google Cloud, or similar providers</li>
                <li><strong>Email Services:</strong> SendGrid, AWS SES, or similar providers</li>
                <li><strong>Analytics:</strong> Google Analytics or similar tools</li>
                <li><strong>AI Services:</strong> OpenAI, Anthropic for AI-powered insights</li>
                <li><strong>Communication:</strong> Slack, Twilio for integrations and alerts</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.2 Legal Requirements</h3>
              <p className="text-muted-foreground mb-4">
                We may disclose your information if required by law or in response to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li>Court orders or legal processes</li>
                <li>Government or regulatory requests</li>
                <li>Protecting our rights, privacy, safety, or property</li>
                <li>Investigating fraud or security issues</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.3 Business Transfers</h3>
              <p className="text-muted-foreground">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity. We will notify you before your data is transferred and becomes subject to a different privacy policy.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
              <div className="bg-card border border-border rounded-lg p-6 mb-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground font-medium mb-2">We implement industry-standard security measures:</p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      <li><strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest</li>
                      <li><strong>Access Controls:</strong> Role-based access and authentication</li>
                      <li><strong>Secure Infrastructure:</strong> Regular security audits and updates</li>
                      <li><strong>Password Protection:</strong> Bcrypt hashing for passwords</li>
                      <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
                      <li><strong>Backups:</strong> Regular encrypted backups</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                While we strive to protect your data, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the following rights:
              </p>
              
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">🔍 Access</h4>
                  <p className="text-muted-foreground text-sm">Request a copy of your personal data</p>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">✏️ Correction</h4>
                  <p className="text-muted-foreground text-sm">Update or correct inaccurate information</p>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">🗑️ Deletion</h4>
                  <p className="text-muted-foreground text-sm">Request deletion of your data (subject to legal obligations)</p>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">📦 Portability</h4>
                  <p className="text-muted-foreground text-sm">Export your data in a machine-readable format</p>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">🚫 Objection</h4>
                  <p className="text-muted-foreground text-sm">Opt-out of certain data processing activities</p>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">📧 Marketing</h4>
                  <p className="text-muted-foreground text-sm">Unsubscribe from marketing emails (service emails still apply)</p>
                </div>
              </div>

              <p className="text-muted-foreground mt-4">
                To exercise these rights, contact us at <a href="mailto:privacy@monithq.com" className="text-primary hover:underline">privacy@monithq.com</a>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Keep you signed in</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage and performance</li>
                <li>Personalize your experience</li>
                <li>Provide targeted advertising (with consent)</li>
              </ul>
              <p className="text-muted-foreground">
                You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of MonitHQ.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your information for as long as necessary to provide the Service and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Account Data:</strong> Until account deletion + 30 days</li>
                <li><strong>Monitoring Data:</strong> Based on your subscription plan (90 days to indefinitely)</li>
                <li><strong>Billing Records:</strong> 7 years (for tax and legal compliance)</li>
                <li><strong>Logs and Analytics:</strong> 12-24 months</li>
                <li><strong>Backup Data:</strong> Up to 90 days after deletion</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                MonitHQ operates globally. Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Privacy Shield frameworks where applicable</li>
                <li>Encryption during transfer</li>
                <li>Compliance with GDPR, CCPA, and other regulations</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                MonitHQ is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Third-Party Links</h2>
              <p className="text-muted-foreground">
                Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">11. AI and Data Processing</h2>
              <p className="text-muted-foreground mb-4">
                MonitHQ uses artificial intelligence to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Generate incident summaries and insights</li>
                <li>Provide optimization recommendations</li>
                <li>Detect patterns and anomalies</li>
                <li>Improve monitoring accuracy</li>
              </ul>
              <p className="text-muted-foreground">
                We may use third-party AI services (OpenAI, Anthropic) to process monitoring data. These services are bound by strict data processing agreements and do not use your data to train their models.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. The "Last Updated" date at the top indicates when this policy was last revised.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices:
              </p>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-foreground mb-2"><strong>Email:</strong> privacy@monithq.com</p>
                <p className="text-foreground mb-2"><strong>Support:</strong> support@monithq.com</p>
                <p className="text-foreground mb-2"><strong>Data Protection Officer:</strong> dpo@monithq.com</p>
                <p className="text-foreground"><strong>Website:</strong> https://monithq.com</p>
              </div>
            </section>

            {/* Compliance Badges */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Compliance & Certifications</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">🇪🇺</div>
                  <div className="text-sm font-medium text-foreground">GDPR</div>
                  <div className="text-xs text-muted-foreground">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🇺🇸</div>
                  <div className="text-sm font-medium text-foreground">CCPA</div>
                  <div className="text-xs text-muted-foreground">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <div className="text-sm font-medium text-foreground">SOC 2</div>
                  <div className="text-xs text-muted-foreground">Type II</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-sm font-medium text-foreground">ISO 27001</div>
                  <div className="text-xs text-muted-foreground">Certified</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  © 2025 MonitHQ. All rights reserved.
                </p>
                <div className="flex gap-6">
                  <Link href="/terms" className="text-sm text-primary hover:underline">
                    Terms of Service
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
