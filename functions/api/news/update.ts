
import {
    jsonResponse,
    CORSH,
    utf8_to_b64,
    b64_to_utf8
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
        const { id, title, summary, content, image, category, date } = body;

        if (!id) {
            return jsonResponse({ error: 'ID manquant' }, 400);
        }

        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = 'src/data/news.json';
        const TOKEN = env.GITHUB_TOKEN;

        if (!TOKEN) {
            return jsonResponse({ error: 'Configuration GITHUB_TOKEN manquante' }, 500);
        }

        const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!getResponse.ok) {
            const errorText = await getResponse.text();
            return jsonResponse({ error: 'Impossible de récupérer les données', details: errorText }, 502);
        }

        const fileData: any = await getResponse.json();
        let items: any[] = [];
        try {
            const contentDecoded = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            items = JSON.parse(contentDecoded);
        } catch (e) {
            console.error("Error parsing data:", e);
            items = [];
        }

        const index = items.findIndex((item: any) => String(item.id) === String(id));
        if (index === -1) {
            return jsonResponse({ error: 'Élément non trouvé' }, 404);
        }

        const existing = items[index];
        items[index] = {
            ...existing,
            title: title || existing.title,
            summary: summary || existing.summary,
            content: content || existing.content,
            image: image || existing.image,
            category: category || existing.category,
            date: date || existing.date
        };

        const updatedContent = utf8_to_b64(JSON.stringify(items, null, 2));

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update news item: ${id}`,
                content: updatedContent,
                sha: fileData.sha
            })
        });

        if (!putResponse.ok) {
            const errorText = await putResponse.text();
            return jsonResponse({ error: 'Erreur lors de la mise à jour sur GitHub', details: errorText }, 502);
        }

        return jsonResponse({ success: true, item: items[index] });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
