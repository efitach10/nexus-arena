import type { BoardDoc } from "./model";
import type { Translator } from "./text";
const layouts: Record<string, number[][]> = {
  Mirage: [
    [180, 140, 160, 105],
    [410, 100, 130, 80],
    [590, 110, 170, 95],
    [710, 260, 110, 140],
    [440, 260, 105, 110],
    [180, 340, 150, 100],
    [480, 450, 110, 100],
    [640, 470, 180, 80],
    [350, 180, 75, 100],
  ],
  Inferno: [
    [180, 120, 220, 90],
    [470, 100, 100, 160],
    [650, 120, 170, 100],
    [710, 300, 120, 170],
    [510, 350, 120, 130],
    [330, 260, 100, 140],
    [170, 420, 170, 80],
    [370, 490, 130, 70],
    [610, 490, 100, 70],
  ],
  Nuke: [
    [170, 130, 180, 140],
    [440, 100, 200, 100],
    [700, 130, 120, 130],
    [390, 280, 240, 160],
    [180, 360, 140, 150],
    [700, 350, 130, 160],
    [440, 500, 160, 60],
    [370, 150, 45, 80],
  ],
  Anubis: [
    [160, 110, 200, 130],
    [450, 110, 110, 100],
    [660, 110, 180, 130],
    [190, 340, 120, 160],
    [410, 320, 130, 130],
    [660, 340, 170, 100],
    [440, 500, 140, 65],
    [690, 500, 130, 60],
  ],
  Ancient: [
    [170, 120, 170, 130],
    [400, 100, 130, 100],
    [650, 130, 170, 160],
    [180, 350, 160, 150],
    [430, 280, 110, 140],
    [650, 400, 160, 130],
    [380, 500, 160, 60],
    [550, 140, 50, 100],
  ],
  "Dust II": [
    [150, 120, 200, 95],
    [430, 105, 140, 90],
    [670, 110, 180, 130],
    [190, 330, 110, 180],
    [400, 280, 160, 80],
    [630, 310, 210, 100],
    [430, 450, 110, 100],
    [650, 480, 170, 70],
  ],
};
export default function BattleMap({
  doc,
  time,
  t,
}: {
  doc: BoardDoc;
  time: number;
  t: Translator;
}) {
  const { game, layers } = doc;
  return (
    <g className="battle-map">
      <defs>
        <pattern
          id="map-grid"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="#456171"
            strokeWidth=".6"
            opacity=".32"
          />
        </pattern>
        <pattern
          id="map-texture"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 0 8 L 8 0" stroke="#ffffff" opacity=".018" />
        </pattern>
        <radialGradient id="map-glow">
          <stop
            stopColor={
              game === "mlbb"
                ? "#215b4b"
                : game === "ow2"
                  ? "#49402d"
                  : "#264b57"
            }
            stopOpacity=".35"
          />
          <stop offset="1" stopColor="#0b151e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="danger-glow">
          <stop stopColor="#ff2e63" stopOpacity=".65" />
          <stop offset="1" stopColor="#ff2e63" stopOpacity="0" />
        </radialGradient>
        <filter id="map-shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="4" floodOpacity=".5" />
        </filter>
      </defs>
      <rect width="1000" height="640" fill="#0b141c" />
      <rect width="1000" height="640" fill="url(#map-texture)" />
      <ellipse cx="500" cy="320" rx="440" ry="310" fill="url(#map-glow)" />
      <path
        d="M 110 100 H 860 L 910 150 V 530 L 860 580 H 130 L 90 540 V 150 Z"
        stroke="#425662"
        strokeWidth="2"
        fill="#14252c"
      />
      {game === "cs2" && (
        <>
          <path
            d="M 170 540 L 350 430 L 370 310 L 550 220 L 800 100 M 210 110 L 410 230 L 540 400 L 800 550"
            fill="none"
            stroke="#344345"
            strokeWidth="55"
            opacity=".55"
          />
          {(layouts[doc.map] || layouts.Mirage).map(([x, y, w, h], i) => (
            <g key={i} filter="url(#map-shadow)">
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="3"
                fill={
                  doc.map === "Ancient"
                    ? "#31433e"
                    : doc.map === "Nuke"
                      ? "#34434f"
                      : "#394347"
                }
                stroke="#5b6a6c"
                strokeWidth="2"
              />
              <path
                d={`M ${x + 7} ${y + h - 7} V ${y + 7} H ${x + w - 7}`}
                fill="none"
                stroke="#92a0a0"
                opacity=".2"
              />
              <rect
                x={x + 12}
                y={y + 12}
                width={Math.max(12, w - 24)}
                height="6"
                fill="#111f26"
                opacity=".4"
              />
              {w > 150 && (
                <path
                  d={`M ${x + w / 2} ${y + 15} V ${y + h - 15}`}
                  stroke="#131f24"
                  strokeWidth="3"
                />
              )}
            </g>
          ))}
          <g fill="#53605b" stroke="#85907a" strokeWidth="1">
            {[
              [590, 260],
              [630, 260],
              [590, 300],
              [370, 400],
              [400, 430],
              [770, 450],
            ].map(([x, y], i) => (
              <g key={i}>
                <rect x={x} y={y} width="27" height="27" />
                <path d={`M ${x} ${y} l 27 27 m 0 -27 l -27 27`} />
              </g>
            ))}
          </g>
          <g fontFamily="Arial" fontWeight="bold" textAnchor="middle">
            <circle
              cx="650"
              cy="220"
              r="68"
              fill="#ffb80009"
              stroke="#ffb80066"
              strokeDasharray="5 6"
            />
            <text x="650" y="236" fill="#ffbf50" fontSize="43" opacity=".7">
              A
            </text>
            <circle
              cx="275"
              cy="290"
              r="58"
              fill="#00f0ff09"
              stroke="#00f0ff55"
              strokeDasharray="5 6"
            />
            <text x="275" y="305" fill="#57d7e5" fontSize="36" opacity=".65">
              B
            </text>
            <text x="490" y="240" fill="#9aafb5" fontSize="12">
              {t("mid").toUpperCase()}
            </text>
            <text x="270" y="575" fill="#b3b58e" fontSize="12">
              T · {t("spawn")}
            </text>
            <text x="760" y="90" fill="#80bbc9" fontSize="12">
              CT · {t("spawn")}
            </text>
          </g>
        </>
      )}
      {game === "mlbb" && (
        <>
          <path
            d="M 170 510 L 170 130 L 820 130 L 820 510 Z"
            fill="#152c29"
            stroke="#4d7b6d"
            strokeWidth="28"
          />
          <path d="M 170 510 L 820 130" stroke="#507968" strokeWidth="31" />
          <path
            d="M 230 100 Q 440 250 400 340 T 830 540"
            fill="none"
            stroke="#163f52"
            strokeWidth="75"
          />
          <path
            d="M 230 100 Q 440 250 400 340 T 830 540"
            fill="none"
            stroke="#386c7c"
            strokeWidth="2"
            strokeDasharray="10 14"
            opacity=".5"
          />
          {[
            [270, 230],
            [330, 410],
            [590, 230],
            [650, 410],
            [260, 330],
            [720, 300],
          ].map(([x, y], i) => (
            <g key={i}>
              <path
                d={`M ${x - 45} ${y + 35} l 12 -65 l 65 5 l 20 45 l -55 30 Z`}
                fill="#29463b"
                stroke="#47674d"
                strokeWidth="2"
              />
              {layers.jungle && (
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="#f7bc4d15"
                    stroke="#d5b961"
                  />
                  <path
                    d={`M ${x - 6} ${y + 4} L ${x} ${y - 7} L ${x + 6} ${y + 4} Z`}
                    fill="#d5b961"
                  />
                </>
              )}
            </g>
          ))}
          {layers.bushes &&
            [
              [340, 220],
              [430, 390],
              [530, 250],
              [620, 450],
              [285, 440],
              [700, 200],
            ].map(([x, y], i) => (
              <g key={i} fill="#3e7054" stroke="#659973" strokeWidth="1">
                <ellipse cx={x} cy={y} rx="35" ry="15" />
                {[-20, 0, 20].map((dx) => (
                  <path
                    key={dx}
                    d={`M ${x + dx} ${y + 5} l -6 -17 l 10 6 l 5 -10 l 4 20 Z`}
                  />
                ))}
              </g>
            ))}
          {[
            [170, 410],
            [170, 290],
            [300, 130],
            [500, 130],
            [680, 130],
            [820, 230],
            [820, 350],
            [700, 510],
            [500, 510],
            [310, 510],
            [350, 390],
            [630, 250],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="12"
                fill={i < 6 ? "#00dce0" : "#ff6478"}
                stroke="#b0e5df"
                strokeWidth="2"
              />
              {layers.turrets && (
                <circle
                  cx={x}
                  cy={y}
                  r="44"
                  fill={i < 6 ? "#00f0ff08" : "#ff2e6308"}
                  stroke={i < 6 ? "#00f0ff26" : "#ff2e6326"}
                  strokeDasharray="3 5"
                />
              )}
            </g>
          ))}
          <path
            d="M 130 480 L 205 480 L 205 550 L 130 550 Z"
            fill="#00f0ff33"
            stroke="#00f0ff"
          />
          <path
            d="M 785 95 L 855 95 L 855 165 L 785 165 Z"
            fill="#ff2e6333"
            stroke="#ff2e63"
          />
          {layers.objectives && (
            <g>
              <circle
                cx="350"
                cy="315"
                r="34"
                fill="#00d4df13"
                stroke="#00d4df77"
              />
              <circle
                cx="620"
                cy="355"
                r="38"
                fill="#b28bff22"
                stroke="#b28bff88"
              />
              <text
                x="350"
                y="320"
                fill="#7ddcda"
                textAnchor="middle"
                fontSize="11"
              >
                {t("turtle")}
              </text>
              <text
                x="620"
                y="360"
                fill="#c1a0fa"
                textAnchor="middle"
                fontSize="11"
              >
                {t("lord")}
              </text>
              <text
                x="500"
                y="90"
                fill="#9bbba8"
                textAnchor="middle"
                fontSize="12"
              >
                {t(time < 120 ? "turtle" : "lord")} ·{" "}
                {Math.max(0, (time < 120 ? 120 : 480) - time).toFixed(0)}s
              </text>
            </g>
          )}
          <g fill="#9abbab" fontSize="12">
            <text x="200" y="100">
              {t("top")}
            </text>
            <text x="490" y="310">
              {t("mid")}
            </text>
            <text x="770" y="560">
              {t("bottom")}
            </text>
          </g>
        </>
      )}
      {game === "ow2" && (
        <>
          <path
            d={
              doc.map === "Circuit Royal"
                ? "M 150 520 H 500 V 350 H 780 V 130"
                : doc.map === "Flashpoint"
                  ? "M 170 500 L 420 200 L 700 400 L 820 150"
                  : "M 150 520 H 400 V 330 H 620 V 150 H 830"
            }
            fill="none"
            stroke="#6c6752"
            strokeWidth="38"
          />
          <path
            d={
              doc.map === "Circuit Royal"
                ? "M 150 520 H 500 V 350 H 780 V 130"
                : "M 150 520 H 400 V 330 H 620 V 150 H 830"
            }
            fill="none"
            stroke="#e7bc6666"
            strokeWidth="2"
            strokeDasharray="8 10"
          />
          {[
            [180, 130, 180, 120],
            [430, 110, 120, 150],
            [700, 240, 140, 150],
            [200, 300, 110, 130],
            [430, 420, 210, 110],
            [680, 490, 130, 65],
          ].map(([x, y, w, h], i) => (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="#3c3d40"
                stroke="#656b70"
                strokeWidth="2"
              />
              {layers.highground && (
                <>
                  <rect
                    x={x + 6}
                    y={y + 6}
                    width={w - 12}
                    height="30"
                    fill="#ffb8001a"
                    stroke="#ffb80066"
                  />
                  <text
                    x={x + w / 2}
                    y={y + 26}
                    textAnchor="middle"
                    fill="#d7b766"
                    fontSize="9"
                  >
                    {t("high")} ↑
                  </text>
                </>
              )}
            </g>
          ))}
          {layers.sightlines && (
            <g
              stroke="#ff2e63"
              strokeWidth="2"
              strokeDasharray="8 8"
              opacity=".7"
            >
              <path d="M 520 140 L 330 520 M 760 260 L 380 380" />
              <circle cx="520" cy="140" r="8" fill="#ff2e63" />
              <circle cx="760" cy="260" r="8" fill="#ff2e63" />
            </g>
          )}
          <circle
            cx="400"
            cy="330"
            r="52"
            stroke="#ffb800"
            fill="#ffb80010"
            strokeDasharray="5 6"
          />
          <text
            x="400"
            y="335"
            textAnchor="middle"
            fill="#ffca66"
            fontSize="12"
          >
            {t("choke")}
          </text>
          <rect
            x="135"
            y="495"
            width="40"
            height="40"
            rx="6"
            fill="#00f0ff20"
            stroke="#00f0ff"
          />
          <circle cx="825" cy="150" r="27" fill="#ff2e6322" stroke="#ff2e63" />
          <text
            x="825"
            y="155"
            textAnchor="middle"
            fill="#ff8ea9"
            fontSize="15"
          >
            P
          </text>
        </>
      )}
      {layers.danger && (
        <g className="danger-zones">
          {[
            [430, 300],
            [650, 400],
            [350, 200],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={time < 120 ? 55 : 75}
              fill="url(#danger-glow)"
            />
          ))}
        </g>
      )}
      {layers.grid && (
        <>
          <rect width="1000" height="640" fill="url(#map-grid)" />
          {Array.from({ length: 10 }, (_, i) => (
            <g
              key={i}
              fill="#79939e"
              opacity=".7"
              fontSize="9"
              fontFamily="monospace"
            >
              <text x={i * 100 + 48} y="25">
                {String.fromCharCode(65 + i)}
              </text>
              <text x="18" y={i * 60 + 50}>
                {i + 1}
              </text>
            </g>
          ))}
        </>
      )}
      <g stroke="#3b5665" strokeWidth="1" opacity=".5">
        {[
          [45, 45],
          [955, 45],
          [45, 595],
          [955, 595],
        ].map(([x, y], i) => (
          <path key={i} d={`M ${x - 8} ${y} h 16 M ${x} ${y - 8} v 16`} />
        ))}
      </g>
      <text
        x="950"
        y="600"
        textAnchor="end"
        fill="#758b98"
        fontFamily="monospace"
        fontSize="9"
      >
        NEXUS // {doc.map.toUpperCase()} // {t("model")}
      </text>
    </g>
  );
}
