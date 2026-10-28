export type TemplateChannel = "email" | "sms";

export type ApiTemplate = {
  id: string;
  user_id: string | null;
  name: string;
  channel: TemplateChannel;
  subject: string | null;
  body: string;
  is_system: boolean;
};

export type Template = ApiTemplate & {
  description: string;
  createdAt: string;
  source: "created" | "marketplace";
};

export type CreateTemplateInput = {
  name: string;
  channel: TemplateChannel;
  subject?: string | null;
  body: string;
};

export type UpdateTemplateInput = {
  name?: string;
  subject?: string | null;
  body?: string;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  ""
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "detrosys_access_token";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (typeof data?.message === "string") {
        message = data.message;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function htmlToText(value: string): string {
  if (typeof document === "undefined") {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const element = document.createElement("div");
  element.innerHTML = value;
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

function toFrontendTemplate(template: ApiTemplate): Template {
  const text = htmlToText(template.body);

  return {
    ...template,
    id: String(template.id),
    description: text.slice(0, 140),
    createdAt: "",
    source: template.is_system ? "marketplace" : "created",
  };
}

export const templateApi = {
  async list(): Promise<Template[]> {
    const templates = await apiRequest<ApiTemplate[]>("/templates/");
    return templates.map(toFrontendTemplate);
  },

  async get(id: string): Promise<Template> {
    const template = await apiRequest<ApiTemplate>(
      `/templates/${encodeURIComponent(id)}`,
    );
    return toFrontendTemplate(template);
  },

  async create(input: CreateTemplateInput): Promise<Template> {
    const template = await apiRequest<ApiTemplate>("/templates/", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        channel: input.channel,
        subject: input.channel === "email" ? input.subject ?? "" : null,
        body: input.body,
      }),
    });

    return toFrontendTemplate(template);
  },

  async update(id: string, input: UpdateTemplateInput): Promise<Template> {
    const template = await apiRequest<ApiTemplate>(
      `/templates/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    );

    return toFrontendTemplate(template);
  },

  async remove(id: string): Promise<void> {
    await apiRequest<{ message: string }>(
      `/templates/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  async listSystem(): Promise<Template[]> {
    const templates = await apiRequest<ApiTemplate[]>("/templates/system");
    return templates.map(toFrontendTemplate);
  },

  async getSystem(id: string): Promise<Template> {
    const template = await apiRequest<ApiTemplate>(
      `/templates/system/${encodeURIComponent(id)}`,
    );
    return toFrontendTemplate(template);
  },

  async useSystemTemplate(id: string): Promise<Template> {
    const systemTemplate = await this.getSystem(id);

    return this.create({
      name: systemTemplate.name,
      channel: systemTemplate.channel,
      subject: systemTemplate.subject,
      body: systemTemplate.body,
    });
  },
};

export { toFrontendTemplate };