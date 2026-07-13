import { json, methodNotAllowed, requireAdmin } from "../_lib/http.ts";

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  const authError = requireAdmin(request);
  return authError ?? json({ authenticated: true });
}

export default { fetch: handler };
