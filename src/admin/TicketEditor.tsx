import { useState, type ChangeEvent } from "react";
import type { Ticket, TicketVariant } from "../data";
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

const templateVariants: Array<{ value: TicketVariant; label: string }> = [
  { value: "scenic", label: "风景票" },
  { value: "rail", label: "车票" },
  { value: "museum", label: "展览票" },
  { value: "cinema", label: "电影票" },
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
      onChange(ticketId, (current) => ({ ...current, variant: "scan", image: image.url, ratio: Math.min(3.5, Math.max(.65, image.ratio)) }));
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
          <p>{ticket.variant === "scan" ? "当前使用真实票根图片" : "上传后会自动切换为真实票根"}</p>
        </div>
        <label className={`admin-upload-button${busy === "ticket" ? " is-busy" : ""}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadTicket} disabled={Boolean(busy) || disabled} />
          {ticket.image ? "替换票根" : "选择票根图片"}
        </label>
      </div>

      {ticket.variant !== "scan" && <div className="admin-field-grid admin-appearance-fields">
        <label className="admin-field"><span>票根样式</span><select value={ticket.variant} onChange={(event) => update("variant", event.target.value as TicketVariant)}>{templateVariants.map((variant) => <option key={variant.value} value={variant.value}>{variant.label}</option>)}</select></label>
        <label className="admin-field"><span>强调色</span><div className="admin-color-field"><input type="color" value={ticket.accent} onChange={(event) => update("accent", event.target.value)} /><code>{ticket.accent}</code></div></label>
      </div>}

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
