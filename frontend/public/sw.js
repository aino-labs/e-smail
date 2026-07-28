importScripts("/precache-assets.js");

const CACHE_NAME = "app-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        APP_SHELL.map((url) => cache.add(new Request(url, { cache: "no-cache" }))),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/avatars/")) return;

  if (
    url.pathname.includes("hot-update") ||
    url.pathname.includes("webpack") ||
    url.pathname.includes("sockjs") ||
    url.port === "3000"
  ) {
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(req.url, {
            cache: "no-cache",
            credentials: "same-origin",
          });
          if (network.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put("/index.html", network.clone());
          }
          return network;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match("/index.html");
          return cached || new Response("Offline", { status: 503 });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const networkResponse = await fetch(req);
        const contentType = networkResponse.headers.get("content-type") || "";
        if (
          networkResponse.status === 200 &&
          !contentType.includes("text/html")
        ) {
          cache.put(req, networkResponse.clone());
        }
        return networkResponse;
      } catch (networkError) {
        const cached = await cache.match(req);
        if (cached) return cached;

        if (req.destination === "image") {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>',
            { headers: { "Content-Type": "image/svg+xml" } },
          );
        }
        return new Response("Resource not available offline", { status: 503 });
      }
    })(),
  );
});
