import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type WheelEvent } from "react";
import { createPortal } from "react-dom";
import { TicketArtwork, type TicketSelection } from "./Ticket";

export function Notebook({ selection, onClose }: { selection: TicketSelection; onClose: () => void }) {
  const { ticket, sourceRect, sourceElement } = selection;
  const closeRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const closeFrameRef = useRef(0);
  const closeTimerRef = useRef(0);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [flightStyle, setFlightStyle] = useState<CSSProperties>({});
  const [flying, setFlying] = useState(true);
  const [closing, setClosing] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    sourceElement.style.opacity = "0";
    sourceElement.style.transition = "none";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setFlying(false); return; }
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
  }, [sourceElement, sourceRect]);

  const closePhoto = useCallback(() => {
    setPhotoIndex(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const requestClose = useCallback(() => {
    if (photoIndex !== null) { closePhoto(); return; }
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    const target = targetRef.current?.getBoundingClientRect();
    const source = sourceElement.getBoundingClientRect();
    if (!target) { onClose(); return; }
    setClosing(true);
    setFlying(true);
    const start: CSSProperties = { left: target.left, top: target.top, width: target.width, height: target.height, transform: "translate3d(0,0,0) scale(1)" };
    setFlightStyle(start);
    closeFrameRef.current = requestAnimationFrame(() => { closeFrameRef.current = requestAnimationFrame(() => setFlightStyle({
      ...start,
      transform: `translate3d(${source.left - target.left}px, ${source.top - target.top}px, 0) scale(${source.width / target.width}, ${source.height / target.height})`,
    })); });
    closeTimerRef.current = window.setTimeout(onClose, 460);
  }, [closePhoto, closing, onClose, photoIndex, sourceElement]);

  const changePhoto = useCallback((direction: number) => {
    setPhotoIndex((current) => current === null ? null : (current + direction + ticket.photos.length) % ticket.photos.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [ticket.photos.length]);

  useEffect(() => {
    closeRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (photoIndex !== null && event.key === "ArrowLeft") changePhoto(-1);
      else if (photoIndex !== null && event.key === "ArrowRight") changePhoto(1);
      else if (event.key === "Escape") requestClose();
      else if (event.key === "Tab" && photoIndex === null) { event.preventDefault(); closeRef.current?.focus(); }
    }
    window.addEventListener("keydown", keydown);
    return () => { window.removeEventListener("keydown", keydown); };
  }, [changePhoto, photoIndex, requestClose]);

  useEffect(() => () => {
    cancelAnimationFrame(closeFrameRef.current);
    window.clearTimeout(closeTimerRef.current);
    sourceElement.style.opacity = "";
    sourceElement.style.transition = "";
    sourceElement.focus();
  }, [sourceElement]);

  function zoomPhoto(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoom((current) => {
      const next = Math.max(1, Math.min(5, current - event.deltaY * .002 * current));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  }

  function dragPhoto(event: PointerEvent<HTMLDivElement>) {
    const start = dragRef.current;
    if (!start) return;
    const maxX = (zoom - 1) * window.innerWidth / 2;
    const maxY = (zoom - 1) * window.innerHeight / 2;
    setPan({
      x: Math.max(-maxX, Math.min(maxX, start.panX + event.clientX - start.x)),
      y: Math.max(-maxY, Math.min(maxY, start.panY + event.clientY - start.y)),
    });
  }

  return createPortal(<div className={`notebook-backdrop${closing ? " is-closing" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
    <section className={`notebook-paper${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="notebook-title">
      <button ref={closeRef} className="notebook-close" type="button" aria-label="关闭回忆" onClick={requestClose}>×</button>
      <div ref={targetRef} className={`notebook-ticket${flying ? " is-hidden" : ""}`} style={{ aspectRatio: ticket.ratio }}>
        <span className="notebook-tape notebook-tape--left" aria-hidden="true" />
        <span className="notebook-tape notebook-tape--right" aria-hidden="true" />
        <TicketArtwork ticket={ticket} />
      </div>
      <div className="notebook-copy">
        <p>{ticket.date} · {ticket.subtitle}</p>
        <h2 id="notebook-title">{ticket.title}</h2>
        <blockquote>{ticket.story}</blockquote>
        <h3>照片</h3>
        <div className="polaroid-grid">
          {ticket.photos.map((photo, index) => <button className="polaroid-button" type="button" key={photo} aria-label={`查看${ticket.title}的第 ${index + 1} 张照片`} onClick={() => { setPhotoIndex(index); setZoom(1); setPan({ x: 0, y: 0 }); }}>
            <figure style={{ "--photo-turn": `${index % 2 ? 1.4 : -1.2}deg` } as CSSProperties}>
              <img src={photo} alt={`${ticket.title}的回忆照片 ${index + 1}`} width="900" height="680" loading="lazy" />
              <figcaption>{ticket.date.replaceAll(".", " / ")}</figcaption>
            </figure>
          </button>)}
        </div>
      </div>
    </section>
    {flying && <div className="ticket-flight" style={flightStyle} aria-hidden="true"><TicketArtwork ticket={ticket} /></div>}
    {photoIndex !== null && <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="照片浏览器" onMouseDown={(event) => { if (event.target === event.currentTarget) closePhoto(); }}>
      <button className="photo-lightbox-close" type="button" aria-label="关闭照片" onClick={closePhoto}>×</button>
      {ticket.photos.length > 1 && <><button className="photo-lightbox-nav photo-lightbox-prev" type="button" aria-label="上一张照片" onClick={() => changePhoto(-1)}>‹</button><button className="photo-lightbox-nav photo-lightbox-next" type="button" aria-label="下一张照片" onClick={() => changePhoto(1)}>›</button></>}
      <div className="photo-lightbox-stage" onWheel={zoomPhoto} onPointerDown={startDrag} onPointerMove={dragPhoto} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
        <img src={ticket.photos[photoIndex]} alt={`${ticket.title}的回忆照片 ${photoIndex + 1}`} draggable="false" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }} />
      </div>
      <div className="photo-lightbox-tools"><button type="button" aria-label="缩小照片" onClick={() => setZoom((value) => Math.max(1, value - .5))}>−</button><span>{photoIndex + 1} / {ticket.photos.length} · {Math.round(zoom * 100)}%</span><button type="button" aria-label="放大照片" onClick={() => setZoom((value) => Math.min(5, value + .5))}>＋</button></div>
    </div>}
  </div>, document.body);
}
