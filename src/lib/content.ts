import type { TicketTemplateVariant, TicketVariant, Trip } from "../data.js";
import type { Coordinate } from "./trips.js";

type JsonRecord = Record<string, unknown>;
type FetchResponse = { ok: boolean; json(): Promise<unknown> };
type ContentFetcher = (url: string) => Promise<FetchResponse>;

const ID_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{0,99})$/i;
const COLOR_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const VARIANTS = new Set<TicketVariant>(["scenic", "rail", "museum", "cinema", "scan"]);
const MAP_TONES = new Set<Trip["mapTone"]>(["night", "paper", "mist"]);

function fail(path: string, message: string): never {
  throw new TypeError(`${path} ${message}`);
}

function record(value: unknown, path: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "must be an object");
  return value as JsonRecord;
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(path, "must be a non-empty string");
  return value;
}

function id(value: unknown, path: string): string {
  const result = text(value, path);
  if (!ID_PATTERN.test(result)) fail(path, "is not a valid id");
  return result;
}

function number(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "must be a finite number");
  return value;
}

function rangedNumber(value: unknown, path: string, minimum: number, maximum: number): number {
  const result = number(value, path);
  if (result < minimum || result > maximum) fail(path, `must be between ${minimum} and ${maximum}`);
  return result;
}

function color(value: unknown, path: string): void {
  if (typeof value !== "string" || !COLOR_PATTERN.test(value)) fail(path, "must be a hexadecimal color");
}

function url(value: unknown, path: string): void {
  const source = text(value, path);
  if (source.startsWith("/") && !source.startsWith("//")) return;
  try {
    const parsed = new URL(source);
    if (parsed.protocol !== "https:") fail(path, "must be an HTTPS URL or a root-relative path");
  } catch (error) {
    if (error instanceof TypeError && error.message.startsWith(path)) throw error;
    fail(path, "must be a valid URL");
  }
}

function coordinate(value: unknown, path: string): Coordinate {
  if (!Array.isArray(value) || value.length < 2) fail(path, "must contain longitude and latitude");
  const longitude = number(value[0], `${path} longitude`);
  const latitude = number(value[1], `${path} latitude`);
  if (longitude < -180 || longitude > 180) fail(`${path} longitude`, "must be between -180 and 180");
  if (latitude < -90 || latitude > 90) fail(`${path} latitude`, "must be between -90 and 90");
  return [longitude, latitude];
}

function route(value: unknown, path: string): Coordinate[] {
  if (!Array.isArray(value) || value.length < 2) fail(path, "must contain at least 2 coordinates");
  const points = value.map((point, index) => coordinate(point, `${path}[${index}]`));
  if (!points.some(([longitude, latitude]) => longitude !== points[0][0] || latitude !== points[0][1])) {
    fail(path, "must contain at least 2 distinct coordinates");
  }
  return points;
}

function isoDate(value: unknown, path: string): void {
  const source = text(value, path);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source);
  if (!match) fail(path, "must be a valid YYYY-MM-DD date");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== source) fail(path, "must be a valid YYYY-MM-DD date");
}

function validateTicket(value: unknown, path: string, ticketIds: Set<string>): void {
  const ticket = record(value, path);
  const ticketId = id(ticket.id, `${path}.id`);
  if (ticketIds.has(ticketId)) fail(`${path}.id`, `is a duplicate id: ${ticketId}`);
  ticketIds.add(ticketId);

  for (const field of ["title", "date", "story"] as const) {
    text(ticket[field], `${path}.${field}`);
  }
  if (typeof ticket.variant !== "string" || !VARIANTS.has(ticket.variant as TicketVariant)) {
    fail(`${path}.variant`, "is not a supported ticket variant");
  }
  if (ticket.templateVariant !== undefined && (
    typeof ticket.templateVariant !== "string" ||
    ticket.templateVariant === "scan" ||
    !VARIANTS.has(ticket.templateVariant as TicketTemplateVariant)
  )) fail(`${path}.templateVariant`, "is not a supported template variant");
  if (ticket.templateImage !== undefined && ticket.templateImage !== null) url(ticket.templateImage, `${path}.templateImage URL`);
  if (ticket.scanImage !== undefined) url(ticket.scanImage, `${path}.scanImage URL`);
  for (const field of ["subtitle", "serial", "price"] as const) {
    if (typeof ticket[field] !== "string") fail(`${path}.${field}`, "must be a string");
    if (ticket.variant !== "scan") text(ticket[field], `${path}.${field}`);
  }
  color(ticket.accent, `${path}.accent color`);
  rangedNumber(ticket.width, `${path}.width`, 220, 700);
  rangedNumber(ticket.ratio, `${path}.ratio`, .5, 5);
  if (ticket.templateRatio !== undefined) rangedNumber(ticket.templateRatio, `${path}.templateRatio`, .5, 5);
  if (ticket.scanRatio !== undefined) rangedNumber(ticket.scanRatio, `${path}.scanRatio`, .5, 5);
  rangedNumber(ticket.offset, `${path}.offset`, -500, 500);
  rangedNumber(ticket.rotation, `${path}.rotation`, -15, 15);
  if (ticket.image !== undefined) url(ticket.image, `${path}.image URL`);
  if (ticket.variant === "scan" && ticket.image === undefined && ticket.scanImage === undefined) fail(`${path}.image`, "is required for a scanned ticket");
  if (!Array.isArray(ticket.photos)) fail(`${path}.photos`, "must be an array");
  ticket.photos.forEach((photo, index) => url(photo, `${path}.photos[${index}] URL`));
}

