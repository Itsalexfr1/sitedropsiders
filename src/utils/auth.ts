export const getAuthHeaders = (contentType: string | null = 'application/json') => {
    const password = localStorage.getItem('admin_password');
    const username = localStorage.getItem('admin_user');
    const googleToken = localStorage.getItem('admin_google_token');

    const headers: Record<string, string> = {};

    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    if (password) {
        headers['X-Admin-Password'] = password;
    }
    if (username) {
        headers['X-Admin-Username'] = username;
    }
    if (googleToken) {
        headers['X-Google-Token'] = googleToken;
    }

    const sessionId = localStorage.getItem('admin_session_id');
    if (sessionId) {
        headers['X-Session-ID'] = sessionId;
    }

    return headers;
};

/**
 * Custom fetch wrapper that handles 401 Unauthorized globally
 * to force logout on all tabs when session is revoked.
 */
export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);

    if (response.status === 401) {
        console.error(`[AUTH] 401 Unauthorized detected for URL: ${url}. Logging out.`);
        // Clear local storage and force reload/redirect
        localStorage.removeItem('admin_auth_v2');
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_permissions');
        localStorage.removeItem('admin_session_id');

        // Use a custom event to notify components or just reload
        window.dispatchEvent(new Event('admin-logout'));

        // If we are in the admin section, force a redirect
        if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin';
        }
    }

    return response;
};

export const isSuperAdmin = (user: string | null) => {
    if (!user) return false;
    const normalized = user.toLowerCase();
    const admins = ['alex', 'alexflex30@gmail.com', 'alex@dropsiders.fr'];
    return admins.includes(normalized);
};

export const hasPermission = (storedPermissions: string[], p: string, isAlex: boolean = false) => {
    if (p === "alex_only") return isAlex;
    if (p === "superadmin") return isAlex || storedPermissions.includes("all");
    if (isAlex || storedPermissions.includes('all')) return true;
    if (p === 'all') return true;
    
    const mapping: Record<string, string> = {
      // New to Old / Aliases
      social_studio: "social",
      news_focus: "news",
      musique_releases: "musique",
      interviews_video: "interviews",
      recaps_festivals: "recaps",
      agenda_events: "agenda",
      wiki_dropsiders: "wiki",
      community_mod: "community",
      push_newsletter: "broadcast",
      messages_contact: "messages",
      stats_analytics: "stats",
      home_layout: "accueil",
      notifications: "broadcast",
      team: "all",
      publications: "news",
      galeries: "community",
      // Tab names to Permission IDs
      News: "news",
      Focus: "news",
      Musique: "musique",
      Recaps: "recaps",
      Interviews: "interviews",
      Agenda: "agenda",
      Communauté: "community",
      // Old to New
      social: "social_studio",
      news: "news_focus",
      musique: "musique_releases",
      interviews: "interviews_video",
      recaps: "recaps_festivals",
      agenda: "agenda_events",
      wiki: "wiki_dropsiders",
      community: "community_mod",
      broadcast: "push_newsletter",
      messages: "messages_contact",
      stats: "stats_analytics",
      accueil: "home_layout"
    };

    const alt = mapping[p];
    return storedPermissions.includes(p) || (alt ? storedPermissions.includes(alt) : false);
};
