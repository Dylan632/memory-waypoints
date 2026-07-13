import { createSession, createSessionCookie, verifyPassword } from "../_lib/auth.ts";
import { error, json, methodNotAllowed, objectBody, readJson, requireOrigin } from "../_lib/http.ts";

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const originError = requireOrigin(request);
  if (originError) return originError;

  let password: unknown;
  try {
    password = objectBody(await readJson(request, 4 * 1024)).password;
  } catch (cause) {
    return error(cause instanceof RangeError ? "登录请求过大" : "请输入密码", cause instanceof RangeError ? 413 : 400);
  }
  if (typeof password !== "string" || password.length === 0 || password.length > 1024) {
    return error("请输入有效密码", 400);
  }
  if (!verifyPassword(password)) return error("密码不正确", 401);

  try {
    const token = createSession();
    return json({ authenticated: true }, 200, { "set-cookie": createSessionCookie(token) });
  } catch {
    return error("管理后台尚未完成安全配置", 503);
  }
}

export default { fetch: handler };
