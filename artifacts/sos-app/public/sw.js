const VERSION = "brgy-sos-v1";
const APP_SHELL_CACHE = `${VERSION}-app-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const TILE_CACHE = `${VERSION}-tiles`;
const FONT_CACHE = `${VERSION}-fonts`;

// ---------------------------------------------------------------------------
// URL helpers
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
  // FIX: use endsWith instead of includes — prevents evil-fonts.googleapis.com.attacker.com bypass
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

// FIX: wrapped fetch in try/catch — a network failure no longer throws an
// unhandled rejection. Returns Response.error() as a safe fallback.
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

// FIX: `cached || networkPromise || Response.error()` was broken because
// networkPromise is a Promise (always truthy) so Response.error() was
// unreachable and the caller would receive a Promise instead of a Response.
// Now: return the cache hit immediately and let the network update run in the
// background; if there is no cache hit, await the network result.
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
    networkPromise; // fire-and-forget background revalidation
    return cached;
  }

  return (await networkPromise) ?? Response.error();
}

// Serve the cached SPA shell for all navigation requests (client-side routing).
// Falls back to an inline offline page when the shell is not yet cached.
async function handleNavigation() {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached =
    (await cache.match(resolveAppUrl("index.html"))) ||
    (await cache.match(resolveAppUrl("./")));

  if (cached) return cached;

  // Inline offline fallback — no extra file required in /public
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Brgy SOS — Offline</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:monospace;display:flex;flex-direction:column;
           align-items:center;justify-content:center;min-height:100vh;
           background:#040B1A;color:#fff;text-align:center;gap:12px}
      h1{color:#FF3B5C;font-size:1.4rem;letter-spacing:.1em}
      p{color:rgba(255,255,255,.4);font-size:.8rem}
    </style>
  </head>
  <body>
    <h1>⚠ OFFLINE</h1>
    <p>No network connection.<br>Please reconnect and refresh.</p>
  </body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

// ---------------------------------------------------------------------------
// Install — FIX: skipWaiting() moved INSIDE waitUntil so the SW only
// activates after the app shell is fully cached, eliminating the race
// condition where the SW could start intercepting fetches before the shell
// was available.
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
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
      // Only skip waiting after the shell is ready
      await self.skipWaiting();
    })(),
  );
});

// ---------------------------------------------------------------------------
// Activate — clean up old versioned caches
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Message — allow the app to trigger an immediate SW swap
// ---------------------------------------------------------------------------
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

  // Ignore non-GET — let POST/PATCH/DELETE pass through untouched
  if (request.method !== "GET") return;

  // 1. API calls — always network-only; never cache auth/user/alert data
  if (isApiRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Google Fonts — cache-first (cross-origin, immutable after first load)
  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // 3. CartoDB map tiles — cache-first (static raster tiles, high volume)
  if (isMapTileRequest(url)) {
    event.respondWith(cacheFirst(request, TILE_CACHE));
    return;
  }

  // 4. Static assets (JS bundles, CSS, images, web workers)
  //    stale-while-revalidate: instant response + background update
  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // 5. Navigation (page loads / SPA route changes) — serve the app shell
  //    so Wouter can handle client-side routing without a 404
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation());
    return;
  }

  // 6. Everything else same-origin (e.g. webmanifest, misc XHR)
  if (isSameOrigin(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
  // Cross-origin requests not matched above fall through to the network
});
