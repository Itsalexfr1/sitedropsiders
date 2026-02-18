
import {
    jsonResponse,
    CORSH,
    utf8_to_b64,
    b64_to_utf8,
    updateGitHubFile
} from '../../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: { ...CORSH }
        });
    }

    const headers = { ...CORSH, 'Content-Type': 'application/json' };

    try {
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return jsonResponse({ error: 'Accès non autorisé' }, 401);
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return jsonResponse({ error: 'ID manquant' }, 400);
        }

        const PATH = 'src/data/recaps.json';
        await updateGitHubFile(
            env,
            PATH,
            (items: any[]) => {
                const initialLength = items.length;
                const newItems = items.filter((item: any) => String(item.id) !== String(id));
                if (newItems.length === initialLength) {
                    throw new Error('Élément non trouvé');
                }
                return newItems;
            },
            `Delete recap: ${id}`
        );

        return jsonResponse({ success: true });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
