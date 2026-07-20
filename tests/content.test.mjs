import assert from "node:assert/strict";
import test from "node:test";

import { switchTicketMode, ticketScanImage, ticketTemplateImage } from "../src/data.ts";
import { loadPublishedTrips, parseRouteText, validateTrips } from "../src/lib/content.ts";

const validTrips = [
  {
    id: "hangzhou-2026",
    destination: "春天的西湖",
    country: "杭州",
    dateLabel: "2026年4月3日 – 4月5日",
    startDate: "2026-04-03",
    routeColor: "#c56f4a",
    mapTone: "paper",
    route: [[120.13, 30.25], [120.16, 30.27]],
    tickets: [
      {
        id: "lake-ticket",
        title: "西湖游船",
        subtitle: "WEST LAKE",
        serial: "HZ-0403",
        date: "2026.04.03",
        price: "双人票",
        variant: "scan",
        accent: "#315c64",
        width: 420,
        ratio: 2.1,
        offset: 0,
        rotation: -1.5,
        image: "https://example.com/ticket.webp",
        story: "傍晚一起坐船。",
        photos: ["https://example.com/lake.jpg"],
      },
    ],
  },
];

const clone = () => structuredClone(validTrips);

test("validateTrips accepts a complete trip including scanned tickets", () => {
  assert.deepEqual(validateTrips(clone()), validTrips);
  const scanWithoutTemplateMetadata = clone();
  scanWithoutTemplateMetadata[0].tickets[0].subtitle = "";
  scanWithoutTemplateMetadata[0].tickets[0].serial = "";
  scanWithoutTemplateMetadata[0].tickets[0].price = "";
  assert.doesNotThrow(() => validateTrips(scanWithoutTemplateMetadata));
});

test("ticket photos can switch back to their previous template style", () => {
  const template = { ...validTrips[0].tickets[0], variant: "scenic", ratio: 2.66, image: "https://example.com/background.jpg" };
  const scanMode = switchTicketMode(template, "scan");
  const scanned = { ...scanMode, image: "https://example.com/ticket.jpg", scanImage: "https://example.com/ticket.jpg", ratio: 1.1, scanRatio: 1.1 };
  const restored = switchTicketMode(scanned, "template");

  assert.equal(scanned.variant, "scan");
  assert.equal(scanned.templateVariant, "scenic");
  assert.equal(restored.variant, "scenic");
  assert.equal(restored.ratio, 2.66);
  assert.equal(ticketTemplateImage(restored), "https://example.com/background.jpg");
  assert.equal(ticketScanImage(restored), "https://example.com/ticket.jpg");
  assert.equal(switchTicketMode(restored, "scan").ratio, 1.1);

  const legacyScan = { ...scanned, templateVariant: undefined, templateImage: undefined, templateRatio: undefined, scanImage: undefined, scanRatio: undefined };
  const legacyRestored = switchTicketMode(legacyScan, "template");
  assert.equal(legacyRestored.variant, "museum");
  assert.equal(legacyRestored.ratio, 1.58);
  assert.equal(ticketTemplateImage(legacyRestored), undefined);
  assert.equal(ticketScanImage(legacyRestored), "https://example.com/ticket.jpg");
});

