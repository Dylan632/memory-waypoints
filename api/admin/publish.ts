import { validateTrips } from "../../src/lib/content.ts";

import { error, json, methodNotAllowed, objectBody, readJson, requireAdmin } from "../_lib/http.ts";
import { loadVersion, publishTrips } from "../_lib/store.ts";

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const authError = requireAdmin(request, true);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = objectBody(await readJson(request));
  } catch (cause) {
    return error(cause instanceof RangeError ? "发布内容太大，请减少内容后重试" : "发布内容格式不正确", cause instanceof RangeError ? 413 : 400);
  }

  let trips: ReturnType<typeof validateTrips>;
  if (body.version !== undefined && body.trips === undefined) {
    if (typeof body.version !== "string") return error("历史版本无效", 400);
    try {
      trips = validateTrips((await loadVersion(body.version)).trips);
    } catch {
      return error("找不到可恢复的历史版本", 404);
    }
  } else if (body.trips !== undefined && body.version === undefined) {
    try {
      trips = validateTrips(body.trips);
    } catch {
      return error("旅行内容还不完整，请检查必填信息、票根和轨迹", 400);
    }
  } else {
    return error("请选择要发布的内容或历史版本", 400);
  }

  try {
    const { publishedAt, version } = await publishTrips(trips);
    return json({ publishedAt, version });
  } catch {
    return error("发布失败，请稍后再试", 503);
  }
}

export default { fetch: handler };
