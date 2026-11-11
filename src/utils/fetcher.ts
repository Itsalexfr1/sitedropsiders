// Cache localStorage pour affichage instantané (stale-while-revalidate côté client)
const LS_PREFIX = 'dropsiders_cache_';
const LS_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function lsGet(key: string): any | null {
    try {
        const raw = localStorage.getItem(LS_PREFIX + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > LS_MAX_AGE) return null; // expiré
        return data;
    } catch {
        return null;
    }
}

function lsSet(key: string, data: any) {
    try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
        // localStorage plein ou indisponible → on ignore
    }
}

function urlKey(url: string): string {
    // Supprime le domaine, garde juste le chemin comme clé
    try { return new URL(url, location.origin).pathname; } catch { return url; }
}

/**
 * Fetcher stale-while-revalidate :
 * 1. Retourne immédiatement les données du cache localStorage si disponibles
 * 2. Lance le fetch réseau en parallèle
 * 3. Met à jour le cache et appelle onUpdate() si les données ont changé
 *
 * Pour un affichage instantané, passe un setter React en `onUpdate`.
 */
export async function fetchWithFallback(
    url: string,
    options: RequestInit = {},
    onUpdate?: (data: any) => void
): Promise<any> {
    const key = urlKey(url);
    const cached = lsGet(key);

    // Lance le fetch réseau immédiatement (en parallèle)
    const networkPromise = (async () => {
        try {
            const res = await fetch(url, options);
            if (res.ok) {
                const data = await res.json();
                const isValid =
                    (Array.isArray(data) && data.length > 0) ||
                    (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0);
                if (isValid) {
                    lsSet(key, data);
                    return data;
                }
            }
        } catch (e) {
            console.error(`Fetch failed for ${url}:`, e);
        }
        return null;
    })();

    if (cached) {
        // Données fraîches en cache → affichage instantané, mise à jour silencieuse en fond
        networkPromise.then((fresh) => {
            if (fresh && onUpdate) {
                // Compare sommaire pour éviter un re-render inutile
                const freshStr = JSON.stringify(fresh).slice(0, 500);
                const cachedStr = JSON.stringify(cached).slice(0, 500);
                if (freshStr !== cachedStr) onUpdate(fresh);
            }
        });
        return cached;
    }

    // Pas de cache → attend le réseau
    const fresh = await networkPromise;
    if (fresh) return fresh;

    // Réseau KO → fallback JSON lazy (hors bundle initial)
    try {
        if (url.includes('/api/news')) {
            const m = await import('../data/news.json');
            return m.default;
        }
        if (url.includes('/api/recaps')) {
            const m = await import('../data/recaps.json');
            return m.default;
        }
        if (url.includes('/api/agenda')) {
            const m = await import('../data/agenda.json');
            return m.default;
        }
        if (url.includes('/api/galerie')) {
            const m = await import('../data/galerie.json');
            return m.default;
        }
    } catch (fe) {
        console.error(`Fallback load failed for ${url}:`, fe);
    }

    return null;
}
