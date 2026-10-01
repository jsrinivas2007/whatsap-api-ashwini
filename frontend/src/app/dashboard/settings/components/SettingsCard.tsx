import React, { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SettingsCard({ title, subtitle, children }: SettingsCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col border-b border-border px-6 py-5">
        <h3 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col divide-y divide-border">
        {children}
      </div>
    </div>
  );
}
