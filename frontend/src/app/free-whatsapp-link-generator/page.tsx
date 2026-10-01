"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, ArrowRight } from 'lucide-react';

export default function LinkGeneratorPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  const generatedLink = cleanPhone ? `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}` : '';

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">Free WhatsApp Link Generator</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a custom wa.me link with a pre-filled message. Perfect for Instagram bios, websites, and emails.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-card border rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Create your link</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp Number (with country code)</label>
                <input 
                  type="tel"
                  placeholder="e.g. 1234567890"
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">Omit any +, -, or brackets.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pre-filled Message (Optional)</label>
                <textarea 
                  placeholder="e.g. Hi, I would like to know more about your services."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-secondary rounded-3xl p-8 flex flex-col h-full">
            <h2 className="text-2xl font-semibold mb-6">Your generated link</h2>
            
            {generatedLink ? (
              <div className="space-y-6">
                <div className="p-4 bg-background border rounded-xl break-all text-sm font-mono text-muted-foreground">
                  {generatedLink}
                </div>
                
                <button 
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-full font-medium hover:bg-foreground/90 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied to clipboard!' : 'Copy Link'}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl">
                <p className="text-muted-foreground text-center px-6">Enter a phone number to see your generated link here.</p>
              </div>
            )}
            
            <div className="mt-12 pt-8 border-t border-muted-foreground/20 text-center">
              <p className="text-sm font-medium mb-4">Want to automate your WhatsApp replies?</p>
              <Link href="/auth/register" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                Try Vaartaa for free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
