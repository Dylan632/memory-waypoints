import { isSameOrigin, readSession } from "./auth.js";

const NO_STORE = { "cache-control": "no-store" };

export function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function methodNotAllowed(allowed: string): Response {
  return json({ error: "不支持这个操作" }, 405, { allow: allowed });
}

export function requireOrigin(request: Request): Response | null {
  return isSameOrigin(request) ? null : error("请求来源无效，请刷新页面后重试", 403);
}

export function requireAdmin(request: Request, write = false): Response | null {
  if (write) {
    const originError = requireOrigin(request);
    if (originError) return originError;
  }
  try {
    return readSession(request) ? null : error("登录已失效，请重新登录", 401);
  } catch {
    return error("管理后台尚未完成安全配置", 503);
  }
}

export async function readJson(request: Request, maximumBytes = 2 * 1024 * 1024): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new SyntaxError("JSON required");
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RangeError("Body too large");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes) throw new RangeError("Body too large");
  return JSON.parse(text) as unknown;
}

export function objectBody(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("Object required");
  }
  return value as Record<string, unknown>;
}
