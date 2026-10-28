export type TemplateChannel = "email" | "sms";

export type Template = {
  id: string;
  name: string;
  description: string;
  channel: TemplateChannel;
  createdAt: string;
  source: "created" | "marketplace";
};

const STORAGE_KEY = "detrosys-templates";

function readTemplates(): Template[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTemplates(templates: Template[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(templates),
  );
}

export function getTemplates(): Template[] {
  return readTemplates();
}

export function saveTemplate(template: Template) {
  const current = readTemplates();

  const withoutExisting = current.filter(
    (item) => item.id !== template.id,
  );

  writeTemplates([template, ...withoutExisting]);
}

export function createTemplate(
  channel: TemplateChannel,
  name: string,
  description: string,
): Template {
  const template: Template = {
    id: `${channel}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    name,
    description,
    channel,
    createdAt: new Date().toISOString(),
    source: "created",
  };

  saveTemplate(template);

  return template;
}

export function getRecentTemplates(
  channel: TemplateChannel,
): Template[] {
  return readTemplates()
    .filter((template) => template.channel === channel)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);
}

export function getLibraryTemplates(): Template[] {
  return readTemplates().sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}