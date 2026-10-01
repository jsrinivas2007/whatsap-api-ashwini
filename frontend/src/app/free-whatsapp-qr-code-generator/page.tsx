"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Download, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeGeneratorPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  const generatedLink = cleanPhone ? `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}` : '';

  const handleDownload = () => {
    if (!qrRef.current || !generatedLink) return;
    const svg = qrRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "whatsapp-qr-code.png";
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">Free WhatsApp QR Code Generator</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate a downloadable QR code that opens a WhatsApp chat with you instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-card border rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Create your QR Code</h2>
            
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

          <div className="bg-secondary rounded-3xl p-8 flex flex-col h-full items-center">
            <h2 className="text-2xl font-semibold mb-6 w-full text-left">Your QR Code</h2>
            
            {generatedLink ? (
              <div className="w-full flex flex-col items-center space-y-8">
                <div 
                  ref={qrRef} 
                  className="bg-white p-6 rounded-2xl shadow-sm border"
                >
                  <QRCodeSVG 
                    value={generatedLink} 
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#0F766E"
                  />
                </div>
                
                <button 
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-full font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download PNG
                </button>
              </div>
            ) : (
              <div className="flex-1 w-full flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl min-h-[300px]">
                <p className="text-muted-foreground text-center px-6">Enter a phone number to see your QR code here.</p>
              </div>
            )}
            
            <div className="w-full mt-12 pt-8 border-t border-muted-foreground/20 text-center">
              <p className="text-sm font-medium mb-4">Print this for your storefront or flyers.</p>
              <Link href="/free-whatsapp-link-generator" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                Need a text link instead? <ArrowRight className="w-4 h-4" />
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
