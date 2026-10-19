import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Check,
  ChevronRight,
  Crosshair,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import type { StudioGame } from "./model";
import { draftScore } from "./model";
import type { Translator } from "./text";
export type Hero = { name: string; role: string; tag: string };
export const heroPools: Record<StudioGame, Hero[]> = {
  cs2: [
    ["Tactician", "IGL", "Control"],
    ["Vanguard", "Entry", "Engage"],
    ["Deadeye", "AWPer", "Range"],
    ["Anchor", "Support", "Utility"],
    ["Ghost", "Lurker", "Flank"],
    ["Spark", "Entry", "Utility"],
    ["Falcon", "AWPer", "Range"],
    ["Sentinel", "Support", "Control"],
    ["Vector", "IGL", "Engage"],
    ["Shade", "Lurker", "Flank"],
    ["Blitz", "Entry", "Engage"],
    ["Echo", "Support", "Utility"],
  ].map(([name, role, tag]) => ({ name, role, tag })),
  mlbb: [
    ["Tigreal", "Roam", "Engage"],
    ["Ling", "Jungle", "Burst"],
    ["Lylia", "Mid", "Magic"],
    ["Claude", "Gold", "Physical"],
    ["Yu Zhong", "EXP", "Engage"],
    ["Fanny", "Jungle", "Mobility"],
    ["Valentina", "Mid", "Magic"],
    ["Mathilda", "Roam", "Mobility"],
    ["Brody", "Gold", "Physical"],
    ["Terizla", "EXP", "Control"],
    ["Fredrinn", "Jungle", "Control"],
    ["Kagura", "Mid", "Burst"],
    ["Lolita", "Roam", "Control"],
    ["Melissa", "Gold", "Physical"],
    ["Arlott", "EXP", "Control"],
    ["Akai", "Jungle", "Engage"],
  ].map(([name, role, tag]) => ({ name, role, tag })),
  ow2: [
    ["Ana", "Support", "Nano"],
    ["Genji", "Damage", "Blade"],
    ["Zarya", "Tank", "Graviton"],
    ["Hanzo", "Damage", "Dragonstrike"],
    ["Reinhardt", "Tank", "Engage"],
    ["Lucio", "Support", "Mobility"],
    ["Kiriko", "Support", "Sustain"],
    ["Widowmaker", "Damage", "Range"],
    ["Winston", "Tank", "Dive"],
    ["Tracer", "Damage", "Dive"],
    ["Dva", "Tank", "Dive"],
    ["Baptiste", "Support", "Sustain"],
    ["Mei", "Damage", "Control"],
    ["Soldier 76", "Damage", "Range"],
    ["Mercy", "Support", "Sustain"],
  ].map(([name, role, tag]) => ({ name, role, tag })),
};
export type DraftState = {
  blue: string[];
  red: string[];
  bans: string[];
  charges: Record<string, number>;
  turn: "blue" | "red";
  action: "pick" | "ban";
};
export const blankDraft = (): DraftState => ({
  blue: [],
  red: [],
  bans: [],
  charges: {},
  turn: "blue",
  action: "pick",
});
export function readDraft(game: StudioGame): DraftState {
  try {
    const value = JSON.parse(
      localStorage.getItem(`nexus-draft:${game}`) || "null",
    );
    const pool = heroPools[game].map((h) => h.name);
    if (
      value &&
      Array.isArray(value.blue) &&
      value.blue.length <= 5 &&
      Array.isArray(value.red) &&
      value.red.length <= 5 &&
      Array.isArray(value.bans) &&
      [...value.blue, ...value.red, ...value.bans].every((n) =>
        pool.includes(n),
      ) &&
      ["blue", "red"].includes(value.turn) &&
      ["pick", "ban"].includes(value.action)
    )
      return { ...blankDraft(), ...value, charges: value.charges || {} };
  } catch {}
  return blankDraft();
}
export default function DraftStudio({
  game,
  t,
  onDraft,
}: {
  game: StudioGame;
  t: Translator;
  onDraft?: (draft: DraftState) => void;
}) {
  const [state, setState] = useState(() => readDraft(game)),
    [query, setQuery] = useState("");
  useEffect(() => {
    onDraft?.(state);
    try {
      localStorage.setItem(`nexus-draft:${game}`, JSON.stringify(state));
    } catch {}
  }, [state, game, onDraft]);
  const pool = heroPools[game],
    banned = new Set([...state.bans, ...state.blue, ...state.red]),
    blueHeroes = pool.filter((h) => state.blue.includes(h.name)),
    score = draftScore(
      state.blue,
      blueHeroes.map((h) => h.role),
    );
  const suggestions = useMemo(() => {
    const needed =
      game === "ow2"
        ? ["Tank", "Damage", "Support"]
        : game === "mlbb"
          ? ["Jungle", "Mid", "Roam", "Gold", "EXP"]
          : ["IGL", "Entry", "AWPer", "Support", "Lurker"];
    return pool
      .filter((h) => !banned.has(h.name))
      .sort(
        (a, b) =>
          Number(
            !blueHeroes.some((x) => x.role === b.role) &&
              needed.includes(b.role),
          ) -
          Number(
            !blueHeroes.some((x) => x.role === a.role) &&
              needed.includes(a.role),
          ),
      )
      .slice(0, 3);
  }, [state, game]);
  const choose = (hero: Hero) => {
    if (banned.has(hero.name)) return;
    if (state.action === "ban") {
      setState({
        ...state,
        bans: [...state.bans, hero.name],
        turn: state.turn === "blue" ? "red" : "blue",
      });
      return;
    }
    if (state[state.turn].length >= 5) return;
    const next = { ...state, [state.turn]: [...state[state.turn], hero.name] };
    next.turn = state.turn === "blue" ? "red" : "blue";
    if (next[next.turn].length >= 5) next.turn = state.turn;
    setState(next);
  };
  const combo = ["Ana", "Genji"].every((n) => state.blue.includes(n))
    ? ["Ana", "Genji"]
    : ["Zarya", "Hanzo"].every((n) => state.blue.includes(n))
      ? ["Zarya", "Hanzo"]
      : null;
  const renderTeam = (team: "blue" | "red") => (
    <section className={`draft-team ${team}`}>
      <header>
        <div className="team-symbol">
          <Shield size={22} />
        </div>
        <div>
          <span className="studio-kicker">
            {t(team === "blue" ? "teamBlue" : "teamRed")}
          </span>
          <h3>{t(team === "blue" ? "team" : "enemy")}</h3>
        </div>
        <b>{state[team].length}/5</b>
      </header>
      <div className="draft-slots">
        {Array.from({ length: 5 }, (_, i) => {
          const hero = pool.find((h) => h.name === state[team][i]);
          return (
            <div className={`draft-slot ${hero ? "filled" : ""}`} key={i}>
              <div className="hero-avatar">
                {hero
                  ? hero.name.slice(0, 2).toUpperCase()
                  : String(i + 1).padStart(2, "0")}
              </div>
              <span>
                <strong>{hero?.name || "—"}</strong>
                <small>{hero?.role || t("unknown")}</small>
              </span>
              {hero ? (
                <button
                  aria-label={`${t("remove")} ${hero.name}`}
                  onClick={() =>
                    setState({
                      ...state,
                      [team]: state[team].filter((n) => n !== hero.name),
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              ) : (
                <PlusMark />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
  return (
    <div className="draft-studio">
      <div className="studio-section-intro">
        <span className="studio-kicker">{t("draft")}</span>
        <h2>
          {t("synergy")}
          <span className="studio-model">{t("model")}</span>
        </h2>
        <p>
          {t(
            game === "cs2"
              ? "draftCs"
              : game === "mlbb"
                ? "draftMl"
                : "draftOw",
          )}
        </p>
      </div>
      <div className="draft-layout">
        <div className="draft-board">
          <div className="draft-toolbar">
            <div className="draft-turn">
              <span className="pulse-dot" />
              {state.blue.length === 5 && state.red.length === 5
                ? t("draftDone")
                : `${t("turn")}: ${t(state.turn === "blue" ? "teamBlue" : "teamRed")}`}
            </div>
            <div className="studio-segment">
              {(["pick", "ban"] as const).map((action) => (
                <button
                  className={state.action === action ? "active" : ""}
                  onClick={() => setState({ ...state, action })}
                  key={action}
                >
                  {action === "pick" ? <Check size={13} /> : <Ban size={13} />}{" "}
                  {t(action)}
                </button>
              ))}
            </div>
            <button
              className="studio-icon"
              aria-label={t("resetDraft")}
              onClick={() => setState({ ...blankDraft(), bans: state.bans })}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="draft-teams">
            {renderTeam("blue")}
            <div className="draft-vs">VS</div>
            {renderTeam("red")}
          </div>
          <div className="draft-pool">
            <div className="draft-pool-head">
              <h3>
                <Users size={17} />
                {t("pool")}
              </h3>
              <label className="studio-search">
                <Search size={14} />
                <input
                  aria-label={t("search")}
                  placeholder={t("search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <p className="studio-fine">{t("manual")}</p>
            <div className="hero-pool">
              {pool
                .filter((h) =>
                  (h.name + " " + h.role)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((hero, i) => (
                  <button
                    key={hero.name}
                    disabled={
                      banned.has(hero.name) ||
                      (state.action === "pick" && state[state.turn].length >= 5)
                    }
                    className={`hero-tile hero-tone-${i % 5}`}
                    onClick={() => choose(hero)}
                  >
                    <div className="hero-tile-symbol">
                      {hero.role === "Support" || hero.role === "Roam" ? (
                        <ShieldCheck size={25} />
                      ) : hero.role === "Tank" || hero.role === "EXP" ? (
                        <Shield size={25} />
                      ) : hero.role === "AWPer" || hero.role === "Gold" ? (
                        <Crosshair size={25} />
                      ) : hero.role === "Jungle" || hero.role === "Lurker" ? (
                        <Zap size={25} />
                      ) : (
                        <Swords size={25} />
                      )}
                    </div>
                    <strong>{hero.name}</strong>
                    <small>{hero.role}</small>
                    {state.bans.includes(hero.name) && (
                      <Ban className="banned-symbol" size={20} />
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
        <aside className="draft-analysis">
          <section className="studio-card composition-card">
            <div className="studio-card-heading">
              <h3>
                <Sparkles size={16} />
                {t("synergy")}
              </h3>
              <span className="studio-model">{t("local")}</span>
            </div>
            <div className="composition-meter">
              <svg viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#24313d"
                  strokeWidth="5"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--studio-accent)"
                  strokeWidth="5"
                  strokeDasharray={`${score * 3.14} 314`}
                  transform="rotate(-90 60 60)"
                  strokeLinecap="round"
                />
              </svg>
              <strong>
                {score}
                <small>/100</small>
              </strong>
            </div>
            <p>{t("heuristic")}</p>
            <div className="coverage-list">
              {(game === "ow2"
                ? ["Tank", "Damage", "Support"]
                : game === "mlbb"
                  ? ["Jungle", "Mid", "Roam", "Gold", "EXP"]
                  : ["IGL", "Entry", "AWPer", "Support", "Lurker"]
              ).map((role) => (
                <div key={role}>
                  <span>{role}</span>
                  <span
                    className={
                      blueHeroes.some((h) => h.role === role) ? "ok" : "missing"
                    }
                  >
                    {blueHeroes.some((h) => h.role === role) ? (
                      <Check size={13} />
                    ) : (
                      <span>—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="studio-card">
            <div className="studio-card-heading">
              <h3>
                <Crosshair size={16} />
                {t("recommend")}
              </h3>
            </div>
            {suggestions.map((hero) => (
              <button
                className="suggestion-pick"
                key={hero.name}
                onClick={() => {
                  setState((current) => ({
                    ...current,
                    turn: "blue",
                    action: "pick",
                  }));
                  if (state.blue.length < 5)
                    setState((current) => ({
                      ...current,
                      blue: [...current.blue, hero.name],
                      turn: "red",
                      action: "pick",
                    }));
                }}
                disabled={state.blue.length >= 5}
              >
                <div className="small-hero">{hero.name.slice(0, 2)}</div>
                <span>
                  <strong>{hero.name}</strong>
                  <small>
                    {hero.role} · {hero.tag}
                  </small>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
            <p className="studio-fine">
              {t("counter")}:{" "}
              {t(
                game === "cs2" ? "csTip" : game === "mlbb" ? "mlTip" : "owTip",
              )}
            </p>
          </section>
          <section className="studio-card">
            <div className="studio-card-heading">
              <h3>
                <Ban size={16} />
                {t("globalBans")}
              </h3>
              <button
                className="studio-icon"
                onClick={() => setState({ ...state, bans: [] })}
                aria-label={t("clearBans")}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="ban-chips">
              {state.bans.length ? (
                state.bans.map((name) => (
                  <button
                    key={name}
                    onClick={() =>
                      setState({
                        ...state,
                        bans: state.bans.filter((n) => n !== name),
                      })
                    }
                  >
                    <Ban size={11} />
                    {name}
                    <span>×</span>
                  </button>
                ))
              ) : (
                <span>—</span>
              )}
            </div>
            <p className="studio-fine">{t("globalHint")}</p>
          </section>
        </aside>
      </div>
      {game === "ow2" && (
        <section className="studio-card ult-panel">
          <div className="studio-card-heading">
            <h3>
              <Zap size={18} />
              {t("ultimate")}
            </h3>
            <span>{t("heuristic")}</span>
          </div>
          <div className="ult-grid">
            {blueHeroes.map((hero) => (
              <label key={hero.name}>
                <strong>
                  {hero.name}
                  <span>{state.charges[hero.name] || 0}%</span>
                </strong>
                <small>{hero.tag}</small>
                <input
                  aria-label={`${hero.name} ${t("charge")}`}
                  type="range"
                  min="0"
                  max="100"
                  value={state.charges[hero.name] || 0}
                  onChange={(e) =>
                    setState({
                      ...state,
                      charges: {
                        ...state.charges,
                        [hero.name]: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <div className="combo-summary">
            <span>
              {t("combo")}:{" "}
              <strong>
                {combo ? combo.join(" + ") : "Ana + Genji / Zarya + Hanzo"}
              </strong>
            </span>
            <b>
              {t("comboReady")}:{" "}
              {combo ? Math.min(...combo.map((n) => state.charges[n] || 0)) : 0}
              %
            </b>
          </div>
          <p className="studio-fine">{t("probability")}</p>
          <div className="synergy-matrix">
            {blueHeroes.map((a) => (
              <div key={a.name}>
                <strong>{a.name}</strong>
                {blueHeroes.map((b) => (
                  <span
                    key={b.name}
                    className={
                      a.name !== b.name &&
                      (a.role === "Support" || b.role === "Support")
                        ? "pair-good"
                        : ""
                    }
                    title={`${a.name} + ${b.name}`}
                  >
                    {a.name === b.name
                      ? "—"
                      : a.role === "Support" || b.role === "Support"
                        ? "●"
                        : "○"}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
function PlusMark() {
  return <span className="empty-slot-plus">+</span>;
}
