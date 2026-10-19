import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Coins, Users, Check } from "lucide-react";
import type { TextKey } from "../lib/i18n";
import type { Tournament } from "../lib/data";
import Art from "./Art";
type Props = {
  x: Tournament;
  i: number;
  joined: boolean;
  entryCost: number;
  openTournament: (x: Tournament) => void;
  t: (key: TextKey) => string;
  arrow: ReactNode;
};
export default function TournamentCard({
  x,
  i,
  joined,
  entryCost,
  openTournament,
  t,
  arrow,
}: Props) {
  return (
    <motion.article
      className="tournament-card"

      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
    >
      <button
        className="card-art"
        onClick={() => openTournament(x)}
        aria-label={x.name}
      >
        <Art variant={x.art} />
        <span className={`status-badge ${x.status}`}>
          <i />
          {t(x.status)}
        </span>
        <span className="card-game">
          <Gamepad2 size={13} />
          {x.game === "cs2" ? "CS2" : "MLBB"} · 5v5
        </span>
        <div className="tournament-art-title">
          {x.name.split("//")[0]}
          <small>
            {x.type === "weekly" ? t("weeklySeries") : t("dailySeries")} / 2026
          </small>
        </div>
      </button>
      <div className="card-body">
        <div className="card-meta">
          <span>
            {t(x.type)} <span>•</span> {t(x.skill)}
          </span>
          <span>{t("bestOf")}</span>
        </div>
        <h3>
          <button onClick={() => openTournament(x)}>{x.name}</button>
        </h3>
        <div className="card-numbers">
          <div>
            <small>{t("prize")}</small>
            <strong className="orange-text">₪{x.prize.toLocaleString()}</strong>
          </div>
          <div>
            <small>{t("entry")}</small>
            <strong className={x.fee === 0 ? "green-text" : ""}>
              {x.fee === 0 ? (
                t("freeLabel")
              ) : (
                <>
                  <Coins size={14} />
                  {entryCost}
                </>
              )}
            </strong>
          </div>
        </div>
        <div className="capacity-info">
          <span>
            <Users size={13} />
            {x.filled + (joined ? 1 : 0)} / {x.total} {t("teams")}
          </span>
          <span>
            {Math.max(0, x.total - x.filled - (joined ? 1 : 0))} {t("slots")}
          </span>
        </div>
        <div className="progress-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, ((x.filled + (joined ? 1 : 0)) / x.total) * 100)}%`,
            }}
          />
        </div>
        <button className="card-join" onClick={() => openTournament(x)}>
          {joined ? (
            <>
              <Check size={15} />
              {t("registered")}
            </>
          ) : (
            <>
              {x.status === "open" ? t("join") : t("overview")}
              {arrow}
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}
