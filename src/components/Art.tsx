export default function Art({
  variant = "orange",
  large = false,
}: {
  variant?: string;
  large?: boolean;
}) {
  return (
    <div
      className={`arena-art ${variant} ${large ? "large" : ""}`}
      aria-hidden="true"
    >
      <div className="art-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="monolith mono-one" />
      <div className="monolith mono-two" />
      <div className="monolith mono-three" />
      <div className="art-cross cross-one">+</div>
      <div className="art-cross cross-two">+</div>
      <div className="art-word">{variant === "violet" ? "DAWN" : "NEXUS"}</div>
      <div className="art-coordinates">
        32°05′ N / 34°46′ E<br />
        COMPETITIVE DIVISION // 04
      </div>
    </div>
  );
}
