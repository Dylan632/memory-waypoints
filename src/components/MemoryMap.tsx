import { useEffect, useRef, type CSSProperties } from "react";
import maplibregl from "maplibre-gl";
import type { Trip } from "../data";
import { routeBounds, routeFeature } from "../lib/trips";

const MAP_STYLES: Record<Trip["mapTone"], string> = {
  night: "https://tiles.openfreemap.org/styles/dark",
  mist: "https://tiles.openfreemap.org/styles/fiord",
  paper: "https://tiles.openfreemap.org/styles/positron",
};

export type MapScene = { from: Trip | null; to: Trip; progress: number };

export function MemoryMap({ scene, preload }: { scene: MapScene; preload?: Trip }) {
  const transitioning = scene.from && scene.from.id !== scene.to.id && scene.progress > 0 && scene.progress < 1;
  const visibleTrip = transitioning && scene.progress < .5 ? scene.from! : scene.to;

  return <div className="map-stage" aria-label={`当前地图：${visibleTrip.destination}`}>
    {transitioning && <MapLayer key={scene.from!.id} trip={scene.from!} opacity={1 - scene.progress} />}
    <MapLayer key={scene.to.id} trip={scene.to} opacity={transitioning ? scene.progress : 1} />
    {!transitioning && preload && <MapLayer key={preload.id} trip={preload} opacity={0} />}
    <div className="map-shade" />
    <div className="map-attribution">© OpenFreeMap · © OpenMapTiles · © OpenStreetMap</div>
    <div className="map-caption" aria-live="polite">
      <span>{visibleTrip.country}</span><strong>{visibleTrip.destination}</strong>
    </div>
  </div>;
}

function MapLayer({ trip, opacity }: { trip: Trip; opacity: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[trip.mapTone],
      center: trip.route[0],
      zoom: 10,
      attributionControl: false,
      interactive: false,
      fadeDuration: 0,
    });
    map.on("load", () => {
      map.addSource("memory-route", { type: "geojson", data: routeFeature(trip.route) });
      map.addLayer({ id: "memory-route-glow", type: "line", source: "memory-route", paint: { "line-color": trip.routeColor, "line-width": 9, "line-opacity": .2, "line-blur": 4 } });
      map.addLayer({ id: "memory-route-line", type: "line", source: "memory-route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": trip.routeColor, "line-width": 3.4, "line-opacity": .96 } });
      map.fitBounds(routeBounds(trip.route), { padding: window.innerWidth <= 760 ? 36 : 60, duration: 0, maxZoom: 11.5 });
    });
    return () => map.remove();
  }, [trip]);

  return <div className={`map-layer map-layer--${trip.mapTone}`} style={{ "--map-opacity": opacity } as CSSProperties}>
    <div ref={containerRef} className="map-canvas" />
  </div>;
}
