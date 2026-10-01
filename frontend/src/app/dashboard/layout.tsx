"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppSidebar from '@/components/dashboard/AppSidebar';
import { isAuthenticated, logoutMock } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('ashwini-sidebar-collapsed');
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, [router]);

  useEffect(() => {
    window.localStorage.setItem('ashwini-sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const isFlowBuilder = pathname.includes('/automation/') && pathname.endsWith('/edit');

  const pageTitle =
    pathname === '/dashboard' ? 'Dashboard' :
    pathname === '/dashboard/chats' ? 'Chats' :
    pathname === '/dashboard/campaign' ? 'Campaign' :
    pathname === '/dashboard/templates' ? 'Templates' :
    pathname === '/dashboard/contacts' ? 'Contacts' :
    pathname.startsWith('/dashboard/automation') ? 'Automation' :
    pathname === '/dashboard/settings' ? 'Settings' : 'Dashboard';

  const handleLogout = async () => {
    await logoutMock();
  };

  // Flow Builder gets a full-screen layout without sidebar/header
  if (isFlowBuilder) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="h-screen overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen overflow-hidden">
        <AppSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-hidden">
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm">
            <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-accent lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <div className="ml-2 flex flex-col justify-center gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground leading-none">Workspace</p>
                  <h1 className="text-xl font-bold text-foreground leading-none">{pageTitle}</h1>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <ThemeToggle />

                <button type="button" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent cursor-pointer">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">AJ</span>
                  Ashwini J.
                </button>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-64px)] overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
