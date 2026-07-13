import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const COOKIE_NAME = "__Host-memory_admin";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

const HASH_BYTES = 64;
const DUMMY_SALT = "00000000000000000000000000000000";
const DUMMY_HASH = Buffer.alloc(HASH_BYTES);

export function createPasswordHash(password: string, salt = randomBytes(16).toString("hex")): string {
  if (!/^[0-9a-f]{32,128}$/i.test(salt)) throw new TypeError("Salt must be hexadecimal");
  return `${salt}:${scryptSync(password, salt, HASH_BYTES).toString("hex")}`;
}

export function verifyPassword(password: string, encoded = process.env.ADMIN_PASSWORD_HASH ?? ""): boolean {
  const [salt, hash, ...extra] = encoded.split(":");
  const validFormat =
    extra.length === 0 &&
    /^[0-9a-f]{32,128}$/i.test(salt ?? "") &&
    /^[0-9a-f]{128}$/i.test(hash ?? "");
  const expected = validFormat ? Buffer.from(hash, "hex") : DUMMY_HASH;
  const actual = scryptSync(password, validFormat ? salt : DUMMY_SALT, HASH_BYTES);

  return validFormat && timingSafeEqual(actual, expected);
}

export function createSession(secret = sessionSecret(), now = Date.now()): string {
  const expires = Math.floor(now / 1000) + SESSION_SECONDS;
  const payload = `v1.${expires}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySession(token: string, secret = sessionSecret(), now = Date.now()): boolean {
  const [version, expiresText, signature, ...extra] = token.split(".");
  const payload = `${version}.${expiresText}`;
  const expected = Buffer.from(sign(payload, secret), "base64url");
  const supplied = Buffer.from(signature ?? "", "base64url");
  const padded = Buffer.alloc(expected.length);
  supplied.copy(padded, 0, 0, expected.length);
  const signatureMatches = timingSafeEqual(expected, padded) && supplied.length === expected.length;
  const expires = Number(expiresText);

  return (
    extra.length === 0 &&
    version === "v1" &&
    /^\d{10,}$/.test(expiresText ?? "") &&
    Number.isSafeInteger(expires) &&
    expires > Math.floor(now / 1000) &&
    signatureMatches
  );
}

export function createSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function readSession(
  request: Request,
  secret = sessionSecret(),
  now = Date.now(),
): boolean {
  const token = readCookie(request.headers.get("cookie"), COOKIE_NAME);
  return token !== null && verifySession(token, secret, now);
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin && origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function readCookie(header: string | null, name: string): string | null {
  for (const item of header?.split(";") ?? []) {
    const separator = item.indexOf("=");
    if (separator === -1 || item.slice(0, separator).trim() !== name) continue;
    return item.slice(separator + 1).trim();
  }
  return null;
}
