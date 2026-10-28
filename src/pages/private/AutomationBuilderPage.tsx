import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ChangeEvent,
} from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  GitBranch,
  Mail,
  MessageSquare,
  Save,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import {
  createAutomation,
  getAutomation,
  getCampaigns,
  getTemplates,
  getChannelLabel,
  saveAutomation,
  type Automation,
  type AutomationChannel,
  type AutomationNode,
  type AutomationNodeData,
  type Campaign,
  type Template,
} from "./automationApi";

type BuilderNodeType =
  | "email"
  | "sms"
  | "wait"
  | "condition"
  | "end";

type WorkflowNode = {
  id: string;
  data: AutomationNodeData;
};

const NODE_WIDTH = 390;
const NODE_HEIGHT = 126;
const NODE_GAP = 74;

const nodePalette: {
  type: BuilderNodeType;
  label: string;
  icon: typeof Mail;
}[] = [
  {
    type: "email",
    label: "Send Email",
    icon: Mail,
  },
  {
    type: "sms",
    label: "Send SMS",
    icon: MessageSquare,
  },
  {
    type: "wait",
    label: "Wait",
    icon: Timer,
  },
  {
    type: "end",
    label: "End",
    icon: X,
  },
];

function nodeTitle(
  nodeType: BuilderNodeType | "trigger",
): string {
  switch (nodeType) {
    case "trigger":
      return "Campaign Trigger";
    case "email":
      return "Send Email";
    case "sms":
      return "Send SMS";
    case "wait":
      return "Wait";
    case "condition":
      return "Condition";
    case "end":
      return "End";
  }
}

function getNodeIcon(
  nodeType: AutomationNodeData["nodeType"],
): typeof Mail {
  switch (nodeType) {
    case "trigger":
      return Sparkles;
    case "email":
      return Mail;
    case "sms":
      return MessageSquare;
    case "wait":
      return Timer;
    case "condition":
      return GitBranch;
    case "end":
      return X;
  }
  return X;
}

function getWaitSummary(config: Record<string, string> | undefined) {
  if (!config) return "2 days";
  if (config.targetDate) return `Until ${new Date(config.targetDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`;
  return `${config.durationAmount || 2} ${config.durationUnit || 'days'}`;
}

type WorkflowCardProps = {
  node: WorkflowNode;
  index: number;
  isDragging: boolean;
  isSelected: boolean;
  onPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    nodeId: string,
  ) => void;
  onClick: (
    nodeId: string,
  ) => void;
};

