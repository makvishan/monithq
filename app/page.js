'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import Navbar from '@/components/Navbar';
import ContactForm from '@/components/ContactForm';
import { Card } from '@/components/Card';
import { FEATURES, TESTIMONIALS,PRICING_PLANS, FOOTER_LINKS } from '@/lib/constants';
import { ArrowRight, Check, Star } from 'lucide-react';

import { useEffect, useState } from 'react';
function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookieConsent');
      setVisible(!consent);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full bg-card border-t border-border shadow-lg z-50 p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
      <span className="text-sm text-muted-foreground">
        We use cookies to improve your experience. By using MonitHQ, you accept our <a href="/privacy" className="underline text-primary">Privacy Policy</a>.
      </span>
      <button
        onClick={acceptCookies}
        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all"
      >
        Accept
      </button>
    </div>
  );
}

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState(null);

  useEffect(() => {
    async function fetchPlans() {
      setLoadingPlans(true);
      setPlansError(null);
      try {
        const res = await fetch('/api/plans?active=true');
        if (!res.ok) throw new Error('Failed to fetch plans');
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (err) {
        setPlansError(err.message);
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CookieConsentBanner />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              AI-Powered Monitoring
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Monitor Your Websites
              <br />
              <span className="gradient-text">
                With AI Intelligence
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track uptime, get instant alerts, and understand incidents with AI-generated summaries. 
              Keep your sites running smoothly 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-8 py-4 gradient-ai text-white rounded-lg text-lg font-semibold hover:opacity-90 transition-all inline-flex items-center justify-center gap-2 glow-ai"
              >
                Start Monitoring for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 border-2 border-primary/30 rounded-lg text-lg font-semibold hover:bg-primary/10 transition-all backdrop-blur-sm"
              >
                See How It Works
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free plan available forever
            </p>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20"
          >
            <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl bg-card">
              <div className="h-8 bg-muted border-b border-border flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-lg p-4 border border-border">
                      <div className="h-2 bg-muted rounded w-1/2 mb-3"></div>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="h-40 bg-gradient-to-r from-primary/20 to-secondary/20 rounded"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Monitor
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to keep your websites online and your team informed
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => {
              const Icon = LucideIcons[feature.icon];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card hover className="h-full">
                    <div className="w-12 h-12 rounded-lg gradient-ai flex items-center justify-center mb-4 glow-primary">
                      {Icon && <Icon className="w-6 h-6 text-white" />}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Start monitoring in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Add Your Sites',
                description: 'Enter the URLs you want to monitor. Set up custom check intervals and notification preferences.',
                icon: 'Globe',
              },
              {
                step: '02',
                title: 'AI Monitors 24/7',
                description: 'Our AI continuously checks your sites and analyzes performance, uptime, and response times.',
                icon: 'Activity',
              },
              {
                step: '03',
                title: 'Get Smart Alerts',
                description: 'Receive instant notifications with AI-generated summaries when issues are detected.',
                icon: 'Bell',
              },
            ].map((item, index) => {
              const Icon = LucideIcons[item.icon];
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full gradient-animated mx-auto mb-6 flex items-center justify-center glow-ai">
                    {Icon && <Icon className="w-10 h-10 text-white" />}
                  </div>
                  <div className="text-4xl font-bold gradient-text mb-2">{item.step}</div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

       {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card hover className={`h-full relative ${plan.isPopular ? 'gradient-border shadow-lg glow-primary' : ''}`}>
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 gradient-ai text-white text-sm font-semibold rounded-full glow-primary">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.displayName}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      {plan.period !== 'contact sales' && (
                        <span className="text-muted-foreground"> / {plan.period || 'per month'}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    className={`block w-full py-3 rounded-lg text-center font-semibold transition-all ${
                      plan.isPopular
                        ? 'gradient-ai text-white glow-primary hover:opacity-90'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    {plan.cta || 'Get Started'}
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers have to say
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card hover>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-animated relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Monitor Smarter?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of teams using MonitHQ to keep their websites online
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-lg text-lg font-semibold hover:bg-white/90 transition-all glow-ai"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
      {/* Contact Us Section */}
      <section id="contact"  className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Contact Us</h2>
          <p className="text-lg text-muted-foreground mb-8">Have questions or need support? Enter your email and we'll get back to you.</p>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold text-foreground">MonitHQ</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI-powered website monitoring for modern teams
              </p>
            </div>
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h3 className="font-semibold text-foreground mb-4">{category}</h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 MonitHQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
