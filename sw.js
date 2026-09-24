/* Service worker : garde l'app en cache pour qu'elle marche hors connexion.
   La page est toujours redemandée au serveur quand il y a du réseau, sans passer
   par le cache HTTP du navigateur (GitHub Pages le garde 10 min) : une nouvelle
   version en ligne est prise dès la réouverture. Changer VERSION à chaque
   mise en ligne de ce fichier, des icônes ou du manifeste. */
const VERSION = "metronome-v2";
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
    caches.open(VERSION)
      /* "reload" : fichiers pris sur le serveur, pas dans le cache du navigateur */
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
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

  /* la page : serveur d'abord (toujours à jour), cache si hors connexion.
     "no-cache" : le navigateur revérifie auprès du serveur au lieu de
     resservir sa copie (vérification légère si rien n'a changé). */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
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
