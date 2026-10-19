import { forwardRef, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import {
  curvePath,
  pointOnCurve,
  uid,
  visionBlocked,
  translatedMark,
  playbackMark,
} from "./model";
import type { BoardDoc, Mark, Point, Tool } from "./model";
import type { Translator } from "./text";
import BattleMap from "./BattleMap";
export type BoardProps = {
  doc: BoardDoc;
  onChange: (next: BoardDoc) => void;
  tool: Tool;
  color: string;
  label: string;
  role: string;
  time: number;
  playing: boolean;
  zoom: number;
  setZoom: (value: number) => void;
  t: Translator;
  overlay?: boolean;
};
export const MarkShape = ({
  mark,
  time,
  playing,
  select,
}: {
  mark: Mark;
  time: number;
  playing: boolean;
  select?: boolean;
}) => {
  const a = mark.points[0],
    b = mark.points.at(-1)!;
  const progress = Math.max(0, Math.min(1, (time - mark.time) / 6));
  const end = playing ? pointOnCurve(a, b, progress) : b;
  const path =
    mark.tool === "pen"
      ? mark.points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ")
      : mark.tool === "arrow"
        ? `M ${a.x} ${a.y} L ${b.x} ${b.y}`
        : curvePath(a, b);
  const utility = ["smoke", "flash", "molotov", "grenade"].includes(mark.tool);
  return (
    <g
      data-mark={mark.id}
      data-at={mark.time}
      data-kind={mark.tool}
      opacity={time < mark.time ? 0.2 : 1}
      style={{ cursor: select ? "move" : undefined }}
    >
      {mark.tool === "player" ? (
        <g>
          <circle
            cx={a.x}
            cy={a.y}
            r="21"
            fill={mark.color + "15"}
            stroke={mark.color}
            strokeWidth="1"
          />
          <circle
            cx={a.x}
            cy={a.y}
            r="15"
            fill="#112831"
            stroke={mark.color}
            strokeWidth="2"
          />
          <text
            x={a.x}
            y={a.y + 5}
            fill="#eefaff"
            textAnchor="middle"
            fontFamily="Arial"
            fontWeight="bold"
            fontSize="11"
          >
            {mark.label.slice(0, 3)}
          </text>
          <text
            x={a.x}
            y={a.y + 34}
            fill={mark.color}
            textAnchor="middle"
            fontSize="8"
            fontFamily="Arial"
          >
            {mark.role}
          </text>
        </g>
      ) : mark.tool === "note" ? (
        <g>
          <rect
            x={a.x - 4}
            y={a.y - 19}
            width={Math.min(270, mark.label.length * 8 + 20)}
            height="29"
            rx="4"
            fill="#111b26"
            stroke={mark.color + "88"}
          />
          <text
            x={a.x + 5}
            y={a.y}
            fill={mark.color}
            fontFamily="Arial"
            fontWeight="bold"
            fontSize="12"
          >
            {mark.label}
          </text>
        </g>
      ) : (
        <g>
          <path
            d={path}
            stroke={mark.color}
            fill="none"
            strokeWidth={mark.tool === "pen" ? 3 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={utility ? "5 5" : undefined}
            markerEnd={
              utility || mark.tool === "pen"
                ? undefined
                : `url(#arrow-${mark.color.slice(1)})`
            }
          />
          {(utility || mark.tool === "curve") && (
            <circle
              cx={end.x}
              cy={end.y}
              r="4"
              fill={mark.color}
              className="trajectory-dot"
            />
          )}
          {utility && (
            <g
              data-impact="true"
              transform={`translate(${b.x} ${b.y}) scale(${playing ? Math.max(0.03, Math.min(1, (time - mark.time - 6) / 2)) : 1})`}
              opacity={!playing || progress === 1 ? 1 : 0.2}
            >
              <circle
                r={
                  mark.tool === "smoke"
                    ? 45
                    : mark.tool === "molotov"
                      ? 33
                      : mark.tool === "flash"
                        ? 65
                        : 35
                }
                fill={mark.color + (mark.tool === "flash" ? "09" : "22")}
                stroke={mark.color}
                strokeWidth="1.5"
                strokeDasharray="4 5"
              />
              {mark.tool === "smoke" ? (
                <g fill={mark.color + "22"}>
                  {[
                    [-15, -12],
                    [12, 8],
                    [-10, 12],
                    [12, -12],
                  ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="23" />
                  ))}
                </g>
              ) : mark.tool === "molotov" ? (
                <path
                  d="M -13 13 Q -20 -4 -4 -18 Q -4 0 5 -7 Q 26 14 2 19 Z"
                  fill={mark.color + "99"}
                />
              ) : (
                <path
                  d="M -10 0 H 10 M 0 -10 V 10"
                  stroke={mark.color}
                  strokeWidth="2"
                />
              )}
              <text
                y="4"
                textAnchor="middle"
                fill="#d5f9ff"
                fontSize="9"
                fontFamily="Arial"
              >
                {mark.tool === "smoke"
                  ? "S"
                  : mark.tool === "flash"
                    ? "F"
                    : mark.tool === "grenade"
                      ? "HE"
                      : ""}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};
const TacticalBoard = forwardRef<SVGSVGElement, BoardProps>(
  function TacticalBoard(
    {
      doc,
      onChange,
      tool,
      color,
      label,
      role,
      time,
      playing,
      zoom,
      setZoom,
      t,
      overlay = false,
    },
    forwardedRef,
  ) {
    const svg = useRef<SVGSVGElement | null>(null),
      pointers = useRef(new Map<number, Point>()),
      gesture = useRef<{
        distance: number;
        zoom: number;
        center: Point;
        pan: Point;
      } | null>(null),
      drag = useRef<{ id: string; start: Point; before: BoardDoc } | null>(
        null,
      );
    const [draft, setDraft] = useState<Mark | null>(null),
      [pan, setPan] = useState({ x: 0, y: 0 });
    const panRef = useRef(pan);
    panRef.current = pan;
    const getPoint = (e: { clientX: number; clientY: number }) => {
      const matrix = svg.current?.getScreenCTM();
      if (!matrix) return { x: 0, y: 0 };
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        matrix.inverse(),
      );
      return {
        x: Math.max(0, Math.min(1000, (p.x - pan.x) / zoom)),
        y: Math.max(0, Math.min(640, (p.y - pan.y) / zoom)),
      };
    };
    const start = (e: PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      e.currentTarget.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        gesture.current = {
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          zoom,
          center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          pan: panRef.current,
        };
        setDraft(null);
        drag.current = null;
        return;
      }
      const p = getPoint(e),
        id = (e.target as Element)
          .closest("[data-mark]")
          ?.getAttribute("data-mark");
      if (tool === "erase") {
        if (id)
          onChange({ ...doc, marks: doc.marks.filter((m) => m.id !== id) });
        return;
      }
      if (tool === "select") {
        if (id) drag.current = { id, start: p, before: doc };
        return;
      }
      if (doc.marks.length >= 400) return;
      const mark: Mark = {
        id: uid(),
        tool,
        points: [p],
        color,
        label:
          tool === "player"
            ? label ||
              String(doc.marks.filter((m) => m.tool === "player").length + 1)
            : label || t("note"),
        role,
        time,
      };
      if (tool === "player" || tool === "note") {
        onChange({ ...doc, marks: [...doc.marks, mark] });
        return;
      }
      setDraft(mark);
    };
    const move = (e: PointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2 && gesture.current) {
        const [a, b] = [...pointers.current.values()],
          g = gesture.current;
        const z = Math.max(
          0.65,
          Math.min(
            3,
            (g.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / (g.distance || 1),
          ),
        );
        setZoom(z);
        const scale =
          1000 / (svg.current?.getBoundingClientRect().width || 1000);
        const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        setPan({
          x: g.pan.x + (c.x - g.center.x) * scale,
          y: g.pan.y + (c.y - g.center.y) * scale,
        });
        return;
      }
      const p = getPoint(e);
      if (drag.current) {
        const original = drag.current.before.marks.find(
          (m) => m.id === drag.current?.id,
        );
        if (original) setDraft(translatedMark(original, drag.current.start, p));
        return;
      }
      setDraft((current) =>
        current
          ? {
              ...current,
              points:
                current.tool === "pen"
                  ? [...current.points.slice(-4999), p]
                  : [current.points[0], p],
            }
          : null,
      );
    };
    const end = (e: PointerEvent<SVGSVGElement>) => {
      const hadGesture = !!gesture.current;
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) gesture.current = null;
      if (hadGesture) {
        setDraft(null);
        drag.current = null;
        return;
      }
      if (drag.current) {
        const { id, before, start: origin } = drag.current;
        const p = getPoint(e);
        onChange({
          ...before,
          marks: before.marks.map((m) =>
            m.id === id ? translatedMark(m, origin, p) : m,
          ),
        });
        drag.current = null;
        setDraft(null);
        return;
      }
      if (draft) {
        if (draft.points.length > 1)
          onChange({ ...doc, marks: [...doc.marks, draft] });
        setDraft(null);
      }
    };
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(Math.max(0.65, Math.min(3, zoom - e.deltaY * 0.005)));
      }
    };
    const smoke = doc.marks
      .filter((m) => m.tool === "smoke" && m.time <= time)
      .map((m) => m.points.at(-1)!);
    const vision = (p: Point) => {
      const angle = Math.atan2(320 - p.y, 500 - p.x),
        edge: Point[] = [];
      for (let i = 0; i <= 16; i++) {
        const theta = angle - Math.PI / 5 + (i * Math.PI) / 40;
        let ray = {
          x: p.x + Math.cos(theta) * 145,
          y: p.y + Math.sin(theta) * 145,
        };
        for (let d = 5; d <= 145; d += 5) {
          const candidate = {
            x: p.x + Math.cos(theta) * d,
            y: p.y + Math.sin(theta) * d,
          };
          if (smoke.some((s) => visionBlocked(p, s, candidate))) {
            ray = candidate;
            break;
          }
        }
        edge.push(ray);
      }
      return `M ${p.x} ${p.y} ${edge.map((q) => `L ${q.x} ${q.y}`).join(" ")} Z`;
    };
    return (
      <svg
        ref={(node) => {
          svg.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 640"
        className={`tactical-svg ${overlay ? "is-overlay" : ""}`}
        role="img"
        aria-label={`${doc.map} — ${t("canvas")}`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => {
          setDraft(null);
          drag.current = null;
          pointers.current.clear();
          gesture.current = null;
        }}
        onWheel={wheel}
      >
        <defs>
          {["#00f0ff", "#ff2e63", "#00ff88", "#ffb800", "#b28bff"].map((c) => (
            <marker
              key={c}
              id={"arrow-" + c.slice(1)}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M 0 0 L 7 3 L 0 6 Z" fill={c} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {!overlay && <BattleMap doc={doc} time={time} t={t} />}
          {!overlay && doc.layers.vision && (
            <g
              fill="#00f0ff0b"
              stroke="#00f0ff22"
              strokeWidth=".6"
              pointerEvents="none"
            >
              {doc.marks
                .filter((m) => m.tool === "player")
                .map((m) => (
                  <path key={m.id} d={vision(m.points[0])} />
                ))}
            </g>
          )}
          {doc.marks
            .filter((m) => !overlay || m.time <= time)
            .filter((mark) => !drag.current || mark.id !== drag.current.id)
            .map((mark) => (
              <MarkShape
                key={mark.id}
                mark={playing ? playbackMark(mark, doc, time) : mark}
                time={time}
                playing={playing}
                select={tool === "select"}
              />
            ))}
          {draft && <MarkShape mark={draft} time={time} playing={false} />}
        </g>
      </svg>
    );
  },
);
export default TacticalBoard;
