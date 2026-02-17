
import {
    jsonResponse,
    CORSH,
    utf8_to_b64,
    b64_to_utf8
} from '../../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: { ...CORSH }
        });
    }

    const headers = { ...CORSH, 'Content-Type': 'application/json' };

    try {
        // Authenticate Admin
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });
        }

        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = 'src/data/agenda.json';
        const TOKEN = env.GITHUB_TOKEN;

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
            return new Response(JSON.stringify({ error: 'Failed to fetch existing data', details: errorText }), { status: 502, headers });
        }

        const fileData: any = await getResponse.json();
        let items: any[] = [];
        try {
            const content = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            items = JSON.parse(content);
        } catch (e) {
            console.error("Error parsing data:", e);
            items = [];
        }

        const initialLength = items.length;
        items = items.filter((item: any) => String(item.id) !== String(id));

        if (items.length === initialLength) {
            return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });
        }

        const updatedContent = utf8_to_b64(JSON.stringify(items, null, 2));

        const putBody: any = {
            message: `Delete agenda item: ${id}`,
            content: updatedContent,
            sha: fileData.sha
        };

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
            return new Response(JSON.stringify({ error: 'Failed to save deletion', details: errorText }), { status: 502, headers });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500, headers });
    }
};
