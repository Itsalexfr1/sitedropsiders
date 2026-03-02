
// @ts-nocheck
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let path = url.pathname;
        if (path.endsWith('/') && path.length > 1) {
            path = path.slice(0, -1);
        }

        // Serve ads.txt directly for Google AdSense verification
        if (path === '/ads.txt') {
            const adsResponse = await env.ASSETS.fetch(request);
            if (adsResponse.ok) {
                return new Response(await adsResponse.text(), {
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        }

        // --- API: GEOLOCATION ---
        if (path === '/api/geo' && request.method === 'GET') {
            const country = request.headers.get('cf-ipcountry') || 'FR';
            return new Response(JSON.stringify({ country }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // --- API: DOWNLOADER PROXY ---
        if (path === '/api/downloader-proxy' && request.method === 'POST') {
            const body = await request.json();
            const targetUrl = body.url;
            const headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            };

            if (!targetUrl) return new Response(JSON.stringify({ error: 'URL requise' }), { status: 400, headers });

            // Extensive list of Cobalt v10+ instances (Community verified)
            // We rotate through these to find one that isn't rate-limited
            const instances = [
                'https://api.cobalt.tools/',
                'https://cobalt.pervage.me/',
                'https://cobalt.k69.ch/',
                'https://cobalt.v0.sh/',
                'https://cobalt.qwer.sh/',
                'https://cobalt.hotis.moe/',
                'https://cobalt.media/',
                'https://cobalt.im/',
                'https://co.wuk.sh/',
                'https://cobalt.onl/',
                'https://cobalt.sneaky.sh/',
                'https://cobalt.pablo.pw/',
                'https://api.cobalt.red/'
            ];

            // Shuffle instances slightly to distribute load
            const shuffled = [...instances].sort(() => Math.random() - 0.5);

            for (const instance of shuffled) {
                try {
                    const response = await fetch(instance, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        },
                        body: JSON.stringify({
                            url: targetUrl,
                            videoQuality: '1080',
                            downloadMode: 'auto'
                        }),
                        signal: AbortSignal.timeout(10000) // Increase to 10s timeout
                    });

                    if (response.ok) {
                        const text = await response.text();
                        if (text.trim().startsWith('{')) {
                            const data = JSON.parse(text);
                            if (data.url || data.picker || data.status === 'stream' || data.status === 'redirect' || data.status === 'picker') {
                                return new Response(JSON.stringify(data), { headers });
                            }
                        }
                    }
                } catch (e) {
                    continue; // Quietly try next instance
                }
            }

            // TikWM for TikTok as ultra-robust fallback
            if (targetUrl.includes('tiktok.com')) {
                try {
                    const tikResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`);
                    const tikData = await tikResponse.json();
                    if (tikData.data) {
                        return new Response(JSON.stringify({
                            status: 'success',
                            url: tikData.data.play,
                            title: tikData.data.title || 'TikTok Media'
                        }), { headers });
                    }
                } catch (e) { }
            }

            return new Response(JSON.stringify({
                status: 'error',
                text: 'Tous les serveurs sont temporairement occupés ou limités par Instagram. Réessayez dans quelques secondes ou avec un autre lien.'
            }), { status: 500, headers });
        }

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
        const PENDING_SUBMISSIONS_PATH = 'src/data/pending_submissions.json';
        const GALERIE_PATH = 'src/data/galerie.json';

        // CORS Headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password, X-Admin-Username, X-Google-Token, X-Session-ID',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // --- HELPER FUNCTIONS ---
        // --- HELPER FUNCTIONS ---
        const utf8Encode = (str) => {
            const bytes = new TextEncoder().encode(str);
            let binary = '';
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        };

        const utf8Decode = (base64) => {
            const binary = atob(base64.replace(/\s/g, ''));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new TextDecoder().decode(bytes);
        };

        async function fetchGitHubFile(filePath) {
            const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
            const response = await fetch(getUrl, {
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            });
            if (!response.ok) {
                if (response.status === 404) return { content: [], sha: null };
                return null;
            }
            const fileData = await response.json();

            let content;
            if (fileData.content) {
                content = utf8Decode(fileData.content);
            } else if (fileData.download_url) {
                const rawRes = await fetch(fileData.download_url, {
                    headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker' }
                });
                if (rawRes.ok) {
                    content = await rawRes.text();
                } else {
                    return null;
                }
            } else {
                return null;
            }

            try {
                // Recovery logic for double-encoded/mangled UTF-8 characters (common issues with JSON saves)
                if (content.includes('Ã') || content.includes('â') || content.includes('Â')) {
                    content = content
                        .replace(/Ã /g, 'à').replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è')
                        .replace(/Ãª/g, 'ê').replace(/Ã»/g, 'û').replace(/Ã´/g, 'ô')
                        .replace(/Ã®/g, 'î').replace(/Ã§/g, 'ç').replace(/Ã¹/g, 'ù')
                        .replace(/Ã«/g, 'ë').replace(/Ã¯/g, 'ï').replace(/Â /g, ' ')
                        .replace(/â€™/g, "'").replace(/â€¦/g, '...').replace(/Ã‚/g, '')
                        .replace(/Ã³/g, 'ó').replace(/Ã±/g, 'ñ').replace(/Ã‰/g, 'É')
                        .replace(/â€“/g, '-').replace(/Â«/g, '«').replace(/Â»/g, '»')
                        .replace(/Ã»/g, 'û').replace(/Ã€/g, 'À');
                }
                return { content: JSON.parse(content), sha: fileData.sha, rawData: fileData };
            } catch (e) {
                console.error("JSON Parse Error for " + filePath, e);
                return { content: [], sha: fileData.sha, rawData: fileData };
            }
        }

        async function saveGitHubFile(filePath, content, message, sha) {
            const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
            const encodedContent = utf8Encode(JSON.stringify(content, null, 2));
            const response = await fetch(putUrl, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, content: encodedContent, sha })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`GitHub Save Error (${filePath}): ${response.status} ${errText}`);
                return { ok: false, status: response.status, error: errText };
            }
            return { ok: true };
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
            // Remove social links blocks before extracting text for summary
            let cleanContent = content
                .replace(/<div[^>]*class="[^"]*artist-socials-premium[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '')
                .replace(/<div[^>]*class="[^"]*festival-socials-premium[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '')
                .replace(/SUIVEZ\s+[A-Z][^<]*/gi, '');
            const text = cleanContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (!text) return '';
            return text.substring(0, 200) + (text.length > 200 ? '...' : '');
        };

        const cleanStr = (str) => {
            if (!str) return str;
            // Handle recovery at string level if needed
            if (str.includes('Ã') || str.includes('â') || str.includes('Â')) {
                return str
                    .replace(/Ã /g, 'à').replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è')
                    .replace(/Ãª/g, 'ê').replace(/Ã»/g, 'û').replace(/Ã´/g, 'ô')
                    .replace(/Ã®/g, 'î').replace(/Ã§/g, 'ç').replace(/Ã¹/g, 'ù')
                    .replace(/Ã«/g, 'ë').replace(/Ã¯/g, 'ï').replace(/Â /g, ' ')
                    .replace(/â€™/g, "'").replace(/â€¦/g, '...').replace(/Ã‚/g, '')
                    .replace(/Ã³/g, 'ó').replace(/Ã±/g, 'ñ').replace(/Ã‰/g, 'É')
                    .replace(/â€“/g, '-').replace(/Â«/g, '«').replace(/Â»/g, '»')
                    .replace(/Ã»/g, 'û').replace(/Ã€/g, 'À');
            }
            return str;
        };

        // --- AUTH CHECK ---
        const adminPassword = env.ADMIN_PASSWORD || '2026';
        const requestPassword = request.headers.get('X-Admin-Password');
        let requestUsername = request.headers.get('X-Admin-Username') || '';

        const isAuthRoute = (
            path.startsWith('/api/news/create') ||
            path.startsWith('/api/recaps/create') ||
            (path.startsWith('/api/agenda/create') || (path === '/api/agenda' && request.method === 'POST')) ||
            path.startsWith('/api/galerie/create') ||
            path.startsWith('/api/newsletter/send') ||
            path.startsWith('/api/news/update') ||
            path.startsWith('/api/recaps/update') ||
            path.startsWith('/api/agenda/update') ||
            path.endsWith('/delete') ||
            path === '/api/subscribers' ||
            path === '/api/spotify/update' ||
            path === '/api/team/update' ||
            path === '/api/settings/update' ||
            path === '/api/shop/create' ||
            path === '/api/shop/update' ||
            path === '/api/photos/moderate' ||
            path === '/api/photos/pending' ||
            path === '/api/photos/delete' ||
            path === '/api/shop/delete' ||
            path === '/api/dashboard-actions/update' ||
            path.startsWith('/api/editors') ||
            path === '/api/auth/revoke-all' ||
            path.startsWith('/api/contacts') ||
            path.startsWith('/api/push/subscribe') ||
            path.startsWith('/api/push/unsubscribe') ||
            path === '/api/chat/clear' ||
            path === '/api/chat/delete' ||
            path === '/api/chat/ban' ||
            path === '/api/chat/unban' ||
            path === '/api/chat/banned' ||
            path === '/api/media/comment/delete' ||
            path === '/api/quiz/pending' ||
            path === '/api/quiz/moderate' ||
            path === '/api/covoit/delete' ||
            path === '/api/avis/moderate'
        );

        // --- API: PUSH NOTIFICATIONS ---
        if (path === '/api/push/subscribe' && request.method === 'POST') {
            const { subscription, favorites } = await request.json();
            if (!subscription || !subscription.endpoint) {
                return new Response(JSON.stringify({ error: 'Invalid subscription' }), { status: 400, headers });
            }
            if (env.CHAT_KV) {
                const subKey = `push_sub_${subscription.endpoint}`;
                await env.CHAT_KV.put(subKey, JSON.stringify({ subscription, favorites, timestamp: Date.now() }), { expirationTtl: 60 * 60 * 24 * 30 }); // 30 days
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/push/unsubscribe' && request.method === 'POST') {
            const { endpoint } = await request.json();
            if (env.CHAT_KV && endpoint) {
                await env.CHAT_KV.delete(`push_sub_${endpoint}`);
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }


        let authenticated = false;
        let userPermissions = [];

        if (isAuthRoute) {
            const requestSessionId = request.headers.get('X-Session-ID');

            if (requestPassword === adminPassword && (requestUsername === 'alex' || !requestUsername)) {
                const settingsFile = await fetchGitHubFile('src/data/settings.json');
                const serverSessionId = settingsFile?.content?.master_session_id || 'initial-session-id';

                // On autorise si le sessionId correspond
                if (requestSessionId === serverSessionId) {
                    authenticated = true;
                    userPermissions = ['all'];
                }
            }
            else if (requestUsername) {
                const editorsFile = await fetchGitHubFile(EDITORS_PATH);
                if (editorsFile && editorsFile.content) {
                    const editor = editorsFile.content.find(e => e.username === requestUsername && e.password === requestPassword);
                    if (editor) {
                        const serverSessionId = editor.session_id || 'editor-initial-id';
                        if (requestSessionId === serverSessionId) {
                            authenticated = true;
                            userPermissions = editor.permissions || [];
                        }
                    }
                }
            }

            if (!authenticated) {
                return new Response(JSON.stringify({ error: 'Accès non autorisé' }), { status: 401, headers });
            }

            // --- PERMISSION CHECKS ---
            const hasAll = userPermissions.includes('all');

            // Content (News, Recaps, etc)
            const isContentRoute = path.startsWith('/api/news') || path.startsWith('/api/recaps') ||
                path.startsWith('/api/agenda') || path.startsWith('/api/galerie');
            if (isContentRoute && !hasAll && !userPermissions.includes('publications')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : publications' }), { status: 403, headers });
            }

            // Shop
            if (path.includes('/api/shop') && !hasAll && !userPermissions.includes('shop')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : shop' }), { status: 403, headers });
            }

            // Newsletter
            if ((path.startsWith('/api/newsletter') || path === '/api/subscribers') && !hasAll && !userPermissions.includes('newsletter')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : newsletter' }), { status: 403, headers });
            }

            // Spotify
            if (path === '/api/spotify/update' && !hasAll && !userPermissions.includes('spotify')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : spotify' }), { status: 403, headers });
            }

            // Messages & Contacts
            if (path.startsWith('/api/contacts')) {
                // Accessing the messages list
                if (!hasAll && !userPermissions.includes('messages')) {
                    return new Response(JSON.stringify({ error: 'Permission refusée : messagerie' }), { status: 403, headers });
                }
                // Replying/Sending emails
                if (path === '/api/contacts/reply' && !hasAll && !userPermissions.includes('send_messages')) {
                    return new Response(JSON.stringify({ error: 'Permission refusée : envoi de messages' }), { status: 403, headers });
                }
            }

            // Dashboard Actions
            if (path === '/api/dashboard-actions/update' && !hasAll) {
                return new Response(JSON.stringify({ error: 'Permission refusée : administrateur requis' }), { status: 403, headers });
            }

            // Editors Management: only Alex
            if (path.startsWith('/api/editors') && requestUsername !== 'alex') {
                return new Response(JSON.stringify({ error: "Accès réservé à l'administrateur" }), { status: 403, headers });
            }
        }

        // --- DEPLOY: Trigger GitHub Actions workflow_dispatch ---
        if (path === '/api/deploy' && request.method === 'POST') {
            // Only alex can trigger a deploy
            if ((requestUsername !== 'alex' && requestUsername !== 'contact@dropsiders.fr') || requestPassword !== adminPassword) {
                return new Response(JSON.stringify({ error: 'Accès réservé à l\'administrateur principal' }), { status: 403, headers });
            }

            const body = await request.json().catch(() => ({}));
            const reason = (body as any).reason || 'Mise en ligne manuelle depuis admin';

            // Trigger workflow_dispatch on GitHub Actions
            const workflowUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/build.yml/dispatches`;
            const triggerResponse = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'User-Agent': 'Cloudflare-Worker',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: { reason: reason + ` (par ${requestUsername})` }
                })
            });

            if (!triggerResponse.ok) {
                const errText = await triggerResponse.text();
                return new Response(JSON.stringify({ error: 'Erreur lors du déclenchement du déploiement', detail: errText }), { status: 500, headers });
            }

            // Wait a moment then fetch the latest run info
            await new Promise(resolve => setTimeout(resolve, 2000));
            const runsUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs?per_page=1&event=workflow_dispatch`;
            const runsResponse = await fetch(runsUrl, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'User-Agent': 'Cloudflare-Worker',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            let runInfo = null;
            if (runsResponse.ok) {
                const runsData = await runsResponse.json();
                runInfo = runsData.workflow_runs?.[0] || null;
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Déploiement déclenché avec succès !',
                runId: runInfo?.id,
                runUrl: runInfo?.html_url,
                status: runInfo?.status || 'queued',
                triggeredAt: new Date().toISOString()
            }), { status: 200, headers });
        }

        // --- DEPLOY STATUS: Check GitHub Actions run status ---
        if (path === '/api/deploy/status' && request.method === 'GET') {
            const runId = url.searchParams.get('runId');
            if (!runId) {
                return new Response(JSON.stringify({ error: 'runId requis' }), { status: 400, headers });
            }
            const runUrl = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${runId}`;
            const runResponse = await fetch(runUrl, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'User-Agent': 'Cloudflare-Worker',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!runResponse.ok) {
                return new Response(JSON.stringify({ error: 'Run introuvable' }), { status: 404, headers });
            }
            const runData = await runResponse.json();
            return new Response(JSON.stringify({
                status: runData.status,
                conclusion: runData.conclusion,
                runUrl: runData.html_url,
                updatedAt: runData.updated_at
            }), { status: 200, headers });
        }

        if (path === '/api/news' && request.method === 'GET') {
            const FILE_PATH = 'src/data/news.json';
            const file = await fetchGitHubFile(FILE_PATH);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/recaps' && request.method === 'GET') {
            const FILE_PATH = 'src/data/recaps.json';
            const file = await fetchGitHubFile(FILE_PATH);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/agenda' && request.method === 'GET') {
            const FILE_PATH = 'src/data/agenda.json';
            const file = await fetchGitHubFile(FILE_PATH);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/galerie' && request.method === 'GET') {
            const FILE_PATH = 'src/data/galerie.json';
            const file = await fetchGitHubFile(FILE_PATH);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        // --- API: LOGIN ---
        if (path === '/api/login' && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                if ((username === 'alex' || username === 'contact@dropsiders.fr') && password === adminPassword) {
                    const settingsFile = await fetchGitHubFile('src/data/settings.json');
                    const sessionId = settingsFile?.content?.master_session_id || 'initial-session-id';
                    return new Response(JSON.stringify({ success: true, user: username, permissions: ['all'], sessionId }), { status: 200, headers });
                }

                const editorsFile = await fetchGitHubFile(EDITORS_PATH);
                if (editorsFile && editorsFile.content) {
                    const editor = editorsFile.content.find(e => e.username === username && e.password === password);
                    if (editor) {
                        return new Response(JSON.stringify({
                            success: true,
                            user: username,
                            permissions: editor.permissions || [],
                            sessionId: editor.session_id || 'editor-initial-id'
                        }), { status: 200, headers });
                    }
                }
                return new Response(JSON.stringify({ error: 'Identifiants incorrects' }), { status: 401, headers });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Erreur login' }), { status: 500, headers });
            }
        }

        if (path === '/api/auth/revoke-all' && request.method === 'POST') {
            try {
                const body = await request.json().catch(() => ({}));
                const targetUsername = body.targetUsername;

                // Robust ID generation
                let newSessionId;
                try {
                    newSessionId = crypto.randomUUID();
                } catch (e) {
                    newSessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
                }

                const userToRevoke = targetUsername || requestUsername;

                if (!userToRevoke) {
                    return new Response(JSON.stringify({ error: 'Utilisateur non identifié' }), { status: 400, headers });
                }

                // Permission check: only alex can revoke others
                if (targetUsername && targetUsername !== requestUsername && requestUsername !== 'alex') {
                    return new Response(JSON.stringify({ error: 'Permission refusée' }), { status: 403, headers });
                }

                let saved = { ok: true };

                if (userToRevoke === 'alex' || userToRevoke === 'contact@dropsiders.fr') {
                    const settingsFile = await fetchGitHubFile('src/data/settings.json');
                    if (settingsFile) {
                        settingsFile.content.master_session_id = newSessionId;
                        saved = await saveGitHubFile('src/data/settings.json', settingsFile.content, 'Revoke all sessions (Alex)', settingsFile.sha);
                    } else {
                        return new Response(JSON.stringify({ error: 'Fichier settings introuvable' }), { status: 404, headers });
                    }
                } else {
                    const editorsFile = await fetchGitHubFile(EDITORS_PATH);
                    if (editorsFile && editorsFile.content) {
                        const index = editorsFile.content.findIndex(e => e.username === userToRevoke);
                        if (index !== -1) {
                            editorsFile.content[index].session_id = newSessionId;
                            saved = await saveGitHubFile(EDITORS_PATH, editorsFile.content, `Revoke all sessions (${userToRevoke})`, editorsFile.sha);
                        } else {
                            return new Response(JSON.stringify({ error: 'Éditeur introuvable' }), { status: 404, headers });
                        }
                    } else {
                        return new Response(JSON.stringify({ error: 'Fichier éditeurs introuvable' }), { status: 404, headers });
                    }
                }

                if (!saved.ok) {
                    return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde GitHub' }), { status: 500, headers });
                }

                return new Response(JSON.stringify({ success: true, sessionId: newSessionId }), { status: 200, headers });
            } catch (err) {
                console.error('Revoke Error:', err);
                return new Response(JSON.stringify({ error: 'Erreur interne lors de la révocation' }), { status: 500, headers });
            }
        }

        // --- API: EDITORS MANAGEMENT ---
        if (path === '/api/editors' && request.method === 'GET') {
            const editors = await fetchGitHubFile(EDITORS_PATH) || { content: [] };
            return new Response(JSON.stringify(editors.content), { status: 200, headers });
        }

        if (path === '/api/editors/create' && request.method === 'POST') {
            const { username, password, name, permissions } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH) || { content: [], sha: null };
            const updated = [...file.content, { username, password, name, permissions: permissions || [], created: new Date().toISOString() }];
            const saved = await saveGitHubFile(EDITORS_PATH, updated, `Add editor: ${username}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/editors/delete' && request.method === 'POST') {
            const { username } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
            const updated = file.content.filter(e => e.username !== username);
            const saved = await saveGitHubFile(EDITORS_PATH, updated, `Remove editor: ${username}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/editors/update' && request.method === 'POST') {
            const { username, password, name, permissions } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const index = file.content.findIndex(e => e.username === username);
            if (index === -1) return new Response(JSON.stringify({ error: 'Editor not found' }), { status: 404, headers });

            const updatedEditor = { ...file.content[index], name, permissions };
            if (password) {
                updatedEditor.password = password;
            }

            file.content[index] = updatedEditor;
            const saved = await saveGitHubFile(EDITORS_PATH, file.content, `Update editor: ${username}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: SPOTIFY MANAGEMENT ---
        if (path === '/api/spotify' && request.method === 'GET') {
            const SPOTIFY_PATH = 'src/data/spotify.json';
            const file = await fetchGitHubFile(SPOTIFY_PATH);
            if (!file) return new Response(JSON.stringify([]), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/spotify/update' && request.method === 'POST') {
            const SPOTIFY_PATH = 'src/data/spotify.json';
            const { playlists } = await request.json();
            const file = await fetchGitHubFile(SPOTIFY_PATH) || { content: [], sha: null };
            const saved = await saveGitHubFile(SPOTIFY_PATH, playlists, `Update Spotify playlists`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: TEAM MANAGEMENT ---
        if (path === '/api/team' && request.method === 'GET') {
            const TEAM_PATH = 'src/data/team.json';
            const file = await fetchGitHubFile(TEAM_PATH);
            if (!file) return new Response(JSON.stringify([]), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/team/update' && request.method === 'POST') {
            const TEAM_PATH = 'src/data/team.json';
            const { members } = await request.json();
            const file = await fetchGitHubFile(TEAM_PATH) || { content: [], sha: null };
            const saved = await saveGitHubFile(TEAM_PATH, members, `Update Team members`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: CHAT MESSAGES (using KV for real-time sharing) ---
        const getChatKey = (channel) => channel ? `chat_messages_${channel}` : 'chat_messages';
        const getBannedKey = () => 'chat_banned_ips';
        const getViewersKey = (channel) => channel ? `chat_viewers_${channel}` : 'chat_viewers';

        // Ping endpoint: called by every page visitor to register presence
        if (path === '/api/chat/ping' && request.method === 'POST') {
            const body = await request.json();
            const channel = body.channel;
            const id = (body.pseudo || 'anon-' + Math.random().toString(36).substr(2, 8)).toUpperCase().substring(0, 30);
            if (env.CHAT_KV) {
                const key = getViewersKey(channel);
                const rawViewers = await env.CHAT_KV.get(key);
                const viewers = rawViewers ? JSON.parse(rawViewers) : {};
                viewers[id] = Date.now();
                // Clean up pings older than 45 seconds
                const now = Date.now();
                const cleaned = Object.fromEntries(
                    Object.entries(viewers).filter(([, ts]) => (now - Number(ts)) < 45000)
                );
                await env.CHAT_KV.put(key, JSON.stringify(cleaned), { expirationTtl: 60 });
                return new Response(JSON.stringify({ count: Object.keys(cleaned).length }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ count: 0 }), { status: 200, headers });
        }

        if (path === '/api/chat/viewers' && request.method === 'GET') {
            const channel = url.searchParams.get('channel');
            if (env.CHAT_KV) {
                const key = getViewersKey(channel);
                const rawViewers = await env.CHAT_KV.get(key);
                const viewers = rawViewers ? JSON.parse(rawViewers) : {};
                const now = Date.now();
                const active = Object.entries(viewers).filter(([, ts]) => (now - Number(ts)) < 45000);
                return new Response(JSON.stringify({ count: active.length }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ count: 0 }), { status: 200, headers });
        }



        if (path === '/api/chat/messages' && request.method === 'GET') {
            const channel = url.searchParams.get('channel');
            const key = getChatKey(channel);
            const raw = env.CHAT_KV ? await env.CHAT_KV.get(key) : null;
            const messages = raw ? JSON.parse(raw) : [];
            return new Response(JSON.stringify(messages), { status: 200, headers });
        }

        if (path === '/api/chat/messages' && request.method === 'POST') {
            const body = await request.json();
            const { pseudo, country, message, color, channel } = body;
            if (!pseudo || !message) {
                return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
            }
            // Check ban list
            if (env.CHAT_KV) {
                const rawBans = await env.CHAT_KV.get(getBannedKey());
                const banned = rawBans ? JSON.parse(rawBans) : [];
                if (banned.includes(pseudo.toUpperCase())) {
                    return new Response(JSON.stringify({ error: 'Banned' }), { status: 403, headers });
                }
            }
            const key = getChatKey(channel);
            const raw = env.CHAT_KV ? await env.CHAT_KV.get(key) : null;
            const messages = raw ? JSON.parse(raw) : [];
            const newMsg = {
                id: Date.now(),
                pseudo: pseudo.toUpperCase(),
                country: country || 'FR',
                message: message.substring(0, 500),
                color: color || '#ffffff',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            };
            messages.push(newMsg);

            // --- BOT LOGIC ---
            const botResponse = async (text) => {
                const botMsg = {
                    id: Date.now() + 1,
                    pseudo: 'DROPSIDERS BOT',
                    country: 'FR',
                    message: text,
                    color: '#00ffcc', // Cyberpunk Mint
                    isBot: true,
                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                };
                messages.push(botMsg);
            };

            const cmd = message.trim().toLowerCase();
            if (cmd.startsWith('!')) {
                if (cmd === '!help' || cmd === '!commands') {
                    await botResponse('🤖 Liste des commandes : !lineup, !shop, !shazam, !news, !id, !vote');
                } else if (cmd === '!vote') {
                    await botResponse('📊 Pour voter au sondage actuel, envoie simplement le chiffre correspondant à ton choix dans le chat (ex: 1, 2, 3...)');
                } else if (cmd === '!lineup' || cmd === '!planning') {
                    const settingsFile = await fetchGitHubFile('src/data/settings.json');
                    const lineup = settingsFile?.content?.takeover?.lineup || 'Aucun planning configuré.';
                    await botResponse('📅 PLANNING LIVE :\n' + lineup.substring(0, 300));
                } else if (cmd === '!shop' || cmd === '!boutique') {
                    const shopFile = await fetchGitHubFile('src/data/shop.json');
                    const products = shopFile?.content?.products || [];
                    if (products.length > 0) {
                        const random = products[Math.floor(Math.random() * products.length)];
                        await botResponse(`🛍️ SHOP : ${random.name} - ${random.price}€\nLien : https://shop.dropsiders.fr`);
                    } else {
                        await botResponse('🛍️ La boutique est disponible sur shop.dropsiders.fr');
                    }
                } else if (cmd === '!shazam' || cmd === '!musique') {
                    await botResponse('🎵 Utilisez le bouton Shazam (icône bleue) pour identifier le titre actuel !');
                } else if (cmd === '!news' || cmd === '!actu') {
                    const newsFile = await fetchGitHubFile('src/data/news.json');
                    const latest = newsFile?.content?.[0];
                    if (latest) {
                        await botResponse(`🔥 DERNIÈRE ACTU : ${latest.title}\nLien : https://dropsiders.fr/news/${latest.id}`);
                    }
                } else if (cmd === '!id') {
                    const settingsFile = await fetchGitHubFile('src/data/settings.json');
                    await botResponse(`📺 YOUTUBE ID : ${settingsFile?.content?.takeover?.youtubeId || 'N/A'}`);
                }
            }

            // Keep last 200 messages
            const trimmed = messages.slice(-200);
            if (env.CHAT_KV) {
                await env.CHAT_KV.put(key, JSON.stringify(trimmed), { expirationTtl: 86400 });
            }
            return new Response(JSON.stringify(newMsg), { status: 200, headers });
        }

        if (path === '/api/chat/delete' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { id, channel } = await request.json();
            if (env.CHAT_KV) {
                const key = getChatKey(channel);
                const raw = await env.CHAT_KV.get(key);
                const messages = raw ? JSON.parse(raw) : [];
                const filtered = messages.filter(m => m.id !== id);
                await env.CHAT_KV.put(key, JSON.stringify(filtered), { expirationTtl: 86400 });
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/chat/ban' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { pseudo, channel } = await request.json();
            if (env.CHAT_KV) {
                const banKey = getBannedKey();
                const rawBans = await env.CHAT_KV.get(banKey);
                const banned = rawBans ? JSON.parse(rawBans) : [];
                if (!banned.includes(pseudo.toUpperCase())) {
                    banned.push(pseudo.toUpperCase());
                    await env.CHAT_KV.put(banKey, JSON.stringify(banned), { expirationTtl: 604800 });
                }
                // Also remove their messages from CURRENT channel
                const key = getChatKey(channel);
                const raw = await env.CHAT_KV.get(key);
                const messages = raw ? JSON.parse(raw) : [];
                const filtered = messages.filter(m => m.pseudo !== pseudo.toUpperCase());
                await env.CHAT_KV.put(key, JSON.stringify(filtered), { expirationTtl: 86400 });
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/chat/unban' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { pseudo } = await request.json();
            if (env.CHAT_KV) {
                const banKey = getBannedKey();
                const rawBans = await env.CHAT_KV.get(banKey);
                const banned = rawBans ? JSON.parse(rawBans) : [];
                const newBanned = banned.filter(u => u !== pseudo.toUpperCase());
                await env.CHAT_KV.put(banKey, JSON.stringify(newBanned), { expirationTtl: 604800 });
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/chat/banned' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const banKey = getBannedKey();
            const rawBans = env.CHAT_KV ? await env.CHAT_KV.get(banKey) : null;
            const banned = rawBans ? JSON.parse(rawBans) : [];
            return new Response(JSON.stringify(banned), { status: 200, headers });
        }

        if (path === '/api/chat/clear' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { channel } = await request.json();
            if (env.CHAT_KV) {
                const key = getChatKey(channel);
                await env.CHAT_KV.put(key, JSON.stringify([]), { expirationTtl: 86400 });
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        // --- API: AUDIO ROOMS ---
        if (path === '/api/audio/create' && request.method === 'POST') {
            const body = await request.json();
            const { name, host, channel } = body;
            if (!name || !host) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

            const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
            const roomData = { id: roomId, name, host, channel, created: Date.now(), members: 1 };

            if (env.CHAT_KV) {
                // Store room details
                await env.CHAT_KV.put(`audio_room_${roomId}`, JSON.stringify(roomData), { expirationTtl: 14400 });
                // Add to active rooms list for the channel
                const listKey = `audio_rooms_${channel || 'general'}`;
                const rawList = await env.CHAT_KV.get(listKey);
                const list = rawList ? JSON.parse(rawList) : [];
                list.push(roomData);
                // Clean up old rooms in list (older than 4h)
                const now = Date.now();
                const filtered = list.filter(r => (now - r.created) < 14400000);
                await env.CHAT_KV.put(listKey, JSON.stringify(filtered), { expirationTtl: 14400 });
            }
            return new Response(JSON.stringify(roomData), { status: 200, headers });
        }

        if (path === '/api/audio/rooms' && request.method === 'GET') {
            const channel = url.searchParams.get('channel') || 'general';
            if (env.CHAT_KV) {
                const listKey = `audio_rooms_${channel}`;
                const rawList = (await env.CHAT_KV.get(listKey)) || '[]';
                const list: any[] = JSON.parse(rawList);
                const now = Date.now();
                const filtered = list.filter(r => (now - (r.created || 0)) < 14400000);
                return new Response(JSON.stringify(filtered), { status: 200, headers });
            }
            return new Response(JSON.stringify([]), { status: 200, headers });
        }

        if (path === '/api/audio/join' && (request.method === 'POST' || request.method === 'GET')) {
            const roomId = url.searchParams.get('id');
            const channel = url.searchParams.get('channel') || 'general';
            if (!roomId) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

            if (env.CHAT_KV) {
                const listKey = `audio_rooms_${channel}`;
                const rawList = (await env.CHAT_KV.get(listKey)) || '[]';
                const list: any[] = JSON.parse(rawList);
                const idx = list.findIndex(r => r.id === roomId.toUpperCase());
                if (idx !== -1) {
                    list[idx].members = (list[idx].members || 1) + 1;
                    await env.CHAT_KV.put(listKey, JSON.stringify(list), { expirationTtl: 14400 });
                    return new Response(JSON.stringify({ success: true, room: list[idx] }), { status: 200, headers });
                }
                return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404, headers });
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        // --- API: SETTINGS MANAGEMENT ---

        if (path === '/api/settings' && request.method === 'GET') {
            const SETTINGS_PATH = 'src/data/settings.json';
            const file = await fetchGitHubFile(SETTINGS_PATH);
            if (!file) return new Response(JSON.stringify({ shop_enabled: false }), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/settings/takeover' && request.method === 'GET') {
            const SETTINGS_PATH = 'src/data/settings.json';
            const file = await fetchGitHubFile(SETTINGS_PATH);
            if (!file || !file.content.takeover) return new Response(JSON.stringify({ enabled: false }), { status: 200, headers });
            return new Response(JSON.stringify(file.content.takeover), { status: 200, headers });
        }

        if (path === '/api/settings/update' && request.method === 'POST') {
            const SETTINGS_PATH = 'src/data/settings.json';
            const settings = await request.json();
            const file = await fetchGitHubFile(SETTINGS_PATH) || { content: { shop_enabled: false }, sha: null };
            const saved = await saveGitHubFile(SETTINGS_PATH, settings, `Update site settings`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: HOME LAYOUT MANAGEMENT ---
        if (path === '/api/home-layout' && request.method === 'GET') {
            const LAYOUT_PATH = 'src/data/home_layout.json';
            const file = await fetchGitHubFile(LAYOUT_PATH);
            if (!file) {
                const defaultLayout = [
                    { "id": "hero", "enabled": true },
                    { "id": "news_grid", "enabled": true },
                    { "id": "recap_agenda_grid", "enabled": true },
                    { "id": "interviews", "enabled": true },
                    { "id": "social_grid", "enabled": true },
                    { "id": "spotify", "enabled": true }
                ];
                return new Response(JSON.stringify(defaultLayout), { status: 200, headers });
            }
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/home-layout/update' && request.method === 'POST') {
            const LAYOUT_PATH = 'src/data/home_layout.json';
            const { layout } = await request.json();
            const file = await fetchGitHubFile(LAYOUT_PATH) || { content: [], sha: null };
            const saved = await saveGitHubFile(LAYOUT_PATH, layout, `Update Home layout`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: DASHBOARD ACTIONS MANAGEMENT ---
        if (path === '/api/dashboard-actions' && request.method === 'GET') {
            const ACTIONS_PATH = 'src/data/dashboard_actions.json';
            const file = await fetchGitHubFile(ACTIONS_PATH);
            if (!file) return new Response(JSON.stringify([]), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/dashboard-actions/update' && request.method === 'POST') {
            const ACTIONS_PATH = 'src/data/dashboard_actions.json';
            const { actions } = await request.json();
            const file = await fetchGitHubFile(ACTIONS_PATH) || { content: [], sha: null };
            const saved = await saveGitHubFile(ACTIONS_PATH, actions, `Update Dashboard actions order`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: SHOP PRODUCTS MANAGEMENT ---

        if (path === '/api/shop' && request.method === 'GET') {
            const SHOP_PATH = 'src/data/shop.json';
            const file = await fetchGitHubFile(SHOP_PATH) || { content: { products: [] } };
            return new Response(JSON.stringify(file.content.products), { status: 200, headers });
        }

        if (path === '/api/shop/create' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const product = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH) || { content: { products: [] }, sha: null };

            const maxId = file.content.products.reduce((max, p) => (p.id > max ? p.id : max), 0);
            const newProduct = { ...product, id: maxId + 1, createdAt: new Date().toISOString() };

            const updated = { ...file.content, products: [newProduct, ...file.content.products] };
            const saved = await saveGitHubFile(SHOP_PATH, updated, `Add shop product: ${product.name}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/shop/update' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const { id, updates } = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const products = file.content.products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
            const updated = { ...file.content, products };
            const saved = await saveGitHubFile(SHOP_PATH, updated, `Update shop product: ${id}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error, product: products.find(p => p.id === id) }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/shop/delete' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const { id } = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const updated = { ...file.content, products: file.content.products.filter(p => p.id !== id) };
            const saved = await saveGitHubFile(SHOP_PATH, updated, `Delete shop product: ${id}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/clips' && request.method === 'GET') {
            const CLIPS_PATH = 'src/data/clips.json';
            const file = await fetchGitHubFile(CLIPS_PATH);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/clips/create' && request.method === 'POST') {
            const CLIPS_PATH = 'src/data/clips.json';
            const clip = await request.json();
            const file = await fetchGitHubFile(CLIPS_PATH) || { content: [], sha: null };
            const updated = [clip, ...file.content];
            const saved = await saveGitHubFile(CLIPS_PATH, updated.slice(0, 200), `Add clip: ${clip.id}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/clips/delete' && request.method === 'POST') {
            const CLIPS_PATH = 'src/data/clips.json';
            const { id } = await request.json();
            const file = await fetchGitHubFile(CLIPS_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
            const updated = file.content.filter(c => c.id !== id);
            const saved = await saveGitHubFile(CLIPS_PATH, updated, `Delete clip: ${id}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/shop/reorder' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const { products } = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const updated = { ...file.content, products };
            const saved = await saveGitHubFile(SHOP_PATH, updated, 'Reorder shop products', file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path.endsWith('/reorder') && request.method === 'POST') {
            const type = path.split('/')[2];
            const { items } = await request.json();
            const FILE_PATH = `src/data/${type}.json`;
            const file = await fetchGitHubFile(FILE_PATH);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const saved = await saveGitHubFile(FILE_PATH, items, `Reorder ${type}`, file.sha);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path.startsWith('/uploads/') && request.method === 'GET') {
            const key = path.replace('/uploads/', '');
            if (env.R2) {
                const object = await env.R2.get(key);
                if (object === null) return new Response('Not Found', { status: 404 });
                const headers = new Headers();
                object.writeHttpMetadata(headers);
                headers.set('etag', object.httpEtag);
                headers.set('Access-Control-Allow-Origin', '*');
                return new Response(object.body, { headers });
            }
        }

        if (path === '/api/upload' && request.method === 'POST') {
            const { filename, content, type } = await request.json();
            if (!filename || !content) return new Response(JSON.stringify({ error: 'Data missing' }), { status: 400, headers });

            // --- OPTION 0: CLOUDFLARE R2 (New Primary) ---
            if (env.R2) {
                try {
                    // Convert base64 to ArrayBuffer
                    const base64Str = content.split(',')[1] || content;
                    const byteCharacters = atob(base64Str);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);

                    // Generate Unique Hash based on content (Deduplication)
                    const hashBuffer = await crypto.subtle.digest('SHA-256', byteArray);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                    // Keep original extension
                    const extension = filename.split('.').pop() || 'jpg';
                    const key = `${hashHex}.${extension}`;

                    await env.R2.put(key, byteArray, {
                        httpMetadata: { contentType: type || 'image/jpeg' }
                    });

                    const url = `https://${urlHost}/uploads/${key}`;
                    return new Response(JSON.stringify({ success: true, url }), { status: 200, headers });
                } catch (e) {
                    console.error('R2 Upload Error:', e);
                }
            }

            const IMGBB_KEY = env.IMGBB_API_KEY;

            // --- OPTION 1: IMGBB (Primary Alternative) ---
            if (IMGBB_KEY) {
                try {
                    const imgbbUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`;
                    const formData = new FormData();

                    // ImgBB accepts base64 content directly or as a file
                    const base64Data = content.split(',')[1] || content;
                    formData.append('image', base64Data);

                    const response = await fetch(imgbbUrl, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            return new Response(JSON.stringify({ success: true, url: data.data.url }), { status: 200, headers });
                        }
                    } else {
                        const err = await response.text();
                        console.error('ImgBB Upload Error:', err);
                    }
                } catch (e) {
                    console.error('ImgBB error, falling back...', e);
                }
            }

            // --- OPTION 2: GITHUB (Fallback) ---
            const UPLOAD_PATH = `public/uploads/${Date.now()}-${filename}`;
            const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${UPLOAD_PATH}`;

            const response = await fetch(putUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'User-Agent': 'Cloudflare-Worker',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Upload image: ${filename}`,
                    content: content.split(',')[1] || content // Support base64 with or without prefix
                })
            });

            if (response.ok) {
                const url = `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@main/${UPLOAD_PATH}`;
                return new Response(JSON.stringify({ success: true, url }), { status: 200, headers });
            } else {
                const err = await response.text();
                return new Response(JSON.stringify({ success: false, error: err }), { status: 500, headers });
            }
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

                const saved = await saveGitHubFile(PATH, updatedData, `Nouvel abonné : ${email}`, file.sha);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
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

                const saved = await saveGitHubFile(PATH, updatedData, `Désinscription : ${email}`, file.sha);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error updating: ' + saved.error }), { status: 500, headers });
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
                const { title, date, summary, content, image, category, isFeatured, isFocus, author, youtubeId: bodyYoutubeId, showVideo, year, sendPush } = body;
                if (!title || !content) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });

                // 1. Update news.json (Metadata only)
                const newsFile = await fetchGitHubFile(NEWS_PATH) || { content: [], sha: null };
                let currentNews = newsFile.content;

                // Handle exclusive featured logic: if new is featured, others lose it
                if (isFeatured) {
                    currentNews = currentNews.map(item => ({ ...item, isFeatured: false }));
                }

                const maxId = currentNews.reduce((max, item) => (item.id > max ? item.id : max), 0);
                const newId = maxId + 1;

                const { images, youtubeId: extractedYoutubeId } = extractMetadata(content);

                const newArticle = {
                    id: newId,
                    title: cleanStr(title),
                    date: date || new Date().toISOString().split('T')[0],
                    summary: cleanStr(generateSummary(content, summary)),
                    content: '', // Empty in main file to save space
                    image: image || (images.length > 0 ? images[0] : ''),
                    images: images,
                    youtubeId: bodyYoutubeId || extractedYoutubeId || '',
                    showVideo: showVideo !== false,
                    category: category || 'News',
                    isFeatured: isFeatured || false,
                    isFocus: isFocus || false,
                    year: year || undefined,
                    link: `https://dropsiders.eu/news/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                    author: author || requestUsername || 'Alex'
                };

                const updatedNews = [newArticle, ...currentNews];
                const metaSaved = await saveGitHubFile(NEWS_PATH, updatedNews, `Add news: ${title}`, newsFile.sha);
                if (!metaSaved.ok) return new Response(JSON.stringify({ error: 'Error saving metadata: ' + metaSaved.error }), { status: 500, headers });

                // 2. Save Content to separated file
                const contentFile = await fetchGitHubFile(NEWS_CONTENT_TARGET);
                if (contentFile) {
                    const newContentItem = { id: newId, content: content };
                    const updatedContentFile = [...contentFile.content, newContentItem];
                    await saveGitHubFile(NEWS_CONTENT_TARGET, updatedContentFile, `Add news content: ${newId}`, contentFile.sha);
                }

                if (sendPush) {
                    ctx.waitUntil((async () => {
                        try {
                            const list = await env.CHAT_KV.list({ prefix: 'push_sub_' });
                            for (const key of list.keys) {
                                const subRaw = await env.CHAT_KV.get(key.name);
                                if (!subRaw) continue;
                                const { subscription } = JSON.parse(subRaw);

                                // This is where we would call a Push Service (OneSignal, web-push, etc.)
                                // If we have OneSignal keys in env, we use them
                                if (env.ONESIGNAL_APP_ID && env.ONESIGNAL_API_KEY) {
                                    await fetch('https://onesignal.com/api/v1/notifications', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Basic ${env.ONESIGNAL_API_KEY}`
                                        },
                                        body: JSON.stringify({
                                            app_id: env.ONESIGNAL_APP_ID,
                                            contents: { "fr": `NOUVEL ARTICLE : ${title}`, "en": `NEW ARTICLE : ${title}` },
                                            headings: { "fr": "Dropsiders News", "en": "Dropsiders News" },
                                            url: newArticle.link,
                                            // Sending to specific subscription endpoint (approximation)
                                            include_subscription_ids: [subscription.endpoint.split('/').pop()]
                                        })
                                    });
                                }
                                // Log push attempt
                                console.log(`Triggering push for ${subscription.endpoint} - article: ${title}`);
                            }
                        } catch (pushErr) {
                            console.error('Push broadcast error:', pushErr);
                        }
                    })());
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
                const { title, date, summary, content, image, festival, location, country, youtubeId, category, isFeatured, author, showVideo, year } = body;
                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                // 1. Update recaps.json
                const recapsFile = await fetchGitHubFile(FILE_PATH) || { content: [], sha: null };
                let currentData = recapsFile.content;

                // Handle exclusive featured logic: if new is featured, others lose it
                if (isFeatured) {
                    currentData = currentData.map(item => ({ ...item, isFeatured: false }));
                }

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
                    country: country || '',
                    category: category || 'Recaps',
                    isFeatured: isFeatured || false,
                    showVideo: showVideo !== false,
                    year: year || undefined,
                    link: `https://dropsiders.eu/recaps/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                    images: extractedImages,
                    author: author || requestUsername || 'Alex'
                };

                const updatedData = [newItem, ...currentData];
                const metaSaved = await saveGitHubFile(FILE_PATH, updatedData, `Add recap: ${title}`, recapsFile.sha);
                if (!metaSaved.ok) return new Response(JSON.stringify({ error: 'Error saving metadata: ' + metaSaved.error }), { status: 500, headers });

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
                const { id, title, summary, content, image, category, date, isFeatured, isFocus, author, youtubeId: bodyYoutubeId, showVideo: bodyShowVideo, year, sendPush } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                // 1. Update Metadata
                const newsFile = await fetchGitHubFile(FILE_PATH);
                if (!newsFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                let currentData = newsFile.content;

                // Handle exclusive featured logic: if updated item becomes featured, others lose it
                if (isFeatured) {
                    currentData = currentData.map(item => ({ ...item, isFeatured: false }));
                }
                const index = currentData.findIndex(item => String(item.id) === String(id));
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const { images, youtubeId: extractedYoutubeId } = extractMetadata(content || '');

                const existing = currentData[index];
                currentData[index] = {
                    ...existing,
                    title: cleanStr(title) || existing.title,
                    summary: cleanStr(generateSummary(content, summary)) || existing.summary,
                    content: '', // Always keep empty in main file
                    image: image || existing.image,
                    images: images.length > 0 ? images : existing.images,
                    youtubeId: bodyYoutubeId !== undefined ? bodyYoutubeId : (extractedYoutubeId || existing.youtubeId),
                    showVideo: bodyShowVideo !== undefined ? bodyShowVideo : existing.showVideo,
                    category: category || existing.category,
                    date: date || existing.date,
                    isFeatured: isFeatured !== undefined ? isFeatured : existing.isFeatured,
                    isFocus: isFocus !== undefined ? isFocus : existing.isFocus,
                    year: year !== undefined ? (year || undefined) : existing.year,
                    author: author || existing.author || requestUsername || 'Alex'
                };

                await saveGitHubFile(FILE_PATH, currentData, `Update news: ${title || existing.title}`, newsFile.sha);

                // 2. Update Content (Search in all content files)
                // If content is provided, we need to find where it is and update it
                if (content) {
                    let contentUpdated = false;
                    for (const filePath of NEWS_CONTENT_FILES) {
                        const cFile = await fetchGitHubFile(filePath);
                        if (cFile) {
                            const cIndex = cFile.content.findIndex((item: any) => String(item.id) === String(id));
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
                const { id, title, summary, content, image, date, festival, location, country, youtubeId, isFeatured, author, showVideo, year } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                // 1. Update Metadata
                const recapsFile = await fetchGitHubFile(FILE_PATH);
                if (!recapsFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                let currentData = recapsFile.content;

                // Handle exclusive featured logic: if updated item becomes featured, others lose it
                if (isFeatured) {
                    currentData = currentData.map(item => ({ ...item, isFeatured: false }));
                }
                const index = currentData.findIndex(item => String(item.id) === String(id));
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const { images: extractedImages, youtubeId: extractedYoutubeId } = extractMetadata(content || '');

                const existing = currentData[index];
                currentData[index] = {
                    ...existing,
                    title: cleanStr(title) || existing.title,
                    summary: cleanStr(generateSummary(content, summary)) || existing.summary,
                    content: '', // Empty
                    image: image || (extractedImages.length > 0 ? extractedImages[0] : existing.image),
                    date: date || existing.date,
                    festival: festival !== undefined ? festival : existing.festival,
                    location: location !== undefined ? location : existing.location,
                    country: country !== undefined ? country : existing.country,
                    youtubeId: youtubeId !== undefined ? youtubeId : (extractedYoutubeId || existing.youtubeId),
                    showVideo: showVideo !== undefined ? showVideo : (existing.showVideo !== false),
                    images: extractedImages.length > 0 ? extractedImages : (existing.images || []),
                    isFeatured: isFeatured !== undefined ? isFeatured : existing.isFeatured,
                    year: year !== undefined ? (year || undefined) : existing.year,
                    author: author || existing.author || requestUsername || 'Alex'
                };

                await saveGitHubFile(FILE_PATH, currentData, `Update recap: ${title || existing.title}`, recapsFile.sha);

                // 2. Update Content
                if (content) {
                    let contentUpdated = false;
                    for (const filePath of RECAPS_CONTENT_FILES) {
                        const cFile = await fetchGitHubFile(filePath);
                        if (cFile) {
                            const cIndex = cFile.content.findIndex((item: any) => String(item.id) === String(id));
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
                const { id, title, date, startDate, endDate, location, country, type, image, description, url: eventUrl, genre, month, isWeekly, isSoldOut, isLiveDropsiders } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH);
                if (!agendaFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                let currentData = agendaFile.content;
                const index = currentData.findIndex(item => String(item.id) === String(id));
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                const existing = currentData[index];
                const targetTitle = existing.title;
                const targetLocation = existing.location;

                // Handle residency / weekly series replacement
                if (isWeekly && startDate && endDate && startDate !== endDate) {
                    // 1. Remove all events that match the old title and location
                    currentData = currentData.filter(item => !(item.title === targetTitle && item.location === targetLocation));

                    // 2. Generate new series
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);

                    let currentDate = new Date(start);
                    let maxId = currentData.reduce((max, item) => (item.id > max ? item.id : max), 0);

                    const newEvents = [];
                    while (currentDate <= end) {
                        maxId++;
                        newEvents.push({
                            id: maxId,
                            title: title || existing.title,
                            date: currentDate.toISOString().split('T')[0],
                            startDate: startDate,
                            endDate: endDate,
                            location: location || existing.location,
                            country: country || existing.country || '',
                            type: type || existing.type,
                            image: image || existing.image,
                            description: description || existing.description,
                            url: eventUrl || existing.url,
                            genre: genre || existing.genre,
                            month: currentDate.toLocaleString('fr-FR', { month: 'long' }).toUpperCase(),
                            isWeekly: true,
                            isSoldOut: isSoldOut !== undefined ? isSoldOut : existing.isSoldOut,
                            isLiveDropsiders: isLiveDropsiders !== undefined ? isLiveDropsiders : existing.isLiveDropsiders
                        });
                        currentDate.setDate(currentDate.getDate() + 7);
                    }
                    currentData = [...currentData, ...newEvents];
                } else {
                    // Single Update
                    currentData[index] = {
                        ...existing,
                        title: title || existing.title,
                        date: date || existing.date,
                        startDate: startDate || existing.startDate,
                        endDate: endDate || existing.endDate,
                        location: location || existing.location,
                        country: country || existing.country || '',
                        type: type || existing.type,
                        image: image || existing.image,
                        description: description || existing.description,
                        url: eventUrl || existing.url,
                        genre: genre || existing.genre,
                        month: month || existing.month,
                        isWeekly: isWeekly !== undefined ? isWeekly : existing.isWeekly,
                        isSoldOut: isSoldOut !== undefined ? isSoldOut : existing.isSoldOut,
                        isLiveDropsiders: isLiveDropsiders !== undefined ? isLiveDropsiders : existing.isLiveDropsiders
                    };
                }

                const saved = await saveGitHubFile(FILE_PATH, currentData, `Update agenda: ${title || existing.title}`, agendaFile.sha);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: CREATE AGENDA ---
        if ((path === '/api/agenda/create' || path === '/api/agenda') && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/agenda.json';
            try {
                const body = await request.json();
                const { title, date, startDate, endDate, location, country, type, image, description, url: eventUrl, genre, month, isWeekly, isSoldOut, isLiveDropsiders } = body;
                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH) || { content: [], sha: null };
                let currentData = agendaFile.content;
                let maxId = currentData.reduce((max, item) => (item.id > max ? item.id : max), 0);

                if (isWeekly && startDate && endDate && startDate !== endDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);

                    let currentDate = new Date(start);
                    const newEvents = [];
                    while (currentDate <= end) {
                        maxId++;
                        newEvents.push({
                            id: maxId,
                            title,
                            date: currentDate.toISOString().split('T')[0],
                            startDate: startDate,
                            endDate: endDate,
                            location,
                            country: country || '',
                            type,
                            image,
                            description,
                            url: eventUrl,
                            genre,
                            month: currentDate.toLocaleString('fr-FR', { month: 'long' }).toUpperCase(),
                            isWeekly: true,
                            isSoldOut: isSoldOut || false,
                            isLiveDropsiders: isLiveDropsiders || false
                        });
                        currentDate.setDate(currentDate.getDate() + 7);
                    }
                    currentData = [...currentData, ...newEvents];
                } else {
                    maxId++;
                    const newItem = {
                        id: maxId,
                        title,
                        date: date || startDate,
                        startDate: startDate,
                        endDate: endDate,
                        location,
                        country: country || '',
                        type,
                        image,
                        description,
                        url: eventUrl,
                        genre,
                        month: month || new Date(date || startDate || new Date()).toLocaleString('fr-FR', { month: 'long' }).toUpperCase(),
                        isWeekly: isWeekly || false,
                        isSoldOut: isSoldOut || false,
                        isLiveDropsiders: isLiveDropsiders || false
                    };
                    currentData = [...currentData, newItem];
                }

                const saved = await saveGitHubFile(FILE_PATH, currentData, `Add agenda: ${title}`, agendaFile.sha);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
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

                const saved = await saveGitHubFile(FILE_PATH, updatedData, `Add galerie: ${title}`, galerieFile.sha);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
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

                const allSuccess = results.every(r => r.success);

                if (!allSuccess) {
                    const firstError = results.find(r => !r.success)?.error || "Erreur inconnue de l'API Brevo";
                    let parsedError = firstError;
                    try {
                        const j = JSON.parse(firstError);
                        parsedError = j.message || firstError;
                    } catch (e) { }
                    return new Response(JSON.stringify({ error: parsedError, details: results }), { status: 500, headers });
                }

                // --- LOG NEWSLETTER ---
                try {
                    const logPath = 'src/data/newsletters_sent.json';
                    const file = await fetchGitHubFile(logPath) || { content: [], sha: null };
                    const newLog = {
                        id: Date.now().toString(),
                        subject,
                        date: new Date().toISOString(),
                        recipientsCount: recipients.length,
                        htmlContent: htmlContent, // Added to keep a record of content
                        fromAccount: "contact@dropsiders.fr"
                    };
                    const updated = [...(Array.isArray(file.content) ? file.content : []), newLog];
                    await saveGitHubFile(logPath, updated, `Newsletter sent: ${subject} [skip ci] [CF-Pages-Skip]`, file.sha);
                } catch (logErr) {
                    console.error('Log Newsletter Error:', logErr);
                }

                return new Response(JSON.stringify({ success: true, details: results }), { status: 200, headers });
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: CONTACTS MANAGEMENT ---
        if (path === '/api/contact' && request.method === 'POST') {
            try {
                const body = await request.json();
                const { name, email, subject, message } = body;
                if (!name || !email || !subject || !message) {
                    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
                }
                const CONTACTS_PATH = 'src/data/contacts.json';
                const file = await fetchGitHubFile(CONTACTS_PATH) || { content: [], sha: null };
                const contacts = Array.isArray(file.content) ? file.content : [];
                const newMsg = {
                    id: Date.now().toString(),
                    name, email, subject, message,
                    date: new Date().toISOString(),
                    read: false,
                    replied: false
                };
                contacts.push(newMsg);
                await saveGitHubFile(CONTACTS_PATH, contacts, `New contact: ${name} [skip ci] [CF-Pages-Skip]`, file.sha);

                // --- SEND NOTIFICATION EMAIL TO ADMIN ---
                const BREVO_KEY = env.BREVO_API_KEY;
                if (BREVO_KEY) {
                    ctx.waitUntil((async () => {
                        try {
                            // 1. Notif Admin
                            await fetch('https://api.brevo.com/v3/smtp/email', {
                                method: 'POST',
                                headers: { 'accept': 'application/json', 'api-key': BREVO_KEY, 'content-type': 'application/json' },
                                body: JSON.stringify({
                                    sender: { name: 'Dropsiders System', email: 'bot@dropsiders.fr' },
                                    to: [{ email: 'contact@dropsiders.fr', name: 'Alex' }],
                                    subject: `[NOUVEAU MESSAGE] ${name} : ${subject}`,
                                    htmlContent: `
                                        <div style="font-family: sans-serif; padding: 20px; background: #f9f9f9; color: #333;">
                                            <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 10px; border: 1px solid #eee;">
                                                <h2 style="color: #ff0033; margin-top: 0;">Nouveau message reçu !</h2>
                                                <p><strong>De :</strong> ${name} (${email})</p>
                                                <p><strong>Sujet :</strong> ${subject}</p>
                                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                                                <div style="white-space: pre-wrap; line-height: 1.6;">${message}</div>
                                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                                                <a href="https://dropsiders.fr/admin" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 14px;">Répondre via l'Admin</a>
                                            </div>
                                        </div>
                                    `
                                })
                            });

                            // 2. Confirmation Utilisateur
                            await fetch('https://api.brevo.com/v3/smtp/email', {
                                method: 'POST',
                                headers: { 'accept': 'application/json', 'api-key': BREVO_KEY, 'content-type': 'application/json' },
                                body: JSON.stringify({
                                    sender: { name: 'Dropsiders', email: 'contact@dropsiders.fr' },
                                    to: [{ email: email, name: name }],
                                    subject: `Confirmation de réception : ${subject}`,
                                    htmlContent: `
                                        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#ffffff; background:#000000; padding:30px 5px; text-align:center;">
                                            <div style="width:100%; max-width:600px; margin:0 auto; background:#111111; border:1px solid #333333; border-radius:24px; overflow:hidden; text-align:left; box-shadow: 0 0 30px rgba(255,0,51,0.1);">
                                                <div style="padding:40px 20px;">
                                                    <div style="text-align:center; margin-bottom:30px;">
                                                        <img src="https://dropsiders.fr/Logo.png" width="120" alt="Dropsiders">
                                                    </div>
                                                    
                                                    <h2 style="color:#ff0033; font-size:20px; font-weight:900; text-transform:uppercase; margin-bottom:20px; text-align:center;">Merci pour votre message !</h2>
                                                    
                                                    <div style="color:#ffffff; font-size:15px; line-height:1.6; margin-bottom:30px; padding:0 10px;">
                                                        Bonjour <strong>${name}</strong>,<br><br>
                                                        Nous avons bien reçu votre demande concernant "<strong>${subject}</strong>".<br>
                                                        Notre équipe va l'étudier avec attention et vous répondra dans les plus brefs délais.
                                                    </div>

                                                    <div style="background:#080808; border-left:3px solid #ff0033; border-radius:12px; padding:20px; margin-bottom:30px;">
                                                        <p style="color:#666; font-size:11px; font-weight:bold; text-transform:uppercase; margin-top:0; margin-bottom:10px;">Rappel de votre message :</p>
                                                        <div style="color:#aaa; font-size:13px; line-height:1.5; font-style:italic;">"${message}"</div>
                                                    </div>
                                                    
                                                    <!-- SIGNATURE BLOCK -->
                                                    <div style="margin-top:40px; background:#000000; border:1px solid #333333; border-top:4px solid #ff0033; border-radius:18px; overflow:hidden;">
                                                        <div style="padding:25px 10px; text-align:center;">
                                                            <div style="color:#ffffff; font-size:14px; font-weight:900; text-transform:uppercase; margin-bottom:15px;">
                                                                L'équipe <span style="color:#ff0033;">Dropsiders</span>
                                                            </div>
                                                            <div style="color:#ff0033; font-size:7px; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; opacity:0.8;">
                                                                NEWS · RÉCAPS · INTERVIEWS · CONCOURS
                                                            </div>
                                                            <table width="100%" cellpadding="0" cellspacing="4" border="0">
                                                                <tr>
                                                                    <td align="center"><a href="https://dropsiders.fr" style="display:block; background:#111; color:#fff; text-decoration:none; padding:8px 0; border-radius:8px; font-size:8px; font-weight:800; border-bottom:2px solid #ff0033;">SITE WEB</a></td>
                                                                    <td align="center"><a href="https://dropsiders.fr/shop" style="display:block; background:#111; color:#fff; text-decoration:none; padding:8px 0; border-radius:8px; font-size:8px; font-weight:800; border-bottom:2px solid #00ffd5;">BOUTIQUE</a></td>
                                                                </tr>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style="background:#000000; padding:15px; text-align:center; border-top:1px solid #222;">
                                                    <p style="color:#333; font-size:8px; margin:0; font-weight:bold; letter-spacing:1px;">DROPSIDERS · TOUTE L'ACTU DES FESTIVALS</p>
                                                </div>
                                            </div>
                                        </div>
                                    `,
                                    replyTo: { email: 'contact@dropsiders.fr', name: 'Dropsiders' }
                                })
                            });
                        } catch (e) {
                            console.error('Failed to send notification emails:', e);
                        }
                    })());
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/contacts' && request.method === 'GET') {
            try {
                const file = await fetchGitHubFile('src/data/contacts.json') || { content: [] };
                return new Response(JSON.stringify(file.content || []), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/contacts/read' && request.method === 'POST') {
            try {
                const { id } = await request.json();
                const CONTACTS_PATH = 'src/data/contacts.json';
                const file = await fetchGitHubFile(CONTACTS_PATH) || { content: [], sha: null };
                const contacts = Array.isArray(file.content) ? file.content : [];
                const updated = contacts.map(c => c.id === id ? { ...c, read: true } : c);
                await saveGitHubFile(CONTACTS_PATH, updated, `Mark read: ${id} [skip ci] [CF-Pages-Skip]`, file.sha);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/contacts/delete' && request.method === 'POST') {
            try {
                const { id } = await request.json();
                const CONTACTS_PATH = 'src/data/contacts.json';
                const file = await fetchGitHubFile(CONTACTS_PATH) || { content: [], sha: null };
                const contacts = Array.isArray(file.content) ? file.content : [];
                const updated = contacts.filter(c => c.id !== id);
                await saveGitHubFile(CONTACTS_PATH, updated, `Delete contact: ${id} [skip ci] [CF-Pages-Skip]`, file.sha);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/contacts/reply' && request.method === 'POST') {
            const BREVO_KEY = env.BREVO_API_KEY;
            if (!BREVO_KEY) return new Response(JSON.stringify({ error: 'Brevo API Key missing' }), { status: 500, headers });
            try {
                const { to, from, name, subject, message } = await request.json();
                if (!to || !subject || !message) {
                    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
                }

                const senderEmail = (from && from.trim() !== '') ? from : 'contact@dropsiders.fr';

                const recipients = to.split(',').map((email: string) => ({ email: email.trim(), name: name || email.trim() })).filter((r: any) => r.email);
                if (!recipients.find((r: any) => r.email === 'contact@dropsiders.fr')) {
                    recipients.push({ email: 'contact@dropsiders.fr', name: 'Dropsiders Admin' });
                }

                const payload = {
                    sender: { name: 'Dropsiders', email: senderEmail },
                    to: recipients,
                    subject: subject,
                    htmlContent: `
                        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#ffffff; background:#000000; padding:30px 5px; text-align:center;">
                            <div style="width:100%; max-width:600px; margin:0 auto; background:#111111; border:1px solid #333333; border-radius:24px; overflow:hidden; text-align:left; box-shadow: 0 0 30px rgba(255,0,51,0.1);">
                                <div style="padding:40px 15px;">
                                    <div style="color:#ffffff; font-size:16px; line-height:1.6; margin-bottom:40px; padding:0 10px;">
                                        ${message.replace(/\n/g, '<br>')}
                                    </div>
                                    
                                    <!-- SIGNATURE BLOCK : ULTRA STYLE DROPSIDERS -->
                                    <div style="margin-top:40px; background:#000000; border:1px solid #333333; border-top:4px solid #ff0033; border-radius:18px; overflow:hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
                                        <div style="padding:25px 10px; text-align:center;">
                                            <div style="color:#ffffff; font-size:15px; font-weight:900; font-family:'Arial Black', sans-serif; text-transform:uppercase; font-style:italic; margin-bottom:8px; letter-spacing:-0.5px;">
                                                Cordialement,<br>
                                                L'équipe <span style="color:#ff0033;">Dropsiders</span>
                                            </div>
                                            
                                            <!-- CATEGORIES BAR -->
                                            <div style="color:#ff0033; font-size:7.5px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:20px; border-bottom:1px solid #222; padding-bottom:12px; line-height:1.4; white-space: nowrap;">
                                                NEWS&nbsp;·&nbsp;RÉCAPS&nbsp;·&nbsp;INTERVIEWS&nbsp;·&nbsp;CONCOURS
                                            </div>
                                            
                                            <!-- ACTIONS GRID -->
                                            <table width="100%" cellpadding="0" cellspacing="4" border="0" style="table-layout: fixed;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="https://dropsiders.fr" style="display:block; background:#111; border:1px solid #333; color:#fff; text-decoration:none; padding:8px 0; border-radius:8px; font-size:8.5px; font-weight:800; text-transform:uppercase; border-bottom:2px solid #ff0033; white-space: nowrap;">
                                                            🌐 SITE
                                                        </a>
                                                    </td>
                                                    <td align="center">
                                                        <a href="https://dropsiders.fr/shop" style="display:block; background:#111; border:1px solid #333; color:#fff; text-decoration:none; padding:8px 0; border-radius:8px; font-size:8.5px; font-weight:800; text-transform:uppercase; border-bottom:2px solid #00ffd5; white-space: nowrap;">
                                                            🛍️ SHOP
                                                        </a>
                                                    </td>
                                                    <td align="center">
                                                        <a href="https://dropsiders.fr/newsletter" style="display:block; background:linear-gradient(90deg, #ff0033 0%, #ff0066 100%); color:#fff; text-decoration:none; padding:8px 0; border-radius:8px; font-size:8.5px; font-weight:900; text-transform:uppercase; box-shadow: 0 4px 10px rgba(255,0,51,0.2); white-space: nowrap;">
                                                            📩 NEWSLETTER
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <!-- FOOTER STRIP -->
                                        <div style="background:#080808; padding:10px; text-align:center;">
                                            <img src="https://dropsiders.fr/Logo.png" width="60" alt="Logo" style="opacity:0.4; filter:grayscale(1);">
                                        </div>
                                    </div>
                                </div>
                                <div style="background:#000000; padding:18px; text-align:center; border-top:1px solid #222;">
                                    <p style="color:#333; font-size:8px; margin:0; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">
                                        DROPSIDERS · TOUTE L'ACTU DES FESTIVALS
                                    </p>
                                </div>
                            </div>
                        </div>
                    `,
                    replyTo: { email: 'contact@dropsiders.fr', name: 'Dropsiders' }
                };
                const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'api-key': BREVO_KEY, 'content-type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!brevoRes.ok) {
                    const errText = await brevoRes.text();
                    let parsedErr = errText;
                    try { parsedErr = JSON.parse(errText).message || errText; } catch (e) { }
                    return new Response(JSON.stringify({ error: parsedErr }), { status: 500, headers });
                }
                // Mark as replied
                try {
                    const CONTACTS_PATH = 'src/data/contacts.json';
                    const file = await fetchGitHubFile(CONTACTS_PATH) || { content: [], sha: null };
                    const contacts = Array.isArray(file.content) ? file.content : [];
                    const updatedContacts = contacts.map(c => c.email === to ? { ...c, replied: true, read: true } : c);
                    await saveGitHubFile(CONTACTS_PATH, updatedContacts, `Reply sent to: ${to} [skip ci] [CF-Pages-Skip]`, file.sha);
                } catch (e) { console.error('Failed to mark replied:', e); }
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
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

        // --- API: PUSH NOTIFICATIONS ---
        if (path === '/api/push/subscribe' && request.method === 'POST') {
            try {
                const { subscription, favorites } = await request.json();
                if (!subscription || !subscription.endpoint) {
                    return new Response(JSON.stringify({ error: 'Invalid subscription' }), { status: 400, headers });
                }

                // Store in KV
                // Use endpoint hash as key to avoid duplicates and long keys
                const key = `push_sub_${btoa(subscription.endpoint).substring(0, 100)}`;
                await env.CHAT_KV.put(key, JSON.stringify({
                    subscription,
                    favorites: favorites || [],
                    date: new Date().toISOString()
                }));

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/push/unsubscribe' && request.method === 'POST') {
            try {
                const { endpoint } = await request.json();
                if (!endpoint) return new Response(JSON.stringify({ error: 'Missing endpoint' }), { status: 400, headers });

                const key = `push_sub_${btoa(endpoint).substring(0, 100)}`;
                await env.CHAT_KV.delete(key);

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/push/subscribers-count' && request.method === 'GET') {
            try {
                const list = await env.CHAT_KV.list({ prefix: 'push_sub_' });
                return new Response(JSON.stringify({ count: list.keys.length }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ count: 0 }), { status: 200, headers });
            }
        }

        if (path === '/api/push/broadcast' && request.method === 'POST') {
            try {
                const { title, body, url } = await request.json();
                if (!title || !body) return new Response(JSON.stringify({ error: 'Title and body required' }), { status: 400, headers });

                const list = await env.CHAT_KV.list({ prefix: 'push_sub_' });

                // Use waitUntil to not block the response
                ctx.waitUntil((async () => {
                    for (const key of list.keys) {
                        const subRaw = await env.CHAT_KV.get(key.name);
                        if (!subRaw) continue;
                        const { subscription } = JSON.parse(subRaw);

                        if (env.ONESIGNAL_APP_ID && env.ONESIGNAL_API_KEY) {
                            await fetch('https://onesignal.com/api/v1/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${env.ONESIGNAL_API_KEY}` },
                                body: JSON.stringify({
                                    app_id: env.ONESIGNAL_APP_ID,
                                    contents: { "fr": body, "en": body },
                                    headings: { "fr": title, "en": title },
                                    url: url || 'https://dropsiders.fr',
                                    include_subscription_ids: [subscription.endpoint.split('/').pop()]
                                })
                            });
                        }
                        console.log(`Manual broadcast to ${subscription.endpoint}`);
                    }
                })());

                return new Response(JSON.stringify({ success: true, sentTo: list.keys.length }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: GET NEWS CONTENT ---
        if (path === '/api/news/content' && request.method === 'GET') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const id = parseInt(url.searchParams.get('id') || '0');
            if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers });
            for (const filePath of NEWS_CONTENT_FILES) {
                const cFile = await fetchGitHubFile(filePath);
                if (cFile && Array.isArray(cFile.content)) {
                    const item = cFile.content.find(i => i.id === id);
                    if (item) return new Response(JSON.stringify({ content: item.content }), { status: 200, headers });
                }
            }
            return new Response(JSON.stringify({ content: '' }), { status: 200, headers });
        }

        // --- API: GET RECAPS CONTENT ---
        if (path === '/api/recaps/content' && request.method === 'GET') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const id = parseInt(url.searchParams.get('id') || '0');
            if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers });
            for (const filePath of RECAPS_CONTENT_FILES) {
                const cFile = await fetchGitHubFile(filePath);
                if (cFile && Array.isArray(cFile.content)) {
                    const item = cFile.content.find(i => i.id === id);
                    if (item) return new Response(JSON.stringify({ content: item.content }), { status: 200, headers });
                }
            }
            return new Response(JSON.stringify({ content: '' }), { status: 200, headers });
        }

        // --- API: PHOTO SUBMISSIONS ---
        if (path === '/api/photos/submit' && request.method === 'POST') {
            try {
                const body = await request.json();
                const { imageUrl, userName, festivalName, instagram, anecdote } = body;
                if (!imageUrl) return new Response(JSON.stringify({ error: 'Image URL required' }), { status: 400, headers });

                const file = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH) || { content: [], sha: null };
                const submissions = Array.isArray(file.content) ? file.content : [];

                const newSubmission = {
                    id: Date.now().toString(),
                    imageUrl,
                    userName: userName || 'Anonyme',
                    festivalName: festivalName || 'Inconnu',
                    instagram: instagram || '',
                    anecdote: anecdote || '',
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                };

                const updated = [newSubmission, ...submissions];
                await saveGitHubFile(PENDING_SUBMISSIONS_PATH, updated, `New photo submission from ${newSubmission.userName}`, file.sha);

                return new Response(JSON.stringify({ success: true, submission: newSubmission }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/photos/pending' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const file = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH);
                return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/photos/moderate' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { id, action } = await request.json();
                if (!id || !action) return new Response(JSON.stringify({ error: 'Missing ID or action' }), { status: 400, headers });

                const subFile = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH);
                if (!subFile) return new Response(JSON.stringify({ error: 'Submissions file not found' }), { status: 404, headers });

                const submission = subFile.content.find(s => s.id === id);
                if (!submission) return new Response(JSON.stringify({ error: 'Submission not found' }), { status: 404, headers });

                if (action === 'approve') {
                    // Add to galerie.json
                    const galFile = await fetchGitHubFile(GALERIE_PATH) || { content: [], sha: null };
                    const galleries = Array.isArray(galFile.content) ? galFile.content : [];

                    const year = new Date().getFullYear().toString();
                    const galleryTitle = `COMMUNAUTÉ @ ${submission.festivalName.toUpperCase()} ${year}`;
                    const galleryId = `${submission.festivalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-community-${year}`;

                    let targetGallery = galleries.find(g => g.id === galleryId);
                    if (!targetGallery) {
                        targetGallery = {
                            id: galleryId,
                            title: galleryTitle,
                            category: "Communauté",
                            cover: submission.imageUrl,
                            images: [submission.imageUrl],
                            date: year
                        };
                        galleries.unshift(targetGallery);
                    } else {
                        if (!targetGallery.images.includes(submission.imageUrl)) {
                            targetGallery.images.unshift(submission.imageUrl);
                        }
                    }

                    await saveGitHubFile(GALERIE_PATH, galleries, `Approve photo for ${galleryTitle}`, galFile.sha);

                    // Save anecdote to KV
                    const finalAnecdote = anecdote !== undefined ? anecdote : submission.anecdote;
                    if (finalAnecdote) {
                        const safeId = btoa(submission.imageUrl).substring(0, 100).replace(/\//g, '_');
                        await env.CHAT_KV.put(`anecdote:${safeId}`, finalAnecdote);
                    }
                } else if (action === 'reject') {
                    // Physical deletion from Cloudflare R2
                    if (env.R2 && submission.imageUrl.includes('/uploads/')) {
                        try {
                            const r2Key = submission.imageUrl.split('/uploads/').pop();
                            if (r2Key) {
                                await env.R2.delete(r2Key);
                                console.log(`Deleted ${r2Key} from R2 storage`);
                            }
                        } catch (e) {
                            console.error('Failed to delete from R2:', e);
                        }
                    }
                }

                // Remove from pending (for both approve and reject)
                const updatedSubs = subFile.content.filter(s => s.id !== id);
                await saveGitHubFile(PENDING_SUBMISSIONS_PATH, updatedSubs, `${action === 'approve' ? 'Approve' : 'Reject'} photo submission ${id}`, subFile.sha);

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }

        }

        // --- API: MEDIA INTERACTIONS (LIKES, SHARES, COMMENTS) ---
        if (path.startsWith('/api/media/') && request.method === 'GET') {
            const type = url.searchParams.get('type'); // 'photo' or 'clip'
            const id = url.searchParams.get('id'); // ID or URL
            if (!type || !id) return new Response(JSON.stringify({ error: 'Missing type or id' }), { status: 400, headers });

            const safeId = btoa(id).substring(0, 100).replace(/\//g, '_');

            if (path === '/api/media/stats') {
                const likes = await env.CHAT_KV.get(`likes:${type}:${safeId}`) || "0";
                const shares = await env.CHAT_KV.get(`shares:${type}:${safeId}`) || "0";
                const commentsRaw = await env.CHAT_KV.get(`comments:${type}:${safeId}`) || "[]";
                const comments = JSON.parse(commentsRaw);
                const anecdote = await env.CHAT_KV.get(`anecdote:${safeId}`) || null;

                return new Response(JSON.stringify({
                    likes: parseInt(likes),
                    shares: parseInt(shares),
                    commentsCount: comments.length,
                    anecdote
                }), { status: 200, headers });
            }

            if (path === '/api/media/comments') {
                const commentsRaw = await env.CHAT_KV.get(`comments:${type}:${safeId}`) || "[]";
                return new Response(commentsRaw, { status: 200, headers });
            }
        }

        if (path.startsWith('/api/media/') && request.method === 'POST') {
            const body = await request.json();
            const { type, id } = body;
            if (!type || !id) return new Response(JSON.stringify({ error: 'Missing type or id' }), { status: 400, headers });

            const safeId = btoa(id).substring(0, 100).replace(/\//g, '_');

            if (path === '/api/media/like') {
                const key = `likes:${type}:${safeId}`;
                const current = parseInt(await env.CHAT_KV.get(key) || "0");
                await env.CHAT_KV.put(key, (current + 1).toString());
                return new Response(JSON.stringify({ success: true, likes: current + 1 }), { status: 200, headers });
            }

            if (path === '/api/media/share') {
                const key = `shares:${type}:${safeId}`;
                const current = parseInt(await env.CHAT_KV.get(key) || "0");
                await env.CHAT_KV.put(key, (current + 1).toString());
                return new Response(JSON.stringify({ success: true, shares: current + 1 }), { status: 200, headers });
            }

            if (path === '/api/media/comment') {
                const { user, text } = body;
                if (!user || !text) return new Response(JSON.stringify({ error: 'Missing user or text' }), { status: 400, headers });

                const key = `comments:${type}:${safeId}`;
                const commentsRaw = await env.CHAT_KV.get(key) || "[]";
                const comments = JSON.parse(commentsRaw);

                const newComment = {
                    id: Date.now().toString(),
                    user,
                    text,
                    timestamp: new Date().toISOString()
                };

                comments.push(newComment);
                await env.CHAT_KV.put(key, JSON.stringify(comments));

                return new Response(JSON.stringify({ success: true, comment: newComment }), { status: 200, headers });
            }

            if (path === '/api/media/comment/delete') {
                if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
                const { commentId } = body;
                if (!commentId) return new Response(JSON.stringify({ error: 'Missing commentId' }), { status: 400, headers });

                const key = `comments:${type}:${safeId}`;
                const commentsRaw = await env.CHAT_KV.get(key) || "[]";
                const comments = JSON.parse(commentsRaw);

                const updated = comments.filter(c => c.id !== commentId);
                await env.CHAT_KV.put(key, JSON.stringify(updated));

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            }
        }

        // --- API: CARPOOLING ---
        if (path === '/api/covoit/submit' && request.method === 'POST') {
            const body = await request.json();
            const { festival, departure, date, capacity, contact, author } = body;
            if (!festival || !departure || !date || !contact) {
                return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
            }

            const newCovoit = {
                id: Date.now().toString(),
                festival,
                departure,
                date,
                capacity: capacity || 1,
                contact,
                author: author || 'Anonyme',
                timestamp: new Date().toISOString()
            };

            const listRaw = await env.CHAT_KV.get('covoit_list') || "[]";
            const list = JSON.parse(listRaw);
            list.unshift(newCovoit);
            // Limit to 50 active trips
            await env.CHAT_KV.put('covoit_list', JSON.stringify(list.slice(0, 50)));

            return new Response(JSON.stringify({ success: true, covoit: newCovoit }), { status: 200, headers });
        }

        if (path === '/api/covoit/active' && request.method === 'GET') {
            const listRaw = await env.CHAT_KV.get('covoit_list') || "[]";
            return new Response(listRaw, { status: 200, headers });
        }

        if (path === '/api/covoit/delete' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { id } = await request.json();
            const listRaw = await env.CHAT_KV.get('covoit_list') || "[]";
            const list = JSON.parse(listRaw);
            const updated = list.filter(c => c.id !== id);
            await env.CHAT_KV.put('covoit_list', JSON.stringify(updated));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        // --- API: FESTIVAL REVIEWS & GUIDE ---
        if (path === '/api/avis/submit' && request.method === 'POST') {
            const body = await request.json();
            const { festival, ratings, comment, tips, author } = body;
            if (!festival || !ratings || !author) {
                return new Response(JSON.stringify({ error: 'Missing mandatory fields' }), { status: 400, headers });
            }

            const newAvis = {
                id: Date.now().toString(),
                festival,
                ratings, // { organization: 5, sound: 4, food: 3 }
                comment,
                tips,
                author,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            const pendingRaw = await env.CHAT_KV.get('avis_pending') || "[]";
            const pending = JSON.parse(pendingRaw);
            pending.push(newAvis);
            await env.CHAT_KV.put('avis_pending', JSON.stringify(pending));

            return new Response(JSON.stringify({ success: true, avis: newAvis }), { status: 200, headers });
        }

        if (path === '/api/avis/active' && request.method === 'GET') {
            const activeRaw = await env.CHAT_KV.get('avis_active') || "[]";
            return new Response(activeRaw, { status: 200, headers });
        }

        if (path === '/api/avis/moderate' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { id, action } = await request.json();
            const pendingRaw = await env.CHAT_KV.get('avis_pending') || "[]";
            const pending = JSON.parse(pendingRaw);
            const index = pending.findIndex(a => a.id === id);

            if (index === -1) return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404, headers });

            const [avis] = pending.splice(index, 1);
            await env.CHAT_KV.put('avis_pending', JSON.stringify(pending));

            if (action === 'approve') {
                const activeRaw = await env.CHAT_KV.get('avis_active') || "[]";
                const active = JSON.parse(activeRaw);
                avis.status = 'approved';
                active.unshift(avis);
                await env.CHAT_KV.put('avis_active', JSON.stringify(active.slice(0, 100)));
            }

            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        // --- API: LINE-UP ALERTS ---
        if (path === '/api/alerts/submit' && request.method === 'POST') {
            const body = await request.json();
            const { festival, artist, email, author } = body;
            if (!festival || !email) {
                return new Response(JSON.stringify({ error: 'Missing festival or email' }), { status: 400, headers });
            }

            const newAlert = {
                id: Date.now().toString(),
                festival,
                artist: artist || 'Toute la line-up',
                email,
                author: author || 'Anonyme',
                timestamp: new Date().toISOString()
            };

            const listRaw = await env.CHAT_KV.get('alerts_list') || "[]";
            const list = JSON.parse(listRaw);
            list.unshift(newAlert);
            await env.CHAT_KV.put('alerts_list', JSON.stringify(list.slice(0, 1000)));

            return new Response(JSON.stringify({ success: true, alert: newAlert }), { status: 200, headers });
        }

        if (path === '/api/alerts/active' && request.method === 'GET') {
            const listRaw = await env.CHAT_KV.get('alerts_list') || "[]";
            const list = JSON.parse(listRaw);
            // Mask emails for public view
            const masked = list.map(a => ({
                ...a,
                email: a.email ? a.email.replace(/(^.{2})(.*)(@.*$)/, '$1***$3') : '***@***.com'
            }));
            return new Response(JSON.stringify(masked), { status: 200, headers });
        }

        // --- API: QUIZ & BLIND TEST ---
        if (path === '/api/quiz/submit' && request.method === 'POST') {
            const body = await request.json();
            const { type, question, options, correctAnswer, category, audioUrl, author } = body;
            if (!type || !question || !correctAnswer || !category) {
                return new Response(JSON.stringify({ error: 'Missing mandatory fields' }), { status: 400, headers });
            }

            const newQuiz = {
                id: Date.now().toString(),
                type,
                question,
                options: options || [],
                correctAnswer,
                category,
                audioUrl: audioUrl || '',
                author: author || 'Anonyme',
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            const pendingRaw = await env.CHAT_KV.get('quiz_pending') || "[]";
            const pending = JSON.parse(pendingRaw);
            pending.push(newQuiz);
            await env.CHAT_KV.put('quiz_pending', JSON.stringify(pending));

            return new Response(JSON.stringify({ success: true, quiz: newQuiz }), { status: 200, headers });
        }

        if (path === '/api/quiz/pending' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const pendingRaw = await env.CHAT_KV.get('quiz_pending') || "[]";
            return new Response(pendingRaw, { status: 200, headers });
        }

        if (path === '/api/quiz/moderate' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { id, action } = await request.json();
            if (!id || !action) return new Response(JSON.stringify({ error: 'Missing id or action' }), { status: 400, headers });

            const pendingRaw = await env.CHAT_KV.get('quiz_pending') || "[]";
            const pending = JSON.parse(pendingRaw);
            const quizIndex = pending.findIndex(q => q.id === id);

            if (quizIndex === -1) return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404, headers });

            const [quiz] = pending.splice(quizIndex, 1);
            await env.CHAT_KV.put('quiz_pending', JSON.stringify(pending));

            if (action === 'approve') {
                const activeRaw = await env.CHAT_KV.get('quiz_active') || "[]";
                const active = JSON.parse(activeRaw);
                quiz.status = 'approved';
                active.push(quiz);
                await env.CHAT_KV.put('quiz_active', JSON.stringify(active));
            }

            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/quiz/active' && request.method === 'GET') {
            let activeRaw = await env.CHAT_KV.get('quiz_active');
            if (!activeRaw) {
                const defaultQuizzes = [
                    { id: '1', type: 'QCM', question: 'En quelle année a été créé Tomorrowland ?', options: ['2004', '2005', '2006', '2007'], correctAnswer: '2005', category: 'Festivals', author: 'Dropsiders', timestamp: new Date().toISOString() },
                    { id: '2', type: 'QCM', question: 'Quel DJ est surnommé "The King of Trance" ?', options: ['Tiësto', 'Armin van Buuren', 'Paul van Dyk', 'Ferry Corsten'], correctAnswer: 'Armin van Buuren', category: 'DJs', author: 'Dropsiders', timestamp: new Date().toISOString() }
                ];
                activeRaw = JSON.stringify(defaultQuizzes);
            }
            return new Response(activeRaw, { status: 200, headers });
        }

        if (path.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers });
        }

        let response;
        if (env.ASSETS) {
            response = await env.ASSETS.fetch(request);
            if (response.status === 404) {
                response = await env.ASSETS.fetch(new URL('/index.html', request.url));
            }
        } else {
            return new Response("Not Found", { status: 404 });
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            const origin = url.origin;
            let title = "DROPSIDERS : L'actu de tous les festivals";
            let description = "Découvrez toute l'actualité des festivals, des recaps, des interviews et bien plus sur Dropsiders.";
            let image = `${origin}/logo_presentation.png`;
            let foundItem = null;

            const newsMatch = path.match(/^\/news\/([^\/]+)/);
            const recapMatch = path.match(/^\/recaps\/([^\/]+)/);
            const interviewMatch = path.match(/^\/interviews\/([^\/]+)/);
            const galerieMatch = path.match(/^\/galerie\/([^\/]+)/);

            let id = null;
            let dataSource = null;

            if (newsMatch || interviewMatch) {
                const slug = newsMatch ? newsMatch[1] : interviewMatch[1];
                const endMatch = slug.match(/-(\d+)$/);
                const startMatch = slug.match(/^(\d+)[_-]/);
                const pureIdMatch = slug.match(/^(\d+)$/);
                id = endMatch ? endMatch[1] : (startMatch ? startMatch[1] : (pureIdMatch ? pureIdMatch[1] : slug));
                dataSource = 'src/data/news.json';
            } else if (recapMatch) {
                const slug = recapMatch[1];
                const endMatch = slug.match(/-(\d+)$/);
                const startMatch = slug.match(/^(\d+)[_-]/);
                const pureIdMatch = slug.match(/^(\d+)$/);
                id = endMatch ? endMatch[1] : (startMatch ? startMatch[1] : (pureIdMatch ? pureIdMatch[1] : slug));
                dataSource = 'src/data/recaps.json';
            } else if (galerieMatch) {
                id = galerieMatch[1];
                dataSource = 'src/data/galerie.json';
            }

            if (id && dataSource) {
                try {
                    const dataFile = await fetchGitHubFile(dataSource);
                    if (dataFile && dataFile.content) {
                        const itemIdStr = String(id);
                        const actualId = itemIdStr.match(/^(\d+)/) ? itemIdStr.match(/^(\d+)/)[1] : itemIdStr;
                        foundItem = dataFile.content.find((i: any) => String(i.id) === actualId || i.slug === id);
                    }
                } catch (e) {
                    console.error(`Metadata fetch error for ${id} in ${dataSource}:`, e);
                }
            }

            if (foundItem) {
                title = `${foundItem.title.replace(/<[^>]*>/g, '').trim()} | Dropsiders`;
                if (foundItem.summary) {
                    description = foundItem.summary.replace(/<[^>]*>/g, '').substring(0, 160).trim();
                } else if (foundItem.category) {
                    description = `${foundItem.category} - ${foundItem.date || ''} | Dropsiders`;
                }

                if (foundItem.cover) image = foundItem.cover;
                else if (foundItem.image) image = foundItem.image;
                else if (foundItem.images && foundItem.images.length > 0) image = foundItem.images[0];
            }

            if (image && image.startsWith('/')) {
                image = `${origin}${image}`;
            }

            return new HTMLRewriter()
                .on('title', { element(e) { e.setInnerContent(title); } })
                .on('meta[name="description"]', { element(e) { e.setAttribute("content", description); } })
                .on('meta[name="author"]', { element(e) { e.setAttribute("content", foundItem.author || "Dropsiders"); } })
                .on('meta[property="og:title"]', { element(e) { e.setAttribute("content", title); } })
                .on('meta[property="og:description"]', { element(e) { e.setAttribute("content", description); } })
                .on('meta[property="og:image"]', { element(e) { e.setAttribute("content", image); } })
                .on('meta[property="og:url"]', { element(e) { e.setAttribute("content", `${origin}${path}`); } })
                .on('meta[property="og:site_name"]', { element(e) { e.setAttribute("content", "Dropsiders"); } })
                .on('meta[name="twitter:card"]', { element(e) { e.setAttribute("content", "summary_large_image"); } })
                .on('meta[name="twitter:title"]', { element(e) { e.setAttribute("content", title); } })
                .on('meta[name="twitter:description"]', { element(e) { e.setAttribute("content", description); } })
                .on('meta[name="twitter:image"]', { element(e) { e.setAttribute("content", image); } })
                .on('meta[name="twitter:url"]', { element(e) { e.setAttribute("content", `${origin}${path}`); } })
                .transform(response);
        }

        return response;
    },

    async scheduled(event, env, ctx) {
        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const TOKEN = env.GITHUB_TOKEN;

        // 1. Fetch current settings to get the lineup
        const res = await fetchGitHubFile(SETTINGS_PATH);
        if (!res) return;
        const content = res.content;
        const fileData = { sha: res.sha };

        let settingsChanged = false;

        // --- AUTO-SWITCH LIVE STATUS ---
        if (content.takeover) {
            const nowTime = Date.now();
            const start = content.takeover.startDate ? new Date(content.takeover.startDate).getTime() : null;
            const end = content.takeover.endDate ? new Date(content.takeover.endDate).getTime() : null;

            // Auto start
            if (start && nowTime >= start && !content.takeover.enabled) {
                if (!end || nowTime < end) {
                    content.takeover.enabled = true;
                    settingsChanged = true;
                }
            }

            // Auto stop
            if (end && nowTime >= end && content.takeover.enabled) {
                content.takeover.enabled = false;
                settingsChanged = true;
            }
        }

        const lineupText = content?.takeover?.lineup;
        if (!lineupText) {
            if (settingsChanged) {
                await saveGitHubFile(SETTINGS_PATH, content, 'Auto-switch live status (Scheduled)', fileData.sha);
            }
            return;
        }

        // --- LINEUP PARSING & CLEANUP ---
        const parseLineup = (text: string) => {
            const lines = text.split('\n').filter(l => l.trim());
            const items: any[] = [];
            const now = new Date();
            const currentTotal = now.getHours() * 60 + now.getMinutes();

            lines.forEach(line => {
                let timeRange = '', artist = '', stage = '', instagram = '';
                const timeMatch = line.match(/\[(.*?)\]/);
                if (timeMatch) {
                    timeRange = timeMatch[1];
                    const rest = line.replace(timeMatch[0], '').trim();
                    const parts = rest.includes('|') ? rest.split('|').map(p => p.trim()) : rest.split(/-(?=\s)/).map(p => p.trim());
                    artist = parts[0] || '';
                    stage = parts[1] || '';
                    instagram = parts[2] || '';
                }

                const [startTime, endTime] = timeRange.includes('-') ? timeRange.split('-').map(t => t.trim()) : [timeRange.trim(), ''];
                let isPast = false;
                if (endTime && endTime.includes(':')) {
                    const [h, m] = endTime.split(':').map(Number);
                    const endMin = h * 60 + m;
                    const timeDiff = (currentTotal - endMin + 1440) % 1440;
                    if (timeDiff >= 0 && timeDiff < 720) isPast = true;
                } else if (startTime.includes(':')) {
                    const [h, m] = startTime.split(':').map(Number);
                    if ((currentTotal - (h * 60 + m + 90) + 1440) % 1440 < 720) isPast = true;
                }
                items.push({ time: startTime, endTime, artist, stage, instagram, isPast });
            });
            return items;
        };

        const lineupItems = parseLineup(lineupText);
        const activeItems = lineupItems.filter(i => !i.isPast);
        let lineupChanged = false;

        if (activeItems.length !== lineupItems.length) {
            content.takeover.lineup = activeItems.map(i => {
                const timeStr = i.endTime ? `${i.time}-${i.endTime}` : i.time;
                return `[${timeStr}] ${i.artist}${i.stage ? ' - ' + i.stage : ''}${i.instagram ? ' - ' + i.instagram : ''}`;
            }).join('\n');
            lineupChanged = true;
        }

        const now = new Date();
        const currentTotal = now.getHours() * 60 + now.getMinutes();
        const currentArt = activeItems
            .filter(i => i.time && i.time.includes(':'))
            .map(i => {
                const [h, m] = i.time.split(':').map(Number);
                return { ...i, total: h * 60 + m };
            })
            .sort((a, b) => b.total - a.total)
            .find(i => i.total <= currentTotal);

        if (currentArt && currentArt.artist !== content.takeover.currentArtist) {
            content.takeover.currentArtist = currentArt.artist;
            content.takeover.artistInstagram = currentArt.instagram || '@DROPSIDERS';
            lineupChanged = true;
        }

        if (settingsChanged || lineupChanged) {
            await saveGitHubFile(SETTINGS_PATH, content, 'Auto-cleanup & switch (Scheduled)', fileData.sha);
        }

        // --- NOTIFICATIONS ---
        const currentlyLive = activeItems.filter(i => {
            if (!i.time || !i.time.includes(':')) return false;
            const [h, m] = i.time.split(':').map(Number);
            const total = h * 60 + m;
            return total <= currentTotal && total > currentTotal - 10;
        });

        if (currentlyLive.length === 0) return;

        const lastNotifiedRaw = await env.CHAT_KV.get('last_notified_artists');
        const lastNotified = lastNotifiedRaw ? JSON.parse(lastNotifiedRaw) : {};
        const newArtistsToNotify = [];

        for (const item of currentlyLive) {
            if (!lastNotified[item.artist] || (Date.now() - lastNotified[item.artist]) > 1000 * 60 * 60 * 2) {
                newArtistsToNotify.push(item);
                lastNotified[item.artist] = Date.now();
            }
        }

        if (newArtistsToNotify.length === 0) return;

        await env.CHAT_KV.put('last_notified_artists', JSON.stringify(lastNotified), { expirationTtl: 86400 });

        const { keys } = await env.CHAT_KV.list({ prefix: 'push_sub_' });
        for (const key of keys) {
            const subDataRaw = await env.CHAT_KV.get(key.name);
            if (!subDataRaw) continue;
            const { subscription, favorites } = JSON.parse(subDataRaw);
            const matchingArtists = newArtistsToNotify.filter(i => favorites.includes(i.artist));

            for (const artist of matchingArtists) {
                console.log(`Sending push for ${artist.artist}`);
                if (env.ONESIGNAL_APP_ID) {
                    await fetch('https://onesignal.com/api/v1/notifications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Basic ${env.ONESIGNAL_API_KEY}`
                        },
                        body: JSON.stringify({
                            app_id: env.ONESIGNAL_APP_ID,
                            contents: { "en": `${artist.artist} est en LIVE sur Dropsiders !`, "fr": `${artist.artist} est en LIVE sur Dropsiders !` },
                            headings: { "en": "DROPSIDERS LIVE", "fr": "DROPSIDERS LIVE" },
                            url: `https://dropsiders.fr/takeover`,
                            include_subscription_ids: [subscription.endpoint.split('/').pop()]
                        })
                    });
                }
            }
        }
    }
}
