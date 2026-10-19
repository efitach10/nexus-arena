const CACHE = "nexus-arena-v1";
const ROOT = new URL("./", self.location.href);
const APP = ROOT.pathname;
const CACHE_PREFIX = `nexus-arena:${APP}:`;
const CACHE_KEY = CACHE_PREFIX + CACHE;
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_KEY);
      const response = await fetch(APP, { cache: "reload" });
      if (!response.ok) throw new Error("App shell unavailable");
      const html = await response.text();
      const assets = [...html.matchAll(/(?:src|href)="([^\"]+)"/g)]
        .map((match) => new URL(match[1], ROOT))
        .filter(
          (url) =>
            url.origin === ROOT.origin &&
            url.pathname.startsWith(APP + "assets/"),
        )
        .map((url) => url.pathname);
      await cache.addAll([
        APP,
        ...["manifest.json", "icon-192.png", "icon-512.png"].map(
          (path) => new URL(path, ROOT).pathname,
        ),
        ...new Set(assets),
      ]);
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(CACHE_PREFIX) && key !== CACHE_KEY)
          await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(APP)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open(CACHE_KEY).then((cache) => cache.match(APP)),
      ),
    );
    return;
  }
  event.respondWith(
    caches
      .open(CACHE_KEY)
      .then((cache) => cache.match(event.request))
      .then((cached) => cached || fetch(event.request)),
  );
});
