
import { jsonResponse, CORSH, utf8_to_b64, b64_to_utf8 } from '../../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: { ...CORSH } });
    }

    try {
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return jsonResponse({ error: 'Accès non autorisé' }, 401);
        }

        const body = await request.json();
        const { title, coverImage, photos } = body;

        if (!title || !coverImage) {
            return jsonResponse({ error: 'Titre et image de couverture obligatoires' }, 400);
        }

        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = 'src/data/galerie.json';
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
        let currentGallery: any[] = [];
        try {
            const contentDecoded = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            currentGallery = JSON.parse(contentDecoded);
        } catch (e) {
            console.error("Error parsing gallery data:", e);
            currentGallery = [];
        }

        const newId = currentGallery.length > 0 ? Math.max(...currentGallery.map((n: any) => n.id || 0)) + 1 : 1;

        const newAlbum = {
            id: newId,
            title,
            coverImage,
            photoCount: photos ? photos.length : 0,
            photos: photos || [],
            date: new Date().toISOString()
        };

        currentGallery.unshift(newAlbum);

        const updatedContent = utf8_to_b64(JSON.stringify(currentGallery, null, 2));

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add gallery: ${title}`,
                content: updatedContent,
                sha: fileData.sha
            })
        });

        if (!putResponse.ok) {
            const errorText = await putResponse.text();
            return jsonResponse({ error: 'Erreur lors de la sauvegarde sur GitHub', details: errorText }, 502);
        }

        return jsonResponse({ success: true, album: newAlbum });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
