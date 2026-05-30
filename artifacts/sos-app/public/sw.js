const VERSION = "brgy-sos-v1";
const APP_SHELL_CACHE = `${VERSION}-app-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const TILE_CACHE = `${VERSION}-tiles`;
const FONT_CACHE = `${VERSION}-fonts`;

function getScopeUrl() {
  return new URL(self.registration.scope);
}

function resolveAppUrl(path = "") {
  return new URL(path, getScopeUrl()).toString();
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isApiRequest(url) {
  return isSameOrigin(url) && url.pathname.includes("/api/");
}

function isFontRequest(url) {
  return (
    url.origin.includes("fonts.googleapis.com") ||
    url.origin.includes("fonts.gstatic.com")
  );
}

function isMapTileRequest(url) {
  return /(^|\.)basemaps\.cartocdn\.com$/i.test(url.hostname);
}

function isStaticAsset(request) {
  return ["script", "style", "image", "font", "worker"].includes(
    request.destination,
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return cached || networkPromise || Response.error();
}

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll([
        resolveAppUrl("./"),
        resolveAppUrl("index.html"),
        resolveAppUrl("manifest.webmanifest"),
        resolveAppUrl("favicon.svg"),
        resolveAppUrl("pwa-icon.svg"),
      ]);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (isApiRequest(url)) {
    event.respondWith(fetch(request));
    return;
