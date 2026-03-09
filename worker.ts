// @ts-nocheck

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

const SETTINGS_PATH = 'src/data/settings.json';
const NEWS_PATH = 'src/data/news.json';
const RECAPS_PATH = 'src/data/recaps.json';
const AGENDA_PATH = 'src/data/agenda.json';
const GALERIE_PATH = 'src/data/galerie.json';
const TEAM_PATH = 'src/data/team.json';
const SHOP_PATH = 'src/data/shop.json';
const CLIPS_PATH = 'src/data/clips.json';
const NEWS_CONTENT_TARGET = 'src/data/news_content_3.json';
const RECAPS_CONTENT_TARGET = 'src/data/recaps_content_2.json';
const NEWS_CONTENT_FILES = ['src/data/news_content_3.json', 'src/data/news_content_2.json', 'src/data/news_content_1.json'];
const RECAPS_CONTENT_FILES = ['src/data/recaps_content_2.json', 'src/data/recaps_content_1.json'];
const EDITORS_PATH = 'src/data/editors.json';
const PENDING_SUBMISSIONS_PATH = 'src/data/pending_submissions.json';
const CONTACTS_PATH = 'src/data/contacts.json';

async function fetchGitHubFile(filePath, config) {
    const { OWNER, REPO, TOKEN } = config;
    if (!TOKEN) return null;
    const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
    const response = await fetch(getUrl, {
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Cache-Control': 'no-cache' }
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
        if (rawRes.ok) content = await rawRes.text();
        else return null;
    } else return null;

    try {
        if (content.includes('Ã') || content.includes('â')) {
            content = content
                .replace(/Ã /g, 'à').replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è')
                .replace(/Â /g, ' ').replace(/â€™/g, "'");
        }
        return { content: JSON.parse(content), sha: fileData.sha, rawData: fileData };
    } catch (e) {
        return { content: [], sha: fileData.sha, rawData: fileData };
    }
}

async function saveGitHubFile(filePath, content, message, sha, config) {
    const { OWNER, REPO, TOKEN } = config;
    if (!TOKEN) return { ok: false, error: 'GITHUB_TOKEN is missing' };
    const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
    const encodedContent = utf8Encode(JSON.stringify(content, null, 2));
    const response = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: encodedContent, sha })
    });

    if (!response.ok) {
        const errText = await response.text();
        return { ok: false, status: response.status, error: errText };
    }
    return { ok: true };
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let path = url.pathname;
        if (path.endsWith('/') && path.length > 1) {
            path = path.slice(0, -1);
        }

        // Configuration
        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = env.GITHUB_FILE_PATH || 'src/data/subscribers.json';
        const TOKEN = env.GITHUB_TOKEN;
        const gitConfig = { OWNER, REPO, TOKEN };

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

        // Serve ads.txt directly for Google AdSense verification
        if (path === '/ads.txt') {
            const adsResponse = await env.APP_ASSETS.fetch(request);
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

        // --- API: ANALYTICS ---
        if (path === '/api/analytics/track' && request.method === 'POST') {
            const country = request.headers.get('cf-ipcountry') || 'FR';
            let body;
            try {
                body = await request.json();
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
            }
            const { id, type } = body;

            if (id && type) {
                // Increment total visits
                const totalKey = 'analytics_total_visits';
                const currentTotal = parseInt(await env.CHAT_KV.get(totalKey) || '0');
                await env.CHAT_KV.put(totalKey, (currentTotal + 1).toString());

                // Increment page-specific visits
                const pageKey = `analytics_page_views_${id}`;
                const currentPageViews = parseInt(await env.CHAT_KV.get(pageKey) || '0');
                await env.CHAT_KV.put(pageKey, (currentPageViews + 1).toString());

                // Track country stats
                const countryKey = `analytics_country_${country}`;
                const currentCountryViews = parseInt(await env.CHAT_KV.get(countryKey) || '0');
                await env.CHAT_KV.put(countryKey, (currentCountryViews + 1).toString());

                // Daily tracking
                const now = new Date();
                const dayKey = `analytics_day_${now.toISOString().split('T')[0]}`;
                const currentDayViews = parseInt(await env.CHAT_KV.get(dayKey) || '0');
                await env.CHAT_KV.put(dayKey, (currentDayViews + 1).toString());

                // Monthly tracking
                const monthKey = `analytics_month_${now.getFullYear()}_${now.getMonth()}`;
                const currentMonthViews = parseInt(await env.CHAT_KV.get(monthKey) || '0');
                await env.CHAT_KV.put(monthKey, (currentMonthViews + 1).toString());
            }
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        if (path === '/api/analytics/stats' && request.method === 'GET') {
            const totalVisits = await env.CHAT_KV.get('analytics_total_visits') || '0';

            // Countries
            const countries = [];
            const countryPrefix = 'analytics_country_';
            const countryList = await env.CHAT_KV.list({ prefix: countryPrefix });
            for (const key of countryList.keys) {
                const code = key.name.replace(countryPrefix, '');
                const val = await env.CHAT_KV.get(key.name);
                countries.push({ code, visits: parseInt(val || '0') });
            }

            // Top Articles
            const pageViews = [];
            const pagePrefix = 'analytics_page_views_';
            const pageList = await env.CHAT_KV.list({ prefix: pagePrefix });
            for (const key of pageList.keys) {
                const pageId = key.name.replace(pagePrefix, '');
                const views = await env.CHAT_KV.get(key.name);
                pageViews.push({ id: pageId, views: parseInt(views || '0') });
            }
            pageViews.sort((a, b) => b.views - a.views);

            // Timeline (Last 30 days)
            const timeline = [];
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const ds = d.toISOString().split('T')[0];
                const val = await env.CHAT_KV.get(`analytics_day_${ds}`) || '0';
                timeline.push({ date: ds, value: parseInt(val) });
            }
            timeline.reverse();

            return new Response(JSON.stringify({
                totalVisits: parseInt(totalVisits),
                countries,
                topArticles: pageViews.slice(0, 50),
                timeline
            }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // --- API: SHAZAM IDENTIFY (VRAI SHAZAM) ---
        if (path === '/api/shazam/identify' && request.method === 'POST') {
            const formData = await request.formData();
            const audioData = formData.get('audio');
            if (!audioData) return new Response(JSON.stringify({ error: 'Audio requis' }), { status: 400, headers });

            // 1. Get Keys from settings
            const settingsFile = await fetchGitHubFile('src/data/settings.json', { OWNER, REPO, TOKEN });
            const takeover = settingsFile?.content?.takeover || {};

            // 2. Try AudD (Simple and effective)
            const auddToken = takeover.auddToken || '0707d622c51645acc2e4fa26ed64538d';
            if (auddToken) {
                const auddForm = new FormData();
                auddForm.append('api_token', auddToken);
                auddForm.append('file', audioData);
                auddForm.append('return', 'spotify,apple_music');

                const auddRes = await fetch('https://api.audd.io/', { method: 'POST', body: auddForm });
                const auddData = await auddRes.json();

                if (auddData.status === 'success' && auddData.result) {
                    const res = auddData.result;
                    return new Response(JSON.stringify({
                        status: 'success',
                        metadata: {
                            artist: res.artist,
                            title: res.title,
                            album: res.album,
                            image: res.spotify?.album?.images?.[0]?.url || res.apple_music?.artwork?.url?.replace('{w}x{h}', '500x500') || '',
                            spotify: res.spotify?.external_urls?.spotify || ''
                        }
                    }), { headers });
                } else if (auddData.error) {
                    return new Response(JSON.stringify({ error: `AudD: ${auddData.error.error_message}` }), { status: 500, headers });
                }
            }

            // 3. Try ACRCloud (Professional Standard)
            if (takeover.acrAccessKey && takeover.acrAccessSecret) {
                const host = takeover.acrHost || 'identify-eu-west-1.acrcloud.com';
                const accessKey = takeover.acrAccessKey;
                const accessSecret = takeover.acrAccessSecret;
                const timestamp = Math.floor(Date.now() / 1000);
                const signatureVersion = '1';
                const dataType = 'audio';
                const endpoint = '/v1/identify';

                const stringToSign = `POST\n${endpoint}\n${accessKey}\n${dataType}\n${signatureVersion}\n${timestamp}`;

                // HMAC-SHA1 signature using Web Crypto API
                async function sign(secret, message) {
                    const encoder = new TextEncoder();
                    const keyData = encoder.encode(secret);
                    const msgData = encoder.encode(message);
                    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
                    const sig = await crypto.subtle.sign('HMAC', key, msgData);
                    return btoa(String.fromCharCode(...new Uint8Array(sig)));
                }

                const signature = await sign(accessSecret, stringToSign);

                const acrForm = new FormData();
                acrForm.append('sample', audioData);
                acrForm.append('access_key', accessKey);
                acrForm.append('data_type', dataType);
                acrForm.append('signature_version', signatureVersion);
                acrForm.append('signature', signature);
                acrForm.append('sample_bytes', (audioData as Blob).size.toString());
                acrForm.append('timestamp', timestamp.toString());

                const acrRes = await fetch(`https://${host}${endpoint}`, { method: 'POST', body: acrForm });
                const acrData = await acrRes.json();

                if (acrData.status && acrData.status.code === 0 && acrData.metadata && acrData.metadata.music) {
                    const music = acrData.metadata.music[0];
                    return new Response(JSON.stringify({
                        status: 'success',
                        metadata: {
                            artist: music.artists?.map(a => a.name).join(', '),
                            title: music.title,
                            album: music.album?.name,
                            image: '', // ACRCloud handles artwork differently or via external IDs
                            spotify: music.external_metadata?.spotify?.track?.id ? `https://open.spotify.com/track/${music.external_metadata.spotify.track.id}` : ''
                        }
                    }), { headers });
                } else if (acrData.status && acrData.status.code !== 0) {
                    return new Response(JSON.stringify({ error: `ACRCloud: ${acrData.status.msg}` }), { status: 500, headers });
                }
            }

            return new Response(JSON.stringify({ error: 'Aucun match trouvé ou API non configurée (Vérifiez vos tokens dans GENERAL)' }), { status: 404, headers });
        }

        // --- API: SHAZAM HISTORY ---
        if (path === '/api/shazam/history' && request.method === 'GET') {
            const history = await env.CHAT_KV.get('shazam_history') || '[]';
            return new Response(history, {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        if (path === '/api/shazam/history' && request.method === 'DELETE') {
            await env.CHAT_KV.delete('shazam_history');
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        if (path === '/api/shazam/history' && request.method === 'POST') {
            const body = await request.json();
            const { title, artist, image, spotify, user, playedBy } = body;

            if (title && artist) {
                const historyStr = await env.CHAT_KV.get('shazam_history') || '[]';
                let history = [];
                try {
                    history = JSON.parse(historyStr);
                } catch (e) {
                    history = [];
                }

                // Add new entry with timestamp
                const newEntry = {
                    title,
                    artist,
                    image,
                    spotify,
                    user: user || 'Anonyme',
                    playedBy: playedBy || 'Inconnu',
                    timestamp: new Date().toISOString()
                };

                // Prepend and limit to 50 items
                history = [newEntry, ...history].slice(0, 50);
                await env.CHAT_KV.put('shazam_history', JSON.stringify(history));

                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
            return new Response(JSON.stringify({ error: 'Données manquantes' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
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

            // Try 5 random instances in parallel to speed up the process
            const selectedInstances = [...instances].sort(() => Math.random() - 0.5).slice(0, 5);

            try {
                const successResponse = await Promise.any(selectedInstances.map(async (instance) => {
                    const response = await fetch(instance, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        },
                        body: JSON.stringify({
                            ...body,
                            videoQuality: body.videoQuality || '1080',
                            downloadMode: body.downloadMode || 'auto'
                        }),
                        signal: AbortSignal.timeout(5000) // 5s timeout instead of 10s
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.url || data.picker || data.status === 'stream' || data.status === 'redirect' || data.status === 'picker') {
                            return new Response(JSON.stringify(data), { headers });
                        }
                    }
                    throw new Error("Invalid response");
                }));
                return successResponse;
            } catch (e) {
                // All parallel attempts failed
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
        const envAdminPass = (env.ADMIN_PASSWORD || '01061988').trim();
        const adminPassword = envAdminPass; // Fix for other parts of the code
        const requestPassword = (request.headers.get('X-Admin-Password') || '').trim();
        let requestUsername = (request.headers.get('X-Admin-Username') || '').trim();

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
            path === '/api/quiz/update' ||
            path === '/api/quiz/submit' ||
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
            path === '/api/avis/moderate' ||
            path === '/api/facture/send' ||
            path.startsWith('/api/invoices')
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

            // MASTER AUTH BYPASS for Invoice & Critical Routes if password matches
            const isMasterPass = requestPassword === envAdminPass || requestPassword === '01061988';

            if (isMasterPass) {
                // For the invoice route, we only care about the password matching
                if (path === '/api/facture/send') {
                    authenticated = true;
                    userPermissions = ['all'];
                } else {
                    // For other routes, still check the session ID
                    const settingsFile = await fetchGitHubFile('src/data/settings.json', gitConfig);
                    const serverSessionId = settingsFile?.content?.master_session_id || 'initial-session-id';
                    if (requestSessionId === serverSessionId) {
                        authenticated = true;
                        userPermissions = ['all'];
                    }
                }
            }
            else if (requestUsername) {
                const editorsFile = await fetchGitHubFile(EDITORS_PATH, gitConfig);
                if (editorsFile && editorsFile.content) {
                    const editor = editorsFile.content.find(e => {
                        const epass = (e.password || '').trim();
                        return e.username === requestUsername && epass === requestPassword;
                    });

                    if (editor) {
                        // For invoice route, we bypass the session check if password is correct
                        if (path === '/api/facture/send' || requestSessionId === (editor.session_id || 'editor-initial-id')) {
                            authenticated = true;
                            userPermissions = editor.permissions || [];
                        }
                    }
                }
            }

            if (!authenticated) {
                const details = `User: ${requestUsername || 'anon'}. Pass: ${!!requestPassword}. Match: ${requestPassword === envAdminPass || requestPassword === '01061988'}`;
                return new Response(JSON.stringify({
                    error: 'Accès non autorisé',
                    details: details
                }), { status: 401, headers });
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

            // Factures: allow alex OR any authenticated user with 'all' or 'publications' permission
            if (path === '/api/facture/send') {
                const isAuthorized = requestUsername === 'alex' || requestUsername === 'contact@dropsiders.fr' || hasAll || userPermissions.includes('publications');
                if (!isAuthorized) {
                    return new Response(JSON.stringify({ error: "Accès réservé au personnel autorisé" }), { status: 403, headers });
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
            // Only allow 'alex' (or 'contact@dropsiders.fr' or 'alexflex30@gmail.com') to access this page
            if ((requestUsername !== 'alex' && requestUsername !== 'contact@dropsiders.fr' && requestUsername !== 'alexflex30@gmail.com') || requestPassword !== adminPassword) {
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
            const file = await fetchGitHubFile(FILE_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/recaps' && request.method === 'GET') {
            const FILE_PATH = 'src/data/recaps.json';
            const file = await fetchGitHubFile(FILE_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/agenda' && request.method === 'GET') {
            const FILE_PATH = 'src/data/agenda.json';
            const file = await fetchGitHubFile(FILE_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/galerie' && request.method === 'GET') {
            const FILE_PATH = 'src/data/galerie.json';
            const file = await fetchGitHubFile(FILE_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        // --- API: LOGIN ---
        if (path === '/api/login' && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                if ((username === 'alex' || username === 'contact@dropsiders.fr') && password === adminPassword) {
                    const settingsFile = await fetchGitHubFile('src/data/settings.json', gitConfig);
                    const sessionId = settingsFile?.content?.master_session_id || 'initial-session-id';
                    return new Response(JSON.stringify({ success: true, user: username, permissions: ['all'], sessionId }), { status: 200, headers });
                }

                const editorsFile = await fetchGitHubFile(EDITORS_PATH, gitConfig);
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
                    const settingsFile = await fetchGitHubFile('src/data/settings.json', gitConfig);
                    if (settingsFile) {
                        settingsFile.content.master_session_id = newSessionId;
                        saved = await saveGitHubFile('src/data/settings.json', settingsFile.content, 'Revoke all sessions (Alex)', settingsFile.sha, gitConfig);
                    } else {
                        return new Response(JSON.stringify({ error: 'Fichier settings introuvable' }), { status: 404, headers });
                    }
                } else {
                    const editorsFile = await fetchGitHubFile(EDITORS_PATH, gitConfig);
                    if (editorsFile && editorsFile.content) {
                        const index = editorsFile.content.findIndex(e => e.username === userToRevoke);
                        if (index !== -1) {
                            editorsFile.content[index].session_id = newSessionId;
                            saved = await saveGitHubFile(EDITORS_PATH, editorsFile.content, `Revoke all sessions (${userToRevoke})`, editorsFile.sha, gitConfig);
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
            const editors = await fetchGitHubFile(EDITORS_PATH, gitConfig) || { content: [] };
            return new Response(JSON.stringify(editors.content), { status: 200, headers });
        }

        if (path === '/api/editors/create' && request.method === 'POST') {
            const { username, password, name, permissions } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH, gitConfig) || { content: [], sha: null };
            const updated = [...file.content, { username, password, name, permissions: permissions || [], created: new Date().toISOString() }];
            const saved = await saveGitHubFile(EDITORS_PATH, updated, `Add editor: ${username}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/editors/delete' && request.method === 'POST') {
            const { username } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
            const updated = file.content.filter(e => e.username !== username);
            const saved = await saveGitHubFile(EDITORS_PATH, updated, `Remove editor: ${username}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/editors/update' && request.method === 'POST') {
            const { username, password, name, permissions } = await request.json();
            const file = await fetchGitHubFile(EDITORS_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const index = file.content.findIndex(e => e.username === username);
            if (index === -1) return new Response(JSON.stringify({ error: 'Editor not found' }), { status: 404, headers });

            const updatedEditor = { ...file.content[index], name, permissions };
            if (password) {
                updatedEditor.password = password;
            }

            file.content[index] = updatedEditor;
            const saved = await saveGitHubFile(EDITORS_PATH, file.content, `Update editor: ${username}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: SPOTIFY MANAGEMENT ---
        if (path === '/api/spotify' && request.method === 'GET') {
            const SPOTIFY_PATH = 'src/data/spotify.json';
            const file = await fetchGitHubFile(SPOTIFY_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify([]), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/spotify/update' && request.method === 'POST') {
            const SPOTIFY_PATH = 'src/data/spotify.json';
            const { playlists } = await request.json();
            const file = await fetchGitHubFile(SPOTIFY_PATH, gitConfig) || { content: [], sha: null };
            const saved = await saveGitHubFile(SPOTIFY_PATH, playlists, `Update Spotify playlists`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: TEAM MANAGEMENT ---
        if (path === '/api/team' && request.method === 'GET') {
            const TEAM_PATH = 'src/data/team.json';
            const file = await fetchGitHubFile(TEAM_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify([]), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/team/update' && request.method === 'POST') {
            const TEAM_PATH = 'src/data/team.json';
            const { members } = await request.json();
            const file = await fetchGitHubFile(TEAM_PATH, gitConfig) || { content: [], sha: null };
            const saved = await saveGitHubFile(TEAM_PATH, members, `Update Team members`, file.sha, gitConfig);
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

        // --- API: ANALYTICS ---
        if (path === '/api/analytics/track' && request.method === 'POST') {
            if (!env.CHAT_KV) return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 500, headers });

            try {
                const body = await request.json();
                const { id, type } = body;
                const country = request.headers.get('cf-ipcountry') || 'FR';
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const month = today.substring(0, 7); // YYYY-MM
                const sessionId = request.headers.get('X-Session-ID') || 'unknown';

                // 1. Increment Global Total
                const totalKey = 'analytics_total_visits';
                const currentTotal = parseInt(await env.CHAT_KV.get(totalKey) || '0');
                await env.CHAT_KV.put(totalKey, (currentTotal + 1).toString());

                // 2. Increment Country Stats
                const countryKey = 'analytics_countries';
                const countriesRaw = await env.CHAT_KV.get(countryKey);
                const countries = countriesRaw ? JSON.parse(countriesRaw) : {};
                countries[country] = (countries[country] || 0) + 1;
                await env.CHAT_KV.put(countryKey, JSON.stringify(countries));

                // 3. Increment Page Views
                const pageKey = `analytics_page_${id}`;
                const currentPageViews = parseInt(await env.CHAT_KV.get(pageKey) || '0');
                await env.CHAT_KV.put(pageKey, (currentPageViews + 1).toString());

                // 4. Update Daily Timeline
                const timelineKey = `analytics_timeline_${today}`;
                const currentTimeline = parseInt(await env.CHAT_KV.get(timelineKey) || '0');
                await env.CHAT_KV.put(timelineKey, (currentTimeline + 1).toString(), { expirationTtl: 60 * 60 * 24 * 31 });

                // 5. Track Active Session (for online users)
                const onlineKey = `analytics_online_${sessionId}`;
                await env.CHAT_KV.put(onlineKey, Date.now().toString(), { expirationTtl: 300 }); // 5 minutes

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Tracking failed' }), { status: 500, headers });
            }
        }

        if (path === '/api/analytics/stats' && request.method === 'GET') {
            if (!env.CHAT_KV) return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 500, headers });

            try {
                // Fetch basic totals
                const totalVisits = parseInt(await env.CHAT_KV.get('analytics_total_visits') || '0');

                // Fetch country distribution
                const countriesRaw = await env.CHAT_KV.get('analytics_countries');
                const countriesMap = countriesRaw ? JSON.parse(countriesRaw) : {};
                const countries = Object.entries(countriesMap)
                    .map(([code, visits]) => ({ code, visits }))
                    .sort((a: any, b: any) => b.visits - a.visits);

                // Online Users Count
                const onlinePrefix = 'analytics_online_';
                const { keys: onlineKeys } = await env.CHAT_KV.list({ prefix: onlinePrefix });
                const onlineUsers = onlineKeys.length;

                // Timeline (last 30 days)
                const timeline = [];
                for (let i = 0; i < 30; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const val = parseInt(await env.CHAT_KV.get(`analytics_timeline_${dateStr}`) || '0');
                    if (val > 0) timeline.push({ date: dateStr, value: val });
                }
                timeline.reverse();

                // Top Articles (this is more complex, we list keys with prefix)
                const topArticles = [];
                const { keys: pageKeys } = await env.CHAT_KV.list({ prefix: 'analytics_page_' });
                for (const key of pageKeys.slice(0, 50)) {
                    const views = parseInt(await env.CHAT_KV.get(key.name) || '0');
                    const id = key.name.replace('analytics_page_', '');
                    topArticles.push({ id, views });
                }
                topArticles.sort((a, b) => b.views - a.views);

                return new Response(JSON.stringify({
                    totalVisits,
                    countries,
                    onlineUsers,
                    timeline,
                    topArticles: topArticles.slice(0, 10)
                }), { status: 200, headers });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Stats failed' }), { status: 500, headers });
            }
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
                    const settingsFile = await fetchGitHubFile('src/data/settings.json', gitConfig);
                    const lineup = settingsFile?.content?.takeover?.lineup || 'Aucun planning configuré.';
                    await botResponse('📅 PLANNING LIVE :\n' + lineup.substring(0, 300));
                } else if (cmd === '!shop' || cmd === '!boutique') {
                    const shopFile = await fetchGitHubFile('src/data/shop.json', gitConfig);
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
                    const newsFile = await fetchGitHubFile('src/data/news.json', gitConfig);
                    const latest = newsFile?.content?.[0];
                    if (latest) {
                        await botResponse(`🔥 DERNIÈRE ACTU : ${latest.title}\nLien : https://dropsiders.fr/news/${latest.id}`);
                    }
                } else if (cmd === '!quizz' || cmd === '!quiz') {
                    let quizList = [];
                    try {
                        const activeRaw = env.CHAT_KV ? await env.CHAT_KV.get('quiz_active') : null;
                        if (activeRaw && activeRaw !== '[]') {
                            quizList = JSON.parse(activeRaw);
                        } else {
                            quizList = [
                                { type: 'QCM', question: 'En quelle année a été créé Tomorrowland ?', options: ['2004', '2005', '2006', '2007'], correctAnswer: '2005' },
                                { type: 'BLIND_TEST', question: 'Quel DJ a produit ce hit mondial ? (Wake Me Up)', options: ['Avicii', 'Calvin Harris', 'Tiesto', 'Kygo'], correctAnswer: 'Avicii' },
                                { type: 'QCM', question: 'Quel est le vrai nom de DJ Snake ?', options: ['William Grigahcine', 'David Guetta', 'Martin Garrix', 'Tim Bergling'], correctAnswer: 'William Grigahcine' }
                            ];
                        }
                    } catch (e) {
                        quizList = [
                            { type: 'QCM', question: 'En quelle année a été créé Tomorrowland ?', options: ['2004', '2005', '2006', '2007'], correctAnswer: '2005' }
                        ];
                    }
                    if (quizList.length > 0) {
                        const randomQ = quizList[Math.floor(Math.random() * quizList.length)];
                        await botResponse('❓ QUIZZ : ' + randomQ.question + '\\nOptions : ' + randomQ.options.join(' / '));
                    }
                } else if (cmd === '!id') {
                    const settingsFile = await fetchGitHubFile('src/data/settings.json', gitConfig);
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
            const file = await fetchGitHubFile(SETTINGS_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ shop_enabled: false }), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if ((path === '/api/settings/takeover' || path === '/api/takeover-settings') && request.method === 'GET') {
            const SETTINGS_PATH = 'src/data/settings.json';
            const file = await fetchGitHubFile(SETTINGS_PATH, gitConfig);
            if (!file || !file.content.takeover) return new Response(JSON.stringify({ enabled: false }), { status: 200, headers });
            const takeover = file.content.takeover;
            if (!takeover.auddToken) takeover.auddToken = '0707d622c51645acc2e4fa26ed64538d';
            return new Response(JSON.stringify(takeover), { status: 200, headers });
        }

        if (path === '/api/takeover-settings' && request.method === 'POST') {
            const takeoverData = await request.json();
            const file = await fetchGitHubFile(SETTINGS_PATH, gitConfig) || { content: {}, sha: null };
            if (!file.content) file.content = {};
            file.content.takeover = {
                ...(file.content.takeover || {}),
                ...takeoverData,
                auddToken: '0707d622c51645acc2e4fa26ed64538d'
            };
            const saved = await saveGitHubFile(SETTINGS_PATH, file.content, `Update takeover settings`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/settings/update' && request.method === 'POST') {
            const SETTINGS_PATH = 'src/data/settings.json';
            const newSettings = await request.json();
            const file = await fetchGitHubFile(SETTINGS_PATH, gitConfig) || { content: { shop_enabled: false }, sha: null };
            // Merge: preserve master_session_id and other critical fields
            const merged = { ...file.content, ...newSettings, master_session_id: file.content.master_session_id || 'initial-session-id' };
            const saved = await saveGitHubFile(SETTINGS_PATH, merged, `Update site settings`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: HOME LAYOUT MANAGEMENT ---
        if (path === '/api/home-layout' && request.method === 'GET') {
            const LAYOUT_PATH = 'src/data/home_layout.json';
            const file = await fetchGitHubFile(LAYOUT_PATH, gitConfig);
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
            const file = await fetchGitHubFile(LAYOUT_PATH, gitConfig) || { content: [], sha: null };
            const saved = await saveGitHubFile(LAYOUT_PATH, layout, `Update Home layout`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: DASHBOARD ACTIONS MANAGEMENT ---
        if (path === '/api/dashboard-actions' && request.method === 'GET') {
            const ACTIONS_PATH = 'src/data/dashboard_actions.json';
            const file = await fetchGitHubFile(ACTIONS_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify([]), { status: 200, headers });
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if (path === '/api/dashboard-actions/update' && request.method === 'POST') {
            const ACTIONS_PATH = 'src/data/dashboard_actions.json';
            const { actions } = await request.json();
            const file = await fetchGitHubFile(ACTIONS_PATH, gitConfig) || { content: [], sha: null };
            const saved = await saveGitHubFile(ACTIONS_PATH, actions, `Update Dashboard actions order`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        // --- API: SHOP PRODUCTS MANAGEMENT ---

        if (path === '/api/shop' && request.method === 'GET') {
            const SHOP_PATH = 'src/data/shop.json';
            const file = await fetchGitHubFile(SHOP_PATH, gitConfig) || { content: { products: [] } };
            return new Response(JSON.stringify(file.content.products), { status: 200, headers });
        }

        if (path === '/api/shop/create' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const product = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH, gitConfig) || { content: { products: [] }, sha: null };

            const maxId = file.content.products.reduce((max, p) => (p.id > max ? p.id : max), 0);
            const newProduct = { ...product, id: maxId + 1, createdAt: new Date().toISOString() };

            const updated = { ...file.content, products: [newProduct, ...file.content.products] };
            const saved = await saveGitHubFile(SHOP_PATH, updated, `Add shop product: ${product.name}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/shop/update' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const { id, updates } = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const products = file.content.products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
            const updated = { ...file.content, products };
            const saved = await saveGitHubFile(SHOP_PATH, updated, `Update shop product: ${id}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error, product: products.find(p => p.id === id) }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/shop/delete' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const { id } = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const updated = { ...file.content, products: file.content.products.filter(p => p.id !== id) };
            const saved = await saveGitHubFile(SHOP_PATH, updated, `Delete shop product: ${id}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/clips' && request.method === 'GET') {
            const CLIPS_PATH = 'src/data/clips.json';
            const file = await fetchGitHubFile(CLIPS_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/clips/create' && request.method === 'POST') {
            const CLIPS_PATH = 'src/data/clips.json';
            const clip = await request.json();
            const file = await fetchGitHubFile(CLIPS_PATH, gitConfig) || { content: [], sha: null };
            const updated = [clip, ...file.content];
            const saved = await saveGitHubFile(CLIPS_PATH, updated.slice(0, 200), `Add clip: ${clip.id}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/clips/delete' && request.method === 'POST') {
            const CLIPS_PATH = 'src/data/clips.json';
            const { id } = await request.json();
            const file = await fetchGitHubFile(CLIPS_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
            const updated = file.content.filter(c => c.id !== id);
            const saved = await saveGitHubFile(CLIPS_PATH, updated, `Delete clip: ${id}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/shop/reorder' && request.method === 'POST') {
            const SHOP_PATH = 'src/data/shop.json';
            const { products } = await request.json();
            const file = await fetchGitHubFile(SHOP_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const updated = { ...file.content, products };
            const saved = await saveGitHubFile(SHOP_PATH, updated, 'Reorder shop products', file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path.endsWith('/reorder') && request.method === 'POST') {
            const type = path.split('/')[2];
            const { items } = await request.json();
            const FILE_PATH = `src/data/${type}.json`;
            const file = await fetchGitHubFile(FILE_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

            const saved = await saveGitHubFile(FILE_PATH, items, `Reorder ${type}`, file.sha, gitConfig);
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
                    // Store audio files in mp3/ subfolder for organization
                    const isAudio = type && type.startsWith('audio/');
                    const key = isAudio ? `mp3/${hashHex}.${extension}` : `${hashHex}.${extension}`;

                    await env.R2.put(key, byteArray, {
                        httpMetadata: { contentType: type || 'image/jpeg' }
                    });

                    const uploadUrl = `https://${url.host}/uploads/${key}`;
                    return new Response(JSON.stringify({ success: true, url: uploadUrl }), { status: 200, headers });
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

                const file = await fetchGitHubFile(PATH, gitConfig) || { content: [], sha: null };
                if (file.content.some(sub => sub.email === email)) {
                    return new Response(JSON.stringify({ error: 'Déjà inscrit' }), { status: 409, headers });
                }

                const newSubscriber = { email, firstName: firstName || null, lastName: lastName || null, subscribedAt: new Date().toISOString() };
                const updatedData = [...file.content, newSubscriber];

                const saved = await saveGitHubFile(PATH, updatedData, `Nouvel abonné : ${email}`, file.sha, gitConfig);
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
                const file = await fetchGitHubFile(PATH, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                const updatedData = file.content.filter(sub => sub.email !== email);
                if (updatedData.length === file.content.length) return new Response(JSON.stringify({ error: 'Email not found' }), { status: 404, headers });

                const saved = await saveGitHubFile(PATH, updatedData, `Désinscription : ${email}`, file.sha, gitConfig);
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
                const newsFile = await fetchGitHubFile(NEWS_PATH, gitConfig) || { content: [], sha: null };
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
                const metaSaved = await saveGitHubFile(NEWS_PATH, updatedNews, `Add news: ${title}`, newsFile.sha, gitConfig);
                if (!metaSaved.ok) return new Response(JSON.stringify({ error: 'Error saving metadata: ' + metaSaved.error }), { status: 500, headers });

                // 2. Save Content to separated file
                const contentFile = await fetchGitHubFile(NEWS_CONTENT_TARGET, gitConfig);
                if (contentFile) {
                    const newContentItem = { id: newId, content: content };
                    const updatedContentFile = [...contentFile.content, newContentItem];
                    await saveGitHubFile(NEWS_CONTENT_TARGET, updatedContentFile, `Add news content: ${newId}`, contentFile.sha, gitConfig);
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
                const recapsFile = await fetchGitHubFile(FILE_PATH, gitConfig) || { content: [], sha: null };
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
                const metaSaved = await saveGitHubFile(FILE_PATH, updatedData, `Add recap: ${title}`, recapsFile.sha, gitConfig);
                if (!metaSaved.ok) return new Response(JSON.stringify({ error: 'Error saving metadata: ' + metaSaved.error }), { status: 500, headers });

                // 2. Save Content
                const contentFile = await fetchGitHubFile(RECAPS_CONTENT_TARGET, gitConfig);
                if (contentFile) {
                    const newContentItem = { id: newId, content: content };
                    const updatedContentFile = [...contentFile.content, newContentItem];
                    await saveGitHubFile(RECAPS_CONTENT_TARGET, updatedContentFile, `Add recap content: ${newId}`, contentFile.sha, gitConfig);
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
                const newsFile = await fetchGitHubFile(FILE_PATH, gitConfig);
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

                await saveGitHubFile(FILE_PATH, currentData, `Update news: ${title || existing.title}`, newsFile.sha, gitConfig);

                // 2. Update Content (Search in all content files)
                // If content is provided, we need to find where it is and update it
                if (content) {
                    let contentUpdated = false;
                    for (const filePath of NEWS_CONTENT_FILES) {
                        const cFile = await fetchGitHubFile(filePath, gitConfig);
                        if (cFile) {
                            const cIndex = cFile.content.findIndex((item: any) => String(item.id) === String(id));
                            if (cIndex !== -1) {
                                cFile.content[cIndex].content = content;
                                await saveGitHubFile(filePath, cFile.content, `Update news content: ${id}`, cFile.sha, gitConfig);
                                contentUpdated = true;
                                break;
                            }
                        }
                    }
                    // If content not found in any file (legacy?), add it to target file
                    if (!contentUpdated) {
                        const targetFile = await fetchGitHubFile(NEWS_CONTENT_TARGET, gitConfig);
                        if (targetFile) {
                            const updatedContentFile = [...targetFile.content, { id, content }];
                            await saveGitHubFile(NEWS_CONTENT_TARGET, updatedContentFile, `Add missing news content: ${id}`, targetFile.sha, gitConfig);
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
                const recapsFile = await fetchGitHubFile(FILE_PATH, gitConfig);
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

                await saveGitHubFile(FILE_PATH, currentData, `Update recap: ${title || existing.title}`, recapsFile.sha, gitConfig);

                // 2. Update Content
                if (content) {
                    let contentUpdated = false;
                    for (const filePath of RECAPS_CONTENT_FILES) {
                        const cFile = await fetchGitHubFile(filePath, gitConfig);
                        if (cFile) {
                            const cIndex = cFile.content.findIndex((item: any) => String(item.id) === String(id));
                            if (cIndex !== -1) {
                                cFile.content[cIndex].content = content;
                                await saveGitHubFile(filePath, cFile.content, `Update recap content: ${id}`, cFile.sha, gitConfig);
                                contentUpdated = true;
                                break;
                            }
                        }
                    }
                    if (!contentUpdated) {
                        const targetFile = await fetchGitHubFile(RECAPS_CONTENT_TARGET, gitConfig);
                        if (targetFile) {
                            const updatedContentFile = [...targetFile.content, { id, content }];
                            await saveGitHubFile(RECAPS_CONTENT_TARGET, updatedContentFile, `Add missing recap content: ${id}`, targetFile.sha, gitConfig);
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
                const { id, title, date, startDate, endDate, venue, location, country, type, image, description, url: eventUrl, genre, month, isWeekly, isSoldOut, isLiveDropsiders, dayOfWeek } = body;
                if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH, gitConfig);
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
                            venue: venue || existing.venue || '',
                            location: location || existing.location,
                            country: country || existing.country || '',
                            type: type || existing.type,
                            image: image || existing.image,
                            description: description || existing.description,
                            url: eventUrl || existing.url,
                            genre: genre || existing.genre,
                            month: currentDate.toLocaleString('fr-FR', { month: 'long' }).toUpperCase(),
                            isWeekly: true,
                            dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : new Date(startDate).getDay(),
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
                        title: cleanStr(title) || existing.title,
                        date: date || existing.date,
                        startDate: startDate || existing.startDate,
                        endDate: endDate || existing.endDate,
                        venue: venue !== undefined ? venue : existing.venue || '',
                        location: location || existing.location,
                        country: country || existing.country || '',
                        type: type || existing.type,
                        image: image || existing.image,
                        description: description || existing.description,
                        url: eventUrl || existing.url,
                        genre: genre || existing.genre,
                        month: month || existing.month,
                        isWeekly: isWeekly !== undefined ? isWeekly : existing.isWeekly,
                        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : existing.dayOfWeek,
                        isSoldOut: isSoldOut !== undefined ? isSoldOut : existing.isSoldOut,
                        isLiveDropsiders: isLiveDropsiders !== undefined ? isLiveDropsiders : existing.isLiveDropsiders
                    };
                }

                const saved = await saveGitHubFile(FILE_PATH, currentData, `Update agenda: ${title || existing.title}`, agendaFile.sha, gitConfig);
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
                const { title, date, startDate, endDate, venue, location, country, type, image, description, url: eventUrl, genre, month, isWeekly, isSoldOut, isLiveDropsiders, dayOfWeek } = body;
                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH, gitConfig) || { content: [], sha: null };
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
                            venue: venue || '',
                            location,
                            country: country || '',
                            type,
                            image,
                            description,
                            url: eventUrl,
                            genre,
                            month: currentDate.toLocaleString('fr-FR', { month: 'long' }).toUpperCase(),
                            isWeekly: true,
                            dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : new Date(startDate).getDay(),
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
                        venue: venue || '',
                        location,
                        country: country || '',
                        type,
                        image,
                        description,
                        url: eventUrl,
                        genre,
                        month: month || new Date(date || startDate || new Date()).toLocaleString('fr-FR', { month: 'long' }).toUpperCase(),
                        isWeekly: isWeekly || false,
                        dayOfWeek: dayOfWeek,
                        isSoldOut: isSoldOut || false,
                        isLiveDropsiders: isLiveDropsiders || false
                    };
                    currentData = [...currentData, newItem];
                }

                const saved = await saveGitHubFile(FILE_PATH, currentData, `Add agenda: ${title}`, agendaFile.sha, gitConfig);
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

                const galerieFile = await fetchGitHubFile(FILE_PATH, gitConfig) || { content: [], sha: null };
                const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                const newItem = { id: newId, title, category, cover, images, date };
                const updatedData = [newItem, ...galerieFile.content];

                const saved = await saveGitHubFile(FILE_PATH, updatedData, `Add galerie: ${title}`, galerieFile.sha, gitConfig);
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
                    const file = await fetchGitHubFile(logPath, gitConfig) || { content: [], sha: null };
                    const newLog = {
                        id: Date.now().toString(),
                        subject,
                        date: new Date().toISOString(),
                        recipientsCount: recipients.length,
                        htmlContent: htmlContent, // Added to keep a record of content
                        fromAccount: "contact@dropsiders.fr"
                    };
                    const updated = [...(Array.isArray(file.content) ? file.content : []), newLog];
                    await saveGitHubFile(logPath, updated, `Newsletter sent: ${subject} [skip ci] [CF-Pages-Skip]`, file.sha, gitConfig);
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
                const file = await fetchGitHubFile(CONTACTS_PATH, gitConfig) || { content: [], sha: null };
                const contacts = Array.isArray(file.content) ? file.content : [];
                const newMsg = {
                    id: Date.now().toString(),
                    name, email, subject, message,
                    date: new Date().toISOString(),
                    read: false,
                    replied: false
                };
                contacts.push(newMsg);
                await saveGitHubFile(CONTACTS_PATH, contacts, `New contact: ${name} [skip ci] [CF-Pages-Skip]`, file.sha, gitConfig);

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
                const file = await fetchGitHubFile('src/data/contacts.json', gitConfig) || { content: [] };
                return new Response(JSON.stringify(file.content || []), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/contacts/read' && request.method === 'POST') {
            try {
                const { id } = await request.json();
                const CONTACTS_PATH = 'src/data/contacts.json';
                const file = await fetchGitHubFile(CONTACTS_PATH, gitConfig) || { content: [], sha: null };
                const contacts = Array.isArray(file.content) ? file.content : [];
                const updated = contacts.map(c => c.id === id ? { ...c, read: true } : c);
                await saveGitHubFile(CONTACTS_PATH, updated, `Mark read: ${id} [skip ci] [CF-Pages-Skip]`, file.sha, gitConfig);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/contacts/delete' && request.method === 'POST') {
            try {
                const { id } = await request.json();
                const CONTACTS_PATH = 'src/data/contacts.json';
                const file = await fetchGitHubFile(CONTACTS_PATH, gitConfig) || { content: [], sha: null };
                const contacts = Array.isArray(file.content) ? file.content : [];
                const updated = contacts.filter(c => c.id !== id);
                await saveGitHubFile(CONTACTS_PATH, updated, `Delete contact: ${id} [skip ci] [CF-Pages-Skip]`, file.sha, gitConfig);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/contacts/reply' && request.method === 'POST') {
            const BREVO_KEY = env.BREVO_API_KEY;
            if (!BREVO_KEY) return new Response(JSON.stringify({ error: 'Brevo API Key missing' }), { status: 500, headers });
            try {
                const body = await request.json().catch(() => ({}));
                const { to, from, name, subject, message } = body;
                if (!to || !subject || !message) {
                    return new Response(JSON.stringify({ error: 'Missing required fields (to, subject, message)' }), { status: 400, headers });
                }

                // SECURITY/COMPLIANCE: Only use verified sender or a fallback matching the domain
                const senderEmail = (from && from.includes('@dropsiders')) ? from.trim() : 'contact@dropsiders.fr';

                const recipients = to.split(',').map((email: string) => ({ email: email.trim(), name: name || email.trim() })).filter((r: any) => r.email);
                if (recipients.length === 0) return new Response(JSON.stringify({ error: 'No valid recipients' }), { status: 400, headers });

                // Add admin as BCC/CC surrogate if not in list
                if (!recipients.find((r: any) => r.email === 'contact@dropsiders.fr')) {
                    recipients.push({ email: 'contact@dropsiders.fr', name: 'Dropsiders Backup' });
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
                    replyTo: {
                        email: (from && from !== 'contact@dropsiders.fr')
                            ? `${from.trim()}, contact@dropsiders.fr`
                            : 'contact@dropsiders.fr',
                        name: 'Support Dropsiders'
                    }
                };

                const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'api-key': BREVO_KEY, 'content-type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!brevoRes.ok) {
                    const errText = await brevoRes.text();
                    console.error('Brevo API Error:', errText);
                    let parsedErr = errText;
                    try { parsedErr = JSON.parse(errText).message || errText; } catch (e) { }
                    return new Response(JSON.stringify({ error: parsedErr }), { status: brevoRes.status, headers });
                }

                // Mark as replied in database
                try {
                    const CONTACTS_PATH = 'src/data/contacts.json';
                    const file = await fetchGitHubFile(CONTACTS_PATH, gitConfig) || { content: [], sha: null };
                    const contacts = Array.isArray(file.content) ? file.content : [];

                    // Improved matching: if multiple emails, match any
                    const toEmails = to.split(',').map((e: string) => e.trim().toLowerCase());
                    const updatedContacts = contacts.map(c =>
                        toEmails.includes(c.email.toLowerCase()) ? { ...c, replied: true, read: true } : c
                    );

                    await saveGitHubFile(CONTACTS_PATH, updatedContacts, `Reply sent to: ${to} [skip ci] [CF-Pages-Skip]`, file.sha, gitConfig);
                } catch (e) {
                    console.error('Failed to mark replied in DB:', e);
                    // We don't return error here because the email WAS sent successfully
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                console.error('Reply API Global Error:', e);
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/facture/send' && request.method === 'POST') {
            const BREVO_KEY = env.BREVO_API_KEY;
            if (!BREVO_KEY) return new Response(JSON.stringify({ error: 'Brevo API Key missing' }), { status: 500, headers });
            try {
                const body = await request.json().catch(() => ({}));
                const { to, subject, message, pdfBase64, filename, invoiceData } = body;

                if (!to || !pdfBase64) {
                    return new Response(JSON.stringify({ error: 'Destinataire ou PDF manquant' }), { status: 400, headers });
                }

                // Strip data URI part if present
                const base64Content = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;

                const payload = {
                    sender: { name: 'CUENCA ALEXANDRE', email: 'alexflex30@gmail.com' },
                    to: [{ email: to }],
                    bcc: [{ email: 'alexflex30@gmail.com' }],
                    replyTo: { email: 'alexflex30@gmail.com', name: 'CUENCA ALEXANDRE' },
                    subject: subject || 'Votre Facture',
                    htmlContent: message || "<p>Bonjour,</p><p>Veuillez trouver ci-joint votre facture.</p><p>Cordialement,<br>CUENCA ALEXANDRE</p>",
                    attachment: [
                        {
                            content: base64Content,
                            name: filename || 'facture.pdf'
                        }
                    ]
                };

                const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'api-key': BREVO_KEY, 'content-type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!brevoRes.ok) {
                    const errText = await brevoRes.text();
                    console.error('Brevo API Error (Facture):', errText);
                    return new Response(JSON.stringify({ error: "Erreur lors de l'envoi: " + errText }), { status: 500, headers });
                }

                // If invoiceData is provided, auto-save to history
                if (invoiceData) {
                    const INVOICE_FILE = 'src/data/invoices.json';
                    const file = await fetchGitHubFile(INVOICE_FILE, gitConfig);
                    const history = file?.content || [];
                    const newInvoice = {
                        ...invoiceData,
                        id: Date.now(),
                        sentDate: new Date().toISOString(),
                        paid: false
                    };
                    await saveGitHubFile(INVOICE_FILE, [newInvoice, ...history], `Save invoice: ${invoiceData.number}`, file?.sha, gitConfig);
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/invoices' && request.method === 'GET') {
            try {
                const file = await fetchGitHubFile('src/data/invoices.json', gitConfig);
                return new Response(JSON.stringify(file?.content || []), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify([]), { status: 200, headers });
            }
        }

        if (path === '/api/invoices/update' && request.method === 'POST') {
            try {
                const { id, paid } = await request.json();
                const INVOICE_FILE = 'src/data/invoices.json';
                const file = await fetchGitHubFile(INVOICE_FILE, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                const updated = file.content.map(inv => inv.id === id ? { ...inv, paid } : inv);
                await saveGitHubFile(INVOICE_FILE, updated, `Update invoice status: ${id}`, file.sha, gitConfig);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
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
                const file = await fetchGitHubFile(FILE_PATH, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'Error fetching metadata file' }), { status: 502, headers });

                const updatedData = file.content.filter(item => String(item.id) !== String(id));
                if (updatedData.length === file.content.length) {
                    return new Response(JSON.stringify({ error: 'Item not found in metadata' }), { status: 404, headers });
                }

                await saveGitHubFile(FILE_PATH, updatedData, `Delete content: ${id}`, file.sha, gitConfig);

                // 2. Delete Content (News/Recaps)
                if (CONTENT_FILES.length > 0) {
                    for (const cp of CONTENT_FILES) {
                        const cf = await fetchGitHubFile(cp, gitConfig);
                        if (cf) {
                            const newCfContent = cf.content.filter(item => String(item.id) !== String(id));
                            if (newCfContent.length !== cf.content.length) {
                                await saveGitHubFile(cp, newCfContent, `Delete content body: ${id}`, cf.sha, gitConfig);
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
                const file = await fetchGitHubFile(PATH, gitConfig);
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
                const cFile = await fetchGitHubFile(filePath, gitConfig);
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
                const cFile = await fetchGitHubFile(filePath, gitConfig);
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
                const { imageUrl, userName, festivalName, year, instagram, anecdote } = body;
                if (!imageUrl) return new Response(JSON.stringify({ error: 'Image URL required' }), { status: 400, headers });

                const file = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH, gitConfig) || { content: [], sha: null };
                const submissions = Array.isArray(file.content) ? file.content : [];

                const newSubmission = {
                    id: Date.now().toString(),
                    imageUrl,
                    userName: userName || 'Anonyme',
                    festivalName: festivalName || 'Inconnu',
                    year: year || new Date().getFullYear().toString(),
                    instagram: instagram || '',
                    anecdote: anecdote || '',
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                };

                const updated = [newSubmission, ...submissions];
                await saveGitHubFile(PENDING_SUBMISSIONS_PATH, updated, `New photo submission from ${newSubmission.userName}`, file.sha, gitConfig);

                return new Response(JSON.stringify({ success: true, submission: newSubmission }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/photos/pending' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const file = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH, gitConfig);
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

                const subFile = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH, gitConfig);
                if (!subFile) return new Response(JSON.stringify({ error: 'Submissions file not found' }), { status: 404, headers });

                const submission = subFile.content.find(s => s.id === id);
                if (!submission) return new Response(JSON.stringify({ error: 'Submission not found' }), { status: 404, headers });

                if (action === 'approve') {
                    // Add to galerie.json
                    const galFile = await fetchGitHubFile(GALERIE_PATH, gitConfig) || { content: [], sha: null };
                    const galleries = Array.isArray(galFile.content) ? galFile.content : [];

                    const year = (submission as any).year || new Date().getFullYear().toString();
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

                    await saveGitHubFile(GALERIE_PATH, galleries, `Approve photo for ${galleryTitle}`, galFile.sha, gitConfig);

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
                await saveGitHubFile(PENDING_SUBMISSIONS_PATH, updatedSubs, `${action === 'approve' ? 'Approve' : 'Reject'} photo submission ${id}`, subFile.sha, gitConfig);

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
            // Completely hide emails for public view
            const masked = list.map(a => ({
                ...a,
                email: 'Utilisateur anonyme'
            }));
            return new Response(JSON.stringify(masked), { status: 200, headers });
        }

        // --- API: QUIZ & BLIND TEST ---
        if (path === '/api/quiz/submit' && request.method === 'POST') {
            const body = await request.json();
            const { type, question, options, correctAnswer, category, audioUrl, imageUrl, imageType, revealEffect, youtubeId, spotifyUrl, startTime, author, approved, status: submittedStatus } = body;
            if (!type || !question || !correctAnswer || !category) {
                return new Response(JSON.stringify({ error: 'Missing mandatory fields' }), { status: 400, headers });
            }

            const isAutoApproved = approved === true;
            const finalStatus = isAutoApproved ? 'active' : (submittedStatus || 'pending');

            const newQuiz = {
                id: Date.now().toString(),
                type,
                question,
                options: options || [],
                correctAnswer,
                category,
                audioUrl: audioUrl || '',
                imageUrl: imageUrl || '',
                imageType: imageType || '',
                revealEffect: revealEffect || '',
                youtubeId: youtubeId || '',
                spotifyUrl: spotifyUrl || '',
                startTime: startTime || 0,
                author: author || 'Anonyme',
                timestamp: new Date().toISOString(),
                status: finalStatus
            };

            if (isAutoApproved) {
                const activeRaw = await env.CHAT_KV.get('quiz_active') || "[]";
                const active = JSON.parse(activeRaw);
                active.push(newQuiz);
                await env.CHAT_KV.put('quiz_active', JSON.stringify(active));
            } else {
                const pendingRaw = await env.CHAT_KV.get('quiz_pending') || "[]";
                const pending = JSON.parse(pendingRaw);
                pending.push(newQuiz);
                await env.CHAT_KV.put('quiz_pending', JSON.stringify(pending));
            }

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

        if (path === '/api/quiz/update' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const updatedQuiz = await request.json();
            if (!updatedQuiz.id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers });

            const activeRaw = await env.CHAT_KV.get('quiz_active') || "[]";
            const active = JSON.parse(activeRaw);
            const activeIndex = active.findIndex(q => q.id === updatedQuiz.id);
            if (activeIndex !== -1) {
                active[activeIndex] = { ...active[activeIndex], ...updatedQuiz };
                await env.CHAT_KV.put('quiz_active', JSON.stringify(active));
                return new Response(JSON.stringify({ success: true, from: 'active' }), { status: 200, headers });
            }

            const pendingRaw = await env.CHAT_KV.get('quiz_pending') || "[]";
            const pending = JSON.parse(pendingRaw);
            const pendingIndex = pending.findIndex(q => q.id === updatedQuiz.id);
            if (pendingIndex !== -1) {
                pending[pendingIndex] = { ...pending[pendingIndex], ...updatedQuiz };
                await env.CHAT_KV.put('quiz_pending', JSON.stringify(pending));
                return new Response(JSON.stringify({ success: true, from: 'pending' }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404, headers });
        }

        if (path === '/api/quiz/delete' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { id } = await request.json();
            if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers });

            const pendingRaw = await env.CHAT_KV.get('quiz_pending') || "[]";
            const pending = JSON.parse(pendingRaw);
            const pendingIndex = pending.findIndex(q => q.id === id);
            if (pendingIndex !== -1) {
                pending.splice(pendingIndex, 1);
                await env.CHAT_KV.put('quiz_pending', JSON.stringify(pending));
                return new Response(JSON.stringify({ success: true, from: 'pending' }), { status: 200, headers });
            }

            const activeRaw = await env.CHAT_KV.get('quiz_active') || "[]";
            const active = JSON.parse(activeRaw);
            const activeIndex = active.findIndex(q => q.id === id);
            if (activeIndex !== -1) {
                active.splice(activeIndex, 1);
                await env.CHAT_KV.put('quiz_active', JSON.stringify(active));
                return new Response(JSON.stringify({ success: true, from: 'active' }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404, headers });
        }

        // Reset all BLIND_TEST questions
        if (path === '/api/quiz/reset-blind-test' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

            const activeRaw = await env.CHAT_KV.get('quiz_active') || "[]";
            const active = JSON.parse(activeRaw);
            const filteredActive = active.filter(q => q.type !== 'BLIND_TEST');
            await env.CHAT_KV.put('quiz_active', JSON.stringify(filteredActive));

            const pendingRaw = await env.CHAT_KV.get('quiz_pending') || "[]";
            const pending = JSON.parse(pendingRaw);
            const filteredPending = pending.filter(q => q.type !== 'BLIND_TEST');
            await env.CHAT_KV.put('quiz_pending', JSON.stringify(filteredPending));

            const removedCount = (active.length - filteredActive.length) + (pending.length - filteredPending.length);
            return new Response(JSON.stringify({ success: true, removed: removedCount }), { status: 200, headers });
        }

        if (path === '/api/quiz/active' && request.method === 'GET') {
            const activeRaw = await env.CHAT_KV.get('quiz_active') || "[]";
            let active = JSON.parse(activeRaw);

            // Cleanup and sync logic
            {
                const defaultQuizzes = [
                    {
                        "id": "edm_1",
                        "type": "QCM",
                        "question": "Qui a été sacré DJ n°1 mondial au DJ Mag en 2025 ?",
                        "options": [
                            "David Guetta",
                            "Martin Garrix",
                            "Alok",
                            "Tiësto"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_2",
                        "type": "QCM",
                        "question": "Quelle artiste a fini n°1 Techno (Alternative Top 100) en 2024 ?",
                        "options": [
                            "Charlotte de Witte",
                            "Peggy Gou",
                            "Amelie Lens",
                            "Deborah De Luca"
                        ],
                        "correctAnswer": "Charlotte de Witte",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_3",
                        "type": "QCM",
                        "question": "Quel DJ brésilien a atteint la 3ème place du Top 100 en 2025 ?",
                        "options": [
                            "Alok",
                            "Vintage Culture",
                            "Sevenn",
                            "Öwnboss"
                        ],
                        "correctAnswer": "Alok",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_4",
                        "type": "QCM",
                        "question": "En 2024, quel record David Guetta a-t-il battu ?",
                        "options": [
                            "5ème victoire au Top 100",
                            "DJ le plus âgé",
                            "Plus grand nombre de streams",
                            "Plus de dates en un an"
                        ],
                        "correctAnswer": "5ème victoire au Top 100",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_5",
                        "type": "QCM",
                        "question": "Qui est monté sur la 1ère marche du podium DJ Mag en 2024 ?",
                        "options": [
                            "Martin Garrix",
                            "David Guetta",
                            "Alok",
                            "Armin van Buuren"
                        ],
                        "correctAnswer": "Martin Garrix",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_6",
                        "type": "QCM",
                        "question": "Quel duo belge est resté dans le Top 5 en 2024-2025 ?",
                        "options": [
                            "Dimitri Vegas & Like Mike",
                            "Yellow Claw",
                            "W&W",
                            "Lucas & Steve"
                        ],
                        "correctAnswer": "Dimitri Vegas & Like Mike",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_7",
                        "type": "QCM",
                        "question": "Qui a été nommé 'World No. 1 Trance DJ' en 2025 ?",
                        "options": [
                            "Armin van Buuren",
                            "Paul van Dyk",
                            "Ferry Corsten",
                            "Gareth Emery"
                        ],
                        "correctAnswer": "Armin van Buuren",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_8",
                        "type": "QCM",
                        "question": "Quel artiste a reçu le prix 'Highest Climber' au Top 100 2025 ?",
                        "options": [
                            "Solomun",
                            "Anyma",
                            "Chris Lake",
                            "Mochakk"
                        ],
                        "correctAnswer": "Solomun",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_9",
                        "type": "QCM",
                        "question": "Fisher a atteint quelle place prestigieuse au Top 100 2025 ?",
                        "options": [
                            "7ème",
                            "1ère",
                            "15ème",
                            "3ème"
                        ],
                        "correctAnswer": "7ème",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_10",
                        "type": "QCM",
                        "question": "Qui a été sacrée 'Highest Ranked Female DJ' en 2024 ?",
                        "options": [
                            "Peggy Gou",
                            "Charlotte de Witte",
                            "Nora En Pure",
                            "Honey Dijon"
                        ],
                        "correctAnswer": "Peggy Gou",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_11",
                        "type": "QCM",
                        "question": "Quel DJ a été élu n°1 House en 2025 ?",
                        "options": [
                            "Fisher",
                            "Vintage Culture",
                            "James Hype",
                            "Dom Dolla"
                        ],
                        "correctAnswer": "Fisher",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_12",
                        "type": "QCM",
                        "question": "Indira Paganotto est connue pour quel style musical en plein essor ?",
                        "options": [
                            "Hard Techno / Psytrance",
                            "Deep House",
                            "Future Rave",
                            "Dubstep"
                        ],
                        "correctAnswer": "Hard Techno / Psytrance",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_13",
                        "type": "QCM",
                        "question": "Quel DJ masqué est resté dans le Top 20 en 2024 ?",
                        "options": [
                            "Marshmello",
                            "Malaa",
                            "Boris Brejcha",
                            "Claptone"
                        ],
                        "correctAnswer": "Marshmello",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_14",
                        "type": "QCM",
                        "question": "En 2025, quel club a accueilli la remise des prix DJ Mag pour la première fois ?",
                        "options": [
                            "UNVRS (Ibiza)",
                            "Hï Ibiza",
                            "Printworks",
                            "Berghain"
                        ],
                        "correctAnswer": "UNVRS (Ibiza)",
                        "category": "Lieux",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_15",
                        "type": "QCM",
                        "question": "Quel DJ est considéré comme le roi de la Future Rave ?",
                        "options": [
                            "David Guetta",
                            "Martin Garrix",
                            "Hardwell",
                            "Don Diablo"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_16",
                        "type": "QCM",
                        "question": "Quel nouveau venu a fait une entrée remarquée dans le Top 100 2024 ?",
                        "options": [
                            "James Hype",
                            "Fred again..",
                            "Mochakk",
                            "Mau P"
                        ],
                        "correctAnswer": "Fred again..",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_17",
                        "type": "QCM",
                        "question": "Qui a été sacré n°1 DJ Group en 2025 ?",
                        "options": [
                            "Dimitri Vegas & Like Mike",
                            "The Chainsmokers",
                            "Vini Vici",
                            "ARTBAT"
                        ],
                        "correctAnswer": "Dimitri Vegas & Like Mike",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_18",
                        "type": "QCM",
                        "question": "Quel DJ néerlandais a fondé le label STMPD RCRDS ?",
                        "options": [
                            "Martin Garrix",
                            "Hardwell",
                            "Tiësto",
                            "Nicky Romero"
                        ],
                        "correctAnswer": "Martin Garrix",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_19",
                        "type": "QCM",
                        "question": "Quel genre domine l'Alternative Top 100 de DJ Mag ?",
                        "options": [
                            "Techno / House",
                            "Drum & Bass",
                            "Hardstyle",
                            "Trance"
                        ],
                        "correctAnswer": "Techno / House",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_20",
                        "type": "QCM",
                        "question": "Anyma est célèbre pour quel type de shows en 2024-2025 ?",
                        "options": [
                            "Visuels 3D immersifs",
                            "Sets vinyles uniquement",
                            "Shows pyrotechniques massifs",
                            "Sets de 10 heures"
                        ],
                        "correctAnswer": "Visuels 3D immersifs",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_21",
                        "type": "QCM",
                        "question": "Quel artiste a collaboré avec Anyma pour le titre 'Eternity' ?",
                        "options": [
                            "Chris Avantgarde",
                            "Tale Of Us",
                            "CamelPhat",
                            "Solomun"
                        ],
                        "correctAnswer": "Chris Avantgarde",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_22",
                        "type": "QCM",
                        "question": "Quel duo se cache derrière le projet Afterlife ?",
                        "options": [
                            "Tale Of Us",
                            "CamelPhat",
                            "Adriatique",
                            "Mind Against"
                        ],
                        "correctAnswer": "Tale Of Us",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_23",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour son concept 'Upclose' en 2024 ?",
                        "options": [
                            "Vintage Culture",
                            "Carl Cox",
                            "Jamie Jones",
                            "Michael Bibi"
                        ],
                        "correctAnswer": "Vintage Culture",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_24",
                        "type": "QCM",
                        "question": "Qui a été le n°1 Future House pendant plusieurs années ?",
                        "options": [
                            "Don Diablo",
                            "Oliver Heldens",
                            "Tchami",
                            "Brooks"
                        ],
                        "correctAnswer": "Don Diablo",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_25",
                        "type": "QCM",
                        "question": "MORTEN est le partenaire de quel DJ pour le projet Future Rave ?",
                        "options": [
                            "David Guetta",
                            "Tiësto",
                            "Afrojack",
                            "Steve Aoki"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_26",
                        "type": "QCM",
                        "question": "Quel DJ a performé au sommet de la tour Burj Khalifa ?",
                        "options": [
                            "David Guetta",
                            "Armin van Buuren",
                            "Tiësto",
                            "Martin Garrix"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_27",
                        "type": "QCM",
                        "question": "Quel artiste est l'auteur du tube 'Baddadan' en 2023-2024 ?",
                        "options": [
                            "Chase & Status",
                            "Hedex",
                            "Bou",
                            "Sub Focus"
                        ],
                        "correctAnswer": "Chase & Status",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_28",
                        "type": "QCM",
                        "question": "Quel genre musical est représenté par le label 'Defected' ?",
                        "options": [
                            "House",
                            "Techno",
                            "Trance",
                            "Dubstep"
                        ],
                        "correctAnswer": "House",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_29",
                        "type": "QCM",
                        "question": "Quel DJ est surnommé 'The King of Techno' ?",
                        "options": [
                            "Carl Cox",
                            "Sven Väth",
                            "Adam Beyer",
                            "Richie Hawtin"
                        ],
                        "correctAnswer": "Carl Cox",
                        "category": "Légendes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_30",
                        "type": "QCM",
                        "question": "Quel DJ a créé le label 'Drumcode' ?",
                        "options": [
                            "Adam Beyer",
                            "Amelie Lens",
                            "Marco Carola",
                            "Joseph Capriati"
                        ],
                        "correctAnswer": "Adam Beyer",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_31",
                        "type": "QCM",
                        "question": "Quel est le thème de Tomorrowland 2024 ?",
                        "options": [
                            "LIFE",
                            "Adscendo",
                            "The Reflection of Love",
                            "The Book of Wisdom"
                        ],
                        "correctAnswer": "LIFE",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_32",
                        "type": "QCM",
                        "question": "Dans quel pays se déroule Tomorrowland Winter ?",
                        "options": [
                            "France",
                            "Suisse",
                            "Autriche",
                            "Italie"
                        ],
                        "correctAnswer": "France",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_33",
                        "type": "QCM",
                        "question": "Quelle station de ski accueille Tomorrowland Winter ?",
                        "options": [
                            "Alpe d'Huez",
                            "Courchevel",
                            "Val Thorens",
                            "Les Deux Alpes"
                        ],
                        "correctAnswer": "Alpe d'Huez",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_34",
                        "type": "QCM",
                        "question": "Quel festival se déroule annuellement à Bayfront Park, Miami ?",
                        "options": [
                            "Ultra Music Festival",
                            "EDC Miami",
                            "Rolling Loud",
                            "III Points"
                        ],
                        "correctAnswer": "Ultra Music Festival",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_35",
                        "type": "QCM",
                        "question": "EDC Las Vegas se déroule sur quel type de lieu ?",
                        "options": [
                            "Un circuit automobile",
                            "Un parc urbain",
                            "Une plage",
                            "Un désert"
                        ],
                        "correctAnswer": "Un circuit automobile",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_36",
                        "type": "QCM",
                        "question": "Quel festival français se déroule au Barcarès ?",
                        "options": [
                            "Electrobeach (EMF)",
                            "Family Piknik",
                            "Les Plages Electroniques",
                            "Delta Festival"
                        ],
                        "correctAnswer": "Electrobeach (EMF)",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_37",
                        "type": "QCM",
                        "question": "Quel festival est connu pour sa scène 'Spider' géante ?",
                        "options": [
                            "Arcadia (Glastonbury/Ultra)",
                            "Tomorrowland",
                            "EDC",
                            "Creamfields"
                        ],
                        "correctAnswer": "Arcadia (Glastonbury/Ultra)",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_38",
                        "type": "QCM",
                        "question": "Le festival 'Untold' se déroule dans quel pays ?",
                        "options": [
                            "Roumanie",
                            "Hongrie",
                            "Bulgarie",
                            "Croatie"
                        ],
                        "correctAnswer": "Roumanie",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_39",
                        "type": "QCM",
                        "question": "Quel festival a lieu dans un ancien fort en Croatie ?",
                        "options": [
                            "Outlook / Dimensions",
                            "Ultra Europe",
                            "Sonus",
                            "Hideout"
                        ],
                        "correctAnswer": "Outlook / Dimensions",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_40",
                        "type": "QCM",
                        "question": "Quel festival néerlandais est dédié aux styles 'Hard' (Hardstyle/Hardcore) ?",
                        "options": [
                            "Defqon.1",
                            "Awakenings",
                            "Decibel Outdoor",
                            "Masters of Hardcore"
                        ],
                        "correctAnswer": "Defqon.1",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_41",
                        "type": "QCM",
                        "question": "Quel est le plus grand festival techno au monde se déroulant aux Pays-Bas ?",
                        "options": [
                            "Awakenings",
                            "DGTL",
                            "Time Warp",
                            "Loveland"
                        ],
                        "correctAnswer": "Awakenings",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_42",
                        "type": "QCM",
                        "question": "Quel festival itinérant a été créé par Elrow ?",
                        "options": [
                            "Elrow Town",
                            "elrow Island",
                            "The elrow Show",
                            "elrow Factory"
                        ],
                        "correctAnswer": "Elrow Town",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_43",
                        "type": "QCM",
                        "question": "Coachella se déroule dans quel État américain ?",
                        "options": [
                            "Californie",
                            "Nevada",
                            "Arizona",
                            "Floride"
                        ],
                        "correctAnswer": "Californie",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_44",
                        "type": "QCM",
                        "question": "Le festival 'Time Warp' est originaire de quel pays ?",
                        "options": [
                            "Allemagne",
                            "Belgique",
                            "Espagne",
                            "France"
                        ],
                        "correctAnswer": "Allemagne",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_45",
                        "type": "QCM",
                        "question": "Quel festival se déroule au pied des massifs de l'Alpe d'Huez ?",
                        "options": [
                            "Tomorrowland Winter",
                            "Snowbombing",
                            "Rise Festival",
                            "Polaris"
                        ],
                        "correctAnswer": "Tomorrowland Winter",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_46",
                        "type": "QCM",
                        "question": "Le festival 'Exit' se déroule dans une forteresse de quel pays ?",
                        "options": [
                            "Serbie",
                            "Croatie",
                            "Slovénie",
                            "Monténégro"
                        ],
                        "correctAnswer": "Serbie",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_47",
                        "type": "QCM",
                        "question": "Quel festival a remplacé la Love Parade à Berlin ?",
                        "options": [
                            "Rave The Planet",
                            "Mayday",
                            "Nature One",
                            "Airbeat One"
                        ],
                        "correctAnswer": "Rave The Planet",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_48",
                        "type": "QCM",
                        "question": "Quel festival anglais est célèbre pour ses champs de boue et sa Pyramid Stage ?",
                        "options": [
                            "Glastonbury",
                            "Reading & Leeds",
                            "Creamfields",
                            "Wireless"
                        ],
                        "correctAnswer": "Glastonbury",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_49",
                        "type": "QCM",
                        "question": "Le 'Holy Ship!' est quel type d'événement ?",
                        "options": [
                            "Une croisière festival",
                            "Un festival sur une île",
                            "Un festival dans une église",
                            "Un festival flottant"
                        ],
                        "correctAnswer": "Une croisière festival",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_50",
                        "type": "QCM",
                        "question": "Quel festival est organisé par les créateurs de Tomorrowland au Brésil ?",
                        "options": [
                            "Tomorrowland Brasil",
                            "Ultra Brasil",
                            "EDC Brazil",
                            "Lollapalooza Brazil"
                        ],
                        "correctAnswer": "Tomorrowland Brasil",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_51",
                        "type": "QCM",
                        "question": "Quel festival se déroule à Split, en Croatie ?",
                        "options": [
                            "Ultra Europe",
                            "Sonus",
                            "Hideout",
                            "Zrce Beach Festival"
                        ],
                        "correctAnswer": "Ultra Europe",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_52",
                        "type": "QCM",
                        "question": "Le festival 'Burning Man' a lieu dans quel désert ?",
                        "options": [
                            "Black Rock Desert",
                            "Mojave",
                            "Sonora",
                            "Sahara"
                        ],
                        "correctAnswer": "Black Rock Desert",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_53",
                        "type": "QCM",
                        "question": "Quel festival techno se déroule dans une ancienne base aérienne en Allemagne ?",
                        "options": [
                            "Nature One",
                            "Melt!",
                            "Airbeat One",
                            "Parookaville"
                        ],
                        "correctAnswer": "Nature One",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_54",
                        "type": "QCM",
                        "question": "Quel est le nom du festival de musique électronique de Lyon ?",
                        "options": [
                            "Nuits Sonores",
                            "Reperkusound",
                            "Peacock Society",
                            "Family Piknik"
                        ],
                        "correctAnswer": "Nuits Sonores",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_55",
                        "type": "QCM",
                        "question": "Tomorrowland a célébré quel anniversaire en 2024 ?",
                        "options": [
                            "20 ans",
                            "10 ans",
                            "15 ans",
                            "25 ans"
                        ],
                        "correctAnswer": "20 ans",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_56",
                        "type": "QCM",
                        "question": "Quelle ville accueille le festival 'Electric Daisy Carnival' principal ?",
                        "options": [
                            "Las Vegas",
                            "Orlando",
                            "Mexico",
                            "Tokyo"
                        ],
                        "correctAnswer": "Las Vegas",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_57",
                        "type": "QCM",
                        "question": "Le festival 'Sonar' se déroule dans quelle ville ?",
                        "options": [
                            "Barcelone",
                            "Madrid",
                            "Valence",
                            "Ibiza"
                        ],
                        "correctAnswer": "Barcelone",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_58",
                        "type": "QCM",
                        "question": "Quel festival barcelonais se scinde en 'Day' et 'Night' ?",
                        "options": [
                            "Sonar",
                            "Primavera Sound",
                            "Cruïlla",
                            "DGTL Barcelona"
                        ],
                        "correctAnswer": "Sonar",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_59",
                        "type": "QCM",
                        "question": "Quel festival est célèbre pour sa scène 'Steel Yard' ?",
                        "options": [
                            "Creamfields",
                            "Tomorrowland",
                            "Ultra",
                            "Reading"
                        ],
                        "correctAnswer": "Creamfields",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_60",
                        "type": "QCM",
                        "question": "Quel festival a lieu sur une île au milieu de Budapest ?",
                        "options": [
                            "Sziget",
                            "Balaton Sound",
                            "Volt",
                            "B My Lake"
                        ],
                        "correctAnswer": "Sziget",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_61",
                        "type": "QCM",
                        "question": "Le festival 'Kappa FuturFestival' se déroule dans quelle ville italienne ?",
                        "options": [
                            "Turin",
                            "Milan",
                            "Rome",
                            "Naples"
                        ],
                        "correctAnswer": "Turin",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_62",
                        "type": "QCM",
                        "question": "Quel festival techno parisien a lieu au Parc Floral ?",
                        "options": [
                            "Peacock Society",
                            "Weather Festival",
                            "Marvellous Island",
                            "Techno Parade"
                        ],
                        "correctAnswer": "Peacock Society",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_63",
                        "type": "QCM",
                        "question": "Quel festival se déroule dans le cadre naturel des gorges de l'Ardèche ?",
                        "options": [
                            "Delta Festival",
                            "Family Piknik",
                            "Les Plages Electroniques",
                            "Aucun de ceux-là"
                        ],
                        "correctAnswer": [
                            "Aucun de ceux-là"
                        ],
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_64",
                        "type": "QCM",
                        "question": "Le festival 'Sunburn' est le plus grand d'Asie, dans quel pays ?",
                        "options": [
                            "Inde",
                            "Thaïlande",
                            "Chine",
                            "Japon"
                        ],
                        "correctAnswer": "Inde",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_65",
                        "type": "QCM",
                        "question": "Quel festival belge est dédié à la musique techno 'hard' ?",
                        "options": [
                            "Voltage Festival",
                            "Tomorrowland",
                            "Dour",
                            "Rampage"
                        ],
                        "correctAnswer": "Voltage Festival",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_66",
                        "type": "QCM",
                        "question": "Quel festival de Bass Music est organisé à Anvers ?",
                        "options": [
                            "Rampage",
                            "Dour",
                            "Pukkelpop",
                            "Lotto Arena Festival"
                        ],
                        "correctAnswer": "Rampage",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_67",
                        "type": "QCM",
                        "question": "Quel festival a lieu sur les plages de Cannes ?",
                        "options": [
                            "Les Plages Electroniques",
                            "Delta Festival",
                            "Cannes Lions",
                            "Midi Festival"
                        ],
                        "correctAnswer": "Les Plages Electroniques",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_68",
                        "type": "QCM",
                        "question": "Le festival 'Mysteryland' se déroule dans quel pays ?",
                        "options": [
                            "Pays-Bas",
                            "Belgique",
                            "Allemagne",
                            "France"
                        ],
                        "correctAnswer": "Pays-Bas",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_69",
                        "type": "QCM",
                        "question": "Quel festival est considéré comme le plus vieux festival de musique électronique ?",
                        "options": [
                            "Mysteryland",
                            "Tomorrowland",
                            "Ultra",
                            "Love Parade"
                        ],
                        "correctAnswer": "Mysteryland",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_70",
                        "type": "QCM",
                        "question": "En 2025, Tomorrowland a annoncé quelle destination pour son nouveau festival ?",
                        "options": [
                            "Thaïlande",
                            "Japon",
                            "Australie",
                            "Afrique du Sud"
                        ],
                        "correctAnswer": "Thaïlande",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_71",
                        "type": "QCM",
                        "question": "Quel titre a propulsé Fred again.. sur le devant de la scène ?",
                        "options": [
                            "Marea (We’ve Lost Dancing)",
                            "Turn On The Lights",
                            "Delilah",
                            "Jungle"
                        ],
                        "correctAnswer": "Marea (We’ve Lost Dancing)",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_72",
                        "type": "QCM",
                        "question": "Quel est le vrai nom de Martin Garrix ?",
                        "options": [
                            "Martijn Garritsen",
                            "Martin Garrison",
                            "Marty Garrix",
                            "Martin Gerrit"
                        ],
                        "correctAnswer": "Martijn Garritsen",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_73",
                        "type": "QCM",
                        "question": "Quelle collaboration entre Skrillex, Fred again.. et Flowdan a été un tube en 2023 ?",
                        "options": [
                            "Rumble",
                            "Leavemealone",
                            "Baby again..",
                            "Supersonic"
                        ],
                        "correctAnswer": "Rumble",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_74",
                        "type": "QCM",
                        "question": "Quel DJ suédois a fondé le label 'Axtone' ?",
                        "options": [
                            "Axwell",
                            "Sebastian Ingrosso",
                            "Steve Angello",
                            "Eric Prydz"
                        ],
                        "correctAnswer": "Axwell",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_75",
                        "type": "QCM",
                        "question": "Quel est le nom de l'album concept de Justice sorti en 2024 ?",
                        "options": [
                            "Hyperdrama",
                            "Woman",
                            "Audio, Video, Disco",
                            "Cross"
                        ],
                        "correctAnswer": "Hyperdrama",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_76",
                        "type": "QCM",
                        "question": "Quel DJ est le visage du projet 'Future Rave' avec David Guetta ?",
                        "options": [
                            "MORTEN",
                            "Hugel",
                            "Tchami",
                            "Kungs"
                        ],
                        "correctAnswer": "MORTEN",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_77",
                        "type": "QCM",
                        "question": "Qui a produit le tube 'Losing It' ?",
                        "options": [
                            "Fisher",
                            "Chris Lake",
                            "Solardo",
                            "CamelPhat"
                        ],
                        "correctAnswer": "Fisher",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_78",
                        "type": "QCM",
                        "question": "Quel DJ techno est connu pour son masque de type 'Venitien' ?",
                        "options": [
                            "Boris Brejcha",
                            "Claptone",
                            "Malaa",
                            "Marshmello"
                        ],
                        "correctAnswer": "Boris Brejcha",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_79",
                        "type": "QCM",
                        "question": "Quel est le label créé par Solomun ?",
                        "options": [
                            "Diynamic",
                            "Afterlife",
                            "Innervisions",
                            "Cercle"
                        ],
                        "correctAnswer": "Diynamic",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_80",
                        "type": "QCM",
                        "question": "Quel DJ produit sous l'alias 'Eric Prydz', 'Pryda' et 'Cirez D' ?",
                        "options": [
                            "Eric Prydz",
                            "Adam Beyer",
                            "Deadmau5",
                            "Joris Voorn"
                        ],
                        "correctAnswer": "Eric Prydz",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_81",
                        "type": "QCM",
                        "question": "Quel est le titre du show holographique massif d'Eric Prydz ?",
                        "options": [
                            "HOLO",
                            "EPIC",
                            "VOYAGE",
                            "VISUALS"
                        ],
                        "correctAnswer": "HOLO",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_82",
                        "type": "QCM",
                        "question": "Quelle artiste belge a fondé le label 'Lenske' ?",
                        "options": [
                            "Amelie Lens",
                            "Charlotte de Witte",
                            "Anetha",
                            "Sara Landry"
                        ],
                        "correctAnswer": "Amelie Lens",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_83",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour ses sets fleuves de 24h ?",
                        "options": [
                            "Joseph Capriati",
                            "Marco Carola",
                            "Sven Väth",
                            "Carl Cox"
                        ],
                        "correctAnswer": "Joseph Capriati",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_84",
                        "type": "QCM",
                        "question": "Quel duo a produit le tube 'Cola' ?",
                        "options": [
                            "CamelPhat & Elderbrook",
                            "Meduza",
                            "Gorgon City",
                            "Fisher"
                        ],
                        "correctAnswer": "CamelPhat & Elderbrook",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_85",
                        "type": "QCM",
                        "question": "De quel groupe faisait partie Steve Angello, Sebastian Ingrosso et Axwell ?",
                        "options": [
                            "Swedish House Mafia",
                            "Daft Punk",
                            "Major Lazer",
                            "Disclosure"
                        ],
                        "correctAnswer": "Swedish House Mafia",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_86",
                        "type": "QCM",
                        "question": "Quel DJ est célèbre pour son titre 'Animals' ?",
                        "options": [
                            "Martin Garrix",
                            "Hardwell",
                            "Avicii",
                            "Tiësto"
                        ],
                        "correctAnswer": "Martin Garrix",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_87",
                        "type": "QCM",
                        "question": "Quel producteur français se cache derrière le projet 'Malaa' ?",
                        "options": [
                            "Sébastien Benett (présumé)",
                            "Tchami",
                            "Mercer",
                            "DJ Snake"
                        ],
                        "correctAnswer": "Sébastien Benett (présumé)",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_88",
                        "type": "QCM",
                        "question": "Quel DJ est l'auteur de 'Titanium' avec Sia ?",
                        "options": [
                            "David Guetta",
                            "Calvin Harris",
                            "Zedd",
                            "Alesso"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_89",
                        "type": "QCM",
                        "question": "Quel artiste a popularisé le genre 'High-Tech Minimal' ?",
                        "options": [
                            "Boris Brejcha",
                            "Paul Kalkbrenner",
                            "Solomun",
                            "Stephan Bodzin"
                        ],
                        "correctAnswer": "Boris Brejcha",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_90",
                        "type": "QCM",
                        "question": "Quel est le label de Tiësto ?",
                        "options": [
                            "Musical Freedom",
                            "Spinnin' Records",
                            "Armada Music",
                            "Protocol Recordings"
                        ],
                        "correctAnswer": "Musical Freedom",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_91",
                        "type": "QCM",
                        "question": "Quel DJ a fondé le label 'Owsla' ?",
                        "options": [
                            "Skrillex",
                            "Diplo",
                            "Dillon Francis",
                            "Zedd"
                        ],
                        "correctAnswer": "Skrillex",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_92",
                        "type": "QCM",
                        "question": "Quel artiste est connu pour ses émissions 'A State of Trance' (ASOT) ?",
                        "options": [
                            "Armin van Buuren",
                            "Above & Beyond",
                            "Paul van Dyk",
                            "Aly & Fila"
                        ],
                        "correctAnswer": "Armin van Buuren",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_93",
                        "type": "QCM",
                        "question": "Quel DJ français a produit 'I'm Good (Blue)' avec Bebe Rexha ?",
                        "options": [
                            "David Guetta",
                            "Kungs",
                            "Martin Solveig",
                            "Bob Sinclar"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_94",
                        "type": "QCM",
                        "question": "Qui a produit 'Piece Of Your Heart' ?",
                        "options": [
                            "Meduza",
                            "ARTBAT",
                            "CamelPhat",
                            "Vintage Culture"
                        ],
                        "correctAnswer": "Meduza",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_95",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour son style 'Ghetto House' ?",
                        "options": [
                            "Tchami",
                            "Malaa",
                            "Joyryde",
                            "Habstrakt"
                        ],
                        "correctAnswer": "Malaa",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_96",
                        "type": "QCM",
                        "question": "Quel artiste a mixé le premier set pour la chaîne 'Cercle' ?",
                        "options": [
                            "Møme",
                            "FKJ",
                            "Boris Brejcha",
                            "Solomun"
                        ],
                        "correctAnswer": "Møme",
                        "category": "Événements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_97",
                        "type": "QCM",
                        "question": "Quel est le label de Hardwell ?",
                        "options": [
                            "Revealed Recordings",
                            "STMPD RCRDS",
                            "Smash The House",
                            "Wall Recordings"
                        ],
                        "correctAnswer": "Revealed Recordings",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_98",
                        "type": "QCM",
                        "question": "Quel DJ est surnommé 'The Baron of Techno' ?",
                        "options": [
                            "Dave Clarke",
                            "Carl Cox",
                            "Ben Klock",
                            "Jeff Mills"
                        ],
                        "correctAnswer": "Dave Clarke",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_99",
                        "type": "QCM",
                        "question": "Quel artiste a créé le hit 'Levels' ?",
                        "options": [
                            "Avicii",
                            "Swedish House Mafia",
                            "Tiësto",
                            "Afrojack"
                        ],
                        "correctAnswer": "Avicii",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_100",
                        "type": "QCM",
                        "question": "Quel est le nom du label de Don Diablo ?",
                        "options": [
                            "Hexagon",
                            "Spinnin'",
                            "Future House Music",
                            "Heldeep"
                        ],
                        "correctAnswer": "Hexagon",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_101",
                        "type": "QCM",
                        "question": "Quelle artiste est surnommée la 'Queen of Techno' ?",
                        "options": [
                            "Charlotte de Witte",
                            "Amelie Lens",
                            "Nina Kraviz",
                            "Ellen Allien"
                        ],
                        "correctAnswer": "Charlotte de Witte",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_102",
                        "type": "QCM",
                        "question": "Quel DJ produit de la 'Bass House' au sein du label Confession ?",
                        "options": [
                            "Tchami",
                            "Malaa",
                            "Brohug",
                            "Dombresky"
                        ],
                        "correctAnswer": "Tchami",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_103",
                        "type": "QCM",
                        "question": "Quel artiste est l'auteur de l'album 'Discovery' ?",
                        "options": [
                            "Daft Punk",
                            "Discovery",
                            "Air",
                            "Cassius"
                        ],
                        "correctAnswer": "Daft Punk",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_104",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour son hit 'Deep Down' ?",
                        "options": [
                            "Alok",
                            "Vintage Culture",
                            "Bruno Martini",
                            "Cat Dealers"
                        ],
                        "correctAnswer": "Alok",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_105",
                        "type": "QCM",
                        "question": "Qui a produit 'Do It To It' en 2021 ?",
                        "options": [
                            "ACRAZE",
                            "Tiësto",
                            "James Hype",
                            "John Summit"
                        ],
                        "correctAnswer": "ACRAZE",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_106",
                        "type": "QCM",
                        "question": "Quel DJ est le leader du label 'STMPD' ?",
                        "options": [
                            "Martin Garrix",
                            "Julian Jordan",
                            "Mesto",
                            "Matt Nash"
                        ],
                        "correctAnswer": "Martin Garrix",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_107",
                        "type": "QCM",
                        "question": "Quel genre musical définit Peggy Gou ?",
                        "options": [
                            "K-House / Tech House",
                            "Techno",
                            "Trance",
                            "EDM"
                        ],
                        "correctAnswer": "K-House / Tech House",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_108",
                        "type": "QCM",
                        "question": "Quel artiste a produit 'Turn On The Lights again..' ?",
                        "options": [
                            "Fred again..",
                            "Skrillex",
                            "Four Tet",
                            "Jamie xx"
                        ],
                        "correctAnswer": "Fred again..",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_109",
                        "type": "QCM",
                        "question": "Quel DJ est célèbre pour son show 'Voyage' ?",
                        "options": [
                            "Anyma",
                            "Eric Prydz",
                            "Zedd",
                            "Alesso"
                        ],
                        "correctAnswer": "Anyma",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_110",
                        "type": "QCM",
                        "question": "Quel DJ néerlandais a créé le hit 'The Business' ?",
                        "options": [
                            "Tiësto",
                            "Don Diablo",
                            "Sam Feldt",
                            "Oliver Heldens"
                        ],
                        "correctAnswer": "Tiësto",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_111",
                        "type": "QCM",
                        "question": "Quel groupe a produit 'Greyhound' ?",
                        "options": [
                            "Swedish House Mafia",
                            "Justice",
                            "Daft Punk",
                            "The Chemical Brothers"
                        ],
                        "correctAnswer": "Swedish House Mafia",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_112",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour son concept 'Life' ?",
                        "options": [
                            "Salvatore Ganacci",
                            "Fisher",
                            "James Hype",
                            "Hugel"
                        ],
                        "correctAnswer": "Salvatore Ganacci",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_113",
                        "type": "QCM",
                        "question": "Quel artiste a remixé 'Pepas' de Farruko ?",
                        "options": [
                            "Tiësto",
                            "David Guetta",
                            "Robin Schulz",
                            "Afrojack"
                        ],
                        "correctAnswer": "Tiësto",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_114",
                        "type": "QCM",
                        "question": "Quel DJ français a produit 'Substitution' avec Purple Disco Machine ?",
                        "options": [
                            "Kungs",
                            "David Guetta",
                            "Ofenbach",
                            "Jean-Michel Jarre"
                        ],
                        "correctAnswer": "Kungs",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_115",
                        "type": "QCM",
                        "question": "Quel est le genre musical de 'Purple Disco Machine' ?",
                        "options": [
                            "Nu-Disco",
                            "Techno",
                            "Hardstyle",
                            "Ambient"
                        ],
                        "correctAnswer": "Nu-Disco",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_116",
                        "type": "QCM",
                        "question": "Qui a produit le titre 'Ferrari' ?",
                        "options": [
                            "James Hype",
                            "Fisher",
                            "Chris Lake",
                            "Meduza"
                        ],
                        "correctAnswer": "James Hype",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_117",
                        "type": "QCM",
                        "question": "Quel DJ est l'auteur du titre 'Drugs From Amsterdam' ?",
                        "options": [
                            "Mau P",
                            "John Summit",
                            "Dom Dolla",
                            "Chris Lake"
                        ],
                        "correctAnswer": "Mau P",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_118",
                        "type": "QCM",
                        "question": "Quel est le label de DJ Snake ?",
                        "options": [
                            "Premiere Classe",
                            "Pardon My French",
                            "Interscope",
                            "Mad Decent"
                        ],
                        "correctAnswer": "Premiere Classe",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_119",
                        "type": "QCM",
                        "question": "Quel artiste a produit 'Lean On' avec Major Lazer ?",
                        "options": [
                            "Dj Snake",
                            "Skrillex",
                            "David Guetta",
                            "Zedd"
                        ],
                        "correctAnswer": "Dj Snake",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_120",
                        "type": "QCM",
                        "question": "Qui est l'auteur de 'One' ?",
                        "options": [
                            "Swedish House Mafia",
                            "Daft Punk",
                            "Justice",
                            "Sebastian Ingrosso"
                        ],
                        "correctAnswer": "Swedish House Mafia",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_121",
                        "type": "QCM",
                        "question": "Quel DJ français est surnommé 'le parrain de la French Touch' ?",
                        "options": [
                            "Laurent Garnier",
                            "David Guetta",
                            "Bob Sinclar",
                            "Martin Solveig"
                        ],
                        "correctAnswer": "Laurent Garnier",
                        "category": "Légendes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_122",
                        "type": "QCM",
                        "question": "Quelle ville française accueille l'événement 'Cercle' ?",
                        "options": [
                            "Partout dans le monde",
                            "Seulement Paris",
                            "Lyon",
                            "Marseille"
                        ],
                        "correctAnswer": "Partout dans le monde",
                        "category": "Culture",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_123",
                        "type": "QCM",
                        "question": "Quel DJ français a organisé un concert géant devant les Pyramides de Gizeh ?",
                        "options": [
                            "David Guetta",
                            "Jean-Michel Jarre",
                            "DJ Snake",
                            "Kungs"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_124",
                        "type": "QCM",
                        "question": "Quel est le nom du duo composé de DJ Snake, Tchami, Malaa et Mercer ?",
                        "options": [
                            "Pardon My French",
                            "French Touch",
                            "The Crew",
                            "Parisian Connection"
                        ],
                        "correctAnswer": "Pardon My French",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_125",
                        "type": "QCM",
                        "question": "Quel DJ français est l'auteur de 'Never Going Home' ?",
                        "options": [
                            "Kungs",
                            "Hugel",
                            "Ofenbach",
                            "The Avener"
                        ],
                        "correctAnswer": "Kungs",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_126",
                        "type": "QCM",
                        "question": "Quel artiste français a produit l'album 'Audio, Video, Disco' ?",
                        "options": [
                            "Justice",
                            "Daft Punk",
                            "Air",
                            "Phoenix"
                        ],
                        "correctAnswer": "Justice",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_127",
                        "type": "QCM",
                        "question": "Quel DJ français est connu pour ses sets au Blue Marlin Ibiza ?",
                        "options": [
                            "Pete Tong (n'est pas français)",
                            "Bob Sinclar",
                            "David Guetta",
                            "Jean Claude Ades"
                        ],
                        "correctAnswer": "Bob Sinclar",
                        "category": "Scène Française",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_128",
                        "type": "QCM",
                        "question": "Quel festival français se déroule dans le Théâtre Antique d'Orange ?",
                        "options": [
                            "Positiv Festival",
                            "Nuits Sonores",
                            "Delta Festival",
                            "Kolorz"
                        ],
                        "correctAnswer": "Positiv Festival",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_129",
                        "type": "QCM",
                        "question": "Quel DJ français a rempli le Parc des Princes en 2022 ?",
                        "options": [
                            "DJ Snake",
                            "David Guetta",
                            "Kungs",
                            "Martin Solveig"
                        ],
                        "correctAnswer": "DJ Snake",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_130",
                        "type": "QCM",
                        "question": "Quel est le vrai nom de DJ Snake ?",
                        "options": [
                            "William Grigahcine",
                            "William Snake",
                            "Willy Guetta",
                            "William Bernard"
                        ],
                        "correctAnswer": "William Grigahcine",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_131",
                        "type": "QCM",
                        "question": "Quel DJ français a créé le hit 'Love Generation' ?",
                        "options": [
                            "Bob Sinclar",
                            "David Guetta",
                            "Martin Solveig",
                            "Laurent Wolf"
                        ],
                        "correctAnswer": "Bob Sinclar",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_132",
                        "type": "QCM",
                        "question": "Quel est le domaine de prédilection de Jean-Michel Jarre ?",
                        "options": [
                            "Musique électronique / Synthétiseurs",
                            "Techno Minimale",
                            "EDM Mainstream",
                            "Drum & Bass"
                        ],
                        "correctAnswer": "Musique électronique / Synthétiseurs",
                        "category": "Légendes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_133",
                        "type": "QCM",
                        "question": "Qui a produit 'Hello' avec Dragonette ?",
                        "options": [
                            "Martin Solveig",
                            "David Guetta",
                            "Bob Sinclar",
                            "Joachim Garraud"
                        ],
                        "correctAnswer": "Martin Solveig",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_134",
                        "type": "QCM",
                        "question": "Quel DJ français a lancé le projet 'Future House' ?",
                        "options": [
                            "Tchami",
                            "Malaa",
                            "Mercer",
                            "Dj Snake"
                        ],
                        "correctAnswer": "Tchami",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_135",
                        "type": "QCM",
                        "question": "Quel artiste français a produit le titre 'Sun' ?",
                        "options": [
                            "Møme",
                            "Petit Biscuit",
                            "The Avener",
                            "Fakear"
                        ],
                        "correctAnswer": "Møme",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_136",
                        "type": "QCM",
                        "question": "Quel duo français est connu pour son titre 'D.A.N.C.E' ?",
                        "options": [
                            "Justice",
                            "Daft Punk",
                            "The Blaze",
                            "Polo & Pan"
                        ],
                        "correctAnswer": "Justice",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_137",
                        "type": "QCM",
                        "question": "Quel DJ français a un podcast nommé 'The Martin Solveig Show' ?",
                        "options": [
                            "Martin Solveig",
                            "Bob Sinclar",
                            "David Guetta",
                            "Joachim Garraud"
                        ],
                        "correctAnswer": "Martin Solveig",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_138",
                        "type": "QCM",
                        "question": "Quel est le club parisien mythique situé sous le pont Alexandre III ?",
                        "options": [
                            "Showcase (devenu Bridge / Faust)",
                            "Rex Club",
                            "La Machine",
                            "Concrete"
                        ],
                        "correctAnswer": "Showcase (devenu Bridge / Faust)",
                        "category": "Lieux",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_139",
                        "type": "QCM",
                        "question": "Quel DJ français est connu pour ses chapeaux ?",
                        "options": [
                            "Brodinski",
                            "Gesaffelstein",
                            "Bob Sinclar (parfois)",
                            "Tristan Garner"
                        ],
                        "correctAnswer": "Bob Sinclar (parfois)",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_140",
                        "type": "QCM",
                        "question": "Quel artiste français a produit 'Sunset Lover' ?",
                        "options": [
                            "Petit Biscuit",
                            "Madeon",
                            "Kungs",
                            "Fakear"
                        ],
                        "correctAnswer": "Petit Biscuit",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_141",
                        "type": "QCM",
                        "question": "Quelle ville est le berceau de la Techno ?",
                        "options": [
                            "Detroit",
                            "Chicago",
                            "Berlin",
                            "Londres"
                        ],
                        "correctAnswer": "Detroit",
                        "category": "Histoire",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_142",
                        "type": "QCM",
                        "question": "Quelle ville est le berceau de la House ?",
                        "options": [
                            "Chicago",
                            "New York",
                            "Ibiza",
                            "San Francisco"
                        ],
                        "correctAnswer": "Chicago",
                        "category": "Histoire",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_143",
                        "type": "QCM",
                        "question": "Quel club de Berlin est célèbre pour sa politique d'entrée stricte ?",
                        "options": [
                            "Berghain",
                            "Watergate",
                            "Tresor",
                            "Sisyphos"
                        ],
                        "correctAnswer": "Berghain",
                        "category": "Lieux",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_144",
                        "type": "QCM",
                        "question": "Qui est le physionomiste le plus célèbre du Berghain ?",
                        "options": [
                            "Sven Marquardt",
                            "Sven Väth",
                            "Carl Cox",
                            "Paul Kalkbrenner"
                        ],
                        "correctAnswer": "Sven Marquardt",
                        "category": "Légendes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_145",
                        "type": "QCM",
                        "question": "Quel club d'Ibiza possède une piscine iconique ?",
                        "options": [
                            "Ushuaïa",
                            "Pacha",
                            "Amnesia",
                            "Privilege"
                        ],
                        "correctAnswer": "Ushuaïa",
                        "category": "Lieux",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_146",
                        "type": "QCM",
                        "question": "Quel club d'Ibiza est célèbre pour ses cerises ?",
                        "options": [
                            "Pacha",
                            "Amnesia",
                            "Ushuaïa",
                            "DC-10"
                        ],
                        "correctAnswer": "Pacha",
                        "category": "Lieux",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_147",
                        "type": "QCM",
                        "question": "Quel club londonien mythique a fermé ses portes en 2023 ?",
                        "options": [
                            "Printworks",
                            "Fabric",
                            "Ministry of Sound",
                            "Studio 338"
                        ],
                        "correctAnswer": "Printworks",
                        "category": "Lieux",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_148",
                        "type": "QCM",
                        "question": "Quel est le nom du système de sonorisation le plus réputé au monde ?",
                        "options": [
                            "Funktion-One",
                            "L-Acoustics",
                            "Pioneer DJ",
                            "JBL"
                        ],
                        "correctAnswer": "Funktion-One",
                        "category": "Technique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_149",
                        "type": "QCM",
                        "question": "Quel DJ a mixé au sommet de l'Arc de Triomphe en 2017 ?",
                        "options": [
                            "David Guetta",
                            "DJ Snake",
                            "Jean-Michel Jarre",
                            "Kungs"
                        ],
                        "correctAnswer": "DJ Snake",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_150",
                        "type": "QCM",
                        "question": "Quel DJ français a créé l'hymne de l'Euro 2016 ?",
                        "options": [
                            "David Guetta",
                            "Martin Solveig",
                            "Bob Sinclar",
                            "Kungs"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_151",
                        "type": "QCM",
                        "question": "Quel artiste a popularisé le 'Future Rave' ?",
                        "options": [
                            "David Guetta & MORTEN",
                            "Tiësto",
                            "Martin Garrix",
                            "Afrojack"
                        ],
                        "correctAnswer": "David Guetta & MORTEN",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_152",
                        "type": "QCM",
                        "question": "Quel label a été fondé par Armin van Buuren ?",
                        "options": [
                            "Armada Music",
                            "Spinnin' Records",
                            "Revealed Recordings",
                            "Musical Freedom"
                        ],
                        "correctAnswer": "Armada Music",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_153",
                        "type": "QCM",
                        "question": "Quel DJ a été n°1 mondial le plus de fois au DJ Mag ?",
                        "options": [
                            "Armin van Buuren (5 fois)",
                            "Martin Garrix",
                            "Tiësto",
                            "David Guetta"
                        ],
                        "correctAnswer": "Armin van Buuren (5 fois)",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_154",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour son tube '7 rings' (remix) ?",
                        "options": [
                            "Hugel",
                            "Vintage Culture",
                            "Alok",
                            "Tiësto"
                        ],
                        "correctAnswer": "Hugel",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_155",
                        "type": "QCM",
                        "question": "Qui a produit 'Morenita' ?",
                        "options": [
                            "Hugel",
                            "Dombresky",
                            "Tchami",
                            "Malaa"
                        ],
                        "correctAnswer": "Hugel",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_156",
                        "type": "QCM",
                        "question": "Quel DJ est le roi de la 'Techno Minimale' allemande ?",
                        "options": [
                            "Paul Kalkbrenner",
                            "Boris Brejcha",
                            "Ben Klock",
                            "Sven Väth"
                        ],
                        "correctAnswer": "Paul Kalkbrenner",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_157",
                        "type": "QCM",
                        "question": "Quel artiste a produit 'Sky and Sand' ?",
                        "options": [
                            "Paul Kalkbrenner",
                            "Solomun",
                            "Stephan Bodzin",
                            "Tale Of Us"
                        ],
                        "correctAnswer": "Paul Kalkbrenner",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_158",
                        "type": "QCM",
                        "question": "Quel est le festival emblématique de Miami ayant lieu en mars ?",
                        "options": [
                            "Ultra Music Festival",
                            "EDC Miami",
                            "Rolling Loud",
                            "III Points"
                        ],
                        "correctAnswer": "Ultra Music Festival",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_159",
                        "type": "QCM",
                        "question": "Quel monument parisien a accueilli David Guetta pour un concert en 2021 ?",
                        "options": [
                            "Le Louvre",
                            "Eiffel Tower",
                            "Arc de Triomphe",
                            "Notre-Dame"
                        ],
                        "correctAnswer": "Le Louvre",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_160",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour ses shows visuels intitulés 'Afterlife' ?",
                        "options": [
                            "Tale Of Us",
                            "CamelPhat",
                            "Anyma",
                            "Adriatique"
                        ],
                        "correctAnswer": "Anyma",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_161",
                        "type": "QCM",
                        "question": "Quel duo a produit 'Children of a Lesser God' ?",
                        "options": [
                            "ARTBAT",
                            "CamelPhat",
                            "Meduza",
                            "Mathame"
                        ],
                        "correctAnswer": "ARTBAT",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_162",
                        "type": "QCM",
                        "question": "Quel est le pays d'origine du duo ARTBAT ?",
                        "options": [
                            "Ukraine",
                            "Russie",
                            "Allemagne",
                            "Pologne"
                        ],
                        "correctAnswer": "Ukraine",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_163",
                        "type": "QCM",
                        "question": "Quel DJ a produit le tube 'Mwaki' en 2024 ?",
                        "options": [
                            "Zerb",
                            "Tiësto",
                            "Major Lazer",
                            "Hugel"
                        ],
                        "correctAnswer": "Zerb",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_164",
                        "type": "QCM",
                        "question": "Quel genre musical fusionne la House et les rythmes africains ?",
                        "options": [
                            "Afro House",
                            "Amapiano",
                            "Tribal House",
                            "Gqom"
                        ],
                        "correctAnswer": "Afro House",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_165",
                        "type": "QCM",
                        "question": "Quel DJ sud-africain est une légende de la House ?",
                        "options": [
                            "Black Coffee",
                            "Shimza",
                            "Themba",
                            "Culoe De Song"
                        ],
                        "correctAnswer": "Black Coffee",
                        "category": "Légendes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_166",
                        "type": "QCM",
                        "question": "Quel DJ est célèbre pour son titre 'Drive' avec David Guetta ?",
                        "options": [
                            "Black Coffee",
                            "Solomun",
                            "Vintage Culture",
                            "Alok"
                        ],
                        "correctAnswer": "Black Coffee",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_167",
                        "type": "QCM",
                        "question": "Combien de scènes Tomorrowland propose-t-il environ chaque année ?",
                        "options": [
                            "15-20 scènes",
                            "5 scènes",
                            "10 scènes",
                            "plus de 50"
                        ],
                        "correctAnswer": "15-20 scènes",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_168",
                        "type": "QCM",
                        "question": "Quel DJ a fondé le label 'KNTXT' ?",
                        "options": [
                            "Charlotte de Witte",
                            "Amelie Lens",
                            "Nina Kraviz",
                            "Indira Paganotto"
                        ],
                        "correctAnswer": "Charlotte de Witte",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_169",
                        "type": "QCM",
                        "question": "Quel DJ est célèbre for son show 'Prismatic' ?",
                        "options": [
                            "Anyma",
                            "Eric Prydz",
                            "Zedd",
                            "Alesso"
                        ],
                        "correctAnswer": "Anyma",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_170",
                        "type": "QCM",
                        "question": "Quel duo produit les titres de 'The Blaze' ?",
                        "options": [
                            "Guillaume et Jonathan Alric",
                            "Guy-Manuel et Thomas",
                            "Gaspard et Xavier",
                            "Ed Banger Boys"
                        ],
                        "correctAnswer": "Guillaume et Jonathan Alric",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_171",
                        "type": "QCM",
                        "question": "Quel DJ est connu pour mixer avec quatre platines simultanément ?",
                        "options": [
                            "Carl Cox",
                            "Richie Hawtin",
                            "Jeff Mills",
                            "Tous ces réponses"
                        ],
                        "correctAnswer": "Tous ces réponses",
                        "category": "Technique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_172",
                        "type": "QCM",
                        "question": "Quel est le logiciel de mixage DJ le plus utilisé au monde ?",
                        "options": [
                            "Rekordbox",
                            "Serato",
                            "Traktor",
                            "Virtual DJ"
                        ],
                        "correctAnswer": "Rekordbox",
                        "category": "Technique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_173",
                        "type": "QCM",
                        "question": "Quel bouton sur une platine CDJ permet de synchroniser deux pistes ?",
                        "options": [
                            "Sync",
                            "Cue",
                            "Play",
                            "Jog"
                        ],
                        "correctAnswer": "Sync",
                        "category": "Technique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_174",
                        "type": "QCM",
                        "question": "Comment appelle-t-on le fait de caler deux morceaux au tempo ?",
                        "options": [
                            "Le calage (Beatmatching)",
                            "Le mixage",
                            "Le scratch",
                            "Le looping"
                        ],
                        "correctAnswer": "Le calage (Beatmatching)",
                        "category": "Technique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_175",
                        "type": "QCM",
                        "question": "Quel DJ a mixé pendant l'investiture d'un président français ?",
                        "options": [
                            "Cerrone",
                            "Martin Solveig",
                            "David Guetta",
                            "Bob Sinclar"
                        ],
                        "correctAnswer": "Bob Sinclar",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_176",
                        "type": "QCM",
                        "question": "Quel monument a été 'allumé' par Jean-Michel Jarre en 1990 ?",
                        "options": [
                            "La Défense",
                            "La Tour Eiffel",
                            "L'Etoile",
                            "La Concorde"
                        ],
                        "correctAnswer": "La Défense",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_177",
                        "type": "QCM",
                        "question": "Quel est le BPM moyen de la Techno ?",
                        "options": [
                            "125-145 BPM",
                            "100 BPM",
                            "160 BPM",
                            "80 BPM"
                        ],
                        "correctAnswer": "125-145 BPM",
                        "category": "Technique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_178",
                        "type": "QCM",
                        "question": "Quel est le BPM moyen de la House ?",
                        "options": [
                            "120-128 BPM",
                            "140 BPM",
                            "90 BPM",
                            "110 BPM"
                        ],
                        "correctAnswer": "120-128 BPM",
                        "category": "Technique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_179",
                        "type": "QCM",
                        "question": "Quel sous-genre de la Techno est plus lent et mélodique ?",
                        "options": [
                            "Melodic Techno",
                            "Hard Techno",
                            "Acid Techno",
                            "Dub Techno"
                        ],
                        "correctAnswer": "Melodic Techno",
                        "category": "Genres",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_180",
                        "type": "QCM",
                        "question": "Quel label a popularisé la Melodic Techno ?",
                        "options": [
                            "Afterlife",
                            "Drumcode",
                            "Lenske",
                            "Confession"
                        ],
                        "correctAnswer": "Afterlife",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_181",
                        "type": "QCM",
                        "question": "Quel DJ porte un masque de 'lapin' ?",
                        "options": [
                            "Aucun",
                            "Deadmau5",
                            "Marshmello",
                            "Vini Vici"
                        ],
                        "correctAnswer": "Aucun",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_182",
                        "type": "QCM",
                        "question": "Où se déroule l'Amsterdam Music Festival (AMF) ?",
                        "options": [
                            "Johan Cruyff Arena",
                            "Ziggo Dome",
                            "RAI Amsterdam",
                            "Paradiso"
                        ],
                        "correctAnswer": "Johan Cruyff Arena",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_183",
                        "type": "QCM",
                        "question": "Qui a été n°1 DJ Mag en 2025 ?",
                        "options": [
                            "David Guetta",
                            "Tiësto",
                            "Alok",
                            "Martin Garrix"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Classements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_184",
                        "type": "QCM",
                        "question": "Quel DJ néerlandais a créé 'Adagio for Strings' (mix) ?",
                        "options": [
                            "Tiësto",
                            "Armin van Buuren",
                            "Hardwell",
                            "Afrojack"
                        ],
                        "correctAnswer": "Tiësto",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_185",
                        "type": "QCM",
                        "question": "Quel est le titre du premier album de David Guetta ?",
                        "options": [
                            "Just a Little More Love",
                            "One Love",
                            "Pop Life",
                            "Guetta Blaster"
                        ],
                        "correctAnswer": "Just a Little More Love",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_186",
                        "type": "QCM",
                        "question": "Quel DJ français a produit 'Sound of Freedom' ?",
                        "options": [
                            "Bob Sinclar",
                            "David Guetta",
                            "Martin Solveig",
                            "Laurent Wolf"
                        ],
                        "correctAnswer": "Bob Sinclar",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_187",
                        "type": "QCM",
                        "question": "Quel est le festival emblématique de la scène Psytrance au Portugal ?",
                        "options": [
                            "Boom Festival",
                            "Tomorrowland",
                            "Ultra",
                            "Sonus"
                        ],
                        "correctAnswer": "Boom Festival",
                        "category": "Festivals",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_188",
                        "type": "QCM",
                        "question": "Quel artiste a produit 'Opus' ?",
                        "options": [
                            "Eric Prydz",
                            "Deadmau5",
                            "Tiësto",
                            "Avicii"
                        ],
                        "correctAnswer": "Eric Prydz",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_189",
                        "type": "QCM",
                        "question": "Quel DJ a produit 'I Found U' ?",
                        "options": [
                            "Axwell",
                            "Ingrosso",
                            "Angello",
                            "Eric Prydz"
                        ],
                        "correctAnswer": "Axwell",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_190",
                        "type": "QCM",
                        "question": "Quel DJ est connu for sa résidence 'F*** Me I'm Famous' ?",
                        "options": [
                            "David Guetta",
                            "Bob Sinclar",
                            "Cathy Guetta",
                            "Tiësto"
                        ],
                        "correctAnswer": "David Guetta",
                        "category": "Bio",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_191",
                        "type": "QCM",
                        "question": "Quel est le pays d'origine de Nicky Romero ?",
                        "options": [
                            "Pays-Bas",
                            "Suède",
                            "Norvège",
                            "Danemark"
                        ],
                        "correctAnswer": "Pays-Bas",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_192",
                        "type": "QCM",
                        "question": "Quel est le nom du label de Steve Angello ?",
                        "options": [
                            "Size Records",
                            "Axtone",
                            "Refune",
                            "Musical Freedom"
                        ],
                        "correctAnswer": "Size Records",
                        "category": "Labels",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_193",
                        "type": "QCM",
                        "question": "Quel DJ est connu for son titre 'Toulouse' ?",
                        "options": [
                            "Nicky Romero",
                            "Avicii",
                            "Tiësto",
                            "Afrojack"
                        ],
                        "correctAnswer": "Nicky Romero",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_194",
                        "type": "QCM",
                        "question": "Quel est le titre culte de Robert Miles ?",
                        "options": [
                            "Children",
                            "Silence",
                            "Insomnia",
                            "Sandstorm"
                        ],
                        "correctAnswer": "Children",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_195",
                        "type": "QCM",
                        "question": "Quel groupe a produit 'Insomnia' ?",
                        "options": [
                            "Faithless",
                            "Underworld",
                            "The Prodigy",
                            "Orbital"
                        ],
                        "correctAnswer": "Faithless",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_196",
                        "type": "QCM",
                        "question": "Quel DJ est l'auteur de 'Sandstorm' ?",
                        "options": [
                            "Darude",
                            "Tiësto",
                            "Paul van Dyk",
                            "Scot Project"
                        ],
                        "correctAnswer": "Darude",
                        "category": "Musique",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_197",
                        "type": "QCM",
                        "question": "Quel monument français a accueilli le set de Michael Bibi après sa guérison ?",
                        "options": [
                            "Aucun",
                            "Tour Eiffel",
                            "Louvre",
                            "Arc de Triomphe"
                        ],
                        "correctAnswer": "Aucun",
                        "category": "Événements",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_198",
                        "type": "QCM",
                        "question": "Quel DJ est célèbre for son show 'Afterlife' au Mexique ?",
                        "options": [
                            "Tale Of Us",
                            "Anyma",
                            "Chris Avantgarde",
                            "Tous"
                        ],
                        "correctAnswer": "Tale Of Us",
                        "category": "Performance",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_199",
                        "type": "QCM",
                        "question": "Quel duo a produit 'Hyperdrama' ?",
                        "options": [
                            "Justice",
                            "Daft Punk",
                            "The Blaze",
                            "Air"
                        ],
                        "correctAnswer": "Justice",
                        "category": "Artistes",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    },
                    {
                        "id": "edm_200",
                        "type": "QCM",
                        "question": "Quelle est la catégorie principale de Dropsiders ?",
                        "options": [
                            "Electro / Techno / Bass",
                            "Pop",
                            "Rock",
                            "Rap"
                        ],
                        "correctAnswer": "Electro / Techno / Bass",
                        "category": "General",
                        "author": "Dropsiders",
                        "timestamp": "01061988-03-09T03:54:51.089Z"
                    }
                ];

                const musicTitlesPool = [
                    "Carl Cox - I Want You", "Nina Kraviz - Ghetto Kraviz", "Amelie Lens - Follow",
                    "Charlotte de Witte - Sgadi Li Mi", "Adam Beyer - Your Mind", "Skrillex - Bangarang",
                    "SVDDEN DEATH - Behemoth", "Excision - Throwin' Elbows", "Subtronics - Griztronics",
                    "Boris Brejcha - Gravity", "Laurent Garnier - The Man With The Red Face",
                    "Jeff Mills - The Bells", "Derrick May - Strings of Life", "Carl Craig - Sandstorms",
                    "Ummet Ozcan - Xanadu", "David Guetta - Titanium", "Martin Garrix - Animals",
                    "Swedish House Mafia - One", "Avicii - Levels", "Tiësto - The Business",
                    "Fisher - Losing It", "Fred again.. - Marea (We’ve Lost Dancing)",
                    "Meduza - Piece Of Your Heart", "Zurb - Mwaki", "James Hype - Ferrari",
                    "Mau P - Drugs From Amsterdam", "Peggy Gou - (It Goes Like) Nanana",
                    "Anyma - Eternity", "Tale Of Us - Afterlife", "Chris Lake - Turn Off The Lights",
                    "Dom Dolla - Rhyme Dust", "John Summit - Where You Are", "Mochakk - Jealous",
                    "Hugel - Morenita", "Vintage Culture - Deep Down", "Alok - Hear Me Now",
                    "Don Diablo - Cutting Shapes", "Oliver Heldens - Gecko", "Tchami - Adieu",
                    "Malaa - Notorious", "DJ Snake - Turn Down For What", "Kungs - This Girl"
                ];

                // Merge: Keep user quizzes (non-default IDs) and add our 200 new questions
                const userQuizzes = active.filter((q: any) =>
                    !q.id.startsWith('edm_') && !['q1', 'bt1', 'img1', 'old_default'].includes(q.id)
                );

                const merged = [...defaultQuizzes, ...userQuizzes];

                if (active.length !== merged.length || activeRaw === "[]") {
                    await env.CHAT_KV.put('quiz_active', JSON.stringify(merged));
                    active = merged;
                }
            }

            return new Response(JSON.stringify(active), { status: 200, headers });
        }

        if (path === '/api/quiz/leaderboard' && request.method === 'GET') {
            const raw = await env.CHAT_KV.get('quiz_leaderboard') || "[]";
            return new Response(raw, { status: 200, headers });
        }

        if (path === '/api/quiz/leaderboard' && request.method === 'POST') {
            const result = await request.json();
            const raw = await env.CHAT_KV.get('quiz_leaderboard') || "[]";
            const leaderboard = JSON.parse(raw);

            leaderboard.push(result);
            // Sort by score (desc) then time (asc)
            leaderboard.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.time - b.time;
            });

            // Keep only top 20
            const sliced = leaderboard.slice(0, 20);
            await env.CHAT_KV.put('quiz_leaderboard', JSON.stringify(sliced));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/musique/charts/update' && request.method === 'POST') {
            const adminPass = (request.headers.get('X-Admin-Password') || '').trim();
            const requiredPass = '01061988';
            if (adminPass !== requiredPass) {
                return new Response(JSON.stringify({ error: 'Unauthorized', debug: 'Forced match fail' }), { status: 401, headers });
            }

            try {
                const newCharts = await request.json();
                if (!newCharts.beatport || !newCharts.traxsource) {
                    return new Response(JSON.stringify({ error: 'Invalid data structure' }), { status: 400, headers });
                }

                await env.CHAT_KV.put('musique_charts', JSON.stringify(newCharts));
                await env.CHAT_KV.put('last_charts_update', Date.now().toString());
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/musique/charts/rotate' && request.method === 'POST') {
            const adminPass = request.headers.get('X-Admin-Password');
            const requiredPass = env.ADMIN_PASSWORD || '01061988';
            if (adminPass !== requiredPass) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            }

            const currentChartsRaw = await env.CHAT_KV.get('musique_charts');
            if (!currentChartsRaw) return new Response(JSON.stringify({ error: 'No charts in KV' }), { status: 404, headers });

            try {
                const charts = JSON.parse(currentChartsRaw);

                // Rotation logic
                if (charts.beatport && charts.beatport.length > 0) {
                    const first = charts.beatport.shift();
                    charts.beatport.push(first);
                    charts.beatport.forEach((item: any, i: number) => item.rank = i + 1);
                }
                if (charts.traxsource && charts.traxsource.length > 0) {
                    const first = charts.traxsource.shift();
                    charts.traxsource.push(first);
                    charts.traxsource.forEach((item: any, i: number) => item.rank = i + 1);
                }
                if (charts.juno && charts.juno.length > 0) {
                    const first = charts.juno.shift();
                    charts.juno.push(first);
                    charts.juno.forEach((item: any, i: number) => item.rank = i + 1);
                }

                await env.CHAT_KV.put('musique_charts', JSON.stringify(charts));
                await env.CHAT_KV.put('last_charts_update', Date.now().toString());
                return new Response(JSON.stringify({ success: true, charts }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/musique/charts' && request.method === 'GET') {
            const chartsRaw = await env.CHAT_KV.get('musique_charts');
            let charts = null;
            try { charts = chartsRaw ? JSON.parse(chartsRaw) : null; } catch (e) { }

            // Force update if incomplete (we want top 10)
            if (charts && charts.beatport && charts.beatport.length >= 10) {
                const lastUpdate = await env.CHAT_KV.get('last_charts_update');
                return new Response(JSON.stringify({ ...charts, lastUpdate }), { status: 200, headers });
            }

            // Initial default if KV is empty
            const defaultCharts = {
                beatport: [
                    { id: '23308330', rank: 1, title: 'neck (Extended Mix)', artist: 'Mau P', label: 'Black Book Records', url: 'https://www.beatport.com/fr/track/neck/23308330', embedUrl: 'https://embed.beatport.com/?id=23308330&type=track' },
                    { id: '23451068', rank: 2, title: 'Make My Day (Original Mix)', artist: 'ESSE (US)', label: 'ESSEntial.', url: 'https://www.beatport.com/fr/track/make-my-day/23451068', embedUrl: 'https://embed.beatport.com/?id=23451068&type=track' },
                    { id: '23904036', rank: 3, title: 'Loco Loco (Extended Mix)', artist: 'Reinier Zonneveld, GORDO (US)', label: "SPINNIN' RECORDS", url: 'https://www.beatport.com/fr/track/loco-loco/23904036', embedUrl: 'https://embed.beatport.com/?id=23904036&type=track' },
                    { id: '23567812', rank: 4, title: 'Eats Everything (TMB Remix)', artist: 'TMB', label: 'Trick', url: '#', embedUrl: 'https://embed.beatport.com/?id=23567812&type=track' },
                    { id: '23412345', rank: 5, title: 'Saving Up (Extended)', artist: 'Dom Dolla', label: 'Three Six Zero', url: '#', embedUrl: 'https://embed.beatport.com/?id=23412345&type=track' },
                    { id: '23112233', rank: 6, title: 'Where You Are', artist: 'John Summit, Hayla', label: 'Off The Grid', url: '#', embedUrl: 'https://embed.beatport.com/?id=23112233&type=track' },
                    { id: '23998877', rank: 7, title: 'Be The One', artist: 'Eli Brown', label: 'Polydor', url: '#', embedUrl: 'https://embed.beatport.com/?id=23998877&type=track' },
                    { id: '23887766', rank: 8, title: 'Drugs From Amsterdam', artist: 'Mau P', label: 'Repopulate Mars', url: '#', embedUrl: 'https://embed.beatport.com/?id=23887766&type=track' },
                    { id: '23776655', rank: 9, title: 'Rhyme Dust', artist: 'MK, Dom Dolla', label: 'Area 10', url: '#', embedUrl: 'https://embed.beatport.com/?id=23776655&type=track' },
                    { id: '23665544', rank: 10, title: 'Atmosphere', artist: 'Fisher, Kita Alexander', label: 'Catch & Release', url: '#', embedUrl: 'https://embed.beatport.com/?id=23665544&type=track' }
                ],
                traxsource: [
                    { id: 'ts-14359025', rank: 1, title: 'Take Me Up (ft. Donna Blakely)', artist: 'Ralphi Rosario, Bob Sinclar', label: 'Altra Moda Music', url: 'https://traxsource.com/track/14359025/take-me-up-ft-donna-blakely', embedUrl: 'https://embed.traxsource.com/player/track/14359025?autoplay=1&play=1' },
                    { id: 'ts-14359001', rank: 2, title: 'Need You Tonight', artist: 'David Penn', label: 'Defected', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359001' },
                    { id: 'ts-14359002', rank: 3, title: 'Afraid To Feel', artist: 'LF SYSTEM', label: 'Warner', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359002' },
                    { id: 'ts-14359003', rank: 4, title: 'Keep Pushing', artist: 'Boris Dlugosch', label: 'Peppermint', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359003' },
                    { id: 'ts-14359004', rank: 5, title: 'Finally', artist: 'Kings of Tomorrow', label: 'Defected', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359004' },
                    { id: 'ts-14359005', rank: 6, title: 'The Cure & The Cause', artist: 'Fish Go Deep', label: 'Defected', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359005' },
                    { id: 'ts-14359006', rank: 7, title: 'Strings of Life', artist: 'Soul Central', label: 'Defected', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359006' },
                    { id: 'ts-14359007', rank: 8, title: 'Love Sensation', artist: 'Loleatta Holloway', label: 'Salsoul', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359007' },
                    { id: 'ts-14359008', rank: 9, title: 'Big Love', artist: 'Pete Heller', label: 'Defected', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359008' },
                    { id: 'ts-14359009', rank: 10, title: 'Your Love', artist: 'Frankie Knuckles', label: 'Trax', url: '#', embedUrl: 'https://embed.traxsource.com/player/track/14359009' }
                ],
                juno: [
                    { id: 'jn-7425809-02', rank: 1, title: 'Bombaclart (Furniss remix)', artist: 'Furniss / Majistrate', label: 'Low Down Deep Recordings', url: 'https://www.junodownload.com/products/bombaclart-furniss-remix/7425809-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7425809-02.m3u/?autoplay=1' },
                    { id: 'jn-7425801', rank: 2, title: 'Original Nuttah', artist: 'UK Apache & Shy FX', label: 'SOUR', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425801' },
                    { id: 'jn-7425802', rank: 3, title: 'Tour', artist: 'Macky Gee', label: 'Elevate', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425802' },
                    { id: 'jn-7425803', rank: 4, title: 'Afterglow', artist: 'Wilkinson', label: 'RAM', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425803' },
                    { id: 'jn-7425804', rank: 5, title: 'Mr Happy', artist: 'DJ Hazard & Distorted Minds', label: 'Playaz', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425804' },
                    { id: 'jn-7425805', rank: 6, title: 'Desire', artist: 'Sub Focus & Dimension', label: 'Virgin', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425805' },
                    { id: 'jn-7425806', rank: 7, title: 'Solar System', artist: 'Sub Focus', label: 'RAM', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425806' },
                    { id: 'jn-7425807', rank: 8, title: 'Dead Limit', artist: 'Noisia & The Upbeats', label: 'Vision', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425807' },
                    { id: 'jn-7425808', rank: 9, title: 'Hackers', artist: 'Metrik', label: 'Hospital', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425808' },
                    { id: 'jn-7425810', rank: 10, title: 'Circles', artist: 'Adam F', label: 'Section 5', url: '#', embedUrl: 'https://www.junodownload.com/player-embed/7425810' }
                ]
            };
            await env.CHAT_KV.put('musique_charts', JSON.stringify(defaultCharts));
            await env.CHAT_KV.put('last_charts_update', Date.now().toString());
            return new Response(JSON.stringify(defaultCharts), { status: 200, headers });
        }

        // All API routes should be handled before this point.
        // If we reached here and start with /api/, it's a true 404 for the API.
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
                    const dataFile = await fetchGitHubFile(dataSource, gitConfig);
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
        const scheduledGitConfig = { OWNER, REPO, TOKEN };

        // 1. Fetch current settings to get the lineup
        const res = await fetchGitHubFile(SETTINGS_PATH, scheduledGitConfig);
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
                await saveGitHubFile(SETTINGS_PATH, content, 'Auto-switch live status (Scheduled)', fileData.sha, scheduledGitConfig);
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
            await saveGitHubFile(SETTINGS_PATH, content, 'Auto-cleanup & switch (Scheduled)', fileData.sha, scheduledGitConfig);
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

        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (!lastChartsUpdate || (Date.now() - parseInt(lastChartsUpdate)) > threeDaysMs) {
            console.log('Rotating charts...');
            const currentChartsRaw = await env.CHAT_KV.get('musique_charts');
            if (currentChartsRaw) {
                try {
                    const charts = JSON.parse(currentChartsRaw);

                    // Actual Rotation Logic: Shift the top 10 items to simulate movement
                    if (charts.beatport && charts.beatport.length > 0) {
                        const first = charts.beatport.shift();
                        charts.beatport.push(first);
                        charts.beatport.forEach((item: any, i: number) => item.rank = i + 1);
                    }
                    if (charts.traxsource && charts.traxsource.length > 0) {
                        const first = charts.traxsource.shift();
                        charts.traxsource.push(first);
                        charts.traxsource.forEach((item: any, i: number) => item.rank = i + 1);
                    }
                    if (charts.juno && charts.juno.length > 0) {
                        const first = charts.juno.shift();
                        charts.juno.push(first);
                        charts.juno.forEach((item: any, i: number) => item.rank = i + 1);
                    }

                    await env.CHAT_KV.put('musique_charts', JSON.stringify(charts));
                    await env.CHAT_KV.put('last_charts_update', Date.now().toString());
                } catch (e) {
                    console.error('Chart rotation error:', e);
                }
            }
        }
    }
};
