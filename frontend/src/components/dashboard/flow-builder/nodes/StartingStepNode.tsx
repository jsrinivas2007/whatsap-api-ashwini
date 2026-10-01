"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MessageSquare, ChevronDown, ChevronUp, Plus, X, Info, CheckCircle } from "lucide-react";

function StartingStepNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const [expanded, setExpanded] = useState(true);

  const matchMode = config.match_mode || "specific_keywords";
  const keywords: string[] = config.keywords || [];

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) {
      onConfigChange({ ...config, ...updates });
    }
  }, [config, onConfigChange]);

  return (
    <div className={`rounded-lg border-2 bg-card shadow-lg w-[320px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-emerald-500/40`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-foreground">Starting Step</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">When should this flow start?</p>
        </div>
      </div>

      {/* WhatsApp Chatbot trigger card */}
      <div className="px-4 pt-3 pb-2">
        <div className="rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 p-3 relative">
          <div className="absolute top-2 right-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            <span className="text-[12px] font-semibold text-foreground">WhatsApp Chatbot</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Start this chatbot from incoming WhatsApp messages
          </p>
        </div>
      </div>

      {/* More start options (collapsible) */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition w-full py-1.5"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          More start options
        </button>

        {expanded && (
          <div className="mt-2 space-y-3">
            {/* Toggle: Specific keywords / Any message */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => updateConfig({ match_mode: "specific_keywords" })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition ${
                  matchMode === "specific_keywords"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Specific keywords
                <Info className="h-3 w-3 opacity-50" />
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ match_mode: "any_message" })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition ${
                  matchMode === "any_message"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Any message
              </button>
            </div>

            {/* Keyword rows (only when specific_keywords) */}
            {matchMode === "specific_keywords" && (
              <div className="space-y-2">
                {keywords.map((kw, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={kw}
                      onChange={(e) => {
                        const next = [...keywords];
                        next[i] = e.target.value;
                        updateConfig({ keywords: next });
                      }}
                      placeholder={`Keyword ${i + 1}`}
                      className="flex-1 h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = keywords.filter((_, idx) => idx !== i);
                        updateConfig({ keywords: next });
                      }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateConfig({ keywords: [...keywords, ""] })}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition"
                >
                  <Plus className="h-3 w-3" /> Add Keyword
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single output handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
}

export default memo(StartingStepNode);