function WorkflowCard({
  node,
  index,
  isDragging,
  isSelected,
  onPointerDown,
  onClick,
}: WorkflowCardProps) {
  const Icon = getNodeIcon(node.data.nodeType);
  const isTrigger = node.data.nodeType === "trigger";
  const isEnd = node.data.nodeType === "end";

  return (
    <div
      onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
        if (isTrigger) return;
        onPointerDown(event, node.id);
      }}
      onClick={() => onClick(node.id)}
      className={[
        "absolute left-1/2 w-[min(390px,calc(100vw-48px))] -translate-x-1/2 select-none touch-none",
        "rounded-[24px] border bg-white px-5 py-4",
        "shadow-[0_18px_50px_rgba(0,0,0,0.09)]",
        "dark:bg-[#181818]",
        "transition-[box-shadow,border-color,transform]",
        "duration-150",
        isDragging
          ? "z-50 cursor-grabbing scale-[1.025] shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
          : isTrigger
            ? "cursor-default"
            : "cursor-grab hover:shadow-[0_22px_60px_rgba(0,0,0,0.12)]",
        isSelected
          ? "border-neutral-950 ring-2 ring-neutral-950/10 dark:border-white dark:ring-white/10"
          : "border-neutral-200 dark:border-white/10",
        isTrigger ? "border-dashed" : "",
      ].join(" ")}
      style={{
        height: NODE_HEIGHT,
      }}
    >
      {!isTrigger && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f4f0e8] bg-neutral-300 dark:border-[#0d0d0d] dark:bg-neutral-700"
        />
      )}

      {!isEnd && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-[#f4f0e8] bg-neutral-300 dark:border-[#0d0d0d] dark:bg-neutral-700"
        />
      )}

      <div className="flex h-full items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            {isTrigger ? "Start" : node.data.nodeType}
          </div>

          <div className="mt-1 truncate text-[18px] font-semibold tracking-tight text-neutral-950 dark:text-white">
            {node.data.label}
          </div>

          {node.data.config?.templateName && (
            <div className="mt-2 truncate rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[10px] font-medium text-neutral-500 dark:bg-white/[0.05] dark:text-neutral-400">
              {node.data.config.templateName}
            </div>
          )}

          {node.data.nodeType === "wait" && (
            <div className="mt-2 text-[10px] text-neutral-400">
              {getWaitSummary(node.data.config)}
            </div>
          )}

          {node.data.nodeType === "condition" && node.data.config?.condition && (
            <div className="mt-2 text-[10px] text-neutral-400">
              {node.data.config.condition}
            </div>
          )}
        </div>

        {!isTrigger && !isEnd && (
          <div className="shrink-0 text-[10px] font-medium text-neutral-300 dark:text-neutral-600">
            {index}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowConnector({ top }: { top: number }) {
  return (
    <svg
      className="pointer-events-none absolute left-0 z-0 h-[74px] w-full overflow-visible"
      style={{ top }}
      viewBox="0 0 100 74"
      preserveAspectRatio="none"
    >
      <path
        d="M 50 0 C 50 18, 50 56, 50 74"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        className="text-neutral-300 dark:text-neutral-700"
      />
    </svg>
  );
}

export function AutomationBuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { automationId } = useParams();

  const reuseId = new URLSearchParams(location.search).get("reuse");

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const workflowRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dragRef = useRef<{
    nodeId: string;
    startY: number;
    currentY: number;
    startIndex: number;
    currentIndex: number;
  } | null>(null);

  const workflowNodesRef = useRef<WorkflowNode[]>([]);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [name, setName] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reuseSource, setReuseSource] = useState<Automation | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [savedMessage, setSavedMessage] = useState("");
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>(() => {
    const saved = localStorage.getItem("detrosys_plan");
    return saved && saved !== "none" ? saved : "free";
  });

  useEffect(() => {
    let cancelled = false;

    const loadPlan = async () => {
      try {
        const token = localStorage.getItem("detrosys_access_token");
        const apiBase = (
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
        ).replace(/\/$/, "");

        const res = await fetch(`${apiBase}/billing/status`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          let raw = data?.plan || data?.plan_slug;
          if (typeof raw === "object" && raw !== null) {
            raw = (raw as any).slug || (raw as any).name;
          }
          const val = String(raw || "free").toLowerCase().trim();
          let resolved = "free";
          if (val.includes("adv")) resolved = "advanced";
          else if (val.includes("pro")) resolved = "pro";
          else if (val.includes("basic")) resolved = "basic";
          else if (val === "none") resolved = "none";

          if (!cancelled) {
            setCurrentPlanSlug(resolved);
            localStorage.setItem("detrosys_plan", resolved);
          }
        }
      } catch {}
    };

    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFreePlan = currentPlanSlug === "free" || currentPlanSlug === "none";
  const allowsConditions =
    currentPlanSlug === "pro" || currentPlanSlug === "advanced";

  const templatedNodesCount = useMemo(() => {
    return workflowNodes.filter(
      (n) =>
        (n.data.nodeType === "email" || n.data.nodeType === "sms") &&
        Boolean(n.data.config?.templateId),
    ).length;
  }, [workflowNodes]);

  const channelAllowsWithPlan = (
    channel: AutomationChannel,
    nodeType: BuilderNodeType,
  ): boolean => {
    if (currentPlanSlug === "none") return false;
    if (nodeType === "condition" && !allowsConditions) return false;
    if (nodeType === "sms" && isFreePlan) return false;

    if (nodeType === "email") {
      return channel === "email" || channel === "email_sms";
    }

    if (nodeType === "sms") {
      return channel === "sms" || channel === "email_sms";
    }

    return true;
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingData(true);
      setErrorMessage("");
      try {
        const [loadedCampaigns, loadedTemplates] = await Promise.all([
          getCampaigns(),
          getTemplates(),
        ]);
        if (cancelled) return;
        setCampaigns(loadedCampaigns);
        setTemplates(loadedTemplates);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load automation data.",
          );
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    workflowNodesRef.current = workflowNodes;
  }, [workflowNodes]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (automationId) {
          const existing = await getAutomation(automationId);
          if (cancelled) return;
          setAutomation(existing);
          const loadedCampaign = campaigns.find(
            (item) => item.id === existing.campaignId,
          );
          setCampaign(
            loadedCampaign ?? {
              id: existing.campaignId || "",
              name: existing.campaignName,
              channel: existing.channel,
              status: "draft",
            },
          );
          setName(existing.name);
          return;
        }

        if (reuseId) {
          const source = await getAutomation(reuseId);
          if (cancelled) return;
          setAutomation(null);
          setReuseSource(source);
          const sourceCampaign = campaigns.find(
            (item) => item.id === source.campaignId,
          );
          setCampaign(
            sourceCampaign ?? {
              id: source.campaignId || "",
              name: source.campaignName,
              channel: source.channel,
              status: "draft",
            },
          );
          setName(`${source.name} — Reuse`);
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load automation.",
          );
        }
      }
    };

    if (!loadingData && campaigns.length > 0) {
      void load();
    }

    return () => {
      cancelled = true;
    };
  }, [automationId, reuseId, loadingData, campaigns]);

  useEffect(() => {
    if (!automation) return;

    const sorted = [...automation.nodes].sort(
      (a: AutomationNode, b: AutomationNode) => {
        if (a.data.nodeType === "trigger") return -1;
        if (b.data.nodeType === "trigger") return 1;
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        return a.position.x - b.position.x;
      },
    );

    setWorkflowNodes(
      sorted.map((node: WorkflowNode) => ({
        id: node.id,
        data: { ...node.data },
      })),
    );
  }, [automation]);

  const selectedNode = useMemo(
    () =>
      workflowNodes.find((node: WorkflowNode) => node.id === selectedNodeId) ??
      null,
    [workflowNodes, selectedNodeId],
  );

  const isAnotherNodeTemplated = useMemo(() => {
    if (!selectedNodeId) return false;
    return workflowNodes.some(
      (n) =>
        n.id !== selectedNodeId &&
        (n.data.nodeType === "email" || n.data.nodeType === "sms") &&
        Boolean(n.data.config?.templateId),
    );
  }, [workflowNodes, selectedNodeId]);

  const availableTemplates = useMemo(() => {
    if (!campaign) return templates;
    if (campaign.channel === "email_sms") return templates;
    return templates.filter(
      (template: Template) => template.channel === campaign.channel,
    );
  }, [campaign, templates]);

  const nodeTop = useCallback(
    (index: number) => index * (NODE_HEIGHT + NODE_GAP),
    [],
  );

  const workflowHeight = Math.max(
    560,
    workflowNodes.length * (NODE_HEIGHT + NODE_GAP),
  );

  const reorderNode = useCallback((nodeId: string, targetIndex: number) => {
    const current = workflowNodesRef.current;
    const currentIndex = current.findIndex(
      (node: WorkflowNode) => node.id === nodeId,
    );
    if (currentIndex <= 0) return currentIndex;

    const clampedIndex = Math.max(1, Math.min(targetIndex, current.length - 1));
    if (currentIndex === clampedIndex) return currentIndex;

    const next = [...current];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(clampedIndex, 0, moved);

    workflowNodesRef.current = next;
    setWorkflowNodes(next);
    return clampedIndex;
  }, []);

  const finishDrag = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    dragRef.current = null;
    setDraggingNodeId(null);
    setDragOffsetY(0);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent): void => {
      const drag = dragRef.current;
      if (!drag) return;

      drag.currentY = event.clientY;
      if (animationFrameRef.current !== null) return;

      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;
        const current = dragRef.current;
        if (!current) return;

        const deltaY = current.currentY - current.startY;
        setDragOffsetY(deltaY);

        const slotHeight = NODE_HEIGHT + NODE_GAP;
        const rawIndex = current.currentIndex + Math.round(deltaY / slotHeight);
        const nodes = workflowNodesRef.current;
        const targetIndex = Math.max(1, Math.min(nodes.length - 1, rawIndex));

        if (targetIndex === current.currentIndex) return;

        const newIndex = reorderNode(current.nodeId, targetIndex);
        if (newIndex >= 1) {
          current.currentIndex = newIndex;
          current.startIndex = newIndex;
          current.startY = current.currentY;
          setDragOffsetY(0);
        }
      });
    },
    [reorderNode],
  );

  const handlePointerUp = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  useEffect(() => {
    if (!draggingNodeId) return;

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingNodeId, handlePointerMove, handlePointerUp]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, nodeId: string) => {
      if (event.button !== 0) return;

      const index = workflowNodesRef.current.findIndex(
        (node: WorkflowNode) => node.id === nodeId,
      );
      if (index <= 0) return;

      event.preventDefault();
      event.stopPropagation();

      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

      dragRef.current = {
        nodeId,
        startY: event.clientY,
        currentY: event.clientY,
        startIndex: index,
        currentIndex: index,
      };

      setDraggingNodeId(nodeId);
    },
    [],
  );

  const deleteNode = useCallback((id: string) => {
    setWorkflowNodes((current: WorkflowNode[]) =>
      current.filter((node: WorkflowNode) => node.id !== id),
    );
    setSelectedNodeId(null);
  }, []);

  const addNode = (nodeType: BuilderNodeType) => {
    if (!campaign) return;
    if (!channelAllowsWithPlan(campaign.channel, nodeType)) return;

    const id = `${nodeType}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const newNode: WorkflowNode = {
      id,
      data: {
        label: nodeTitle(nodeType),
        nodeType,
      },
    };

    setWorkflowNodes((current: WorkflowNode[]) => [...current, newNode]);
    setSelectedNodeId(id);

    window.setTimeout(() => {
      const element = document.querySelector(`[data-workflow-node="${id}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const updateSelectedNode = (patch: Partial<AutomationNodeData>) => {
    if (!selectedNodeId) return;

    setWorkflowNodes((current: WorkflowNode[]) =>
      current.map((node: WorkflowNode) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...patch,
              },
            }
          : node,
      ),
    );
  };

  const startNewAutomation = () => {
    if (!campaign) return;

    setErrorMessage("");

    const initialNodes: AutomationNode[] = reuseSource
      ? reuseSource.nodes
      : [
          {
            id: `trigger-new`,
            type: "automation",
            position: { x: 0, y: -1 },
            data: { label: "Campaign Trigger", nodeType: "trigger" },
          },
        ];

    const draftAutomation: Automation = {
      id: "new",
      name: name.trim() || `${campaign.name} Automation`,
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: campaign.channel,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: initialNodes,
      edges: [],
    };

    setAutomation(draftAutomation);
    setWorkflowNodes(
      initialNodes.map((node) => ({
        id: node.id,
        data: { ...node.data },
      })),
    );
  };

  const save = async () => {
    if (!automation || !campaign || isSaving) return;

    if (workflowNodes.filter((n) => n.data.nodeType !== "trigger").length === 0) {
      setErrorMessage("Automation flow cannot be empty.");
      return;
    }

    const untemplatedMessageNode = workflowNodes.find(
      (n) =>
        (n.data.nodeType === "email" || n.data.nodeType === "sms") &&
        !n.data.config?.templateId,
    );

    if (untemplatedMessageNode) {
      setErrorMessage(
        `Please select a template for "${untemplatedMessageNode.data.label}" or delete the node before saving.`,
      );
      return;
    }

    if (isFreePlan && templatedNodesCount > 1) {
      setErrorMessage(
        "Free Sandbox is limited to 1 template per workflow. Upgrade to Basic or higher for unlimited workflow steps.",
      );
      return;
    }

    setIsSaving(true);
    try {
      setErrorMessage("");

      const backendWorkflowNodes: AutomationNode[] = workflowNodes.map(
        (node: WorkflowNode, index: number) => ({
          id: node.id,
          type: "automation",
          position: {
            x: 0,
            y: nodeTop(index),
          },
          data: {
            label: node.data.label,
            nodeType: node.data.nodeType,
            config: node.data.config,
          },
        }),
      );

      let targetAutomation = automation;

      if (automation.id === "new" || !automationId) {
        const created = await createAutomation(
          campaign,
          name.trim() || `${campaign.name} Automation`,
        );
        targetAutomation = created;
      }

      const updated: Automation = {
        ...targetAutomation,
        name: name.trim() || targetAutomation.name,
        campaignId: campaign.id,
        campaignName: campaign.name,
        channel: campaign.channel,
        status: targetAutomation.status,
        updatedAt: new Date().toISOString(),
        nodes: backendWorkflowNodes,
        edges: [],
      };

      await saveAutomation(updated, backendWorkflowNodes);
      setSavedMessage("Saved");

      navigate("/app/automations");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save automation.",
      );
      setIsSaving(false);
    }
  };

  if (!campaign && !automation) {
    return (
      <main className="fixed inset-0 z-[60] overflow-y-auto bg-[#f4f0e8] px-5 pb-32 pt-10 text-neutral-950 dark:bg-[#0d0d0d] dark:text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => navigate("/app/automations")}
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Automations
          </button>

          <div className="rounded-[32px] border border-neutral-200 bg-white/70 p-7 shadow-[0_20px_70px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#151515] sm:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              New automation
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Start with the campaign.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Choose the campaign first. Its channel controls which communication
              nodes can be used.
            </p>

            {errorMessage && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-400/20 dark:bg-red-500/[0.06] dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {loadingData ? (
              <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-400 dark:border-white/10 dark:bg-[#1a1a1a]">
                Loading campaigns...
              </div>
            ) : (
              <div className="mt-8 grid gap-3">
                {campaigns.map((item: Campaign) => {
                  const isBlocked = isFreePlan && item.channel !== "email";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => !isBlocked && setCampaign(item)}
                      className={[
                        "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition",
                        isBlocked
                          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 opacity-40 dark:border-white/[0.05] dark:bg-white/[0.02]"
                          : "border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-neutral-400 dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-white/25",
                      ].join(" ")}
                    >
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="mt-1 text-xs text-neutral-400">
                          {getChannelLabel(item.channel)} · {item.status}
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-neutral-400">
                        {isBlocked ? "Unavailable on Free" : "Select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (campaign && !automation) {
    return (
      <main className="fixed inset-0 z-[60] overflow-y-auto bg-[#f4f0e8] px-5 pb-32 pt-10 text-neutral-950 dark:bg-[#0d0d0d] dark:text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => navigate("/app/automations")}
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Automations
          </button>

          <div className="rounded-[32px] border border-neutral-200 bg-white/70 p-7 shadow-[0_20px_70px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#151515] sm:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Campaign selected
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Name your automation.
            </h1>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-neutral-950 px-3 py-1.5 !text-white dark:bg-white dark:!text-neutral-950">
                {campaign.name}
              </span>
              <span className="rounded-full bg-neutral-950/[0.06] px-3 py-1.5 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-300">
                {getChannelLabel(campaign.channel)}
              </span>
            </div>

            <input
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
              placeholder={`${campaign.name} Automation`}
              className="mt-8 h-13 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-[#1a1a1a] dark:focus:border-white/25"
            />

            <button
              type="button"
              onClick={startNewAutomation}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold !text-white dark:bg-white dark:!text-neutral-950 sm:w-auto"
            >
              <Sparkles size={16} />
              Open Builder
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!automation || !campaign) return null;

  return (
    <main className="fixed inset-0 z-[60] h-screen w-screen overflow-hidden bg-[#f4f0e8] text-neutral-950 dark:bg-[#0d0d0d] dark:text-white">
      {errorMessage && (
        <div className="absolute left-1/2 top-3 z-[100] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 shadow-lg dark:border-red-400/20 dark:bg-red-500/[0.06] dark:text-red-300">
          {errorMessage}
        </div>
      )}
      <header className="flex h-[72px] items-center justify-between border-b border-neutral-200/80 bg-[#f4f0e8]/90 px-4 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0d0d0d]/90 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/app/automations")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 dark:border-white/10"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0">
            <input
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
              className="max-w-[260px] bg-transparent text-sm font-semibold outline-none"
            />
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
              {campaign.name} · {getChannelLabel(campaign.channel)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedMessage && (
            <span className="hidden items-center gap-1 text-xs text-emerald-600 sm:flex">
              <Check size={14} />
              {savedMessage}
            </span>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => void save()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-xs font-semibold !text-white dark:bg-white dark:!text-neutral-950 disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-72px)] grid-cols-[minmax(0,1fr)_300px]">
        <section
          ref={canvasRef}
          className="relative min-w-0 overflow-y-auto overflow-x-hidden bg-[#f4f0e8] dark:bg-[#0d0d0d]"
        >
          <div className="absolute left-4 top-4 z-40 hidden w-[210px] rounded-2xl border border-neutral-200 bg-[#f4f0e8]/95 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111]/95 lg:block">
            <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Add node
            </div>

            <div className="space-y-2">
              {nodePalette.map((item) => {
                const Icon = item.icon;
                const allowed = channelAllowsWithPlan(
                  campaign.channel,
                  item.type,
                );

                return (
                  <button
                    key={item.type}
                    type="button"
                    disabled={!allowed}
                    onClick={() => addNode(item.type)}
                    className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left text-xs font-semibold transition hover:-translate-y-0.5 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-white/25"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-950 !text-white dark:bg-white dark:!text-neutral-950">
                      <Icon size={13} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={workflowRef}
            className="relative mx-auto mt-16 w-full max-w-[720px]"
            style={{
              height: workflowHeight + 120,
            }}
          >
            {workflowNodes.slice(0, -1).map((_node, index) => {
              const top = nodeTop(index) + NODE_HEIGHT;
              return (
                <WorkflowConnector key={`connector-${index}`} top={top} />
              );
            })}

            {workflowNodes.map((node, index) => {
              const isDragging = draggingNodeId === node.id;
              const isTrigger = node.data.nodeType === "trigger";

              let translateY = nodeTop(index);
              if (isDragging) translateY += dragOffsetY;

              return (
                <div
                  key={node.id}
                  data-workflow-node={node.id}
                  className="absolute inset-x-0"
                  style={{
                    transform: `translate3d(0, ${translateY}px, 0)`,
                    transition: isDragging
                      ? "none"
                      : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                    zIndex: isDragging ? 30 : isTrigger ? 20 : 10,
                  }}
                >
                  <WorkflowCard
                    node={node}
                    index={index}
                    isDragging={isDragging}
                    isSelected={selectedNodeId === node.id}
                    onPointerDown={handlePointerDown}
                    onClick={(nodeId) => setSelectedNodeId(nodeId)}
                  />
                </div>
              );
            })}

            {workflowNodes.length === 1 && (
              <div
                className="absolute left-1/2 top-[240px] -translate-x-1/2 text-center"
                style={{ width: NODE_WIDTH }}
              >
                <div className="text-sm font-medium text-neutral-400">
                  Add a node to continue the workflow
                </div>
                <div className="mt-2 text-xs text-neutral-400/70">
                  New nodes will automatically appear below the previous step.
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="hidden overflow-y-auto border-l border-neutral-200/80 bg-[#f4f0e8]/90 p-5 dark:border-white/[0.08] dark:bg-[#111111] md:block">
          {selectedNode ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Configure node
              </div>

              <h2 className="mt-3 text-xl font-semibold">
                {selectedNode.data.label}
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                {selectedNode.data.nodeType}
              </p>

              {(selectedNode.data.nodeType === "email" ||
                selectedNode.data.nodeType === "sms") && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold">
                      {selectedNode.data.nodeType === "email" ? "Email" : "SMS"}{" "}
                      template
                    </label>
                    {isFreePlan && isAnotherNodeTemplated && (
                      <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        1 template cap
                      </span>
                    )}
                  </div>

                  <select
                    disabled={isFreePlan && isAnotherNodeTemplated}
                    value={selectedNode.data.config?.templateId ?? ""}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                      const template = availableTemplates.find(
                        (item) => item.id === event.target.value,
                      );

                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          templateId: template?.id ?? "",
                          templateName: template?.name ?? "",
                        },
                      });
                    }}
                    className={[
                      "mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a]",
                      isFreePlan && isAnotherNodeTemplated
                        ? "cursor-not-allowed opacity-50"
                        : "",
                    ].join(" ")}
                  >
                    <option value="">Select template</option>
                    {availableTemplates
                      .filter((template) =>
                        selectedNode.data.nodeType === "email"
                          ? template.channel === "email"
                          : template.channel === "sms",
                      )
                      .map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                  </select>

                  {isFreePlan && isAnotherNodeTemplated && (
                    <p className="mt-2 text-[10px] leading-4 text-neutral-400">
                      Another node in this workflow already has a template. Clear
                      it first or upgrade to add more steps.
                    </p>
                  )}
                </div>
              )}

              {selectedNode.data.nodeType === "wait" && (
                <div className="mt-8">
                  <label className="text-xs font-semibold block mb-2">Wait duration</label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="number"
                      min="1"
                      value={selectedNode.data.config?.durationAmount ?? "2"}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            durationAmount: event.target.value,
                            targetDate: "",
                          },
                        })
                      }
                      className="h-11 w-1/2 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a]"
                    />
                    <select
                      value={selectedNode.data.config?.durationUnit ?? "days"}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        updateSelectedNode({
                          config: {
                            ...selectedNode.data.config,
                            durationUnit: event.target.value,
                            targetDate: "",
                          },
                        })
                      }
                      className="h-11 w-1/2 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a]"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px bg-neutral-200 flex-1 dark:bg-white/10"></div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">OR</span>
                    <div className="h-px bg-neutral-200 flex-1 dark:bg-white/10"></div>
                  </div>

                  <label className="text-xs font-semibold block mb-2">Wait until specific date/time</label>
                  <input
                    type="datetime-local"
                    value={selectedNode.data.config?.targetDate ?? ""}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateSelectedNode({
                        config: {
                          ...selectedNode.data.config,
                          targetDate: event.target.value,
                        },
                      })
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:[color-scheme:dark]"
                  />
                  <p className="mt-2 text-[10px] text-neutral-400 leading-tight">If a date is set, the duration above will be ignored.</p>
                </div>
              )}

              {selectedNode.data.nodeType !== "trigger" && (
                <button
                  type="button"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="mt-10 inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 dark:border-red-400/20"
                >
                  <Trash2 size={14} />
                  Delete node
                </button>
              )}
            </div>
          ) : (
            <div className="pt-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                <Sparkles size={17} />
              </div>

              <h2 className="mt-5 text-xl font-semibold">Build your workflow</h2>
              <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                Add steps and arrange them vertically. The workflow follows the
                order of the nodes automatically.
              </p>

              <div className="mt-7 space-y-3 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <Clock3 size={14} /> Custom timing
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} /> Email templates
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} /> SMS templates
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}