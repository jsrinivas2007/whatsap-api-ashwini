"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Zap, AlertTriangle } from "lucide-react";

type TestStep = {
  node_id: string;
  node_type: string;
  rendered_content: string;
  action_taken?: string;
  buttons?: { id: string; text: string }[];
  list_rows?: { id: string; title: string; section_title: string }[];
  media_url?: string;
  media_type?: string;
  audio_url?: string;
};

type TestResponse = {
  steps: TestStep[];
  ended_at_node_id: string;
  reason: "completed" | "awaiting_button_selection" | "awaiting_reply" | "no_matching_trigger";
};

type ChatMessage = {
  from: "user" | "bot" | "system";
  text: string;
  buttons?: { id: string; text: string }[];
  listRows?: { id: string; title: string; section_title: string }[];
  isDryRun?: boolean;
  mediaUrl?: string;
  mediaType?: string;
  audioUrl?: string;
};

export function TestFlowSimulator({ flowId, nodes = [], onClose }: { flowId: string; nodes?: any[]; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [showMockAttrs, setShowMockAttrs] = useState(false);
  const [mockAttributes, setMockAttributes] = useState<Record<string, string>>({});
  const [newAttrKey, setNewAttrKey] = useState("4"); // default City
  const [newAttrVal, setNewAttrVal] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessages = (newMsgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...newMsgs]);
  };

  const processTestResponse = (data: TestResponse) => {
    const newMsgs: ChatMessage[] = [];

    for (const step of data.steps) {
      if (step.action_taken) {
        // Dry-run action node
        newMsgs.push({ from: "system", text: step.action_taken, isDryRun: true });
      } else if (step.rendered_content !== undefined && step.rendered_content !== null || step.media_url || step.audio_url) {
        // Message node
        const msg: ChatMessage = { from: "bot", text: step.rendered_content || "" };
        if (step.buttons && step.buttons.length > 0) {
          msg.buttons = step.buttons;
        }
        if (step.list_rows && step.list_rows.length > 0) {
          msg.listRows = step.list_rows;
        }
        if (step.media_url) {
          msg.mediaUrl = step.media_url;
          msg.mediaType = step.media_type;
        }
        if (step.audio_url) {
          msg.audioUrl = step.audio_url;
        }
        newMsgs.push(msg);
      }
    }

    addMessages(newMsgs);
    setCurrentNodeId(data.ended_at_node_id);

    if (data.reason === "no_matching_trigger") {
      addMessages([{ from: "system", text: "This message would not trigger the flow." }]);
    } else if (data.reason === "completed") {
      addMessages([{ from: "system", text: "✓ Flow completed successfully." }]);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    addMessages([{ from: "user", text }]);
    setLoading(true);

    try {
      const body: Record<string, any> = { 
        message: text,
        mock_attributes: mockAttributes
      };
      if (currentNodeId) {
        body.continue_from_node = currentNodeId;
      }

      const res = await fetch(`/api/flows/${flowId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        processTestResponse(data);
      } else {
        const err = await res.json().catch(() => ({}));
        addMessages([{ from: "system", text: err.error || "Test failed. Please check the flow configuration." }]);
      }
    } catch {
      addMessages([{ from: "system", text: "Failed to connect to the test endpoint." }]);
    }

    setLoading(false);
  };

  const handleButtonClick = async (buttonId: string, buttonText: string) => {
    if (loading || !currentNodeId) return;

    addMessages([{ from: "user", text: buttonText }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/flows/${flowId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          continue_from_node: currentNodeId,
          selected_handle: buttonId,
          mock_attributes: mockAttributes
        }),
      });

      if (res.ok) {
        processTestResponse(await res.json());
      } else {
        addMessages([{ from: "system", text: "Failed to continue test flow." }]);
      }
    } catch {
      addMessages([{ from: "system", text: "Connection error." }]);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentNodeId(null);
    setInput("");
  };

  return (
    <div className="absolute right-4 top-16 z-30 w-[400px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
          </div>
          <h4 className="text-sm font-bold text-foreground">Test Mode</h4>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowMockAttrs(!showMockAttrs)}
            className={`text-[10px] font-medium transition px-2 py-1 rounded-md ${showMockAttrs ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            Contact Attrs
          </button>
          <button type="button" onClick={handleReset}
            className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-md hover:bg-muted">
            Reset
          </button>
          <button type="button" onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mock Attributes Panel */}
      {showMockAttrs && (
        <div className="px-4 py-3 bg-muted/50 border-b border-border text-[11px]">
          <p className="font-semibold text-foreground mb-2">Simulate Contact Attributes</p>
          {Object.entries(mockAttributes).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 mb-1.5">
              <span className="font-medium min-w-[60px]">ID {k}:</span>
              <span className="flex-1 truncate">{v}</span>
              <button onClick={() => {
                const next = { ...mockAttributes };
                delete next[k];
                setMockAttributes(next);
              }} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input type="text" placeholder="Attr ID (e.g. 4)" value={newAttrKey} onChange={e => setNewAttrKey(e.target.value)} className="w-20 px-2 h-7 rounded border border-border bg-background focus:outline-none" />
            <input type="text" placeholder="Value (e.g. Mumbai)" value={newAttrVal} onChange={e => setNewAttrVal(e.target.value)} className="flex-1 px-2 h-7 rounded border border-border bg-background focus:outline-none" />
            <button onClick={() => {
              if (newAttrKey && newAttrVal) {
                setMockAttributes(prev => ({ ...prev, [newAttrKey]: newAttrVal }));
                setNewAttrVal("");
              }
            }} className="px-2 h-7 rounded bg-primary text-primary-foreground font-medium">Add</button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] bg-background/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
            <Bot className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-[12px] text-muted-foreground">
              Type a message to simulate an incoming WhatsApp message and test your flow.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.from === "user" && (
              <div className="flex items-start gap-2 justify-end">
                <div className="rounded-xl rounded-br-sm bg-primary/10 text-foreground px-3 py-2 max-w-[85%]">
                  <p className="text-[12px]">{msg.text}</p>
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-3 w-3" />
                </div>
              </div>
            )}

            {msg.from === "bot" && (
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="max-w-[85%] space-y-2">
                  <div className="rounded-xl rounded-bl-sm bg-card border border-border px-3 py-2 space-y-2 overflow-hidden">
                    {msg.mediaUrl && (
                      msg.mediaType === "video" ? (
                        <video src={msg.mediaUrl} controls className="w-full h-auto max-h-[150px] rounded object-cover" />
                      ) : msg.mediaType === "document" ? (
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block text-primary text-xs underline">View Document</a>
                      ) : (
                        <img src={msg.mediaUrl} alt="Media" className="w-full h-auto max-h-[150px] rounded object-cover" />
                      )
                    )}
                    {msg.audioUrl && (
                      <audio src={msg.audioUrl} controls className="w-full max-w-[200px]" style={{ height: '32px' }} />
                    )}
                    {msg.text && <p className="text-[12px] text-foreground whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                  {/* Interactive buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.buttons.map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleButtonClick(`btn-${btn.id}`, btn.text)}
                          disabled={loading}
                          className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition disabled:opacity-50"
                        >
                          {btn.text}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Interactive list rows */}
                  {msg.listRows && msg.listRows.length > 0 && (
                    <div className="space-y-1">
                      {msg.listRows.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => handleButtonClick(`row-${row.id}`, row.title)}
                          disabled={loading}
                          className="w-full text-left rounded-lg border border-border bg-card px-3 py-2 hover:bg-muted transition disabled:opacity-50"
                        >
                          <p className="text-[11px] font-medium text-foreground">{row.title}</p>
                          <p className="text-[9px] text-muted-foreground">{row.section_title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {msg.from === "system" && (
              <div className="flex items-center justify-center gap-2 py-1">
                {msg.isDryRun && <Zap className="h-3 w-3 text-amber-500 shrink-0" />}
                <p className={`text-[10px] font-medium ${
                  msg.isDryRun ? "text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full" : "text-muted-foreground"
                }`}>
                  {msg.text}
                </p>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Bot className="h-3 w-3" />
            </div>
            <div className="rounded-xl rounded-bl-sm bg-card border border-border px-4 py-2.5">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a test message..."
            className="flex-1 h-10 rounded-xl border border-border bg-background px-4 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
