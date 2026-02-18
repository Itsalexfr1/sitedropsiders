
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
        const { title, date, location, type, genre, image, description, url, month } = body;

        // Validation
        if (!title || !date) {
            return jsonResponse({ error: 'Le titre et la date sont obligatoires' }, 400);
        }

        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = 'src/data/agenda.json';
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
            return jsonResponse({ error: 'Impossible de récupérer l\'agenda existant', details: errorText }, 502);
        }

        const fileData: any = await getResponse.json();
        let currentAgenda: any[] = [];
        try {
            const content = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            currentAgenda = JSON.parse(content);
        } catch (e) {
            console.error("Error parsing agenda:", e);
            currentAgenda = [];
        }

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

        const newEvent = {
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

        const updatedContent = utf8_to_b64(JSON.stringify(currentAgenda, null, 2));

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add event: ${title}`,
                content: updatedContent,
                sha: fileData.sha
            })
        });

        if (!putResponse.ok) {
            const errorText = await putResponse.text();
            return jsonResponse({ error: 'Erreur lors de la sauvegarde sur GitHub', details: errorText }, 502);
        }

        return jsonResponse({ success: true, event: newEvent });

    } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
    }
};
