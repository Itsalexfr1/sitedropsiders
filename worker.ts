
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Configuration
        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = env.GITHUB_FILE_PATH || 'src/data/subscribers.json';
        const TOKEN = env.GITHUB_TOKEN;

        // CORS Headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // --- API: SUBSCRIBE ---
        if (path === '/api/subscribe' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            try {
                const rawBody = await request.text();
                let body;
                try { body = JSON.parse(rawBody); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

                const { email, firstName, lastName } = body;
                if (!email) return new Response(JSON.stringify({ error: 'Email requis' }), { status: 400, headers });

                // 1. Fetch current file
                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
                const getResponse = await fetch(getUrl, {
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' }
                });

                let currentData = [];
                let sha = null;
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    const content = atob(fileData.content.replace(/\n/g, ''));
                    try { currentData = JSON.parse(content); } catch (e) { currentData = []; }
                    sha = fileData.sha;
                }

                if (currentData.some(sub => sub.email === email)) {
                    return new Response(JSON.stringify({ error: 'Déjà inscrit' }), { status: 409, headers });
                }

                const newSubscriber = { email, firstName: firstName || null, lastName: lastName || null, subscribedAt: new Date().toISOString() };
                const updatedData = [...currentData, newSubscriber];
                const updatedContent = btoa(JSON.stringify(updatedData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Nouvel abonné : ${email}`, content: updatedContent, sha: sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Erreur sauvegarde' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: SUBSCRIBERS (GET) ---
        if (path === '/api/subscribers' && request.method === 'GET') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            try {
                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
                const response = await fetch(getUrl, {
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' }
                });

                if (!response.ok) {
                    if (response.status === 404) return new Response(JSON.stringify([]), { status: 200, headers });
                    return new Response(JSON.stringify({ error: 'Failed fetch' }), { status: response.status, headers });
                }
                const fileData = await response.json();
                const content = atob(fileData.content.replace(/\n/g, ''));
                return new Response(content, { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: UNSUBSCRIBE ---
        if (path === '/api/unsubscribe' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            try {
                const rawBody = await request.text();
                const { email } = JSON.parse(rawBody);

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
                const getResponse = await fetch(getUrl, {
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' }
                });

                if (!getResponse.ok) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                const fileData = await getResponse.json();
                const content = atob(fileData.content.replace(/\n/g, ''));
                let currentData = [];
                try { currentData = JSON.parse(content); } catch (e) { }

                const updatedData = currentData.filter(sub => sub.email !== email);
                if (updatedData.length === currentData.length) return new Response(JSON.stringify({ error: 'Email not found' }), { status: 404, headers });

                const updatedContent = btoa(JSON.stringify(updatedData, null, 2));
                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Désinscription : ${email}`, content: updatedContent, sha: fileData.sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error updating' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- STATIC ASSETS ---
        if (env.ASSETS) {
            const response = await env.ASSETS.fetch(request);
            if (response.status === 404 && !path.startsWith('/api/')) {
                // SPA Fallback: serve index.html
                return env.ASSETS.fetch(new URL('/index.html', request.url));
            }
            return response;
        }

        return new Response("Not Found", { status: 404 });
    }
}
