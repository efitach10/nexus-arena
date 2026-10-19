import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Copy,
  Crosshair,
  Crown,
  Diamond,
  Download,
  Globe,
  Headphones,
  LayoutDashboard,
  LogIn,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { dictionaries } from "./lib/i18n";
import type { Language, TextKey } from "./lib/i18n";
import {
  persistProgress,
  playerNames,
  readProgress,
  rewards,
  tournaments,
} from "./lib/data";
import type { Game, Tournament } from "./lib/data";
import Modal from "./components/Modal";
import Art from "./components/Art";
import TournamentCard from "./components/TournamentCard";
type Page = "dashboard" | "tournaments" | "lobby" | "shop" | "leaderboard";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const navItems = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "tournaments", icon: Trophy },
  { id: "lobby", icon: Swords },
  { id: "leaderboard", icon: Activity },
  { id: "shop", icon: ShoppingBag },
] as const;
export default function App() {
  const [installBanner, setInstallBanner] = useState(true);
  const [lang, setLang] = useState<Language>(() => {
    try {
      return localStorage.getItem("nexus-language") === "en" ? "en" : "he";
    } catch {
      return "he";
    }
  });
  const [game, setGame] = useState<Game>("cs2"),
    [page, setPage] = useState<Page>("dashboard"),
    [progress, setProgress] = useState(readProgress),
    [filter, setFilter] = useState("all"),
    [skill, setSkill] = useState("any"),
    [hero, setHero] = useState(0),
    [toast, setToast] = useState(""),
    [celebrate, setCelebrate] = useState(false),
    [modal, setModal] = useState<
      "login" | "profile" | "queue" | "reward" | null
    >(null),
    [detail, setDetail] = useState<Tournament | null>(null),
    [detailTab, setDetailTab] = useState("overview"),
    [queue, setQueue] = useState<"idle" | "searching" | "ready">("idle"),
    [queueTarget, setQueueTarget] = useState<string | null>(null),
    [hasRoom, setHasRoom] = useState(false),
    [role, setRole] = useState("balanced"),
    [rank, setRank] = useState("advanced"),
    [bans, setBans] = useState<string[]>([]),
    [opponent, setOpponent] = useState(false),
    [won, setWon] = useState(false),
    [reward, setReward] = useState<string | null>(null),
    [notify, setNotify] = useState(false),
    [install, setInstall] = useState<InstallEvent | null>(null),
    [offline, setOffline] = useState(!navigator.onLine),
    [sidebar, setSidebar] = useState(false),
    [ranking, setRanking] = useState("elo"),
    [region, setRegion] = useState("national"),
    [loginMethod, setLoginMethod] = useState(""),
    [phone, setPhone] = useState(""),
    [now, setNow] = useState(Date.now());
  const t = useCallback((key: TextKey) => dictionaries[lang][key], [lang]);
  const closeModal = useCallback(() => {
    setModal(null);
    setLoginMethod("");
  }, []);
  const closeDetail = useCallback(() => setDetail(null), []);
  const gameTournaments = tournaments.filter((x) => x.game === game),
    major = gameTournaments[hero % gameTournaments.length],
    karma = 96;
  const [deadline] = useState(
    () => Date.now() + 1000 * 60 * 60 * 19 + 1000 * 60 * 42,
  );
  const timeLeft = Math.max(0, deadline - now),
    countdown = [
      Math.floor(timeLeft / 3600000),
      Math.floor(timeLeft / 60000) % 60,
      Math.floor(timeLeft / 1000) % 60,
    ]
      .map((x) => String(x).padStart(2, "0"))
      .join(" : ");
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    try {
      localStorage.setItem("nexus-language", lang);
    } catch {}
  }, [lang]);
  useEffect(() => persistProgress(progress), [progress]);
  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 3200);
    return () => clearTimeout(timer);
  }, [celebrate]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    if (queue !== "searching") return;
    const timer = setTimeout(() => setQueue("ready"), 3800);
    return () => clearTimeout(timer);
  }, [queue]);
  const maps = useMemo(
    () =>
      game === "cs2"
        ? ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust II", "Train"]
        : [
            "Imperial Sanctuary",
            "Western Expanse",
            "Celestial Palace",
            "Sanctum Island",
            "Land of Dawn",
          ],
    [game],
  );
  useEffect(() => {
    if (!opponent) return;
    const timer = setTimeout(() => {
      setBans((current) => {
        const next = maps.find((x) => !current.includes(x));
        return next && current.length < maps.length - 1
          ? [...current, next]
          : current;
      });
      setOpponent(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, [opponent, maps]);
  const filtered = gameTournaments.filter(
    (x) =>
      (filter === "all" ||
        (filter === "free" && x.fee === 0) ||
        (filter === "cash" && x.prize >= 2000) ||
        filter === x.type) &&
      (skill === "any" || skill === x.skill),
  );
  const cost = (tourney: Tournament) =>
    karma >= 90 ? Math.floor(tourney.fee * 0.9) : tourney.fee;
  const openTournament = (x: Tournament) => {
    setDetail(x);
    setDetailTab("overview");
  };
  const changePage = (next: Page) => {
    setPage(next);
    setSidebar(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeGame = (next: Game) => {
    setGame(next);
    setHero(0);
    setFilter("all");
    setSkill("any");
    setHasRoom(false);
    setBans([]);
    setOpponent(false);
    setWon(false);
    setQueue("idle");
    setModal(null);
  };
  const startQueue = (id: string | null = null) => {
    const target = tournaments.find((x) => x.id === id);
    if (target && progress.coins < cost(target)) {
      setToast(t("notEnough"));
      return;
    }
    setQueueTarget(id);
    setQueue("searching");
    setModal("queue");
    setDetail(null);
  };
  const join = (x: Tournament) => {
    if (progress.registrations.some((r) => r.id === x.id)) {
      setToast(t("duplicate"));
      return;
    }
    if (karma < 60) {
      setToast(t("karmaBlocked"));
      return;
    }
    if (progress.coins < cost(x)) {
      setToast(t("notEnough"));
      return;
    }
    setProgress((p) => ({
      ...p,
      coins: p.coins - cost(x),
      registrations: [...p.registrations, { id: x.id, cost: cost(x) }],
    }));
    setToast(t("joinedToast"));
  };
  const enterRoom = () => {
    if (queueTarget) {
      const target = tournaments.find((x) => x.id === queueTarget);
      if (target) join(target);
    }
    setHasRoom(true);
    setBans([]);
    setWon(false);
    setOpponent(false);
    setQueue("idle");
    setModal(null);
    changePage("lobby");
  };
  const cancelRegistration = (x: Tournament) => {
    const r = progress.registrations.find((r) => r.id === x.id);
    if (!r) return;
    setProgress((p) => ({
      ...p,
      coins: p.coins + r.cost,
      registrations: p.registrations.filter((r) => r.id !== x.id),
    }));
    setToast(t("cancelled"));
  };
  const complete = maps.length - 1 === bans.length;
  const installApp = async () => {
    if (install) {
      await install.prompt();
      await install.userChoice;
      setInstall(null);
    } else
      setToast(
        t(
          /iPhone|iPad/.test(navigator.userAgent)
            ? "installIos"
            : "installHelp",
        ),
      );
  };
  const handleRedeem = () => {
    const item = rewards.find((x) => x.id === reward);
    if (!item) return;
    if (progress.rewards.includes(item.id)) return;
    if (progress.coins < item.cost) {
      setToast(t("notEnough"));
      return;
    }
    setProgress((p) => ({
      ...p,
      coins: p.coins - item.cost,
      rewards: [...p.rewards, item.id],
    }));
    setToast(t("redeemed"));
    setCelebrate(true);
    setModal(null);
  };
  const arrow =
    lang === "he" ? <ArrowLeft size={17} /> : <ArrowRight size={17} />;
  const roster = () =>
    ["you", ...playerNames.slice(0, 4)].map((name, i) => (
      <div className="player-card" key={name}>
        <div className={`avatar tone-${i}`}>
          {name === "you" ? "N" : name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <strong>{name === "you" ? "NexusPlayer" : name}</strong>
          <small>
            {i === 0
              ? t(role as TextKey)
              : [
                  t(game === "cs2" ? "csRole1" : "mlRole1"),
                  t(game === "cs2" ? "csRole2" : "mlRole2"),
                  t(game === "cs2" ? "csRole3" : "mlRole3"),
                  t("balanced"),
                ][i - 1]}
          </small>
        </div>
        <span className="player-elo">
          {game === "cs2"
            ? (rank === "advanced" ? 1840 : 1140) + i * 17
            : (rank === "advanced" ? "Mythic " : "Epic ") + (32 + i)}
        </span>
        {i === 0 && <Crown size={16} className="orange-text" />}
      </div>
    ));
  return (
    <div className={`app ${game} ${sidebar ? "nav-collapsed" : ""}`}>
      <aside className={`sidebar ${sidebar ? "expanded" : ""}`}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            changePage("dashboard");
          }}
        >
          <div className="brand-mark">N</div>
          <span>
            NEXUS<span className="brand-sub">COMPETITIVE ARENA</span>
          </span>
        </a>
        <div className="sidebar-label">{t("play")}</div>
        <nav>
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => changePage(id)}
            >
              <Icon size={20} />
              <span>{t(id)}</span>
              {id === "lobby" && hasRoom && <i className="dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="karma-mini">
            <ShieldCheck size={24} />
            <span>
              <strong>{t("best")}</strong>
              <small>{t("karmaText")}</small>
            </span>
          </div>
          <button className="nav-item" onClick={installApp}>
            <Download size={20} />
            {t("install")}
            <Plus size={15} />
          </button>
          <div className="side-footer">
            <i className="dot" />
            {t("offlineReady")}
            <small>© 2026 NEXUS ARENA</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label={t("toggleNav")}
            onClick={() => setSidebar(!sidebar)}
          >
            <Menu />
          </button>
          <div
            className="game-switch"
            role="group"
            aria-label={t("chooseGame")}
          >
            <button
              className={game === "cs2" ? "selected" : ""}
              onClick={() => changeGame("cs2")}
            >
              <Crosshair size={18} />
              <span>Counter-Strike 2</span>
              <small>PC</small>
            </button>
            <button
              className={game === "mlbb" ? "selected" : ""}
              onClick={() => changeGame("mlbb")}
            >
              <Smartphone size={17} />
              <span>Mobile Legends</span>
              <small>MOBILE</small>
            </button>
          </div>
          <div className="header-actions">
            <button
              className="lang-button"
              onClick={() => setLang(lang === "he" ? "en" : "he")}
              aria-label={t("language")}
            >
              <Globe size={16} />
              {lang === "he" ? "EN" : "עב"}
              <ChevronDown size={12} />
            </button>
            <div className="notification-wrap">
              <button
                className="icon-button"
                aria-label={t("notifications")}
                onClick={() => setNotify(!notify)}
              >
                <Bell size={19} />
                <i />
              </button>
              {notify && (
                <div className="notification-pop">
                  <strong>{t("notifications")}</strong>
                  <p>{t("notifyText")}</p>
                </div>
              )}
            </div>
            <div className="header-divider" />
            <button className="wallet" onClick={() => changePage("shop")}>
              <Coins size={17} />
              <strong>{progress.coins.toLocaleString()}</strong>
            </button>
            <button
              className="profile-button"
              aria-label={t("profile")}
              onClick={() => setModal(progress.signedIn ? "profile" : "login")}
            >
              <div className="avatar">N</div>
              <span>
                NexusPlayer
                <small>
                  LVL 08 <b>•</b> {game === "cs2" ? "1,840 ELO" : "MYTHIC 32"}
                </small>
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        {offline && <div className="offline-banner">{t("offline")}</div>}
        <main>
          <div className="page-intro">
            <div>
              <div className="eyebrow">
                <span className="tiny-line" />
                {t("community")}
              </div>
              <h1>{t(page === "dashboard" ? "welcome" : page)}</h1>
              <p>{t("subtitle")}</p>
            </div>
            <div className="online-count">
              <span className="dot" />
              <strong>{game === "cs2" ? "2,481" : "1,328"}</strong>
              {t("online")}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={page + game}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {page === "dashboard" && (
                <>
                  <section className="hero">
                    <Art variant={game === "cs2" ? "orange" : "violet"} large />
                    <div className="hero-content">
                      <div className="hero-kicker">
                        <span />
                        {t("tagline")}
                      </div>
                      <h2>
                        {t("heroA")}
                        <br />
                        <em>{t("heroB")}</em>
                      </h2>
                      <p>{t("heroText")}</p>
                      <div className="hero-actions">
                        <button
                          className="primary"
                          onClick={() => changePage("tournaments")}
                        >
                          {t("explore")}
                          {arrow}
                        </button>
                        <button className="ghost" onClick={() => startQueue()}>
                          <Users size={17} />
                          {t("solo")}
                        </button>
                      </div>
                      <div className="hero-social">
                        <div className="avatar-stack">
                          {["K", "S", "N", "V"].map((x, i) => (
                            <span className={`tone-${i}`} key={x}>
                              {x}
                            </span>
                          ))}
                        </div>
                        <span>
                          <b>12K+</b> {t("player")}{" "}
                          <span className="stars">★★★★★</span>
                        </span>
                      </div>
                    </div>
                    <div className="hero-feature">
                      <div className="feature-top">
                        <span>{t("upcoming")}</span>
                        <span className="badge">{t(major.status)}</span>
                      </div>
                      <h3>{major.name}</h3>
                      <div className="feature-stats">
                        <span>
                          <small>{t("prize")}</small>
                          <b>₪{major.prize.toLocaleString()}</b>
                        </span>
                        <span>
                          <small>{t("starts")}</small>
                          <b className="countdown" dir="ltr">
                            {countdown}
                          </b>
                        </span>
                      </div>
                      <div className="feature-bottom">
                        <button
                          className="text-button"
                          onClick={() => openTournament(major)}
                        >
                          {t("join")}
                          {arrow}
                        </button>
                        <div className="carousel-controls">
                          <button
                            aria-label={t("previous")}
                            onClick={() =>
                              setHero(
                                (hero + gameTournaments.length - 1) %
                                  gameTournaments.length,
                              )
                            }
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span>
                            {String(
                              (hero % gameTournaments.length) + 1,
                            ).padStart(2, "0")}{" "}
                            / 0{gameTournaments.length}
                          </span>
                          <button
                            aria-label={t("next")}
                            onClick={() =>
                              setHero((hero + 1) % gameTournaments.length)
                            }
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                  <div className="quick-grid">
                    <section className="queue-panel">
                      <div className="queue-symbol">
                        <Crosshair size={33} />
                      </div>
                      <div>
                        <div className="eyebrow cyan-text">
                          {t("soloToSquad")}
                        </div>
                        <h3>{t("queueTitle")}</h3>
                        <p>{t("queueText")}</p>
                      </div>
                      <button
                        className="primary cyan"
                        onClick={() => startQueue()}
                      >
                        <Zap size={16} />
                        {t("solo")}
                      </button>
                    </section>
                    <section className="karma-panel">
                      <div className="karma-icon">
                        <ShieldCheck size={28} />
                      </div>
                      <div>
                        <small>{t("karma")}</small>
                        <strong>
                          96<span>/100</span>
                        </strong>
                        <p>{t("karmaText")}</p>
                      </div>
                      <div className="karma-ring">
                        96<small>%</small>
                      </div>
                    </section>
                  </div>
                </>
              )}
              {(page === "dashboard" || page === "tournaments") && (
                <section className="tournaments-section">
                  <div className="section-heading">
                    <h2>
                      <Trophy size={21} />
                      {t(page === "dashboard" ? "featured" : "tournaments")}
                      <span className="counter">{gameTournaments.length}</span>
                    </h2>
                    {page === "dashboard" && (
                      <button
                        className="text-button muted"
                        onClick={() => changePage("tournaments")}
                      >
                        {t("viewAll")}
                        {arrow}
                      </button>
                    )}
                  </div>
                  <div className="filters">
                    <div className="filter-tabs">
                      {["all", "free", "cash", "daily", "weekly"].map((x) => (
                        <button
                          key={x}
                          className={filter === x ? "selected" : ""}
                          onClick={() => setFilter(x)}
                        >
                          {x === "free" && <Zap size={13} />}
                          {t(x as TextKey)}
                        </button>
                      ))}
                    </div>
                    <select
                      aria-label={t("level")}
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                    >
                      {["any", "beginner", "advanced"].map((x) => (
                        <option key={x} value={x}>
                          {t(x as TextKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="tournament-grid">
                    {filtered
                      .slice(0, page === "dashboard" ? 3 : undefined)
                      .map((x, i) => (
                        <TournamentCard
                          key={x.id}
                          x={x}
                          i={i}
                          joined={progress.registrations.some(
                            (r) => r.id === x.id,
                          )}
                          entryCost={cost(x)}
                          openTournament={openTournament}
                          t={t}
                          arrow={arrow}
                        />
                      ))}
                  </div>
                  {filtered.length === 0 && (
                    <div className="empty">
                      <Search />
                      <h3>{t("noResults")}</h3>
                      <button
                        className="ghost"
                        onClick={() => {
                          setFilter("all");
                          setSkill("any");
                        }}
                      >
                        {t("clear")}
                      </button>
                    </div>
                  )}
                </section>
              )}
              {page === "dashboard" && (
                <div className="lower-grid">
                  <section className="panel activity-panel">
                    <div className="section-heading">
                      <h3>{t("activity")}</h3>
                      <span className="badge green">
                        <i className="dot" />
                        {t("live")}
                      </span>
                    </div>
                    {[t("feed1"), t("feed2"), t("feed3")].map((x, i) => (
                      <div className="feed-row" key={x}>
                        <div className={"feed-icon tone-" + i}>
                          {i === 0 ? (
                            <Trophy size={17} />
                          ) : i === 1 ? (
                            <Zap size={17} />
                          ) : (
                            <Users size={17} />
                          )}
                        </div>
                        <span>
                          {x}
                          <small>
                            {i + 2} {t("minute")}
                          </small>
                        </span>
                        <ArrowUpRight size={16} />
                      </div>
                    ))}
                  </section>
                  <section className="panel rank-summary">
                    <div className="section-heading">
                      <h3>{t("rank")}</h3>
                      <Target size={20} />
                    </div>
                    <div className="rank-big">
                      <div className="rank-emblem">
                        <Crown size={35} />
                      </div>
                      <div>
                        <span>
                          {game === "cs2" ? "PLATINUM III" : "MYTHIC"}
                        </span>
                        <h3>
                          {game === "cs2" ? "1,840" : "32"}{" "}
                          <small>{game === "cs2" ? "ELO" : "★"}</small>
                        </h3>
                      </div>
                      <span className="green-text">
                        +124 <ArrowUpRight size={14} />
                      </span>
                    </div>
                    <div className="progress-track">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "72%" }}
                      />
                    </div>
                    <div className="rank-footer">
                      <span>LVL 08</span>
                      <span>1,840 / 2,000 XP</span>
                      <span>LVL 09</span>
                    </div>
                  </section>
                </div>
              )}
              {page === "lobby" &&
                (!hasRoom ? (
                  <div className="empty large-empty">
                    <Crosshair size={50} />
                    <h2>{t("roomEmpty")}</h2>
                    <p>{t("roomHint")}</p>
                    <button className="primary" onClick={() => startQueue()}>
                      {t("solo")}
                      {arrow}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="page-feature">
                      <span className="eyebrow cyan-text">
                        {t("matchLabel")} #NX-0842 · {t("bestOf")}
                      </span>
                      <h2>{t("vetoTitle")}</h2>
                      <p>{t("vetoText")}</p>
                    </div>
                    <div className="rosters">
                      <section className="panel">
                        <div className="section-heading">
                          <h3>{t("teamA")}</h3>
                          <span className="cyan-text">
                            Ø{" "}
                            {game === "cs2"
                              ? rank === "advanced"
                                ? "1,874"
                                : "1,174"
                              : rank === "advanced"
                                ? "MYTHIC 34"
                                : "EPIC 34"}
                          </span>
                        </div>
                        {roster()}
                      </section>
                      <div className="versus">VS</div>
                      <section className="panel">
                        <div className="section-heading">
                          <h3>{t("teamB")}</h3>
                          <span className="orange-text">
                            Ø{" "}
                            {game === "cs2"
                              ? rank === "advanced"
                                ? "1,879"
                                : "1,179"
                              : rank === "advanced"
                                ? "MYTHIC 35"
                                : "EPIC 35"}
                          </span>
                        </div>
                        {playerNames.slice(4, 9).map((name, i) => (
                          <div className="player-card" key={name}>
                            <div className={`avatar tone-${(i + 2) % 5}`}>
                              {name[0].toUpperCase()}
                            </div>
                            <div>
                              <strong>{name}</strong>
                              <small>{t("player")}</small>
                            </div>
                            <span className="player-elo">
                              {game === "cs2"
                                ? (rank === "advanced" ? 1845 : 1145) + i * 17
                                : (rank === "advanced" ? "Mythic " : "Epic ") +
                                  (33 + i)}
                            </span>
                          </div>
                        ))}
                      </section>
                    </div>
                    <section className="panel veto-panel">
                      <div className="section-heading">
                        <h3>
                          {complete
                            ? t("matchReady")
                            : t(opponent ? "opponentTurn" : "yourTurn")}
                        </h3>
                        <span>
                          {bans.length}/{maps.length - 1}
                        </span>
                      </div>
                      <div className="maps-grid">
                        {maps.map((map, i) => (
                          <button
                            disabled={
                              bans.includes(map) || opponent || complete
                            }
                            onClick={() => {
                              setBans([...bans, map]);
                              if (bans.length + 1 < maps.length - 1)
                                setOpponent(true);
                            }}
                            key={map}
                            className={`map-card map-${i} ${bans.includes(map) ? "banned" : ""} ${complete && !bans.includes(map) ? "chosen" : ""}`}
                          >
                            <div className="map-buildings">
                              <i />
                              <i />
                              <i />
                            </div>
                            <span>{map}</span>
                            <small>
                              {bans.includes(map) ? (
                                <>
                                  <X size={14} />
                                  {t("banned")}
                                </>
                              ) : complete ? (
                                <>
                                  <Check size={14} />
                                  {t("selected")}
                                </>
                              ) : (
                                t("ban")
                              )}
                            </small>
                          </button>
                        ))}
                      </div>
                      <button
                        className="text-button muted"
                        onClick={() => {
                          setBans([]);
                          setOpponent(false);
                          setWon(false);
                        }}
                      >
                        {t("reset")}
                      </button>
                    </section>
                    {complete && (
                      <section className="panel connection">
                        <div>
                          <h3>{t("connect")}</h3>
                          <code dir="ltr">
                            {game === "cs2"
                              ? "connect demo.nexus.invalid:27015; password NX0842"
                              : "Room: NX-0842 · PIN: 2048"}
                          </code>
                          <p>{t("serverNote")}</p>
                        </div>
                        <button
                          className="ghost"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                game === "cs2"
                                  ? "connect demo.nexus.invalid:27015; password NX0842"
                                  : "NX-0842 / 2048",
                              );
                              setToast(t("copied"));
                            } catch {
                              setToast(
                                game === "cs2"
                                  ? "demo.nexus.invalid:27015 · NX0842"
                                  : "NX-0842 / 2048",
                              );
                            }
                          }}
                        >
                          <Copy size={16} />
                          {t("copy")}
                        </button>
                        <button
                          className="primary"
                          disabled={won}
                          onClick={() => {
                            if (won) return;
                            setWon(true);
                            setProgress((p) => ({
                              ...p,
                              coins: p.coins + 250,
                              wins: p.wins + 1,
                            }));
                            setToast(t("victoryText"));
                          }}
                        >
                          <Trophy size={16} />
                          {t(won ? "win" : "victory")}
                        </button>
                      </section>
                    )}
                  </>
                ))}
              {page === "shop" && (
                <>
                  <div className="page-feature">
                    <span className="eyebrow orange-text">
                      {t("rewardsKicker")}
                    </span>
                    <h2>{t("rewardsTitle")}</h2>
                    <p>{t("rewardsText")}</p>
                    <div className="balance-pill">
                      <Coins size={20} />
                      <b>{progress.coins.toLocaleString()}</b>
                      {t("coins")}
                    </div>
                  </div>
                  <p className="demo-note">
                    <ShieldCheck size={16} />
                    {t("rewardNote")}
                  </p>
                  <div className="rewards-grid">
                    {rewards
                      .filter((r) => r.game === game || r.game === "both")
                      .map((item) => (
                        <article className="reward-card panel" key={item.id}>
                          <div className={`reward-art ${item.kind}`}>
                            {item.kind === "skin" ? (
                              <Crosshair size={90} />
                            ) : item.kind === "diamond" ? (
                              <Diamond size={90} />
                            ) : item.kind === "cash" ? (
                              <Wallet size={90} />
                            ) : (
                              <Headphones size={90} />
                            )}
                            <Sparkles className="reward-spark" />
                          </div>
                          <span className="eyebrow">
                            {["payout", "accessory"].includes(item.label)
                              ? t(item.label as TextKey)
                              : item.label}
                          </span>
                          <h3>{item.name}</h3>
                          <div className="reward-bottom">
                            <strong>
                              <Coins size={17} />
                              {item.cost.toLocaleString()}
                            </strong>
                            <button
                              className="primary"
                              disabled={
                                progress.rewards.includes(item.id) ||
                                progress.coins < item.cost
                              }
                              onClick={() => {
                                setReward(item.id);
                                setModal("reward");
                              }}
                            >
                              {t(
                                progress.rewards.includes(item.id)
                                  ? "earned"
                                  : progress.coins < item.cost
                                    ? "notEnough"
                                    : "redeem",
                              )}
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                  <section className="panel inventory">
                    <h3>{t("inventory")}</h3>
                    {progress.rewards.length ? (
                      progress.rewards.map((id) => (
                        <div className="feed-row" key={id}>
                          <Check className="green-text" />
                          <span>
                            {rewards.find((r) => r.id === id)?.name}
                            <small>{t("redeemed")}</small>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p>{t("noRewards")}</p>
                    )}
                  </section>
                </>
              )}
              {page === "leaderboard" && (
                <>
                  <div className="page-feature">
                    <span className="eyebrow cyan-text">
                      {t("hallPlayers")}
                    </span>
                    <h2>{t("rankingsTitle")}</h2>
                    <p>{t("rankingsText")}</p>
                  </div>
                  <div className="filters">
                    <div className="filter-tabs">
                      {["elo", "teamRank", "monthly", "karmaLeaders"].map(
                        (x) => (
                          <button
                            className={ranking === x ? "selected" : ""}
                            key={x}
                            onClick={() => setRanking(x)}
                          >
                            {t(x as TextKey)}
                          </button>
                        ),
                      )}
                    </div>
                    <select
                      value={region}
                      aria-label={t("region")}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      <option value="national">{t("national")}</option>
                      <option value="international">
                        {t("international")}
                      </option>
                    </select>
                  </div>
                  <div className="panel table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>
                            {t(ranking === "teamRank" ? "roster" : "player")}
                          </th>
                          <th>{t("score")}</th>
                          <th>{t("wins")}</th>
                          <th>{t("karma")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 10 }, (_, i) => {
                          const names =
                            region === "national"
                              ? [
                                  "K1NG",
                                  "shadoW",
                                  "Noa.exe",
                                  "PixelStorm",
                                  "vortex",
                                  "NexusPlayer",
                                  "ghost.il",
                                  "Raze",
                                  "Moonlight",
                                  "AimTheory",
                                ]
                              : [
                                  "s1mple.demo",
                                  "Zywoo.demo",
                                  "m0nesy.demo",
                                  "Raze",
                                  "Moonlight",
                                  "NexusPlayer",
                                  "K1NG",
                                  "vortex",
                                  "PixelStorm",
                                  "Noa.exe",
                                ];
                          const offset =
                            ranking === "monthly"
                              ? 3
                              : ranking === "karmaLeaders"
                                ? 2
                                : 0;
                          const name = names[(i + offset) % 10];
                          return (
                            <tr
                              key={name}
                              className={
                                name === "NexusPlayer" ? "current-player" : ""
                              }
                            >
                              <td>
                                {i < 3 ? (
                                  <Trophy size={17} className={"podium-" + i} />
                                ) : (
                                  String(i + 1).padStart(2, "0")
                                )}
                              </td>
                              <td>
                                <span
                                  className={"table-avatar tone-" + (i % 5)}
                                >
                                  {name[0].toUpperCase()}
                                </span>
                                <strong>
                                  {ranking === "teamRank"
                                    ? "TEAM " + name.toUpperCase()
                                    : name}
                                </strong>
                                {name === "NexusPlayer" && (
                                  <span className="badge">{t("you")}</span>
                                )}
                              </td>
                              <td>
                                {ranking === "karmaLeaders"
                                  ? `${100 - i}%`
                                  : ranking === "monthly"
                                    ? 1200 - i * 71
                                    : game === "cs2"
                                      ? 2450 - i * 122
                                      : 85 - i * 4}
                              </td>
                              <td>
                                {138 -
                                  i * 9 +
                                  progress.wins *
                                    (name === "NexusPlayer" ? 1 : 0)}
                              </td>
                              <td>
                                <span className="green-text">
                                  <ShieldCheck size={13} />
                                  {ranking === "karmaLeaders"
                                    ? 100 - i
                                    : name === "NexusPlayer"
                                      ? 96
                                      : 99 - (i % 5)}
                                  %
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          {installBanner && (
            <div className="install-banner flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="install-banner-icon">
                <Download size={23} />
              </div>
              <div className="flex-1">
                <strong>NEXUS {t("install")}</strong>
                <p>{t("installHelp")}</p>
              </div>
              <button className="ghost" onClick={installApp}>
                {t("install")}
              </button>
              <button
                className="icon-button"
                aria-label={t("close")}
                onClick={() => setInstallBanner(false)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <footer className="page-footer">
            <span>
              <span className="mini-brand">N</span> NEXUS ARENA <b>•</b>{" "}
              {t("demo")}
            </span>
            <span>{t("demoText")}</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom">
        {navItems.map(({ id, icon: Icon }) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => changePage(id)}
          >
            <Icon size={21} />
            <span>{t(id)}</span>
          </button>
        ))}
      </nav>
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="toast"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <Check size={18} />
            {toast}
            <button aria-label={t("close")} onClick={() => setToast("")}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detail && (
          <Modal
            title={detail.name}
            close={closeDetail}
            closeLabel={t("close")}
          >
            <div className="detail-banner">
              <Art variant={detail.art} />
              <div>
                <span className="badge">{t(detail.status)}</span>
                <strong>₪{detail.prize.toLocaleString()}</strong>
                <small>{t("prize")}</small>
              </div>
            </div>
            <div className="detail-tabs">
              {["overview", "bracket", "rules", "roster", "prizes"].map(
                (tab) => (
                  <button
                    key={tab}
                    className={tab === detailTab ? "selected" : ""}
                    onClick={() => setDetailTab(tab)}
                  >
                    {t(tab as TextKey)}
                  </button>
                ),
              )}
            </div>
            <div className="detail-content">
              {detailTab === "overview" && (
                <>
                  <p>{t("tournamentDesc")}</p>
                  <div className="detail-stats">
                    <div>
                      <Users />
                      <strong>
                        {detail.filled +
                          (progress.registrations.some(
                            (r) => r.id === detail.id,
                          )
                            ? 1
                            : 0)}
                        /{detail.total}
                      </strong>
                      <small>{t("teams")}</small>
                    </div>
                    <div>
                      <Coins />
                      <strong>
                        {detail.fee ? cost(detail) : t("freeLabel")}
                      </strong>
                      <small>{t("entry")}</small>
                    </div>
                    <div>
                      <ShieldCheck />
                      <strong>10%</strong>
                      <small>{t("discounted")}</small>
                    </div>
                  </div>
                  <p className="demo-note">{t("payment")}</p>
                </>
              )}
              {detailTab === "bracket" && (
                <div className="bracket" dir="ltr">
                  {[
                    ["NOVA", "PHOENIX", "ATLAS", "VORTEX"],
                    ["NOVA", "VORTEX"],
                    ["NOVA"],
                  ].map((round, i) => (
                    <div className="bracket-round" key={i}>
                      {round.map((name, j) => (
                        <div key={name} className={i === 2 ? "champion" : ""}>
                          {i === 2 && <Trophy size={16} />}
                          <strong>{name}</strong>
                          <span>
                            {i === 2 ? "★" : j % 2 === 0 ? "13" : "8"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {detailTab === "rules" && (
                <p className="rules-text">{t("ruleText")}</p>
              )}
              {detailTab === "roster" &&
                [
                  "NOVA",
                  "PHOENIX",
                  "ATLAS",
                  "VORTEX",
                  ...(progress.registrations.some((r) => r.id === detail.id)
                    ? ["NexusPlayer"]
                    : []),
                ].map((name, i) => (
                  <div className="feed-row" key={name}>
                    <div className={"avatar tone-" + i}>{name[0]}</div>
                    <strong>{name}</strong>
                    <span className="green-text">
                      5/5 <Check size={13} />
                    </span>
                  </div>
                ))}
              {detailTab === "prizes" &&
                [0.6, 0.25, 0.15].map((share, i) => (
                  <div className="prize-row" key={share}>
                    <Trophy className={"podium-" + i} />
                    <span>{t((["first", "second", "third"] as const)[i])}</span>
                    <strong>₪{(detail.prize * share).toLocaleString()}</strong>
                  </div>
                ))}
            </div>
            {detail.status === "open" && (
              <div className="modal-actions">
                {progress.registrations.some((r) => r.id === detail.id) ? (
                  <button
                    className="ghost"
                    onClick={() => cancelRegistration(detail)}
                  >
                    {t("cancelJoin")}
                  </button>
                ) : (
                  <>
                    <button
                      className="primary"
                      onClick={() => startQueue(detail.id)}
                    >
                      <Users size={16} />
                      {t("joinSolo")}
                    </button>
                    <button className="ghost" onClick={() => join(detail)}>
                      {t("squad")}
                    </button>
                  </>
                )}
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && (
          <Modal
            title={t(
              modal === "login"
                ? "loginTitle"
                : modal === "profile"
                  ? "profile"
                  : modal === "queue"
                    ? queue === "ready"
                      ? "ready"
                      : "matchmaking"
                    : "rewardConfirm",
            )}
            close={closeModal}
            closeLabel={t("close")}
          >
            {modal === "login" && (
              <div className="login-content">
                <div className="login-logo brand-mark">N</div>
                <p>{t("loginText")}</p>
                <span className="badge">{t("demo")}</span>
                <div className="login-options">
                  {["google", "apple", "phone"].map((x) => (
                    <button
                      className={loginMethod === x ? "selected" : ""}
                      onClick={() => setLoginMethod(x)}
                      key={x}
                    >
                      {x === "google" ? (
                        <Globe size={20} />
                      ) : x === "apple" ? (
                        <LogIn size={20} />
                      ) : (
                        <Smartphone size={20} />
                      )}{" "}
                      {t(x as TextKey)}
                      {loginMethod === x && <Check size={16} />}
                    </button>
                  ))}
                </div>
                {loginMethod === "phone" && (
                  <label className="field-label">
                    {t("phoneNumber")}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="050-123-4567"
                      dir="ltr"
                    />
                  </label>
                )}
                {loginMethod && (
                  <button
                    className="primary full"
                    onClick={() => {
                      if (
                        (loginMethod === "phone" &&
                          !/^\+?[\d\s()-]{8,20}$/.test(phone)) ||
                        (loginMethod === "phone" &&
                          (phone.replace(/\D/g, "").length < 8 ||
                            phone.replace(/\D/g, "").length > 15))
                      ) {
                        setToast(t("phoneError"));
                        return;
                      }
                      setProgress((p) => ({ ...p, signedIn: true }));
                      closeModal();
                      setToast(t("signedIn"));
                    }}
                  >
                    {t("continue")}
                    {arrow}
                  </button>
                )}
                <p className="demo-note">{t("demoText")}</p>
              </div>
            )}
            {modal === "profile" && (
              <div className="profile-content">
                <div className="avatar large-avatar">N</div>
                <h3>NexusPlayer</h3>
                <p>LVL 08 · {game === "cs2" ? "1,840 ELO" : "MYTHIC 32"}</p>
                <div className="detail-stats">
                  <div>
                    <Coins />
                    <strong>{progress.coins}</strong>
                    <small>{t("coins")}</small>
                  </div>
                  <div>
                    <ShieldCheck />
                    <strong>96%</strong>
                    <small>{t("karma")}</small>
                  </div>
                  <div>
                    <Trophy />
                    <strong>{progress.wins}</strong>
                    <small>{t("wins")}</small>
                  </div>
                </div>
                <p>{t("karmaDetail")}</p>
                <h4>{t("joined")}</h4>
                {progress.registrations.length ? (
                  progress.registrations.map((r) => (
                    <button
                      className="profile-registration"
                      key={r.id}
                      onClick={() => {
                        closeModal();
                        const x = tournaments.find((x) => x.id === r.id);
                        if (x) openTournament(x);
                      }}
                    >
                      {tournaments.find((x) => x.id === r.id)?.name}
                      {arrow}
                    </button>
                  ))
                ) : (
                  <p>{t("noJoined")}</p>
                )}
                <button
                  className="ghost full"
                  onClick={() => {
                    setProgress((p) => ({ ...p, signedIn: false }));
                    closeModal();
                  }}
                >
                  {t("logout")}
                </button>
              </div>
            )}
            {modal === "queue" && (
              <div className="queue-content">
                {queue === "idle" ? (
                  <>
                    <Crosshair size={48} />
                    <p>{t("queueHint")}</p>
                    <button
                      className="primary full"
                      onClick={() => setQueue("searching")}
                    >
                      {t("solo")}
                    </button>
                  </>
                ) : queue === "searching" ? (
                  <>
                    <div className="search-radar">
                      <div />
                      <Crosshair size={50} />
                      <span />
                      <span />
                    </div>
                    <h3>{t("matching")}</h3>
                    <p>{t("queueHint")}</p>
                    <div className="queue-selects">
                      <label>
                        {t("role")}
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        >
                          {[
                            "balanced",
                            ...(game === "cs2"
                              ? ["csRole1", "csRole2", "csRole3"]
                              : ["mlRole1", "mlRole2", "mlRole3"]),
                          ].map((x) => (
                            <option value={x} key={x}>
                              {t(x as TextKey)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t("level")}
                        <select
                          value={rank}
                          onChange={(e) => setRank(e.target.value)}
                        >
                          <option value="advanced">{t("advanced")}</option>
                          <option value="beginner">{t("beginner")}</option>
                        </select>
                      </label>
                    </div>
                    <button
                      className="ghost full"
                      onClick={() => {
                        setQueue("idle");
                        closeModal();
                      }}
                    >
                      {t("cancel")}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="ready-icon">
                      <Check size={38} />
                    </div>
                    <p>
                      {t("queueHint")} · {t(rank as TextKey)}
                    </p>
                    {roster()}
                    <button className="primary full" onClick={enterRoom}>
                      {t("enterRoom")}
                      {arrow}
                    </button>
                  </>
                )}
              </div>
            )}
            {modal === "reward" && (
              <div className="reward-confirm">
                <Diamond size={50} className="cyan-text" />
                <h3>{rewards.find((x) => x.id === reward)?.name}</h3>
                <strong>
                  <Coins size={18} />
                  {rewards
                    .find((x) => x.id === reward)
                    ?.cost.toLocaleString()}{" "}
                  {t("coins")}
                </strong>
                <p>{t("rewardNote")}</p>
                <button className="primary full" onClick={handleRedeem}>
                  {t("confirm")}
                </button>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
      {(celebrate || (won && page === "lobby")) && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 30 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${i * 3.3}%`,
                animationDelay: `${(i % 6) * 0.12}s`,
                background: i % 2 ? "#27dce7" : "#ff753b",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
