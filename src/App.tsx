import { useEffect, useMemo, useState } from "react";
import { site } from "./content/site";
import { trips } from "./content/trips";
import { sortTrips, type SortOrder } from "./lib/trips";
import { Chapter } from "./components/Chapter";
import { Hero } from "./components/Hero";
import { MapStage } from "./components/MapStage";

export function App() {
  const [order, setOrder] = useState<SortOrder>("newest");
  const ordered = useMemo(() => sortTrips(trips, order), [order]);
  const [activeId, setActiveId] = useState(ordered[0].id);
  const activeTrip = ordered.find((trip) => trip.id === activeId) ?? ordered[0];

  // The chapter whose header crosses the middle band of the screen drives the map.
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.find((entry) => entry.isIntersecting);
      if (hit) setActiveId((hit.target as HTMLElement).dataset.tripId!);
    }, { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll<HTMLElement>("[data-trip-id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ordered]);

  function changeOrder(next: SortOrder) {
    if (next === order) return;
    setOrder(next);
    setActiveId(sortTrips(trips, next)[0].id);
    window.scrollTo({ top: 0 });
  }

  return <>
    <MapStage trip={activeTrip} />
    <main className="story">
      <Hero title={site.title} subtitle={site.subtitle} links={site.links} order={order} onOrderChange={changeOrder} />
      {ordered.map((trip) => <Chapter key={trip.id} trip={trip} />)}
    </main>
  </>;
}
