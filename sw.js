const CACHE_NAME = "habits-cache-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  // cache: "reload" umgeht den Browser-Zwischenspeicher, damit ein neues Manifest
  // und neue Icons wirklich frisch vom Server geholt werden.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  // App-Seite und Manifest: immer zuerst das Netz probieren, damit Änderungen
  // (z. B. ein neuer App-Name) sofort ankommen. Nur offline greift der gespeicherte Stand.
  const isAppShell =
    event.request.mode === "navigate" ||
    url.endsWith("index.html") ||
    url.endsWith("manifest.json");

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Für alles andere (Icons): Cache zuerst, das ändert sich kaum.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
