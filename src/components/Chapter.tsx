import { formatDateRange, type Trip } from "../lib/trips";
import { TicketCard } from "./tickets";

export function Chapter({ trip }: { trip: Trip }) {
  return <section className="chapter" data-trip-id={trip.id} aria-labelledby={`trip-${trip.id}`}>
    <header className="chapter__header">
      <h2 id={`trip-${trip.id}`}>{trip.title}</h2>
      <p>{trip.place} · {formatDateRange(trip.start, trip.end)}</p>
    </header>
    <div className="chapter__tickets">
      {trip.tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}
    </div>
  </section>;
}
