import { cookies } from "next/headers";
import { persistenceEnabled, supabase, verifyWorkspaceCookie } from "@/lib/persistence";

export const runtime = "nodejs";

async function workspace() {
  if (!persistenceEnabled()) return null;
  return verifyWorkspaceCookie((await cookies()).get("techatlas_workspace")?.value);
}

export async function GET() {
  const id = await workspace();
  if (!id) return Response.json({ enabled: false, items: [] });
  const rows = await supabase(`techatlas_watchlist?workspace_id=eq.${encodeURIComponent(id)}&select=company_id&order=created_at.desc`) as Array<{ company_id?: unknown }>;
  return Response.json({ enabled: true, items: rows.flatMap((row) => typeof row.company_id === "string" ? [row.company_id] : []) });
}

export async function POST(request: Request) {
  const id = await workspace();
  const { companyId } = await request.json() as { companyId?: unknown };
  if (!id) return Response.json({ error: "Persistence is not configured." }, { status: 503 });
  if (typeof companyId !== "string" || !companyId) return Response.json({ error: "Invalid company." }, { status: 400 });
  await supabase("techatlas_watchlist?on_conflict=workspace_id,company_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify({ workspace_id: id, company_id: companyId }) });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const id = await workspace();
  const { companyId } = await request.json() as { companyId?: unknown };
  if (!id) return Response.json({ error: "Persistence is not configured." }, { status: 503 });
  if (typeof companyId !== "string" || !companyId) return Response.json({ error: "Invalid company." }, { status: 400 });
  await supabase(`techatlas_watchlist?workspace_id=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(companyId)}`, { method: "DELETE" });
  return Response.json({ ok: true });
}
