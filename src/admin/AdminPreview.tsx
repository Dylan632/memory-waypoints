import { useEffect, useRef, useState, type CSSProperties } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import type { Ticket, Trip } from "../data";
import { TicketArtwork } from "../components/Ticket";
import { routeBounds, routeFeature } from "../lib/trips";

const SOURCE = "admin-preview-route";
const LINE = "admin-preview-line";

function previewRoute(route: Trip["route"]) {
  return route.length >= 2 ? routeFeature(route) : { type: "FeatureCollection" as const, features: [] };
}

export function AdminPreview({ trip, ticket }: { trip: Trip; ticket?: Ticket }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: trip.route[0] ?? [104, 35],
      zoom: trip.route.length >= 2 ? 5 : 2.8,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    map.on("load", () => {
      map.addSource(SOURCE, { type: "geojson", data: previewRoute(trip.route) });
      map.addLayer({ id: LINE, type: "line", source: SOURCE, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": trip.routeColor, "line-width": 3.2, "line-opacity": .95 } });
      mapRef.current = map;
      setReady(true);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource(SOURCE) as GeoJSONSource).setData(previewRoute(trip.route));
    map.setPaintProperty(LINE, "line-color", trip.routeColor);
    if (trip.route.length >= 2) map.fitBounds(routeBounds(trip.route), { padding: 46, maxZoom: 11, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500 });
  }, [ready, trip.route, trip.routeColor]);

  const ticketStyle = ticket ? {
    "--ticket-width": "100%",
    "--ticket-ratio": String(ticket.ratio),
  } as CSSProperties : undefined;

  return <aside className="admin-preview" aria-label="网站实时预览">
    <header>
      <div><span>实时预览</span><strong>{trip.destination || "未命名旅行"}</strong></div>
      <div className="admin-preview-toggle" aria-label="预览尺寸">
        <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)}>桌面</button>
        <button type="button" aria-pressed={phone} onClick={() => setPhone(true)}>手机</button>
      </div>
    </header>
    <div className={`admin-preview-frame${phone ? " is-phone" : ""}`}>
      <div className={`admin-preview-map map-stage--${trip.mapTone}`} ref={containerRef} />
      <div className="admin-preview-shade" />
      <div className="admin-preview-story">
        <p>{trip.country || "旅行地点"} · {trip.dateLabel || trip.startDate}</p>
        <h2>{trip.destination || "未命名旅行"}</h2>
        {ticket ? <div className="admin-preview-ticket" style={ticketStyle}><TicketArtwork ticket={ticket} /></div> : <div className="admin-preview-placeholder">加入票根后会显示在这里</div>}
      </div>
    </div>
    <p className="admin-preview-note">这里显示内容和比例，最终滚动动画会沿用公开网站现有效果。</p>
  </aside>;
}
