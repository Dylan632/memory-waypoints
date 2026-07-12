import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { TicketArtwork, type TicketSelection } from "./Ticket";

export function Notebook({ selection, onClose }: { selection: TicketSelection; onClose: () => void }) {
  const { ticket, sourceRect, sourceElement } = selection;
  const closeRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [flightStyle, setFlightStyle] = useState<CSSProperties>({});
  const [flying, setFlying] = useState(true);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFlying(false);
      return;
    }
    const target = targetRef.current?.getBoundingClientRect();
    if (!target) return;
    const start: CSSProperties = { left: sourceRect.left, top: sourceRect.top, width: sourceRect.width, height: sourceRect.height, transform: "translate3d(0,0,0) scale(1)" };
    setFlightStyle(start);
    let innerFrame = 0;
    const frame = requestAnimationFrame(() => { innerFrame = requestAnimationFrame(() => setFlightStyle({
        ...start,
        transform: `translate3d(${target.left - sourceRect.left}px, ${target.top - sourceRect.top}px, 0) scale(${target.width / sourceRect.width}, ${target.height / sourceRect.height})`,
      }));
    });
    const done = window.setTimeout(() => setFlying(false), 470);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(innerFrame); window.clearTimeout(done); };
  }, [sourceRect]);

  useEffect(() => {
    closeRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
    }
    window.addEventListener("keydown", keydown);
    return () => { window.removeEventListener("keydown", keydown); sourceElement.focus(); };
  }, [onClose, sourceElement]);

  return createPortal(<div className="notebook-backdrop is-entering" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="notebook-paper" role="dialog" aria-modal="true" aria-labelledby="notebook-title">
      <button ref={closeRef} className="notebook-close" type="button" aria-label="关闭回忆" onClick={onClose}>×</button>
      <div ref={targetRef} className={`notebook-ticket${flying ? " is-hidden" : ""}`} style={{ aspectRatio: ticket.ratio }}><TicketArtwork ticket={ticket} /></div>
      <div className="notebook-copy">
        <p>{ticket.date} · {ticket.subtitle}</p>
        <h2 id="notebook-title">{ticket.title}</h2>
        <blockquote>{ticket.story}</blockquote>
        <h3>照片</h3>
        <div className="polaroid-grid">
          {ticket.photos.map((photo, index) => <figure key={photo} style={{ "--photo-turn": `${index % 2 ? 1.4 : -1.2}deg` } as CSSProperties}>
            <img src={photo} alt={`${ticket.title}的回忆照片 ${index + 1}`} width="900" height="680" loading="lazy" />
            <figcaption>{ticket.date.replaceAll(".", " / ")}</figcaption>
          </figure>)}
        </div>
      </div>
    </section>
    {flying && <div className="ticket-flight" style={flightStyle} aria-hidden="true"><TicketArtwork ticket={ticket} /></div>}
  </div>, document.body);
}
