"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, Send } from "lucide-react";

type TemplateButton = {
  id: string;
  type: string;
  text: string;
};

type Template = {
  id: string;
  name: string;
  language: string;
  components: any[];
  buttons: TemplateButton[];
};

function TemplateMessageNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const templateId: string = config.template_id || "";

  useEffect(() => {
    // In a real app this would call the existing GET /api/templates
    // Mocking here for the UI flow demonstration
    setTemplates([
      {
        id: "1",
        name: "welcome_message",
        language: "en_US",
        components: [{ type: "BODY", text: "Welcome to our service!" }],
        buttons: [{ id: "b1", type: "QUICK_REPLY", text: "Get Started" }, { id: "b2", type: "QUICK_REPLY", text: "Learn More" }]
      },
      {
        id: "2",
        name: "order_update",
        language: "en_US",
        components: [{ type: "BODY", text: "Your order {{1}} has shipped." }],
        buttons: [{ id: "b3", type: "URL", text: "Track Order" }]
      }
    ]);
    setLoading(false);
  }, []);

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <div className={`rounded-xl border-2 bg-card shadow-lg w-[320px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-sky-500/40`}>
      <Handle type="target" position={Position.Left} id="target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Header (No Message badge) */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">Template Message</span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Template selection dropdown */}
      <div className="px-4 pt-3 pb-2">
        <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Select Template</label>
        <select
          value={templateId}
          onChange={(e) => updateConfig({ template_id: e.target.value })}
          disabled={loading}
          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition disabled:opacity-50"
        >
          <option value="">Choose a template...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
          ))}
        </select>
      </div>

      {/* Inline preview & dynamic branches */}
      {selectedTemplate && (
        <>
          <div className="px-4 pb-2">
            <div className="rounded-lg border border-border bg-emerald-500/5 p-3 text-[11px] text-foreground relative shadow-inner">
              {/* Bubble tail */}
              <div className="absolute top-0 -left-2 w-0 h-0 border-[6px] border-transparent border-t-emerald-500/5 border-r-emerald-500/5" />
              <p className="whitespace-pre-wrap">
                {selectedTemplate.components.find((c) => c.type === "BODY")?.text || "No body content."}
              </p>
            </div>
          </div>
          {/* Inherited buttons from template */}
          {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              <label className="block text-[10px] font-medium text-muted-foreground">Template Buttons</label>
              {selectedTemplate.buttons.map((btn) => (
                <div key={btn.id} className="flex items-center justify-between rounded border border-border bg-muted/20 px-2 py-1.5 relative">
                  <span className="text-[11px] font-medium text-foreground truncate">{btn.text}</span>
                  <Handle type="source" position={Position.Right} id={`btn-${btn.id}`} className="!w-3 !h-3 !bg-sky-500 !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-24px" }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Next Step fallback handle */}
      <div className="px-4 pb-3 flex items-center justify-end relative mt-2">
        <span className="text-[10px] font-medium text-muted-foreground mr-2">Next Step</span>
        <Handle type="source" position={Position.Right} id="next_step" className="!w-3 !h-3 !bg-primary !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-6px" }} />
      </div>
    </div>
  );
}

export default memo(TemplateMessageNode);
