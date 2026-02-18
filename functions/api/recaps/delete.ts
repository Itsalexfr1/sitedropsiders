
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

    try {
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return jsonResponse({ error: 'Accès non autorisé' }, 401);
        }

        // Vérification explicite du token GitHub
        if (!env.GITHUB_TOKEN) {
            return jsonResponse({ error: 'Token GitHub manquant — vérifiez les secrets Cloudflare (GITHUB_TOKEN)' }, 500);
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
                    throw new Error(`Recap avec l'ID "${id}" non trouvé dans recaps.json`);
                }
                return newItems;
            },
            `Delete recap: ${id}`
        );

        return jsonResponse({ success: true });

    } catch (err: any) {
        console.error('[recaps/delete] Error:', err);
        return jsonResponse({ error: err.message || 'Erreur inconnue lors de la suppression' }, 500);
    }
};
