import { clearSessionCookie } from "../_lib/auth.js";
import { json, methodNotAllowed, requireOrigin } from "../_lib/http.js";

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const originError = requireOrigin(request);
  if (originError) return originError;
  return json({ authenticated: false }, 200, { "set-cookie": clearSessionCookie() });
}

export default { fetch: handler };
