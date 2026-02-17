import { utf8_to_b64, b64_to_utf8 } from '../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Configuration (Default or Env Vars)
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

        const { email, firstName, lastName } = body;

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

        if (!getResponse.ok && getResponse.status !== 404) {
            const errorText = await getResponse.text();
            return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des abonnés', details: errorText }), { status: 502, headers });
        }

        let currentData: any[] = [];
        let sha = null;

        if (getResponse.ok) {
            const fileData: any = await getResponse.json();
            // Decode base64 content with UTF-8 support
            try {
                const content = b64_to_utf8(fileData.content.replace(/\n/g, ''));
                currentData = JSON.parse(content);
            } catch (e) {
                console.error("Error parsing current data:", e);
                currentData = [];
            }
            sha = fileData.sha;
        }

        // 2. Check for duplicate
        if (currentData.some((sub: any) => sub.email === email)) {
            return new Response(JSON.stringify({ error: 'Déjà inscrit' }), { status: 409, headers });
        }

        // 3. Add new subscriber
        const newSubscriber = {
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            subscribedAt: new Date().toISOString()
        };

        const updatedData = [...currentData, newSubscriber];

        // 4. Update file
        // Encode with UTF-8 support
        const updatedContent = utf8_to_b64(JSON.stringify(updatedData, null, 2));

        const putBody: any = {
            message: `Nouvel abonné : ${email}`,
            content: updatedContent
        };

        if (sha) {
            putBody.sha = sha;
        }

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(putBody)
        });

        if (!putResponse.ok) {
            const errorText = await putResponse.text();
            console.error("GitHub API Error:", errorText);
            return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde', details: errorText }), { status: 500, headers });
        }

        return new Response(JSON.stringify({ success: true, subscriber: newSubscriber }), { status: 200, headers });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500, headers });
    }
};
