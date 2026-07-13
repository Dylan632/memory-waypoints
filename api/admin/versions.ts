import { error, json, methodNotAllowed, requireAdmin } from "../_lib/http.ts";
import { listVersions } from "../_lib/store.ts";

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    return json({ versions: await listVersions() });
  } catch {
    return error("暂时无法读取历史版本，请稍后再试", 503);
  }
}

export default { fetch: handler };
