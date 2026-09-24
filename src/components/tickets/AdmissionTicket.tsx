/** Paper admission ticket with a tear-off stub, as sold at gardens and museums. */
export function AdmissionTicket({ face }: { face: Record<string, string> }) {
  return <div className="admission-ticket">
    <div className="admission-ticket__main">
      <span className="admission-ticket__kicker">入 场 券</span>
      <strong>{face.venue}</strong>
      <small>{face.venueEn}</small>
      <dl>
        <div><dt>票种</dt><dd>{face.type}</dd></div>
        <div><dt>日期</dt><dd>{face.date}</dd></div>
        <div><dt>票价</dt><dd>{face.price}</dd></div>
      </dl>
      <span className="admission-ticket__stamp" aria-hidden="true">已检</span>
    </div>
    <div className="admission-ticket__stub">
      {/* Stacked, not writing-mode: CJK fonts without vertical metrics overlap. */}
      <span>副<br />券</span>
      <small>{face.serial}</small>
    </div>
  </div>;
}
