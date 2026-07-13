import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { trips as bundledTrips, type Trip } from "./data";
import { sortTrips, type SortOrder } from "./lib/trips";
import { loadPublishedTrips } from "./lib/content";
import { MemoryMap } from "./components/MemoryMap";
import { Notebook } from "./components/Notebook";
import { Ticket, type TicketSelection } from "./components/Ticket";

const AdminApp = lazy(() => import("./admin/AdminApp").then((module) => ({ default: module.AdminApp })));
const SPOTIFY_TRACK = "spotify:track:3ikk4wT6AIhOCtXBsZd0YO";
const SPOTIFY_URL = "https://open.spotify.com/track/3ikk4wT6AIhOCtXBsZd0YO";

type SpotifyController = {
  addListener(event: string, listener: () => void): void;
  play(): void;
  destroy(): void;
};

type SpotifyIframeApi = {
  createController(element: HTMLElement, options: { width: string; height: number; uri: string }, callback: (controller: SpotifyController) => void): void;
};

let spotifyApiPromise: Promise<SpotifyIframeApi> | undefined;

function loadSpotifyApi() {
  return spotifyApiPromise ??= new Promise<SpotifyIframeApi>((resolve, reject) => {
    (window as Window & { onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void }).onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => { spotifyApiPromise = undefined; script.remove(); reject(new Error("Spotify unavailable")); };
    document.body.append(script);
  });
}

export function App() {
  if (window.location.pathname.startsWith("/admin")) return <Suspense fallback={<main className="admin-loading"><span aria-hidden="true">⌖</span><p>正在打开旅行管理台</p></main>}><AdminApp fallbackTrips={bundledTrips} /></Suspense>;
  return <StoryApp />;
}

function StoryApp() {
  const [trips, setTrips] = useState<Trip[]>(bundledTrips);
  const [order, setOrder] = useState<SortOrder>("newest");
  const orderedTrips = useMemo(() => sortTrips(trips, order), [order, trips]);
  const [activeId, setActiveId] = useState(orderedTrips[0].id);
  const [selection, setSelection] = useState<TicketSelection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTrip: Trip = orderedTrips.find((trip) => trip.id === activeId) ?? orderedTrips[0];

  useEffect(() => {
    let current = true;
    void loadPublishedTrips(bundledTrips).then((published) => {
      if (!current) return;
      setTrips(published);
      setActiveId(sortTrips(published, "newest")[0].id);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!orderedTrips.some((trip) => trip.id === activeId)) setActiveId(orderedTrips[0].id);
  }, [activeId, orderedTrips]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActiveId((current.target as HTMLElement).dataset.tripId!);
    }, { root, rootMargin: "-52% 0px -18%", threshold: [0, .25, .5, .75, 1] });
    root.querySelectorAll<HTMLElement>("[data-trip-id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [orderedTrips]);

  function changeOrder(next: SortOrder) {
    if (next === order) return;
    const nextTrips = sortTrips(trips, next);
    setOrder(next);
    setActiveId(nextTrips[0].id);
    scrollRef.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return <>
    <a className="skip-link" href="#story">跳到旅行记录</a>
    <MemoryMap trip={activeTrip} />
    <SpotifySoundtrack />
    <div ref={scrollRef} className={`story-scroll${selection ? " has-dialog" : ""}`} inert={selection ? true : undefined} aria-hidden={selection ? true : undefined}>
      <main id="story" className="story-inner">
        <header className="site-intro">
          <p className="intro-index">TWO PEOPLE · ONE MAP</p>
          <h1>我们的旅行坐标</h1>
          <p className="intro-subtitle">把走过的路，留在地图和票根里</p>
          <div className="tiny-mark" aria-hidden="true">⌖</div>
          <div className="sort-toggle" aria-label="旅行排序">
            <button type="button" aria-pressed={order === "newest"} onClick={() => changeOrder("newest")}>最近</button>
            <button type="button" aria-pressed={order === "oldest"} onClick={() => changeOrder("oldest")}>最早</button>
          </div>
        </header>

        {orderedTrips.map((trip, tripIndex) => <div className="trip-block" key={trip.id}>
          <section className="trip-section" data-trip-id={trip.id} aria-labelledby={`trip-${trip.id}`}>
            <header className="trip-header">
              <span>{String(tripIndex + 1).padStart(2, "0")}</span>
              <h2 id={`trip-${trip.id}`}>{trip.destination}</h2>
              <p>{trip.country} · {trip.dateLabel}</p>
            </header>
            <div className="ticket-stack">
              {trip.tickets.map((ticket) => <Ticket key={ticket.id} ticket={ticket} onOpen={setSelection} />)}
            </div>
          </section>
          <div className="trip-transition" aria-hidden="true" />
        </div>)}

        <footer className="story-end"><span>TO BE CONTINUED</span><h2>下一站，仍然是一起。</h2><p>把照片和票根替换成你们自己的故事。</p></footer>
      </main>
    </div>
    {selection && <Notebook selection={selection} onClose={() => setSelection(null)} />}
  </>;
}

function SpotifySoundtrack() {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const [blocked, setBlocked] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  function play() {
    startedRef.current = false;
    setBlocked(false);
    controllerRef.current?.play();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { if (!startedRef.current) setBlocked(true); }, 1800);
  }

  useEffect(() => {
    let active = true;
    const host = mountRef.current;
    if (!host) return;
    void loadSpotifyApi().then((api) => {
      if (!active) return;
      const mount = document.createElement("div");
      host.replaceChildren(mount);
      api.createController(mount, { width: "100%", height: 80, uri: SPOTIFY_TRACK }, (controller) => {
        if (!active) return controller.destroy();
        controllerRef.current = controller;
        controller.addListener("ready", () => {
          host.querySelector("iframe")?.setAttribute("title", "Spotify 播放器：To April");
          play();
        });
        controller.addListener("playback_started", () => {
          startedRef.current = true;
          setBlocked(false);
          if (timerRef.current) window.clearTimeout(timerRef.current);
        });
      });
    }).catch(() => { if (active) setUnavailable(true); });
    return () => {
      active = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      controllerRef.current?.destroy();
      controllerRef.current = null;
      host.replaceChildren();
    };
  }, []);

  return <aside className="spotify-soundtrack" aria-label="背景音乐：To April，Shan Gao">
    {blocked && <button type="button" className="spotify-start" onClick={play}>点击开启背景音乐</button>}
    {unavailable ? <a href={SPOTIFY_URL} target="_blank" rel="noreferrer">在 Spotify 播放《To April》</a> : <div ref={mountRef} />}
  </aside>;
}
