import defaultNews from '../data/news.json';
import defaultRecaps from '../data/recaps.json';
import defaultAgenda from '../data/agenda.json';
import defaultGalerie from '../data/galerie.json';

// Cache localStorage persistant pour affichage instantané (0ms - Stale-While-Revalidate)
const LS_PREFIX = 'dropsiders_cache_';
const LS_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 jours (la donnée périmée est affichée immédiatement, puis rafraîchie en tâche de fond)

export function lsGet(key: string): any | null {
    try {
        const raw = localStorage.getItem(LS_PREFIX + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > LS_MAX_AGE) return null;
        return data;
    } catch {
        return null;
    }
}

export function lsSet(key: string, data: any) {
    try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
        // localStorage plein ou indisponible → on ignore
    }
}

function urlKey(url: string): string {
    try { return new URL(url, location.origin).pathname; } catch { return url; }
}

/**
 * Données initiales synchrones garanties en 0ms (Cache LocalStorage prioritaire, sinon bundle JSON)
 * Permet à React d'afficher les articles dès le frame 0 sans AUCUN spinner ni squelette !
 */
export function getInitialNews(): any[] {
    const cached = lsGet('/api/news');
    if (Array.isArray(cached) && cached.length > 0) return cached;
    return defaultNews as any[];
}

export function getInitialRecaps(): any[] {
    const cached = lsGet('/api/recaps');
    if (Array.isArray(cached) && cached.length > 0) return cached;
    return defaultRecaps as any[];
}

export function getInitialAgenda(): any[] {
    const cached = lsGet('/api/agenda');
    if (Array.isArray(cached) && cached.length > 0) return cached;
    return defaultAgenda as any[];
}

export function getInitialGalerie(): any[] {
    const cached = lsGet('/api/galerie');
    if (Array.isArray(cached) && cached.length > 0) return cached;
    return defaultGalerie as any[];
}

/**
 * Fetcher Stale-While-Revalidate universel :
 * 1. Retourne instantanément (0ms) les données en cache ou du bundle local
 * 2. Déclenche la vérification réseau en arrière-plan sans bloquer l'UI
 * 3. Appelle onUpdate() de manière transparente si de nouveaux articles sont détectés
 */
export async function fetchWithFallback(
    url: string,
    options: RequestInit = {},
    onUpdate?: (data: any) => void
): Promise<any> {
    const key = urlKey(url);
    const cached = lsGet(key);

    // Données locales de secours instantanées
    const fallbackData = 
        url.includes('/api/news') ? defaultNews :
        url.includes('/api/recaps') ? defaultRecaps :
        url.includes('/api/agenda') ? defaultAgenda :
        url.includes('/api/galerie') ? defaultGalerie : null;

    const instantData = cached || fallbackData;

    // Lance le rafraîchissement réseau en fond
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
            console.warn(`[fetchWithFallback] Background revalidation failed for ${url}:`, e);
        }
        return null;
    })();

    if (instantData) {
        // Affichage immédiat (0ms), revalidation silencieuse en arrière-plan
        networkPromise.then((fresh) => {
            if (fresh && onUpdate) {
                const freshStr = JSON.stringify(fresh).slice(0, 500);
                const localStr = JSON.stringify(instantData).slice(0, 500);
                if (freshStr !== localStr) {
                    onUpdate(fresh);
                }
            }
        });
        return instantData;
    }

    // Si vraiment aucune donnée locale disponible, on attend le réseau
    const fresh = await networkPromise;
    if (fresh) return fresh;

    return fallbackData;
}
