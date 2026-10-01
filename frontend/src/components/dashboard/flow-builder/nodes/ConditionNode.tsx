"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { X, Filter, PlusCircle, Trash2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

type Attribute = {
  id: string;
  name: string;
};

const OPERATORS = [
  "equal", "not_equal", "contains", "not_contains", 
  "greater_than", "less_than", "is_empty", "is_not_empty"
];

const OPERATOR_LABELS: Record<string, string> = {
  equal: "Equal to",
  not_equal: "Not equal to",
  contains: "Contains",
  not_contains: "Does not contain",
  greater_than: "Greater than",
  less_than: "Less than",
  is_empty: "Is empty",
  is_not_empty: "Is not empty",
};

function ConditionNode({ data, selected }: NodeProps) {
  const config = (data.config as Record<string, any>) || {};
  const onConfigChange = data.onConfigChange as ((config: Record<string, any>) => void) | undefined;
  const onDelete = data.onDelete as (() => void) | undefined;
  const messageIndex = (data.messageIndex as number) || 1;

  const logic = config.logic || "and";
  const conditions = config.conditions || [];

  const [attributes, setAttributes] = useState<Attribute[]>([]);

  useEffect(() => {
    // In a real app this would call GET /api/attribute-definitions
    setAttributes([
      { id: "1", name: "First Name" },
      { id: "2", name: "Email Address" },
      { id: "3", name: "Phone Number" },
      { id: "4", name: "City" },
      { id: "5", name: "Age" },
    ]);

    // Ensure at least one condition row exists
    if (!config.conditions || config.conditions.length === 0) {
      if (onConfigChange) {
        onConfigChange({ 
          ...config, 
          logic: "and", 
          conditions: [{ id: `cond_${Date.now()}`, attribute_id: "", operator: "equal", value: "" }] 
        });
      }
    }
  }, []);

  const updateConfig = useCallback((updates: Record<string, any>) => {
    if (onConfigChange) onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const updateCondition = (idx: number, updates: Record<string, any>) => {
    const next = [...conditions];
    next[idx] = { ...next[idx], ...updates };
    updateConfig({ conditions: next });
  };

  const removeCondition = (idx: number) => {
    const next = conditions.filter((_: any, i: number) => i !== idx);
    updateConfig({ conditions: next });
  };

  const addCondition = () => {
    updateConfig({ 
      conditions: [...conditions, { id: `cond_${Date.now()}`, attribute_id: "", operator: "equal", value: "" }] 
    });
  };

  return (
    <div className={`rounded-xl border-2 bg-card shadow-lg w-[380px] transition-shadow ${
      selected ? "ring-2 ring-primary shadow-xl" : ""
    } border-fuchsia-500/40`}>
      <Handle type="target" position={Position.Left} id="target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600 shrink-0" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.1 1.516 5.828L0 24l6.335-1.652A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.545-5.438-1.485l-.39-.232-3.766.988.998-3.648-.254-.404A9.724 9.724 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          <span className="text-[13px] font-bold text-foreground">Condition</span>
          <span className="rounded-full bg-fuchsia-500/10 text-fuchsia-600 px-2 py-0.5 text-[10px] font-semibold">
            Message {messageIndex}
          </span>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-muted/10 rounded-b-xl space-y-4 relative">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <label className="text-[11px] font-semibold text-foreground">Continue only when these conditions are true:</label>
        </div>

        {conditions.map((cond: any, idx: number) => {
          const noValueNeeded = cond.operator === "is_empty" || cond.operator === "is_not_empty";
          return (
            <div key={cond.id} className="relative">
              <div className="flex gap-2 items-start bg-card p-3 rounded-lg border border-border shadow-sm relative z-10">
                <div className="flex-1 space-y-2">
                  <select
                    value={cond.attribute_id || ""}
                    onChange={(e) => updateCondition(idx, { attribute_id: e.target.value })}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
                  >
                    <option value="" disabled>Select an attribute</option>
                    {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select
                    value={cond.operator || "equal"}
                    onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
                  >
                    {OPERATORS.map(op => <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>)}
                  </select>
                  {!noValueNeeded && (
                    <input
                      type="text"
                      value={cond.value || ""}
                      onChange={(e) => updateCondition(idx, { value: e.target.value })}
                      placeholder="Enter a value"
                      className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
                    />
                  )}
                </div>
                {conditions.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeCondition(idx)}
                    className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Joiner Pill */}
              {idx < conditions.length - 1 && (
                <div className="flex justify-center -my-3 relative z-20">
                  <div className="w-px h-6 bg-border absolute inset-0 left-1/2 -ml-px z-0" />
                  <select
                    value={logic}
                    onChange={(e) => updateConfig({ logic: e.target.value })}
                    className="h-6 w-16 text-center appearance-none rounded-full border border-border bg-background px-2 text-[10px] font-bold uppercase text-foreground shadow-sm focus:outline-none relative z-10"
                    style={{ textAlignLast: 'center' }}
                  >
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                  </select>
                </div>
              )}
            </div>
          );
        })}

        <button 
          type="button" 
          onClick={addCondition}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-border text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add Condition
        </button>
      </div>

      {/* Next Step handles */}
      <div className="px-4 pb-4 pt-2 flex flex-col items-end space-y-3 relative">
        <div className="flex items-center relative pr-2 group">
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> When True
          </span>
          <Handle type="source" position={Position.Right} id="true" className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-background !top-1/2 !-translate-y-1/2 !right-[-8px]" />
        </div>
        <div className="flex items-center relative pr-2 group">
          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> When False
          </span>
          <Handle type="source" position={Position.Right} id="false" className="!w-3 !h-3 !bg-rose-500 !border-2 !border-background !top-1/2 !-translate-y-1/2 !right-[-8px]" />
        </div>
        <div className="flex items-center relative pr-2 group mt-4 pt-3 border-t border-border/50 w-full justify-end">
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <ArrowRight className="h-3 w-3" /> Next Step
          </span>
          <Handle type="source" position={Position.Right} id="next_step" className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background !top-auto !bottom-[6px] !right-[-8px]" />
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionNode);
