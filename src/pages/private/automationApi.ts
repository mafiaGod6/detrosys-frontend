export type AutomationChannel = "email" | "sms" | "email_sms";
export type AutomationStatus = "draft" | "ready" | "active" | "paused" | "finished";
export type AutomationNodeType = "trigger" | "email" | "sms" | "wait" | "condition" | "end";

export type AutomationNodeData = {
  label: string;
  nodeType: AutomationNodeType;
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
  campaignId: string | null;
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

export type Template = {
  id: string;
  name: string;
  channel: "email" | "sms";
  subject?: string | null;
  body?: string;
  is_system?: boolean;
};

type ApiError = Error & { status?: number };

const ACCESS_TOKEN_KEY = "detrosys_access_token";

function parseApiErrorDetail(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((item: any) => {
        const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "";
        const msg = item?.msg || JSON.stringify(item);
        return field ? `${field}: ${msg}` : msg;
      })
      .join(", ");
  }
  if (typeof payload.message === "string") return payload.message;
  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const rawBase = (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");

  const serverRoot = rawBase.replace(/\/api(\/v\d+)?$/, "");
  const cleanPath = path.replace(/^\//, "");

  const candidateUrls = [
    `${serverRoot}/api/v1/${cleanPath}`,
    `${serverRoot}/${cleanPath}`,
    `${serverRoot}/api/${cleanPath}`,
  ];

  const uniqueUrls = Array.from(new Set(candidateUrls));
  let lastError: Error | null = null;

  for (let i = 0; i < uniqueUrls.length; i++) {
    const targetUrl = uniqueUrls[i];
    try {
      const response = await fetch(targetUrl, {
        ...options,
        headers,
      });

      if (response.status === 404 && i < uniqueUrls.length - 1) {
        continue;
      }

      if (!response.ok) {
        let message = `Request failed with status ${response.status}.`;
        try {
          const payload = await response.json();
          message = parseApiErrorDetail(payload, message);
        } catch {}
        const error = new Error(message) as ApiError;
        error.status = response.status;
        throw error;
      }

      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (err) {
      lastError = err as Error;
      if ((err as any)?.status && (err as any).status !== 404) {
        throw err;
      }
      if (options.method && options.method.toUpperCase() !== "GET" && !(err as any)?.status) {
        throw err;
      }
    }
  }

  throw lastError || new Error(`Unable to reach automation endpoint for ${path}.`);
}

function normalizeChannel(value: unknown): AutomationChannel {
  return value === "sms" || value === "email_sms" ? value : "email";
}

function normalizeStatus(value: unknown): AutomationStatus {
  if (value === "active") return "active";
  if (value === "paused" || value === "inactive") return "paused";
  if (value === "finished" || value === "completed") return "finished";
  if (value === "ready") return "ready";
  return "draft";
}

function normalizeCampaignStatus(value: unknown): Campaign["status"] {
  if (value === "scheduled") return "scheduled";
  if (value === "active") return "active";
  if (value === "paused" || value === "inactive") return "paused";
  if (value === "finished" || value === "completed") return "finished";
  return "draft";
}

function sortRawBackendNodes(rawNodes: any[]): any[] {
  if (!Array.isArray(rawNodes) || rawNodes.length <= 1) return rawNodes || [];

  const byId = new Map<string, any>();
  for (const n of rawNodes) {
    byId.set(String(n.id), n);
  }

  const nonStopNodes = rawNodes.filter(
    (n) => !["STOP", "END"].includes(String(n.type || "").toUpperCase()),
  );
  const startNode =
    nonStopNodes.find((n) => Boolean(n.is_start)) ||
    rawNodes.find((n) => Boolean(n.is_start));

  const visited = new Set<string>();
  const ordered: any[] = [];

  let curr = startNode;
  while (curr && !visited.has(String(curr.id))) {
    visited.add(String(curr.id));
    ordered.push(curr);
    const nextId = curr.next_node_id || curr.yes_node_id || curr.no_node_id;
    curr = nextId ? byId.get(String(nextId)) : null;
  }

  const remaining = rawNodes
    .filter((n) => !visited.has(String(n.id)))
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));

  const combined = [...ordered, ...remaining];

  const actionSteps = combined.filter(
    (n) => !["STOP", "END"].includes(String(n.type || "").toUpperCase()),
  );
  const endSteps = combined.filter((n) =>
    ["STOP", "END"].includes(String(n.type || "").toUpperCase()),
  );

  return [...actionSteps, ...endSteps];
}

function backendNodeToFrontend(node: any, index: number): AutomationNode {
  const config = (node.config ?? {}) as Record<string, unknown>;
  let nodeType: AutomationNodeType = "wait";
  let label = "Step";
  const frontendConfig: Record<string, string> = {};

  const type = String(node.type || "").toUpperCase();

  switch (type) {
    case "SEND_EMAIL":
    case "EMAIL":
      nodeType = "email";
      label = "Send Email";
      break;
    case "SEND_SMS":
    case "SMS":
      nodeType = "sms";
      label = "Send SMS";
      break;
    case "WAIT": {
      nodeType = "wait";
      label = "Wait";
      const durSecs = Number(config.duration_seconds || 86400 * 2);
      let unit = "days";
      let amount = durSecs / 86400;
      if (durSecs % 86400 !== 0) {
        if (durSecs % 3600 === 0) {
          unit = "hours";
          amount = durSecs / 3600;
        } else if (durSecs % 60 === 0) {
          unit = "minutes";
          amount = durSecs / 60;
        } else {
          unit = "seconds";
          amount = durSecs;
        }
      }
      frontendConfig.durationAmount = String(amount);
      frontendConfig.durationUnit = unit;
      if (config.target_date) frontendConfig.targetDate = String(config.target_date);
      break;
    }
    case "CONDITION": {
      nodeType = "condition";
      label = "Condition";
      const event = config.event === "sms_opened" ? "sms_opened" : "email_opened";
      frontendConfig.condition = event;
      frontendConfig.event = event;
      break;
    }
    case "STOP":
    case "END":
      nodeType = "end";
      label = "End";
      break;
    default:
      nodeType = "wait";
      label = node.label || node.type || "Action";
      break;
  }

  if (config.template_id) frontendConfig.templateId = String(config.template_id);
  if (config.template_name) frontendConfig.templateName = String(config.template_name);
  if (config.event) frontendConfig.event = String(config.event);

  return {
    id: String(node.id),
    type: "automation",
    position: { x: 0, y: index },
    data: {
      label,
      nodeType,
      config: Object.keys(frontendConfig).length ? frontendConfig : undefined,
    },
  };
}

function buildFrontendEdges(nodes: AutomationNode[]): AutomationEdge[] {
  const edges: AutomationEdge[] = [];

  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({
      id: `sequence-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      sourceHandle: "source",
      targetHandle: "target",
    });
  }

  return edges;
}

async function getBackendNodes(automationId: string): Promise<any[]> {
  try {
    const res = await request<any[]>(`/automation-nodes/automation/${automationId}`);
    return Array.isArray(res) ? sortRawBackendNodes(res) : [];
  } catch {
    return [];
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  const response = await request<any[]>("/campaigns");
  if (!Array.isArray(response)) return [];
  return response.map((item) => ({
    id: String(item.id),
    name: item.name,
    channel: normalizeChannel(item.channel),
    status: normalizeCampaignStatus(item.status),
  }));
}

export async function getTemplates(): Promise<Template[]> {
  const response = await request<any[]>("/templates/");
  if (!Array.isArray(response)) return [];
  return response
    .filter((item) => !item.is_system)
    .map((item) => ({
      id: String(item.id),
      name: item.name,
      channel: item.channel,
      subject: item.subject,
      body: item.body,
      is_system: item.is_system,
    }));
}

export async function getAutomations(): Promise<Automation[]> {
  const response = await request<any[]>("/automations");
  if (!Array.isArray(response)) return [];

  let campaigns: Campaign[] = [];
  try {
    campaigns = await getCampaigns();
  } catch {}

  const result: Automation[] = [];

  for (const item of response) {
    try {
      const automation = await getAutomation(String(item.id), campaigns, item);
      result.push(automation);
    } catch {
      const campaign = item.campaign_id
        ? campaigns.find((c) => c.id === String(item.campaign_id))
        : null;

      result.push({
        id: String(item.id),
        name: item.name || "Untitled Automation",
        campaignId: item.campaign_id ? String(item.campaign_id) : null,
        campaignName: campaign?.name ?? (item.campaign_id ? "Campaign" : "Standalone"),
        channel: campaign?.channel ?? "email",
        status: normalizeStatus(item.status),
        createdAt: item.created_at ?? new Date().toISOString(),
        updatedAt: item.updated_at ?? item.created_at ?? new Date().toISOString(),
        nodes: [
          {
            id: `trigger-${item.id}`,
            type: "automation",
            position: { x: 0, y: -1 },
            data: { label: "Campaign Trigger", nodeType: "trigger" },
          },
        ],
        edges: [],
      });
    }
  }
  return result;
}

export async function getAutomation(
  id: string,
  existingCampaigns?: Campaign[],
  rawItem?: any,
): Promise<Automation> {
  const item = rawItem || (await request<any>(`/automations/${id}`));
  let campaigns = existingCampaigns;
  if (!campaigns) {
    try {
      campaigns = await getCampaigns();
    } catch {
      campaigns = [];
    }
  }
  const campaign = item.campaign_id
    ? campaigns.find((candidate) => candidate.id === String(item.campaign_id))
    : null;

  const backendNodes = await getBackendNodes(id);
  const nodes = backendNodes.map((n, idx) => backendNodeToFrontend(n, idx));

  const trigger: AutomationNode = {
    id: `trigger-${id}`,
    type: "automation",
    position: { x: 0, y: -1 },
    data: { label: "Campaign Trigger", nodeType: "trigger" },
  };

  const allNodes = [trigger, ...nodes];
  const edges = buildFrontendEdges(nodes);
  if (nodes[0]) {
    edges.unshift({
      id: `sequence-${trigger.id}-${nodes[0].id}`,
      source: trigger.id,
      target: nodes[0].id,
      sourceHandle: "source",
      targetHandle: "target",
    });
  }

  return {
    id: String(item.id),
    name: item.name || "Untitled Automation",
    campaignId: item.campaign_id ? String(item.campaign_id) : null,
    campaignName: campaign?.name ?? (item.campaign_id ? "Campaign" : "Standalone"),
    channel: campaign?.channel ?? "email",
    status: normalizeStatus(item.status),
    createdAt: item.created_at ?? new Date().toISOString(),
    updatedAt: item.updated_at ?? item.created_at ?? new Date().toISOString(),
    nodes: allNodes,
    edges,
  };
}

export async function createAutomation(campaign: Campaign, name: string): Promise<Automation> {
  if (!campaign.id) {
    throw new Error("A valid campaign must be selected before creating an automation.");
  }
  const existing = await request<any>(`/automations/campaign/${campaign.id}`).catch(() => null);
  if (existing && existing.id) {
    return getAutomation(String(existing.id));
  }

  const item = await request<any>("/automations", {
    method: "POST",
    body: JSON.stringify({
      campaign_id: campaign.id,
      name: name.trim() || `${campaign.name} Automation`,
      status: "draft",
    }),
  });

  return getAutomation(String(item.id));
}

function backendConfig(node: AutomationNode): Record<string, unknown> {
  const config = node.data.config ?? {};

  if (node.data.nodeType === "email" || node.data.nodeType === "sms") {
    return {
      template_id: config.templateId,
      template_name: config.templateName,
    };
  }

  if (node.data.nodeType === "wait") {
    let durationSeconds = 86400 * 2;
    const amount = Number(config.durationAmount || 2);
    const unit = config.durationUnit || "days";
    if (unit === "seconds") durationSeconds = amount;
    else if (unit === "minutes") durationSeconds = amount * 60;
    else if (unit === "hours") durationSeconds = amount * 3600;
    else durationSeconds = amount * 86400;

    return {
      duration_seconds: durationSeconds,
            target_date: config.targetDate ? new Date(config.targetDate).toISOString() : null,
    };
  }

  if (node.data.nodeType === "condition") {
    const event = config.condition === "sms_opened" ? "sms_opened" : "email_opened";
    return {
      event,
      field: "engagement",
      operator: "equals",
      value: "true",
    };
  }

  return {};
}

async function createBackendNode(
  automationId: string,
  node: AutomationNode,
  position: number,
  isStart: boolean,
): Promise<any> {
  const typeMap: Record<string, string> = {
    email: "SEND_EMAIL",
    sms: "SEND_SMS",
    wait: "WAIT",
    condition: "CONDITION",
    end: "STOP",
  };

  return request<any>("/automation-nodes", {
    method: "POST",
    body: JSON.stringify({
      automation_id: automationId,
      type: typeMap[node.data.nodeType] || "WAIT",
      position,
      config: backendConfig(node),
      is_start: isStart,
    }),
  });
}

async function clearExistingNodes(automationId: string): Promise<void> {
  const res = await request<any[]>(`/automation-nodes/automation/${automationId}`).catch(() => []);
  const nodes = Array.isArray(res) ? res : [];

  for (const node of nodes) {
    await request(`/automation-nodes/${node.id}?automation_id=${automationId}`, {
      method: "PATCH",
      body: JSON.stringify({
        next_node_id: null,
        yes_node_id: null,
        no_node_id: null,
      }),
    });
  }

  for (const node of nodes) {
    await request(`/automation-nodes/${node.id}?automation_id=${automationId}`, {
      method: "DELETE",
    });
  }
}

export async function saveAutomation(
  automation: Automation,
  workflowNodes: AutomationNode[],
): Promise<Automation> {
  await request(`/automations/${automation.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: automation.name,
      status: automation.status,
    }),
  });

  await clearExistingNodes(automation.id);

  const nonTrigger = workflowNodes.filter((node) => node.data.nodeType !== "trigger");
  const middleNodes = nonTrigger.filter((node) => node.data.nodeType !== "end");
  const endNodes = nonTrigger.filter((node) => node.data.nodeType === "end");

  const finalEndNode: AutomationNode = endNodes[0] ?? {
    id: `end-${automation.id}`,
    type: "automation",
    position: { x: 0, y: middleNodes.length },
    data: { label: "End", nodeType: "end" },
  };

  const actualNodes = [...middleNodes, finalEndNode];
  const created: any[] = [];

  for (let index = 0; index < actualNodes.length; index += 1) {
    created.push(
      await createBackendNode(
        automation.id,
        actualNodes[index],
        index,
        index === 0,
      ),
    );
  }

  for (let index = 0; index < created.length; index += 1) {
    const current = created[index];
    const next = created[index + 1];
    const visualNode = actualNodes[index];
    const isCondition = visualNode.data.nodeType === "condition";

    await request(`/automation-nodes/${current.id}?automation_id=${automation.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        next_node_id: isCondition ? null : next?.id ?? null,
        yes_node_id: isCondition ? next?.id ?? null : null,
        no_node_id: isCondition ? next?.id ?? null : null,
      }),
    });
  }

  return getAutomation(automation.id);
}

export async function deleteAutomation(id: string): Promise<void> {
  await request(`/automations/${id}`, { method: "DELETE" });
}

export async function duplicateAutomation(source: Automation, campaign: Campaign): Promise<Automation> {
  const freshSource = await getAutomation(source.id);
  const created = await createAutomation(campaign, `${freshSource.name} Copy`);
  return saveAutomation(created, freshSource.nodes);
}

export async function reuseAutomationForCampaign(
  source: Automation,
  targetCampaign: Campaign,
): Promise<Automation> {
  const freshSource = await getAutomation(source.id);

  if (!freshSource.campaignId) {
    try {
      await request(`/automations/${freshSource.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          campaign_id: targetCampaign.id,
          name:
            freshSource.name === "Untitled Automation"
              ? `${targetCampaign.name} Automation`
              : freshSource.name,
          status: "draft",
        }),
      });
      const updated = await getAutomation(freshSource.id);
      if (updated.campaignId === String(targetCampaign.id)) {
        return saveAutomation(updated, freshSource.nodes);
      }
    } catch {}

    const created = await createAutomation(
      targetCampaign,
      freshSource.name === "Untitled Automation"
        ? `${targetCampaign.name} Automation`
        : freshSource.name,
    );
    const saved = await saveAutomation(created, freshSource.nodes);
    try {
      await deleteAutomation(freshSource.id);
    } catch {}
    return saved;
  }

  return duplicateAutomation(freshSource, targetCampaign);
}

export function isAutomationReusable(automation: Automation): boolean {
  return (
    automation.status === "finished" ||
    automation.status === "paused" ||
    automation.status === "draft" ||
    !automation.campaignId
  );
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