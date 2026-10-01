"use client";

import { useState } from "react";
import {
  X, MessageSquare, Zap, Type, Image, Volume2, List, Send,
  HelpCircle, FileText, CreditCard, Database, Tag, Sheet,
  ShieldCheck, Clock, Globe, GitBranch,
} from "lucide-react";

export type FlowNodeType =
  | "text_button" | "media" | "audio" | "list" | "template"
  | "ask_question" | "whatsapp_form" | "payment"
  | "save_attribute" | "add_tag" | "time_delay" | "condition";

interface SelectActionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: FlowNodeType) => void;
}

const messageOptions: { type: FlowNodeType; label: string; icon: React.ReactNode }[] = [
  { type: "text_button", label: "Text + Button", icon: <Type className="h-5 w-5" /> },
  { type: "media", label: "Media", icon: <Image className="h-5 w-5" /> },
  { type: "audio", label: "Audio", icon: <Volume2 className="h-5 w-5" /> },
  { type: "list", label: "List", icon: <List className="h-5 w-5" /> },
  { type: "template", label: "Template", icon: <Send className="h-5 w-5" /> },
  { type: "ask_question", label: "Ask a Question", icon: <HelpCircle className="h-5 w-5" /> },
  { type: "whatsapp_form", label: "WhatsApp Form", icon: <FileText className="h-5 w-5" /> },
  { type: "payment", label: "Payment", icon: <CreditCard className="h-5 w-5" /> },
];

const actionOptions: { type: FlowNodeType; label: string; icon: React.ReactNode }[] = [
  { type: "save_attribute", label: "Save Attribute", icon: <Database className="h-5 w-5" /> },
  { type: "add_tag", label: "Add Tag", icon: <Tag className="h-5 w-5" /> },
  { type: "time_delay", label: "Time Delay", icon: <Clock className="h-5 w-5" /> },
  { type: "condition", label: "Condition", icon: <GitBranch className="h-5 w-5" /> },
];

export function SelectActionModal({ open, onClose, onSelect }: SelectActionModalProps) {
  const [tab, setTab] = useState<"messages" | "actions">("messages");

  if (!open) return null;

  const options = tab === "messages" ? messageOptions : actionOptions;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-border overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Select Action</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => setTab("messages")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium border-b-2 transition ${
              tab === "messages"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </button>
          <button
            type="button"
            onClick={() => setTab("actions")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium border-b-2 transition ${
              tab === "actions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="h-4 w-4" /> Actions
          </button>
        </div>

        {/* Grid */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => { onSelect(opt.type); onClose(); }}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-left hover:bg-muted hover:border-primary/30 transition group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition">
                  {opt.icon}
                </div>
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
