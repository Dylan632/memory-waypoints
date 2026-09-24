/** Pale-blue transit ticket in the style of mainland rail and ferry stubs. */
export function RailTicket({ face }: { face: Record<string, string> }) {
  return <div className="rail-ticket">
    <span className="rail-ticket__serial">{face.serial}</span>
    <span className="rail-ticket__issuer">检票：{face.train}</span>
    <div className="rail-ticket__route">
      <div><strong>{face.from}</strong><small>{face.fromEn}</small></div>
      <div className="rail-ticket__train"><span>{face.train}</span><i aria-hidden="true" /></div>
      <div><strong>{face.to}</strong><small>{face.toEn}</small></div>
    </div>
    <div className="rail-ticket__meta">
      <span>{face.date} {face.time}开</span>
      <span>{face.seat}</span>
    </div>
    <div className="rail-ticket__price"><span>{face.price}元</span><small>{face.note}</small></div>
    <div className="rail-ticket__code" aria-hidden="true" />
  </div>;
}
