"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, MessageCircle, FileText, Send } from "lucide-react";
import Link from "next/link";

type FlowMeta = {
  id: string;
  name: string;
  fieldCount: number;
};

function WhatsappFormNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;
  const messageIndex = (data.messageIndex as number) || 1;

  const messageBody: string = config.message_body || "";
  const buttonText: string = config.button_text || "";
  const flowId: string = config.flow_id || "";

  const [publishedFlows, setPublishedFlows] = useState<FlowMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app this calls GET /api/whatsapp-flows/published
    setPublishedFlows([
      { id: "form_1", name: "Customer Feedback", fieldCount: 3 },
      { id: "form_2", name: "Lead Qualification", fieldCount: 5 }
    ]);
    setLoading(false);
  }, []);

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const selectedFlow = publishedFlows.find(f => f.id === flowId);

  return (
    <div className={`rounded-lg border-2 bg-card shadow-lg w-[320px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-teal-500/40`}>
      <Handle type="target" position={Position.Left} id="target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">WhatsApp Form</span>
          <span className="rounded-full bg-teal-500/10 text-teal-600 px-2 py-0.5 text-[10px] font-semibold">
            Message {messageIndex}
          </span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Message Body */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Message Body</label>
        </div>
        <textarea
          value={messageBody}
          onChange={(e) => {
            if (e.target.value.length <= 1024) updateConfig({ message_body: e.target.value });
          }}
          placeholder="Write the message that introduces this form"
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{messageBody.length}/1024</p>
      </div>

      {/* Button Text */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Send className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Button Text</label>
        </div>
        <input
          type="text"
          value={buttonText}
          onChange={(e) => {
            if (e.target.value.length <= 30) updateConfig({ button_text: e.target.value });
          }}
          placeholder="Label for the form button (up to 30 characters)"
          className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{buttonText.length}/30</p>
      </div>

      {/* Attach a Form */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <label className="text-[11px] font-semibold text-foreground">Attach a Form</label>
          </div>
          <Link href="/dashboard/forms" target="_blank" className="text-[10px] font-medium text-primary hover:underline">
            + Create Form
          </Link>
        </div>
        <select
          value={flowId}
          onChange={(e) => updateConfig({ flow_id: e.target.value })}
          disabled={loading}
          className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition mb-3 disabled:opacity-50"
        >
          <option value="">Choose a published form...</option>
          {publishedFlows.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        {selectedFlow ? (
          <div className="rounded border border-border bg-muted/20 p-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground truncate">{selectedFlow.name}</span>
            <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
              {selectedFlow.fieldCount} fields
            </span>
          </div>
        ) : (
          <div className="rounded border-2 border-dashed border-border bg-muted/10 p-4 flex flex-col items-center text-center">
            <FileText className="h-5 w-5 text-muted-foreground mb-1.5" />
            <p className="text-[11px] font-bold text-foreground mb-0.5">No form attached yet</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Choose a form above to map its answers into contact attributes.</p>
          </div>
        )}
      </div>

      {/* Output handles */}
      <div className="px-4 pb-3 pt-1 space-y-2">
        <div className="flex items-center justify-end relative">
          <span className="text-[10px] font-semibold text-emerald-600 mr-2">Form Completed</span>
          <Handle type="source" position={Position.Right} id="form_completed" className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-6px" }} />
        </div>
        <div className="flex items-center justify-end relative">
          <span className="text-[10px] font-medium text-muted-foreground mr-2">Next Step</span>
          <Handle type="source" position={Position.Right} id="next_step" className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-6px" }} />
        </div>
      </div>
    </div>
  );
}

export default memo(WhatsappFormNode);
