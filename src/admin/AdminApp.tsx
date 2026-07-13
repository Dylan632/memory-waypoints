import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import type { Ticket, Trip } from "../data";
import { loadPublishedTrips, validateTrips } from "../lib/content";
import { AdminPreview } from "./AdminPreview";
import { adminRequest as api } from "./api";
import { RouteEditor } from "./RouteEditor";
import { TicketEditor } from "./TicketEditor";
import { uploadImage } from "./media";
import "./admin.css";

type Section = "story" | "route" | "tickets" | "publish";
type AuthState = "checking" | "guest" | "ready";
type Version = { pathname: string; uploadedAt: string };

const sections: Array<{ id: Section; number: string; label: string }> = [
  { id: "story", number: "01", label: "基本信息" },
  { id: "route", number: "02", label: "旅行轨迹" },
  { id: "tickets", number: "03", label: "票根与照片" },
  { id: "publish", number: "04", label: "预览与发布" },
];

function uniqueId(prefix: string) {
  const suffix = typeof crypto.randomUUID === "function" ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
  return `${prefix}-${suffix}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dottedDate(date: string) {
  return date.replaceAll("-", ".");
}

function makeTrip(): Trip {
  const date = today();
  return {
    id: uniqueId("trip"),
    destination: "",
    country: "",
    dateLabel: "",
    startDate: date,
    routeColor: "#c56f4a",
    mapTone: "night",
    route: [],
    tickets: [],
  };
}

function makeTicket(kind: "scan" | "template"): Ticket {
  const date = dottedDate(today());
  return {
    id: uniqueId("ticket"),
    title: "",
    subtitle: "",
    serial: "",
    date,
    price: "",
    variant: kind === "scan" ? "scan" : "museum",
    accent: "#315c64",
    width: kind === "scan" ? 520 : 420,
    ratio: kind === "scan" ? 1.8 : 2.1,
    offset: 0,
    rotation: 0,
    story: "",
    photos: [],
  };
}

function isDraftTrips(value: unknown): value is Trip[] {
  return Array.isArray(value) && value.length > 0 && value.every((trip) => (
    typeof trip === "object" && trip !== null && Array.isArray((trip as Trip).route) && Array.isArray((trip as Trip).tickets)
  ));
}

function friendlyValidation(error: unknown) {
  const message = error instanceof Error ? error.message : "内容还不完整";
  if (/at least 2|distinct coordinates/i.test(message)) return "每段旅行的轨迹至少需要两个不同的途经点。";
  if (/image.*required/i.test(message)) return "真实票根还没有上传图片。";
  if (/non-empty string/i.test(message)) return "还有标题、地点或故事没有填写完整。";
  if (/valid url|https url/i.test(message)) return "有一张图片地址已经失效，请重新上传。";
  return `还有内容需要补充：${message}`;
}

function Login({ onSuccess }: { onSuccess(): void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ authenticated: boolean }>("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      if (result.authenticated !== true) throw new Error("登录状态无效，请重试");
      setPassword("");
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法登录");
    } finally {
      setBusy(false);
    }
  }

  return <main id="admin-main" className="admin-login-shell">
    <section className="admin-login-paper" aria-labelledby="admin-login-title">
      <a href="/" className="admin-back-link">← 返回旅行网站</a>
      <p className="admin-kicker">PRIVATE MEMORY DESK</p>
      <h1 id="admin-login-title">旅行管理台</h1>
      <p>登录后可以整理轨迹、票根、照片和旅行故事。</p>
      <form onSubmit={submit}>
        <label className="admin-field"><span>管理密码</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus /></label>
        <button type="submit" className="admin-primary" disabled={busy}>{busy ? "正在验证" : "进入管理台"}</button>
        {error && <p className="admin-form-error" role="alert">{error}</p>}
      </form>
      <small>这里只允许你本人进入，密码不会保存到浏览器脚本中。</small>
    </section>
  </main>;
}

type MobileQuickProps = {
  trips: Trip[];
  selectedTripId: string;
  onSelectTrip(id: string): void;
  onChangeTrip(trip: Trip): void;
  onChangeTicket(id: string, update: (ticket: Ticket) => Ticket): void;
  onBusyChange(busy: boolean): void;
  onLeave(event: MouseEvent<HTMLAnchorElement>): void;
  onLogout(): void;
  disabled?: boolean;
};

function MobileQuickUpload({ trips, selectedTripId, onSelectTrip, onChangeTrip, onChangeTicket, onBusyChange, onLeave, onLogout, disabled = false }: MobileQuickProps) {
  const trip = trips.find((item) => item.id === selectedTripId) ?? trips[0];
  const [ticketId, setTicketId] = useState(trip.tickets[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!trip.tickets.some((ticket) => ticket.id === ticketId)) setTicketId(trip.tickets[0]?.id ?? "");
  }, [ticketId, trip]);

  async function addTicket(file?: File) {
    if (!file) return;
    setBusy(true);
    onBusyChange(true);
    setMessage("正在上传票根…");
    try {
      const image = await uploadImage(file, "tickets");
      const ticket = { ...makeTicket("scan"), title: file.name.replace(/\.[^.]+$/, ""), image: image.url, ratio: Math.min(3.5, Math.max(.65, image.ratio)) };
      onChangeTrip({ ...trip, tickets: [...trip.tickets, ticket] });
      setTicketId(ticket.id);
      setMessage("票根已加入草稿，稍后可以在电脑上补充故事。");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "票根上传失败");
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  async function addPhotos(files: File[]) {
    const ticket = trip.tickets.find((item) => item.id === ticketId);
    if (!ticket) {
      setMessage("请先选择一张票根，再添加照片。");
      return;
    }
    setBusy(true);
    onBusyChange(true);
    let uploaded = 0;
    try {
      for (let index = 0; index < files.length; index += 1) {
        setMessage(`正在上传照片 ${index + 1} / ${files.length}`);
        const url = (await uploadImage(files[index], "photos")).url;
        onChangeTicket(ticket.id, (current) => ({ ...current, photos: [...current.photos, url] }));
        uploaded += 1;
      }
      setMessage(`已加入 ${uploaded} 张照片`);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "照片上传失败";
      setMessage(uploaded ? `已加入 ${uploaded} 张，其余未完成：${detail}` : detail);
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  return <main className="admin-mobile-quick">
    <header>
      <div><span>快速上传</span><h1>旅行管理台</h1></div>
      <button type="button" onClick={onLogout} disabled={busy || disabled}>退出</button>
    </header>
    <section className="admin-mobile-paper">
      <label className="admin-field"><span>选择旅行</span><select value={trip.id} onChange={(event) => onSelectTrip(event.target.value)}>{trips.map((item) => <option key={item.id} value={item.id}>{item.destination || "未命名旅行"}</option>)}</select></label>
      <div className="admin-mobile-trip-meta"><strong>{trip.destination || "未命名旅行"}</strong><span>{trip.dateLabel || trip.startDate}</span></div>

      <label className={`admin-mobile-upload${busy ? " is-busy" : ""}`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || disabled} onChange={(event) => { void addTicket(event.target.files?.[0]); event.target.value = ""; }} />
        <span aria-hidden="true">▱</span><strong>上传一张票根</strong><small>拍照或从相册选择</small>
      </label>

      <label className="admin-field"><span>照片归入哪张票根</span><select value={ticketId} onChange={(event) => setTicketId(event.target.value)} disabled={!trip.tickets.length}>{trip.tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.title || "未命名票根"}</option>)}</select></label>
      <label className={`admin-mobile-upload${busy ? " is-busy" : ""}`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || disabled || !trip.tickets.length} onChange={(event) => { void addPhotos([...(event.target.files ?? [])]); event.target.value = ""; }} />
        <span aria-hidden="true">▦</span><strong>添加旅行照片</strong><small>可以一次选择多张</small>
      </label>
      <p className="admin-live-message" aria-live="polite">{message}</p>
    </section>
    <footer><a href="/" onClick={(event) => { if (busy || disabled) { event.preventDefault(); setMessage("请等图片上传完成后再离开。"); return; } onLeave(event); }}>查看公开网站</a><span>完整编辑请使用电脑</span></footer>
  </main>;
}

export function AdminApp({ fallbackTrips }: { fallbackTrips: Trip[] }) {
  const localDemo = ["localhost", "127.0.0.1"].includes(location.hostname) && new URLSearchParams(location.search).has("demo");
  const [auth, setAuth] = useState<AuthState>(localDemo ? "ready" : "checking");
  const [loaded, setLoaded] = useState(localDemo);
  const [trips, setTrips] = useState<Trip[]>(() => structuredClone(fallbackTrips));
  const [selectedTripId, setSelectedTripId] = useState(fallbackTrips[0].id);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(fallbackTrips[0].tickets[0]?.id ?? null);
  const [section, setSection] = useState<Section>("story");
  const [saveStatus, setSaveStatus] = useState(localDemo ? "本地预览，不会上传" : "正在读取草稿");
  const [publishStatus, setPublishStatus] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const lastSavedRef = useRef("");
  const lastQueuedRef = useRef("");
  const saveQueueRef = useRef(Promise.resolve());
  const lastQueuedTaskRef = useRef<Promise<void>>(Promise.resolve());
  const saveTimerRef = useRef<number | undefined>(undefined);
  const tripsRef = useRef(trips);
  tripsRef.current = trips;

  const activeTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) ?? trips[0], [selectedTripId, trips]);
  const activeTicket = activeTrip.tickets.find((ticket) => ticket.id === selectedTicketId) ?? activeTrip.tickets[0];

  const queueSave = useCallback((serialized: string) => {
    if (localDemo || (serialized === lastSavedRef.current && serialized === lastQueuedRef.current)) return saveQueueRef.current;
    if (serialized === lastQueuedRef.current) return lastQueuedTaskRef.current;
    lastQueuedRef.current = serialized;
    setSaveStatus("正在保存草稿");
    const task = saveQueueRef.current.then(async () => {
      if (serialized === lastSavedRef.current) return;
      await api("/api/admin/draft", { method: "PUT", body: JSON.stringify({ trips: JSON.parse(serialized) }) });
      lastSavedRef.current = serialized;
      if (lastQueuedRef.current === serialized) setSaveStatus("草稿已保存");
    }).catch((cause) => {
      if (lastQueuedRef.current === serialized) lastQueuedRef.current = "";
      setSaveStatus(cause instanceof Error ? cause.message : "草稿保存失败");
      throw cause;
    });
    lastQueuedTaskRef.current = task;
    saveQueueRef.current = task.catch(() => undefined);
    return task;
  }, [localDemo]);

  const saveNow = useCallback(async () => {
    if (localDemo || auth !== "ready" || !loaded) return;
    if (saveTimerRef.current !== undefined) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = undefined;
    await queueSave(JSON.stringify(tripsRef.current));
  }, [auth, loaded, localDemo, queueSave]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "旅行管理台";
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    if (localDemo) return;
    void api<{ authenticated: boolean }>("/api/admin/session")
      .then((session) => { if (session.authenticated !== true) throw new Error("Not authenticated"); setAuth("ready"); })
      .catch(() => setAuth("guest"));
  }, [localDemo]);

  useEffect(() => {
    if (auth !== "ready" || loaded) return;
    void (async () => {
      let next = await loadPublishedTrips(structuredClone(fallbackTrips));
      try {
        const draft = await api<{ trips: unknown }>("/api/admin/draft");
        if (isDraftTrips(draft.trips)) next = draft.trips;
      } catch {
        // A missing draft is normal on first use.
      }
      setTrips(next);
      setSelectedTripId(next[0].id);
      setSelectedTicketId(next[0].tickets[0]?.id ?? null);
      lastSavedRef.current = JSON.stringify(next);
      lastQueuedRef.current = lastSavedRef.current;
      setLoaded(true);
      setSaveStatus("草稿已就绪");
    })();
  }, [auth, fallbackTrips, loaded]);

  useEffect(() => {
    if (!loaded || auth !== "ready" || localDemo) return;
    const serialized = JSON.stringify(trips);
    if (serialized === lastSavedRef.current) return;
    const timer = window.setTimeout(() => {
      if (saveTimerRef.current === timer) saveTimerRef.current = undefined;
      void queueSave(serialized).catch(() => undefined);
    }, 900);
    saveTimerRef.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (saveTimerRef.current === timer) saveTimerRef.current = undefined;
    };
  }, [auth, loaded, localDemo, queueSave, trips]);

  useEffect(() => {
    if (!loaded || auth !== "ready" || localDemo) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!uploading && JSON.stringify(tripsRef.current) === lastSavedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [auth, loaded, localDemo, uploading]);

  useEffect(() => {
    if (!trips.some((trip) => trip.id === selectedTripId)) setSelectedTripId(trips[0].id);
  }, [selectedTripId, trips]);

  useEffect(() => {
    if (!activeTrip.tickets.some((ticket) => ticket.id === selectedTicketId)) setSelectedTicketId(activeTrip.tickets[0]?.id ?? null);
  }, [activeTrip, selectedTicketId]);

  const replaceTrip = useCallback((next: Trip) => {
    setTrips((current) => current.map((trip) => trip.id === next.id ? next : trip));
  }, []);

  function updateTrip(change: (trip: Trip) => Trip) {
    replaceTrip(change(activeTrip));
  }

  function addTrip() {
    const trip = makeTrip();
    setTrips((current) => [trip, ...current]);
    setSelectedTripId(trip.id);
    setSelectedTicketId(null);
    setSection("story");
  }

  function deleteTrip() {
    if (trips.length === 1) {
      setSaveStatus("至少保留一段旅行");
      return;
    }
    if (!window.confirm(`删除“${activeTrip.destination || "未命名旅行"}”及其中的票根吗？`)) return;
    const next = trips.filter((trip) => trip.id !== activeTrip.id);
    setTrips(next);
    setSelectedTripId(next[0].id);
  }

  function addTicket(kind: "scan" | "template") {
    const ticket = makeTicket(kind);
    updateTrip((trip) => ({ ...trip, tickets: [...trip.tickets, ticket] }));
    setSelectedTicketId(ticket.id);
    setSection("tickets");
  }

  function changeTicket(id: string, change: (ticket: Ticket) => Ticket) {
    setTrips((current) => current.map((trip) => ({
      ...trip,
      tickets: trip.tickets.map((ticket) => ticket.id === id ? change(ticket) : ticket),
    })));
  }

  function deleteTicket(id: string) {
    const ticket = activeTrip.tickets.find((item) => item.id === id);
    if (!ticket || !window.confirm(`删除“${ticket.title || "未命名票根"}”吗？`)) return;
    updateTrip((trip) => ({ ...trip, tickets: trip.tickets.filter((item) => item.id !== id) }));
  }

  async function loadVersions() {
    if (localDemo) return;
    try {
      setVersions((await api<{ versions: Version[] }>("/api/admin/versions")).versions);
    } catch {
      setVersions([]);
    }
  }

  async function publish() {
    if (publishing) return;
    if (uploading) {
      setPublishStatus("请等图片上传完成后再发布。");
      return;
    }
    setPublishStatus("");
    try {
      validateTrips(trips);
    } catch (cause) {
      setPublishStatus(friendlyValidation(cause));
      return;
    }
    if (localDemo) {
      setPublishStatus("本地预览不会发布，部署后即可使用正式发布功能。");
      return;
    }
    setPublishing(true);
    setPublishStatus("正在发布…");
    try {
      await saveNow();
      const result = await api<{ publishedAt: string }>("/api/admin/publish", { method: "POST", body: JSON.stringify({ trips }) });
      setPublishStatus(`已发布，时间 ${new Date(result.publishedAt).toLocaleString("zh-CN")}`);
      await loadVersions();
    } catch (cause) {
      setPublishStatus(cause instanceof Error ? cause.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  }

  async function restore(version: string) {
    if (publishing) return;
    if (uploading) {
      setPublishStatus("请等图片上传完成后再恢复版本。");
      return;
    }
    if (!window.confirm("恢复这个版本并替换当前公开内容吗？草稿不会被覆盖。")) return;
    setPublishing(true);
    setPublishStatus("正在恢复…");
    try {
      const result = await api<{ publishedAt: string }>("/api/admin/publish", { method: "POST", body: JSON.stringify({ version }) });
      setPublishStatus(`已恢复，时间 ${new Date(result.publishedAt).toLocaleString("zh-CN")}`);
      await loadVersions();
    } catch (cause) {
      setPublishStatus(cause instanceof Error ? cause.message : "恢复失败");
    } finally {
      setPublishing(false);
    }
  }

  async function logout() {
    if (uploading) {
      window.alert("请等图片上传完成后再退出。");
      return;
    }
    try {
      await saveNow();
    } catch {
      window.alert("草稿还没有保存成功，请检查网络后再退出。");
      return;
    }
    if (!localDemo) await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => undefined);
    setAuth("guest");
    setLoaded(false);
  }

  async function leaveToSite(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (uploading) {
      window.alert("请等图片上传完成后再离开。");
      return;
    }
    try {
      await saveNow();
      window.location.assign("/");
    } catch {
      window.alert("草稿还没有保存成功，请检查网络后再离开。");
    }
  }

  if (auth === "checking") return <main id="admin-main" className="admin-loading"><span aria-hidden="true">⌖</span><p>正在打开旅行管理台</p></main>;
  if (auth === "guest") return <><a className="skip-link" href="#admin-main">跳到登录</a><Login onSuccess={() => setAuth("ready")} /></>;
  if (!loaded) return <main id="admin-main" className="admin-loading"><span aria-hidden="true">⌖</span><p>正在读取旅行草稿</p></main>;

  return <div id="admin-main" className="admin-root" tabIndex={-1}>
    <a className="skip-link" href="#admin-main">跳到管理内容</a>
    <MobileQuickUpload trips={trips} selectedTripId={activeTrip.id} onSelectTrip={setSelectedTripId} onChangeTrip={replaceTrip} onChangeTicket={changeTicket} onBusyChange={setUploading} onLeave={leaveToSite} onLogout={logout} disabled={uploading} />

    <div className="admin-desktop-shell">
      <header className="admin-topbar">
        <a href="/" className="admin-brand" onClick={leaveToSite}><span aria-hidden="true">⌖</span><div><strong>旅行管理台</strong><small>MEMORY WAYPOINTS</small></div></a>
        <div className="admin-save-state" aria-live="polite"><i className={saveStatus.includes("失败") ? "is-error" : ""} />{saveStatus}</div>
        <div className="admin-top-actions"><a href="/" target="_blank" rel="noreferrer">查看网站</a><button type="button" onClick={logout}>退出</button></div>
      </header>

      <aside className="admin-trip-sidebar" aria-label="旅行列表">
        <div className="admin-sidebar-heading"><span>你们的旅行</span><button type="button" onClick={addTrip}>＋ 新建</button></div>
        <nav>
          {trips.map((trip, index) => <button key={trip.id} type="button" className={trip.id === activeTrip.id ? "is-selected" : ""} aria-current={trip.id === activeTrip.id ? "page" : undefined} onClick={() => setSelectedTripId(trip.id)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{trip.destination || "未命名旅行"}</strong><small>{trip.country || "待填写地点"} · {trip.startDate}</small></div>
            <i style={{ backgroundColor: trip.routeColor }} />
          </button>)}
        </nav>
        <div className="admin-sidebar-foot"><strong>{trips.length}</strong><span>段共同旅程</span></div>
      </aside>

      <main id="admin-editor" className="admin-workspace">
        <header className="admin-workspace-heading">
          <div><span>正在编辑</span><h1>{activeTrip.destination || "未命名旅行"}</h1><p>{activeTrip.country || "先填写旅行地点"} · {activeTrip.dateLabel || activeTrip.startDate}</p></div>
          <button type="button" className="admin-danger-link" onClick={deleteTrip}>删除旅行</button>
        </header>
        <nav className="admin-step-nav" aria-label="编辑步骤">
          {sections.map((item) => <button key={item.id} type="button" aria-current={section === item.id ? "step" : undefined} onClick={() => { setSection(item.id); if (item.id === "publish") void loadVersions(); }}><span>{item.number}</span>{item.label}</button>)}
        </nav>

        <div className="admin-workspace-content">
          {section === "story" && <section aria-labelledby="story-editor-title" className="admin-form-section">
            <header><p>旅行信息</p><h2 id="story-editor-title">先写下这段旅程的名字</h2><span>这些内容会显示在地图章节的开头。</span></header>
            <div className="admin-field-grid">
              <label className="admin-field admin-field--wide"><span>旅行标题</span><input value={activeTrip.destination} onChange={(event) => updateTrip((trip) => ({ ...trip, destination: event.target.value }))} placeholder="例如：海边的周末" maxLength={80} /></label>
              <label className="admin-field"><span>地点</span><input value={activeTrip.country} onChange={(event) => updateTrip((trip) => ({ ...trip, country: event.target.value }))} placeholder="例如：厦门" maxLength={80} /></label>
              <label className="admin-field"><span>开始日期</span><input type="date" value={activeTrip.startDate} onChange={(event) => updateTrip((trip) => ({ ...trip, startDate: event.target.value }))} /></label>
              <label className="admin-field admin-field--wide"><span>展示日期</span><input value={activeTrip.dateLabel} onChange={(event) => updateTrip((trip) => ({ ...trip, dateLabel: event.target.value }))} placeholder="例如：2026年7月10日 – 7月13日" maxLength={100} /></label>
              <label className="admin-field"><span>路线颜色</span><div className="admin-color-field"><input type="color" value={activeTrip.routeColor} onChange={(event) => updateTrip((trip) => ({ ...trip, routeColor: event.target.value }))} /><code>{activeTrip.routeColor}</code></div></label>
              <label className="admin-field"><span>地图气氛</span><select value={activeTrip.mapTone} onChange={(event) => updateTrip((trip) => ({ ...trip, mapTone: event.target.value as Trip["mapTone"] }))}><option value="night">夜色</option><option value="mist">雾色</option><option value="paper">纸色</option></select></label>
            </div>
            <div className="admin-next-step"><p>下一步可以导入手机或运动软件导出的轨迹。</p><button type="button" className="admin-primary" onClick={() => setSection("route")}>继续整理轨迹</button></div>
          </section>}

          {section === "route" && <div className="admin-route-section">
            <p className="admin-route-intro">上传 GPX 或 GeoJSON，系统会自动画出路线。也可以直接在地图上补点和调整顺序。</p>
            <RouteEditor route={activeTrip.route} color={activeTrip.routeColor} onChange={(route) => updateTrip((trip) => ({ ...trip, route }))} />
          </div>}

          {section === "tickets" && <TicketEditor
            tickets={activeTrip.tickets}
            selectedId={selectedTicketId}
            onSelect={setSelectedTicketId}
            onAdd={addTicket}
            onChange={changeTicket}
            onDelete={deleteTicket}
            onBusyChange={setUploading}
            disabled={uploading}
          />}

          {section === "publish" && <section className="admin-publish" aria-labelledby="publish-title">
            <header><p>发布检查</p><h2 id="publish-title">让这段回忆出现在网站上</h2><span>发布只替换旅行内容，不会改变现有地图和票根动画。</span></header>
            <div className="admin-publish-summary">
              <div><strong>{trips.length}</strong><span>段旅行</span></div>
              <div><strong>{trips.reduce((sum, trip) => sum + trip.tickets.length, 0)}</strong><span>张票根</span></div>
              <div><strong>{trips.reduce((sum, trip) => sum + trip.tickets.reduce((count, ticket) => count + ticket.photos.length, 0), 0)}</strong><span>张照片</span></div>
            </div>
            <div className="admin-publish-action"><div><strong>准备好后发布</strong><p>公开网站会在刷新后读取最新内容，不需要重新部署。</p></div><button type="button" className="admin-publish-button" disabled={publishing} onClick={() => void publish()}>{publishing ? "正在处理" : "发布到网站"}</button></div>
            <p className="admin-publish-status" aria-live="polite">{publishStatus}</p>
            <div className="admin-version-list"><header><strong>最近发布版本</strong><span>需要时可以恢复</span></header>{versions.length ? versions.map((version) => <div key={version.pathname}><span>{new Date(version.uploadedAt).toLocaleString("zh-CN")}</span><button type="button" disabled={publishing} onClick={() => void restore(version.pathname)}>恢复</button></div>) : <p>还没有可恢复的线上版本</p>}</div>
          </section>}
        </div>
      </main>

      <AdminPreview trip={activeTrip} ticket={activeTicket} />
    </div>
  </div>;
}
