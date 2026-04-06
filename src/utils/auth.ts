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
        localStorage.removeItem('admin_auth');
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
    const admins = ['alex', 'alexf', 'itsalexfr1', 'contact@dropsiders.fr', 'tanguy', 'tanguyf'];
    return admins.includes(normalized);
};
