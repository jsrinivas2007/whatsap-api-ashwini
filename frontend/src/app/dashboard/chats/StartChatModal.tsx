"use client";

import { useState, useEffect } from "react";
import { X, User, Users, FileText, Download, CheckCircle2 } from "lucide-react";
import { ButtonLoader } from "@/components/ui/Loader";
import { parseContactsCSV } from "@/utils/csvParser";

type Template = {
  id: string;
  name: string;
  body: string;
};

export default function StartChatModal({
  onClose,
  onChatCreated,
}: {
  onClose: () => void;
  onChatCreated: (conversationId: string, requiresTemplate: boolean) => void;
}) {
  const [tab, setTab] = useState<"single" | "bulk">("single");

  // Single Chat state
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Chat state
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [mode, setMode] = useState<"create_only" | "send_template" | null>(null);
  
  // Template Picker state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Job Progress state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  useEffect(() => {
    // Fetch approved templates for selection
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates?status=APPROVED");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, []);

  const handleSingleSubmit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/chats/start-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, country_code: countryCode, whatsapp_number: phone })
      });
      if (res.ok) {
        const data = await res.json();
        onChatCreated(data.conversation_id, data.requires_template);
      } else {
        alert("Failed to start chat.");
      }
    } catch (err) {
      alert("Error starting chat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseCSVPreview = (text: string) => {
    const { count } = parseContactsCSV(text);
    setContactCount(count);
  };

  const handleFileSelect = (f?: File) => {
    if (f?.name.toLowerCase().endsWith(".csv")) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => parseCSVPreview(String(reader.result));
      reader.readAsText(f);
    }
  };

  const handleBulkSubmit = async () => {
    if (!file || !mode) return;
    if (mode === "send_template" && !selectedTemplate) return;

    setIsSubmitting(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      const { contacts } = parseContactsCSV(String(reader.result));

      try {
        const res = await fetch("/api/chats/start-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            mode, 
            template_id: mode === "send_template" ? selectedTemplate : undefined,
            rows: contacts 
          })
        });
        if (res.ok) {
          const data = await res.json();
          setJobId(data.job_id);
          pollJobProgress(data.job_id);
        } else {
          alert("Failed to start bulk import.");
          setIsSubmitting(false);
        }
      } catch (err) {
        alert("Error starting bulk chat.");
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  const pollJobProgress = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/start-bulk/${id}`);
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data);
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
            setIsSubmitting(false);
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsSubmitting(false);
      }
    }, 1500);
  };

  const renderSingleChat = () => (
    <div className="space-y-4 pt-4">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-foreground">Contact Name</span>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)}
          placeholder="Enter contact name" 
          className="h-10 w-full rounded-[8px] border border-border bg-background px-3 text-[13px] outline-none focus:border-primary" 
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-foreground">WhatsApp Number</span>
        <div className="flex gap-2">
          <select 
            value={countryCode} 
            onChange={e => setCountryCode(e.target.value)}
            className="h-10 w-[90px] rounded-[8px] border border-border bg-background px-2 text-[13px] outline-none focus:border-primary"
          >
            <option value="91">IN +91</option>
            <option value="1">US +1</option>
            <option value="44">UK +44</option>
          </select>
          <input 
            value={phone} 
            onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 9876543210" 
            className="h-10 flex-1 rounded-[8px] border border-border bg-background px-3 text-[13px] outline-none focus:border-primary" 
          />
        </div>
      </label>
      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onClose} className="h-10 rounded-[8px] border border-border px-4 text-[13px] font-medium text-foreground hover:bg-muted">Cancel</button>
        <button 
          type="button" 
          onClick={handleSingleSubmit}
          disabled={!name.trim() || phone.length < 7 || isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? <ButtonLoader className="text-primary-foreground" /> : "Create Chat"}
        </button>
      </div>
    </div>
  );

  const renderBulkChat = () => {
    if (jobStatus) {
      return (
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {jobStatus.status === "completed" ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <ButtonLoader className="text-primary h-6 w-6" />}
          </div>
          <h3 className="text-[16px] font-semibold">Bulk Chat {jobStatus.status === "completed" ? "Complete" : "Processing"}</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">{jobStatus.processed} of {jobStatus.total} rows processed.</p>
          {jobStatus.status === "completed" && (
            <div className="mt-4 flex flex-col items-center text-[12px] text-muted-foreground">
              <span>{jobStatus.result?.created || 0} chats created</span>
              <span>{jobStatus.result?.sent || 0} messages sent</span>
            </div>
          )}
          {jobStatus.status === "completed" && (
            <button onClick={() => window.location.reload()} className="mt-6 h-10 w-full rounded-[8px] bg-primary text-[13px] font-semibold text-primary-foreground hover:bg-primary/90">
              Close & Refresh
            </button>
          )}
        </div>
      );
    }

    if (showTemplatePicker) {
      return (
        <div className="pt-4">
          <h3 className="mb-3 text-[14px] font-semibold">Select Template</h3>
          <div className="max-h-[300px] overflow-y-auto rounded-[8px] border border-border">
            {templates.map(t => (
              <label key={t.id} className="flex cursor-pointer items-start gap-3 border-b border-border p-3 hover:bg-muted/50 last:border-0">
                <input 
                  type="radio" 
                  name="template" 
                  value={t.id} 
                  checked={selectedTemplate === t.id}
                  onChange={() => setSelectedTemplate(t.id)}
                  className="mt-1 accent-primary" 
                />
                <div>
                  <div className="text-[13px] font-semibold">{t.name}</div>
                  <div className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{t.body}</div>
                </div>
              </label>
            ))}
            {templates.length === 0 && <div className="p-4 text-center text-[12px] text-muted-foreground">No approved templates found.</div>}
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
            <button type="button" onClick={() => setShowTemplatePicker(false)} className="h-10 rounded-[8px] border border-border px-4 text-[13px] font-medium hover:bg-muted">Back</button>
            <button 
              type="button" 
              onClick={() => { setMode("send_template"); handleBulkSubmit(); }}
              disabled={!selectedTemplate || isSubmitting}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? <ButtonLoader className="text-primary-foreground" /> : "Send Messages"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium text-foreground">Upload CSV</span>
          <button onClick={() => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(new Blob(["Name,CountryCode,Whatsapp\nRahul Sharma,91,9876543210"], { type: "text/csv" }));
            link.download = "chats-sample.csv";
            link.click();
          }} className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
            <Download className="h-3.5 w-3.5" /> Download Sample CSV
          </button>
        </div>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
          className={`rounded-[8px] border-2 border-dashed p-6 text-center ${dragging ? "border-primary bg-primary/5" : "border-border bg-card"}`}
        >
          <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />
          <FileText className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-[13px] font-medium text-foreground">
            {file ? file.name : <>Drag & drop your CSV file here<br/>or <label htmlFor="csv-upload" className="cursor-pointer text-primary hover:underline">browse to upload</label></>}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Required columns: Name, CountryCode, Whatsapp</p>
          {contactCount !== null && (
            <p className="mt-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[12px] font-medium text-emerald-600">
              {contactCount} contacts found in file
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="h-10 rounded-[8px] border border-border px-4 text-[13px] font-medium hover:bg-muted">Cancel</button>
          <button 
            type="button" 
            onClick={() => { setMode("create_only"); handleBulkSubmit(); }}
            disabled={!file || isSubmitting}
            className="h-10 rounded-[8px] border border-border bg-muted/50 px-4 text-[13px] font-medium hover:bg-muted disabled:opacity-50"
          >
            Create Chats Only
          </button>
          <button 
            type="button" 
            onClick={() => setShowTemplatePicker(true)}
            disabled={!file || isSubmitting}
            className="h-10 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Send Message With Template
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] rounded-[12px] border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquareIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">Start New Chat</h2>
              <p className="text-[13px] text-muted-foreground">Create a new WhatsApp conversation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!jobStatus && !showTemplatePicker && (
          <div className="flex gap-4 border-b border-border">
            <button 
              onClick={() => setTab("single")}
              className={`flex items-center gap-2 border-b-2 py-3 text-[13px] font-medium transition-colors ${tab === "single" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
            >
              <User className="h-4 w-4" /> Single Chat
            </button>
            <button 
              onClick={() => setTab("bulk")}
              className={`flex items-center gap-2 border-b-2 py-3 text-[13px] font-medium transition-colors ${tab === "bulk" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
            >
              <Users className="h-4 w-4" /> Bulk Chat
            </button>
          </div>
        )}

        {tab === "single" ? renderSingleChat() : renderBulkChat()}
      </div>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
