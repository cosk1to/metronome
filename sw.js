/* Service worker : garde l'app en cache pour qu'elle marche hors connexion.
   La page est toujours rechargée depuis le réseau quand il y en a un, donc une
   nouvelle version en ligne est prise tout de suite. Changer VERSION seulement
   si les icônes ou le manifeste changent. */
const VERSION = "metronome-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

/* supprime les caches des versions précédentes */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  /* la page : réseau d'abord (toujours à jour), cache si hors connexion */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put("./index.html", copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  /* icônes, manifeste : cache d'abord */
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
