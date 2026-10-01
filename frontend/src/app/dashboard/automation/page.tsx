"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, Trash2, Edit2, Copy, BarChart2, CheckCircle2, Clock, XCircle, GitBranch, Play } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CreateFlowModal } from "@/components/dashboard/CreateFlowModal";
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
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const handleFlowCreated = (flowId: string) => {
    setShowCreateModal(false);
    router.push(`/dashboard/automation/${flowId}/edit`);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setFlows(flows.map(f => f.id === id ? { ...f, status: newStatus } : f));

    try {
      await fetch(`/api/flows/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      notify(`Flow ${newStatus}`);
    } catch (e) {
      setFlows(flows.map(f => f.id === id ? { ...f, status: currentStatus as any } : f));
      notify("Failed to update status");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/flows/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        await fetchFlows();
        notify("Flow duplicated");
      }
    } catch (e) {
      notify("Failed to duplicate flow");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the flow "${name}"? This action cannot be undone.`)) return;
    try {
      await fetch(`/api/flows/${id}`, { method: 'DELETE' });
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
    }).format(d);
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
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
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
          primaryAction={{ label: 'Create New Flow', onClick: () => setShowCreateModal(true), icon: <Plus className="h-4 w-4" /> }}
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
                        <button
                          onClick={() => router.push(`/dashboard/automation/${flow.id}/edit`)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        >
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

      {/* Create Flow Modal */}
      <CreateFlowModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleFlowCreated}
      />
    </div>
  );
}
