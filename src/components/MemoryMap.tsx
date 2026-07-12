import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import type { Trip } from "../data";
import { routeBounds, routeFeature } from "../lib/trips";

const SOURCE_ID = "memory-route";
const LINE_ID = "memory-route-line";
const GLOW_ID = "memory-route-glow";

export function MemoryMap({ trip }: { trip: Trip }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const routeRef = useRef(trip.route);
  const routeLineRef = useRef<SVGPolylineElement>(null);
  const [ready, setReady] = useState(false);
  const [veiled, setVeiled] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [118.08, 24.46],
      zoom: 10,
      attributionControl: false,
      interactive: false,
      fadeDuration: 0,
    });
    const syncRoute = () => {
      const points = routeRef.current.map((coordinate) => {
        const point = map.project(coordinate);
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      }).join(" ");
      routeLineRef.current?.setAttribute("points", points);
    };
    map.on("move", syncRoute);
    map.on("resize", syncRoute);
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.on("load", () => {
      map.addSource(SOURCE_ID, { type: "geojson", data: routeFeature(trip.route) });
      map.addLayer({ id: GLOW_ID, type: "line", source: SOURCE_ID, paint: { "line-color": trip.routeColor, "line-width": 8, "line-opacity": 0.18, "line-blur": 3 } });
      map.addLayer({ id: LINE_ID, type: "line", source: SOURCE_ID, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": trip.routeColor, "line-width": 3.2, "line-opacity": 0.94 } });
      mapRef.current = map;
      setReady(true);
      syncRoute();
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    routeRef.current = trip.route;
    setVeiled(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hideTimer = 0;
    const updateTimer = window.setTimeout(() => {
      (map.getSource(SOURCE_ID) as GeoJSONSource).setData(routeFeature(trip.route));
      map.setPaintProperty(LINE_ID, "line-color", trip.routeColor);
      map.setPaintProperty(GLOW_ID, "line-color", trip.routeColor);
      map.fitBounds(routeBounds(trip.route), {
        padding: window.innerWidth <= 760
          ? { top: 130, right: 42, bottom: 190, left: 42 }
          : { top: 100, right: 180, bottom: 100, left: 180 },
        duration: reduced ? 0 : 900,
        maxZoom: 11.5,
      });
      hideTimer = window.setTimeout(() => setVeiled(false), reduced ? 0 : 180);
    }, reduced ? 0 : 90);
    return () => { window.clearTimeout(updateTimer); window.clearTimeout(hideTimer); };
  }, [ready, trip]);

  return <div className={`map-stage map-stage--${trip.mapTone}`} aria-label={`当前地图：${trip.destination}`}>
    <div ref={containerRef} className="map-canvas" />
    <div className="map-shade" />
    <svg className="map-route" aria-hidden="true"><polyline ref={routeLineRef} style={{ stroke: trip.routeColor }} /></svg>
    <div className={`map-veil${veiled ? " is-visible" : ""}`} />
    <div className="map-caption" aria-live="polite">
      <span>{trip.country}</span><strong>{trip.destination}</strong>
    </div>
  </div>;
}
