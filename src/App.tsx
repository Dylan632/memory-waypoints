import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { trips as bundledTrips, type Trip } from "./data";
import { sortTrips, type SortOrder } from "./lib/trips";
import { loadPublishedTrips } from "./lib/content";
import { MemoryMap } from "./components/MemoryMap";
import { Notebook } from "./components/Notebook";
import { Ticket, type TicketSelection } from "./components/Ticket";

const AdminApp = lazy(() => import("./admin/AdminApp").then((module) => ({ default: module.AdminApp })));

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
    void loadPublishedTrips(bundledTrips).then((published) => { if (current) setTrips(published); });
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
