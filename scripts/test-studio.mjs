import test from "node:test";
import assert from "node:assert/strict";
import {
  newBoard,
  validBoard,
  shareBoard,
  decodeBoard,
  visionBlocked,
  pointOnCurve,
  draftScore,
  saveBoard,
  loadBoard,
  translatedMark,
  playbackMark,
} from "../src/studio/model.ts";
import { youtubeId } from "../src/studio/media.ts";
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
};
globalThis.location = {
  origin: "https://example.github.io",
  pathname: "/nexus-arena/",
};
test("all game presets are valid and keep five roles", () => {
  for (const game of ["cs2", "mlbb", "ow2"]) {
    const board = newBoard(game);
    assert.equal(validBoard(board), true);
    assert.equal(board.marks.filter((m) => m.tool === "player").length, 5);
  }
});
test("hostile or corrupt imported data is rejected", () => {
  const board = newBoard("cs2");
  for (const bad of [
    null,
    {},
    { ...board, game: "unknown" },
    { ...board, marks: [null] },
    { ...board, marks: [{ ...board.marks[0], role: { html: "bad" } }] },
    {
      ...board,
      marks: [{ ...board.marks[0], points: [{ x: Infinity, y: 12 }] }],
    },
    { ...board, marks: [{ ...board.marks[0], points: [{ x: 1200, y: 12 }] }] },
    { ...board, marks: [board.marks[0], board.marks[0]] },
  ])
    assert.equal(validBoard(bad), false);
});
test("share snapshot preserves Hebrew and the project path", async () => {
  const board = newBoard("mlbb");
  board.name = "רוטציה לצב";
  const url = await shareBoard(board);
  assert.ok(url.startsWith("https://example.github.io/nexus-arena/#plan="));
  const restored = await decodeBoard(new URL(url).hash);
  assert.deepEqual(restored, board);
  assert.equal(await decodeBoard("#plan=not-valid"), null);
});
test("plans persist independently by game and map", () => {
  const a = newBoard("cs2", "Mirage"),
    b = newBoard("cs2", "Inferno");
  a.name = "custom A";
  b.name = "custom B";
  saveBoard(a);
  saveBoard(b);
  assert.equal(loadBoard("cs2", "Mirage").name, "custom A");
  assert.equal(loadBoard("cs2", "Inferno").name, "custom B");
  assert.equal(loadBoard("mlbb", "Land of Dawn").game, "mlbb");
});
test("2D smoke intersections exclude smoke behind a player or beyond the target", () => {
  const player = { x: 0, y: 0 },
    target = { x: 100, y: 0 };
  assert.equal(visionBlocked(player, { x: 50, y: 0 }, target, 10), true);
  assert.equal(visionBlocked(player, { x: -20, y: 0 }, target, 10), false);
  assert.equal(visionBlocked(player, { x: 120, y: 0 }, target, 10), false);
  assert.equal(visionBlocked(player, { x: 50, y: 40 }, target, 10), false);
});
test("trajectory interpolation starts and ends at chosen points", () => {
  const a = { x: 10, y: 20 },
    b = { x: 500, y: 400 };
  assert.deepEqual(pointOnCurve(a, b, 0), a);
  assert.deepEqual(pointOnCurve(a, b, 1), b);
});
test("draft coverage rewards distinct roles and excludes duplicate picks", () => {
  assert.ok(
    draftScore(["A", "B"], ["Tank", "Support"]) >
      draftScore(["A", "A"], ["Tank", "Tank"]),
  );
});
test("YouTube only accepts known hosts and 11-character IDs", () => {
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(
    youtubeId("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ"),
    null,
  );
  assert.equal(youtubeId("javascript:alert(1)"), null);
  assert.equal(youtubeId("https://youtu.be/invalid"), null);
});

test("dragging moves a complete route, not only its first point", () => {
  const mark = { ...newBoard("cs2").marks.find((m) => m.tool === "curve") };
  const moved = translatedMark(mark, { x: 10, y: 10 }, { x: 30, y: 40 });
  assert.equal(moved.points[0].x, mark.points[0].x + 20);
  assert.equal(moved.points[1].y, mark.points[1].y + 30);
});
test("timeline playback moves the player assigned to a route", () => {
  const board = newBoard("cs2");
  const player = board.marks[0],
    route = board.marks.find((m) => m.tool === "curve");
  assert.deepEqual(playbackMark(player, board, 0).points, player.points);
  assert.deepEqual(
    playbackMark(player, board, route.time + 6).points[0],
    route.points.at(-1),
  );
});
