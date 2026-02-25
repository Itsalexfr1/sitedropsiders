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
