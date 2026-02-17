import { jsonResponse } from '../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { username, password } = body;

        // Verify username and password
        // User requested strict check for 'alex'
        if (username === 'alex' && password === env.ADMIN_PASSWORD) {
            return jsonResponse({ success: true });
        }

        return jsonResponse({ error: 'Identifiants incorrects' }, 401);
    } catch (err) {
        return jsonResponse({ error: 'Erreur serveur' }, 500);
    }
};
