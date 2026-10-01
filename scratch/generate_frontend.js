const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. Shared UI: Switch.tsx
const uiDir = path.join(srcDir, 'components/ui');
ensureDir(uiDir);
fs.writeFileSync(path.join(uiDir, 'Switch.tsx'), `import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onChange, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={\`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 \${
        checked ? 'bg-primary' : 'bg-muted'
      }\`}
    >
      <span
        aria-hidden="true"
        className={\`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out \${
          checked ? 'translate-x-4' : 'translate-x-0'
        }\`}
      />
    </button>
  );
}
`);

// 2. Shared UI: EmptyState.tsx
const dashCompDir = path.join(srcDir, 'components/dashboard');
ensureDir(dashCompDir);
fs.writeFileSync(path.join(dashCompDir, 'EmptyState.tsx'), `import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function EmptyState({ icon, title, description, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl border border-border border-dashed bg-card/50">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50">
        {icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 mb-8 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
        )}
        
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
`);

// 3. Automation Page
const autoPageDir = path.join(srcDir, 'app/dashboard/automation');
ensureDir(autoPageDir);
fs.writeFileSync(path.join(autoPageDir, 'page.tsx'), `"use client";

import { useEffect, useState } from "react";
import { Plus, Briefcase, Trash2, Edit2, Copy, BarChart2, CheckCircle2, Clock, XCircle, GitBranch, Play } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Switch } from "@/components/ui/Switch";
import { SectionLoader } from "@/components/ui/Loader";

type Flow = {
  id: string;
  name: string;
  trigger_type: string;
  status: 'active' | 'inactive';
  trigger_count: number;
  created_at: string;
};

export default function AutomationPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flows');
      if (res.ok) {
        const data = await res.json();
        setFlows(data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateFlow = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Automation Flow' })
      });
      if (res.ok) {
        await fetchFlows();
        notify("Flow created successfully");
      }
    } catch (e) {
      notify("Failed to create flow");
    }
    setCreating(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    // Optimistic update
    setFlows(flows.map(f => f.id === id ? { ...f, status: newStatus } : f));
    
    try {
      await fetch(\`/api/flows/\${id}/status\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      notify(\`Flow \${newStatus}\`);
    } catch (e) {
      // Revert on error
      setFlows(flows.map(f => f.id === id ? { ...f, status: currentStatus as any } : f));
      notify("Failed to update status");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(\`/api/flows/\${id}/duplicate\`, { method: 'POST' });
      if (res.ok) {
        await fetchFlows();
        notify("Flow duplicated");
      }
    } catch (e) {
      notify("Failed to duplicate flow");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(\`Are you sure you want to delete the flow "\${name}"? This action cannot be undone.\`)) return;
    try {
      await fetch(\`/api/flows/\${id}\`, { method: 'DELETE' });
      setFlows(flows.filter(f => f.id !== id));
      notify("Flow deleted");
    } catch (e) {
      notify("Failed to delete flow");
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: 'numeric', month: 'long', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    }).format(d).replace(' at ', ' at ');
  };

  const getTriggerPill = (type: string) => {
    switch (type) {
      case 'message': return <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-600">Message</span>;
      case 'template_button': return <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-1 text-[11px] font-medium text-purple-600">Template Button</span>;
      case 'reminder': return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600">Reminder</span>;
      case 'meta_lead_form': return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600">Meta Lead Form</span>;
      default: return <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">Not set</span>;
    }
  };

  return (
    <div className="min-h-full text-foreground relative">
      {toast && (
        <div className="fixed right-6 top-6 z-[80] rounded-[8px] bg-foreground px-4 py-3 text-[12px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[30px] font-bold tracking-[-0.03em]">WhatsApp Automation Flows</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            Explore Flow Templates
          </button>
          <button
            type="button"
            onClick={handleCreateFlow}
            disabled={creating}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Create Flow
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 relative border border-border rounded-xl bg-card">
          <SectionLoader text="Loading flows..." />
        </div>
      ) : flows.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-8 w-8" />}
          title="Start Building Your Flow"
          description="Create WhatsApp automations triggered by messages, template buttons, reminders, or Meta lead forms."
          primaryAction={{ label: 'Create New Flow', onClick: handleCreateFlow, icon: <Plus className="h-4 w-4" /> }}
          secondaryAction={{ label: 'Explore Templates', onClick: () => {}, icon: <Briefcase className="h-4 w-4" /> }}
        />
      ) : (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.08em] text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-4 font-semibold">Flow Name</th>
                  <th className="px-5 py-4 font-semibold">Trigger Type</th>
                  <th className="px-5 py-4 font-semibold">Created At</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Trigger Count</th>
                  <th className="px-5 py-4 font-semibold">Insights</th>
                  <th className="px-5 py-4 font-semibold">Duplicate</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flows.map((flow) => (
                  <tr key={flow.id} className="border-b border-border text-[13px] last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium text-foreground">{flow.name}</td>
                    <td className="px-5 py-4">{getTriggerPill(flow.trigger_type)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(flow.created_at)}</td>
                    <td className="px-5 py-4">
                      <Switch 
                        checked={flow.status === 'active'} 
                        onChange={() => handleToggleStatus(flow.id, flow.status)} 
                      />
                    </td>
                    <td className="px-5 py-4 text-right font-medium">{flow.trigger_count.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition">
                        <BarChart2 className="h-3.5 w-3.5" /> View Insights
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => handleDuplicate(flow.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(flow.id, flow.name)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-rose-500 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
`);

console.log("Frontend files generated!");
