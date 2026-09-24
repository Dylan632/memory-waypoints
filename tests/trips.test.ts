import assert from "node:assert/strict";
import test from "node:test";
import { trips } from "../src/content/trips.ts";
import { ticketKinds } from "../src/components/tickets/index.tsx";
import { formatDateRange, routeBounds, routeGeoJSON, sortTrips, type Trip } from "../src/lib/trips.ts";

const trip = (id: string, start: string): Trip => ({
  id, title: id, place: "", start, end: start, tickets: [],
  route: [{ date: start, coordinates: [[120, 30], [121, 31]] }],
});

test("sortTrips orders by start date without mutating the input", () => {
  const input = [trip("b", "2024-05-01"), trip("c", "2025-01-01"), trip("a", "2023-09-01")];
  assert.deepEqual(sortTrips(input, "newest").map((t) => t.id), ["c", "b", "a"]);
  assert.deepEqual(sortTrips(input, "oldest").map((t) => t.id), ["a", "b", "c"]);
  assert.deepEqual(input.map((t) => t.id), ["b", "c", "a"]);
});

test("routeGeoJSON keeps each day as its own line so gaps between days stay open", () => {
  const multiDay: Trip = { ...trip("x", "2025-01-01"), route: [
    { date: "2025-01-01", coordinates: [[1, 1], [2, 2]] },
    { date: "2025-01-03", coordinates: [[9, 9], [10, 10]] },
  ] };
  const geo = routeGeoJSON(multiDay);
  assert.equal(geo.features.length, 2);
  assert.deepEqual(geo.features.map((f) => f.properties.date), ["2025-01-01", "2025-01-03"]);
  assert.deepEqual(geo.features[1].geometry.coordinates, [[9, 9], [10, 10]]);
});

test("routeBounds spans every day's points", () => {
  const multiDay: Trip = { ...trip("x", "2025-01-01"), route: [
    { date: "a", coordinates: [[118, 24.5], [118.2, 24.4]] },
    { date: "b", coordinates: [[117.9, 24.6]] },
  ] };
  assert.deepEqual(routeBounds(multiDay), [[117.9, 24.4], [118.2, 24.6]]);
  assert.throws(() => routeBounds({ ...multiDay, route: [] }), /no route points/);
});

test("formatDateRange drops whatever the end date repeats", () => {
  assert.equal(formatDateRange("2025-06-20", "2025-06-23"), "2025年6月20日 – 23日");
  assert.equal(formatDateRange("2024-10-30", "2024-11-02"), "2024年10月30日 – 11月2日");
  assert.equal(formatDateRange("2024-12-30", "2025-01-02"), "2024年12月30日 – 2025年1月2日");
  assert.equal(formatDateRange("2025-06-20", "2025-06-20"), "2025年6月20日");
});

test("every trip is renderable: unique ids, real routes, registered ticket kinds", () => {
  const ids = new Set<string>();
  for (const t of trips) {
    assert.ok(!ids.has(t.id), `duplicate trip id ${t.id}`); ids.add(t.id);
    assert.ok(t.start <= t.end, `${t.id} ends before it starts`);
    assert.ok(t.route.length > 0 && t.route.every((day) => day.coordinates.length >= 2), `${t.id} needs at least one day with two points`);
    for (const [lng, lat] of t.route.flatMap((day) => day.coordinates)) assert.ok(Math.abs(lng) <= 180 && Math.abs(lat) <= 90, `${t.id} has an out-of-range point`);
    for (const ticket of t.tickets) {
      assert.ok(!ids.has(ticket.id), `duplicate id ${ticket.id}`); ids.add(ticket.id);
      assert.ok(ticketKinds.includes(ticket.kind), `${ticket.id} uses unregistered kind "${ticket.kind}"`);
      assert.ok(ticket.width > 0 && ticket.ratio > 0, `${ticket.id} needs a width and ratio`);
    }
  }
});
