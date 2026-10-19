import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  CloudFog,
  Copy,
  Crosshair,
  Download,
  Eraser,
  Eye,
  FileUp,
  Flame,
  Focus,
  Globe,
  Grid3X3,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Link,
  Map,
  Maximize2,
  MessageSquare,
  MousePointer2,
  MoveUpRight,
  Pause,
  PenLine,
  Play,
  Redo2,
  RotateCcw,
  Route,
  Save,
  Settings2,
  Shield,
  Sparkles,
  Swords,
  Timer,
  Trash2,
  Trophy,
  Undo2,
  Users,
  Video,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Language } from "../lib/i18n";
import Modal from "../components/Modal";
import {
  COLORS,
  GAMES,
  clock,
  decodeBoard,
  loadBoard,
  newBoard,
  saveBoard,
  shareBoard,
  validBoard,
} from "./model";
import type { BoardDoc, Layers as LayerState, StudioGame, Tool } from "./model";
import { studioText } from "./text";
import type { StudioKey } from "./text";
import TacticalBoard from "./TacticalBoard";
import DraftStudio from "./DraftStudio";
import VodStudio from "./VodStudio";
import CoachPanel from "./CoachPanel";
import { download, exportGif, exportPng } from "./exports";
import "./studio.css";
type Mode = "canvas" | "draft" | "vod" | "coach";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const modes = [
  { id: "canvas", icon: LayoutDashboard },
  { id: "draft", icon: Swords },
  { id: "vod", icon: Video },
  { id: "coach", icon: BrainCircuit },
] as const;
const tools = [
  { id: "select", icon: MousePointer2 },
  { id: "player", icon: Users },
  { id: "pen", icon: PenLine },
  { id: "arrow", icon: MoveUpRight },
  { id: "curve", icon: Route },
  { id: "smoke", icon: CloudFog },
  { id: "flash", icon: Zap },
  { id: "molotov", icon: Flame },
  { id: "grenade", icon: Crosshair },
  { id: "note", icon: MessageSquare },
  { id: "erase", icon: Eraser },
] as const;
function readLanguage(): Language {
  try {
    return localStorage.getItem("nexus-language") === "en" ? "en" : "he";
  } catch {
    return "he";
  }
}
export default function Studio({ onArena }: { onArena: () => void }) {
  const [lang, setLang] = useState(readLanguage),
    [mode, setMode] = useState<Mode>("canvas"),
    [doc, setDoc] = useState<BoardDoc>(() => loadBoard("cs2", "Mirage")),
    [past, setPast] = useState<BoardDoc[]>([]),
    [future, setFuture] = useState<BoardDoc[]>([]),
    [tool, setTool] = useState<Tool>("select"),
    [color, setColor] = useState(COLORS[0]),
    [label, setLabel] = useState(""),
    [role, setRole] = useState<string>("IGL"),
    [time, setTime] = useState(105),
    [playing, setPlaying] = useState(false),
    [zoom, setZoom] = useState(1),
    [fitVersion, setFitVersion] = useState(0),
    [message, setMessage] = useState(""),
    [exportOpen, setExportOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [showLayers, setShowLayers] = useState(false),
    [showCoach, setShowCoach] = useState(false),
    [dialog, setDialog] = useState<"help" | "clear" | "link" | null>(null),
    [shareUrl, setShareUrl] = useState(""),
    [install, setInstall] = useState<InstallEvent | null>(null),
    [offline, setOffline] = useState(!navigator.onLine),
    [saved, setSaved] = useState(true),
    [wave, setWave] = useState("slow");
  const t = useCallback((key: StudioKey) => studioText[lang][key], [lang]),
    boardRef = useRef<SVGSVGElement>(null),
    fileRef = useRef<HTMLInputElement>(null),
    game = doc.game;
  const closeDialog = useCallback(() => setDialog(null), []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.title = "NEXUS Studio — Tactical Intelligence";
    try {
      localStorage.setItem("nexus-language", lang);
    } catch {}
  }, [lang]);
  useEffect(() => {
    setSaved(saveBoard(doc));
  }, [doc]);
  useEffect(() => {
    let alive = true;
    if (location.hash.startsWith("#plan="))
      void decodeBoard(location.hash).then((shared) => {
        if (!alive) return;
        if (shared) {
          setDoc(shared);
          setTime(shared.duration);
          setRole(GAMES[shared.game].roles[0]);
          setMessage(studioText[readLanguage()].safeLink);
        } else setMessage(studioText[readLanguage()].invalid);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const network = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", prompt);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    return () => {
      window.removeEventListener("beforeinstallprompt", prompt);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      setTime((value) => {
        const next = Math.min(doc.duration, value + delta * 4);
        if (next === doc.duration) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, doc.duration]);
  const change = useCallback(
    (next: BoardDoc) => {
      setPast((history) => [...history.slice(-29), doc]);
      setFuture([]);
      setDoc(next);
    },
    [doc],
  );
  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture([doc, ...future]);
    setDoc(past.at(-1)!);
    setPast(past.slice(0, -1));
  }, [doc, past, future]);
  const redo = useCallback(() => {
    if (!future.length) return;
    setPast([...past, doc]);
    setDoc(future[0]);
    setFuture(future.slice(1));
  }, [doc, past, future]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo]);
  const fit = () => {
    setZoom(1);
    setFitVersion((v) => v + 1);
  };
  const switchBoard = (
    nextGame: StudioGame,
    map = GAMES[nextGame].maps[0] as string,
  ) => {
    setDoc(loadBoard(nextGame, map));
    setPast([]);
    setFuture([]);
    setTime(GAMES[nextGame].duration);
    setPlaying(false);
    setRole(GAMES[nextGame].roles[0]);
    setTool("select");
    fit();
  };
  const toggleLayer = (key: keyof LayerState) =>
    change({ ...doc, layers: { ...doc.layers, [key]: !doc.layers[key] } });
  const startExport = async (type: "png" | "gif") => {
    if (!boardRef.current || busy) return;
    setPlaying(false);
    setBusy(true);
    setExportOpen(false);
    setMessage(t("exporting"));
    try {
      if (type === "png") await exportPng(boardRef.current, doc.name);
      else await exportGif(boardRef.current, doc);
      setMessage(t("exported"));
    } catch {
      setMessage(t("exportError"));
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    try {
      const url = await shareBoard(doc);
      if (url.length > 12000) {
        setMessage(t("shareLong"));
        return;
      }
      setShareUrl(url);
      setExportOpen(false);
      try {
        await navigator.clipboard.writeText(url);
        setMessage(t("copied"));
      } catch {
        setDialog("link");
      }
    } catch {
      setMessage(t("exportError"));
    }
  };
  const installApp = async () => {
    if (install) {
      await install.prompt();
      await install.userChoice;
      setInstall(null);
    } else setMessage(t("installHelp"));
  };
  const layerKeys: (keyof LayerState)[] = [
    "grid",
    "vision",
    "danger",
    "objectives",
    ...(game === "mlbb"
      ? (["jungle", "bushes", "turrets"] as const)
      : game === "ow2"
        ? (["highground", "sightlines"] as const)
        : []),
  ];
  const marks = doc.marks,
    players = marks.filter((m) => m.tool === "player"),
    utilities = marks.filter((m) =>
      ["smoke", "flash", "molotov", "grenade"].includes(m.tool),
    ),
    routes = marks.filter((m) => ["arrow", "curve"].includes(m.tool));
  const flashRisk = players.filter((p) =>
    marks.some(
      (m) =>
        m.tool === "flash" &&
        m.time <= time &&
        Math.hypot(
          p.points[0].x - m.points.at(-1)!.x,
          p.points[0].y - m.points.at(-1)!.y,
        ) < 65,
    ),
  ).length;
  return (
    <div className={`studio studio-${game}`}>
      <aside className="studio-rail">
        <button
          className="studio-logo"
          onClick={() => setMode("canvas")}
          aria-label={t("studio")}
        >
          N<span />
        </button>
        <span className="rail-divider" />
        {modes.map(({ id, icon: Icon }) => (
          <button
            className={`rail-button ${mode === id ? "active" : ""}`}
            key={id}
            title={t(id)}
            aria-label={t(id)}
            onClick={() => {
              setMode(id);
              setPlaying(false);
            }}
          >
            <Icon size={22} />
            <span />
          </button>
        ))}
        <div className="rail-bottom">
          <button
            className="rail-button"
            title={t("arena")}
            aria-label={t("arena")}
            onClick={onArena}
          >
            <Trophy size={21} />
          </button>
          <button
            className="rail-button"
            title={t("help")}
            aria-label={t("help")}
            onClick={() => setDialog("help")}
          >
            <HelpCircle size={21} />
          </button>
          <div className="studio-user">N</div>
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-topbar">
          <div className="studio-wordmark">
            NEXUS <span>STUDIO</span>
            <b>BETA</b>
          </div>
          <div
            className="studio-game-switch"
            role="group"
            aria-label={t("map")}
          >
            {(Object.keys(GAMES) as StudioGame[]).map((id) => (
              <button
                className={game === id ? "active" : ""}
                key={id}
                onClick={() => switchBoard(id)}
              >
                {id === "cs2" ? (
                  <Crosshair size={16} />
                ) : id === "mlbb" ? (
                  <Shield size={16} />
                ) : (
                  <Swords size={16} />
                )}
                <span>{GAMES[id].name}</span>
                <small>{GAMES[id].short}</small>
              </button>
            ))}
          </div>
          <div className="studio-top-actions">
            <button
              aria-label="עברית / English"
              className="studio-language"
              onClick={() => setLang(lang === "he" ? "en" : "he")}
            >
              <Globe size={15} />
              {lang === "he" ? "EN" : "עב"}
            </button>
            <button
              className="studio-install"
              aria-label={t("install")}
              onClick={installApp}
            >
              <Download size={15} />
              <span>{t("install")}</span>
            </button>
            <span className="studio-top-divider" />
            <div className="studio-top-user">
              <div>N</div>
              <span>
                NexusPlayer<small>{t("workspace")}</small>
              </span>
              <ChevronDown size={12} />
            </div>
          </div>
        </header>
        {offline && <div className="studio-offline">{t("offline")}</div>}
        <main className="studio-content">
          <section className="studio-intro">
            <div>
              <div className="studio-kicker">
                <span /> {t("battle")}
              </div>
              <h1>
                {t("title")} <span>{t("subtitle")}</span>
              </h1>
              <p>{t("description")}</p>
            </div>
            <div className="studio-status">
              <i className="pulse-dot" />
              {t(offline ? "noNetwork" : "status")}
              <small>v2.0 / {t("local")}</small>
            </div>
          </section>
          <div className="studio-modebar">
            <nav>
              {modes.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  className={mode === id ? "active" : ""}
                  onClick={() => {
                    setMode(id);
                    setPlaying(false);
                  }}
                >
                  <Icon size={16} />
                  {t(id)}
                  {id === "coach" && <small>β</small>}
                </button>
              ))}
            </nav>
            <span className={`save-state ${saved ? "" : "error"}`}>
              <span className="pulse-dot" />
              {t(saved ? "saved" : "saveError")}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              {mode === "canvas" && (
                <div
                  className={`workspace-grid ${showCoach ? "coach-visible" : ""}`}
                >
                  <div className="canvas-workspace">
                    <div className="canvas-header">
                      <div className="map-selector">
                        <span className="map-icon">
                          <Map size={21} />
                        </span>
                        <div>
                          <span className="studio-kicker">{t("map")}</span>
                          <select
                            aria-label={t("map")}
                            value={doc.map}
                            onChange={(e) => switchBoard(game, e.target.value)}
                          >
                            {GAMES[game].maps.map((map) => (
                              <option key={map}>{map}</option>
                            ))}
                          </select>
                        </div>
                        <span className="map-mode">
                          {game === "cs2"
                            ? "5v5"
                            : game === "mlbb"
                              ? "MOBA"
                              : doc.map === "Flashpoint"
                                ? t("flashpoint")
                                : t("escort")}
                        </span>
                      </div>
                      <div className="canvas-actions">
                        <button
                          className={`studio-icon ${showLayers ? "active" : ""}`}
                          aria-label={t("layers")}
                          onClick={() => setShowLayers(!showLayers)}
                        >
                          <Layers size={17} />
                        </button>
                        <button
                          className={`studio-icon ${showCoach ? "active" : ""}`}
                          aria-label={t("coach")}
                          onClick={() => setShowCoach(!showCoach)}
                        >
                          <BrainCircuit size={18} />
                        </button>
                        <div className="export-control">
                          <button
                            className="studio-button accent"
                            disabled={busy}
                            onClick={() => setExportOpen(!exportOpen)}
                          >
                            <ArrowDownToLine size={15} />
                            <span>{t("export")}</span>
                            <ChevronDown size={12} />
                          </button>
                          {exportOpen && (
                            <div className="export-menu">
                              <button onClick={() => void startExport("png")}>
                                <Download size={15} />
                                {t("png")}
                              </button>
                              <button onClick={() => void startExport("gif")}>
                                <Video size={15} />
                                {t("gif")}
                              </button>
                              <button onClick={() => void share()}>
                                <Link size={15} />
                                {t("share")}
                              </button>
                              <button
                                onClick={() => {
                                  download(
                                    new Blob([JSON.stringify(doc, null, 2)], {
                                      type: "application/json",
                                    }),
                                    doc.name + ".nexus.json",
                                  );
                                  setExportOpen(false);
                                }}
                              >
                                <Save size={15} />
                                {t("file")}
                              </button>
                              <button onClick={() => fileRef.current?.click()}>
                                <FileUp size={15} />
                                {t("import")}
                              </button>
                              <p>{t("gifNote")}</p>
                              <p>{t("shareNote")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="plan-titlebar">
                      <div>
                        <span className="plan-icon">
                          <Route size={14} />
                        </span>
                        <input
                          aria-label={t("name")}
                          value={doc.name}
                          maxLength={120}
                          onChange={(e) =>
                            setDoc({ ...doc, name: e.target.value })
                          }
                        />
                        <span className="plan-dot" />
                      </div>
                      <div>
                        <button
                          className="studio-icon"
                          disabled={!past.length}
                          onClick={undo}
                          aria-label={t("undo")}
                        >
                          <Undo2 size={16} />
                        </button>
                        <button
                          className="studio-icon"
                          disabled={!future.length}
                          onClick={redo}
                          aria-label={t("redo")}
                        >
                          <Redo2 size={16} />
                        </button>
                        <span className="small-divider" />
                        <button
                          className="studio-icon"
                          onClick={() => setDialog("clear")}
                          aria-label={t("clear")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="map-stage">
                      <div className="map-top-label">
                        <span className="pulse-dot" />
                        {doc.map.toUpperCase()}
                        <span>{t("model")}</span>
                      </div>
                      <TacticalBoard
                        key={`${game}-${doc.map}-${fitVersion}`}
                        ref={boardRef}
                        doc={doc}
                        onChange={change}
                        tool={tool}
                        color={color}
                        label={label}
                        role={role}
                        time={time}
                        playing={playing}
                        zoom={zoom}
                        setZoom={setZoom}
                        t={t}
                      />
                      <div
                        className="floating-palette"
                        role="toolbar"
                        aria-label={t("tools")}
                      >
                        {tools
                          .filter(
                            (item) =>
                              game === "cs2" ||
                              ![
                                "smoke",
                                "flash",
                                "molotov",
                                "grenade",
                              ].includes(item.id),
                          )
                          .map(({ id, icon: Icon }) => (
                            <button
                              key={id}
                              className={tool === id ? "active" : ""}
                              title={t(id)}
                              aria-label={t(id)}
                              aria-pressed={tool === id}
                              onClick={() => {
                                setTool(id);
                                if (doc.marks.length >= 400)
                                  setMessage(t("limit"));
                              }}
                            >
                              <Icon size={18} />
                            </button>
                          ))}
                        <span className="palette-divider" />
                        <button
                          className="tool-color"
                          title={t("color")}
                          aria-label={t("color")}
                          onClick={() =>
                            setColor(
                              COLORS[
                                (COLORS.indexOf(color) + 1) % COLORS.length
                              ],
                            )
                          }
                        >
                          <i style={{ background: color }} />
                        </button>
                      </div>
                      <div className="map-controls">
                        <button
                          className="studio-icon"
                          aria-label={t("zoomOut")}
                          onClick={() => setZoom(Math.max(0.65, zoom - 0.15))}
                        >
                          <ZoomOut size={15} />
                        </button>
                        <span>{Math.round(zoom * 100)}%</span>
                        <button
                          className="studio-icon"
                          aria-label={t("zoomIn")}
                          onClick={() => setZoom(Math.min(3, zoom + 0.15))}
                        >
                          <ZoomIn size={15} />
                        </button>
                        <span className="small-divider" />
                        <button
                          className="studio-icon"
                          aria-label={t("fit")}
                          onClick={fit}
                        >
                          <Maximize2 size={15} />
                        </button>
                      </div>
                      <div className="map-compass">
                        N <span>↑</span>
                      </div>
                      {showLayers && (
                        <div className="layers-popover">
                          <div className="studio-card-heading">
                            <h3>
                              <Layers size={15} />
                              {t("layers")}
                            </h3>
                            <button
                              className="studio-icon"
                              aria-label={t("close")}
                              onClick={() => setShowLayers(false)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {layerKeys.map((key) => (
                            <label key={key}>
                              <span>{t(key)}</span>
                              <input
                                type="checkbox"
                                checked={doc.layers[key]}
                                onChange={() => toggleLayer(key)}
                              />
                              <span className="toggle-visual" />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="canvas-footnote">
                      <span>
                        <MousePointer2 size={12} />
                        {t("hint")}
                      </span>
                      <span>{t("schematic")}</span>
                    </div>
                    <section className="execute-timeline">
                      <div className="timeline-heading">
                        <div>
                          <Timer size={16} />
                          <h3>{t("timeline")}</h3>
                          <span className="timeline-badge">
                            {utilities.length + routes.length} {t("planEvents")}
                          </span>
                        </div>
                        <strong dir="ltr">
                          {clock(time)} <small>/ {clock(doc.duration)}</small>
                        </strong>
                      </div>
                      <div className="timeline-track">
                        <button
                          className="play-button"
                          aria-label={t(playing ? "pause" : "play")}
                          onClick={() => {
                            if (time >= doc.duration) setTime(0);
                            setPlaying(!playing);
                          }}
                        >
                          {playing ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <div className="timeline-slider">
                          <div className="timeline-ticks">
                            {Array.from({ length: 7 }, (_, i) => (
                              <span key={i}>
                                {clock((doc.duration * i) / 6)}
                              </span>
                            ))}
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={doc.duration}
                            step=".1"
                            aria-label={t("timeline")}
                            value={time}
                            onChange={(e) => {
                              setTime(Number(e.target.value));
                              setPlaying(false);
                            }}
                          />
                          <div className="event-pips">
                            {[...routes, ...utilities].map((mark) => (
                              <button
                                key={mark.id}
                                style={{
                                  left: `${(mark.time / doc.duration) * 100}%`,
                                  background: mark.color,
                                }}
                                title={`${t(mark.tool)} ${clock(mark.time)}`}
                                aria-label={`${t(mark.tool)} ${clock(mark.time)}`}
                                onClick={() => setTime(mark.time)}
                              />
                            ))}
                          </div>
                        </div>
                        <button
                          className="studio-icon"
                          aria-label={t("reset")}
                          onClick={() => {
                            setPlaying(false);
                            setTime(0);
                          }}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                      <div className="timeline-legend">
                        <span>
                          <i style={{ background: "#00f0ff" }} />
                          {t("paths")}
                        </span>
                        <span>
                          <i style={{ background: "#00ff88" }} />
                          {t("utilities")}
                        </span>
                        <span>
                          <i style={{ background: "#ffb800" }} />
                          {t("notes")}
                        </span>
                        <button
                          onClick={() => {
                            change(newBoard(game, doc.map));
                            setTime(doc.duration);
                          }}
                        >
                          {t("template")}
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </section>
                    <div className="tool-settings">
                      <label>
                        {t("label")}
                        <input
                          value={label}
                          maxLength={80}
                          onChange={(e) => setLabel(e.target.value)}
                          placeholder={t(tool === "player" ? "player" : "note")}
                        />
                      </label>
                      <label>
                        {t("role")}
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        >
                          {GAMES[game].roles.map((r, i) => (
                            <option key={i}>{r}</option>
                          ))}
                        </select>
                      </label>
                      <div className="color-options" aria-label={t("color")}>
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            aria-label={c}
                            style={{ background: c }}
                            className={color === c ? "active" : ""}
                            onClick={() => setColor(c)}
                          />
                        ))}
                      </div>
                    </div>
                    {game === "mlbb" && (
                      <div className="wave-planner studio-card">
                        <div>
                          <h3>{t("wave")}</h3>
                          <p>{t("waveHint")}</p>
                        </div>
                        <div className="studio-segment">
                          {["freeze", "push", "slow"].map((value) => (
                            <button
                              className={wave === value ? "active" : ""}
                              onClick={() => setWave(value)}
                              key={value}
                            >
                              {t(value as StudioKey)}
                            </button>
                          ))}
                        </div>
                        <span>
                          {t(wave as StudioKey)} →{" "}
                          {time < 120 ? t("turtle") : t("lord")} ·{" "}
                          {clock(Math.max(0, (time < 120 ? 120 : 480) - time))}
                        </span>
                        <p>{t("timerNote")}</p>
                      </div>
                    )}
                  </div>
                  <aside className="workspace-sidebar">
                    {showCoach ? (
                      <CoachPanel doc={doc} t={t} />
                    ) : (
                      <>
                        <section className="studio-card plan-overview">
                          <div className="studio-card-heading">
                            <h3>
                              <Focus size={16} />
                              {t("analysis")}
                            </h3>
                            <span className="studio-model">{t("local")}</span>
                          </div>
                          <div className="plan-stats">
                            <div>
                              <Users size={17} />
                              <strong>
                                {players.length}
                                <small>/5</small>
                              </strong>
                              <span>{t("players")}</span>
                            </div>
                            <div>
                              <CloudFog size={17} />
                              <strong>
                                {utilities.length.toString().padStart(2, "0")}
                              </strong>
                              <span>{t("utilities")}</span>
                            </div>
                            <div>
                              <Route size={17} />
                              <strong>
                                {routes.length.toString().padStart(2, "0")}
                              </strong>
                              <span>{t("paths")}</span>
                            </div>
                          </div>
                          <div className="plan-roles">
                            {players.slice(0, 5).map((player, i) => (
                              <div key={player.id}>
                                <span
                                  className="role-token"
                                  style={{ color: player.color }}
                                >
                                  {player.label.slice(0, 2)}
                                </span>
                                <span>
                                  <strong>{player.role || t("player")}</strong>
                                  <small>
                                    {player.points[0].x.toFixed(0)},{" "}
                                    {player.points[0].y.toFixed(0)}
                                  </small>
                                </span>
                                <span className="role-state">
                                  <i />
                                  {i === 0 ? "IGL" : t("ready")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                        <section className="studio-card insight-card">
                          <div className="studio-card-heading">
                            <h3>
                              <Sparkles size={16} />
                              {t("tips")}
                            </h3>
                            <span className="studio-model">BETA</span>
                          </div>
                          <p>
                            {t(
                              game === "cs2"
                                ? "csTip"
                                : game === "mlbb"
                                  ? "mlTip"
                                  : "owTip",
                            )}
                          </p>
                          <button onClick={() => setShowCoach(true)}>
                            {t("analyze")}
                            <ArrowUpRight size={14} />
                          </button>
                          <div className="insight-decoration">
                            <BrainCircuit size={80} />
                          </div>
                        </section>
                        <section className="studio-card layer-summary">
                          <div className="studio-card-heading">
                            <h3>
                              <Layers size={16} />
                              {t("layers")}
                            </h3>
                            <button
                              className="studio-icon"
                              onClick={() => setShowLayers(!showLayers)}
                              aria-label={t("edit")}
                            >
                              <Settings2 size={15} />
                            </button>
                          </div>
                          {layerKeys
                            .slice(0, game === "cs2" ? 4 : 6)
                            .map((key) => (
                              <label key={key}>
                                <span>
                                  {key === "vision" ? (
                                    <Eye size={14} />
                                  ) : key === "grid" ? (
                                    <Grid3X3 size={14} />
                                  ) : key === "objectives" ? (
                                    <Timer size={14} />
                                  ) : (
                                    <Layers size={14} />
                                  )}{" "}
                                  {t(key)}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={doc.layers[key]}
                                  onChange={() => toggleLayer(key)}
                                />
                                <span className="toggle-visual" />
                              </label>
                            ))}
                        </section>
                      </>
                    )}
                    <section className="studio-card event-list">
                      <div className="studio-card-heading">
                        <h3>
                          <Timer size={15} />
                          {t("planEvents")}
                        </h3>
                        <span>{routes.length + utilities.length}</span>
                      </div>
                      {[...routes, ...utilities]
                        .sort((a, b) => a.time - b.time)
                        .slice(0, 5)
                        .map((mark) => (
                          <button
                            key={mark.id}
                            onClick={() => {
                              setTime(mark.time);
                              setPlaying(false);
                            }}
                          >
                            <span
                              className="event-icon"
                              style={{ color: mark.color }}
                            >
                              {mark.tool === "curve" ? (
                                <Route size={14} />
                              ) : (
                                <CloudFog size={14} />
                              )}
                            </span>
                            <span>
                              <strong>{t(mark.tool)}</strong>
                              <small>
                                {mark.points.at(-1)!.x.toFixed(0)},{" "}
                                {mark.points.at(-1)!.y.toFixed(0)}
                              </small>
                            </span>
                            <b>{clock(mark.time)}</b>
                          </button>
                        ))}
                      {!routes.length && !utilities.length && (
                        <p>{t("noEvents")}</p>
                      )}
                    </section>
                  </aside>
                  <p className="studio-model-note">
                    <Shield size={13} />
                    {t("approx")}{" "}
                    {game === "cs2" &&
                      `${t("flashRisk")}: ${flashRisk}. ${t("hintDirection")}`}
                  </p>
                </div>
              )}
              {mode === "draft" && <DraftStudio key={game} game={game} t={t} />}
              {mode === "vod" && (
                <VodStudio key={game} game={game} t={t} toast={setMessage} />
              )}
              {mode === "coach" && (
                <div className="coach-page">
                  <CoachPanel doc={doc} t={t} full />
                  <aside className="coach-context studio-card">
                    <span className="studio-kicker">{t("workspace")}</span>
                    <h3>{doc.map}</h3>
                    <p>{doc.name}</p>
                    <div>
                      <Users size={17} />
                      {players.length} {t("players")}
                    </div>
                    <div>
                      <Route size={17} />
                      {routes.length} {t("paths")}
                    </div>
                    <div>
                      <CloudFog size={17} />
                      {utilities.length} {t("utilities")}
                    </div>
                    <button
                      className="studio-button"
                      onClick={() => setMode("canvas")}
                    >
                      {t("back")}
                      <ArrowRight size={14} />
                    </button>
                  </aside>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <footer className="studio-footer">
            <span>
              <b>N</b> NEXUS STUDIO <i /> {t("localOnly")}
            </span>
            <button onClick={onArena}>
              {t("arena")}
              <ArrowUpRight size={12} />
            </button>
            <span>{t("schematic")}</span>
          </footer>
        </main>
      </div>
      <nav className="studio-mobile-nav">
        {modes.map(({ id, icon: Icon }) => (
          <button
            key={id}
            className={mode === id ? "active" : ""}
            onClick={() => {
              setMode(id);
              setPlaying(false);
            }}
          >
            <Icon size={20} />
            <span>{t(id)}</span>
          </button>
        ))}
        <button onClick={onArena}>
          <Trophy size={20} />
          <span>{t("arena")}</span>
        </button>
      </nav>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          e.target.value = "";
          if (file.size > 2_000_000) {
            setMessage(t("invalid"));
            return;
          }
          try {
            const value = JSON.parse(await file.text());
            if (!validBoard(value)) throw Error("Invalid board");
            change(value);
            setTime(value.duration);
            setMode("canvas");
            fit();
            setMessage(t("imported"));
            setExportOpen(false);
          } catch {
            setMessage(t("invalid"));
          }
        }}
      />
      <AnimatePresence>
        {message && (
          <motion.div
            className="studio-toast"
            role="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} />
            {message}
            <button aria-label={t("close")} onClick={() => setMessage("")}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {dialog && (
        <Modal
          title={t(
            dialog === "help"
              ? "help"
              : dialog === "clear"
                ? "clear"
                : "shareFallback",
          )}
          close={closeDialog}
          closeLabel={t("close")}
        >
          {dialog === "help" ? (
            <div className="studio-dialog-content">
              <p>{t("helpText")}</p>
              <p>{t("approx")}</p>
              <p>{t("shareNote")}</p>
            </div>
          ) : dialog === "clear" ? (
            <div className="studio-dialog-content">
              <p>{t("confirmClear")}</p>
              <div className="modal-actions">
                <button className="studio-button" onClick={closeDialog}>
                  {t("cancel")}
                </button>
                <button
                  className="studio-button accent"
                  onClick={() => {
                    change({ ...doc, marks: [] });
                    closeDialog();
                  }}
                >
                  {t("clearConfirm")}
                </button>
              </div>
            </div>
          ) : (
            <div className="studio-dialog-content">
              <textarea
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
              />
              <p>{t("shareNote")}</p>
              <button
                className="studio-button accent"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setMessage(t("copied"));
                    closeDialog();
                  } catch {}
                }}
              >
                <Copy size={15} />
                {t("copy")}
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
