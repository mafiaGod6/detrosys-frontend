export type AutomationChannel = "email" | "sms" | "email_sms";
export type AutomationStatus = "draft" | "ready" | "active" | "paused" | "finished";

export type AutomationNodeData = {
  label: string;
  nodeType: "trigger" | "email" | "sms" | "wait" | "condition" | "end";
  config?: Record<string, string>;
};

export type AutomationNode = {
  id: string;
  type: "automation";
  position: { x: number; y: number };
  data: AutomationNodeData;
};

export type AutomationEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
};

export type Automation = {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  channel: AutomationChannel;
  status: AutomationStatus;
  createdAt: string;
  updatedAt: string;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
};

export type Campaign = {
  id: string;
  name: string;
  channel: AutomationChannel;
  status: "draft" | "scheduled" | "active" | "paused" | "finished";
};

const AUTOMATION_KEY = "detrosys-automations";
const CAMPAIGN_KEY = "detrosys-campaigns";

// Frontend-only showcase campaigns used until real campaign API data is connected.
const demoCampaigns: Campaign[] = [
  { id: "campaign-demo-1", name: "Summer Launch", channel: "email", status: "draft" },
  { id: "campaign-demo-2", name: "New Customer Welcome", channel: "email_sms", status: "draft" },
  { id: "campaign-demo-3", name: "Re-engagement", channel: "sms", status: "draft" },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCampaigns(): Campaign[] {
  const campaigns = readJson<Campaign[]>(CAMPAIGN_KEY, []);
  return campaigns.length > 0 ? campaigns : demoCampaigns;
}

export function getAutomations(): Automation[] {
  return readJson<Automation[]>(AUTOMATION_KEY, []);
}

export function getAutomation(id: string): Automation | null {
  return getAutomations().find((automation) => automation.id === id) ?? null;
}

export function saveAutomation(automation: Automation) {
  const current = getAutomations();
  const next = [automation, ...current.filter((item) => item.id !== automation.id)];
  writeJson(AUTOMATION_KEY, next);
}

export function deleteAutomation(id: string) {
  const current = getAutomations();
  const next = current.filter((automation) => automation.id !== id);
  writeJson(AUTOMATION_KEY, next);
}

export function createAutomation(campaign: Campaign, name: string): Automation {
  const now = new Date().toISOString();
  const trigger: AutomationNode = {
    id: "trigger-1",
    type: "automation",
    position: { x: 420, y: 100 },
    data: {
      label: "Campaign Trigger",
      nodeType: "trigger",
    },
  };

  const automation: Automation = {
    id: `automation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || `${campaign.name} Automation`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    channel: campaign.channel,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    nodes: [trigger],
    edges: [],
  };

  saveAutomation(automation);
  return automation;
}

export function duplicateAutomation(source: Automation, campaign: Campaign): Automation {
  const now = new Date().toISOString();
  const copiedNodes = source.nodes.map((node) => ({
    ...node,
    id: `${node.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    position: { ...node.position },
    data: { ...node.data, config: node.data.config ? { ...node.data.config } : undefined },
  }));

  const idMap = new Map(source.nodes.map((node, index) => [node.id, copiedNodes[index].id]));
  const copiedEdges = source.edges.map((edge) => ({
    ...edge,
    id: `${edge.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
  }));

  const automation: Automation = {
    ...source,
    id: `automation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${source.name} Copy`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    channel: campaign.channel,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    nodes: copiedNodes,
    edges: copiedEdges,
  };

  saveAutomation(automation);
  return automation;
}

export function isAutomationReusable(automation: Automation): boolean {
  return automation.status === "finished";
}

export function getChannelLabel(channel: AutomationChannel): string {
  if (channel === "email_sms") return "Email + SMS";
  if (channel === "email") return "Email";
  return "SMS";
}

export function getStatusLabel(status: AutomationStatus): string {
  if (status === "ready") return "Ready";
  return status.charAt(0).toUpperCase() + status.slice(1);
}