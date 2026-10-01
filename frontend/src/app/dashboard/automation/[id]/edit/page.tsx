"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type OnConnectEnd,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, PlayCircle, CheckCircle2, Edit2, AlertTriangle, X } from "lucide-react";

import StartingStepNode from "@/components/dashboard/flow-builder/nodes/StartingStepNode";
import TextButtonNode from "@/components/dashboard/flow-builder/nodes/TextButtonNode";
import ListNode from "@/components/dashboard/flow-builder/nodes/ListNode";
import MediaNode from "@/components/dashboard/flow-builder/nodes/MediaNode";
import AudioNode from "@/components/dashboard/flow-builder/nodes/AudioNode";
import TemplateMessageNode from "@/components/dashboard/flow-builder/nodes/TemplateMessageNode";
import AskQuestionNode from "@/components/dashboard/flow-builder/nodes/AskQuestionNode";
import WhatsappFormNode from "@/components/dashboard/flow-builder/nodes/WhatsappFormNode";
import SaveAttributeNode from "@/components/dashboard/flow-builder/nodes/SaveAttributeNode";
import AddTagNode from "@/components/dashboard/flow-builder/nodes/AddTagNode";
import TimeDelayNode from "@/components/dashboard/flow-builder/nodes/TimeDelayNode";
import ConditionNode from "@/components/dashboard/flow-builder/nodes/ConditionNode";
import FlowNodeComponent from "@/components/dashboard/flow-builder/FlowNodeComponent";
import CustomEdge from "@/components/dashboard/flow-builder/CustomEdge";
import { SelectActionModal, type FlowNodeType } from "@/components/dashboard/flow-builder/SelectActionModal";
import { NodeConfigPanel } from "@/components/dashboard/flow-builder/NodeConfigPanel";
import { TestFlowSimulator } from "@/components/dashboard/flow-builder/TestFlowSimulator";

// ── Types ──
type FlowData = {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: any;
  status: string;
};

type DbNode = {
  id: string;
  flow_id: string;
  type: string;
  config: Record<string, any>;
  position_x: number;
  position_y: number;
};

type DbEdge = {
  id: string;
  flow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string | null;
};

// ── Helper: config summary ──
function getConfigSummary(type: string, config: Record<string, any>): string | undefined {
  switch (type) {
    case "text_button": return config.message ? config.message.slice(0, 30) + (config.message.length > 30 ? "..." : "") : undefined;
    case "template": return config.template_id ? `Template ID: ${config.template_id}` : undefined;
    case "time_delay": return config.duration ? `${config.duration} ${config.unit || "minutes"}` : undefined;
    case "webhook": return config.url ? config.url.slice(0, 30) + "..." : undefined;
    case "condition": return config.field ? `${config.field} ${config.operator || "?"} ${config.value || "?"}` : undefined;
    case "add_tag": return config.tag_name || undefined;
    case "save_attribute": return config.attribute_key || undefined;
    case "ask_question": return config.question ? config.question.slice(0, 30) + "..." : undefined;
    case "whatsapp_form": return config.flow_id ? `Form ID: ${config.flow_id}` : undefined;
    case "media": return config.caption ? config.caption.slice(0, 30) + "..." : undefined;
    case "audio": return config.audio_url ? "Audio attached" : undefined;
    default: return undefined;
  }
}

// ── Helper: Count message nodes of a given type ──
function countMessageNodes(nodes: Node[], targetType: string, upToId: string): number {
  let count = 0;
  for (const n of nodes) {
    if (n.data.nodeType === targetType) {
      count++;
      if (n.id === upToId) return count;
    }
  }
  return count;
}

// Specialized node types that get their own full components
const SPECIALIZED_TYPES = new Set([
  "starting_step", "text_button", "list", "media", "audio", "template",
  "ask_question", "whatsapp_form", "save_attribute", "add_tag", "time_delay", "condition"
]);

