const CACHE_NAME = "streifen-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
  const isAppShell = event.request.mode === "navigate" || event.request.url.endsWith("index.html");

  if (isAppShell) {
    // Für die App-Seite selbst: immer zuerst das Netz probieren, damit Updates
    // sofort ankommen. Nur wenn offline, auf die zuletzt gespeicherte Version zurückfallen.
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

  // Für alles andere (Icons, Manifest): Cache zuerst, das ändert sich kaum.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
