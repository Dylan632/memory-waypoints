import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { routeBounds, routeGeoJSON, type Trip } from "../lib/trips";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const SOURCE = "route";

// Measured from the original: dark-v11 with no dimming overlay, and a route
// line of #ff7b3a at width 3 and 80% opacity. The route fills the viewport
// with about 60px to spare on its tighter axis.
const ROUTE_PAINT = { "line-color": "#ff7b3a", "line-width": 3, "line-opacity": 0.8 };
const FIT_PADDING = 60;

export function MapStage({ trip }: { trip: Trip }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!TOKEN) {
      console.warn("VITE_MAPBOX_TOKEN is not set; the map is hidden.");
      return;
    }
    const container = containerRef.current;
    let cancelled = false;
    // Mapbox is ~1.6 MB; load it after first paint so the story shows at once.
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled) return;
      mapboxgl.accessToken = TOKEN;
      const map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/dark-v11",
        bounds: routeBounds(trip),
        fitBoundsOptions: { padding: FIT_PADDING },
        interactive: false,
      });
      map.on("load", () => {
        map.addSource(SOURCE, { type: "geojson", data: routeGeoJSON(trip) });
        map.addLayer({ id: "route-line", type: "line", source: SOURCE, layout: { "line-join": "round", "line-cap": "round" }, paint: ROUTE_PAINT });
        setReady(true);
      });
      mapRef.current = map;
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; setReady(false); };
    // The map is created once; trip changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource(SOURCE) as GeoJSONSource).setData(routeGeoJSON(trip));
    // Camera motion is left at Mapbox's defaults until it has been measured
    // against the original site.
    map.fitBounds(routeBounds(trip), { padding: FIT_PADDING });
  }, [ready, trip]);

  return <div ref={containerRef} className="map-stage" aria-hidden="true" />;
}
