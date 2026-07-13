import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("production build contains the memory story and no starter UI", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  const scriptNames = assets.filter((name) => name.endsWith(".js"));
  assert.ok(scriptNames.length, "expected built JavaScript assets");
  const script = (await Promise.all(scriptNames.map((name) => readFile(new URL(`../dist/assets/${name}`, import.meta.url), "utf8")))).join("\n");

  assert.match(html, /我们的旅行坐标/);
  assert.match(script, /海边的周末/);
  assert.match(script, /打开回忆/);
  assert.match(script, /audio\/moonlight\.mp3/);
  assert.match(script, /暂停背景音乐《Moonlight》/);
  assert.match(script, /Scott Buckley/);
  assert.doesNotMatch(script, /spotify:track:|点击开启背景音乐/);
  assert.doesNotMatch(`${html}${script}`, /Your site is taking shape|codex-preview|SkeletonPreview/);
});

test("production build ships the complete local soundtrack", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const audio = await readFile(new URL("../dist/audio/moonlight.mp3", import.meta.url));
  assert.match(app, /<audio[^>]*autoPlay[^>]*loop[^>]*>/);
  assert.ok(audio.byteLength > 9_000_000, "expected the full Moonlight MP3");
});

test("mobile tickets are capped to the viewport and recentered", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const mobileRules = css.slice(css.indexOf("@media (max-width: 760px)"), css.indexOf("@media (max-width: 430px)"));

  assert.match(mobileRules, /\.ticket-slot\s*\{[^}]*width:\s*min\(var\(--ticket-width\),\s*calc\(100vw - 32px\)\)/s);
  assert.match(mobileRules, /\.ticket-slot\s*\{[^}]*margin-inline:\s*auto/s);
});

test("production build includes the private travel editor without replacing the public story", async () => {
  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  const scriptNames = assets.filter((name) => name.endsWith(".js"));
  assert.ok(scriptNames.length, "expected built JavaScript assets");
  const script = (await Promise.all(scriptNames.map((name) => readFile(new URL(`../dist/assets/${name}`, import.meta.url), "utf8")))).join("\n");

  assert.match(script, /旅行管理台/);
  assert.match(script, /上传 GPX 或 GeoJSON/);
  assert.match(script, /发布到网站/);
  assert.match(script, /我们的旅行坐标/);
});

test("published trips immediately select the first map chapter", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(app, /loadPublishedTrips[\s\S]*setTrips\(published\);[\s\S]*setActiveId\(sortTrips\(published, "newest"\)\[0\]\.id\)/);
});

test("admin keeps the full editor on desktop and a focused quick-upload surface on mobile", async () => {
  const css = await readFile(new URL("../src/admin/admin.css", import.meta.url), "utf8");

  assert.match(css, /\.admin-mobile-quick\s*\{[^}]*display:\s*none/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.admin-desktop-shell\s*\{[^}]*display:\s*none/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.admin-mobile-quick\s*\{[^}]*display:\s*flex/s);
});
