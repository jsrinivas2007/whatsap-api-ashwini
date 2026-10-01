'use client';

import React from 'react';
import Link from 'next/link';

export const SETTINGS_TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'billing', label: 'Billing' },
  { id: 'agents', label: 'Agents and Manager' },
  { id: 'whatsapp-forms', label: 'WhatsApp Forms' },
  { id: 'quick-reply', label: 'Quick Replies' },
  { id: 'tags', label: 'Tags & Attributes' },
  { id: 'opt-in', label: 'Opt In' },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

interface SettingsTabsProps {
  activeTab: string;
}

export function SettingsTabs({ activeTab }: SettingsTabsProps) {
  return (
    <div className="border-b border-border bg-card">
      <nav className="flex overflow-x-auto px-4 md:px-6" aria-label="Tabs">
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/dashboard/settings?tab=${tab.id}`}
              className={`whitespace-nowrap border-b-2 px-4 py-4 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
