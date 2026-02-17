import { b64_to_utf8 } from '../utils';

export const onRequestGet = async (context: any) => {
    const { request, env } = context;

    const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
    const REPO = env.GITHUB_REPO || 'sitedropsiders';
    const PATH = env.GITHUB_FILE_PATH || 'src/data/subscribers.json';
    const TOKEN = env.GITHUB_TOKEN;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    // Authorization Check
    const adminPassword = request.headers.get('X-Admin-Password');
    if (adminPassword !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Accès non autorisé' }), { status: 401, headers });
    }

    if (!TOKEN) {
        return new Response(JSON.stringify({ error: 'Configuration manquante (GITHUB_TOKEN)' }), {
            status: 500,
            headers
        });
    }

    try {
        const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const response = await fetch(getUrl, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) return new Response(JSON.stringify([]), { status: 200, headers });
            return new Response(JSON.stringify({ error: 'Failed to fetch subscribers' }), { status: response.status, headers });
        }

        const fileData = await response.json();
        const content = b64_to_utf8(fileData.content.replace(/\n/g, ''));

        return new Response(content, { status: 200, headers });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
};
