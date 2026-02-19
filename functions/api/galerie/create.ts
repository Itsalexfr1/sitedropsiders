
import { jsonResponse, CORSH, updateGitHubFile } from '../../utils';

export const onRequest = async (context: any) => {
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
        const { title, date, category, cover, images } = body;

        if (!title || !cover) {
            return jsonResponse({ error: 'Titre et image de couverture obligatoires' }, 400);
        }

        const PATH = 'src/data/galerie.json';
        let newAlbum: any = null;

        await updateGitHubFile(env, PATH, (currentGallery: any[]) => {
            const newId = currentGallery.length > 0 ? Math.max(...currentGallery.map((n: any) => n.id || 0)) + 1 : 1;

            newAlbum = {
                id: newId,
                title,
                date: date || new Date().getFullYear().toString(),
                category: category || 'Festivals',
                cover: cover,
                images: images || [],
                slug: title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
            };

            currentGallery.unshift(newAlbum);
            return currentGallery;
        }, `Add gallery: ${title}`);

        return jsonResponse({ success: true, album: newAlbum });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
