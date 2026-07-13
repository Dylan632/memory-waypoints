import { useRef, type CSSProperties, type PointerEvent } from "react";
import type { Ticket as TicketData } from "../data";

export type TicketSelection = { ticket: TicketData; sourceRect: DOMRect; sourceElement: HTMLButtonElement };

export function TicketArtwork({ ticket }: { ticket: TicketData }) {
  const style = { "--ticket-accent": ticket.accent, "--ticket-image": ticket.image ? `url(${ticket.image})` : "none" } as CSSProperties;
  if (ticket.variant === "scan" && ticket.image) {
    return <div className="ticket-art ticket-art--scan" style={style}>
      <img src={ticket.image} alt="" width="1200" height={Math.round(1200 / ticket.ratio)} />
    </div>;
  }
  return <div className={`ticket-art ticket-art--${ticket.variant}`} style={style}>
    <div className="ticket-stub">
      <small>{ticket.date}</small><b>{ticket.price}</b><span>{ticket.serial}</span>
    </div>
    <div className="ticket-body">
      <div className="ticket-kicker">MEMORY LINE · ADMIT TWO</div>
      <strong>{ticket.title}</strong>
      <span>{ticket.subtitle}</span>
      <i aria-hidden="true">● ● ●</i>
    </div>
    <div className="ticket-code" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
  </div>;
}

export function Ticket({ ticket, onOpen }: { ticket: TicketData; onOpen: (selection: TicketSelection) => void }) {
  const tiltRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<number | null>(null);

  function move(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "touch" || window.innerWidth <= 760 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = tiltRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 9;
    const rotateX = -((event.clientY - rect.top) / rect.height - 0.5) * 9;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      element.style.transform = `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.012)`;
    });
  }

  function reset() {
    const element = tiltRef.current;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (element) element.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
  }

  const slotStyle = {
    "--ticket-width": `${ticket.width}px`,
    "--ticket-offset": `${ticket.offset}px`,
    "--ticket-rotation": `${ticket.rotation}deg`,
    "--ticket-ratio": String(ticket.ratio),
  } as CSSProperties;

  return <div className="ticket-slot" style={slotStyle}>
    <button
      ref={tiltRef}
      type="button"
      className="ticket-button"
      aria-label={`打开回忆：${ticket.title}`}
      aria-haspopup="dialog"
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onClick={(event) => onOpen({ ticket, sourceRect: event.currentTarget.getBoundingClientRect(), sourceElement: event.currentTarget })}
    >
      <TicketArtwork ticket={ticket} />
    </button>
    <div className="ticket-label"><span>{ticket.title}</span><b>{ticket.photos.length}</b></div>
  </div>;
}
