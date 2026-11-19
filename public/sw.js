const VERSION = "v5";
const ASSET_CACHE = `bunko-assets-${VERSION}`;
const PAGE_CACHE = `bunko-pages-${VERSION}`;
const CRITICAL_ASSETS = [
  "/manifest.webmanifest",
  "/favicon.png",
  "/icons/bunkoshelf-icon-any.png",
  "/icons/bunkoshelf-icon-maskable.png",
  "/logos/BunkoShelfPearl.svg",
];

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("bunko-pwa", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function offlinePage(url) {
  const match = url.pathname.match(/^\/offline\/volumes\/([^/]+)\/([^/]+)\/pages\/(-?\d+)$/);
  if (!match) return new Response("Invalid offline page", { status: 400 });
  const userId = decodeURIComponent(match[1]);
  const volumeId = decodeURIComponent(match[2]);
  const index = Number(match[3]);
  if (index < -1) return new Response("Offline page unavailable", { status: 404 });
  const db = await openDb();
  const tx = db.transaction("pages", "readonly");
  const page = await request(tx.objectStore("pages").get(`${userId}:${volumeId}:${index}`));
  db.close();
  if (!page?.blob) return new Response("Offline page unavailable", { status: 404 });
  return new Response(page.blob, { headers: { "Content-Type": page.blob.type || "application/octet-stream" } });
}

async function cacheFirst(event) {
  const { request } = event;
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
  return response;
}

async function navigation(event) {
  const { request } = event;
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
    return response;
  } catch {
    const locale = new URL(request.url).pathname.split("/")[1];
    const home = locale === "en" ? "/en" : "/es";
    const cached = (await cache.match(request)) || (await cache.match(home));
    if (cached) return cached;
    const bookPage = (await cache.keys()).find((entry) => {
      const path = new URL(entry.url).pathname;
      return path === `${home}/books` || path.startsWith(`${home}/books/`);
    });
    return (bookPage && await cache.match(bookPage)) || (await cache.match("/es")) || (await cache.match("/en")) || new Response("<!doctype html><title>Sin conexión</title><main>Sin conexión</main>", { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ASSET_CACHE).then((cache) => cache.addAll(CRITICAL_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => ![ASSET_CACHE, PAGE_CACHE].includes(key)).map((key) => caches.delete(key)))),
  ]));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  if (url.pathname.startsWith("/offline/volumes/")) {
    event.respondWith(offlinePage(url));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || event.request.destination === "font" || CRITICAL_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(event));
    return;
  }
  if (event.request.mode === "navigate") event.respondWith(navigation(event));
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};

  const title = payload.title || "Notificación";
  const options = {
    body: payload.body || "Tienes una notificación",
    icon: "/icons/bunkoshelf-icon-maskable.png",
    badge: "/icons/bunkoshelf-icon-maskable.png",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
