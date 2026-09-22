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

test("tickets are capped to the viewport and recentered on mobile", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const mobileRules = css.slice(css.indexOf("@media (max-width: 760px)"), css.indexOf("@media (max-width: 430px)"));

  assert.match(css, /\.ticket-slot\s*\{[^}]*width:\s*min\(var\(--ticket-width\),\s*calc\(100vw - 32px\)\)/s);
  assert.match(mobileRules, /\.ticket-slot\s*\{[^}]*left:\s*0/s);
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

test("admin ships one responsive editor instead of a crippled mobile surface", async () => {
  const css = await readFile(new URL("../src/admin/admin.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/admin/AdminApp.tsx", import.meta.url), "utf8");

  // The old build hid the whole editor below 760px and swapped in an
  // upload-only surface, so titles, dates and stories could not be edited
  // from a phone at all. One tree now serves both.
  assert.doesNotMatch(css, /admin-mobile-quick/);
  assert.doesNotMatch(app, /MobileQuickUpload/);
  assert.doesNotMatch(css, /\.admin-shell\s*\{[^}]*display:\s*none/s);

  // The phone breakpoint restacks the shell rather than removing it.
  const phone = css.slice(css.indexOf("@media (max-width: 860px)"));
  assert.match(phone, /\.admin-shell\s*\{[^}]*grid-template:/s);
  assert.match(phone, /\.ticket-editor\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);

  // Every editor section stays reachable from the same step nav.
  for (const label of ["基本信息", "旅行轨迹", "票根与照片", "预览与发布"]) {
    assert.match(app, new RegExp(label));
  }
});

test("admin uses the warm notebook palette from DESIGN.md, defined once as tokens", async () => {
  const tokens = await readFile(new URL("../src/tokens.css", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/admin/admin.css", import.meta.url), "utf8");

  // DESIGN.md specifies a warm paper desk. The previous build had drifted to a
  // navy corporate dashboard that contradicted its own design doc.
  assert.match(tokens, /--admin-canvas:\s*oklch\(95% \.018 86\)/);
  assert.match(tokens, /--admin-paper:\s*oklch\(98% \.012 86\)/);
  assert.match(tokens, /--admin-accent:\s*oklch\(57% \.13 42\)/);
  assert.doesNotMatch(css, /#1b365d/i);

  // Colors live in the token layer only — no literals scattered through rules.
  const literals = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/#[0-9a-f]{3,8}\b/gi) ?? [];
  assert.deepEqual(literals, [], `expected no raw hex colors in admin.css, found ${literals.join(", ")}`);

  // Panels, rail and preview all draw from the same warm family.
  assert.match(css, /\.admin-rail\s*\{[^}]*background:\s*var\(--admin-rail\)/s);
  assert.match(css, /\.admin-panel\s*\{[^}]*background:\s*var\(--admin-paper\)/s);
  assert.match(css, /\.admin-primary\s*\{[^}]*background:\s*var\(--admin-accent\)/s);
});

test("ticket type scales with the ticket, not with the browser window", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  // vw-based type rendered a 300px ticket and a 1040px ticket at the same size,
  // which overflowed narrow tickets and broke the admin preview outright.
  assert.match(css, /\.ticket-art\s*\{[^}]*container-type:\s*inline-size/s);
  const ticketRules = css.slice(css.indexOf(".ticket-art {"), css.indexOf(".ticket-label {"));
  const viewportType = ticketRules.match(/font(-size)?:[^;]*\bvw\b[^;]*/g) ?? [];
  assert.deepEqual(viewportType, [], `ticket type must not use vw, found ${viewportType.join(" / ")}`);
  assert.match(css, /\.ticket-body strong\s*\{[^}]*font-size:\s*clamp\([^)]*cqw/s);

  // A pathological title clips inside the ticket instead of spilling out of it.
  assert.match(css, /\.ticket-body strong\s*\{[^}]*line-clamp:\s*3/s);
  assert.match(css, /\.ticket-body\s*\{[^}]*overflow:\s*hidden/s);
});

test("ticket motion is visible or absent, never sub-pixel idle animation", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const ticket = await readFile(new URL("../src/components/Ticket.tsx", import.meta.url), "utf8");
  const eastLakeWheel = await readFile(new URL("../public/memories/east-lake-eye/wheel.jpg", import.meta.url));

  // These ran forever on every template ticket with a largest step of 0.45px:
  // a permanent compositor cost for motion nobody can see.
  for (const dead of ["ticket-ink-drift-a", "ticket-ink-drift-b", "ticket-ink-drift-c",
                      "ticket-print-drift", "ticket-bar-pulse", "ticket-pattern-wander",
                      "ticket-scan-drift"]) {
    assert.doesNotMatch(css, new RegExp(`@keyframes\\s+${dead}\\b`), `${dead} should be gone`);
  }
  // Four full-resolution copies of the ticket photo existed only to carry them.
  assert.doesNotMatch(ticket, /ticket-scan-landmark-copy-/);

  // Pointer parallax survives as a plain transform.
  assert.match(css, /transform:\s*translate3d\(var\(--ticket-ink-x\)/);
  assert.match(css, /transform:\s*translate3d\(var\(--ticket-print-x\)/);
  assert.match(ticket, /setProperty\("--ticket-ink-x"/);
  assert.match(ticket, /setProperty\("--ticket-print-x"/);

  // The motion presets the admin offers still resolve to real animations.
  for (const live of ["ticket-scan-portrait-a", "ticket-scan-landscape-b", "ticket-scan-figure-float",
                      "ticket-scan-stamp-turn", "ticket-landmark-wheel-turn", "ticket-landmark-walk",
                      "ticket-east-lake-wheel-turn", "ticket-east-lake-sunlight-shimmer"]) {
    assert.match(css, new RegExp(`@keyframes\\s+${live}\\b`), `${live} should remain`);
  }
  assert.match(css, /ticket-scan-landmark-wheel/);
  assert.match(css, /\.ticket-art--scan-landscape \.ticket-scan-motion-layer--a\s*\{[^}]*mask-image:\s*radial-gradient/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/);

  assert.match(ticket, /ticket\.ratio\s*<\s*1\s*\?\s*"portrait"\s*:\s*"landscape"/);
  assert.match(ticket, /ticket-scan-motion-layer--a/);
  assert.match(ticket, /ticket-scan-motion-layer--b/);
  assert.match(ticket, /isEastLakeEye\s*\?\s*"tilt"\s*:\s*ticket\.motionPreset/);
  assert.match(ticket, /east-lake-eye-ticket-2021"\s*\?\s*1040\s*:\s*ticket\.width/);
  assert.match(ticket, /ticket-east-lake-wheel/);
  assert.match(ticket, /ticket-east-lake-sunlight/);
  assert.match(ticket, /memories\/east-lake-eye\/wheel\.jpg/);
  assert.match(css, /ticket-east-lake-wheel-clean/);
  assert.ok(eastLakeWheel.byteLength > 10_000, "expected the East Lake wheel artwork");
  assert.doesNotMatch(ticket, /ticket-east-lake-(yellow|green|walker|diver|copy)/);
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
