import assert from "node:assert/strict";
import test from "node:test";

import { adminRequest } from "../src/admin/api.ts";

test("admin requests reject HTML fallbacks instead of treating them as authenticated", async () => {
  await assert.rejects(
    adminRequest("/api/admin/session", undefined, async () => new Response("<html>fallback</html>", { headers: { "content-type": "text/html" } })),
    /服务器响应异常/,
  );
});

test("admin requests preserve JSON success and friendly API errors", async () => {
  const success = await adminRequest("/api/admin/session", undefined, async () => Response.json({ authenticated: true }));
  assert.deepEqual(success, { authenticated: true });

  await assert.rejects(
    adminRequest("/api/admin/login", undefined, async () => Response.json({ error: "密码不正确" }, { status: 401 })),
    /密码不正确/,
  );
});
