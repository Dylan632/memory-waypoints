import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
  randomUUID,
} from "node:crypto";

import { del, get, list, put } from "@vercel/blob";

const ROOT = "memory-waypoints";
const DRAFT_PREFIX = `${ROOT}/drafts/`;
const VERSION_PREFIX = `${ROOT}/versions/`;

export type DraftContent = {
  trips: unknown[];
  savedAt: string;
};

export type PublishedContent = {
  trips: unknown[];
  publishedAt: string;
  version: string;
};

type EncryptedEnvelope = {
  version: 1;
  iv: string;
  tag: string;
  ciphertext: string;
};

export function encryptDraft(draft: DraftContent, secret = draftEncryptionSecret()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", draftKey(secret), iv);
  const plaintext = Buffer.from(JSON.stringify(draft));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const envelope: EncryptedEnvelope = {
    version: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
  return JSON.stringify(envelope);
}

export function decryptDraft(encrypted: string, secret = draftEncryptionSecret()): DraftContent {
  const envelope = JSON.parse(encrypted) as Partial<EncryptedEnvelope>;
  if (
    envelope.version !== 1 ||
    typeof envelope.iv !== "string" ||
    typeof envelope.tag !== "string" ||
    typeof envelope.ciphertext !== "string"
  ) {
    throw new Error("Invalid encrypted draft");
  }

  const iv = Buffer.from(envelope.iv, "base64url");
  const tag = Buffer.from(envelope.tag, "base64url");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid encrypted draft");

  const decipher = createDecipheriv("aes-256-gcm", draftKey(secret), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const draft = JSON.parse(plaintext) as Partial<DraftContent>;
  if (!Array.isArray(draft.trips) || typeof draft.savedAt !== "string") {
    throw new Error("Invalid encrypted draft");
  }
  return draft as DraftContent;
}

export async function saveDraft(trips: unknown[]): Promise<DraftContent> {
  const draft = { trips, savedAt: new Date().toISOString() };
  const pathname = `${DRAFT_PREFIX}${draft.savedAt.replaceAll(":", "-")}-${randomUUID()}.enc`;
  await put(pathname, encryptDraft(draft), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/octet-stream",
  });
  await pruneDrafts().catch(() => undefined);
  return draft;
}

export async function loadDraft(): Promise<DraftContent | null> {
  const latest = (await blobsByRecency(DRAFT_PREFIX))[0];
  if (!latest) return null;
  const encrypted = await readBlob(latest.pathname);
  return encrypted === null ? null : decryptDraft(encrypted);
}

export async function publishTrips(trips: unknown[]): Promise<PublishedContent> {
  const publishedAt = new Date().toISOString();
  const version = `${VERSION_PREFIX}${publishedAt.replaceAll(":", "-")}-${randomUUID()}.json`;
  const content = { trips, publishedAt, version };
  const body = JSON.stringify(content);

  await put(version, body, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  return content;
}

export async function loadPublished(): Promise<PublishedContent | null> {
  const latest = (await blobsByRecency(VERSION_PREFIX))[0];
  if (!latest) return null;
  const body = await readBlob(latest.pathname);
  return body === null ? null : parsePublished(body);
}

export async function listVersions(): Promise<Array<{ pathname: string; uploadedAt: string }>> {
  // ponytail: JSON versions are tiny and intentionally retained; prune only if publish history becomes material.
  return (await blobsByRecency(VERSION_PREFIX))
    .slice(0, 5)
    .map(({ pathname, uploadedAt }) => ({ pathname, uploadedAt: uploadedAt.toISOString() }));
}

async function blobsByRecency(prefix: string) {
  let cursor: string | undefined;
  let blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  do {
    const page = await list({ prefix, limit: 1000, cursor });
    blobs = [...blobs, ...page.blobs];
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}

async function pruneDrafts() {
  const oldDrafts = (await blobsByRecency(DRAFT_PREFIX)).slice(5).map((blob) => blob.pathname);
  if (oldDrafts.length) await del(oldDrafts);
}

export async function loadVersion(version: string): Promise<PublishedContent> {
  if (!isVersionPath(version)) throw new Error("Invalid version path");
  const body = await readBlob(version);
  if (body === null) throw new Error("Version not found");
  return parsePublished(body);
}

function draftKey(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "", "memory-waypoints/draft/v1", 32));
}

function draftEncryptionSecret(): string {
  const secret = process.env.DRAFT_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("DRAFT_ENCRYPTION_KEY must contain at least 32 characters");
  }
  return secret;
}

async function readBlob(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "public", useCache: false });
  if (result === null || result.statusCode !== 200) return null;
  return new Response(result.stream).text();
}

function parsePublished(body: string): PublishedContent {
  const content = JSON.parse(body) as Partial<PublishedContent>;
  if (
    !Array.isArray(content.trips) ||
    typeof content.publishedAt !== "string" ||
    typeof content.version !== "string" ||
    !isVersionPath(content.version)
  ) {
    throw new Error("Invalid published content");
  }
  return content as PublishedContent;
}

function isVersionPath(value: string): boolean {
  return new RegExp(`^${VERSION_PREFIX}[A-Za-z0-9._-]+\\.json$`).test(value);
}
