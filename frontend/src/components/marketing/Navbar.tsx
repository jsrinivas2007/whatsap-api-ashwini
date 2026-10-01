"use client";

import Link from 'next/link';
import { MessageSquare, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-40 w-full bg-navy-deep/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img 
            src="/images/banner.png" 
            alt="Ashwini Innovations" 
            className="h-12 w-56 rounded-lg object-fill"
          />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-medium text-slate hover:text-sea-bright transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm font-medium text-slate hover:text-sea-bright transition-colors">Pricing</Link>
          <Link href="/partners" className="text-sm font-medium text-slate hover:text-sea-bright transition-colors">Partners</Link>

        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-semibold text-white border border-white/20 px-5 py-2 rounded-lg hover:bg-white/10 transition-colors">Log in</Link>
          <Link href="/auth/register" className="bg-sea-bright text-navy-deep px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">Start free trial</Link>
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="md:hidden p-2 -mr-2 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-navy-deep border-b border-white/10 py-4 px-6 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-2">
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-white py-2">Features</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-white py-2">Pricing</Link>
          <Link href="/partners" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-white py-2">Partners</Link>

          <hr className="border-white/10 my-2" />
          <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-white py-2">Log in</Link>
          <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-sea-bright py-2">Start free trial</Link>
        </div>
      )}
    </header>
  );
}
