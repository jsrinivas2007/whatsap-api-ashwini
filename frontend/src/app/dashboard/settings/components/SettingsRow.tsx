import React, { ReactNode } from 'react';

interface SettingsRowProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function SettingsRow({ title, description, children, icon }: SettingsRowProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[14px] font-medium text-foreground">{title}</span>
          {description && (
            <span className="mt-1 text-[13px] text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}
