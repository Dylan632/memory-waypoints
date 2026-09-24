export type LngLat = [number, number];

/** One day of travel. The original draws each day as its own line, so gaps
 *  between days (nights, flights) stay honest instead of being bridged. */
export type RouteDay = { date: string; coordinates: LngLat[] };

export type TicketEntry = {
  id: string;
  /** Key into the ticket component registry. */
  kind: string;
  /** Props for that ticket component: whatever the physical ticket prints. */
  face: Record<string, string>;
  /** Width on desktop, in CSS px. Phones cap it to the viewport. */
  width: number;
  /** Width / height of the physical ticket. */
  ratio: number;
  rotate?: number;
  title: string;
  essay: string;
  photos: string[];
};

export type Trip = {
  id: string;
  title: string;
  place: string;
  start: string;
  end: string;
  route: RouteDay[];
  tickets: TicketEntry[];
};

export type SortOrder = "newest" | "oldest";

export function sortTrips(trips: Trip[], order: SortOrder): Trip[] {
  const sorted = [...trips].sort((a, b) => a.start.localeCompare(b.start));
  return order === "newest" ? sorted.reverse() : sorted;
}

export function routeGeoJSON(trip: Trip) {
  return {
    type: "FeatureCollection" as const,
    features: trip.route.map((day) => ({
      type: "Feature" as const,
      properties: { date: day.date },
      geometry: { type: "LineString" as const, coordinates: day.coordinates },
    })),
  };
}

/** South-west and north-east corners of every point in the trip. */
export function routeBounds(trip: Trip): [LngLat, LngLat] {
  const points = trip.route.flatMap((day) => day.coordinates);
  if (!points.length) throw new Error(`Trip "${trip.id}" has no route points`);
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

/** "2025年6月20日 – 6月23日", dropping whatever the end date repeats. */
export function formatDateRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const head = `${sy}年${sm}月${sd}日`;
  if (start === end) return head;
  if (sy !== ey) return `${head} – ${ey}年${em}月${ed}日`;
  if (sm !== em) return `${head} – ${em}月${ed}日`;
  return `${head} – ${ed}日`;
}
