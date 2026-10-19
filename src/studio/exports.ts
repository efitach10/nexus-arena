import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { pointOnCurve, playbackMark } from "./model";
import type { BoardDoc } from "./model";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function raster(
  svg: SVGSVGElement,
  width: number,
  height: number,
  doc?: BoardDoc,
  time?: number,
) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height));
  copy.querySelector(":scope > g")?.removeAttribute("transform");
  if (doc && time !== undefined) {
    for (const group of copy.querySelectorAll<SVGElement>("[data-mark]")) {
      const mark = doc.marks.find((m) => m.id === group.dataset.mark);
      if (!mark) continue;
      group.setAttribute("opacity", time < mark.time ? "0" : "1");
      if (mark.tool === "player") {
        const next = playbackMark(mark, doc, time);
        const circle = group.querySelector("circle");
        const x = Number(circle?.getAttribute("cx")),
          y = Number(circle?.getAttribute("cy"));
        group.setAttribute(
          "transform",
          `translate(${next.points[0].x - x} ${next.points[0].y - y})`,
        );
      }

      if (mark.points.length > 1 && mark.tool !== "pen") {
        const progress = Math.max(0, Math.min(1, (time - mark.time) / 6));
        const point = pointOnCurve(
          mark.points[0],
          mark.points.at(-1)!,
          progress,
        );
        const dot = group.querySelector(".trajectory-dot");
        dot?.setAttribute("cx", String(point.x));
        dot?.setAttribute("cy", String(point.y));
        group
          .querySelector("[data-impact]")
          ?.setAttribute("opacity", progress === 1 ? "1" : "0");
      }
    }
  }
  const blob = new Blob([new XMLSerializer().serializeToString(copy)], {
      type: "image/svg+xml;charset=utf-8",
    }),
    url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw Error("Canvas unavailable");
    ctx.fillStyle = "#0b141c";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return { canvas, ctx };
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function exportPng(svg: SVGSVGElement, name: string) {
  const { canvas } = await raster(svg, 3840, 2458);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error("PNG unavailable"))),
      "image/png",
    ),
  );
  download(blob, `${name}.png`);
}
export async function exportGif(svg: SVGSVGElement, doc: BoardDoc) {
  const gif = GIFEncoder();
  for (let i = 0; i < 24; i++) {
    const { ctx } = await raster(svg, 800, 512, doc, (i / 23) * doc.duration);
    const rgba = ctx.getImageData(0, 0, 800, 512).data,
      palette = quantize(rgba, 128),
      index = applyPalette(rgba, palette);
    gif.writeFrame(index, 800, 512, { palette, delay: 250, repeat: 0 });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  gif.finish();
  download(
    new Blob([new Uint8Array(gif.bytes())], { type: "image/gif" }),
    `${doc.name}.gif`,
  );
}