test("validateTrips rejects empty, unsafe, duplicate, and malformed content", () => {
  assert.throws(() => validateTrips([]), /at least one trip/i);
  assert.throws(() => validateTrips(null), /array/i);

  const invalidId = clone();
  invalidId[0].id = "../hangzhou";
  assert.throws(() => validateTrips(invalidId), /id/i);

  const duplicateTrip = [...clone(), ...clone()];
  assert.throws(() => validateTrips(duplicateTrip), /duplicate.*id/i);

  const duplicateTicket = clone();
  duplicateTicket[0].tickets.push(structuredClone(duplicateTicket[0].tickets[0]));
  assert.throws(() => validateTrips(duplicateTicket), /duplicate.*id/i);

  const shortRoute = clone();
  shortRoute[0].route = [[120.13, 30.25]];
  assert.throws(() => validateTrips(shortRoute), /at least 2/i);

  const badCoordinate = clone();
  badCoordinate[0].route[1] = [181, 30.27];
  assert.throws(() => validateTrips(badCoordinate), /longitude/i);

  const badUrl = clone();
  badUrl[0].tickets[0].photos = ["javascript:alert(1)"];
  assert.throws(() => validateTrips(badUrl), /url/i);

  const relativePhoto = clone();
  relativePhoto[0].tickets[0].photos = ["/memories/lake.jpg"];
  assert.doesNotThrow(() => validateTrips(relativePhoto));

  const badColor = clone();
  badColor[0].routeColor = "tomato";
  assert.throws(() => validateTrips(badColor), /color/i);

  const badSize = clone();
  badSize[0].tickets[0].width = 0;
  assert.throws(() => validateTrips(badSize), /width/i);

  const missingScan = clone();
  delete missingScan[0].tickets[0].image;
  assert.throws(() => validateTrips(missingScan), /image/i);

  const badTemplateVariant = clone();
  badTemplateVariant[0].tickets[0].templateVariant = "scan";
  assert.throws(() => validateTrips(badTemplateVariant), /templateVariant/i);

  const stationaryRoute = clone();
  stationaryRoute[0].route = [[120.13, 30.25], [120.13, 30.25]];
  assert.throws(() => validateTrips(stationaryRoute), /distinct/i);

  const badMotionPreset = clone();
  badMotionPreset[0].tickets[0].motionPreset = "shake-everything";
  assert.throws(() => validateTrips(badMotionPreset), /motionPreset/i);

  const landmarkMotion = clone();
  landmarkMotion[0].tickets[0].motionPreset = "landmarks";
  assert.doesNotThrow(() => validateTrips(landmarkMotion));

  const unsafeMotionLayer = clone();
  unsafeMotionLayer[0].tickets[0].foregroundImage = "javascript:alert(1)";
  assert.throws(() => validateTrips(unsafeMotionLayer), /foregroundImage/i);
});

test("parseRouteText reads GeoJSON LineString, Feature, and FeatureCollection", () => {
  const coordinates = [[120.1, 30.2], [120.2, 30.3]];
  assert.deepEqual(parseRouteText(JSON.stringify({ type: "LineString", coordinates }), "route.geojson"), coordinates);
  assert.deepEqual(parseRouteText(JSON.stringify({
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates },
  }), "route.json"), coordinates);
  assert.deepEqual(parseRouteText(JSON.stringify({
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [120, 30] } },
      { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } },
    ],
  }), "route.geojson"), coordinates);
});

test("parseRouteText reads common GPX track and route points", () => {
  const gpx = `<?xml version="1.0"?>
    <gpx><trk><trkseg>
      <trkpt lat="30.2500" lon="120.1300"><ele>4</ele></trkpt>
      <trkpt lat="30.2700" lon="120.1600" />
    </trkseg></trk></gpx>`;
  assert.deepEqual(parseRouteText(gpx, "walk.gpx"), [[120.13, 30.25], [120.16, 30.27]]);

  const route = `<gpx><rte><rtept lon='116.40' lat='39.90'/><rtept lon='116.42' lat='39.91'/></rte></gpx>`;
  assert.deepEqual(parseRouteText(route, "day.gpx"), [[116.4, 39.9], [116.42, 39.91]]);
});

test("parseRouteText rejects malformed or out-of-range routes", () => {
  assert.throws(() => parseRouteText("", "empty.gpx"), /empty/i);
  assert.throws(() => parseRouteText('{"type":"LineString","coordinates":[[0,0]]}', "short.geojson"), /at least 2/i);
  assert.throws(() => parseRouteText('<gpx><trkpt lat="95" lon="120"/><trkpt lat="30" lon="121"/></gpx>', "bad.gpx"), /latitude/i);
});

test("loadPublishedTrips loads /api/content and falls back on every failure", async () => {
  let requestedUrl;
  const loaded = await loadPublishedTrips([], async (url) => {
    requestedUrl = url;
    return { ok: true, json: async () => ({ trips: clone() }) };
  });
  assert.equal(requestedUrl, "/api/content");
  assert.deepEqual(loaded, validTrips);

  const direct = await loadPublishedTrips([], async () => ({ ok: true, json: async () => clone() }));
  assert.deepEqual(direct, validTrips);

  const fallback = clone();
  assert.strictEqual(await loadPublishedTrips(fallback, async () => { throw new Error("offline"); }), fallback);
  assert.strictEqual(await loadPublishedTrips(fallback, async () => ({ ok: false, json: async () => clone() })), fallback);
  assert.strictEqual(await loadPublishedTrips(fallback, async () => ({ ok: true, json: async () => ({ trips: [] }) })), fallback);
});
