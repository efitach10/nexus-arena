import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Arena from "./App";
import Studio from "./studio/Studio";
export default function Shell() {
  const [arena, setArena] = useState(location.hash === "#arena");
  return arena ? (
    <>
      <button
        className="arena-studio-return"
        onClick={() => {
          setArena(false);
          history.replaceState(null, "", location.pathname + location.search);
        }}
      >
        NEXUS STUDIO <ArrowLeft size={14} />
      </button>
      <Arena />
    </>
  ) : (
    <Studio
      onArena={() => {
        setArena(true);
        history.replaceState(null, "", "#arena");
        window.scrollTo(0, 0);
      }}
    />
  );
}
