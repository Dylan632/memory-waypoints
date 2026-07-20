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
  assert.match(script, /i\.y\.qq\.com\/n2\/m\/outchain\/player\/index\.html\?songid=101819133&songtype=0/);
  assert.match(script, /QQ 音乐播放器：《To April》—高姗/);
  assert.doesNotMatch(script, /spotify:track:|Moonlight|点击开启背景音乐/);
  assert.doesNotMatch(`${html}${script}`, /Your site is taking shape|codex-preview|SkeletonPreview/);
});

test("production build embeds the official To April player", async () => {
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.match(app, /<iframe[\s\S]*allow="autoplay; encrypted-media"/);
  assert.match(app, /To April/);
  assert.match(app, /aria-controls="qq-music-panel"/);
  assert.match(app, /aria-expanded=\{isOpen\}/);
  assert.match(app, /aria-hidden=\{!isOpen\}/);
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

test("scrolling reuses one map and eases it to the next trip", async () => {
  const map = await readFile(new URL("../src/components/MemoryMap.tsx", import.meta.url), "utf8");

  assert.match(map, /map\.fitBounds[\s\S]*duration: reduced \? 0 : 1150/);
  assert.match(map, /map-veil/);
  assert.doesNotMatch(map, /MapScene|map-layer/);
});

test("admin keeps the full editor on desktop and a focused quick-upload surface on mobile", async () => {
  const css = await readFile(new URL("../src/admin/admin.css", import.meta.url), "utf8");

  assert.match(css, /\.admin-mobile-quick\s*\{[^}]*display:\s*none/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.admin-desktop-shell\s*\{[^}]*display:\s*none/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.admin-mobile-quick\s*\{[^}]*display:\s*flex/s);
});

test("admin uses the warm Kami palette with restrained ink-blue actions", async () => {
  const css = await readFile(new URL("../src/admin/admin.css", import.meta.url), "utf8");

  assert.match(css, /--admin-canvas:\s*#f5f4ed/);
  assert.match(css, /--admin-paper:\s*#faf9f5/);
  assert.match(css, /--admin-accent:\s*#1b365d/);
  assert.match(css, /--admin-rail:\s*#1b365d/);
  assert.match(css, /\.admin-primary,[\s\S]*background:\s*var\(--admin-accent\)/);
  assert.match(css, /\.admin-trip-sidebar\s*\{[^}]*background:\s*var\(--admin-rail\)/s);
  assert.match(css, /\.admin-workspace-content\s*>\s*\*\s*\{[^}]*background:\s*var\(--admin-paper\)/s);
});

test("ticket ink, artwork and scans have independent restrained motion", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const ticket = await readFile(new URL("../src/components/Ticket.tsx", import.meta.url), "utf8");

  assert.match(css, /@keyframes\s+ticket-ink-drift-a/);
  assert.match(css, /@keyframes\s+ticket-print-drift/);
  assert.match(css, /@keyframes\s+ticket-pattern-wander/);
  assert.match(css, /\.ticket-scan-base\s*\{[^}]*animation:\s*ticket-scan-drift/s);
  assert.match(css, /@keyframes\s+ticket-scan-portrait-a/);
  assert.match(css, /@keyframes\s+ticket-scan-landscape-b/);
  assert.match(css, /@keyframes\s+ticket-landmark-wheel-turn/);
  assert.match(css, /@keyframes\s+ticket-landmark-walk/);
  assert.match(css, /ticket-scan-landmark-wheel/);
  assert.match(css, /\.ticket-art--scan-landscape \.ticket-scan-motion-layer--a\s*\{[^}]*mask-image:\s*radial-gradient/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/);
  assert.match(ticket, /ticket\.ratio\s*<\s*1\s*\?\s*"portrait"\s*:\s*"landscape"/);
  assert.match(ticket, /ticket-scan-motion-layer--a/);
  assert.match(ticket, /ticket-scan-motion-layer--b/);
  assert.match(ticket, /setProperty\("--ticket-ink-x"/);
  assert.match(ticket, /setProperty\("--ticket-print-x"/);
});

test("admin can choose uploaded ticket motion and add optional artwork layers", async () => {
  const editor = await readFile(new URL("../src/admin/TicketEditor.tsx", import.meta.url), "utf8");
  const ticket = await readFile(new URL("../src/components/Ticket.tsx", import.meta.url), "utf8");

  assert.match(editor, /票根动效/);
  assert.match(editor, /人物前景层/);
  assert.match(editor, /印章图层/);
  assert.match(editor, /东湖之眼（摩天轮与栈桥）/);
  assert.match(ticket, /ticket\.motionPreset\s*\?\?/);
  assert.match(ticket, /ticket\.foregroundImage/);
  assert.match(ticket, /ticket\.stampImage/);
  assert.match(ticket, /ticket-scan-landmark-wheel/);
  assert.match(ticket, /ticket-scan-landmark-walker-a/);
});
