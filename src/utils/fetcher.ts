/**
 * Robust fetcher that returns dynamic fallback data if the API fails or returns empty.
 * JSON fallbacks are loaded lazily (dynamic import) pour ne pas les bundler dans le chunk initial.
 */
export async function fetchWithFallback(url: string, options: RequestInit = {}) {
    try {
        const res = await fetch(url, options);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
            if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
                return data;
            }
        }
    } catch (e) {
        console.error(`Fetch failed for ${url}:`, e);
    }

    // Fallback chargé dynamiquement uniquement si l'API échoue (pas bundlé dans le chunk initial)
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
