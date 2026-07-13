import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";

import { error, json, methodNotAllowed, objectBody, readJson, requireAdmin } from "../_lib/http.ts";

const MAXIMUM_SIZE = 20 * 1024 * 1024;
const IMAGE_PATH = /^memory-waypoints\/uploads\/(?:tickets|photos)\/[^/\\\u0000-\u001f]{1,150}\.(?:jpe?g|png|webp)$/i;

export async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  const authError = requireAdmin(request, true);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = objectBody(await readJson(request, 64 * 1024));
    const payload = objectBody(body.payload);
    if (
      body.type !== "blob.generate-presigned-url" ||
      typeof payload.pathname !== "string" ||
      typeof payload.multipart !== "boolean" ||
      !IMAGE_PATH.test(payload.pathname)
    ) {
      throw new TypeError("Invalid upload request");
    }
  } catch (cause) {
    return error(cause instanceof RangeError ? "上传请求过大" : "请选择 JPG、PNG 或 WebP 图片", cause instanceof RangeError ? 413 : 400);
  }

  try {
    const result = await handleUploadPresigned({
      request,
      body: body as unknown as HandleUploadPresignedBody,
      getSignedToken: async (pathname) => ({
        token: await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAXIMUM_SIZE,
        }),
        urlOptions: {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAXIMUM_SIZE,
          addRandomSuffix: true,
        },
      }),
    });
    return json(result);
  } catch {
    return error("暂时无法上传图片，请稍后再试", 503);
  }
}

export default { fetch: handler };
