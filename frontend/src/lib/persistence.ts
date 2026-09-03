import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "techatlas_workspace";
type SupabaseResponse = { data?: unknown; error?: { message?: string } };

function configuration() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.PERSISTENCE_SESSION_SECRET;
  return url && key && secret ? { url, key, secret } : null;
}

function sign(id: string, secret: string) {
  return createHmac("sha256", secret).update(id).digest("base64url");
}

export function persistenceEnabled() {
  return Boolean(configuration());
}

export function createWorkspaceCookie() {
  const config = configuration();
  if (!config) return null;
  const id = randomUUID();
  return `${id}.${sign(id, config.secret)}`;
}

export function verifyWorkspaceCookie(value?: string) {
  const config = configuration();
  if (!config || !value) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;
  const expected = Buffer.from(sign(id, config.secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? id : null;
}

export async function supabase(path: string, init: RequestInit = {}) {
  const config = configuration();
  if (!config) throw new Error("Persistence is not configured.");
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) as SupabaseResponse | unknown[] : [];
  if (!response.ok) throw new Error(typeof body === "object" && body && "message" in body ? String((body as { message?: unknown }).message) : "Persistence request failed.");
  return body;
}

export type PersistedRecordKind = "growth-analysis" | "risk-analysis" | "growth-plan" | "action-outcome";

export async function saveRecord(workspaceId: string, kind: PersistedRecordKind, companyId: string, payload: unknown) {
  return supabase("techatlas_records", { method: "POST", body: JSON.stringify({ workspace_id: workspaceId, kind, company_id: companyId, payload }) });
}
