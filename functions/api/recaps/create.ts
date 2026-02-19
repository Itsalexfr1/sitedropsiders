
import { jsonResponse, CORSH, utf8_to_b64, b64_to_utf8, updateGitHubFile } from '../../utils';

export const onRequest = async (context: any) => {
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

        const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
        let newRecap: any = null;

        await updateGitHubFile(
            env,
            'src/data/recaps.json',
            (currentRecaps: any[]) => {
                const newId = currentRecaps.length > 0 ? Math.max(...currentRecaps.map((n: any) => n.id || 0)) + 1 : 1;
                const link = `https://www.dropsiders.eu/recaps/${newId}_${slug}`;

                newRecap = {
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

                return [newRecap, ...currentRecaps];
            },
            `Add recap: ${title}`
        );

        return jsonResponse({ success: true, recap: newRecap });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
