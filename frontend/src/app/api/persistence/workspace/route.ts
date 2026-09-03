import { cookies } from "next/headers";
import { createWorkspaceCookie, persistenceEnabled, verifyWorkspaceCookie } from "@/lib/persistence";

export const runtime = "nodejs";

export async function GET() {
  if (!persistenceEnabled()) return Response.json({ enabled: false });
  const store = await cookies();
  let token: string | null | undefined = store.get("techatlas_workspace")?.value;
  let workspaceId = verifyWorkspaceCookie(token);
  const response = Response.json({ enabled: true });
  if (!workspaceId) {
    token = createWorkspaceCookie();
    workspaceId = verifyWorkspaceCookie(token ?? undefined);
    if (token) response.headers.append("Set-Cookie", `techatlas_workspace=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  }
  return response;
}
