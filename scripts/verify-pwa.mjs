import { readFile, access } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
const html = await readFile("dist/index.html", "utf8");
const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
const origin = "https://example.github.io";
const scriptPath =
  html.match(/src="([^\"]+\/assets\/[^\"]+\.js)"/)?.[1] ||
  html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
assert.ok(scriptPath, "Built JS asset must be present");
const app = scriptPath.slice(0, scriptPath.indexOf("assets/"));
const root = new URL(app, origin);
const filePath = (url) => {
  const pathname = new URL(url, root).pathname;
  assert.ok(pathname.startsWith(app));
  const relative = pathname.slice(app.length);
  return "dist/" + (relative || "index.html");
};
assert.equal(manifest.display, "standalone");
for (const key of ["id", "scope", "start_url"])
  assert.equal(new URL(manifest[key], root).pathname, app);
for (const icon of manifest.icons) {
  const file = filePath(icon.src);
  await access(file);
  const data = await readFile(file);
  assert.equal(data.readUInt32BE(16), Number(icon.sizes.split("x")[0]));
}
for (const match of html.matchAll(/href="([^\"]+)"/g)) {
  if (!match[1].startsWith("http")) await access(filePath(match[1]));
}
const handlers = {},
  cached = new Map(),
  deleted = [];
let cacheName = "";
const cache = {
  addAll: async (urls) => {
    for (const url of urls) {
      cached.set(
        new URL(url, root).pathname,
        new Response(await readFile(filePath(url))),
      );
    }
  },
  match: async (key) =>
    cached.get(new URL(typeof key === "string" ? key : key.url, root).pathname),
};
const caches = {
  open: async (name) => {
    cacheName = name;
    return cache;
  },
  keys: async () => [
    cacheName,
    `nexus-arena:${app}:obsolete`,
    "nexus-arena:/other-project/:keep",
    "unrelated-cache",
  ],
  delete: async (key) => {
    deleted.push(key);
    return true;
  },
};
let network = true;
const fetchMock = async (request) => {
  if (!network) throw Error("offline");
  return new Response(
    await readFile(
      filePath(typeof request === "string" ? request : request.url),
    ),
  );
};
runInNewContext(await readFile("dist/sw.js", "utf8"), {
  self: {
    addEventListener: (name, fn) => (handlers[name] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
    location: { origin, href: new URL("sw.js", root).href },
  },
  caches,
  fetch: fetchMock,
  URL,
  Set,
});
let pending;
handlers.install({ waitUntil: (p) => (pending = p) });
await pending;
handlers.activate({ waitUntil: (p) => (pending = p) });
await pending;
assert.ok([...cached.keys()].some((k) => k.endsWith(".js")));
assert.ok([...cached.keys()].some((k) => k.endsWith(".css")));
assert.match(cacheName, /nexus-arena-[a-f0-9]{12}$/);
assert.deepEqual(deleted, [`nexus-arena:${app}:obsolete`]);
network = false;
let response;
handlers.fetch({
  request: { url: root.href, method: "GET", mode: "navigate" },
  respondWith: (p) => (response = p),
});
assert.equal(await (await response).text(), html);
const asset = [...cached.keys()].find((k) => k.endsWith(".js"));
handlers.fetch({
  request: { url: origin + asset, method: "GET", mode: "cors" },
  respondWith: (p) => (response = p),
});
assert.ok(await response);
let intercepted = false;
handlers.fetch({
  request: { url: origin + "/other-project/", method: "GET", mode: "navigate" },
  respondWith: () => (intercepted = true),
});
if (app !== "/") assert.equal(intercepted, false);
console.log(
  `PASS (${app}): manifest URLs, PNG icons, precached assets, offline navigation, scoped cache cleanup and isolation.`,
);
