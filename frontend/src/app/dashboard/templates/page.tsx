"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Sparkles, Search, RefreshCw, Trash2, Eye, BarChart2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { SectionLoader } from "@/components/ui/Loader";
import PhoneMockup from "@/components/dashboard/PhoneMockup";

type Template = {
  id: string;
  name: string;
  language: string;
  category: string;
  header_type: string;
  header_content: string | null;
  body: string;
  footer: string | null;
  status: string;
  template_variables?: any[];
  template_buttons?: any[];
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [previewModal, setPreviewModal] = useState<Template | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Insights modal (real per-template usage stats from the backend)
  const [insightsModal, setInsightsModal] = useState<Template | null>(null);
  const [insights, setInsights] = useState<any | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?status=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      } else {
        // Never show fake rows — surface the real failure instead
        setTemplates([]);
        notify("Failed to load templates from the server");
      }
    } catch (e) {
      setTemplates([]);
      notify("Network error while loading templates");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeTab]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/templates/sync', { method: 'POST' });
      await fetchTemplates();
      notify("Templates synced successfully");
    } catch (e) {
      notify("Failed to sync templates");
    }
    setSyncing(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the template "${name}"? This action cannot be undone.`)) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      setTemplates(templates.filter(t => t.id !== id));
      notify("Template deleted");
    } catch (e) {
      notify("Failed to delete template");
    }
  };

  const openInsights = async (template: Template) => {
    setInsightsModal(template);
    setInsights(null);
    setInsightsError(null);
    setInsightsLoading(true);
    try {
      const res = await fetch(`/api/templates/${template.id}/insights`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Failed to load insights");
      }
      setInsights(await res.json());
    } catch (e: any) {
      setInsightsError(e?.message || "Failed to load insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const closeInsights = () => {
    setInsightsModal(null);
    setInsights(null);
    setInsightsError(null);
  };

  // Replace {{1}} placeholders with stored sample values so the preview looks
  // like the real delivered message instead of raw variable tokens.
  const renderPreviewBody = (t: Template) =>
    String(t.body || "").replace(/\{\{(\d+)\}\}/g, (_m, n) => {
      const v = (t.template_variables || []).find((x: any) => x.position === Number(n));
      return v?.sample_value || `{{${n}}}`;
    });

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Approved</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600"><Clock className="h-3 w-3" /> Pending</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-600"><XCircle className="h-3 w-3" /> Rejected</span>;
      default:
        return <span>{status}</span>;
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
          <h2 className="text-[30px] font-bold tracking-[-0.03em]">Templates</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Your central space for creating and managing WhatsApp templates.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://business.facebook.com/wa/manage/message-templates/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            Manage Templates
          </a>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Template
          </Link>
        </div>
      </div>

      {/* Controls: Tabs & Sync */}
      <div className="mb-4 flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6 overflow-x-auto">
          {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 py-3 text-[14px] font-medium transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-muted/50 px-3 text-[12px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          Sync Status
        </button>
      </div>

      {/* Data Table */}
      <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.08em] text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-4 font-semibold">Name</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Header</th>
                <th className="px-5 py-4 font-semibold">Language</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-64 relative">
                    <SectionLoader text="Loading templates..." />
                  </td>
                </tr>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <tr key={template.id} className="border-b border-border text-[13px] last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium text-foreground">{template.name}</td>
                    <td className="px-5 py-4">{getStatusBadge(template.status)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-[4px] bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {template.header_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 uppercase text-muted-foreground">{template.language}</td>
                    <td className="px-5 py-4 text-muted-foreground">{template.category}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModal(template)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Template
                        </button>
                        <button
                          type="button"
                          onClick={() => openInsights(template)}
                          disabled={template.status !== 'APPROVED'}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <BarChart2 className="h-3.5 w-3.5" /> View Insights
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(template.id, template.name)}
                          aria-label="Delete template"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-rose-500 hover:bg-rose-500/10 transition ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                      <Sparkles className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-[14px] font-semibold text-foreground">No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} templates found</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Create a new template to get started.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewModal(null)}
              className="absolute -right-12 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-md"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <PhoneMockup
              brandName="Ashwini Innovations"
              headerType={previewModal.header_type}
              headerContent={previewModal.header_content}
              body={renderPreviewBody(previewModal)}
              footer={previewModal.footer || undefined}
              buttons={previewModal.template_buttons}
            />
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {insightsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeInsights}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeInsights}
              aria-label="Close insights"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <div className="mb-1 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              <h3 className="text-[16px] font-semibold text-foreground">Template Insights</h3>
            </div>
            <p className="mb-5 text-[13px] text-muted-foreground">
              Real usage recorded by Ashwini Innovations for{" "}
              <span className="font-medium text-foreground">{insightsModal.name}</span>.
            </p>

            {insightsLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : insightsError ? (
              <p className="rounded-lg bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600">{insightsError}</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Sent", value: insights?.sent ?? 0, tone: "text-foreground" },
                    { label: "Delivered", value: insights?.delivered ?? 0, tone: "text-emerald-600" },
                    { label: "Read", value: insights?.read ?? 0, tone: "text-primary" },
                    { label: "Failed", value: insights?.failed ?? 0, tone: "text-rose-600" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                      <p className={`mt-1 text-[24px] font-bold ${m.tone}`}>{m.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                {insights && insights.total === 0 ? (
                  <p className="text-[12px] text-muted-foreground">
                    No messages have been sent with this template yet, so there is nothing to report. Stats appear here once it is used in a campaign or test send.
                  </p>
                ) : (
                  <p className="text-[12px] text-muted-foreground">
                    Based on {insights?.total?.toLocaleString?.() ?? 0} outbound message(s) logged through this platform.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
