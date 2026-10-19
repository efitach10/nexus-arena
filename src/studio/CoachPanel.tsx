import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BrainCircuit,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { BoardDoc } from "./model";
import type { Translator } from "./text";
import { readDraft, heroPools } from "./DraftStudio";
type Message = { id: string; user?: boolean; text: string };
export function coachAdvice(doc: BoardDoc, question: string, t: Translator) {
  const players = doc.marks.filter((m) => m.tool === "player").length,
    utilities = doc.marks.filter((m) =>
      ["smoke", "flash", "molotov", "grenade"].includes(m.tool),
    ).length,
    routes = doc.marks.filter(
      (m) => m.tool === "arrow" || m.tool === "curve",
    ).length;
  const draft = readDraft(doc.game),
    roles = new Set(
      heroPools[doc.game]
        .filter((h) => draft.blue.includes(h.name))
        .map((h) => h.role),
    );
  const composition = /composition|draft|role|הרכב|דראפט|תפקיד/i.test(question),
    objective = /objective|rotation|מטרה|רוטציה/i.test(question);
  const tip = t(
    doc.game === "cs2" ? "csTip" : doc.game === "mlbb" ? "mlTip" : "owTip",
  );
  const lines = [
    `${doc.map} · ${players}/5 ${t("players")} · ${routes} ${t("paths")} · ${utilities} ${t("utilities")}`,
  ];
  if (composition)
    lines.push(
      t(
        draft.blue.length === 5 && roles.size >= (doc.game === "ow2" ? 3 : 5)
          ? "fullRoles"
          : "needRoles",
      ),
    );
  else if (objective) lines.push(tip, t("rotation"));
  else {
    lines.push(tip);
    if (players < 5) lines.push(t("needPlayers"));
    if (doc.game === "cs2")
      lines.push(t(utilities ? "hasUtility" : "needUtility"));
    else lines.push(t("support"));
    if (routes < 2) lines.push(t("rotation"));
  }
  lines.push(t("reviewSummary"));
  return lines.join("\n\n");
}
export default function CoachPanel({
  doc,
  t,
  full = false,
}: {
  doc: BoardDoc;
  t: Translator;
  full?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    end = useRef<HTMLDivElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setMessages([]);
    setBusy(false);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [doc.game]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);
  const ask = (question: string) => {
    if (!question.trim() || busy) return;
    setInput("");
    setMessages((items) => [
      ...items.slice(-18),
      { id: crypto.randomUUID(), user: true, text: question.trim() },
    ]);
    setBusy(true);
    timer.current = setTimeout(() => {
      setMessages((items) => [
        ...items,
        { id: crypto.randomUUID(), text: coachAdvice(doc, question, t) },
      ]);
      setBusy(false);
    }, 500);
  };
  return (
    <section className={`coach-panel ${full ? "full-coach" : ""}`}>
      <header>
        <div className="coach-symbol">
          <BrainCircuit size={22} />
        </div>
        <div>
          <h3>{t("coach")}</h3>
          <span>
            <i className="pulse-dot" />
            {t("local")}
          </span>
        </div>
        <span className="studio-model">BETA</span>
      </header>
      {full && (
        <div className="coach-welcome">
          <span className="studio-kicker">NEXUS INTELLIGENCE</span>
          <h2>{t("coachTitle")}</h2>
          <p>{t("coachText")}</p>
        </div>
      )}
      <p className="coach-disclosure">
        <ShieldCheck size={12} />
        {t("coachHonest")}
      </p>
      <div
        className="coach-messages"
        aria-label={t("messages")}
        aria-live="polite"
      >
        <article className="coach-message">
          <span className="message-icon">
            <Sparkles size={14} />
          </span>
          <div>
            <strong>NEXUS COACH</strong>
            <p>{t("coachStart")}</p>
            <div className="coach-map-pill">
              <span className="pulse-dot" />
              {doc.map}
              <Check size={11} />
            </div>
          </div>
        </article>
        {messages.map((message) => (
          <article
            key={message.id}
            className={`coach-message ${message.user ? "from-user" : ""}`}
          >
            <span className="message-icon">
              {message.user ? "N" : <BrainCircuit size={14} />}
            </span>
            <div>
              <strong>{message.user ? "NEXUSPLAYER" : "NEXUS COACH"}</strong>
              <p>{message.text}</p>
            </div>
          </article>
        ))}
        {busy && <p className="coach-thinking">···</p>}
        <div ref={end} />
      </div>
      {!messages.length && (
        <div className="coach-prompts">
          {(["question1", "question2", "question3"] as const).map((key) => (
            <button key={key} onClick={() => ask(t(key))}>
              {t(key)}
              <ChevronRight size={13} />
            </button>
          ))}
        </div>
      )}
      <form
        className="coach-input"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          maxLength={1000}
          onChange={(e) => setInput(e.target.value)}
          aria-label={t("ask")}
          placeholder={t("ask")}
        />
        <button disabled={busy || !input.trim()} aria-label={t("send")}>
          <ArrowUp size={17} />
        </button>
      </form>
    </section>
  );
}
