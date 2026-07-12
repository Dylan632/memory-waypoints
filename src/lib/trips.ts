export type SortOrder = "newest" | "oldest";
export type Coordinate = [number, number];

export function sortTrips<T extends { startDate: string }>(trips: readonly T[], order: SortOrder): T[] {
  return [...trips].sort((a, b) => order === "newest"
    ? b.startDate.localeCompare(a.startDate)
    : a.startDate.localeCompare(b.startDate));
}

export function routeFeature(coordinates: Coordinate[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates },
  };
}

export function routeBounds(coordinates: Coordinate[]): [Coordinate, Coordinate] {
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}
