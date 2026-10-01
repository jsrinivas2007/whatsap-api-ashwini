"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, Plus, GripVertical } from "lucide-react";

type RowItem = { id: string; title: string; description: string };
type Section = { id: string; title: string; rows: RowItem[] };

function ListNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;
  const messageIndex = (data.messageIndex as number) || 1;

  const messageBody: string = config.message_body || "";
  const optionsLabel: string = config.options_label || "";
  const sections: Section[] = config.sections || [];

  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);
  const genId = () => Math.random().toString(36).slice(2, 10);

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const updateSection = (sIdx: number, updates: Partial<Section>) => {
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], ...updates };
    updateConfig({ sections: next });
  };

  const updateRow = (sIdx: number, rIdx: number, updates: Partial<RowItem>) => {
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], rows: [...next[sIdx].rows] };
    next[sIdx].rows[rIdx] = { ...next[sIdx].rows[rIdx], ...updates };
    updateConfig({ sections: next });
  };

  const removeRow = (sIdx: number, rIdx: number) => {
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], rows: next[sIdx].rows.filter((_, i) => i !== rIdx) };
    updateConfig({ sections: next });
  };

  const addRow = (sIdx: number) => {
    if (totalRows >= 10) return;
    const next = [...sections];
    next[sIdx] = { ...next[sIdx], rows: [...next[sIdx].rows, { id: genId(), title: "", description: "" }] };
    updateConfig({ sections: next });
  };

  const removeSection = (sIdx: number) => {
    const next = sections.filter((_, i) => i !== sIdx);
    updateConfig({ sections: next });
  };

  const addSection = () => {
    if (sections.length >= 10) return;
    updateConfig({
      sections: [...sections, { id: genId(), title: "", rows: [{ id: genId(), title: "", description: "" }] }]
    });
  };

  // Track row handle positions: collect all row ids for handles
  let rowHandleIndex = 0;

  return (
    <div className={`rounded-lg border-2 bg-card shadow-lg w-[380px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-indigo-500/40`}>
      {/* Incoming handle (left) */}
      <Handle
        type="target" id="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">List</span>
          <span className="rounded-full bg-indigo-500/10 text-indigo-600 px-2 py-0.5 text-[10px] font-semibold">
            Message {messageIndex}
          </span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Message body */}
      <div className="px-4 pt-3 pb-2">
        <textarea
          value={messageBody}
          onChange={(e) => {
            if (e.target.value.length <= 4096) updateConfig({ message_body: e.target.value });
          }}
          placeholder="Message body (max 4096 chars)"
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">
          {messageBody.length}/4096 characters
        </p>
      </div>

      {/* Options label */}
      <div className="px-4 pb-2">
        <input
          type="text"
          value={optionsLabel}
          onChange={(e) => {
            if (e.target.value.length <= 20) updateConfig({ options_label: e.target.value });
          }}
          placeholder="Options button label (max 20)"
          className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">
          {optionsLabel.length}/20 characters
        </p>
      </div>

      {/* Section/Row counters */}
      <div className="px-4 pb-2 flex items-center gap-4">
        <span className="text-[10px] font-semibold text-muted-foreground">Sections: {sections.length}/10</span>
        <span className="text-[10px] font-semibold text-muted-foreground">Total Rows: {totalRows}/10</span>
      </div>

      {/* Sections */}
      <div className="px-4 pb-3 space-y-3">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={section.title}
                onChange={(e) => {
                  if (e.target.value.length <= 24) updateSection(sIdx, { title: e.target.value });
                }}
                placeholder={`Section ${sIdx + 1}`}
                className="flex-1 h-7 rounded border border-border bg-background px-2 text-[11px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
              />
              <span className="text-[9px] text-muted-foreground">{section.title.length}/24</span>
              <button type="button" onClick={() => removeSection(sIdx)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-rose-500 hover:bg-rose-500/10 transition">
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Rows */}
            {section.rows.map((row, rIdx) => {
              rowHandleIndex++;
              return (
                <div key={row.id} className="pl-1 space-y-1 relative">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0 cursor-grab" />
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => {
                        if (e.target.value.length <= 24) updateRow(sIdx, rIdx, { title: e.target.value });
                      }}
                      placeholder="Row title (max 24 chars)"
                      className="flex-1 h-7 rounded border border-border bg-background px-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
                    />
                    <span className="text-[9px] text-muted-foreground w-7 text-right">{row.title.length}/24</span>
                    <button type="button" onClick={() => removeRow(sIdx, rIdx)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
                      <X className="h-3 w-3" />
                    </button>
                    {/* Per-row output handle */}
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`row-${row.id}`}
                      className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-background"
                      style={{ top: "auto", position: "absolute", right: "-30px" }}
                    />
                  </div>
                  <div className="ml-5">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => {
                        if (e.target.value.length <= 72) updateRow(sIdx, rIdx, { description: e.target.value });
                      }}
                      placeholder="Row description (optional, max 72)"
                      className="w-full h-6 rounded border border-border bg-background px-2 text-[10px] text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
                    />
                  </div>
                </div>
              );
            })}

            {/* Add Row */}
            {totalRows < 10 && (
              <button type="button" onClick={() => addRow(sIdx)}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition ml-1">
                <Plus className="h-3 w-3" /> Add Row
              </button>
            )}
          </div>
        ))}

        {/* Add Section */}
        {sections.length < 10 && (
          <button
            type="button"
            onClick={addSection}
            className="w-full h-9 rounded-lg border-2 border-dashed border-border bg-transparent flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Section
          </button>
        )}
      </div>

      {/* Next Step handle */}
      <div className="px-4 pb-3 flex items-center justify-end relative">
        <span className="text-[10px] font-medium text-muted-foreground mr-2">Next Step</span>
        <Handle
          type="source"
          position={Position.Right}
          id="next_step"
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
          style={{ top: "auto", position: "absolute", right: "-6px" }}
        />
      </div>
    </div>
  );
}

export default memo(ListNode);
