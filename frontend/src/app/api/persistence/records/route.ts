import { cookies } from "next/headers";
import { persistenceEnabled, saveRecord, type PersistedRecordKind, verifyWorkspaceCookie } from "@/lib/persistence";

export const runtime = "nodejs";
const kinds = new Set<PersistedRecordKind>(["growth-analysis", "risk-analysis", "growth-plan", "action-outcome"]);

export async function POST(request: Request) {
  if (!persistenceEnabled()) return Response.json({ enabled: false });
  const workspaceId = verifyWorkspaceCookie((await cookies()).get("techatlas_workspace")?.value);
  const { kind, companyId, payload } = await request.json() as { kind?: unknown; companyId?: unknown; payload?: unknown };
  if (!workspaceId) return Response.json({ error: "No persistence session." }, { status: 401 });
  if (typeof kind !== "string" || !kinds.has(kind as PersistedRecordKind) || typeof companyId !== "string" || !companyId) return Response.json({ error: "Invalid persistence record." }, { status: 400 });
  await saveRecord(workspaceId, kind as PersistedRecordKind, companyId, payload);
  return Response.json({ ok: true });
}
