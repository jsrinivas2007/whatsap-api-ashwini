"use client";

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { LegalModal, LegalDocumentType } from '@/components/legal/LegalModal';

export function Footer() {
  const [legalModalType, setLegalModalType] = useState<LegalDocumentType>(null);

  return (
    <footer className="bg-navy-deep text-ink py-16 px-6">
      <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-5 gap-12">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy-mid border border-sea/30">
              <MessageSquare className="w-5 h-5 text-sea-bright" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Ashwini</span>
              <span className="text-xs font-light tracking-[0.15em] uppercase ml-1.5 text-sea-foam">Innovations</span>
            </div>
          </Link>
          <p className="text-sm text-slate mb-6 max-w-xs leading-relaxed">
            Market, sell, support, and automate on the official WhatsApp Business API.
          </p>
          <div className="text-sm text-slate">&copy; {new Date().getFullYear()} Ashwini Innovations. All rights reserved.</div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-6 text-white">Product</h4>
          <ul className="space-y-4 text-sm text-slate">
            <li><Link href="/#features" className="hover:text-sea-foam transition-colors">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-sea-foam transition-colors">Pricing</Link></li>
            <li><Link href="/auth/login" className="hover:text-sea-foam transition-colors">Log in</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-6 text-white">Contact Us</h4>
          <div className="space-y-4 text-sm text-slate">
            <div>
              <p className="font-medium text-white mb-1">Email</p>
              <p className="text-xs mb-1">For general inquiries and support.</p>
              <a href="mailto:info@ashwiniinnovations.com" className="text-sea-bright hover:text-sea-foam transition-colors block">info@ashwiniinnovations.com</a>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Phone</p>
              <a href="tel:+919640111265" className="text-sea-bright hover:text-sea-foam transition-colors block">+91 9640111265</a>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Location</p>
              <p>Ashwini Innovations<br/>India</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-6 text-white">Legal</h4>
          <ul className="space-y-4 text-sm text-slate">
            <li><button onClick={() => setLegalModalType('terms')} className="hover:text-sea-foam transition-colors">Terms of Service</button></li>
            <li><button onClick={() => setLegalModalType('privacy')} className="hover:text-sea-foam transition-colors">Privacy Policy</button></li>
          </ul>
        </div>
      </div>
      
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </footer>
  );
}
