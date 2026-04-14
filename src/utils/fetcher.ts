import newsFallback from '../data/news.json';
import recapsFallback from '../data/recaps.json';
import agendaFallback from '../data/agenda.json';
import galerieFallback from '../data/galerie.json';

/**
 * Robust fetcher that returns static fallback data if the API fails or returns empty.
 */
export async function fetchWithFallback(url: string) {
    try {
        const res = await fetch(url);
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

    // Fallback logic
    if (url.includes('/api/news')) return newsFallback;
    if (url.includes('/api/recaps')) return recapsFallback;
    if (url.includes('/api/agenda')) return agendaFallback;
    if (url.includes('/api/galerie')) return galerieFallback;
    
    return null;
}
