"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, Clock, Calendar, Minus, Plus } from "lucide-react";

function TimeDelayNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;

  const mode = config.mode || "relative";
  const days = config.days || 0;
  const hours = config.hours || 0;
  const minutes = config.minutes || 0;
  const specificDatetime = config.specific_datetime || "";

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const updateNumber = (field: string, current: number, delta: number) => {
    const next = Math.max(0, current + delta);
    updateConfig({ [field]: next });
  };

  // Helper to construct the summary text
  const getSummary = () => {
    if (mode === "specific_time") {
      if (!specificDatetime) return "No specific time configured";
      const date = new Date(specificDatetime);
      if (isNaN(date.getTime())) return "Invalid date configured";
      return `The flow will pause here until ${date.toLocaleString()}`;
    }

    if (days === 0 && hours === 0 && minutes === 0) {
      return "No delay configured — the flow will continue immediately";
    }

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    return `The flow will pause here for ${parts.join(', ')} before moving on`;
  };

  return (
    <div className={`rounded-lg border-2 bg-card shadow-lg w-[320px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-yellow-500/40`}>
      <Handle type="target" position={Position.Left} id="target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">Time Delay</span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Mode toggle */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex rounded-lg border border-border overflow-hidden bg-background">
          <button
            type="button"
            onClick={() => updateConfig({ mode: "relative" })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium transition ${
              mode === "relative"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Clock className="h-3 w-3" /> Relative Delay
          </button>
          <button
            type="button"
            onClick={() => updateConfig({ mode: "specific_time" })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium transition ${
              mode === "specific_time"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Calendar className="h-3 w-3" /> Specific Time
          </button>
        </div>
      </div>

      {/* Relative Delay fields */}
      {mode === "relative" && (
        <div className="px-4 pb-2 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Days</label>
              <div className="flex items-center rounded-lg border border-border bg-background w-full">
                <button type="button" onClick={() => updateNumber("days", days, -1)} className="flex h-8 w-8 items-center justify-center hover:bg-muted text-muted-foreground transition">
                  <Minus className="h-3 w-3" />
                </button>
                <div className="flex-1 text-center text-[12px] font-medium text-foreground">{days}</div>
                <button type="button" onClick={() => updateNumber("days", days, 1)} className="flex h-8 w-8 items-center justify-center hover:bg-muted text-muted-foreground transition">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Hours</label>
              <div className="flex items-center rounded-lg border border-border bg-background w-full">
                <button type="button" onClick={() => updateNumber("hours", hours, -1)} className="flex h-8 w-8 items-center justify-center hover:bg-muted text-muted-foreground transition">
                  <Minus className="h-3 w-3" />
                </button>
                <div className="flex-1 text-center text-[12px] font-medium text-foreground">{hours}</div>
                <button type="button" onClick={() => updateNumber("hours", hours, 1)} className="flex h-8 w-8 items-center justify-center hover:bg-muted text-muted-foreground transition">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Minutes</label>
              <div className="flex items-center rounded-lg border border-border bg-background w-full">
                <button type="button" onClick={() => updateNumber("minutes", minutes, -1)} className="flex h-8 w-8 items-center justify-center hover:bg-muted text-muted-foreground transition">
                  <Minus className="h-3 w-3" />
                </button>
                <div className="flex-1 text-center text-[12px] font-medium text-foreground">{minutes}</div>
                <button type="button" onClick={() => updateNumber("minutes", minutes, 1)} className="flex h-8 w-8 items-center justify-center hover:bg-muted text-muted-foreground transition">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specific Time fields */}
      {mode === "specific_time" && (
        <div className="px-4 pb-2">
          <label className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider block">Target Date & Time</label>
          <input
            type="datetime-local"
            value={specificDatetime}
            onChange={(e) => updateConfig({ specific_datetime: e.target.value })}
            className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
          />
        </div>
      )}

      {/* Summary */}
      <div className="px-4 pb-3">
        <div className="rounded border border-border bg-muted/20 p-2">
          <p className="text-[10px] text-muted-foreground text-center leading-snug">
            {getSummary()}
          </p>
        </div>
      </div>

      {/* Next Step handle */}
      <div className="px-4 pb-3 flex items-center justify-end relative">
        <span className="text-[10px] font-medium text-muted-foreground mr-2">Next Step</span>
        <Handle type="source" position={Position.Right} id="next_step" className="!w-3 !h-3 !bg-primary !border-2 !border-background" style={{ top: "auto", position: "absolute", right: "-6px" }} />
      </div>
    </div>
  );
}

export default memo(TimeDelayNode);
