
import { jsonResponse, CORSH, utf8_to_b64, b64_to_utf8 } from '../../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: { ...CORSH } });
    }

    try {
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return jsonResponse({ error: 'Accès non autorisé' }, 401);
        }

        const body = await request.json();
        const { title, summary, content, image, date, festival, location, youtubeId, category } = body;

        if (!title || !content || !image) {
            return jsonResponse({ error: 'Champs obligatoires manquants' }, 400);
        }

        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = 'src/data/recaps.json';
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
        let currentRecaps: any[] = [];
        try {
            const content = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            currentRecaps = JSON.parse(content);
        } catch (e) {
            console.error("Error parsing recaps data:", e);
            currentRecaps = [];
        }

        // 2. Add new recap
        const newId = currentRecaps.length > 0 ? Math.max(...currentRecaps.map((n: any) => n.id || 0)) + 1 : 1;
        const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
        const link = `https://www.dropsiders.eu/recaps/${newId}_${slug}`;

        const newRecap = {
            id: newId,
            title,
            date: date || new Date().toISOString().split('T')[0],
            summary,
            content,
            image,
            images: [image],
            youtubeId: youtubeId || "",
            location: location || "",
            festival: festival || "",
            link,
            category: category || 'Recap'
        };

        currentRecaps.unshift(newRecap);

        const updatedContent = utf8_to_b64(JSON.stringify(currentRecaps, null, 2));

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add recap: ${title}`,
                content: updatedContent,
                sha: fileData.sha
            })
        });

        if (!putResponse.ok) {
            const errorText = await putResponse.text();
            return jsonResponse({ error: 'Erreur lors de la sauvegarde sur GitHub', details: errorText }, 502);
        }

        return jsonResponse({ success: true, recap: newRecap });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
