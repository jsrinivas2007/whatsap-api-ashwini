"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Download,
  FileText,
  Filter,
  Image as ImageIcon,
  Megaphone,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Tag,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import CyberToggle from "@/components/ui/CyberToggle";
import { SectionLoader } from "@/components/ui/Loader";

type CampaignStatus =
  "Draft" | "Scheduled" | "Processing" | "Completed" | "Failed" | "Cancelled";
type Campaign = {
  id: string;
  name: string;
  template: string;
  contacts: number;
  type: "BROADCAST";
  status: CampaignStatus;
  createdAt: string;
  delivered?: number;
  read?: number;
  replies?: number;
  failed?: number;
};

import { Contact, Source, ContactModal, ImportModal } from "../contacts/page";

const statusStyles: Record<CampaignStatus, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Scheduled: "bg-blue-50 text-blue-700",
  Processing: "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Failed: "bg-rose-50 text-rose-700",
  Cancelled: "bg-slate-100 text-slate-500",
};
const dateLabel = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-US");

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [insight, setInsight] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [actionsFor, setActionsFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          template: c.template,
          contacts: c.contacts_count,
          type: c.type,
          status: c.status,
          createdAt: c.created_at,
          delivered: c.delivered,
          read: c.read,
          replies: c.replies,
          failed: c.failed,
        }));
        setCampaigns(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setBuilderOpen(false);
        setInsight(null);
        setDeleteTarget(null);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };
  const visible = campaigns.filter((campaign) =>
    `${campaign.name} ${campaign.template}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const removeCampaign = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/campaigns/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((current) =>
          current.filter((item) => item.id !== deleteTarget.id),
        );
        notify("Campaign deleted");
      } else {
        notify("Failed to delete campaign");
      }
    } catch (err) {
      notify("Error deleting campaign");
    } finally {
      setDeleteTarget(null);
    }
  };
  const exportReport = () => {
    const header =
      "Campaign Name,Template Name,Contacts,Type,Status,Created At";
    const rows = campaigns.map((item) =>
      [
        item.name,
        item.template,
        item.contacts,
        item.type,
        item.status,
        dateLabel(item.createdAt),
      ]
        .map((value) => `"${value}"`)
        .join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "campaign-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    notify("Report exported");
  };

  if (builderOpen) {
    return (
      <BroadcastBuilder
        onClose={() => setBuilderOpen(false)}
        onLaunch={async (campaign) => {
          try {
            const res = await fetch("/api/campaigns", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(campaign),
            });
            if (res.ok) {
              const data = await res.json();
              const mapped = {
                id: data.id,
                name: data.name,
                template: data.template,
                contacts: data.contacts_count,
                type: data.type,
                status: data.status,
                createdAt: data.created_at,
                delivered: data.delivered,
                read: data.read,
                replies: data.replies,
                failed: data.failed,
              };
              setCampaigns((current) => [mapped, ...current]);
              setBuilderOpen(false);
              notify("Campaign launched successfully");
            } else {
              notify("Failed to launch campaign");
            }
          } catch (err) {
            notify("Error launching campaign");
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-full text-foreground">
      {toast ? (
        <div className="fixed right-6 top-6 z-[80] rounded-[8px] bg-foreground px-4 py-3 text-[12px] font-medium text-background shadow-lg">
          {toast}
        </div>
      ) : null}
      <div className="mb-7 flex w-full flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[30px] font-bold tracking-[-0.03em]">
            Campaigns
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Where campaigns become conversations and conversations become results.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] font-medium text-muted-foreground">
            {campaigns.length} Campaigns
          </span>
          <button
            type="button"
            onClick={exportReport}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-card px-3 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export Report
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#1B2CC1] px-4 text-[13px] font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Campaign{" "}
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[310px] rounded-[10px] border border-border bg-card p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setBuilderOpen(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full gap-3 rounded-[8px] p-3 text-left hover:bg-muted"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <span>
                    <strong className="block text-[13px] text-foreground">
                      Broadcast Campaign
                    </strong>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      Send bulk messages from our platform
                    </span>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mb-4 flex h-10 w-full max-w-[365px] items-center gap-2 rounded-[8px] border border-border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search campaigns"
          className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="w-full rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full text-left">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                {[
                  "Campaign Name",
                  "Template Name",
                  "Contacts",
                  "Type",
                  "Status",
                  "Created At",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="h-64 relative">
                    <SectionLoader text="Loading campaigns..." />
                  </td>
                </tr>
              ) : visible.length ? (
                visible.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-border text-[13px] last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">{campaign.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {campaign.template}
                    </td>
                    <td className="px-5 py-4">
                      {campaign.contacts.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-[6px] border border-border bg-card px-2 py-1 text-[10px] font-semibold text-foreground">
                        {campaign.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${statusStyles[campaign.status]}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {dateLabel(campaign.createdAt)}
                    </td>
                    <td className="relative px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setInsight(campaign)}
                          className="text-[12px] font-semibold text-primary"
                        >
                          View Insight
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActionsFor(
                              actionsFor === campaign.id ? null : campaign.id,
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted rounded-md"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                      {actionsFor === campaign.id ? (
                        <div className="absolute right-5 top-12 z-20 w-36 rounded-[8px] border border-border bg-card p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(campaign)}
                            className="flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-left text-[12px] text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-[13px] text-muted-foreground"
                  >
                    No campaigns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {insight ? (
        <InsightModal campaign={insight} onClose={() => setInsight(null)} />
      ) : null}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[430px] rounded-xl bg-card text-foreground p-6 shadow-xl">
            <h3 className="text-[20px] font-semibold">Delete Campaign</h3>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Delete <strong>{deleteTarget.name}</strong>? This cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-[8px] border border-border bg-background px-4 text-[13px] hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeCampaign}
                className="h-10 rounded-[8px] bg-destructive px-4 text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BroadcastBuilder({
  onClose,
  onLaunch,
}: {
  onClose: () => void;
  onLaunch: (campaign: Campaign) => void;
}) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [schedule, setSchedule] = useState("");
  const [testName, setTestName] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testSent, setTestSent] = useState(false);
  const [testError, setTestError] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  // Real approved templates from the connected WABA (Meta), not hardcoded names
  const [approvedTemplates, setApprovedTemplates] = useState<{ name: string; language: string; paramCount: number; requiresMedia: boolean }[]>([]);
  // Full template content (body/header/footer/buttons) synced in our DB, for the preview
  const [templateDetails, setTemplateDetails] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/whatsapp/approved-templates")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => { if (active && Array.isArray(list)) setApprovedTemplates(list); })
      .catch(() => {});
    fetch("/api/templates?status=APPROVED")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => { if (active && Array.isArray(list)) setTemplateDetails(list); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // {{1}}, {{2}}… values for the selected template (test send). Defaults come
  // from the sample values stored at template-sync time; the user can edit them.
  const [paramValues, setParamValues] = useState<string[]>([]);
  const selectedTemplateDetail = templateDetails.find((t: any) => t.name === template);
  const templateParams: string[] = (() => {
    const body = String(selectedTemplateDetail?.body || "");
    const nums = (body.match(/\{\{(\d+)\}\}/g) || []).map((m) => parseInt(m.replace(/\D/g, ""), 10));
    const count = nums.length ? Math.max(...nums) : 0;
    const vars = [...(selectedTemplateDetail?.template_variables || [])].sort(
      (a: any, b: any) => a.position - b.position,
    );
    return Array.from({ length: count }, (_unused, i) => String(vars[i]?.sample_value || ""));
  })();
  const effectiveParams = templateParams.map((fb, i) => (paramValues[i] !== undefined ? paramValues[i] : fb));

  // Switching template clears hand-edited values so the new template's
  // stored sample values are used again.
  useEffect(() => {
    setParamValues([]);
  }, [template]);

  const sendTestMessage = async () => {
    const normalizedPhone = testPhone.replace(/\D/g, "");
    if (!template) {
      setTestError("Select a template before sending a test message.");
      return;
    }
    if (!testName.trim() || !/^\d{7,15}$/.test(normalizedPhone)) {
      setTestError("Enter a name and a valid phone number.");
      setTestSent(false);
      return;
    }
    if (effectiveParams.some((p) => !p.trim())) {
      setTestError("Please fill values for all message variables ({{1}}, {{2}}…).");
      setTestSent(false);
      return;
    }
    setTestError("");
    setIsSendingTest(true);
    try {
      // Country select is fixed to IN — prefix +91 unless already prefixed
      const recipient = normalizedPhone.startsWith("91") && normalizedPhone.length >= 11
        ? normalizedPhone
        : `91${normalizedPhone}`;
      const selected = approvedTemplates.find((t) => t.name === template);
      const res = await fetch("/api/whatsapp/send-test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, templateName: template, language: selected?.language || "en_US", paramValues: effectiveParams.map((p) => p.trim()) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.message === "string" ? err.message : "Failed to send test message");
      }
      setTestSent(true);
    } catch (err: any) {
      setTestError(err.message || "Failed to send test message");
      setTestSent(false);
    } finally {
      setIsSendingTest(false);
    }
  };
  const launch = () => {
    if (!name.trim() || !template || contacts.length === 0) return;
    onLaunch({
      id: `cmp-${Date.now()}`,
      name: name.trim(),
      template,
      contacts: contacts.length,
      type: "BROADCAST",
      status: scheduleEnabled ? "Scheduled" : "Processing",
      createdAt: new Date().toISOString().slice(0, 10),
      delivered: 0,
      read: 0,
      replies: 0,
      failed: 0,
    });
  };
  return (
    <div className="min-h-full text-foreground">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] font-medium text-muted-foreground hover:text-primary"
            >
              Back to Campaigns
            </button>
            <span className="h-5 border-l border-border" />
            <h1 className="text-[18px] font-semibold text-foreground">
              Create Broadcast Campaign
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid min-h-[calc(100vh-130px)] lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-[760px] space-y-12">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="text-[14px] font-semibold text-[#091540]">
                  Campaign Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder=""
                    className="mt-3 h-10 w-full rounded-[6px] border border-slate-300 px-3 text-[13px] outline-none focus:border-[#1B2CC1]"
                  />
                </label>
                <label className="text-[14px] font-semibold text-[#091540]">
                  Template Name
                  <select
                    value={template}
                    onChange={(event) => setTemplate(event.target.value)}
                    className="mt-3 h-10 w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[13px] outline-none focus:border-[#1B2CC1]"
                  >
                    <option value="">Select Template</option>
                    {approvedTemplates.length > 0 ? (
                      approvedTemplates.map((t) => (
                        <option key={`${t.name}_${t.language}`} value={t.name}>
                          {t.name} ({t.language}){t.paramCount > 0 || t.requiresMedia ? " — needs variables/media" : ""}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No approved templates found — create one in Templates</option>
                    )}
                  </select>
                  <span className="mt-2 block text-[12px] font-normal text-slate-500">
                    Can&apos;t find your template?{" "}
                    <button type="button" className="text-[#1B2CC1]">
                      Create new template -&gt;
                    </button>
                  </span>
                </label>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#091540]">
                  Contacts
                </p>
                <button
                  type="button"
                  onClick={() => setContactsOpen(true)}
                  className="mt-3 inline-flex h-11 items-center gap-2 rounded-[8px] border border-[#5a55ee] px-5 text-[14px] font-medium text-[#4b46e5]"
                >
                  Add Contacts <span className="text-[19px]">-&gt;</span>
                </button>
                {contacts.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-[8px] border border-border bg-card">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Name</th>
                          <th className="px-4 py-2 font-semibold">Phone</th>
                          <th className="px-4 py-2 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {contacts.map((c) => (
                          <tr key={c.id}>
                            <td className="px-4 py-2 font-medium">{c.name}</td>
                            <td className="px-4 py-2 text-muted-foreground">+{c.countryCode}{c.whatsapp}</td>
                            <td className="px-4 py-2 text-right">
                              <button 
                                onClick={() => setContacts(prev => prev.filter(item => item.id !== c.id))}
                                className="text-rose-600 hover:text-rose-700 font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
              <div>
                <div className="flex items-center gap-3 text-[14px] font-semibold text-[#091540]">
                  <CyberToggle checked={scheduleEnabled} onChange={setScheduleEnabled} />
                  Schedule Campaign
                </div>
                {scheduleEnabled ? (
                  <input
                    type="datetime-local"
                    value={schedule}
                    onChange={(event) => setSchedule(event.target.value)}
                    className="mt-4 h-10 rounded-[6px] border border-slate-300 px-3 text-[13px]"
                  />
                ) : null}
              </div>
              <fieldset className="rounded-[8px] border border-slate-300 p-4">
                <legend className="px-2 text-[14px] font-semibold text-[#091540]">
                  Send Test Message <span className="text-slate-400">(i)</span>
                </legend>
                <div className="grid gap-3 md:grid-cols-[1fr_100px_1fr_auto]">
                  <input
                    value={testName}
                    onChange={(event) => setTestName(event.target.value)}
                    placeholder="Enter a Name"
                    className="h-10 rounded-[6px] border border-slate-300 px-3 text-[13px]"
                  />
                  <select className="h-10 rounded-[6px] border border-slate-300 bg-white px-3 text-[13px]">
                    <option>IN</option>
                  </select>
                  <input
                    value={testPhone}
                    onChange={(event) => setTestPhone(event.target.value)}
                    placeholder="8839424242"
                    className="h-10 rounded-[6px] border border-slate-300 px-3 text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={sendTestMessage}
                    disabled={testSent || isSendingTest}
                    className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#5a55ee] px-4 text-[13px] font-semibold text-[#4b46e5] disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingTest ? "Sending…" : "Send"}
                  </button>
                </div>
                {effectiveParams.length > 0 && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {effectiveParams.map((value, i) => (
                      <label key={i} className="text-[12px] font-medium text-slate-500">
                        Message variable {`{{${i + 1}}}`}
                        <input
                          value={value}
                          onChange={(event) =>
                            setParamValues((prev) => {
                              const next = [...prev];
                              next[i] = event.target.value;
                              return next;
                            })
                          }
                          placeholder={`Value for {${i + 1}}`}
                          className="mt-1 h-10 w-full rounded-[6px] border border-slate-300 px-3 text-[13px] text-slate-800 font-normal"
                        />
                      </label>
                    ))}
                  </div>
                )}
                {testSent ? (
                  <p className="mt-2 text-[12px] text-emerald-600">
                    ✅ Test message sent to {testPhone} via “{template}”. (In Development mode Meta only delivers to numbers added as app Testers.)
                  </p>
                ) : null}
                {testError ? <p className="mt-2 text-[12px] text-rose-600">{testError}</p> : null}
              </fieldset>
            </div>
            <div className="mt-10 flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={launch}
                disabled={!name.trim() || !template || contacts.length === 0}
                className="h-11 rounded-[8px] bg-[#5048e8] px-6 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Launch Campaign
              </button>
            </div>
          </section>
          <PhonePreview
            template={template}
            detail={templateDetails.find((t: any) => t.name === template)}
          />
        </div>
      {contactsOpen ? (
        <ContactPicker
          onClose={() => setContactsOpen(false)}
          onSave={(selected) => {
            const existingIds = new Set(contacts.map((c) => c.id));
            const newContacts = selected.filter((c) => !existingIds.has(c.id));
            setContacts([...contacts, ...newContacts]);
            setContactsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PhonePreview({ template, detail }: { template: string; detail?: any }) {
  // Replace {{1}} placeholders with their stored sample values
  const renderBody = (t: any): string => {
    return String(t.body || '').replace(/\{\{(\d+)\}\}/g, (_m: string, n: string) => {
      const v = (t.template_variables || []).find((x: any) => x.position === Number(n));
      return v?.sample_value || `{{${n}}}`;
    });
  };
  const isMediaUrl = (s: any) => typeof s === 'string' && /^https?:\/\//.test(s);

  return (
    <aside className="flex min-h-[620px] items-center justify-center border-l border-slate-200 bg-[#f8f9fc] p-6">
      <div className="relative h-[650px] w-[330px] overflow-hidden rounded-[42px] border-[10px] border-[#171717] bg-[#fffdf8] shadow-xl">
        <div className="absolute left-1/2 top-0 z-10 h-7 w-36 -translate-x-1/2 rounded-b-2xl bg-black" />
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 bg-white px-5 pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4b46e5] text-[10px] text-white">
            Your Brand
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#091540]">
              Your Brand
            </p>
            <p className="text-[10px] text-slate-400">Business Account</p>
          </div>
          <div className="ml-auto flex gap-3">
            <Video className="h-4 w-4" />
            <Phone className="h-4 w-4" />
          </div>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(650px - 130px)' }}>
          {detail ? (
            <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white text-[12px] shadow-sm">
              {detail.header_type === 'IMAGE' && isMediaUrl(detail.header_content) && (
                <img src={detail.header_content} alt="" className="max-h-44 w-full object-cover" />
              )}
              {detail.header_type === 'IMAGE' && !isMediaUrl(detail.header_content) && (
                <div className="flex h-28 items-center justify-center bg-slate-100 text-slate-400">Image header</div>
              )}
              {detail.header_type === 'VIDEO' && isMediaUrl(detail.header_content) && (
                <video src={detail.header_content} controls className="max-h-44 w-full object-cover" />
              )}
              {detail.header_type === 'VIDEO' && !isMediaUrl(detail.header_content) && (
                <div className="flex h-28 items-center justify-center bg-slate-100 text-slate-400">Video header</div>
              )}
              {detail.header_type === 'DOCUMENT' && (
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-slate-500">
                  <FileText className="h-4 w-4" /> Document header
                </div>
              )}
              {detail.header_type === 'TEXT' && detail.header_content && (
                <p className="px-3 pt-3 text-[13px] font-bold text-[#091540]">{detail.header_content}</p>
              )}
              <p className="whitespace-pre-wrap px-3 py-2 leading-relaxed text-slate-600">{renderBody(detail)}</p>
              {detail.footer ? (
                <p className="px-3 pb-2 text-[10px] text-slate-400">{detail.footer}</p>
              ) : null}
              {Array.isArray(detail.template_buttons) && detail.template_buttons.length > 0 && (
                <div className="border-t border-slate-100">
                  {detail.template_buttons.map((b: any, i: number) => (
                    <p key={i} className="border-b border-slate-50 px-3 py-2 text-center text-[12px] font-medium text-[#4b46e5] last:border-0">
                      {b.button_text || 'Button'}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : template ? (
            <div className="rounded-[8px] border border-slate-200 bg-white p-4 text-[12px] text-slate-500">
              Loading “{template}” content… If it stays empty, open <strong>Templates → Sync Status</strong> once to pull template content from Meta.
            </div>
          ) : (
            <div className="rounded-[8px] border border-slate-200 bg-white p-4 text-[12px] text-slate-500">
              Select a template to preview.
            </div>
          )}
        </div>
        <div className="absolute bottom-0 flex w-full items-center gap-3 bg-white p-3">
          <Plus className="h-5 w-5" />
          <div className="h-8 flex-1 rounded-full border border-slate-100" />
          <ImageIcon className="h-5 w-5" />
          <Paperclip className="h-5 w-5" />
        </div>
      </div>
    </aside>
  );
}

function ContactPicker({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (contacts: Contact[]) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tag, setTag] = useState("All tags");
  const [tagFilterVisible, setTagFilterVisible] = useState(true);
  const [contactSearch, setContactSearch] = useState("");
  const setQuery = setContactSearch;
  const [excludeOptedOut, setExcludeOptedOut] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  const [availableTags, setAvailableTags] = useState<{name: string, color: string}[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [importModal, setImportModal] = useState(false);

  const fetchData = async () => {
    try {
      const cacheBuster = Date.now();
      const [contactsRes, tagsRes, attrsRes] = await Promise.all([
        fetch(`/api/contacts?_t=${cacheBuster}`),
        fetch(`/api/tags?_t=${cacheBuster}`),
        fetch(`/api/attribute-definitions?_t=${cacheBuster}`)
      ]);
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.name || "Unnamed",
          countryCode: c.country_code || "",
          whatsapp: c.whatsapp_number,
          source: c.source === "csv_upload" ? "CSV Upload" : c.source === "excel_upload" ? "Excel Upload" : c.source === "api" ? "API" : c.source === "chat" ? "Chat" : "Manual",
          tags: c.tags || [],
          attributes: c.attributes || {},
          optedOut: c.opted_out || false,
          createdAt: c.created_at,
        }));
        setContacts(mapped);
      }
      if (tagsRes.ok) setAvailableTags(await tagsRes.json());
      if (attrsRes.ok) {
        const attrs = await attrsRes.json();
        setAvailableAttributes(attrs.map((a: any) => a.key_name));
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const saveContact = async (contact: Contact) => {
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          country_code: contact.countryCode,
          whatsapp_number: contact.whatsapp,
          source: "manual",
          tags: contact.tags,
          attributes: contact.attributes,
        }),
      });
      if (res.ok) {
        setCreateModal(false);
        fetchData();
      } else {
        alert("Failed to save contact");
      }
    } catch (err) {
      alert("Error saving contact");
    }
  };

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const filtered = contacts
    .filter((contact) => !excludedIds.has(contact.id))
    .filter((contact) => !excludeOptedOut || !contact.optedOut)
    .filter((contact) => tag === "All tags" || contact.tags.includes(tag))
    .filter((contact) => `${contact.name} ${contact.countryCode}${contact.whatsapp}`.toLowerCase().includes(contactSearch.toLowerCase()));
  const pageContacts = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const allVisibleSelected = pageContacts.length > 0 && pageContacts.every((contact) => selected.has(contact.id));

  const toggleContact = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleVisible = () => setSelected((current) => { const next = new Set(current); pageContacts.forEach((contact) => allVisibleSelected ? next.delete(contact.id) : next.add(contact.id)); return next; });
  const addSelected = () => onSave(contacts.filter((contact) => selected.has(contact.id) && (!excludeOptedOut || !contact.optedOut)));

  const bulkRemove = () => {
    setExcludedIds(prev => new Set([...prev, ...selected]));
    setSelected(new Set());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/30 p-4">
      <div className="flex max-h-[86vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-[22px] font-semibold text-[#091540]">Select Audience</h2>
            <p className="mt-1 text-[13px] text-slate-500">Choose contacts for this campaign.</p>
          </div>
          <div className="flex gap-2 mr-6">
             <button type="button" onClick={() => setCreateModal(true)} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" /> Add Contact</button>
             <button type="button" onClick={() => setImportModal(true)} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-3.5 w-3.5 rotate-180" /> Import CSV</button>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-6 relative">
          <div className="space-y-5">
            <section className="rounded-[10px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between"><h3 className="flex items-center gap-3 text-[18px] font-semibold text-[#172033]"><Tag className="h-5 w-5 text-[#5a57f1]" /> Filter by Tags</h3><button type="button" onClick={() => setTagFilterVisible(true)} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#eef0ff] px-4 text-[14px] font-medium text-[#514be8]"><Plus className="h-4 w-4" /> Add Tag</button></div>
              {tagFilterVisible ? <div className="mt-5 rounded-[10px] border border-[#dfe7ff] bg-[#f8faff] p-4"><div className="flex items-end gap-3"><label className="flex-1 text-[14px] font-medium text-[#3d485c]">Tag<select value={tag} onChange={(event) => { setTag(event.target.value); setPage(1); }} className="mt-2 h-12 w-full rounded-[8px] border border-[#cfd6e1] bg-white px-3 text-[14px] font-normal outline-none focus:border-[#4b46e5]"><option>All tags</option>{availableTags.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label><button type="button" onClick={() => { setTag("All tags"); setTagFilterVisible(false); }} aria-label="Remove tag filter" className="mb-2 p-2 text-slate-400 hover:text-rose-600"><Trash2 className="h-5 w-5" /></button></div></div> : null}
            </section>
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-6"><button type="button" onClick={() => { setTag("All tags"); setContactSearch(""); setExcludedIds(new Set()); }} className="h-10 rounded-[8px] border border-slate-200 px-4 text-[14px] font-medium text-slate-700">Clear</button><button type="button" onClick={() => setPage(1)} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#514be8] px-4 text-[14px] font-medium text-[#514be8]"><Filter className="h-4 w-4" /> Apply Filters</button></div>
          </div>
          
          <div className="mt-6 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[14px] font-semibold text-[#091540]">Matching Contacts <span className="font-normal text-slate-500">{filtered.length} Contacts</span></h3>
              <label className="flex items-center gap-2 text-[12px] text-slate-600"><CyberToggle checked={excludeOptedOut} onChange={setExcludeOptedOut} /> Exclude opted-out contacts</label>
            </div>
            <div className="mt-4">
              <label className="text-[12px] font-semibold text-slate-600">Search contacts
                <input placeholder="Name or WhatsApp number" onChange={(event) => setContactSearch(event.target.value)} className="mt-1 h-9 w-full rounded-[6px] border border-slate-200 px-2 font-normal" />
              </label>
            </div>

            {selected.size > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-[8px] bg-slate-900 px-4 py-3 text-white shadow-lg sticky top-0 z-10">
                <span className="text-[13px] font-semibold">{selected.size} contacts selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(new Set())} className="h-8 rounded-[6px] bg-white/20 px-3 text-[12px] font-semibold hover:bg-white/30">
                    Clear Selection
                  </button>
                  <button onClick={bulkRemove} className="flex h-8 items-center gap-1.5 rounded-[6px] bg-rose-500 px-3 text-[12px] font-semibold hover:bg-rose-600">
                    <Trash2 className="h-3.5 w-3.5" /> Remove from audience
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-[8px] border border-slate-200">
              <table className="min-w-[750px] w-full text-left text-[12px]">
                <thead className="bg-[#f8f9fc] text-slate-500">
                  <tr>
                    <th className="px-3 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} /></th>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">WhatsApp Number</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Tags</th>
                    <th className="px-3 py-3">Opt-out</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageContacts.map((contact) => (
                    <tr key={contact.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3"><input type="checkbox" checked={selected.has(contact.id)} onChange={() => toggleContact(contact.id)} /></td>
                      <td className="px-3 py-3 font-medium">{contact.name}</td>
                      <td className="px-3 py-3">{contact.countryCode}{contact.whatsapp}</td>
                      <td className="px-3 py-3 text-slate-500">{contact.source}</td>
                      <td className="px-3 py-3">{contact.tags.join(", ") || "-"}</td>
                      <td className="px-3 py-3">{contact.optedOut ? "Opted out" : "Allowed"}</td>
                      <td className="px-3 py-3">
                        <button 
                          type="button" 
                          onClick={() => {
                            setExcludedIds(prev => new Set(prev).add(contact.id));
                            if (selected.has(contact.id)) {
                              setSelected(current => {
                                const next = new Set(current);
                                next.delete(contact.id);
                                return next;
                              });
                            }
                          }} 
                          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-rose-500 hover:bg-rose-50"
                          title="Remove from audience"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-500">
              <span>{selected.size} contacts selected</span>
              <div className="flex items-center gap-2">
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="rounded border border-slate-200 px-2 py-1">
                  <option value="5">5 / page</option>
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                </select>
                <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40">Previous</button>
                <span>{page} / {totalPages}</span>
                <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4"><span className="text-[12px] text-slate-500">{selected.size} contacts selected</span><div className="flex gap-3"><button type="button" onClick={onClose} className="h-10 rounded-[8px] border border-slate-200 px-4 text-[13px]">Cancel</button><button type="button" disabled={!selected.size} onClick={addSelected} className="h-10 rounded-[8px] bg-[#1B2CC1] px-4 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Add Selected Contacts</button></div></div>
      </div>
      
      {createModal && (
        <ContactModal
          initial={null}
          availableTags={availableTags}
          availableAttributes={availableAttributes}
          onClose={() => setCreateModal(false)}
          onSave={saveContact}
        />
      )}
      {importModal && (
        <ImportModal
          onClose={() => setImportModal(false)}
          onImported={() => {
            setImportModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function InsightModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  const delivered = campaign.delivered ?? 0;
  const rate = campaign.contacts
    ? Math.round((delivered / campaign.contacts) * 100)
    : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="w-full max-w-[560px] rounded-[12px] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[21px] font-semibold">
            {campaign.name} Insights
          </h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Recipients", campaign.contacts],
            ["Delivered", delivered],
            ["Read", campaign.read ?? 0],
            ["Replies", campaign.replies ?? 0],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-[8px] border border-slate-200 bg-slate-50 p-3"
            >
              <span className="text-[11px] text-slate-500">{label}</span>
              <strong className="mt-1 block text-[20px]">
                {Number(value).toLocaleString()}
              </strong>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-[8px] border border-slate-200 p-4">
          <div className="flex justify-between text-[13px] font-semibold">
            <span>Delivery performance</span>
            <span className="text-emerald-600">{rate}%</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, rate)}%` }}
            />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-[12px] text-slate-500">
          <BarChart3 className="h-4 w-4 text-[#1B2CC1]" />
          Metrics use available provider delivery events.
        </div>
      </div>
    </div>
  );
}
