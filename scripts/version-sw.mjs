import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const html = await readFile("dist/index.html", "utf8");
const hash = createHash("sha256").update(html).digest("hex").slice(0, 12);
const sw = await readFile("dist/sw.js", "utf8");
await writeFile(
  "dist/sw.js",
  sw.replace(/nexus-arena-v1/g, `nexus-arena-${hash}`),
);
await writeFile("dist/.nojekyll", "");
console.log(`PWA cache version: ${hash}`);
