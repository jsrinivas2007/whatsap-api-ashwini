'use client';

import React from 'react';
import { usePlan } from '@/hooks/usePlan';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const { plan, loading } = usePlan();
  const router = useRouter();

  const handleSubscribe = async (planKey: string, price: number) => {
    try {
      const res = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, amount: price })
      });
      const data = await res.json();
      alert(`Proceeding to checkout with Razorpay/PhonePe for ₹${price}`);
    } catch (err) {
      console.error(err);
      alert('Payment failed to initialize.');
    }
  };

  const currentPlan = plan?.plan || 'trial';

  // Calculate trial days remaining
  const getTrialDaysLeft = (): number | null => {
    if (!plan || plan.status !== 'trialing') return null;
    // For now, default to 7 if we don't have trial_ends_at from the hook
    return 7;
  };

  const trialDaysLeft = getTrialDaysLeft();

  const Check = () => (
    <CheckCircle2 className="w-5 h-5 text-sea shrink-0 mt-0.5" />
  );

  return (
    <div className="flex flex-col min-h-screen bg-paper font-sans text-text-dark">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-navy-deep text-white py-20 px-6 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">
              Simple, transparent <span className="text-sea-bright italic font-normal">pricing.</span>
            </h1>
            <p className="text-lg text-slate max-w-2xl mx-auto">
              Unlock the full potential of your WhatsApp marketing. Start with a free trial, upgrade anytime.
            </p>

            {trialDaysLeft !== null && (
              <div className="mt-6 inline-flex items-center gap-2 bg-sea-bright/15 text-sea-bright border border-sea-bright/30 px-5 py-2.5 rounded-full text-sm font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left in your free trial
              </div>
            )}
          </div>
        </section>

        {/* Plan Cards */}
        <section className="py-20 px-6 bg-paper border-b border-border">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-wrap items-start justify-center gap-6">

              {/* TRIAL */}
              <div className="w-72 bg-white text-center text-text-dark border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="font-semibold font-serif text-navy-deep text-lg">7-Day Free Trial</p>
                <p className="text-xs text-text-muted mt-1">No credit card required</p>
                <h1 className="text-4xl font-extrabold text-navy-deep mt-4">₹0</h1>
                <ul className="list-none text-text-dark text-[13px] leading-snug mt-6 space-y-2 text-left">
                  <li className="flex items-start gap-2.5"><Check /> <span>100 Contacts</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>100 Bulk Broadcast Messages</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>3 Templates</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>5 Quick Replies</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>1 Automation Flow</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>1 WhatsApp Form</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Opt In / Opt Out — Included</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>1 User</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Customer Support</span></li>
                </ul>
                <button
                  disabled={currentPlan === 'trial'}
                  className="bg-navy-deep/10 text-sm w-full py-2.5 rounded-lg text-navy-deep font-bold mt-7 hover:bg-navy-deep/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentPlan === 'trial' ? '✓ Current Plan' : 'Start Free Trial'}
                </button>
              </div>

              {/* STARTER */}
              <div className="w-72 bg-white text-center text-text-dark border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="font-semibold font-serif text-navy-deep text-lg">Starter</p>
                <p className="text-xs text-text-muted mt-1">Perfect for small teams</p>
                <h1 className="text-4xl font-extrabold text-navy-deep mt-4">₹999<span className="text-text-muted text-sm font-medium">/mo</span></h1>
                <ul className="list-none text-text-dark text-[13px] leading-snug mt-6 space-y-2 text-left">
                  <li className="flex items-start gap-2.5"><Check /> <span>WhatsApp AI Agent</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Send up to 5,000 bulk broadcast messages/month</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>WhatsApp Bulk Broadcast</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Template Message API (10 templates)</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>1,000 Contacts</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>20 Quick Replies</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>3 WhatsApp Automation Flows</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>3 WhatsApp Forms</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Tags &amp; Attributes</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Opt In / Opt Out — Included</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>2 Users</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Customer Support</span></li>
                </ul>
                <button
                  onClick={() => handleSubscribe('starter', 999)}
                  disabled={currentPlan === 'starter'}
                  className="bg-sea text-sm w-full py-2.5 rounded-lg text-white font-bold mt-7 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentPlan === 'starter' ? '✓ Current Plan' : 'Subscribe'}
                </button>
              </div>

              {/* GROWTH — Most Popular */}
              <div className="w-72 bg-navy-deep relative text-center text-white border border-navy-deep p-6 rounded-xl shadow-lg transform lg:scale-105 z-10">
                <p className="absolute px-3 text-xs font-bold tracking-wide -top-3 left-[50%] -translate-x-[50%] py-1 bg-sea-bright text-navy-deep rounded-full uppercase shadow-sm">Most Popular</p>
                <p className="font-semibold font-serif text-lg mt-2">Growth</p>
                <p className="text-xs text-slate mt-1">For scaling businesses</p>
                <h1 className="text-4xl font-extrabold mt-4">₹1,999<span className="text-slate text-sm font-medium">/mo</span></h1>
                <ul className="list-none text-white text-[13px] leading-snug mt-6 space-y-2 text-left">
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>WhatsApp AI Agent</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span className="font-semibold">All Starter Features +</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Send up to 25,000 bulk broadcast messages/month</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Campaign Scheduler</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Unlimited Templates</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Unlimited Quick Replies</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Unlimited WhatsApp Automation Flows</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Unlimited WhatsApp Forms</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Tags &amp; Attributes</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Opt In / Opt Out — Included</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>10 Users</span></li>
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-sea-bright shrink-0 mt-0.5" /> <span>Customer Support</span></li>
                </ul>
                <button
                  onClick={() => handleSubscribe('growth', 1999)}
                  disabled={currentPlan === 'growth'}
                  className="bg-sea-bright text-sm w-full py-2.5 rounded-lg text-navy-deep font-bold mt-7 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {currentPlan === 'growth' ? '✓ Current Plan' : 'Subscribe'}
                </button>
              </div>

              {/* ENTERPRISE */}
              <div className="w-72 bg-white text-center text-text-dark border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="font-semibold font-serif text-navy-deep text-lg">Enterprise</p>
                <p className="text-xs text-text-muted mt-1">Unrestricted limits</p>
                <h1 className="text-4xl font-extrabold text-navy-deep mt-4">₹2,999<span className="text-text-muted text-sm font-medium">/mo</span></h1>
                <ul className="list-none text-text-dark text-[13px] leading-snug mt-6 space-y-2 text-left">
                  <li className="flex items-start gap-2.5"><Check /> <span>WhatsApp AI Agent</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span className="font-semibold">All Growth Features +</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Send unlimited bulk broadcast messages/month (fair-use policy)</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Unlimited Contacts</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Unlimited Templates</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Unlimited Quick Replies</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Unlimited WhatsApp Automation Flows</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Unlimited WhatsApp Forms</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Tags &amp; Attributes</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Opt In / Opt Out — Included</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Unlimited Users</span></li>
                  <li className="flex items-start gap-2.5"><Check /> <span>Customer Support</span></li>
                </ul>
                <button
                  onClick={() => handleSubscribe('enterprise', 2999)}
                  disabled={currentPlan === 'enterprise'}
                  className="bg-navy-deep text-sm w-full py-2.5 rounded-lg text-white font-bold mt-7 hover:bg-navy-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentPlan === 'enterprise' ? '✓ Current Plan' : 'Subscribe'}
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* WhatsApp API Charges */}
        <section className="py-16 px-6 bg-navy-deep text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h4 className="text-xl font-serif font-bold mb-6">WhatsApp API Charges (India)</h4>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="bg-navy-mid px-5 py-3 rounded-xl border border-white/10">
                <span className="text-sea-bright font-bold">Marketing:</span> <span className="text-slate">₹0.8631/message</span>
              </div>
              <div className="bg-navy-mid px-5 py-3 rounded-xl border border-white/10">
                <span className="text-sea-bright font-bold">Utility:</span> <span className="text-slate">₹0.115/message</span>
              </div>
              <div className="bg-navy-mid px-5 py-3 rounded-xl border border-white/10">
                <span className="text-sea-bright font-bold">Authentication:</span> <span className="text-slate">₹0.115/message</span>
              </div>
              <div className="bg-navy-mid px-5 py-3 rounded-xl border border-white/10">
                <span className="text-sea-bright font-bold">Service:</span> <span className="text-slate">Unlimited Free</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
