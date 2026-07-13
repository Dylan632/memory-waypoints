import { useEffect, useRef, useState, type ChangeEvent } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { parseRouteText } from "../lib/content";
import { routeBounds, routeFeature, type Coordinate } from "../lib/trips";

const SOURCE_ID = "route-editor-route";
const LINE_ID = "route-editor-line";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type RouteEditorProps = {
  route: Coordinate[];
  color: string;
  onChange(next: Coordinate[]): void;
};

function routeData(route: Coordinate[]) {
  return route.length >= 2
    ? routeFeature(route)
    : { type: "FeatureCollection" as const, features: [] };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RouteEditor({ route, color, onChange }: RouteEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const routeRef = useRef(route);
  const onChangeRef = useRef(onChange);
  const addModeRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [error, setError] = useState("");

  routeRef.current = route;
  onChangeRef.current = onChange;
  addModeRef.current = addMode;

  const fitRoute = (next: Coordinate[]) => {
    if (next.length < 2 || !mapRef.current) return;
    mapRef.current.fitBounds(routeBounds(next), {
      padding: 64,
      maxZoom: 14,
      duration: prefersReducedMotion() ? 0 : 600,
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: route[0] ?? [118.08, 24.46],
      zoom: route.length ? 11 : 4,
      attributionControl: false,
      fadeDuration: prefersReducedMotion() ? 0 : 300,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.on("click", ({ lngLat }) => {
      if (!addModeRef.current) return;
      onChangeRef.current([...routeRef.current, [lngLat.lng, lngLat.lat]]);
    });
    map.on("load", () => {
      map.addSource(SOURCE_ID, { type: "geojson", data: routeData(routeRef.current) });
      map.addLayer({
        id: LINE_ID,
        type: "line",
        source: SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": color, "line-width": 4, "line-opacity": 0.92 },
      });
      mapRef.current = map;
      setReady(true);
      fitRoute(routeRef.current);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    (map.getSource(SOURCE_ID) as GeoJSONSource).setData(routeData(route));
    map.setPaintProperty(LINE_ID, "line-color", color);
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = route.map((coordinate, index) => {
      const marker = new maplibregl.Marker({ color, draggable: true, scale: 0.72 })
        .setLngLat(coordinate)
        .addTo(map);
      const element = marker.getElement();
      element.classList.add("route-editor__marker");
      element.setAttribute("aria-label", `途经点 ${index + 1}，可拖动调整位置`);
      element.setAttribute("title", `途经点 ${index + 1}`);
      marker.on("drag", () => {
        const { lng, lat } = marker.getLngLat();
        const preview = routeRef.current.map((point, pointIndex) =>
          pointIndex === index ? [lng, lat] as Coordinate : point);
        (map.getSource(SOURCE_ID) as GeoJSONSource).setData(routeData(preview));
      });
      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat();
        onChangeRef.current(routeRef.current.map((point, pointIndex) =>
          pointIndex === index ? [lng, lat] : point));
      });
      return marker;
    });
  }, [color, ready, route]);

  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = addMode ? "crosshair" : "";
  }, [addMode, ready]);

  const importRoute = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setError("");
    try {
      if (file.size > MAX_FILE_SIZE) throw new Error("轨迹文件不能超过 10 MB");
      const next = parseRouteText(await file.text(), file.name);
      onChange(next);
      window.requestAnimationFrame(() => fitRoute(next));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取这个轨迹文件");
    }
  };

  const removePoint = (index: number) => {
    onChange(route.filter((_, pointIndex) => pointIndex !== index));
  };

  const movePoint = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= route.length) return;
    const next = [...route];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <section className="route-editor" aria-labelledby="route-editor-title">
      <header className="route-editor__header">
        <div>
          <p className="route-editor__eyebrow">旅行轨迹</p>
          <h2 id="route-editor-title" className="route-editor__title">在地图上整理这段路</h2>
          <p className="route-editor__summary" aria-live="polite">当前共 {route.length} 个途经点</p>
        </div>
        <div className="route-editor__actions">
          <label className="route-editor__upload">
            <span>导入轨迹</span>
            <input
              className="route-editor__file-input"
              type="file"
              accept=".gpx,.geojson,.json,application/geo+json,application/json"
              onChange={importRoute}
            />
          </label>
          <button
            className={`route-editor__mode-button${addMode ? " is-active" : ""}`}
            type="button"
            aria-pressed={addMode}
            onClick={() => setAddMode((active) => !active)}
          >
            {addMode ? "结束添加" : "添加途经点"}
          </button>
          <button
            className="route-editor__fit-button"
            type="button"
            disabled={route.length < 2 || !ready}
            onClick={() => fitRoute(route)}
          >
            校正地图范围
          </button>
        </div>
      </header>

      {addMode && <p className="route-editor__hint">点击地图即可依次添加途经点。</p>}
      {error && <p className="route-editor__error" role="alert">{error}</p>}

      <div className="route-editor__map-frame">
        <div ref={containerRef} className="route-editor__map" aria-label="旅行轨迹编辑地图" />
      </div>

      <div className="route-editor__points">
        <div className="route-editor__points-header">
          <h3>途经点顺序</h3>
          <p>拖动地图标记可微调位置，也可以在这里调整先后顺序。</p>
        </div>
        {route.length === 0 ? (
          <p className="route-editor__empty">先导入轨迹文件，或开启“添加途经点”后点击地图。</p>
        ) : (
          <ol className="route-editor__point-list">
            {route.map(([longitude, latitude], index) => (
              <li className="route-editor__point" key={`${index}-${longitude}-${latitude}`}>
                <span className="route-editor__point-index" aria-hidden="true">{index + 1}</span>
                <span className="route-editor__coordinate">
                  <span>经度 {longitude.toFixed(5)}</span>
                  <span>纬度 {latitude.toFixed(5)}</span>
                </span>
                <span className="route-editor__point-actions">
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label={`将途经点 ${index + 1} 上移`}
                    onClick={() => movePoint(index, -1)}
                  >
                    上移
                  </button>
                  <button
                    type="button"
                    disabled={index === route.length - 1}
                    aria-label={`将途经点 ${index + 1} 下移`}
                    onClick={() => movePoint(index, 1)}
                  >
                    下移
                  </button>
                  <button
                    className="route-editor__delete-button"
                    type="button"
                    aria-label={`删除途经点 ${index + 1}`}
                    onClick={() => removePoint(index)}
                  >
                    删除
                  </button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
