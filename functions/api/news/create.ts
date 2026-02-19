
import {
    jsonResponse,
    hashPassword,
    CORSH,
    utf8_to_b64,
    b64_to_utf8,
    updateGitHubFile
} from '../../utils';

export const onRequest = async (context: any) => {
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

        const body = await request.json();
        const { title, summary, content, image, category, date } = body;

        if (!title || !content || !image || !category) {
            return jsonResponse({ error: 'Champs obligatoires manquants' }, 400);
        }

        const slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        let newArticle: any = null;

        await updateGitHubFile(
            env,
            'src/data/news.json',
            (currentNews: any[]) => {
                const newId = currentNews.length > 0 ? Math.max(...currentNews.map((n: any) => n.id || 0)) + 1 : 1;
                const link = `https://www.dropsiders.eu/news/${newId}_${slug}`;

                newArticle = {
                    id: newId,
                    title,
                    date: date || new Date().toISOString().split('T')[0],
                    summary,
                    content,
                    image,
                    images: [image],
                    youtubeId: "",
                    link,
                    category
                };

                return [newArticle, ...currentNews];
            },
            `Add news article: ${title}`
        );

        return jsonResponse({ success: true, article: newArticle });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
