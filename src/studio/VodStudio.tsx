import { youtubeId } from "./media";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  Clock,
  FileVideo,
  Link,
  MessageSquare,
  Mic,
  MousePointer2,
  Pencil,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import TacticalBoard from "./TacticalBoard";
import { clock, newBoard, uid, validBoard } from "./model";
import type { BoardDoc, StudioGame, Tool } from "./model";
import type { Translator } from "./text";
type BookmarkItem = { id: string; time: number; text: string; voice: boolean };
export default function VodStudio({
  game,
  t,
  toast,
}: {
  game: StudioGame;
  t: Translator;
  toast: (message: string) => void;
}) {
  const [video, setVideo] = useState(""),
    [youtube, setYoutube] = useState(""),
    [url, setUrl] = useState(""),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(600),
    [overlay, setOverlay] = useState(false),
    [tool, setTool] = useState<Tool>("pen"),
    [note, setNote] = useState(""),
    [voice, setVoice] = useState(false);
  const [annotations, setAnnotations] = useState<BoardDoc>(() => {
    try {
      const d = JSON.parse(
        localStorage.getItem(`nexus-vod-board:${game}`) || "null",
      );
      if (validBoard(d)) return d;
    } catch {}
    return { ...newBoard(game), marks: [] };
  });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const b = JSON.parse(
        localStorage.getItem(`nexus-vod-moments:${game}`) || "[]",
      );
      if (Array.isArray(b))
        return b.filter(
          (x) =>
            typeof x.id === "string" &&
            typeof x.text === "string" &&
            Number.isFinite(x.time) &&
            x.time >= 0,
        );
    } catch {}
    return [];
  });
  const videoRef = useRef<HTMLVideoElement>(null),
    fileRef = useRef<HTMLInputElement>(null),
    svg = useRef<SVGSVGElement>(null);
  useEffect(
    () => () => {
      if (video) URL.revokeObjectURL(video);
    },
    [video],
  );
  useEffect(() => {
    try {
      localStorage.setItem(
        `nexus-vod-board:${game}`,
        JSON.stringify(annotations),
      );
      localStorage.setItem(
        `nexus-vod-moments:${game}`,
        JSON.stringify(bookmarks),
      );
    } catch {}
  }, [annotations, bookmarks, game]);
  useEffect(() => {
    setAnnotations((current) => ({
      ...current,
      duration: Math.max(1, Math.min(172800, duration)),
    }));
  }, [duration]);
  const seek = (value: number) => {
    setTime(value);
    if (videoRef.current) videoRef.current.currentTime = value;
  };
  const bookmark = () => {
    if (bookmarks.length >= 100) return;
    setBookmarks([
      ...bookmarks,
      { id: uid(), time, text: note.trim() || t("recorded"), voice },
    ]);
    setNote("");
  };
  return (
    <div className="vod-studio">
      <div className="studio-section-intro">
        <span className="studio-kicker">{t("videoTitle")}</span>
        <h2>{t("vodTitle")}</h2>
        <p>{t("vodText")}</p>
      </div>
      <div className="vod-layout">
        <section className="vod-main studio-card">
          <div className="vod-source-bar">
            <button
              className="studio-button"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={15} />
              {t("upload")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("video/")) {
                  toast(t("invalidVideo"));
                  return;
                }
                setVideo(URL.createObjectURL(file));
                setYoutube("");
                setTime(0);
                setOverlay(false);
                e.target.value = "";
              }}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const id = youtubeId(url);
                if (!id) {
                  toast(t("invalidVideo"));
                  return;
                }
                setYoutube(id);
                setVideo("");
                setOverlay(false);
                setTime(0);
              }}
            >
              <Link size={14} />
              <input
                aria-label={t("youtube")}
                placeholder={t("youtube")}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button type="submit" aria-label={t("loadVideo")}>
                <Check size={17} />
              </button>
            </form>
          </div>
          <div className="video-stage">
            {video ? (
              <video
                ref={videoRef}
                src={video}
                controls
                playsInline
                onError={() => toast(t("videoError"))}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (Number.isFinite(d)) setDuration(d);
                }}
              />
            ) : youtube ? (
              <iframe
                title="YouTube"
                src={`https://www.youtube-nocookie.com/embed/${youtube}`}
                allow="fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div className="video-empty">
                <div>
                  <FileVideo size={45} />
                </div>
                <h3>{t("noVideo")}</h3>
                <p>{t("videoLocal")}</p>
                <button
                  className="studio-button accent"
                  onClick={() => fileRef.current?.click()}
                >
                  <Video size={16} />
                  {t("upload")}
                </button>
              </div>
            )}
            {(video || youtube) && overlay && (
              <div className="video-overlay">
                <TacticalBoard
                  ref={svg}
                  doc={annotations}
                  onChange={setAnnotations}
                  tool={tool}
                  color="#00f0ff"
                  label={note || t("note")}
                  role=""
                  time={time}
                  playing={false}
                  zoom={1}
                  setZoom={() => {}}
                  t={t}
                  overlay
                />
              </div>
            )}
          </div>
          <div className="vod-controls">
            <button
              className={`studio-button ${overlay ? "accent" : ""}`}
              disabled={!video && !youtube}
              onClick={() => setOverlay(!overlay)}
            >
              <Pencil size={14} />
              {t("annotation")}
            </button>
            <div className="studio-segment">
              {(["select", "pen", "arrow", "note", "erase"] as Tool[]).map(
                (value) => (
                  <button
                    aria-label={t(value)}
                    key={value}
                    className={tool === value ? "active" : ""}
                    onClick={() => setTool(value)}
                  >
                    {value === "select" ? (
                      <MousePointer2 size={13} />
                    ) : (
                      t(value)
                    )}
                  </button>
                ),
              )}
            </div>
            <span>
              <Clock size={13} /> {clock(time)}
            </span>
          </div>
          <div className="vod-timeline">
            <input
              type="range"
              aria-label={t("timestamp")}
              min="0"
              max={duration}
              step=".1"
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
            />
            <div>
              <label>
                {t("timestamp")}
                <input
                  type="number"
                  min="0"
                  max={duration}
                  value={Math.round(time)}
                  onChange={(e) =>
                    seek(
                      Math.max(0, Math.min(duration, Number(e.target.value))),
                    )
                  }
                />
              </label>
              <label>
                {t("duration")}
                <input
                  type="number"
                  min="1"
                  max="14400"
                  disabled={!!video}
                  value={Math.round(duration)}
                  onChange={(e) =>
                    setDuration(
                      Math.max(1, Math.min(14400, Number(e.target.value))),
                    )
                  }
                />
              </label>
            </div>
          </div>
          <p className="studio-fine">
            {t(youtube ? "youtubeHint" : "clipHint")}
          </p>
          <p className="studio-fine">{t("videoLocal")}</p>
        </section>
        <aside className="vod-notes studio-card">
          <div className="studio-card-heading">
            <h3>
              <Bookmark size={16} />
              {t("bookmarks")}
            </h3>
            <span>{bookmarks.length}</span>
          </div>
          <textarea
            aria-label={t("bookmarkNote")}
            placeholder={t("bookmarkNote")}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
          />
          <label className="voice-placeholder">
            <input
              type="checkbox"
              checked={voice}
              onChange={(e) => setVoice(e.target.checked)}
            />
            <Mic size={14} />
            {t("voice")}
          </label>
          {voice && <p className="studio-fine">{t("voiceHint")}</p>}
          <button className="studio-button accent full" onClick={bookmark}>
            <Bookmark size={14} />
            {t("bookmark")} · {clock(time)}
          </button>
          <div className="bookmark-list">
            {bookmarks.length ? (
              bookmarks
                .slice()
                .sort((a, b) => a.time - b.time)
                .map((item) => (
                  <article key={item.id}>
                    <button
                      className="bookmark-time"
                      onClick={() => seek(Math.min(duration, item.time))}
                    >
                      {clock(item.time)}
                    </button>
                    <p>{item.text}</p>
                    <div>
                      <span>
                        {item.voice ? (
                          <Mic size={13} />
                        ) : (
                          <MessageSquare size={13} />
                        )}
                      </span>
                      <button
                        className="studio-icon"
                        aria-label={t("remove")}
                        onClick={() =>
                          setBookmarks(
                            bookmarks.filter((b) => b.id !== item.id),
                          )
                        }
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </article>
                ))
            ) : (
              <p className="studio-fine">{t("noBookmarks")}</p>
            )}
          </div>
          <button
            className="studio-button"
            onClick={() => {
              try {
                localStorage.setItem(
                  `nexus-vod-board:${game}`,
                  JSON.stringify(annotations),
                );
              } catch {
                toast(t("saveError"));
                return;
              }
              toast(t("saved"));
            }}
          >
            <Check size={14} />
            {t("saved")}
          </button>
        </aside>
      </div>
    </div>
  );
}
