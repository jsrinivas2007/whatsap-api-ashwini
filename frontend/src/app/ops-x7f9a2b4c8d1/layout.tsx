import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Operations',
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const isLoggedIn = !!session?.value;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {isLoggedIn && (
        <nav className="bg-navy-deep text-ink px-6 py-4 shadow-lg flex justify-between items-center">
          <div className="flex gap-8 items-center">
            <Link href="/ops-x7f9a2b4c8d1" className="font-bold text-xl tracking-wider text-white">OPS ADMIN</Link>
            <Link href="/ops-x7f9a2b4c8d1/accounts" className="text-slate hover:text-sea-bright transition text-sm font-medium">Accounts</Link>
            <Link href="/ops-x7f9a2b4c8d1/billing" className="text-slate hover:text-sea-bright transition text-sm font-medium">Billing</Link>
            <Link href="/ops-x7f9a2b4c8d1/audit-log" className="text-slate hover:text-sea-bright transition text-sm font-medium">Audit Log</Link>
          </div>
          <div>
            <form method="POST" action="/internal-ops/api/logout">
              <button type="submit" className="text-sm border border-sea/40 text-sea-foam px-4 py-1.5 rounded-lg hover:bg-navy-mid transition font-medium">Logout</button>
            </form>
          </div>
        </nav>
      )}
      <main className={`flex-1 ${isLoggedIn ? 'p-8 max-w-7xl mx-auto w-full' : ''}`}>
        {children}
      </main>
    </div>
  );
}
