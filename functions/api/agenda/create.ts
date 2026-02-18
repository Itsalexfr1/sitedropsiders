
import { jsonResponse, CORSH, updateGitHubFile } from '../../utils';

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
        const { title, date, location, type, genre, image, description, url, month } = body;

        // Validation
        if (!title || !date) {
            return jsonResponse({ error: 'Le titre et la date sont obligatoires' }, 400);
        }

        const PATH = 'src/data/agenda.json';
        let newEvent: any = null;

        await updateGitHubFile(env, PATH, (currentAgenda: any[]) => {
            // Safer ID generation
            const newId = currentAgenda.length > 0 ? Math.max(...currentAgenda.map((item: any) => item.id || 0)) + 1 : 1;

            let generatedMonth = month;
            if (!generatedMonth) {
                try {
                    generatedMonth = new Date(date).toLocaleString('fr-FR', { month: 'long' }).toUpperCase();
                } catch (e) {
                    generatedMonth = "FRANCE";
                }
            }

            newEvent = {
                id: newId,
                title,
                date,
                location: location || "",
                type: type || "Festival",
                image: image || "",
                description: description || "",
                url: url || "",
                genre: genre || "",
                month: generatedMonth
            };

            currentAgenda.push(newEvent);
            return currentAgenda;
        }, `Add event: ${title}`);

        return jsonResponse({ success: true, event: newEvent });

    } catch (err: any) {
        return jsonResponse({ error: err.message || 'Erreur inconnue' }, 500);
    }
};
