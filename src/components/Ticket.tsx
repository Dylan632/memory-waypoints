import { useRef, type CSSProperties, type PointerEvent } from "react";
import { ticketScanImage, ticketTemplateImage, type Ticket as TicketData } from "../data";

export type TicketSelection = { ticket: TicketData; sourceRect: DOMRect; sourceElement: HTMLButtonElement };

export function TicketArtwork({ ticket }: { ticket: TicketData }) {
  const scanImage = ticketScanImage(ticket);
  const templateImage = ticketTemplateImage(ticket);
  const style = { "--ticket-accent": ticket.accent, "--ticket-image": templateImage ? `url(${templateImage})` : "none" } as CSSProperties;
  if (ticket.variant === "scan" && scanImage) {
    const orientation = ticket.ratio < 1 ? "portrait" : "landscape";
    const motionPreset = ticket.motionPreset ?? "gentle";
    return <div className={`ticket-art ticket-art--scan ticket-art--scan-${orientation} ticket-art--motion-${motionPreset}`} style={style}>
      <img className="ticket-scan-base" src={scanImage} alt="" width="1200" height={Math.round(1200 / ticket.ratio)} />
      {motionPreset === "landmarks" ? <>
        <img className="ticket-scan-motion-layer ticket-scan-landmark-wheel" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-copy-a" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-copy-b" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-copy-c" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-copy-d" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-walker-a" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-walker-b" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-sitter-a" src={scanImage} alt="" aria-hidden="true" />
        <img className="ticket-scan-motion-layer ticket-scan-landmark-sitter-b" src={scanImage} alt="" aria-hidden="true" />
        {ticket.foregroundImage && <img className="ticket-scan-motion-layer ticket-scan-motion-layer--a ticket-scan-motion-layer--custom" src={ticket.foregroundImage} alt="" aria-hidden="true" />}
        {ticket.stampImage && <img className="ticket-scan-motion-layer ticket-scan-motion-layer--b ticket-scan-motion-layer--custom" src={ticket.stampImage} alt="" aria-hidden="true" />}
      </> : motionPreset !== "tilt" && <>
        <img className={`ticket-scan-motion-layer ticket-scan-motion-layer--a${ticket.foregroundImage ? " ticket-scan-motion-layer--custom" : ""}`} src={ticket.foregroundImage ?? scanImage} alt="" aria-hidden="true" />
        <img className={`ticket-scan-motion-layer ticket-scan-motion-layer--b${ticket.stampImage ? " ticket-scan-motion-layer--custom" : ""}`} src={ticket.stampImage ?? scanImage} alt="" aria-hidden="true" />
      </>}
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
    const pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    const pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateY = pointerX * 10;
    const rotateX = -pointerY * 10;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      element.style.transform = `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      element.style.setProperty("--ticket-ink-x", `${(pointerX * 2.4).toFixed(2)}px`);
      element.style.setProperty("--ticket-ink-y", `${(pointerY * 2.4).toFixed(2)}px`);
      element.style.setProperty("--ticket-print-x", `${(-pointerX * 1.6).toFixed(2)}px`);
      element.style.setProperty("--ticket-print-y", `${(-pointerY * 1.6).toFixed(2)}px`);
    });
  }

  function reset() {
    const element = tiltRef.current;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (element) {
      element.style.transform = "";
      element.style.removeProperty("--ticket-ink-x");
      element.style.removeProperty("--ticket-ink-y");
      element.style.removeProperty("--ticket-print-x");
      element.style.removeProperty("--ticket-print-y");
    }
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
      data-tilt-touch
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
