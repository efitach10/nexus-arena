export type StudioGame = "cs2" | "mlbb" | "ow2";
export type Tool =
  | "select"
  | "player"
  | "pen"
  | "arrow"
  | "curve"
  | "smoke"
  | "flash"
  | "molotov"
  | "grenade"
  | "note"
  | "erase";
export type Point = { x: number; y: number };
export type Mark = {
  id: string;
  tool: Tool;
  points: Point[];
  color: string;
  label: string;
  time: number;
  role?: string;
};
export type Layers = {
  grid: boolean;
  vision: boolean;
  danger: boolean;
  objectives: boolean;
  jungle: boolean;
  bushes: boolean;
  turrets: boolean;
  highground: boolean;
  sightlines: boolean;
};
export type BoardDoc = {
  version: 2;
  game: StudioGame;
  map: string;
  name: string;
  marks: Mark[];
  layers: Layers;
  duration: number;
};
export const COLORS = ["#00f0ff", "#ff2e63", "#00ff88", "#ffb800", "#b28bff"];
export const GAMES = {
  cs2: {
    name: "Counter-Strike 2",
    short: "CS2",
    accent: "#00f0ff",
    maps: ["Mirage", "Inferno", "Nuke", "Anubis", "Ancient", "Dust II"],
    roles: ["IGL", "Entry", "AWPer", "Support", "Lurker"],
    duration: 120,
  },
  mlbb: {
    name: "Mobile Legends",
    short: "MLBB",
    accent: "#00ff88",
    maps: ["Land of Dawn"],
    roles: ["Jungle", "Mid", "Roam", "Gold", "EXP"],
    duration: 600,
  },
  ow2: {
    name: "Overwatch 2",
    short: "OW2",
    accent: "#ffb800",
    maps: ["King’s Row", "Circuit Royal", "Flashpoint"],
    roles: ["Tank", "Damage", "Damage", "Support", "Support"],
    duration: 300,
  },
} as const;
export const uid = () => crypto.randomUUID();
export const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
export function newBoard(
  game: StudioGame,
  map: string = GAMES[game].maps[0],
): BoardDoc {
  const points =
    game === "mlbb"
      ? [
          [260, 470],
          [360, 430],
          [420, 390],
          [220, 370],
          [190, 440],
        ]
      : game === "ow2"
        ? [
            [300, 410],
            [340, 460],
            [260, 470],
            [220, 430],
            [200, 490],
          ]
        : [
            [220, 480],
            [265, 460],
            [305, 500],
            [195, 530],
            [340, 480],
          ];
  const marks: Mark[] = points.map(([x, y], i) => ({
    id: uid(),
    tool: "player",
    points: [{ x, y }],
    label: String(i + 1),
    role: GAMES[game].roles[i],
    color: COLORS[0],
    time: 0,
  }));
  marks.push({
    id: uid(),
    tool: "curve",
    role: GAMES[game].roles[0],
    points: [
      { x: 270, y: 460 },
      { x: 560, y: 300 },
    ],
    label: "",
    color: COLORS[0],
    time: 12,
  });
  if (game === "cs2")
    marks.push(
      {
        id: uid(),
        tool: "smoke",
        points: [
          { x: 320, y: 460 },
          { x: 620, y: 220 },
        ],
        label: "",
        color: "#00ff88",
        time: 35,
      },
      {
        id: uid(),
        tool: "note",
        points: [{ x: 630, y: 370 }],
        label: "A EXECUTE",
        color: "#ffb800",
        time: 0,
      },
    );
  return {
    version: 2,
    game,
    map,
    name:
      game === "cs2"
        ? "A-site execute"
        : game === "mlbb"
          ? "Turtle rotation"
          : "Choke-point push",
    marks,
    layers: {
      grid: false,
      vision: true,
      danger: false,
      objectives: true,
      jungle: true,
      bushes: true,
      turrets: true,
      highground: true,
      sightlines: true,
    },
    duration: GAMES[game].duration,
  };
}
export function validBoard(value: unknown): value is BoardDoc {
  try {
    if (!value || typeof value !== "object") return false;
    const v = value as BoardDoc;
    return (
      v.version === 2 &&
      ["cs2", "mlbb", "ow2"].includes(v.game) &&
      GAMES[v.game].maps.some((x) => x === v.map) &&
      typeof v.name === "string" &&
      v.name.length <= 120 &&
      Number.isFinite(v.duration) &&
      v.duration > 0 &&
      v.duration <= 172800 &&
      v.layers &&
      Object.keys(newBoard(v.game).layers).every(
        (key) => typeof v.layers[key as keyof Layers] === "boolean",
      ) &&
      Array.isArray(v.marks) &&
      v.marks.length <= 400 &&
      new Set(v.marks.map((m) => m.id)).size === v.marks.length &&
      v.marks.every(
        (m) =>
          typeof m.id === "string" &&
          m.id.length <= 100 &&
          (m.role === undefined ||
            (typeof m.role === "string" && m.role.length <= 80)) &&
          [
            "select",
            "player",
            "pen",
            "arrow",
            "curve",
            "smoke",
            "flash",
            "molotov",
            "grenade",
            "note",
            "erase",
          ].includes(m.tool) &&
          typeof m.label === "string" &&
          m.label.length <= 200 &&
          /^#[a-f\d]{6}$/i.test(m.color) &&
          Number.isFinite(m.time) &&
          m.time >= 0 &&
          m.time <= v.duration &&
          Array.isArray(m.points) &&
          m.points.length > 0 &&
          m.points.length <= 5000 &&
          m.points.every(
            (p) =>
              Number.isFinite(p.x) &&
              Number.isFinite(p.y) &&
              p.x >= 0 &&
              p.x <= 1000 &&
              p.y >= 0 &&
              p.y <= 640,
          ),
      )
    );
  } catch {
    return false;
  }
}
export function loadBoard(game: StudioGame, map: string): BoardDoc {
  try {
    const value = JSON.parse(
      localStorage.getItem(`nexus-board:${game}:${map}`) || "null",
    );
    if (validBoard(value) && value.game === game && value.map === map)
      return value;
  } catch {}
  return newBoard(game, map);
}
export function saveBoard(doc: BoardDoc) {
  try {
    localStorage.setItem(
      `nexus-board:${doc.game}:${doc.map}`,
      JSON.stringify(doc),
    );
    return true;
  } catch {
    return false;
  }
}
export async function shareBoard(doc: BoardDoc): Promise<string> {
  const stream = new Blob([JSON.stringify(doc)])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `${location.origin}${location.pathname}#plan=${btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}
export async function decodeBoard(hash: string): Promise<BoardDoc | null> {
  try {
    if (!hash.startsWith("#plan=") || hash.length > 150000) return null;
    const binary = atob(
      hash.slice(6).replaceAll("-", "+").replaceAll("_", "/"),
    );
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const reader = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"))
      .getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2_000_000) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const value = JSON.parse(await new Blob(chunks as BlobPart[]).text());
    return validBoard(value) ? value : null;
  } catch {
    return null;
  }
}
export function curvePath(a: Point, b: Point) {
  return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 - 45} ${(a.y + b.y) / 2 - 65} ${b.x} ${b.y}`;
}
export function pointOnCurve(a: Point, b: Point, t: number): Point {
  const c = { x: (a.x + b.x) / 2 - 45, y: (a.y + b.y) / 2 - 65 };
  return {
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
  };
}
export function visionBlocked(
  player: Point,
  smoke: Point,
  target: Point,
  radius = 45,
) {
  const dx = target.x - player.x,
    dy = target.y - player.y;
  const t =
    ((smoke.x - player.x) * dx + (smoke.y - player.y) * dy) /
    (dx * dx + dy * dy || 1);
  return (
    t > 0 &&
    t < 1 &&
    Math.hypot(player.x + t * dx - smoke.x, player.y + t * dy - smoke.y) <
      radius
  );
}
export function draftScore(names: string[], roles: string[]) {
  const unique = new Set(names.filter(Boolean));
  return Math.min(98, Math.round(unique.size * 11 + new Set(roles).size * 8));
}

export function translatedMark(mark: Mark, from: Point, to: Point): Mark {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  return {
    ...mark,
    points: mark.points.map((p) => ({
      x: Math.max(0, Math.min(1000, p.x + dx)),
      y: Math.max(0, Math.min(640, p.y + dy)),
    })),
  };
}
export function playbackMark(mark: Mark, doc: BoardDoc, time: number): Mark {
  if (mark.tool !== "player") return mark;
  const route = doc.marks
    .filter(
      (m) =>
        (m.tool === "curve" || m.tool === "arrow") &&
        m.role === mark.role &&
        m.time <= time &&
        m.points.length > 1,
    )
    .sort((a, b) => b.time - a.time)[0];
  if (!route) return mark;
  const progress = Math.max(0, Math.min(1, (time - route.time) / 6));
  return {
    ...mark,
    points: [pointOnCurve(route.points[0], route.points.at(-1)!, progress)],
  };
}