export function validateTrips(input: unknown): Trip[] {
  if (!Array.isArray(input)) fail("content", "must be an array");
  if (input.length === 0) fail("content", "must contain at least one trip");

  const tripIds = new Set<string>();
  const ticketIds = new Set<string>();
  input.forEach((value, tripIndex) => {
    const path = `trips[${tripIndex}]`;
    const trip = record(value, path);
    const tripId = id(trip.id, `${path}.id`);
    if (tripIds.has(tripId)) fail(`${path}.id`, `is a duplicate id: ${tripId}`);
    tripIds.add(tripId);

    for (const field of ["destination", "country", "dateLabel"] as const) {
      text(trip[field], `${path}.${field}`);
    }
    isoDate(trip.startDate, `${path}.startDate`);
    color(trip.routeColor, `${path}.routeColor color`);
    if (typeof trip.mapTone !== "string" || !MAP_TONES.has(trip.mapTone as Trip["mapTone"])) {
      fail(`${path}.mapTone`, "is not supported");
    }
    route(trip.route, `${path}.route`);
    if (!Array.isArray(trip.tickets)) fail(`${path}.tickets`, "must be an array");
    trip.tickets.forEach((ticket, ticketIndex) => validateTicket(ticket, `${path}.tickets[${ticketIndex}]`, ticketIds));
  });

  return input as Trip[];
}

function geoJsonLines(value: unknown, path: string): unknown[][] {
  const item = record(value, path);
  if (item.type === "LineString") {
    if (!Array.isArray(item.coordinates)) fail(`${path}.coordinates`, "must be an array");
    return [item.coordinates];
  }
  if (item.type === "Feature") {
    if (item.geometry === null || item.geometry === undefined) return [];
    return geoJsonLines(item.geometry, `${path}.geometry`);
  }
  if (item.type === "FeatureCollection") {
    if (!Array.isArray(item.features)) fail(`${path}.features`, "must be an array");
    return item.features.flatMap((feature, index) => geoJsonLines(feature, `${path}.features[${index}]`));
  }
  return [];
}

function parseGeoJson(source: string): Coordinate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    fail("GeoJSON", "is not valid JSON");
  }
  const points = geoJsonLines(parsed, "GeoJSON").flat();
  return route(points, "route");
}

function attribute(source: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]+)"|'([^']+)')`, "i").exec(source);
  return match?.[1] ?? match?.[2];
}

function parseGpx(source: string): Coordinate[] {
  const points: Coordinate[] = [];
  const pointPattern = /<(?:[\w.-]+:)?(?:trkpt|rtept)\b([^>]*)>/gi;
  for (const match of source.matchAll(pointPattern)) {
    const latitude = attribute(match[1], "lat");
    const longitude = attribute(match[1], "lon");
    if (latitude === undefined || longitude === undefined) fail("GPX point", "must include lat and lon attributes");
    points.push(coordinate([Number(longitude), Number(latitude)], `GPX point[${points.length}]`));
  }
  return route(points, "route");
}

export function parseRouteText(source: string, fileName: string): Coordinate[] {
  if (typeof source !== "string" || source.trim() === "") fail("route file", "is empty");
  const trimmed = source.trim();
  const isJson = /\.(?:geo)?json$/i.test(fileName) || trimmed.startsWith("{") || trimmed.startsWith("[");
  return isJson ? parseGeoJson(trimmed) : parseGpx(trimmed);
}

export async function loadPublishedTrips(fallback: Trip[], fetcher?: ContentFetcher): Promise<Trip[]> {
  try {
    const response = await (fetcher ?? fetch)("/api/content");
    if (!response.ok) return fallback;
    const body = await response.json();
    const candidate = Array.isArray(body) ? body : record(body, "response").trips;
    return validateTrips(candidate);
  } catch {
    return fallback;
  }
}
