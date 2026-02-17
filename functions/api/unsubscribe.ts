
export const onRequestPost = async (context) => {
    const { request, env } = context;

    // Configuration
    const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
    const REPO = env.GITHUB_REPO || 'sitedropsiders';
    const PATH = env.GITHUB_FILE_PATH || 'src/data/subscribers.json';
    const TOKEN = env.GITHUB_TOKEN;

    // Basic CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    if (!TOKEN) {
        return new Response(JSON.stringify({ error: 'Configuration manquante (GITHUB_TOKEN)' }), {
            status: 500,
            headers
        });
    }

    try {
        const rawBody = await request.text();
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
        }

        const { email } = body;

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email requis' }), { status: 400, headers });
        }

        // 1. Fetch current file
        const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const getResponse = await fetch(getUrl, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!getResponse.ok) {
            return new Response(JSON.stringify({ error: 'Erreur lors de la récupération' }), { status: 502, headers });
        }

        const fileData = await getResponse.json();
        const content = atob(fileData.content.replace(/\n/g, ''));
        let currentData = [];
        try {
            currentData = JSON.parse(content);
        } catch (e) {
            // Error parsing content
        }
        const sha = fileData.sha;

        // 2. Filter out subscriber
        const updatedData = currentData.filter(sub => sub.email !== email);

        if (updatedData.length === currentData.length) {
            return new Response(JSON.stringify({ error: 'Email non trouvé' }), { status: 404, headers });
        }

        // 3. Update file
        const updatedContent = btoa(JSON.stringify(updatedData, null, 2));

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Désinscription : ${email}`,
                content: updatedContent,
                sha: sha
            })
        });

        if (!putResponse.ok) {
            return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour' }), { status: 500, headers });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
};
