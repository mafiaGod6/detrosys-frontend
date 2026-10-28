const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "detrosys_access_token";

export type DashboardDays = 7 | 30 | 90 | null;
export type DashboardResponse = {
  range: { days: DashboardDays; start: string | null; end: string };
  metrics: { contacts: number; messages_sent: number; delivered: number; active_campaigns: number };
  communication: {
    email: { sent: number; delivered: number; delivery_rate: number | null };
    sms: { sent: number; delivered: number; delivery_rate: number | null };
  };
  activity: Array<{ index: number; label: string; contacts: number; messages: number }>;
  audience_growth: Array<{ index: number; label: string; contacts: number }>;
  current_campaigns: Array<{ id: string; name: string; channel: string; status: string; scheduled_at: string | null }>;
  attention: { failed_campaigns: number };
  recent_activity: Array<{ type: "campaign" | "contact"; label: string; name: string; timestamp: string }>;
};

async function request<T>(path: string): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`;
    try { const body = await response.json(); if (typeof body?.detail === "string") detail = body.detail; } catch {}
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function getDashboard(days: DashboardDays) {
  return request<DashboardResponse>(days === null ? "/dashboard" : `/dashboard?days=${days}`);
}
