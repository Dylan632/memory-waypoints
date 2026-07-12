import assert from "node:assert/strict";
import test from "node:test";

import { routeBounds, routeFeature, sortTrips } from "../src/lib/trips.ts";

const older = { id: "older", startDate: "2024-02-10" };
const newer = { id: "newer", startDate: "2025-09-03" };

test("sortTrips returns newest or oldest without mutating input", () => {
  const source = [older, newer];
  assert.deepEqual(sortTrips(source, "newest").map((trip) => trip.id), ["newer", "older"]);
  assert.deepEqual(sortTrips(source, "oldest").map((trip) => trip.id), ["older", "newer"]);
  assert.deepEqual(source.map((trip) => trip.id), ["older", "newer"]);
});

test("routeFeature creates a GeoJSON LineString", () => {
  const coordinates = [[118.08, 24.46], [118.15, 24.51]];
  assert.deepEqual(routeFeature(coordinates), {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates },
  });
});

test("routeBounds returns southwest and northeast corners", () => {
  assert.deepEqual(routeBounds([[118.2, 24.5], [117.9, 24.7], [118.1, 24.3]]), [[117.9, 24.3], [118.2, 24.7]]);
});
