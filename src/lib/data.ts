export type Game = "cs2" | "mlbb";
export type Tournament = {
  id: string;
  name: string;
  game: Game;
  prize: number;
  fee: number;
  filled: number;
  total: number;
  type: "daily" | "weekly";
  skill: "beginner" | "advanced";
  status: "open" | "live" | "ended";
  art: string;
};
export const tournaments: Tournament[] = [
  {
    id: "cs-major",
    name: "NEXUS OPEN // SEASON 04",
    game: "cs2",
    prize: 10000,
    fee: 0,
    filled: 24,
    total: 32,
    type: "weekly",
    skill: "advanced",
    status: "open",
    art: "orange",
  },
  {
    id: "cs-night",
    name: "MIDNIGHT CLASH",
    game: "cs2",
    prize: 2500,
    fee: 300,
    filled: 12,
    total: 16,
    type: "daily",
    skill: "advanced",
    status: "open",
    art: "blue",
  },
  {
    id: "cs-rise",
    name: "RISING STARS CUP",
    game: "cs2",
    prize: 1000,
    fee: 0,
    filled: 18,
    total: 32,
    type: "daily",
    skill: "beginner",
    status: "open",
    art: "green",
  },
  {
    id: "cs-live",
    name: "TEL AVIV MASTERS",
    game: "cs2",
    prize: 5000,
    fee: 200,
    filled: 16,
    total: 16,
    type: "weekly",
    skill: "advanced",
    status: "live",
    art: "violet",
  },
  {
    id: "cs-past",
    name: "WEEKEND SHOWDOWN",
    game: "cs2",
    prize: 1500,
    fee: 0,
    filled: 16,
    total: 16,
    type: "weekly",
    skill: "beginner",
    status: "ended",
    art: "blue",
  },
  {
    id: "ml-major",
    name: "LAND OF DAWN // OPEN",
    game: "mlbb",
    prize: 8000,
    fee: 0,
    filled: 20,
    total: 32,
    type: "weekly",
    skill: "advanced",
    status: "open",
    art: "violet",
  },
  {
    id: "ml-daily",
    name: "MYTHIC RUSH",
    game: "mlbb",
    prize: 2000,
    fee: 250,
    filled: 10,
    total: 16,
    type: "daily",
    skill: "advanced",
    status: "open",
    art: "blue",
  },
  {
    id: "ml-rise",
    name: "NEW LEGENDS CUP",
    game: "mlbb",
    prize: 1000,
    fee: 0,
    filled: 8,
    total: 16,
    type: "daily",
    skill: "beginner",
    status: "open",
    art: "green",
  },
  {
    id: "ml-live",
    name: "DAWN CHAMPIONS",
    game: "mlbb",
    prize: 4000,
    fee: 0,
    filled: 16,
    total: 16,
    type: "weekly",
    skill: "advanced",
    status: "live",
    art: "orange",
  },
];
export const rewards = [
  {
    id: "skin",
    name: "AK-47 | Neon Revolution",
    label: "CS2 SKIN",
    cost: 1800,
    kind: "skin",
    game: "cs2",
  },
  {
    id: "diamonds",
    name: "500 + 65 Diamonds",
    label: "MOBILE LEGENDS",
    cost: 1200,
    kind: "diamond",
    game: "mlbb",
  },
  {
    id: "cash",
    name: "₪50 · Bit / PayPal / PayBox",
    label: "payout",
    cost: 2500,
    kind: "cash",
    game: "both",
  },
  {
    id: "headset",
    name: "NEXUS Gaming Headset",
    label: "accessory",
    cost: 4000,
    kind: "headset",
    game: "both",
  },
];
export const playerNames = [
  "shadoW",
  "PixelStorm",
  "Noa.exe",
  "K1NG",
  "vortex",
  "AimTheory",
  "Moonlight",
  "Raze",
  "ghost.il",
];
export type Registration = { id: string; cost: number };
export type Progress = {
  coins: number;
  registrations: Registration[];
  rewards: string[];
  signedIn: boolean;
  wins: number;
};
const initial: Progress = {
  coins: 2450,
  registrations: [],
  rewards: [],
  signedIn: false,
  wins: 0,
};
export function readProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem("nexus-progress") || "null");
    if (
      p &&
      Number.isFinite(p.coins) &&
      p.coins >= 0 &&
      Array.isArray(p.registrations) &&
      Array.isArray(p.rewards) &&
      Number.isFinite(p.wins)
    )
      return { ...initial, ...p };
  } catch {
    /* Recover from blocked storage or invalid data. */
  }
  return initial;
}
export function persistProgress(p: Progress) {
  try {
    localStorage.setItem("nexus-progress", JSON.stringify(p));
  } catch {
    /* The app can still run in memory when storage is unavailable. */
  }
}
