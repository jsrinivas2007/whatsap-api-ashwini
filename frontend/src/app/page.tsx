"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ListFilter, Users, Zap, MessageCircle, FileText, Database } from 'lucide-react';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { ContactModal } from '@/components/marketing/ContactModal';

export default function Home() {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSource, setContactSource] = useState<'book_demo' | 'talk_to_us'>('book_demo');

  const openModal = (source: 'book_demo' | 'talk_to_us') => {
    setContactSource(source);
    setContactModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper font-sans text-text-dark">
      <Navbar />

      <main className="flex-1 pt-20">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-24 pb-32 px-6 lg:pt-32 lg:pb-40 bg-navy-deep text-white min-h-[90vh] flex items-center">
          <div className="container mx-auto max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="text-center lg:text-left lg:-mt-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight mb-6">
                Everything your business needs to run WhatsApp <span className="text-sea-bright italic font-normal">at scale.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                Bulk campaigns, a WhatsApp inbox, and contact segmentation — built on the official Meta API, so nothing you send ever risks the number.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/auth/register" className="w-full sm:w-auto bg-sea-bright text-navy-deep px-8 py-3.5 rounded-lg text-base font-bold hover:opacity-90 transition-opacity shadow-lg shadow-sea-bright/20 flex items-center justify-center">
                  Start free trial
                </Link>
                <button onClick={() => openModal('book_demo')} className="w-full sm:w-auto bg-transparent text-white border border-white/20 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-white/10 transition-colors flex items-center justify-center">
                  Book a demo
                </button>
              </div>
            </div>

            {/* Hero SVG Animation (Flowing Dot) */}
            <div className="relative h-[500px] hidden lg:flex items-center justify-center">
              <svg viewBox="0 0 500 500" className="w-full h-full scale-125 xl:scale-150 transform translate-x-8" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="heroFlowGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--sea-bright)" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="var(--sea-bright)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--sea-bright)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <path d="M 50 420 C 150 420, 200 260, 280 220 C 360 180, 400 120, 450 80" fill="none" stroke="var(--sea-bright)" strokeWidth="2" strokeDasharray="6 8" opacity="0.25" />
                <path d="M 50 420 C 150 420, 200 260, 280 220 C 360 180, 400 120, 450 80" fill="none" stroke="url(#heroFlowGradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 1000" className="animate-flow-dash" />
                
                {/* Node 1: Play */}
                <g transform="translate(50, 420)">
                  <circle cx="0" cy="0" r="24" fill="transparent" stroke="var(--sea-bright)" strokeWidth="1" opacity="0.5" />
                  <circle cx="0" cy="0" r="18" fill="transparent" stroke="var(--sea-bright)" strokeWidth="1" />
                  <polygon points="-4,-6 -4,6 6,0" fill="var(--sea-bright)" />
                </g>
                {/* Node 2: Chat 1 */}
                <g transform="translate(180, 310)">
                  <circle cx="0" cy="0" r="18" fill="var(--navy-deep)" stroke="var(--sea-bright)" strokeWidth="1" />
                  <rect x="-7" y="-5" width="14" height="10" rx="2" fill="none" stroke="var(--sea-bright)" strokeWidth="1.5" />
                  <path d="M-4,5 L-4,8 L0,5" fill="var(--sea-bright)" />
                </g>
                {/* Node 3: Chat 2 */}
                <g transform="translate(300, 210)">
                  <circle cx="0" cy="0" r="18" fill="var(--navy-deep)" stroke="var(--sea-bright)" strokeWidth="1" />
                  <rect x="-7" y="-5" width="14" height="10" rx="2" fill="none" stroke="var(--sea-bright)" strokeWidth="1.5" />
                  <path d="M-4,5 L-4,8 L0,5" fill="var(--sea-bright)" />
                </g>
                {/* Node 4: Checkmark */}
                <g transform="translate(450, 80)">
                  <circle cx="0" cy="0" r="26" fill="var(--navy-deep)" stroke="var(--sea-bright)" strokeWidth="1" />
                  <path d="M-8,0 L-2,6 L10,-6" fill="none" stroke="var(--sea-bright)" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* THREE FEATURE PILLARS */}
        <section id="features" className="py-24 bg-white border-y border-border">
          <div className="container mx-auto max-w-6xl px-6 space-y-32">
            
            {/* Pillar 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sea/10 text-sea mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-navy-deep mb-6">Bulk Campaigns</h3>
                <p className="text-lg text-text-muted mb-8 leading-relaxed">
                  Send thousands of personalized messages instantly. Reach your audience where they actually hang out.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">High-converting multimedia templates</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">Smart scheduling & delay sending</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">Real-time delivery analytics</span></li>
                </ul>
              </div>
              <div className="rounded-3xl overflow-hidden border border-border/50 bg-ink">
                <img src="/images/Bulk.jpeg" alt="Bulk Campaigns" className="w-full h-auto object-contain rounded-3xl" />
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 rounded-3xl overflow-hidden border border-border/50 bg-ink">
                <img src="/images/Contact_Management.jpeg" alt="Contact Management" className="w-full h-auto object-contain rounded-3xl" />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sea/10 text-sea mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-navy-deep mb-6">Contact Management & Segmentation</h3>
                <p className="text-lg text-text-muted mb-8 leading-relaxed">
                  Keep your audience organized. Build laser-targeted segments based on custom attributes and behaviors.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">Dynamic tags and custom fields</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">Filter by engagement and status</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">One-click CSV imports and exports</span></li>
                </ul>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sea/10 text-sea mb-6">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-navy-deep mb-6">WhatsApp Conversations</h3>
                <p className="text-lg text-text-muted mb-8 leading-relaxed">
                  Bring your entire team into a single, collaborative inbox. Never miss a customer reply again.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">Centralized WhatsApp conversations</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">Organized customer message history</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-sea shrink-0" /> <span className="text-text-dark font-medium">Easy follow-up and conversation management.</span></li>
                </ul>
              </div>
              <div className="rounded-3xl overflow-hidden border border-border/50 bg-ink">
                <img src="/images/Whatsapp_Converstaion.jpeg" alt="WhatsApp Conversations" className="w-full h-auto object-contain rounded-3xl" />
              </div>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-6 bg-paper">
          <div className="container mx-auto max-w-5xl text-center">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-navy-deep mb-16">How it works</h2>
            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-border -translate-y-1/2 z-0"></div>
              
              <div className="relative z-10 bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 bg-navy-deep text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-md">1</div>
                <h4 className="text-xl font-semibold text-navy-deep mb-3">Connect API</h4>
                <p className="text-text-muted">Link your official WhatsApp Business number in minutes.</p>
              </div>
              
              <div className="relative z-10 bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 bg-sea text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-md">2</div>
                <h4 className="text-xl font-semibold text-navy-deep mb-3">Import Contacts</h4>
                <p className="text-text-muted">Upload your audience and organize them with custom tags.</p>
              </div>
              
              <div className="relative z-10 bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 bg-sea-foam text-navy-deep rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-md">3</div>
                <h4 className="text-xl font-semibold text-navy-deep mb-3">Launch Campaigns</h4>
                <p className="text-text-muted">Send personalized broadcasts and automate your support.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY FEATURES LIST */}
        <section className="py-24 px-6 bg-navy-deep text-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-center mb-16">Everything you need to grow</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-navy-mid p-8 rounded-2xl border border-white/5">
                <FileText className="w-8 h-8 text-sea-bright mb-4" />
                <h4 className="text-xl font-semibold mb-2">Message Templates</h4>
                <p className="text-slate text-sm">Create and submit interactive templates to Meta directly from the dashboard.</p>
              </div>
              
              <div className="bg-navy-mid p-8 rounded-2xl border border-white/5">
                <Zap className="w-8 h-8 text-sea-bright mb-4" />
                <h4 className="text-xl font-semibold mb-2">WhatsApp Flows</h4>
                <p className="text-slate text-sm">Build rich, interactive forms right inside the WhatsApp chat.</p>
              </div>
              
              <div className="bg-navy-mid p-8 rounded-2xl border border-white/5">
                <MessageCircle className="w-8 h-8 text-sea-bright mb-4" />
                <h4 className="text-xl font-semibold mb-2">Quick Replies</h4>
                <p className="text-slate text-sm">Save your team time with pre-written responses to common questions.</p>
              </div>
              
              <div className="bg-navy-mid p-8 rounded-2xl border border-white/5">
                <ListFilter className="w-8 h-8 text-sea-bright mb-4" />
                <h4 className="text-xl font-semibold mb-2">Contact Tags & Attributes</h4>
                <p className="text-slate text-sm">Segment your audience with infinite custom data points.</p>
              </div>
              
              <div className="bg-navy-mid p-8 rounded-2xl border border-white/5">
                <Database className="w-8 h-8 text-sea-bright mb-4" />
                <h4 className="text-xl font-semibold mb-2">CSV Import</h4>
                <p className="text-slate text-sm">Bring your existing customer base over seamlessly in one click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-32 px-6 bg-sea text-center">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">Ready to transform your conversations?</h2>
            <p className="text-xl text-ink/80 mb-12 max-w-2xl mx-auto">
              Join the fastest growing businesses scaling their revenue and support on WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register" className="w-full sm:w-auto bg-navy-deep text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-navy-mid transition-colors shadow-xl">
                Start free trial
              </Link>
              <button onClick={() => openModal('talk_to_us')} className="w-full sm:w-auto bg-white/10 text-white border-2 border-white/20 px-8 py-4 rounded-full text-base font-semibold hover:bg-white/20 transition-colors">
                Talk to us
              </button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      
      <ContactModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
        source={contactSource} 
      />
    </div>
  );
}