// ── Inner Builder ──
function FlowBuilderInner() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;
  const reactFlowInstance = useReactFlow();

  const [flow, setFlow] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishErrors, setPublishErrors] = useState<{nodeId: string, message: string}[]>([]);
  const [publishWarnings, setPublishWarnings] = useState<{nodeId: string, message: string}[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Select Action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    sourceId: string;
    sourceHandle?: string | null;
    position: { x: number; y: number };
  } | null>(null);

  // Config panel for generic nodes
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Config change handler (shared by all nodes via data prop) ──
  const handleNodeConfigChange = useCallback((nodeId: string, config: Record<string, any>) => {
    setNodes((nds) => nds.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, config, configSummary: getConfigSummary(n.data.nodeType as string, config) } }
        : n
    ));

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/flows/${flowId}/nodes/${nodeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });
      } catch { /* silently fail */ }
    }, 600);
  }, [flowId, setNodes]);

  // ── Delete node handler ──
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    try {
      await fetch(`/api/flows/${flowId}/nodes/${nodeId}`, { method: "DELETE" });
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    } catch { /* silently fail */ }
  }, [flowId, selectedNodeId, setNodes, setEdges]);

  // ── Delete edge handler ──
  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    try {
      await fetch(`/api/flows/${flowId}/edges/${edgeId}`, { method: "DELETE" });
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    } catch { /* silently fail */ }
  }, [flowId, setEdges]);

  // ── Listen for CustomEdge delete event ──
  useEffect(() => {
    const handleEdgeDelete = (e: CustomEvent) => {
      handleDeleteEdge(e.detail);
    };
    window.addEventListener("deleteEdge", handleEdgeDelete as EventListener);
    return () => window.removeEventListener("deleteEdge", handleEdgeDelete as EventListener);
  }, [handleDeleteEdge]);

  // ── Build nodeTypes with callbacks bound ──
  const nodeTypes = useMemo(() => ({
    startingStep: StartingStepNode,
    textButton: TextButtonNode,
    listNode: ListNode,
    mediaNode: MediaNode,
    audioNode: AudioNode,
    templateNode: TemplateMessageNode,
    askQuestionNode: AskQuestionNode,
    whatsappFormNode: WhatsappFormNode,
    saveAttributeNode: SaveAttributeNode,
    addTagNode: AddTagNode,
    timeDelayNode: TimeDelayNode,
    conditionNode: ConditionNode,
    flowNode: FlowNodeComponent,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  // ── Enrich nodes with callback data ──
  const enrichedNodes = useMemo(() => {
    return nodes.map((n) => {
      const nodeType = n.data.nodeType as string;
      const enrichedData: Record<string, any> = {
        ...n.data,
        onConfigChange: (config: Record<string, any>) => handleNodeConfigChange(n.id, config),
        onDelete: nodeType !== "starting_step" ? () => handleDeleteNode(n.id) : undefined,
      };

      // For message nodes, add messageIndex
      const MESSAGE_TYPES = ["text_button", "list", "media", "audio", "template", "ask_question", "whatsapp_form", "condition"];
      if (MESSAGE_TYPES.includes(nodeType)) {
        enrichedData.messageIndex = countMessageNodes(nodes, nodeType, n.id);
      }

      // Determine the right React Flow type key
      let rfType = "flowNode";
      if (nodeType === "starting_step") rfType = "startingStep";
      else if (nodeType === "text_button") rfType = "textButton";
      else if (nodeType === "list") rfType = "listNode";
      else if (nodeType === "media") rfType = "mediaNode";
      else if (nodeType === "audio") rfType = "audioNode";
      else if (nodeType === "template") rfType = "templateNode";
      else if (nodeType === "ask_question") rfType = "askQuestionNode";
      else if (nodeType === "whatsapp_form") rfType = "whatsappFormNode";
      else if (nodeType === "save_attribute") rfType = "saveAttributeNode";
      else if (nodeType === "add_tag") rfType = "addTagNode";
      else if (nodeType === "time_delay") rfType = "timeDelayNode";
      else if (nodeType === "condition") rfType = "conditionNode";

      return { ...n, type: rfType, data: enrichedData };
    });
  }, [nodes, handleNodeConfigChange, handleDeleteNode]);

  // ── Load flow data + nodes + edges ──
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [flowRes, nodesRes, edgesRes] = await Promise.all([
          fetch(`/api/flows/${flowId}`),
          fetch(`/api/flows/${flowId}/nodes`),
          fetch(`/api/flows/${flowId}/edges`),
        ]);

        if (flowRes.ok) {
          const f = await flowRes.json();
          setFlow(f);
          setNameInput(f.name);
        }

        let dbNodes: DbNode[] = [];
        let dbEdges: DbEdge[] = [];

        if (nodesRes.ok) dbNodes = await nodesRes.json();
        if (edgesRes.ok) dbEdges = await edgesRes.json();

        // Create starting_step if none exist
        if (!dbNodes || dbNodes.length === 0) {
          const createRes = await fetch(`/api/flows/${flowId}/nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "starting_step", config: { match_mode: "specific_keywords", keywords: [] }, position_x: 100, position_y: 200 }),
          });
          if (createRes.ok) {
            const newNode = await createRes.json();
            dbNodes = [newNode];
          }
        }

        // Convert to React Flow format
        const rfNodes: Node[] = [];
        let startingStepFound = false;

        for (const n of (dbNodes || [])) {
          if (n.type === "starting_step") {
            if (startingStepFound) {
              // Delete the duplicate on the backend asynchronously
              fetch(`/api/flows/${flowId}/nodes/${n.id}`, { method: "DELETE" }).catch(() => {});
              continue; // ignore duplicate in UI
            }
            startingStepFound = true;
          }
          rfNodes.push({
            id: n.id,
            type: "flowNode", // will be overridden by enrichedNodes
            position: { x: n.position_x, y: n.position_y },
            data: { nodeType: n.type, config: n.config, configSummary: getConfigSummary(n.type, n.config) },
          });
        }

        const rfEdges: Edge[] = (dbEdges || []).map((e) => ({
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          sourceHandle: e.source_handle || undefined,
          type: "custom",
          style: { stroke: "#1e3a8a", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#1e3a8a" },
        }));

        setNodes(rfNodes);
        setEdges(rfEdges);
      } catch (err) {
        console.error("Failed to load flow data", err);
      }
      setLoading(false);
    };

    loadAll();
  }, [flowId]);

  // ── Save node position on drag end ──
  const handleNodeDragStop = useCallback(async (_: any, node: Node) => {
    try {
      await fetch(`/api/flows/${flowId}/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position_x: node.position.x, position_y: node.position.y }),
      });
    } catch { /* silently fail */ }
  }, [flowId]);

  // ── Connect to existing node — enforce single-outgoing-edge-per-handle ──
  const onConnect = useCallback(async (connection: Connection) => {
    const sourceHandle = connection.sourceHandle || null;

    // Remove any existing edge from this source handle (single-outgoing rule)
    const existingEdge = edges.find(
      (e) => e.source === connection.source && e.sourceHandle === (sourceHandle || undefined)
    );
    if (existingEdge) {
      try {
        await fetch(`/api/flows/${flowId}/edges/${existingEdge.id}`, { method: "DELETE" });
        setEdges((eds) => eds.filter((e) => e.id !== existingEdge.id));
      } catch { /* silently fail */ }
    }

    // Add visual edge immediately for snappy UX
    const tempEdge: Edge = {
      id: `temp-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "custom",
      animated: true,
      style: { stroke: "#1e3a8a", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#1e3a8a" },
    };
    setEdges((eds) => addEdge(tempEdge, eds));

    try {
      const res = await fetch(`/api/flows/${flowId}/edges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_node_id: connection.source,
          target_node_id: connection.target,
          source_handle: sourceHandle,
        }),
      });
      if (res.ok) {
        const dbEdge = await res.json();
        // Replace temp edge with real edge
        setEdges((eds) =>
          eds.map((e) =>
            e.id === tempEdge.id
              ? { ...e, id: dbEdge.id, sourceHandle: dbEdge.source_handle || undefined }
              : e
          )
        );
      } else {
        // Revert on failure
        setEdges((eds) => eds.filter((e) => e.id !== tempEdge.id));
      }
    } catch {
      setEdges((eds) => eds.filter((e) => e.id !== tempEdge.id));
    }
  }, [flowId, edges, setEdges]);

  // ── Drag from handle to empty canvas → open Select Action ──
  const onConnectEnd: OnConnectEnd = useCallback((event, connectionState) => {
    // Robust xyflow connection state check
    const fromNodeId = connectionState?.fromNode?.id || (connectionState as any)?.fromNodeId;
    const isValid = connectionState?.isValid;

    if (connectionState && !isValid && fromNodeId) {
      const clientEvent = event as MouseEvent | TouchEvent;
      const clientX = 'clientX' in clientEvent ? clientEvent.clientX : (clientEvent as TouchEvent).touches?.[0]?.clientX || 0;
      const clientY = 'clientY' in clientEvent ? clientEvent.clientY : (clientEvent as TouchEvent).touches?.[0]?.clientY || 0;

      const canvasPos = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
      setPendingConnection({
        sourceId: fromNodeId,
        sourceHandle: connectionState.fromHandle?.id || null,
        position: canvasPos,
      });
      setShowActionModal(true);
    }
  }, [reactFlowInstance]);

  // ── Handle action selected from modal ──
  const handleActionSelected = useCallback(async (nodeType: FlowNodeType) => {
    if (!pendingConnection) return;

    // Remove any existing edge from the source handle (single-outgoing rule)
    const existingEdge = edges.find(
      (e) => e.source === pendingConnection.sourceId && e.sourceHandle === (pendingConnection.sourceHandle || undefined)
    );
    if (existingEdge) {
      try {
        await fetch(`/api/flows/${flowId}/edges/${existingEdge.id}`, { method: "DELETE" });
        setEdges((eds) => eds.filter((e) => e.id !== existingEdge.id));
      } catch { /* silently fail */ }
    }

    try {
      // Create the new node
      const defaultConfig: Record<string, any> = {};
      if (nodeType === "text_button") {
        defaultConfig.message = "";
        defaultConfig.button_mode = "reply_buttons";
        defaultConfig.buttons = [];
      } else if (nodeType === "list") {
        defaultConfig.message_body = "";
        defaultConfig.options_label = "";
        defaultConfig.sections = [];
      }

      const nodeRes = await fetch(`/api/flows/${flowId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: nodeType,
          config: defaultConfig,
          position_x: pendingConnection.position.x,
          position_y: pendingConnection.position.y,
        }),
      });

      if (!nodeRes.ok) return;
      const newDbNode: DbNode = await nodeRes.json();

      // Create the edge
      const edgeRes = await fetch(`/api/flows/${flowId}/edges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_node_id: pendingConnection.sourceId,
          target_node_id: newDbNode.id,
          source_handle: pendingConnection.sourceHandle || null,
        }),
      });

      // Add to React Flow state
      const rfNode: Node = {
        id: newDbNode.id,
        type: "flowNode",
        position: { x: newDbNode.position_x, y: newDbNode.position_y },
        data: { nodeType: newDbNode.type, config: newDbNode.config, configSummary: undefined },
      };
      setNodes((nds) => [...nds, rfNode]);

      if (edgeRes.ok) {
        const dbEdge = await edgeRes.json();
        const rfEdge: Edge = {
          id: dbEdge.id,
          source: dbEdge.source_node_id,
          target: dbEdge.target_node_id,
          sourceHandle: dbEdge.source_handle || undefined,
          type: "custom",
          animated: true,
          style: { stroke: "#1e3a8a", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#1e3a8a" },
        };
        setEdges((eds) => [...eds, rfEdge]);
      }
    } catch (err) {
      console.error("Failed to create node", err);
    }

    setPendingConnection(null);
  }, [flowId, pendingConnection, edges, setNodes, setEdges]);

  // ── Keyboard delete ──
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't intercept if user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "Delete" || e.key === "Backspace") {
      const selectedNodes = nodes.filter((n) => n.selected && n.data.nodeType !== "starting_step");
      const selectedEdges = edges.filter((edge) => edge.selected);
      selectedNodes.forEach((n) => handleDeleteNode(n.id));
      selectedEdges.forEach((edge) => handleDeleteEdge(edge.id));
    }
  }, [nodes, edges, handleDeleteNode, handleDeleteEdge]);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // ── Node click → open config panel for generic nodes ──
  const onNodeClick = useCallback((_: any, node: Node) => {
    const nodeType = node.data.nodeType as string;
    // Specialized nodes handle their own config inline
    if (SPECIALIZED_TYPES.has(nodeType)) {
      setSelectedNodeId(null);
      return;
    }
    setSelectedNodeId(node.id);
  }, []);

  // ── Save name ──
  const handleSaveName = async () => {
    if (!nameInput.trim() || !flow) return;
    setEditingName(false);
    setFlow({ ...flow, name: nameInput.trim() });
    try {
      await fetch(`/api/flows/${flowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
    } catch { /* silently fail */ }
  };

  // ── Publish ──
  const handlePublish = async (force: boolean = false) => {
    setPublishError("");
    setPublishing(true);
    if (!force) {
      setPublishErrors([]);
      setPublishWarnings([]);
    }
    try {
      const res = await fetch(`/api/flows/${flowId}/publish`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.errors || data.warnings) {
          setPublishErrors(data.errors || []);
          setPublishWarnings(data.warnings || []);
          setShowPublishModal(true);
        } else {
          setPublishError(data.error || "Failed to publish flow");
        }
        setPublishing(false);
        return;
      }
      
      if (data.needsConfirmation) {
        setPublishWarnings(data.warnings || []);
        setShowPublishModal(true);
        setPublishing(false);
        return;
      }

      setShowPublishModal(false);
      notify("Flow published successfully!");
      setTimeout(() => router.push("/dashboard/automation"), 600);
    } catch {
      setPublishError("Failed to publish flow. Please try again.");
    }
    setPublishing(false);
  };

  // ── Selected node for config panel ──
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Flow not found</p>
        <button onClick={() => router.push("/dashboard/automation")} className="text-sm font-medium text-primary hover:underline">Back to Automation Flows</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {toast && (
        <div className="fixed right-6 top-6 z-[80] rounded-[8px] bg-foreground px-4 py-3 text-[12px] font-medium text-background shadow-lg">{toast}</div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push("/dashboard/automation")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" />
          </button>
          {editingName ? (
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveName} onKeyDown={(e) => e.key === "Enter" && handleSaveName()} autoFocus
              className="h-8 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
          ) : (
            <button type="button" onClick={() => setEditingName(true)} className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition">
              {flow.name} <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {publishError && <p className="text-[12px] text-rose-500 font-medium max-w-xs truncate">{publishError}</p>}
          <button type="button" onClick={() => setShowTestPanel(!showTestPanel)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-[12px] font-medium text-foreground hover:bg-muted transition">
            <PlayCircle className="h-4 w-4" /> Test Flow
          </button>
          <button type="button" onClick={() => handlePublish(false)} disabled={publishing}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" /> Publish Flow
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        {showTestPanel && <TestFlowSimulator flowId={flowId} nodes={nodes} onClose={() => setShowTestPanel(false)} />}

        {/* Config panel for generic (non-specialized) nodes */}
        {selectedNode && (
          <div className="absolute right-4 top-4 z-20">
            <NodeConfigPanel
              nodeId={selectedNode.id}
              nodeType={selectedNode.data.nodeType as FlowNodeType}
              config={(selectedNode.data.config as Record<string, any>) || {}}
              onConfigChange={(config) => handleNodeConfigChange(selectedNode.id, config)}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}

        <ReactFlow
          nodes={enrichedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeDragStop={handleNodeDragStop}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          deleteKeyCode={["Delete", "Backspace"]}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "custom",
            animated: true,
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
            interactionWidth: 20, // Easier to grab
            deletable: true // Allow deleting edges by selecting and hitting backspace/delete
          }}
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--border)" />
          <MiniMap
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }}
            maskColor="rgba(0,0,0,0.1)"
          />
          <Controls style={{ borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden" }} />
        </ReactFlow>
      </div>

      {/* Publish Validation Modal */}
      {showPublishModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
          <div className="w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Publish Validation</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {publishErrors.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-rose-500 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Blocking Errors
                </h4>
                <ul className="space-y-2">
                  {publishErrors.map((err, i) => (
                    <li key={i} className="text-[12px] bg-rose-500/10 text-rose-600 px-3 py-2 rounded-lg cursor-pointer hover:bg-rose-500/20 transition border border-rose-500/20"
                        onClick={() => {
                          const node = nodes.find(n => n.id === err.nodeId);
                          if (node) {
                            reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1, duration: 800 });
                            setSelectedNodeId(node.id);
                            setShowPublishModal(false);
                          }
                        }}>
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {publishWarnings.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Warnings
                </h4>
                <ul className="space-y-2">
                  {publishWarnings.map((warn, i) => (
                    <li key={i} className="text-[12px] bg-amber-500/10 text-amber-600 px-3 py-2 rounded-lg cursor-pointer hover:bg-amber-500/20 transition border border-amber-500/20"
                        onClick={() => {
                          const node = nodes.find(n => n.id === warn.nodeId);
                          if (node) {
                            reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1, duration: 800 });
                            setSelectedNodeId(node.id);
                            setShowPublishModal(false);
                          }
                        }}>
                      {warn.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition border border-border">
                Cancel
              </button>
              {publishErrors.length === 0 && (
                <button onClick={() => handlePublish(true)} disabled={publishing} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition disabled:opacity-50">
                  {publishing ? "Publishing..." : "Publish Anyway"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Action Modal */}
      <SelectActionModal
        open={showActionModal}
        onClose={() => { setShowActionModal(false); setPendingConnection(null); }}
        onSelect={handleActionSelected}
      />
    </div>
  );
}

// ── Wrapper ──
export default function FlowBuilderPage() {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner />
    </ReactFlowProvider>
  );
}
