import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COOKIE_NAME,
  createPasswordHash,
  createSession,
  createSessionCookie,
  isSameOrigin,
  readSession,
  verifyPassword,
  verifySession,
} from "../api/_lib/auth.ts";
import { decryptDraft, encryptDraft } from "../api/_lib/store.ts";
import login from "../api/admin/login.ts";
import session from "../api/admin/session.ts";

const SECRET = "test-session-secret-that-is-at-least-32-characters";
const NOW = Date.UTC(2026, 6, 13);

test("password hashes use scrypt and reject wrong or malformed values", () => {
  const encoded = createPasswordHash("our-memory", "00112233445566778899aabbccddeeff");

  assert.match(encoded, /^[0-9a-f]+:[0-9a-f]{128}$/);
  assert.equal(verifyPassword("our-memory", encoded), true);
  assert.equal(verifyPassword("wrong", encoded), false);
  assert.equal(verifyPassword("our-memory", "invalid"), false);
});

test("session cookie is secure and can be read from a request", () => {
  const token = createSession(SECRET, NOW);
  const cookie = createSessionCookie(token);
  const request = new Request("https://memories.example/api/admin/session", {
    headers: { cookie: `${COOKIE_NAME}=${token}; theme=paper` },
  });

  assert.match(cookie, new RegExp(`^${COOKIE_NAME}=`));
  assert.match(cookie, /Max-Age=604800/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal(readSession(request, SECRET, NOW), true);
});

test("expired and tampered sessions are rejected", () => {
  const token = createSession(SECRET, NOW);
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

  assert.equal(verifySession(token, SECRET, NOW), true);
  assert.equal(verifySession(token, SECRET, NOW + 7 * 24 * 60 * 60 * 1000 + 1), false);
  assert.equal(verifySession(tampered, SECRET, NOW), false);
  assert.equal(verifySession("bad-token", SECRET, NOW), false);
});

test("write requests require an exact same-origin Origin header", () => {
  const same = new Request("https://memories.example/api/admin/draft", {
    method: "PUT",
    headers: { origin: "https://memories.example" },
  });
  const crossSite = new Request("https://memories.example/api/admin/draft", {
    method: "PUT",
    headers: { origin: "https://attacker.example" },
  });
  const missing = new Request("https://memories.example/api/admin/draft", { method: "PUT" });

  assert.equal(isSameOrigin(same), true);
  assert.equal(isSameOrigin(crossSite), false);
  assert.equal(isSameOrigin(missing), false);
});

test("draft encryption round-trips and detects tampering", () => {
  const draft = { trips: [{ id: "xiamen" }], savedAt: "2026-07-13T00:00:00.000Z" };
  const encrypted = encryptDraft(draft, SECRET);

  assert.deepEqual(decryptDraft(encrypted, SECRET), draft);

  const tampered = JSON.parse(encrypted);
  tampered.ciphertext = `${tampered.ciphertext.slice(0, -2)}AA`;
  assert.throws(() => decryptDraft(JSON.stringify(tampered), SECRET));
});

test("login and session endpoints return the admin UI response shape", async () => {
  const previousHash = process.env.ADMIN_PASSWORD_HASH;
  const previousSecret = process.env.SESSION_SECRET;
  process.env.ADMIN_PASSWORD_HASH = createPasswordHash("our-memory", "00112233445566778899aabbccddeeff");
  process.env.SESSION_SECRET = SECRET;

  try {
    const loginResponse = await login.fetch(new Request("https://memories.example/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://memories.example" },
      body: JSON.stringify({ password: "our-memory" }),
    }));
    const cookie = loginResponse.headers.get("set-cookie");

    assert.equal(loginResponse.status, 200);
    assert.deepEqual(await loginResponse.json(), { authenticated: true });
    assert.ok(cookie);

    const sessionResponse = await session.fetch(new Request("https://memories.example/api/admin/session", {
      headers: { cookie: cookie.split(";", 1)[0] },
    }));
    assert.equal(sessionResponse.status, 200);
    assert.deepEqual(await sessionResponse.json(), { authenticated: true });
  } finally {
    if (previousHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = previousHash;
    if (previousSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSecret;
  }
});
