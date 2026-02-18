
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

        // --- CONTENT SPLITTING CONFIG ---
        // Fichiers cibles pour les nouveaux contenus (à mettre à jour manuellement si taille > 1MB)
        const NEWS_CONTENT_TARGET = 'src/data/news_content_3.json';
        const RECAPS_CONTENT_TARGET = 'src/data/recaps_content_2.json';

        // Listes des fichiers à scanner pour Updates/Deletes
        const NEWS_CONTENT_FILES = [
            'src/data/news_content_3.json',
            'src/data/news_content_2.json',
            'src/data/news_content_1.json'
        ];
        const RECAPS_CONTENT_FILES = [
            'src/data/recaps_content_2.json',
            'src/data/recaps_content_1.json'
        ];
        const EDITORS_PATH = 'src/data/editors.json';

        // CORS Headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password, X-Admin-Username, X-Google-Token',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // --- HELPER FUNCTIONS ---
        const utf8Encode = (str) => btoa(unescape(encodeURIComponent(str)));

        async function fetchGitHubFile(filePath) {
            const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
            const response = await fetch(getUrl, {
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' }
            });
            if (!response.ok) return null;
            const fileData = await response.json();
            const content = atob(fileData.content.replace(/\n/g, ''));
            return { content: JSON.parse(content), sha: fileData.sha, rawData: fileData };
        }


        async function saveGitHubFile(filePath, content, message, sha) {
            const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
            const encodedContent = utf8Encode(JSON.stringify(content, null, 2));
            const response = await fetch(getUrl, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, content: encodedContent, sha })
            });
            return response.ok;
        }

        const extractMetadata = (content) => {
            if (!content) return { images: [], youtubeId: '' };
            const images = [];
            const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
            let match;
            while ((match = imgRegex.exec(content)) !== null) {
                images.push(match[1]);
            }
            const mdImgRegex = /!\[.*?\]\((.*?)\)/g;
            while ((match = mdImgRegex.exec(content)) !== null) {
                images.push(match[1]);
            }

            const youtubeIdMatch = content.match(/(?:v=|v\/|embed\/|youtu.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
            const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : '';

            return { images: [...new Set(images)], youtubeId: youtubeId || '' };
        };

        const generateSummary = (content, existingSummary) => {
            if (existingSummary && existingSummary.trim() !== '') return existingSummary;
            if (!content) return '';
            const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            return text.substring(0, 200) + (text.length > 200 ? '...' : '');
        };

        const cleanStr = (str) => {
            if (!str) return str;
            const replacements = [
                [/Ã /g, 'à'], [/Ã©/g, 'é'], [/Ã¨/g, 'è'], [/Ãª/g, 'ê'], [/Ã»/g, 'û'], [/Ã´/g, 'ô'],
                [/Ã®/g, 'î'], [/Ã§/g, 'ç'], [/Ã¹/g, 'ù'], [/Ã«/g, 'ë'], [/Ã¯/g, 'ï'], [/Â /g, ' '],
                [/â€™/g, "'"], [/â€¦/g, '...']
            ];
            let s = str;
            for (const [p, r] of replacements) s = s.replace(p, r);
            return s;
        };

        // --- AUTH CHECK ---
        const adminPassword = env.ADMIN_PASSWORD || 'alex2026';
        const requestPassword = request.headers.get('X-Admin-Password');
        let requestUsername = request.headers.get('X-Admin-Username') || '';

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
            path === '/api/subscribers' ||
            path.startsWith('/api/editors');

        if (isAuthRoute) {
            let authenticated = false;

            // 1. Check Password Auth
            // 1. Check Password Auth
            if (requestPassword === adminPassword && (requestUsername === 'alex' || !requestUsername)) {
                authenticated = true;
            }
            // 2. Check Editor Password Auth
            else if (requestUsername) {
                const editorsFile = await fetchGitHubFile(EDITORS_PATH);
                if (editorsFile && editorsFile.content) {
                    const editor = editorsFile.content.find(e => e.username === requestUsername && e.password === requestPassword);
                    if (editor) authenticated = true;
                }
            }

            if (!authenticated) {
                return new Response(JSON.stringify({ error: 'Accès non autorisé' }), { status: 401, headers });
            }

            // Specific check for editors management: only Alex
            if (path.startsWith('/api/editors') &&
                requestUsername !== 'alex'
            ) {
                return new Response(JSON.stringify({ error: "Accès réservé à l'administrateur" }), { status: 403, headers });
            }
        }

        // --- API: LOGIN ---
        if (path === '/api/login' && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                if (username === 'alex' && password === adminPassword) {
                    return new Response(JSON.stringify({ success: true, user: 'alex' }), { status: 200, headers });
                }

                // Check editors
                const editorsFile = await fetchGitHubFile(EDITORS_PATH);
                if (editorsFile && editorsFile.content) {
                    const editor = editorsFile.content.find(e => e.username === username && e.password === password);
                    if (editor) {
                        return new Response(JSON.stringify({ success: true, user: username }), { status: 200, headers });
                    }
                }

                return new Response(JSON.stringify({ error: 'Identifiants incorrects' }), { status: 401, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400, headers });
            }
        }

        // --- API: EDITORS MANAGEMENT ---
        if (path === '/api/editors' && request.method === 'GET') {
            const editors = await fetchGitHubFile(EDITORS_PATH) || { content: [] };
            return new Response(JSON.stringify(editors.content), { status: 200, headers });
        }

        if (path === '/api/editors/create' && request.method === 'POST') {
            const { username, password, name } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH) || { content: [], sha: null };
            const updated = [...file.content, { username, password, name, created: new Date().toISOString() }];
            const saved = await saveGitHubFile(EDITORS_PATH, updated, `Add editor: ${username}`, file.sha);
            return new Response(JSON.stringify({ success: saved }), { status: saved ? 200 : 500, headers });
        }

        if (path === '/api/editors/delete' && request.method === 'POST') {
            const { username } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
            const updated = file.content.filter(e => e.username !== username);
            const saved = await saveGitHubFile(EDITORS_PATH, updated, `Remove editor: ${username}`, file.sha);
            return new Response(JSON.stringify({ success: saved }), { status: saved ? 200 : 500, headers });
        }

        // --- API: SUBSCRIBE ---
        if (path === '/api/subscribe' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            try {
                const rawBody = await request.text();
                const { email, firstName, lastName } = JSON.parse(rawBody);
                if (!email) return new Response(JSON.stringify({ error: 'Email requis' }), { status: 400, headers });

                const file = await fetchGitHubFile(PATH) || { content: [], sha: null };
                if (file.content.some(sub => sub.email === email)) {
                    return new Response(JSON.stringify({ error: 'Déjà inscrit' }), { status: 409, headers });
                }

                const newSubscriber = { email, firstName: firstName || null, lastName: lastName || null, subscribedAt: new Date().toISOString() };
                const updatedData = [...file.content, newSubscriber];

                if (await saveGitHubFile(PATH, updatedData, `Nouvel abonné : ${email}`, file.sha)) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: UNSUBSCRIBE ---
        if (path === '/api/unsubscribe' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            try {
                const { email } = await request.json();
                const file = await fetchGitHubFile(PATH);
                if (!file) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                const updatedData = file.content.filter(sub => sub.email !== email);
                if (updatedData.length === file.content.length) return new Response(JSON.stringify({ error: 'Email not found' }), { status: 404, headers });

                if (await saveGitHubFile(PATH, updatedData, `Désinscription : ${email}`, file.sha)) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error updating' }), { status: 500, headers });
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: CREATE NEWS ---
        if (path === '/api/news/create' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const NEWS_PATH = 'src/data/news.json';

            try {
                const body = await request.json();
                const { title, date, summary, content, image, category } = body;
                if (!title || !content) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });

                // 1. Update news.json (Metadata only)
                const newsFile = await fetchGitHubFile(NEWS_PATH) || { content: [], sha: null };
                const currentNews = newsFile.content;
                const maxId = currentNews.reduce((max, item) => (item.id > max ? item.id : max), 0);
                const newId = maxId + 1;

                const { images, youtubeId } = extractMetadata(content);

                const newArticle = {
                    id: newId,
                    title: cleanStr(title),
                    date: date || new Date().toISOString().split('T')[0],
                    summary: cleanStr(generateSummary(content, summary)),
                    content: '', // Empty in main file to save space
                    image: image || (images.length > 0 ? images[0] : ''),
                    images: images,
                    youtubeId: youtubeId,
                    category: category || 'News',
                    link: `https://dropsiders.eu/news/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                };

                const updatedNews = [newArticle, ...currentNews];
                const metaSaved = await saveGitHubFile(NEWS_PATH, updatedNews, `Add news: ${title}`, newsFile.sha);
                if (!metaSaved) return new Response(JSON.stringify({ error: 'Error saving metadata' }), { status: 500, headers });

                // 2. Save Content to separated file
                const contentFile = await fetchGitHubFile(NEWS_CONTENT_TARGET);
                if (contentFile) {
                    const newContentItem = { id: newId, content: content };
                    const updatedContentFile = [...contentFile.content, newContentItem];
                    await saveGitHubFile(NEWS_CONTENT_TARGET, updatedContentFile, `Add news content: ${newId}`, contentFile.sha);
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
                const body = await request.json();
                const { title, date, summary, content, image, festival, location, youtubeId, category } = body;
                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                // 1. Update recaps.json
                const recapsFile = await fetchGitHubFile(FILE_PATH) || { content: [], sha: null };
                const currentData = recapsFile.content;
                const maxId = currentData.reduce((max, item) => (item.id > max ? item.id : max), 0);
                const newId = maxId + 1;

                const { images: extractedImages, youtubeId: extractedYoutubeId } = extractMetadata(content);

                const newItem = {
                    id: newId,
                    title: cleanStr(title),
                    date: date || new Date().toISOString().split('T')[0],
                    summary: cleanStr(generateSummary(content, summary)),
                    content: '', // Empty in main file
                    image: image || (extractedImages.length > 0 ? extractedImages[0] : ''),
                    youtubeId: youtubeId || extractedYoutubeId || '',
                    festival: festival || '',
                    location: location || '',
                    category: category || 'Recaps',
                    link: `https://dropsiders.eu/recaps/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                    images: extractedImages
                };

                const updatedData = [newItem, ...currentData];
                const metaSaved = await saveGitHubFile(FILE_PATH, updatedData, `Add recap: ${title}`, recapsFile.sha);
                if (!metaSaved) return new Response(JSON.stringify({ error: 'Error saving metadata' }), { status: 500, headers });

                // 2. Save Content
                const contentFile = await fetchGitHubFile(RECAPS_CONTENT_TARGET);
                if (contentFile) {
                    const newContentItem = { id: newId, content: content };
                    const updatedContentFile = [...contentFile.content, newContentItem];
                    await saveGitHubFile(RECAPS_CONTENT_TARGET, updatedContentFile, `Add recap content: ${newId}`, contentFile.sha);
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: UPDATE NEWS ---
        if (path === '/api/news/update' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/news.json';
            try {
                const body = await request.json();
                const { id, title, summary, content, image, category, date } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                // 1. Update Metadata
                const newsFile = await fetchGitHubFile(FILE_PATH);
                if (!newsFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                let currentData = newsFile.content;
                const index = currentData.findIndex(item => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const { images, youtubeId } = extractMetadata(content || '');

                const existing = currentData[index];
                currentData[index] = {
                    ...existing,
                    title: cleanStr(title) || existing.title,
                    summary: cleanStr(generateSummary(content, summary)) || existing.summary,
                    content: '', // Always keep empty in main file
                    image: image || existing.image,
                    images: images.length > 0 ? images : existing.images,
                    youtubeId: youtubeId || existing.youtubeId,
                    category: category || existing.category,
                    date: date || existing.date
                };

                await saveGitHubFile(FILE_PATH, currentData, `Update news: ${title || existing.title}`, newsFile.sha);

                // 2. Update Content (Search in all content files)
                // If content is provided, we need to find where it is and update it
                if (content) {
                    let contentUpdated = false;
                    for (const filePath of NEWS_CONTENT_FILES) {
                        const cFile = await fetchGitHubFile(filePath);
                        if (cFile) {
                            const cIndex = cFile.content.findIndex(item => item.id === id);
                            if (cIndex !== -1) {
                                cFile.content[cIndex].content = content;
                                await saveGitHubFile(filePath, cFile.content, `Update news content: ${id}`, cFile.sha);
                                contentUpdated = true;
                                break;
                            }
                        }
                    }
                    // If content not found in any file (legacy?), add it to target file
                    if (!contentUpdated) {
                        const targetFile = await fetchGitHubFile(NEWS_CONTENT_TARGET);
                        if (targetFile) {
                            const updatedContentFile = [...targetFile.content, { id, content }];
                            await saveGitHubFile(NEWS_CONTENT_TARGET, updatedContentFile, `Add missing news content: ${id}`, targetFile.sha);
                        }
                    }
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: UPDATE RECAPS ---
        if (path === '/api/recaps/update' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/recaps.json';
            try {
                const body = await request.json();
                const { id, title, summary, content, image, date, festival, location, youtubeId } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                // 1. Update Metadata
                const recapsFile = await fetchGitHubFile(FILE_PATH);
                if (!recapsFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                let currentData = recapsFile.content;
                const index = currentData.findIndex(item => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const { images: extractedImages, youtubeId: extractedYoutubeId } = extractMetadata(content || '');

                const existing = currentData[index];
                currentData[index] = {
                    ...existing,
                    title: cleanStr(title) || existing.title,
                    summary: cleanStr(generateSummary(content, summary)) || existing.summary,
                    content: '', // Empty
                    image: image || existing.image,
                    date: date || existing.date,
                    festival: festival !== undefined ? festival : existing.festival,
                    location: location !== undefined ? location : existing.location,
                    youtubeId: youtubeId !== undefined ? youtubeId : (extractedYoutubeId || existing.youtubeId),
                    images: extractedImages.length > 0 ? extractedImages : (existing.images || [])
                };

                await saveGitHubFile(FILE_PATH, currentData, `Update recap: ${title || existing.title}`, recapsFile.sha);

                // 2. Update Content
                if (content) {
                    let contentUpdated = false;
                    for (const filePath of RECAPS_CONTENT_FILES) {
                        const cFile = await fetchGitHubFile(filePath);
                        if (cFile) {
                            const cIndex = cFile.content.findIndex(item => item.id === id);
                            if (cIndex !== -1) {
                                cFile.content[cIndex].content = content;
                                await saveGitHubFile(filePath, cFile.content, `Update recap content: ${id}`, cFile.sha);
                                contentUpdated = true;
                                break;
                            }
                        }
                    }
                    if (!contentUpdated) {
                        const targetFile = await fetchGitHubFile(RECAPS_CONTENT_TARGET);
                        if (targetFile) {
                            const updatedContentFile = [...targetFile.content, { id, content }];
                            await saveGitHubFile(RECAPS_CONTENT_TARGET, updatedContentFile, `Add missing recap content: ${id}`, targetFile.sha);
                        }
                    }
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: UPDATE AGENDA ---
        if (path === '/api/agenda/update' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/agenda.json';
            try {
                const body = await request.json();
                const { id, title, date, location, type, image, description, url: eventUrl, genre, month } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH);
                if (!agendaFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                let currentData = agendaFile.content;

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

                if (await saveGitHubFile(FILE_PATH, currentData, `Update agenda: ${title || existing.title}`, agendaFile.sha)) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: CREATE AGENDA ---
        if ((path === '/api/agenda/create' || path === '/api/agenda') && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/agenda.json';
            try {
                const body = await request.json();
                const { title, date, location, type, image, description, url: eventUrl, genre, month } = body;
                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH) || { content: [], sha: null };
                const currentData = agendaFile.content;
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

                const updatedData = [...currentData, newItem];
                if (await saveGitHubFile(FILE_PATH, updatedData, `Add agenda: ${title}`, agendaFile.sha)) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: CREATE GALERIE ---
        if (path === '/api/galerie/create' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/galerie.json';
            try {
                const body = await request.json();
                const { title, date, category, cover, images } = body;
                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const galerieFile = await fetchGitHubFile(FILE_PATH) || { content: [], sha: null };
                const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                const newItem = { id: newId, title, category, cover, images, date };
                const updatedData = [newItem, ...galerieFile.content];

                if (await saveGitHubFile(FILE_PATH, updatedData, `Add galerie: ${title}`, galerieFile.sha)) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving' }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: SEND NEWSLETTER (BREVO) ---
        if (path === '/api/newsletter/send' && request.method === 'POST') {
            const BREVO_KEY = env.BREVO_API_KEY;
            if (!BREVO_KEY) return new Response(JSON.stringify({ error: 'Brevo API Key missing' }), { status: 500, headers });

            try {
                const body = await request.json();
                const { subject, htmlContent, recipients } = body;

                if (!subject || !htmlContent || !recipients || !Array.isArray(recipients)) {
                    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
                }

                const brevoUrl = 'https://api.brevo.com/v3/smtp/email';
                const CHUNK_SIZE = 99;
                const chunks = [];
                for (let i = 0; i < recipients.length; i += CHUNK_SIZE) chunks.push(recipients.slice(i, i + CHUNK_SIZE));

                const results = [];
                for (const chunk of chunks) {
                    const payload = {
                        sender: { name: "Dropsiders", email: "contact@dropsiders.fr" },
                        to: [{ email: "contact@dropsiders.fr", name: "Dropsiders Admin" }],
                        bcc: chunk.map(email => ({ email })),
                        subject: subject,
                        htmlContent: htmlContent,
                        replyTo: { email: "contact@dropsiders.fr", name: "Dropsiders" }
                    };

                    const response = await fetch(brevoUrl, {
                        method: 'POST',
                        headers: { 'accept': 'application/json', 'api-key': BREVO_KEY, 'content-type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) results.push({ success: true, chunk: chunk.length });
                    else results.push({ success: false, error: await response.text() });
                }
                return new Response(JSON.stringify({ success: true, details: results }), { status: 200, headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: DELETE CONTENT ---
        if (path.endsWith('/delete') && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            try {
                const { id } = await request.json();
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                let FILE_PATH = '';
                let CONTENT_FILES = [];

                if (path.includes('/news')) {
                    FILE_PATH = 'src/data/news.json';
                    CONTENT_FILES = NEWS_CONTENT_FILES;
                } else if (path.includes('/recaps')) {
                    FILE_PATH = 'src/data/recaps.json';
                    CONTENT_FILES = RECAPS_CONTENT_FILES;
                } else if (path.includes('/agenda')) {
                    FILE_PATH = 'src/data/agenda.json';
                } else if (path.includes('/galerie')) {
                    FILE_PATH = 'src/data/galerie.json';
                }

                if (!FILE_PATH) return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400, headers });

                // 1. Delete Metadata
                const file = await fetchGitHubFile(FILE_PATH);
                if (!file) return new Response(JSON.stringify({ error: 'Error fetching metadata file' }), { status: 502, headers });

                const updatedData = file.content.filter(item => String(item.id) !== String(id));
                if (updatedData.length === file.content.length) {
                    return new Response(JSON.stringify({ error: 'Item not found in metadata' }), { status: 404, headers });
                }

                await saveGitHubFile(FILE_PATH, updatedData, `Delete content: ${id}`, file.sha);

                // 2. Delete Content (News/Recaps)
                if (CONTENT_FILES.length > 0) {
                    for (const cp of CONTENT_FILES) {
                        const cf = await fetchGitHubFile(cp);
                        if (cf) {
                            const newCfContent = cf.content.filter(item => String(item.id) !== String(id));
                            if (newCfContent.length !== cf.content.length) {
                                await saveGitHubFile(cp, newCfContent, `Delete content body: ${id}`, cf.sha);
                            }
                        }
                    }
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: SUBSCRIBERS --- (GET)
        if (path === '/api/subscribers' && request.method === 'GET') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            try {
                const file = await fetchGitHubFile(PATH);
                if (!file) {
                    // Empty file or error -> Return empty list to prevent frontend crash
                    return new Response(JSON.stringify([]), { status: 200, headers });
                }

                return new Response(JSON.stringify(file.content), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- STATIC ASSETS & FALLBACK ---

        if (path.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers });
        }

        if (env.ASSETS) {
            const response = await env.ASSETS.fetch(request);
            if (response.status === 404) return env.ASSETS.fetch(new URL('/index.html', request.url));
            return response;
        }

        return new Response("Not Found", { status: 404 });
    }
}
