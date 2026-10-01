"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import type { FlowNodeType } from "./SelectActionModal";

interface NodeConfigPanelProps {
  nodeId: string;
  nodeType: FlowNodeType | "starting_step";
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  onClose: () => void;
}

const nodeLabels: Record<string, string> = {
  starting_step: "Starting Step",
  text_button: "Text + Button",
  media: "Media",
  audio: "Audio",
  list: "List",
  template: "Template",
  ask_question: "Ask a Question",
  whatsapp_form: "WhatsApp Form",
  payment: "Payment",
  save_attribute: "Save Attribute",
  add_tag: "Add Tag",
  google_sheet: "Google Sheet",
  meta_conversion_api: "Meta Conversion API",
  time_delay: "Time Delay",
  webhook: "Webhook",
  condition: "Condition",
};

export function NodeConfigPanel({ nodeId, nodeType, config, onConfigChange, onClose }: NodeConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<Record<string, any>>(config || {});

  useEffect(() => { setLocalConfig(config || {}); }, [config]);

  const update = (key: string, value: any) => {
    const next = { ...localConfig, [key]: value };
    setLocalConfig(next);
    onConfigChange(next);
  };

  const InputField = ({ label, field, placeholder, type = "text" }: { label: string; field: string; placeholder: string; type?: string }) => (
    <div>
      <label className="block text-[12px] font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={localConfig[field] || ""}
        onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>
  );

  const TextAreaField = ({ label, field, placeholder }: { label: string; field: string; placeholder: string }) => (
    <div>
      <label className="block text-[12px] font-medium text-foreground mb-1.5">{label}</label>
      <textarea
        value={localConfig[field] || ""}
        onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
      />
    </div>
  );

  const SelectField = ({ label, field, options }: { label: string; field: string; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-[12px] font-medium text-foreground mb-1.5">{label}</label>
      <select
        value={localConfig[field] || ""}
        onChange={(e) => update(field, e.target.value)}
        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const renderConfig = () => {
    switch (nodeType) {
      case "text_button":
        return (
          <>
            <TextAreaField label="Message Text" field="message" placeholder="Type your message..." />
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1.5">Buttons</label>
              {(localConfig.buttons || []).map((btn: string, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={btn}
                    onChange={(e) => {
                      const buttons = [...(localConfig.buttons || [])];
                      buttons[i] = e.target.value;
                      update("buttons", buttons);
                    }}
                    placeholder={`Button ${i + 1}`}
                    className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                  <button type="button" onClick={() => { const b = [...(localConfig.buttons || [])]; b.splice(i, 1); update("buttons", b); }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {(localConfig.buttons || []).length < 3 && (
                <button type="button" onClick={() => update("buttons", [...(localConfig.buttons || []), ""])}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80 transition">
                  <Plus className="h-3.5 w-3.5" /> Add Button
                </button>
              )}
            </div>
          </>
        );

      case "media":
        return (
          <>
            <SelectField label="Media Type" field="media_type" options={[
              { value: "image", label: "Image" }, { value: "video", label: "Video" }, { value: "document", label: "Document" }
            ]} />
            <InputField label="Media URL" field="media_url" placeholder="https://example.com/image.jpg" />
            <InputField label="Caption" field="caption" placeholder="Optional caption" />
          </>
        );

      case "audio":
        return <InputField label="Audio URL" field="audio_url" placeholder="https://example.com/audio.mp3" />;

      case "list":
        return (
          <>
            <InputField label="List Title" field="title" placeholder="Choose an option" />
            <InputField label="Button Text" field="button_text" placeholder="View Options" />
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1.5">List Items</label>
              {(localConfig.items || []).map((item: { title: string; description: string }, i: number) => (
                <div key={i} className="flex items-start gap-2 mb-2 p-2 rounded-lg border border-border bg-background">
                  <div className="flex-1 space-y-1.5">
                    <input type="text" value={item.title || ""} onChange={(e) => {
                      const items = [...(localConfig.items || [])]; items[i] = { ...items[i], title: e.target.value }; update("items", items);
                    }} placeholder="Item title" className="w-full h-8 rounded border border-border bg-background px-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition" />
                    <input type="text" value={item.description || ""} onChange={(e) => {
                      const items = [...(localConfig.items || [])]; items[i] = { ...items[i], description: e.target.value }; update("items", items);
                    }} placeholder="Description" className="w-full h-8 rounded border border-border bg-background px-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition" />
                  </div>
                  <button type="button" onClick={() => { const items = [...(localConfig.items || [])]; items.splice(i, 1); update("items", items); }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition mt-1"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <button type="button" onClick={() => update("items", [...(localConfig.items || []), { title: "", description: "" }])}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80 transition">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
          </>
        );

      case "template":
        return <InputField label="Template Name" field="template_name" placeholder="Enter approved template name" />;

      case "ask_question":
        return (
          <>
            <TextAreaField label="Question" field="question" placeholder="What would you like to ask?" />
            <InputField label="Variable Name" field="variable_name" placeholder="e.g. user_reply" />
          </>
        );

      case "whatsapp_form":
        return <InputField label="Flow ID" field="flow_id" placeholder="Select published WhatsApp Flow ID" />;

      case "payment":
        return (
          <>
            <InputField label="Amount" field="amount" placeholder="100.00" type="number" />
            <SelectField label="Currency" field="currency" options={[
              { value: "INR", label: "INR (₹)" }, { value: "USD", label: "USD ($)" }, { value: "EUR", label: "EUR (€)" }
            ]} />
            <InputField label="Description" field="description" placeholder="Payment for..." />
          </>
        );

      default:
        return <p className="text-sm text-muted-foreground">No configuration available for this node type.</p>;
    }
  };

  return (
    <div className="w-[360px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <h4 className="text-sm font-bold text-foreground">{nodeLabels[nodeType] || nodeType}</h4>
        <button type="button" onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {renderConfig()}
      </div>
    </div>
  );
}
