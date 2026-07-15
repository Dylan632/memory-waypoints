import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { trips as bundledTrips, type Trip } from "./data";
import { sortTrips, type SortOrder } from "./lib/trips";
import { loadPublishedTrips } from "./lib/content";
import { MemoryMap, type MapScene } from "./components/MemoryMap";
import { Notebook } from "./components/Notebook";
import { Ticket, type TicketSelection } from "./components/Ticket";

const AdminApp = lazy(() => import("./admin/AdminApp").then((module) => ({ default: module.AdminApp })));
const QQ_MUSIC_PLAYER_URL = "https://i.y.qq.com/n2/m/outchain/player/index.html?songid=101819133&songtype=0";

export function App() {
  if (window.location.pathname.startsWith("/admin")) return <Suspense fallback={<main className="admin-loading"><span aria-hidden="true">⌖</span><p>正在打开旅行管理台</p></main>}><AdminApp fallbackTrips={bundledTrips} /></Suspense>;
  return <StoryApp />;
}

function StoryApp() {
  const [trips, setTrips] = useState<Trip[]>(bundledTrips);
  const [order, setOrder] = useState<SortOrder>("newest");
  const orderedTrips = useMemo(() => sortTrips(trips, order), [order, trips]);
  const [scene, setScene] = useState<MapScene>({ from: null, to: orderedTrips[0], progress: 1 });
  const [selection, setSelection] = useState<TicketSelection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const preloadTrip = !scene.from ? orderedTrips[orderedTrips.findIndex((trip) => trip.id === scene.to.id) + 1] : undefined;

  useEffect(() => {
    let current = true;
    void loadPublishedTrips(bundledTrips).then((published) => {
      if (!current) return;
      setTrips(published);
      setScene({ from: null, to: sortTrips(published, "newest")[0], progress: 1 });
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      const rootRect = root.getBoundingClientRect();
      const center = rootRect.top + rootRect.height / 2;
      const transition = [...root.querySelectorAll<HTMLElement>("[data-transition-from]")].find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.top <= center && rect.bottom >= center;
      });
      if (transition) {
        const rect = transition.getBoundingClientRect();
        const from = orderedTrips.find((trip) => trip.id === transition.dataset.transitionFrom);
        const to = orderedTrips.find((trip) => trip.id === transition.dataset.transitionTo);
        if (from && to) {
          const progress = Math.max(0, Math.min(1, (center - rect.top) / rect.height));
          setScene((current) => current.from?.id === from.id && current.to.id === to.id && Math.abs(current.progress - progress) < .004 ? current : { from, to, progress });
          return;
        }
      }
      const sections = [...root.querySelectorAll<HTMLElement>("[data-trip-id]")];
      const closest = sections.sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return Math.abs((aRect.top + aRect.bottom) / 2 - center) - Math.abs((bRect.top + bRect.bottom) / 2 - center);
      })[0];
      const trip = orderedTrips.find((item) => item.id === closest?.dataset.tripId) ?? orderedTrips[0];
      setScene((current) => !current.from && current.to.id === trip.id ? current : { from: null, to: trip, progress: 1 });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    root.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); root.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [orderedTrips]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || window.matchMedia("(hover: hover)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tickets = [...root.querySelectorAll<HTMLElement>("[data-tilt-touch]")];
    let frame = 0;
    const update = () => {
      const rootRect = root.getBoundingClientRect();
      const middle = rootRect.top + rootRect.height / 2;
      tickets.forEach((ticket, index) => {
        const rect = ticket.getBoundingClientRect();
        if (rect.bottom < rootRect.top - 100 || rect.top > rootRect.bottom + 100) { ticket.style.transform = ""; return; }
        const progress = Math.max(-1, Math.min(1, ((rect.top + rect.bottom) / 2 - middle) / (rootRect.height / 2)));
        const direction = index % 2 ? -1 : 1;
        ticket.style.transform = `perspective(600px) rotateX(${(-progress * 24 * direction).toFixed(2)}deg) rotateY(${(progress * 24).toFixed(2)}deg)`;
      });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    root.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => { cancelAnimationFrame(frame); root.removeEventListener("scroll", schedule); tickets.forEach((ticket) => { ticket.style.transform = ""; }); };
  }, [orderedTrips]);

  function changeOrder(next: SortOrder) {
    if (next === order) return;
    const nextTrips = sortTrips(trips, next);
    setOrder(next);
    setScene({ from: null, to: nextTrips[0], progress: 1 });
    scrollRef.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return <>
    <a className="skip-link" href="#story">跳到旅行记录</a>
    <MemoryMap scene={scene} preload={preloadTrip} />
    <div ref={scrollRef} className={`story-scroll${selection ? " has-dialog" : ""}`} inert={selection ? true : undefined} aria-hidden={selection ? true : undefined}>
      <QQMusicSoundtrack />
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
          {tripIndex < orderedTrips.length - 1 && <div className="trip-transition" data-transition-from={trip.id} data-transition-to={orderedTrips[tripIndex + 1].id} aria-hidden="true" />}
        </div>)}

        <footer className="story-end">
          <span>TO BE CONTINUED</span>
          <h2>下一站，仍然是一起。</h2>
          <p>把照片和票根替换成你们自己的故事。</p>
          <p className="music-credit">背景音乐 “To April” · <a href={QQ_MUSIC_PLAYER_URL} target="_blank" rel="noreferrer">QQ 音乐官方播放器</a></p>
        </footer>
      </main>
    </div>
    {selection && <Notebook selection={selection} onClose={() => setSelection(null)} />}
  </>;
}

function QQMusicSoundtrack() {
  return <aside className="qq-soundtrack" aria-label="QQ 音乐背景音乐《To April》">
    <iframe
      src={QQ_MUSIC_PLAYER_URL}
      title="QQ 音乐播放器：《To April》—高姗"
      allow="autoplay; encrypted-media"
      loading="eager"
    />
  </aside>;
}
