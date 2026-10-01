"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

const primaryItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chats', href: '/dashboard/chats', icon: MessageSquareText },
  { label: 'Campaign', href: '/dashboard/campaign', icon: FolderKanban },
  { label: 'Templates', href: '/dashboard/templates', icon: Sparkles },
  { label: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { label: 'Automation', href: '/dashboard/automation', icon: Zap },
  { label: 'WhatsApp AI Agent', href: '/dashboard/ai-agent', icon: Bot },
];

const utilityItems = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function AppSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();

  const renderNavItem = (item: { label: string; href: string; icon: typeof LayoutDashboard }, index: number) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onCloseMobile}
        title={collapsed ? item.label : undefined}
        className={[
          'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
          collapsed ? 'justify-center px-2' : '',
          isActive
            ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        ].join(' ')}
        style={{ marginTop: index === 0 ? 0 : undefined }}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card shadow-[4px_0_20px_rgba(0,0,0,0.02)]">
      <div className="flex h-16 items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border shadow-sm">
            <img src="/images/logo.jpeg" alt="Ashwini Innovations Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <div className="truncate text-base font-bold tracking-tight text-foreground">Ashwini</div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Innovations</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1.5">{primaryItems.map(renderNavItem)}</nav>
      </div>

      <div className="border-t border-border px-3 py-4">
        <div className="space-y-1.5">{utilityItems.map(renderNavItem)}</div>

        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={[
            'mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
            collapsed ? 'justify-center px-2' : '',
          ].join(' ')}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={[
          'hidden h-screen border-r border-border bg-card transition-all duration-300 lg:flex relative',
          collapsed ? 'w-[88px]' : 'w-[260px]',
        ].join(' ')}
      >
        {sidebarContent}
        
        {/* Toggle Button perfectly positioned on the edge */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-4 top-[16px] z-50 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-accent lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={[
          'fixed left-0 top-0 z-50 h-screen w-[260px] transform transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
