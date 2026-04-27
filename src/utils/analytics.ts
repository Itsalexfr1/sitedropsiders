/**
 * Custom Analytics Tracker for Dropsiders
 * Tracks page views and interactions locally and sends to API
 */

export const trackPageView = (pageId: string, type: 'article' | 'recap' | 'page' | 'galerie' | 'agenda') => {
    try {
        // 1. Session Management
        let sessionId = sessionStorage.getItem('dropsiders_session_id');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('dropsiders_session_id', sessionId);
        }

        // 2. Call API
        if (window.location.hostname !== 'localhost') {
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId
                },
                body: JSON.stringify({ id: pageId, type, timestamp: new Date().toISOString() })
            }).catch(() => {});
        }
    } catch (e: any) {
        console.warn('Analytics tracking failed', e);
    }
};

export const trackInteraction = (action: string, category: string, label?: string) => {
    try {
        const sessionId = sessionStorage.getItem('dropsiders_session_id') || 'unknown';
        if (window.location.hostname !== 'localhost') {
            fetch('/api/analytics/click', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId
                },
                body: JSON.stringify({ action, category, label, timestamp: new Date().toISOString() })
            }).catch(() => {});
        }
    } catch (e) {}
};
