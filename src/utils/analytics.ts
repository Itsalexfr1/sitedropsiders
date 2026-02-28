/**
 * Custom Analytics Tracker for Dropsiders
 * Tracks page views and interactions locally and sends to API
 */

export const trackPageView = (pageId: string, type: 'article' | 'recap' | 'page' | 'galerie' | 'agenda') => {
    try {
        // 1. Stockage local pour session (optionnel)
        const viewsKey = `dropsiders_views_${pageId}`;
        const currentViews = parseInt(localStorage.getItem(viewsKey) || '0');
        localStorage.setItem(viewsKey, (currentViews + 1).toString());

        // 2. Appel à l'API de tracking (simulation ou Cloudflare Function si configurée)
        // En mode Dev/Statique, on ne fait rien pour éviter les erreurs 404
        if (window.location.hostname !== 'localhost') {
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pageId, type, timestamp: new Date().toISOString() })
            }).catch(() => {
                // Silencieusement ignorer si l'API n'est pas encore déployée
            });
        }
    } catch (e: any) {
        console.warn('Analytics tracking failed', e);
    }
};
