
// @ts-nocheck
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

        // --- AUTH CHECK ---
        const adminPassword = env.ADMIN_PASSWORD || '1988'; // Fallback for safety during transition
        const requestPassword = request.headers.get('X-Admin-Password');

        // Helper to check if route needs auth
        const isAuthRoute = path.startsWith('/api/news/create') ||
            path.startsWith('/api/recaps/create') ||
            path.startsWith('/api/agenda/create') ||
            path === '/api/agenda' ||
            path.startsWith('/api/galerie/create') ||
            path.startsWith('/api/newsletter/send') ||
            path.startsWith('/api/news/update') ||
            path.startsWith('/api/recaps/update') ||
            path.startsWith('/api/agenda/update') ||
            path.endsWith('/delete') ||
            path === '/api/subscribers'; // Direct list access is sensitive

        if (isAuthRoute && requestPassword !== adminPassword) {
            return new Response(JSON.stringify({ error: 'Accès non autorisé' }), { status: 401, headers });
        }

        // --- API: LOGIN ---
        if (path === '/api/login' && request.method === 'POST') {
            try {
                const { password } = await request.json();
                if (password === adminPassword) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                }
                return new Response(JSON.stringify({ error: 'Mot de passe incorrect' }), { status: 401, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400, headers });
            }
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

        // --- API: CREATE NEWS ---
        if (path === '/api/news/create' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            const NEWS_PATH = 'src/data/news.json';

            try {
                const rawBody = await request.text();
                let body;
                try { body = JSON.parse(rawBody); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

                const { title, date, summary, content, image, category } = body;
                if (!title || !content) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });

                // 1. Fetch current news.json
                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${NEWS_PATH}`;
                const getResponse = await fetch(getUrl, {
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' }
                });

                let currentNews = [];
                let sha = null;

                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    const fileContent = atob(fileData.content.replace(/\n/g, ''));
                    try { currentNews = JSON.parse(fileContent); } catch (e) { currentNews = []; }
                    sha = fileData.sha;
                } else if (getResponse.status !== 404) {
                    return new Response(JSON.stringify({ error: 'Error fetching news' }), { status: 502, headers });
                }

                // 2. Create new ID
                const maxId = currentNews.reduce((max, item) => (item.id > max ? item.id : max), 0);
                const newId = maxId + 1;

                const newArticle = {
                    id: newId,
                    title,
                    date: date || new Date().toISOString().split('T')[0],
                    summary: summary || '',
                    content, // Storing HTML content
                    image: image || '',
                    category: category || 'News',
                    link: `https://dropsiders.eu/news/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                };

                // Add to beginning of array
                const updatedNews = [newArticle, ...currentNews];

                // 3. Save back to GitHub
                // Use UTF-8 encoding for content to handle special characters correctly in base64
                const utf8Encode = (str) => {
                    return btoa(unescape(encodeURIComponent(str)));
                };

                const updatedContent = utf8Encode(JSON.stringify(updatedNews, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'User-Agent': 'Cloudflare-Worker',
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Add news: ${title}`,
                        content: updatedContent,
                        sha: sha
                    })
                });

                if (!putResponse.ok) {
                    const err = await putResponse.text();
                    return new Response(JSON.stringify({ error: 'Error saving to GitHub', details: err }), { status: 500, headers });
                }

                return new Response(JSON.stringify({ success: true, article: newArticle }), { status: 200, headers });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }


        // --- API: CREATE RECAP ---
        if (path === '/api/recaps/create' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/recaps.json';

            try {
                const rawBody = await request.text();
                const body = JSON.parse(rawBody);
                const { title, date, summary, content, image, festival, location, youtubeId, category } = body;

                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
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

                const maxId = currentData.reduce((max, item) => (item.id > max ? item.id : max), 0);
                const newId = maxId + 1;

                const newItem = {
                    id: newId,
                    title,
                    date: date || new Date().toISOString().split('T')[0],
                    summary: summary || '',
                    content,
                    image: image || '',
                    youtubeId: youtubeId || '',
                    festival: festival || '',
                    location: location || '',
                    category: category || 'Recaps',
                    link: `https://dropsiders.eu/recaps/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                    images: []
                };

                const updatedData = [newItem, ...currentData];
                const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));
                const updatedContent = utf8Encode(JSON.stringify(updatedData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Add recap: ${title}`, content: updatedContent, sha: sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: CREATE AGENDA ---
        if ((path === '/api/agenda/create' || path === '/api/agenda') && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/agenda.json';

            try {
                const rawBody = await request.text();

                let body;
                try { body = JSON.parse(rawBody); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

                const { title, date, location, type, image, description, url: eventUrl, genre, month } = body;

                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
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

                const maxId = currentData.reduce((max, item) => (item.id > max ? item.id : max), 0);
                const newId = maxId + 1;

                const newItem = {
                    id: newId,
                    title,
                    date: date,
                    location,
                    type,
                    image,
                    description,
                    url: eventUrl,
                    genre,
                    month: month || new Date(date).toLocaleString('fr-FR', { month: 'long' }).toUpperCase()
                };

                // Append to end
                const updatedData = [...currentData, newItem];
                const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));
                const updatedContent = utf8Encode(JSON.stringify(updatedData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Add agenda: ${title}`, content: updatedContent, sha: sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: CREATE GALERIE ---
        if (path === '/api/galerie/create' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/galerie.json';

            try {
                const rawBody = await request.text();
                let body;
                try { body = JSON.parse(rawBody); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

                const { title, date, category, cover, images } = body;

                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
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

                const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                const newItem = {
                    id: newId,
                    title,
                    category,
                    cover,
                    images,
                    date
                };

                const updatedData = [newItem, ...currentData];
                const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));
                const updatedContent = utf8Encode(JSON.stringify(updatedData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Add galerie: ${title}`, content: updatedContent, sha: sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: SEND NEWSLETTER (BREVO) ---
        if (path === '/api/newsletter/send' && request.method === 'POST') {
            const BREVO_KEY = env.BREVO_API_KEY;
            if (!BREVO_KEY) return new Response(JSON.stringify({ error: 'Brevo API Key missing' }), { status: 500, headers });

            try {
                const rawBody = await request.text();
                let body;
                try { body = JSON.parse(rawBody); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

                const { subject, htmlContent, recipients } = body;

                if (!subject || !htmlContent || !recipients || !Array.isArray(recipients)) {
                    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
                }

                // Brevo API URL
                const brevoUrl = 'https://api.brevo.com/v3/smtp/email';

                // We send INDIVIDUAL emails to ensure better deliverability and personal feeling
                // (or use BCC if list is small, but looping is safer for limits per header)
                // Actually, for a newsletter, using BCC in a single transactional email is risky for spam scores.
                // Better approach for "simple" newsletter: 1 email with everyone in BCC (limit 99) OR loop.
                // Let's use BCC for now as it's faster for the worker, but warn about limits.
                // IF list > 99, we should split chunks.

                const CHUNK_SIZE = 99;
                const chunks = [];
                for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
                    chunks.push(recipients.slice(i, i + CHUNK_SIZE));
                }

                const results = [];

                for (const chunk of chunks) {
                    const payload = {
                        sender: { name: "Dropsiders", email: "contact@dropsiders.fr" },
                        to: [{ email: "contact@dropsiders.fr", name: "Dropsiders Admin" }], // Main recipient (yourself)
                        bcc: chunk.map(email => ({ email })), // Subscribers in BCC
                        subject: subject,
                        htmlContent: htmlContent,
                        replyTo: { email: "contact@dropsiders.fr", name: "Dropsiders" }
                    };

                    const response = await fetch(brevoUrl, {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'api-key': BREVO_KEY,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        results.push({ success: true, chunk: chunk.length });
                    } else {
                        const err = await response.text();
                        console.error('Brevo Error:', err);
                        results.push({ success: false, error: err });
                    }
                }

                return new Response(JSON.stringify({ success: true, details: results }), { status: 200, headers });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: DELETE CONTENT ---
        if (path.endsWith('/delete') && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            let FILE_PATH = '';
            if (path.includes('/news/') || path.includes('/interviews/')) FILE_PATH = 'src/data/news.json';
            else if (path.includes('/recaps/')) FILE_PATH = 'src/data/recaps.json';
            else if (path.includes('/agenda/')) FILE_PATH = 'src/data/agenda.json';
            else if (path.includes('/galerie/')) FILE_PATH = 'src/data/galerie.json';

            if (!FILE_PATH) return new Response(JSON.stringify({ error: 'Invalid delete path' }), { status: 400, headers });

            try {
                const rawBody = await request.text();
                const { id } = JSON.parse(rawBody);
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
                const getResponse = await fetch(getUrl, {
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' }
                });

                if (!getResponse.ok) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                const fileData = await getResponse.json();
                const content = atob(fileData.content.replace(/\n/g, ''));
                let currentData = JSON.parse(content);

                const updatedData = currentData.filter(item => item.id !== id);
                if (updatedData.length === currentData.length) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));
                const updatedContent = utf8Encode(JSON.stringify(updatedData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Delete from ${FILE_PATH}: ${id}`, content: updatedContent, sha: fileData.sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: UPDATE CONTENT ---
        // News/Interviews Update
        if (path === '/api/news/update' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/news.json';
            try {
                const rawBody = await request.text();
                const body = JSON.parse(rawBody);
                const { id, title, summary, content, image, category, date } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
                const getResponse = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' } });

                if (!getResponse.ok) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });
                const fileData = await getResponse.json();
                const fileContent = atob(fileData.content.replace(/\n/g, ''));
                let currentData = JSON.parse(fileContent);

                const index = currentData.findIndex(item => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const existing = currentData[index];
                currentData[index] = {
                    ...existing,
                    title: title || existing.title,
                    summary: summary || existing.summary,
                    content: content || existing.content,
                    image: image || existing.image,
                    category: category || existing.category,
                    date: date || existing.date
                };

                const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));
                const updatedContent = utf8Encode(JSON.stringify(currentData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Update news: ${title || existing.title}`, content: updatedContent, sha: fileData.sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // Recaps Update
        if (path === '/api/recaps/update' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/recaps.json';
            try {
                const rawBody = await request.text();
                const body = JSON.parse(rawBody);
                const { id, title, summary, content, image, date, festival, location, youtubeId } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
                const getResponse = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' } });

                if (!getResponse.ok) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });
                const fileData = await getResponse.json();
                const fileContent = atob(fileData.content.replace(/\n/g, ''));
                let currentData = JSON.parse(fileContent);

                const index = currentData.findIndex(item => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const existing = currentData[index];
                currentData[index] = {
                    ...existing,
                    title: title || existing.title,
                    summary: summary || existing.summary,
                    content: content || existing.content,
                    image: image || existing.image,
                    date: date || existing.date,
                    festival: festival !== undefined ? festival : existing.festival,
                    location: location !== undefined ? location : existing.location,
                    youtubeId: youtubeId !== undefined ? youtubeId : existing.youtubeId
                };

                const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));
                const updatedContent = utf8Encode(JSON.stringify(currentData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Update recap: ${title || existing.title}`, content: updatedContent, sha: fileData.sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // Agenda Update
        if (path === '/api/agenda/update' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/agenda.json';
            try {
                const rawBody = await request.text();
                const body = JSON.parse(rawBody);
                const { id, title, date, location, type, image, description, url: eventUrl, genre, month } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
                const getResponse = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' } });

                if (!getResponse.ok) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });
                const fileData = await getResponse.json();
                const fileContent = atob(fileData.content.replace(/\n/g, ''));
                let currentData = JSON.parse(fileContent);

                const index = currentData.findIndex(item => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const existing = currentData[index];
                currentData[index] = {
                    ...existing,
                    title: title || existing.title,
                    date: date || existing.date,
                    location: location || existing.location,
                    type: type || existing.type,
                    image: image || existing.image,
                    description: description || existing.description,
                    url: eventUrl || existing.url,
                    genre: genre || existing.genre,
                    month: month || existing.month
                };

                const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));
                const updatedContent = utf8Encode(JSON.stringify(currentData, null, 2));

                const putResponse = await fetch(getUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Update agenda: ${title || existing.title}`, content: updatedContent, sha: fileData.sha })
                });

                if (!putResponse.ok) return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: GET DATA ---
        // Serve static JSON files directly instead of fetching from GitHub
        if (path === '/api/data' && request.method === 'GET') {
            const type = url.searchParams.get('type');
            if (!type || !['news', 'recaps', 'agenda'].includes(type)) {
                return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });
            }

            try {
                // Fetch the static JSON file from the deployed assets
                const assetPath = `/src/data/${type}.json`;
                const assetResponse = await env.ASSETS.fetch(new Request(`${url.origin}${assetPath}`));

                if (assetResponse.ok) {
                    const content = await assetResponse.text();
                    return new Response(content, { status: 200, headers });
                }

                // If asset not found, return empty array
                return new Response(JSON.stringify([]), { status: 200, headers });
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
