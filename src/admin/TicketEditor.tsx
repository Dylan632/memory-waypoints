import { useState, type ChangeEvent } from "react";
import { switchTicketMode, ticketScanImage, ticketTemplateImage, type Ticket, type TicketMotionPreset, type TicketTemplateVariant } from "../data";
import { uploadImage } from "./media";

type Props = {
  tickets: Ticket[];
  selectedId: string | null;
  onSelect(id: string): void;
  onAdd(kind: "scan" | "template"): void;
  onChange(id: string, update: (ticket: Ticket) => Ticket): void;
  onDelete(id: string): void;
  onBusyChange(busy: boolean): void;
  disabled?: boolean;
};

const templateVariants: Array<{ value: TicketTemplateVariant; label: string }> = [
  { value: "scenic", label: "风景票" },
  { value: "rail", label: "车票" },
  { value: "museum", label: "展览票" },
  { value: "cinema", label: "电影票" },
];

const motionPresets: Array<{ value: TicketMotionPreset; label: string }> = [
  { value: "gentle", label: "温柔漂浮（推荐）" },
  { value: "portrait", label: "人物上浮" },
  { value: "stamp", label: "印章微转" },
  { value: "landmarks", label: "东湖之眼（摩天轮与栈桥）" },
  { value: "tilt", label: "只保留整张倾斜" },
];

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function TicketEditor({ tickets, selectedId, onSelect, onAdd, onChange, onDelete, onBusyChange, disabled = false }: Props) {
  const ticket = tickets.find((item) => item.id === selectedId) ?? tickets[0];
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  function update<K extends keyof Ticket>(key: K, value: Ticket[K]) {
    if (ticket) onChange(ticket.id, (current) => ({ ...current, [key]: value }));
  }

  async function uploadTicket(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !ticket) return;
    const ticketId = ticket.id;
    setBusy("ticket");
    onBusyChange(true);
    setMessage("正在上传票根…");
    try {
      const image = await uploadImage(file, "tickets");
      const ratio = Math.min(3.5, Math.max(.65, image.ratio));
      onChange(ticketId, (current) => ({ ...switchTicketMode(current, "scan"), image: image.url, scanImage: image.url, ratio, scanRatio: ratio }));
      setMessage("票根已上传并保存到草稿");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "票根上传失败");
    } finally {
      setBusy("");
      onBusyChange(false);
    }
  }

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length || !ticket) return;
    const ticketId = ticket.id;
    let uploaded = 0;
    setBusy("photos");
    onBusyChange(true);
    try {
      for (let index = 0; index < files.length; index += 1) {
        setMessage(`正在上传照片 ${index + 1} / ${files.length}`);
        const url = (await uploadImage(files[index], "photos")).url;
        onChange(ticketId, (current) => ({ ...current, photos: [...current.photos, url] }));
        uploaded += 1;
      }
      setMessage(`已加入 ${uploaded} 张照片`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "照片上传失败";
      setMessage(uploaded ? `已加入 ${uploaded} 张，其余未完成：${detail}` : detail);
    } finally {
      setBusy("");
      onBusyChange(false);
    }
  }

  async function uploadTemplateBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !ticket) return;
    const ticketId = ticket.id;
    setBusy("background");
    onBusyChange(true);
    setMessage("正在上传票面背景…");
    try {
      const image = await uploadImage(file, "tickets");
      onChange(ticketId, (current) => ({ ...current, templateImage: image.url }));
      setMessage("票面背景已保存到草稿");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "票面背景上传失败");
    } finally {
      setBusy("");
      onBusyChange(false);
    }
  }

  async function uploadMotionLayer(event: ChangeEvent<HTMLInputElement>, field: "foregroundImage" | "stampImage", label: string) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !ticket) return;
    const ticketId = ticket.id;
    setBusy(field);
    onBusyChange(true);
    setMessage(`正在上传${label}…`);
    try {
      const image = await uploadImage(file, "tickets");
      onChange(ticketId, (current) => ({ ...current, [field]: image.url }));
      setMessage(`${label}已保存到草稿`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${label}上传失败`);
    } finally {
      setBusy("");
      onBusyChange(false);
    }
  }

  if (!ticket) return <section className="admin-empty-state">
    <span aria-hidden="true">◫</span>
    <h2>先加入一张票根</h2>
    <p>可以上传真实票根，也可以使用网站现有的票根样式。</p>
    <div className="admin-inline-actions">
      <button type="button" className="admin-primary" onClick={() => onAdd("scan")}>上传真实票根</button>
      <button type="button" className="admin-secondary" onClick={() => onAdd("template")}>创建样式票根</button>
    </div>
  </section>;

  return <div className="ticket-editor">
    <div className="ticket-editor-list" aria-label="本次旅行的票根">
      {tickets.map((item, index) => <button
        key={item.id}
        type="button"
        className={item.id === ticket.id ? "is-selected" : ""}
        aria-pressed={item.id === ticket.id}
        onClick={() => onSelect(item.id)}
      >
        <span>{String(index + 1).padStart(2, "0")}</span>
        <strong>{item.title || "未命名票根"}</strong>
        <small>{item.variant === "scan" ? "真实票根" : "样式票根"}</small>
      </button>)}
      <button type="button" className="ticket-editor-add" onClick={() => onAdd("scan")}>＋ 上传票根</button>
      <button type="button" className="ticket-editor-add" onClick={() => onAdd("template")}>＋ 样式票根</button>
    </div>

    <section className="ticket-editor-form" aria-labelledby="ticket-form-title">
      <header>
        <div><span>票根内容</span><h2 id="ticket-form-title">{ticket.title || "未命名票根"}</h2></div>
        <button type="button" className="admin-danger-link" onClick={() => onDelete(ticket.id)}>删除票根</button>
      </header>

      <div className="admin-field-grid">
        <label className="admin-field admin-field--wide"><span>票根标题</span><input value={ticket.title} onChange={(event) => update("title", event.target.value)} maxLength={80} /></label>
        <label className="admin-field"><span>英文或副标题</span><input value={ticket.subtitle} onChange={(event) => update("subtitle", event.target.value)} maxLength={100} /></label>
        <label className="admin-field"><span>日期</span><input value={ticket.date} onChange={(event) => update("date", event.target.value)} placeholder="2026.07.13" maxLength={30} /></label>
        <label className="admin-field"><span>编号</span><input value={ticket.serial} onChange={(event) => update("serial", event.target.value)} maxLength={50} /></label>
        <label className="admin-field"><span>价格或备注</span><input value={ticket.price} onChange={(event) => update("price", event.target.value)} maxLength={30} /></label>
        <label className="admin-field admin-field--wide"><span>这段回忆</span><textarea value={ticket.story} onChange={(event) => update("story", event.target.value)} rows={5} maxLength={3000} /></label>
      </div>

      <div className="admin-section-rule" />
      <div className="ticket-media-row">
        <div>
          <span className="admin-label">票根图像</span>
          <p>{ticket.variant === "scan" ? "当前使用真实票根图片" : ticketScanImage(ticket) ? "图片已保留，可随时切换回来" : "上传后会自动切换为真实票根"}</p>
        </div>
        <label className={`admin-upload-button${busy === "ticket" ? " is-busy" : ""}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadTicket} disabled={Boolean(busy) || disabled} />
          {ticketScanImage(ticket) ? "替换票根" : "选择票根图片"}
        </label>
      </div>

      <div className="admin-field-grid admin-appearance-fields">
        <label className="admin-field"><span>显示方式</span><select value={ticket.variant === "scan" ? "scan" : "template"} onChange={(event) => onChange(ticket.id, (current) => switchTicketMode(current, event.target.value as "scan" | "template"))}>
          <option value="scan" disabled={!ticketScanImage(ticket)}>真实票根照片</option>
          <option value="template">样式票根</option>
        </select></label>
        {ticket.variant !== "scan" && <>
          <label className="admin-field"><span>票根样式</span><select value={ticket.variant} onChange={(event) => {
            const variant = event.target.value as TicketTemplateVariant;
            onChange(ticket.id, (current) => ({ ...current, variant, templateVariant: variant }));
          }}>{templateVariants.map((variant) => <option key={variant.value} value={variant.value}>{variant.label}</option>)}</select></label>
          <label className="admin-field"><span>强调色</span><div className="admin-color-field"><input type="color" value={ticket.accent} onChange={(event) => update("accent", event.target.value)} /><code>{ticket.accent}</code></div></label>
        </>}
      </div>

      {ticket.variant === "scan" && <section className="ticket-motion-settings" aria-labelledby="ticket-motion-title">
        <div>
          <span className="admin-label" id="ticket-motion-title">票根动效</span>
          <p>上传后自动生效；选择最接近票面重点的效果即可。</p>
        </div>
        <label className="admin-field"><span>动效样式</span><select value={ticket.motionPreset ?? "gentle"} onChange={(event) => update("motionPreset", event.target.value as TicketMotionPreset)}>
          {motionPresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
        </select></label>
        {ticket.motionPreset === "landmarks" && <p className="admin-field-hint ticket-landmark-hint">已按“东湖之眼”票面校准：摩天轮缓慢转动，两位小人来回走动，停坐的人物只保留很轻的呼吸感。</p>}
        <details className="ticket-motion-layers">
          <summary>高级分层（可选）</summary>
          <p>没有透明图层也能使用自动动效。需要更准确时，可上传与票根同尺寸的透明 PNG。</p>
          <div className="ticket-motion-layer-grid">
            <div className="ticket-motion-layer-card">
              <div>{ticket.foregroundImage ? <img src={ticket.foregroundImage} alt="人物前景层预览" /> : <span aria-hidden="true">人物</span>}<strong>人物前景层</strong></div>
              <div className="admin-inline-actions">
                <label className={`admin-upload-button${busy === "foregroundImage" ? " is-busy" : ""}`}><input type="file" accept="image/png,image/webp" onChange={(event) => void uploadMotionLayer(event, "foregroundImage", "人物前景层")} disabled={Boolean(busy) || disabled} />{ticket.foregroundImage ? "替换" : "上传"}</label>
                {ticket.foregroundImage && <button type="button" className="admin-danger-link" onClick={() => update("foregroundImage", undefined)}>移除</button>}
              </div>
            </div>
            <div className="ticket-motion-layer-card">
              <div>{ticket.stampImage ? <img src={ticket.stampImage} alt="印章图层预览" /> : <span aria-hidden="true">印章</span>}<strong>印章图层</strong></div>
              <div className="admin-inline-actions">
                <label className={`admin-upload-button${busy === "stampImage" ? " is-busy" : ""}`}><input type="file" accept="image/png,image/webp" onChange={(event) => void uploadMotionLayer(event, "stampImage", "印章图层")} disabled={Boolean(busy) || disabled} />{ticket.stampImage ? "替换" : "上传"}</label>
                {ticket.stampImage && <button type="button" className="admin-danger-link" onClick={() => update("stampImage", undefined)}>移除</button>}
              </div>
            </div>
          </div>
        </details>
      </section>}

      {ticket.variant !== "scan" && (ticket.variant === "scenic" || ticket.variant === "cinema" ? <div className="ticket-media-row">
        <div><span className="admin-label">样式票根背景</span><p>这张照片会嵌在票面里，不会替换整张票根。</p></div>
        <label className={`admin-upload-button${busy === "background" ? " is-busy" : ""}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadTemplateBackground} disabled={Boolean(busy) || disabled} />
          {ticketTemplateImage(ticket) ? "替换背景" : "选择背景照片"}
        </label>
      </div> : <p className="admin-field-hint">展览票和车票不显示背景照片；如需票面带照片，请选择“风景票”或“电影票”。</p>)}

      <details className="admin-layout-details">
        <summary>调整票根位置和大小</summary>
        <div className="admin-slider-grid">
          <label><span>宽度 <b>{ticket.width}px</b></span><input type="range" min="240" max="560" value={ticket.width} onChange={(event) => update("width", Number(event.target.value))} /></label>
          <label><span>左右位置 <b>{ticket.offset}px</b></span><input type="range" min="-100" max="100" value={ticket.offset} onChange={(event) => update("offset", Number(event.target.value))} /></label>
          <label><span>旋转 <b>{ticket.rotation}°</b></span><input type="range" min="-4" max="4" step="0.1" value={ticket.rotation} onChange={(event) => update("rotation", Number(event.target.value))} /></label>
        </div>
      </details>

      <div className="admin-section-rule" />
      <div className="ticket-photo-header">
        <div><span className="admin-label">手账照片</span><p>点击票根后，这些照片会按当前顺序展开。</p></div>
        <label className={`admin-upload-button${busy === "photos" ? " is-busy" : ""}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadPhotos} disabled={Boolean(busy) || disabled} />
          添加照片
        </label>
      </div>
      <div className="admin-photo-grid">
        {ticket.photos.map((photo, index) => <figure key={photo}>
          <img src={photo} alt={`照片 ${index + 1}`} width="180" height="135" />
          <figcaption>
            <span>{index + 1}</span>
            <button type="button" aria-label="前移" disabled={index === 0} onClick={() => update("photos", move(ticket.photos, index, index - 1))}>←</button>
            <button type="button" aria-label="后移" disabled={index === ticket.photos.length - 1} onClick={() => update("photos", move(ticket.photos, index, index + 1))}>→</button>
            <button type="button" aria-label="删除照片" onClick={() => update("photos", ticket.photos.filter((_, itemIndex) => itemIndex !== index))}>×</button>
          </figcaption>
        </figure>)}
        {!ticket.photos.length && <p className="admin-photo-empty">还没有照片</p>}
      </div>
      <p className="admin-live-message" aria-live="polite">{message}</p>
    </section>
  </div>;
}
