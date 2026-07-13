import { error, json, methodNotAllowed, objectBody, readJson, requireAdmin } from "../_lib/http.ts";
import { loadDraft, saveDraft } from "../_lib/store.ts";

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "PUT") return methodNotAllowed("GET, PUT");
  const authError = requireAdmin(request, request.method === "PUT");
  if (authError) return authError;

  if (request.method === "GET") {
    try {
      return json((await loadDraft()) ?? { trips: [] });
    } catch {
      return error("暂时无法读取草稿，请稍后再试", 503);
    }
  }

  let trips: unknown;
  try {
    trips = objectBody(await readJson(request)).trips;
    if (
      !Array.isArray(trips) ||
      trips.length > 100 ||
      trips.some((trip) => typeof trip !== "object" || trip === null || Array.isArray(trip))
    ) {
      throw new TypeError("Invalid trips");
    }
  } catch (cause) {
    return error(cause instanceof RangeError ? "草稿太大，请减少内容后重试" : "草稿格式不正确", cause instanceof RangeError ? 413 : 400);
  }

  try {
    return json(await saveDraft(trips));
  } catch {
    return error("草稿保存失败，请稍后再试", 503);
  }
}

export default { fetch: handler };
