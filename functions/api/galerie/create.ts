
import { jsonResponse, CORSH, utf8_to_b64, b64_to_utf8 } from '../../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: { ...CORSH } });
    }

    try {
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const body = await request.json();
        const { title, coverImage, photos } = body;

        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = 'src/data/galerie.json';
        const TOKEN = env.GITHUB_TOKEN;

        const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker'
            }
        });

        if (!getResponse.ok) {
            return jsonResponse({ error: 'Failed to fetch existing gallery' }, 502);
        }

        const fileData: any = await getResponse.json();
        let currentGallery: any[] = [];
        try {
            const content = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            currentGallery = JSON.parse(content);
        } catch (e) {
            console.error(e);
        }

        const newId = currentGallery.length + 1;

        const newAlbum = {
            id: newId,
            title,
            coverImage,
            photoCount: photos.length,
            photos: photos,
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
            return jsonResponse({ error: 'Failed to save gallery' }, 502);
        }

        return jsonResponse({ success: true, album: newAlbum });

    } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
    }
};
