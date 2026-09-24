import type { CSSProperties, ComponentType } from "react";
import type { TicketEntry } from "../../lib/trips";
import { AdmissionTicket } from "./AdmissionTicket";
import { RailTicket } from "./RailTicket";

/** Each physical ticket is recreated as its own component. Register new
 *  ones here; `kind` in the trip data picks which one renders. */
const registry: Record<string, ComponentType<{ face: Record<string, string> }>> = {
  admission: AdmissionTicket,
  rail: RailTicket,
};

export const ticketKinds = Object.keys(registry);

export function TicketCard({ ticket }: { ticket: TicketEntry }) {
  const Face = registry[ticket.kind];
  if (!Face) throw new Error(`Unknown ticket kind "${ticket.kind}" on ${ticket.id}`);
  const style = {
    "--ticket-width": `${ticket.width}px`,
    "--ticket-ratio": String(ticket.ratio),
    "--ticket-rotate": `${ticket.rotate ?? 0}deg`,
  } as CSSProperties;
  return <div className="ticket" style={style}><Face face={ticket.face} /></div>;
}
