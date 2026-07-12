import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("production build contains the memory story and no starter UI", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  const scriptName = assets.find((name) => name.endsWith(".js"));
  assert.ok(scriptName, "expected a built JavaScript asset");
  const script = await readFile(new URL(`../dist/assets/${scriptName}`, import.meta.url), "utf8");

  assert.match(html, /我们的旅行坐标/);
  assert.match(script, /海边的周末/);
  assert.match(script, /打开回忆/);
  assert.doesNotMatch(`${html}${script}`, /Your site is taking shape|codex-preview|SkeletonPreview/);
});
