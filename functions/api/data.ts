
import {
    jsonResponse,
    CORSH,
    b64_to_utf8
} from '../utils';

export const onRequestGet = async (context: any) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'news', 'recaps', 'agenda'

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: { ...CORSH } });
    }

    if (!type || !['news', 'recaps', 'agenda'].includes(type)) {
        return jsonResponse({ error: 'Invalid type' }, 400);
    }

    const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
    const REPO = env.GITHUB_REPO || 'sitedropsiders';
    const PATH = `src/data/${type}.json`;
    const TOKEN = env.GITHUB_TOKEN;

    try {
        const githubUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const response = await fetch(githubUrl, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from GitHub');
        }

        const data: any = await response.json();
        const content = b64_to_utf8(data.content.replace(/\n/g, ''));
        const json = JSON.parse(content);

        return jsonResponse(json);

    } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
    }
};
