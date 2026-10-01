import AuthBrandingPanel from '@/components/auth/AuthBrandingPanel';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Branding Panel (67% on desktop) */}
      <AuthBrandingPanel />

      {/* Right: Form Panel (33% on desktop, full on mobile) */}
      <div className="w-full lg:w-1/3 flex flex-col bg-white">
        {/* Mobile-only header */}
        <div className="lg:hidden flex items-center gap-2 px-6 py-4 border-b bg-ink">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded overflow-hidden flex items-center justify-center">
              <img src="/images/logo.jpeg" alt="Ashwini Innovations Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-navy-deep">Ashwini</span>
              <span className="text-xs font-light tracking-[0.15em] uppercase ml-1.5 text-sea">Innovations</span>
            </div>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 lg:px-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
