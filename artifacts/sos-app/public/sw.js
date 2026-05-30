const VERSION = "brgy-sos-v1";
const APP_SHELL_CACHE = `${VERSION}-app-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const TILE_CACHE = `${VERSION}-tiles`;
const FONT_CACHE = `${VERSION}-fonts`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  // FIX: use endsWith instead of includes to prevent subdomain spoofing
  return (
    url.origin.endsWith("fonts.googleapis.com") ||
    url.origin.endsWith("fonts.gstatic.com")
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

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

// ---------------------------------------------------------------------------
// Caching strategies
// ---------------------------------------------------------------------------

// FIX: wrapped fetch in try/catch so a network failure returns a safe fallback
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response?.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

// FIX: networkPromise was a Promise (always truthy), not awaited properly.
// Now: return cache immediately if available (fire-and-forget revalidation),
// otherwise await the network.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response?.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    // Background revalidation — don't await
    networkPromise;
    return cached;
  }

  return (await networkPromise) ?? Response.error();
}

// Serve the cached shell index for navigation requests (SPA routing).
// Falls back to a minimal offline page if the shell isn't cached yet.
async function handleNavigation() {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached = await cache.match(resolveAppUrl("index.html"));
  if (cached) return cached;

  // Minimal offline fallback — kept inline so no extra file is needed
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Brgy SOS — Offline</title>
    <style>
      body { font-family: sans-serif; display: flex; flex-direction: column;
             align-items: center; justify-content: center; min-height: 100vh;
             margin: 0; background: #f5f5f5; color: #333; text-align: center; }
      h1 { color: #c0392b; }
    </style>
  </head>
  <body>
    <h1>⚠️ You are offline</h1>
    <p>Please check your internet connection and try again.</p>
  </body>
</html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}

// ---------------------------------------------------------------------------
// Lifecycle events
// ---------------------------------------------------------------------------

self.addEventListener("install", (event) => {
  // FIX: skipWaiting moved INSIDE waitUntil so the SW only activates
  // after the app shell is fully cached, preventing a race condition.
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
      await self.skipWaiting();
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

// ---------------------------------------------------------------------------
// Fetch routing
// ---------------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests — let them pass through untouched
  if (request.method !== "GET") return;

  // API calls: always network-only (never cache sensitive data)
  if (isApiRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Google Fonts: cache-first (rarely changes, cross-origin)
  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // Map tiles: cache-first (static tiles, large volume)
  if (isMapTileRequest(url)) {
    event.respondWith(cacheFirst(request, TILE_CACHE));
    return;
  }

  // Static assets (JS, CSS, images, workers): stale-while-revalidate
  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Navigation requests: serve app shell for SPA client-side routing
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation());
    return;
  }

  // Default: stale-while-revalidate for anything else same-origin
  if (isSameOrigin(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
