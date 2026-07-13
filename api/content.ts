import { validateTrips } from "../src/lib/content.js";

import { error, json, methodNotAllowed } from "./_lib/http.js";
import { loadPublished } from "./_lib/store.js";

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed("GET");

  try {
    const content = await loadPublished();
    if (!content) return error("还没有发布旅行内容", 404);
    return json(
      { ...content, trips: validateTrips(content.trips) },
      200,
      { "cache-control": "public, max-age=0, s-maxage=2, stale-while-revalidate=10" },
    );
  } catch {
    return error("暂时无法读取旅行内容，请稍后再试", 503);
  }
}

export default { fetch: handler };
