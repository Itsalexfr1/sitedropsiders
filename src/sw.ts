/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// ── API CACHE : Stale-While-Revalidate ──────────────────────────────────────
// Les routes API sont servies depuis le cache instantanément,
// puis rafraîchies en arrière-plan à chaque requête.
const API_CACHE = 'dropsiders-api-v1';

// Routes API à cacher (stale-while-revalidate, max 5 min)
const API_PATTERNS = [
  '/api/news',
  '/api/recaps',
  '/api/agenda',
  '/api/galerie',
  '/api/interviews',
  '/api/settings',
  '/api/home-layout',
];

const MAX_AGE_SECONDS = 5 * 60; // 5 minutes

function isApiUrl(url: string): boolean {
  return API_PATTERNS.some(p => url.includes(p));
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isApiUrl(url.pathname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(request);

      // Lance la requête réseau en arrière-plan
      const networkFetch = fetch(request).then(async (response) => {
        if (response.ok) {
          // Ajoute un header de timestamp pour gérer l'expiration
          const headers = new Headers(response.headers);
          headers.set('sw-fetched-at', Date.now().toString());
          const clonedBody = await response.clone().arrayBuffer();
          const timestampedResponse = new Response(clonedBody, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
          await cache.put(request, timestampedResponse);
        }
        return response;
      }).catch(() => null);

      if (cached) {
        // Vérifie si le cache n'est pas trop vieux
        const fetchedAt = Number(cached.headers.get('sw-fetched-at') || 0);
        const age = (Date.now() - fetchedAt) / 1000;

        if (age < MAX_AGE_SECONDS) {
          // Cache frais → retourne immédiatement, revalide en fond
          networkFetch; // fire and forget
          return cached;
        }
        // Cache périmé → attend le réseau, retourne le cache si le réseau échoue
        const fresh = await networkFetch;
        return fresh || cached;
      }

      // Pas de cache → attend le réseau
      const fresh = await networkFetch;
      return fresh || new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    })()
  );
});
