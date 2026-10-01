"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Type, Image, Volume2, List, Send, HelpCircle, FileText, CreditCard,
  Database, Tag, Sheet, ShieldCheck, Clock, Globe, GitBranch, MessageSquare, X,
} from "lucide-react";

const nodeIcons: Record<string, React.ReactNode> = {
  media: <Image className="h-4 w-4" />,
  audio: <Volume2 className="h-4 w-4" />,
  template: <Send className="h-4 w-4" />,
  ask_question: <HelpCircle className="h-4 w-4" />,
  whatsapp_form: <FileText className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  save_attribute: <Database className="h-4 w-4" />,
  add_tag: <Tag className="h-4 w-4" />,
  google_sheet: <Sheet className="h-4 w-4" />,
  meta_conversion_api: <ShieldCheck className="h-4 w-4" />,
  time_delay: <Clock className="h-4 w-4" />,
  webhook: <Globe className="h-4 w-4" />,
  condition: <GitBranch className="h-4 w-4" />,
};

const nodeLabels: Record<string, string> = {
  media: "Media",
  audio: "Audio",
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

const nodeColors: Record<string, { bg: string; text: string; border: string }> = {
  media: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/40" },
  audio: { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/40" },
  template: { bg: "bg-sky-500/10", text: "text-sky-600", border: "border-sky-500/40" },
  ask_question: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/40" },
  whatsapp_form: { bg: "bg-teal-500/10", text: "text-teal-600", border: "border-teal-500/40" },
  payment: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/40" },
  save_attribute: { bg: "bg-cyan-500/10", text: "text-cyan-600", border: "border-cyan-500/40" },
  add_tag: { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/40" },
  google_sheet: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-500/40" },
  meta_conversion_api: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/40" },
  time_delay: { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-500/40" },
  webhook: { bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-500/40" },
  condition: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-600", border: "border-fuchsia-500/40" },
};

function FlowNodeComponent({ data, selected }: NodeProps) {
  const nodeType = data.nodeType as string;
  const isCondition = nodeType === "condition";
  const isAskQuestion = nodeType === "ask_question";
  const onDelete = data.onDelete as (() => void) | undefined;
  const configSummary = data.configSummary as string | undefined;
  const colors = nodeColors[nodeType] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };

  return (
    <div
      className={`rounded-lg border-2 bg-card shadow-lg min-w-[200px] max-w-[260px] transition-shadow ${
        selected ? "ring-2 ring-primary shadow-xl" : ""
      } ${colors.border}`}
    >
      {/* Target handle (left) */}
      <Handle
        type="target" id="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
            {nodeIcons[nodeType] || <MessageSquare className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {nodeLabels[nodeType] || nodeType}
            </p>
            {configSummary && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{configSummary}</p>
            )}
          </div>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Source handle(s) */}
      {isCondition ? (
        <>
          <div className="flex justify-between px-6 pb-2">
            <div className="flex flex-col items-center relative">
              <span className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Yes</span>
              <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-background"
                style={{ position: "absolute", bottom: "-8px" }}
              />
            </div>
            <div className="flex flex-col items-center relative">
              <span className="text-[9px] font-bold text-rose-600 uppercase mb-1">No</span>
              <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                className="!w-3 !h-3 !bg-rose-500 !border-2 !border-background"
                style={{ position: "absolute", bottom: "-8px" }}
              />
            </div>
          </div>
          <div className="h-2" />
        </>
      ) : isAskQuestion ? (
        <>
          <div className="px-4 pb-3 space-y-1">
            <div className="flex items-center justify-end relative">
              <span className="text-[10px] font-medium text-muted-foreground mr-2">Reply Received</span>
              <Handle
                type="source"
                position={Position.Right}
                id="reply_received"
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-background"
                style={{ top: "auto", position: "absolute", right: "-6px" }}
              />
            </div>
            <div className="flex items-center justify-end relative">
              <span className="text-[10px] font-medium text-muted-foreground mr-2">No Reply</span>
              <Handle
                type="source"
                position={Position.Right}
                id="no_reply"
                className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
                style={{ top: "auto", position: "absolute", right: "-6px" }}
              />
            </div>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}
    </div>
  );
}

export default memo(FlowNodeComponent);
