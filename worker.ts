// @ts-nocheck
import webpush from 'web-push';

const VAPID_PUB = '';
const VAPID_PRI = '';

async function sendPushNotification(env, payload, filterFn = null) {
    if (!env.CHAT_KV) {
        console.error('CHAT_KV not bound, cannot send push');
        return;
    }
    try {
        const list = await env.CHAT_KV.list({ prefix: 'push_sub_' });
        const publicKey = env.VAPID_PUBLIC_KEY || VAPID_PUB;
        const privateKey = env.VAPID_PRIVATE_KEY || VAPID_PRI;
        const subject = 'mailto:contact@dropsiders.fr';

        webpush.setVapidDetails(subject, publicKey, privateKey);

        const promises = list.keys.map(async (key) => {
            const subRaw = await env.CHAT_KV.get(key.name);
            if (!subRaw) return;
            try {
                const subData = JSON.parse(subRaw);
                const { subscription } = subData;
                
                // If a filter function is provided, check if this subscription matches
                if (filterFn && !filterFn(subData)) {
                    return;
                }

                if (subscription && subscription.endpoint) {
                    await webpush.sendNotification(subscription, JSON.stringify(payload));
                    console.log('Push sent to:', subscription.endpoint.substring(0, 30) + '...');
                }
            } catch (err) {
                // Remove expired/invalid subscriptions
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await env.CHAT_KV.delete(key.name);
                }
                console.error('Push error for sub:', key.name, err.message);
            }
        });

        await Promise.allSettled(promises);
    } catch (e) {
        console.error('Global push broadcast error:', e);
    }
}

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
const NEWS_CONTENT_FILES = ['src/data/news_content_3.json', 'src/data/news_content_2.json', 'src/data/news_content_1.json', 'src/data/news_content_legacy.json'];
const RECAPS_CONTENT_FILES = ['src/data/recaps_content_2.json', 'src/data/recaps_content_1.json'];
const EDITORS_PATH = 'src/data/editors.json';
const PENDING_SUBMISSIONS_PATH = 'src/data/pending_submissions.json';
const TRACKLISTS_PATH = 'src/data/tracklists.json';
const TRACKLISTS_PENDING_PATH = 'src/data/tracklists_pending.json';
const CONTACTS_PATH = 'src/data/contacts.json';
const WIKI_DJS_PATH = 'src/data/wiki_djs.json';
const WIKI_CLUBS_PATH = 'src/data/wiki_clubs.json';
const WIKI_FESTIVALS_PATH = 'src/data/wiki_festivals.json';

// Simple un-expiring cache per isolate for performance
const githubCache = new Map();

async function fetchGitHubFile(filePath, config) {
    const { OWNER, REPO, TOKEN } = config;
    if (!TOKEN) return null;
    
    // Check in-memory cache first
    const cacheKey = `${OWNER}/${REPO}/${filePath}`;
    // If we want a 60s cache:
    const cached = githubCache.get(cacheKey);
    if (cached && (Date.now() - cached.time < 60000)) {
        return cached.data;
    }

    const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?t=${Date.now()}`;
    const response = await fetch(getUrl, {
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json' }
    });
    const fileData = await response.json();
    if (!response.ok) {
        console.error(`GitHub API error for ${filePath}: ${response.status} ${response.statusText}`);
        if (response.status === 404) return { content: [], sha: null };
        return null;
    }
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
        const result = { content: JSON.parse(content), sha: fileData.sha, rawData: fileData };
        // Save to cache
        githubCache.set(cacheKey, { time: Date.now(), data: result });
        return result;
    } catch (e) {
        return { content: [], sha: fileData.sha, rawData: fileData };
    }
}

async function saveGitHubFile(filePath, content, message, sha, config) {
    const { OWNER, REPO, TOKEN } = config;
    if (!TOKEN) return { ok: false, error: 'GITHUB_TOKEN is missing' };
    
    // Invalidate cache immediately to ensure next fetch is fresh
    const cacheKey = `${OWNER}/${REPO}/${filePath}`;
    githubCache.delete(cacheKey);

    const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
    const encodedContent = utf8Encode(JSON.stringify(content, null, 2));
    const finalMessage = message;
    
    const response = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'User-Agent': 'Cloudflare-Worker', 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalMessage, content: encodedContent, sha })
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

        // --- DISCORD OAUTH ---
        const DISCORD_CLIENT_ID = '1481163258080788602';
        const DISCORD_REDIRECT_URI = path.startsWith('/auth/discord') 
            ? (url.origin.includes('localhost') ? 'http://localhost:5173/auth/discord/callback' : 'https://dropsiders.fr/auth/discord/callback')
            : '';

        if (path === '/auth/discord' && request.method === 'GET') {
            const discordAuthUrl = new URL('https://discord.com/oauth2/authorize');
            discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
            discordAuthUrl.searchParams.set('redirect_uri', url.origin.includes('localhost') ? 'http://localhost:5173/auth/discord/callback' : 'https://dropsiders.fr/auth/discord/callback');
            discordAuthUrl.searchParams.set('response_type', 'code');
            discordAuthUrl.searchParams.set('scope', 'identify email');
            return Response.redirect(discordAuthUrl.toString(), 302);
        }

        if (path === '/auth/discord/callback' && request.method === 'GET') {
            const code = url.searchParams.get('code');
            const htmlError = (msg: string) => new Response(`
                <!DOCTYPE html><html><head><title>Erreur</title></head>
                <body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
                    <div style="text-align:center">
                        <h2 style="color:#ff1241">Erreur d'authentification</h2>
                        <p>${msg}</p>
                        <script>setTimeout(()=>window.close(),3000)</script>
                    </div>
                </body></html>`, { status: 400, headers: {'Content-Type': 'text/html'} });

            if (!code) return htmlError('Code manquant');
            if (!env.DISCORD_CLIENT_SECRET) return htmlError('Configuration serveur manquante');

            try {
                // Exchange code for token
                const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: DISCORD_CLIENT_ID,
                        client_secret: env.DISCORD_CLIENT_SECRET,
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: url.origin.includes('localhost') ? 'http://localhost:5173/auth/discord/callback' : 'https://dropsiders.fr/auth/discord/callback'
                    })
                });

                if (!tokenRes.ok) {
                    const err = await tokenRes.text();
                    console.error('Discord token error:', err);
                    return htmlError('Erreur lors de l\'échange du code');
                }

                const tokenData = await tokenRes.json();

                // Get user info
                const userRes = await fetch('https://discord.com/api/users/@me', {
                    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
                });

                if (!userRes.ok) return htmlError('Impossible de récupérer le profil Discord');

                const discordUser = await userRes.json();
                const userData = {
                    id: discordUser.id,
                    username: discordUser.global_name || discordUser.username,
                    email: discordUser.email,
                    avatar: discordUser.avatar 
                        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0') % 5}.png`,
                    provider: 'discord'
                };

                // Return HTML that sends user data to parent window via postMessage
                return new Response(`
                    <!DOCTYPE html><html><head><title>Connexion...</title></head>
                    <body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
                        <div style="text-align:center">
                            <div style="width:40px;height:40px;border:3px solid #5865F2;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div>
                            <p style="color:#888;font-size:12px">Connexion en cours...</p>
                        </div>
                        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
                        <script>
                            try {
                                const userData = ${JSON.stringify(userData)};
                                if (window.opener) {
                                    window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS', user: userData }, '*');
                                }
                            } catch(e) {}
                            setTimeout(() => window.close(), 1000);
                        </script>
                    </body></html>`, { status: 200, headers: {'Content-Type': 'text/html'} });

            } catch(e: any) {
                console.error('Discord callback error:', e);
                return htmlError('Erreur interne: ' + e.message);
            }
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

        // --- NEW: SITEMAP GENERATOR ---
        if (path === '/sitemap.xml') {
            const urls = [
                { loc: '/', priority: '1.0' },
                { loc: '/news', priority: '0.8' },
                { loc: '/recaps', priority: '0.8' },
                { loc: '/agenda', priority: '0.8' },
                { loc: '/galerie', priority: '0.7' },
                { loc: '/community', priority: '0.6' }
            ];

            try {
                const git = { OWNER, REPO, TOKEN };
                const news = await fetchGitHubFile('src/data/news.json', git);
                const recaps = await fetchGitHubFile('src/data/recaps.json', git);
                const agenda = await fetchGitHubFile('src/data/agenda.json', git);

                if (news?.content) {
                    news.content.forEach(item => {
                        const slug = item.link?.split('/').pop() || `${item.id}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                        urls.push({ loc: `/news/${slug}`, lastmod: item.date || undefined });
                    });
                }
                if (recaps?.content) {
                    recaps.content.forEach(item => {
                        const slug = item.link?.split('/').pop() || `${item.id}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                        urls.push({ loc: `/recaps/${slug}`, lastmod: item.date || undefined });
                    });
                }
                if (agenda?.content) {
                    agenda.content.forEach(item => {
                        urls.push({ loc: `/agenda` }); // Agenda is one page for now? Or depends on structure.
                    });
                }

                const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>https://dropsiders.fr${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod.split('T')[0]}</lastmod>` : ''}
    ${u.priority ? `<priority>${u.priority}</priority>` : '<priority>0.5</priority>'}
  </url>`).join('\n')}
</urlset>`;
                return new Response(sitemap, { headers: { 'Content-Type': 'application/xml' } });
            } catch (e) {
                return new Response('Error generating sitemap', { status: 500 });
            }
        }

        // --- API: SCRAPINGBEE CREDITS PROXY ---
        if (path === '/api/proxy-scrapingbee-usage' && request.method === 'GET') {
            const SB_KEY = env.SCRAPINGBEE_API_KEY || '';
            try {
                const sbRes = await fetch(`https://app.scrapingbee.com/api/v1/usage?api_key=${SB_KEY}`);
                if (!sbRes.ok) return new Response(JSON.stringify({ error: 'ScrapingBee API error' }), { status: 502, headers });
                const sbData = await sbRes.json();
                return new Response(JSON.stringify(sbData), { headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Proxy error' }), { status: 500, headers });
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
            const auddToken = takeover.auddToken || env.AUDD_TOKEN || '';
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

        // --- API: COMMUNITY PLAYER XP ---
        if (path === '/api/community/sync-xp' && request.method === 'POST') {
            const body = await request.json();
            const { email, xp, level } = body;
            if (!email) return new Response(JSON.stringify({ error: 'Email requis' }), { status: 400, headers });

            const key = `community_player_xp_${email.toLowerCase().trim()}`;
            const data = {
                xp: xp || 0,
                level: level || 0,
                lastUpdate: new Date().toISOString()
            };

            await env.CHAT_KV.put(key, JSON.stringify(data));
            return new Response(JSON.stringify({ success: true, data }), { headers });
        }

        if (path === '/api/community/get-xp' && request.method === 'GET') {
            const email = url.searchParams.get('email');
            if (!email) return new Response(JSON.stringify({ error: 'Email requis' }), { status: 400, headers });

            const key = `community_player_xp_${email.toLowerCase().trim()}`;
            const data = await env.CHAT_KV.get(key);

            if (!data) return new Response(JSON.stringify({ xp: 0, level: 0 }), { headers });
            return new Response(data, { headers });
        }

        // --- API: IMAGE PROXY (Bypass CORS for Cropper) ---
        if (path === '/api/proxy-image' && request.method === 'GET') {
            const imageUrl = url.searchParams.get('url');
            if (!imageUrl) return new Response('URL missing', { status: 400, headers });
            
            try {
                const imgRes = await fetch(imageUrl, {
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                    },
                    redirect: 'follow'
                });
                if (!imgRes.ok) return new Response('Failed to fetch image', { status: imgRes.status, headers });
                
                const contentType = imgRes.headers.get('Content-Type') || 'image/jpeg';
                const imgData = await imgRes.arrayBuffer();
                
                const proxyHeaders = new Headers(headers);
                proxyHeaders.set('Content-Type', contentType);
                proxyHeaders.set('Cache-Control', 'public, max-age=86400');
                
                return new Response(imgData, { headers: proxyHeaders });
            } catch (e) {
                return new Response('Proxy error', { status: 500, headers });
            }
        }

        // --- API: DOWNLOADER PROXY ---

        if (path === '/api/downloader-proxy' && request.method === 'POST') {
            const body = await request.json();
            let targetUrl = body.url;
            const headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            };

            if (!targetUrl) return new Response(JSON.stringify({ error: 'URL requise' }), { status: 400, headers });

            // 1. URL CLEANER & NORMALIZER
            try {
                const urlObj = new URL(targetUrl);
                // Handle YouTube variants
                if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                    if (urlObj.pathname.includes('/shorts/')) {
                        const shortId = urlObj.pathname.split('/shorts/')[1].split('?')[0];
                        targetUrl = `https://www.youtube.com/watch?v=${shortId}`;
                    } else {
                        const videoId = urlObj.searchParams.get('v');
                        if (videoId) targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    }
                }
                // Handle Instagram
                if (urlObj.hostname.includes('instagram.com')) {
                    targetUrl = targetUrl.split('?')[0];
                }
            } catch (e) { }

            // 2. YOUTUBE SPECIALIZED API (dlsrv.online / YT1S style)
            if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
                try {
                    const videoId = targetUrl.includes('v=') ? targetUrl.split('v=')[1].split('&')[0] : targetUrl.split('/').pop()?.split('?')[0];
                    if (videoId) {
                        const appOrigin = 'ec5876a5-f1a2-43c5-9f88-9958757942a4';
                        const reqHeaders = {
                            'Content-Type': 'application/json',
                            'x-do-app-origin': appOrigin,
                            'Referer': `https://embed.dlsrv.online/v1/full?videoId=${videoId}`,
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                        };

                        const infoRes = await fetch(`https://embed.dlsrv.online/api/info`, {
                            method: 'POST',
                            headers: reqHeaders,
                            body: JSON.stringify({ videoId })
                        });

                        if (infoRes.ok) {
                            const infoData = await infoRes.json() as any;
                            const isAudio = body.downloadMode === 'audio' || body.aFormat === 'mp3';
                            const format = isAudio ? 'mp3' : 'mp4';
                            
                            const dlRes = await fetch(`https://embed.dlsrv.online/api/download/${format}`, {
                                method: 'POST',
                                headers: reqHeaders,
                                body: JSON.stringify({ videoId, format, quality: isAudio ? '320' : '720' })
                            });

                            const dlData = await dlRes.json() as any;
                            if (dlData.url) {
                                return new Response(JSON.stringify({
                                    status: 'success',
                                    url: dlData.url,
                                    filename: dlData.filename || `${videoId}.${format}`,
                                    title: infoData.title || 'YouTube Media'
                                }), { headers });
                            }
                        }
                    }
                } catch (e) { console.error("YT API Fail:", e); }
            }

            // 3. INSTAGRAM SPECIALIZED API (FastDL.app)
            if (targetUrl.includes('instagram.com')) {
                try {
                    const msecRes = await fetch('https://fastdl.app/msec', { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const ts = parseInt(await msecRes.text());
                    const payload = targetUrl + ts;
                    const msgUint8 = new TextEncoder().encode(payload);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
                    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

                    const params = new URLSearchParams();
                    params.append('sf_url', targetUrl);
                    params.append('ts', ts.toString());
                    params.append('_ts', Date.now().toString());
                    params.append('_s', hashHex);

                    const fastDlRes = await fetch('https://api-wh.fastdl.app/api/convert', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                            'Origin': 'https://fastdl.app',
                            'Referer': 'https://fastdl.app/',
                            'User-Agent': 'Mozilla/5.0'
                        },
                        body: params.toString()
                    });

                    const fastDlData = await fastDlRes.json() as any;
                    if (fastDlData.success && fastDlData.data?.length > 0) {
                        return new Response(JSON.stringify({
                            status: fastDlData.data.length > 1 ? 'picker' : 'success',
                            url: fastDlData.data[0].url,
                            picker: fastDlData.data.length > 1 ? fastDlData.data.map((item: any) => ({
                                url: item.url,
                                type: item.type,
                                thumb: item.thumbnail
                            })) : undefined,
                            title: fastDlData.data[0].title || 'Instagram Content'
                        }), { headers });
                    }
                } catch (e) { console.error("IG API Fail:", e); }
            }

            // 4. MULTI-INSTANCE COBALT FALLBACK (Stealth Mode)
            const cobaltInstances = [
                'https://nuko-c.meowing.de',
                'https://cobalt.k69.ch',
                'https://sunny.imput.net',
                'https://nachos.imput.net',
                'https://api.cobalt.tools'
            ];

            for (const instance of cobaltInstances) {
                try {
                    const res = await fetch(instance, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Origin': 'https://cobalt.tools',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        body: JSON.stringify({
                            url: targetUrl,
                            videoQuality: '720',
                            downloadMode: 'tunnel',
                            isNoTTWatermark: true
                        }),
                        signal: AbortSignal.timeout(5000)
                    });

                    if (res.ok) {
                        const data = await res.json() as any;
                        if (data.url || data.picker) return new Response(JSON.stringify(data), { headers });
                    }
                } catch (e) { continue; }
            }

            // 5. FINAL TIKWM FALLBACK
            try {
                const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`);
                const tikData = await tikRes.json() as any;
                if (tikData.data) return new Response(JSON.stringify({ status: 'success', url: tikData.data.play, title: tikData.data.title || 'TikTok Content' }), { headers });
            } catch (e) { }

            return new Response(JSON.stringify({
                status: 'error',
                text: 'Désolé, tous les serveurs de secours sont saturés. Réessaie dans quelques secondes.'
            }), { status: 500, headers });
        }

        // --- API: UPLOAD (R2) ---
        if (path === '/api/upload' && request.method === 'POST') {
            try {
                const body = await request.json();
                const { filename, content, type, path: subFolder } = body;
                if (!content || !filename) return new Response(JSON.stringify({ error: 'Données manquantes' }), { status: 400, headers });

                // Content is base64
                const base64Data = content.split(',')[1] || content;
                const bytes = Buffer.from(base64Data, 'base64');

                // Generate Unique Hash for deduplication
                const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);

                // Preserve extension and clean filename
                const extension = filename.split('.').pop() || (type && type.startsWith('audio/') ? 'mp3' : 'jpg');
                const cleanName = filename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

                // Final Key in R2
                const targetFolder = subFolder || (type && type.startsWith('audio/') ? 'mp3' : 'uploads');
                const key = `${targetFolder}/${hashHex}-${cleanName}.${extension}`;

                await env.R2.put(key, bytes, {
                    httpMetadata: { contentType: type || 'application/octet-stream' }
                });

                return new Response(JSON.stringify({
                    success: true,
                    url: `/uploads/${key}`
                }), { headers });
            } catch (e) {
                console.error('Upload error:', e);
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/r2/delete' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { key } = await request.json();
                if (!key) return new Response(JSON.stringify({ error: 'Key missing' }), { status: 400, headers });
                
                // key might be a URL like /uploads/uploads/file.jpg or a path like uploads/file.jpg
                let r2Key = key;
                if (r2Key.includes('://')) {
                    try { r2Key = new URL(r2Key).pathname; } catch (e) {}
                }
                
                // First slash check
                if (r2Key.startsWith('/')) r2Key = r2Key.substring(1);

                // If it starts with uploads/ twice from a path like /uploads/uploads/foo.jpg
                // The router part is the FIRST /uploads/, the R2 key is everything AFTER it.
                if (r2Key.startsWith('uploads/')) {
                    // We only strip the first 'uploads/' because that's the Cloudflare Worker route prefix
                    r2Key = r2Key.substring(8);
                }

                await env.R2.delete(decodeURIComponent(r2Key));
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- SERVE UPLOADS FROM R2 ---
        if (path.startsWith('/uploads/') && request.method === 'GET') {
            const rawKey = path.replace('/uploads/', '');
            const key = decodeURIComponent(rawKey);
            
            let object = await env.R2.get(key);
            
            // Fallback: Si pas trouvé sous la clé directe (ex: uploads/file.jpg)
            // essayer sans le préfixe 'uploads/' (au cas où il a été migré à la racine)
            if (!object && key.startsWith('uploads/')) {
                object = await env.R2.get(key.replace('uploads/', ''));
            }
            
            // Fallback inverse: essayer avec le préfixe 'uploads/'
            // (Utile pour les anciens uploads qui n'auraient pas le double /uploads/ dans leur URL)
            if (!object && !key.startsWith('uploads/') && !key.startsWith('migrated/')) {
                object = await env.R2.get('uploads/' + key);
            }

            if (!object) {
                // Fallback aux assets originaux (ex: fichiers encore sur GitHub dans public/uploads)
                const assetsBinding = env.APP_ASSETS || env.ASSETS;
                if (assetsBinding) {
                    // Si on a un double /uploads/ (ex: /uploads/uploads/file.jpg)
                    // on normalise pour le binding Pages qui attend /uploads/file.jpg
                    let normalizedPath = path;
                    if (path.startsWith('/uploads/uploads/')) {
                        normalizedPath = path.replace('/uploads/uploads/', '/uploads/');
                    }
                    
                    const fallbackUrl = new URL(normalizedPath, request.url);
                    const fallbackResponse = await assetsBinding.fetch(new Request(fallbackUrl.toString(), request));
                    if (fallbackResponse.ok) return fallbackResponse;
                }
                return new Response('Not Found', { status: 404 });
            }

            const assetHeaders = new Headers();
            object.writeHttpMetadata(assetHeaders);
            assetHeaders.set('Access-Control-Allow-Origin', '*');
            assetHeaders.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache

            return new Response(object.body, { headers: assetHeaders });
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
            const cleanContent = content
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
        // Helper: decode passwords stored as b64:<base64value> in editors.json
        const decodePass = (p: string) => p && p.startsWith('b64:') ? atob(p.slice(4)) : p;
        const adminPassword = (env.ADMIN_PASSWORD || '').trim();
        const requestPassword = (request.headers.get('X-Admin-Password') || '').trim();
        const requestUsername = (request.headers.get('X-Admin-Username') || '').trim();

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
            path.startsWith('/api/invoices') ||
            path === '/api/upload' ||
            path.startsWith('/api/pdfs') ||
            path.startsWith('/api/instagram-contest') ||
            path.startsWith('/api/quiz/contest') ||
            path === '/api/wiki/update-photo' ||
            path === '/api/wiki/approve-bulk' ||
            path === '/api/r2/stats' ||
            path === '/api/r2/duplicates' ||
            path === '/api/admin/broken-images' ||
            path === '/api/broken-images' ||
            path === '/api/admin/validate-photo' ||
            path === '/api/admin/validate-photo-bulk' ||
            path === '/api/admin/unused-r2-images' ||
            path === '/api/admin/bulk-update-year' ||
            path === '/api/admin/cleanup-past-agenda' ||
            path === '/api/admin/reset-leaderboards' ||
            path === '/api/admin/clean-encoding' ||
            path === '/api/quiz/reset-blind-test' ||
            path === '/api/r2/delete' ||
            path === '/api/r2/list' ||
            path === '/api/admin/remove-broken-image' ||
            path === '/api/admin/auto-fix-photos' ||
            path === '/api/wiki/add' ||
            path === '/api/wiki/update' ||
            path === '/api/wiki/delete' ||
            path === '/api/admin/remove-broken-image-bulk' ||
            path === '/api/agenda/favorites'
        );

        // --- API: PUSH NOTIFICATIONS (pre-auth, public endpoints) ---
        // Helper: generate a short stable KV key from endpoint URL
        const makePushKey = async (endpoint) => {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
            const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').substring(0,32);
            return `push_sub_${hex}`;
        };

        if (path === '/api/push/subscribe' && request.method === 'POST') {
            try {
                const { subscription, favorites } = await request.json();
                if (!subscription || !subscription.endpoint) {
                    return new Response(JSON.stringify({ error: 'Invalid subscription' }), { status: 400, headers });
                }
                if (env.CHAT_KV) {
                    const subKey = await makePushKey(subscription.endpoint);
                    await env.CHAT_KV.put(subKey, JSON.stringify({
                        subscription,
                        favorites: favorites || [],
                        timestamp: Date.now()
                    }), { expirationTtl: 60 * 60 * 24 * 90 }); // 90 days
                    console.log('Push subscription saved:', subKey);
                }
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/push/unsubscribe' && request.method === 'POST') {
            try {
                const { endpoint } = await request.json();
                if (env.CHAT_KV && endpoint) {
                    const subKey = await makePushKey(endpoint);
                    await env.CHAT_KV.delete(subKey);
                }
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/push/test' && request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            const { password, title, body: pushBody } = body;
            if (password !== adminPassword) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            }
            ctx.waitUntil(sendPushNotification(env, {
                title: title || "ALERTE TEST 🚀",
                body: pushBody || "Les notifications Push sont maintenant opérationnelles !",
                url: "https://dropsiders.fr",
                icon: "/android-chrome-192x192.png",
                badge: "/android-chrome-192x192.png"
            }));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/push/subscribers/count' && request.method === 'GET') {
            if (env.CHAT_KV) {
                const list = await env.CHAT_KV.list({ prefix: 'push_sub_' });
                return new Response(JSON.stringify({ count: list.keys.length }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ count: 0 }), { status: 200, headers });
        }


        let authenticated = false;
        let userPermissions = [];

        if (isAuthRoute) {
            const requestSessionId = request.headers.get('X-Session-ID');

            // MASTER AUTH BYPASS for Invoice & Critical Routes if password matches
            const isMasterPass = requestPassword === adminPassword;

            if (isMasterPass) {
                // Master password bypasses all session checks
                authenticated = true;
                userPermissions = ['all'];
            }
            else if (requestUsername) {
                const editorsFile = await fetchGitHubFile(EDITORS_PATH, gitConfig);
                if (editorsFile && editorsFile.content) {
                    const editor = editorsFile.content.find(e => {
                        const epass = decodePass((e.password || '').trim());
                        return e.username === requestUsername && epass === requestPassword;
                    });

                    if (editor) {
                        // For invoice route, we bypass the session check if password is correct
                        if (path === '/api/facture/send' || path.startsWith('/api/invoices') || requestSessionId === (editor.session_id || 'editor-initial-id')) {
                            authenticated = true;
                            userPermissions = editor.permissions || [];
                        }
                    }
                }
            }

            if (!authenticated) {
                const details = `User: ${requestUsername || 'anon'}. Pass: ${!!requestPassword}. Match: ${requestPassword === adminPassword}`;
                return new Response(JSON.stringify({
                    error: 'Accès non autorisé',
                    details: details
                }), { status: 401, headers });
            }

            // --- PERMISSIONS MAPPING & CHECKS ---
            const hasAll = userPermissions.includes('all');

            // 1. News
            if (path.startsWith('/api/news') && !hasAll && !userPermissions.includes('news')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : news' }), { status: 403, headers });
            }

            // 2. Agenda
            if (path.startsWith('/api/agenda') && !hasAll && !userPermissions.includes('agenda')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : agenda' }), { status: 403, headers });
            }

            // 3. Recaps
            if (path.startsWith('/api/recaps') && !hasAll && !userPermissions.includes('recaps')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : recaps' }), { status: 403, headers });
            }

            // 4. Communauté & Galerie
            const isCommunityRoute = path.startsWith('/api/galerie') || 
                                   path.startsWith('/api/photos') || 
                                   path.startsWith('/api/instagram-contest') || 
                                   path.includes('/quiz/contest');
                                   
            if (isCommunityRoute && !hasAll && !userPermissions.includes('community')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : community' }), { status: 403, headers });
            }

            // 5. Shop
            if (path.includes('/api/shop') && !hasAll && !userPermissions.includes('shop')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : shop' }), { status: 403, headers });
            }

            // 6. Broadcast (Newsletter & Messages)
            const isBroadcastRoute = path.startsWith('/api/newsletter') || path === '/api/subscribers' || path.startsWith('/api/contacts');
            if (isBroadcastRoute && !hasAll && !userPermissions.includes('broadcast')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : broadcast' }), { status: 403, headers });
            }

            // 7. Spotify
            if (path === '/api/spotify/update' && !hasAll && !userPermissions.includes('musique')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : musique' }), { status: 403, headers });
            }

            // 8. Accueil (Layout)
            if (path === '/api/home-layout/update' && !hasAll && !userPermissions.includes('accueil')) {
                return new Response(JSON.stringify({ error: 'Permission refusée : accueil' }), { status: 403, headers });
            }

            // 9. Factures: allow alex OR any authenticated user with 'all' or 'news' permission
            if (path === '/api/facture/send') {
                const isAuthorized = requestUsername === 'alex' || requestUsername === 'contact@dropsiders.fr' || hasAll || userPermissions.includes('news');
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
                    const editor = editorsFile.content.find(e => e.username === username && decodePass(e.password) === password);
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

        // --- API: PDF MANAGEMENT ---
        if (path === '/api/pdfs' && request.method === 'GET') {
            const FILE_PATH = 'src/data/pdfs.json';
            const file = await fetchGitHubFile(FILE_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/pdfs/create' && request.method === 'POST') {
            const body = await request.json();
            const { title, url, size, category } = body;
            const FILE_PATH = 'src/data/pdfs.json';
            const file = await fetchGitHubFile(FILE_PATH, gitConfig) || { content: [], sha: null };
            
            const newPdf = {
                id: Date.now().toString(),
                title: title || 'Nouveau PDF',
                url,
                size: size || 'Inconnu',
                category: category || 'Général',
                date: new Date().toISOString()
            };

            const updated = [newPdf, ...file.content];
            const saved = await saveGitHubFile(FILE_PATH, updated, `Add PDF: ${title}`, file.sha, gitConfig);
            return new Response(JSON.stringify({ success: saved.ok, pdf: newPdf, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
        }

        if (path === '/api/pdfs/delete' && request.method === 'POST') {
            const { id } = await request.json();
            const FILE_PATH = 'src/data/pdfs.json';
            const file = await fetchGitHubFile(FILE_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
            
            const updated = file.content.filter(p => String(p.id) !== String(id));
            const saved = await saveGitHubFile(FILE_PATH, updated, `Delete PDF: ${id}`, file.sha, gitConfig);
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

        // --- API: VOYAGE (DUFFEL PROXY) ---
        if (path === '/api/voyage/airports' && request.method === 'GET') {
            const query = (url.searchParams.get('q') || '').toUpperCase();
            if (!query || query.length < 2) return new Response(JSON.stringify([]), { headers });
            
            const DUFFEL_KEY = env.DUFFEL_API_KEY;
            const MAJOR_AIRPORTS = [
                { id: '1', iata_code: 'PAR', name: 'Paris (Tous)', city_name: 'Paris', country_name: 'France' },
                { id: '2', iata_code: 'CDG', name: 'Paris Charles de Gaulle', city_name: 'Paris', country_name: 'France' },
                { id: '3', iata_code: 'ORY', name: 'Paris Orly', city_name: 'Paris', country_name: 'France' },
                { id: '4', iata_code: 'MRS', name: 'Marseille Provence', city_name: 'Marseille', country_name: 'France' },
                { id: '5', iata_code: 'LYS', name: 'Lyon Saint-Exupéry', city_name: 'Lyon', country_name: 'France' },
                { id: '6', iata_code: 'NCE', name: 'Nice Côte d’Azur', city_name: 'Nice', country_name: 'France' },
                { id: '7', iata_code: 'TLS', name: 'Toulouse Blagnac', city_name: 'Toulouse', country_name: 'France' },
                { id: '8', iata_code: 'NTE', name: 'Nantes Atlantique', city_name: 'Nantes', country_name: 'France' },
                { id: '9', iata_code: 'BOD', name: 'Bordeaux Mérignac', city_name: 'Bordeaux', country_name: 'France' },
                { id: '10', iata_code: 'IBZ', iata_airport_code: 'IBZ', name: 'Ibiza Airport (Eivissa)', city_name: 'Ibiza', country_name: 'Espagne' },
                { id: '11', iata_code: 'LAS', iata_airport_code: 'LAS', name: 'Harry Reid Intl (Las Vegas)', city_name: 'Las Vegas', country_name: 'USA' },
                { id: '12', iata_code: 'JFK', iata_airport_code: 'JFK', name: 'New York John F. Kennedy', city_name: 'New York', country_name: 'USA' },
                { id: '13', iata_code: 'EWR', iata_airport_code: 'EWR', name: 'New York Newark', city_name: 'New York', country_name: 'USA' },
                { id: '14', iata_code: 'NYC', name: 'New York (Tous)', city_name: 'New York', country_name: 'USA' },
                { id: '15', iata_code: 'MIA', name: 'Miami International', city_name: 'Miami', country_name: 'USA' },
                { id: '16', iata_code: 'LAX', name: 'Los Angeles International', city_name: 'Los Angeles', country_name: 'USA' },
                { id: '17', iata_code: 'MAD', name: 'Madrid Barajas', city_name: 'Madrid', country_name: 'Espagne' },
                { id: '18', iata_code: 'BCN', name: 'Barcelona El Prat', city_name: 'Barcelone', country_name: 'Espagne' },
                { id: '19', iata_code: 'LHR', name: 'London Heathrow', city_name: 'Londres', country_name: 'Royaume-Uni' },
                { id: '20', iata_code: 'LGW', name: 'London Gatwick', city_name: 'Londres', country_name: 'Royaume-Uni' },
                { id: '21', iata_code: 'AMS', name: 'Amsterdam Schiphol', city_name: 'Amsterdam', country_name: 'Pays-Bas' },
                { id: '22', iata_code: 'BER', name: 'Berlin Brandenburg', city_name: 'Berlin', country_name: 'Allemagne' },
                { id: '23', iata_code: 'DXB', name: 'Dubai International', city_name: 'Dubaï', country_name: 'Émirats arabes unis' },
                { id: '24', iata_code: 'BKK', name: 'Bangkok Suvarnabhumi', city_name: 'Bangkok', country_name: 'Thaïlande' },
                { id: '25', iata_code: 'HND', name: 'Tokyo Haneda', city_name: 'Tokyo', country_name: 'Japon' },
                { id: '26', iata_code: 'DUB', name: 'Dublin Airport', city_name: 'Dublin', country_name: 'Irlande' },
                { id: '27', iata_code: 'LIS', name: 'Lisbon Airport', city_name: 'Lisbonne', country_name: 'Portugal' },
                { id: '28', iata_code: 'PRG', name: 'Prague Vaclav Havel', city_name: 'Prague', country_name: 'Rép. Tchèque' },
                { id: '30', iata_code: 'ZRH', name: 'Zurich Airport', city_name: 'Zurich', country_name: 'Suisse' },
                { id: '31', iata_code: 'BRU', name: 'Brussels Airport', city_name: 'Bruxelles', country_name: 'Belgique' },
                { id: '32', iata_code: 'FRA', name: 'Frankfurt Airport', city_name: 'Francfort', country_name: 'Allemagne' },
                { id: '33', iata_code: 'MUC', name: 'Munich Airport', city_name: 'Munich', country_name: 'Allemagne' },
                { id: '34', iata_code: 'FCO', name: 'Rome Fiumicino', city_name: 'Rome', country_name: 'Italie' },
                { id: '35', iata_code: 'MXP', name: 'Milan Malpensa', city_name: 'Milan', country_name: 'Italie' },
                { id: '36', iata_code: 'GVA', name: 'Geneva Airport', city_name: 'Genève', country_name: 'Suisse' },
                { id: '37', iata_code: 'PMI', name: 'Palma de Mallorca', city_name: 'Palma', country_name: 'Espagne' },
                { id: '38', iata_code: 'AGP', name: 'Malaga Airport', city_name: 'Malaga', country_name: 'Espagne' },
                { id: '39', iata_code: 'CPH', name: 'Copenhagen Airport', city_name: 'Copenhague', country_name: 'Danemark' },
                { id: '40', iata_code: 'ARN', name: 'Stockholm Arlanda', city_name: 'Stockholm', country_name: 'Suède' },
                { id: '41', iata_code: 'OSL', name: 'Oslo Gardermoen', city_name: 'Oslo', country_name: 'Norvège' },
                { id: '42', iata_code: 'BUD', name: 'Budapest Liszt Ferenc', city_name: 'Budapest', country_name: 'Hongrie' },
                { id: '43', iata_code: 'WAW', name: 'Warsaw Chopin', city_name: 'Varsovie', country_name: 'Pologne' },
                { id: '44', iata_code: 'VIE', name: 'Vienna International', city_name: 'Vienne', country_name: 'Autriche' },
                { id: '45', iata_code: 'ATH', name: 'Athens International', city_name: 'Athènes', country_name: 'Grèce' },
                { id: '46', iata_code: 'MLA', name: 'Malta International', city_name: 'Malte', country_name: 'Malte' },
                { id: '47', iata_code: 'RUN', name: 'Réunion Roland Garros', city_name: 'Saint-Denis', country_name: 'France' },
                { id: '48', iata_code: 'PTP', name: 'Pointe-à-Pitre Le Raizet', city_name: 'Les Abymes', country_name: 'France' },
                { id: '49', iata_code: 'FDF', name: 'Fort-de-France Martinique', city_name: 'Le Lamentin', country_name: 'France' }
            ];

            try {
                // LOCAL SEARCH IN 4000+ AIRPORTS
                const queryUpper = query.toUpperCase();
                
                let matches = airports_db.filter((a: any) => 
                    a.iata.includes(queryUpper) || 
                    a.name.toUpperCase().includes(queryUpper) || 
                    (a.city && a.city.toUpperCase().includes(queryUpper))
                );

                // Add MAJOR_AIRPORTS weighting and sorting
                matches.sort((a: any, b: any) => {
                    // 1. Exact IATA match
                    if (a.iata === queryUpper) return -1;
                    if (b.iata === queryUpper) return 1;

                    // 2. Is in MAJOR_AIRPORTS list? (High importance)
                    const aIsMajor = MAJOR_AIRPORTS.some(m => m.iata_code === a.iata);
                    const bIsMajor = MAJOR_AIRPORTS.some(m => m.iata_code === b.iata);
                    if (aIsMajor && !bIsMajor) return -1;
                    if (!aIsMajor && bIsMajor) return 1;

                    // 3. Name or City starts with query
                    const aName = (a.name || '').toUpperCase();
                    const bName = (b.name || '').toUpperCase();
                    const aCity = (a.city || '').toUpperCase();
                    const bCity = (b.city || '').toUpperCase();
                    
                    const aStarts = aName.startsWith(queryUpper) || aCity.startsWith(queryUpper);
                    const bStarts = bName.startsWith(queryUpper) || bCity.startsWith(queryUpper);
                    
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;

                    return aName.localeCompare(bName);
                });

                // Limit result for performance
                const results = matches.slice(0, 15);
                
                if (results.length > 5) {
                    return new Response(JSON.stringify(results), { headers });
                }

                // If not many local results, try Duffel as a final backup (for very new airports?)
                if (DUFFEL_KEY) {
                    const dRes = await fetch(`https://api.duffel.com/air/airports?iata_code=${encodeURIComponent(queryUpper)}`, {
                        headers: { 'Authorization': `Bearer ${DUFFEL_KEY}`, 'Duffel-Version': 'v2', 'Accept': 'application/json' },
                    });
                    const dData = await dRes.json();
                    if (dData.data && dData.data.length > 0) {
                        return new Response(JSON.stringify([...results, ...dData.data]), { headers });
                    }
                }

                return new Response(JSON.stringify(results), { headers });

            } catch (e) {
                // Absolute fallback to minimal hardcoded list
                const filtered = MAJOR_AIRPORTS.filter(a => a.iata_code.includes(query) || a.name.toUpperCase().includes(query));
                return new Response(JSON.stringify(filtered), { headers });
            }
        }

        if (path === '/api/voyage/search' && request.method === 'POST') {
            const DUFFEL_KEY = env.DUFFEL_API_KEY || env.VITE_DUFFEL_API_KEY;
            if (!DUFFEL_KEY) return new Response(JSON.stringify({ error: 'Duffel API key missing in environment' }), { status: 500, headers });
            
            try {
                const body = await request.json();
                
                // Add default passengers if missing
                if (!body.data.passengers) {
                    body.data.passengers = [{ type: "adult" }];
                }

                const res = await fetch('https://api.duffel.com/air/offer_requests', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DUFFEL_KEY}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                
                const data = await res.json();
                
                if (!res.ok) {
                    console.error('Duffel API Error:', data);
                    return new Response(JSON.stringify({ 
                        error: data.errors?.[0]?.message || 'Duffel API Error',
                        details: data 
                    }), { status: res.status, headers });
                }

                return new Response(JSON.stringify(data), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: 'Proxy error', details: e.message }), { status: 500, headers });
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
            if (!file) return new Response(JSON.stringify({ shop_enabled: false, takeover: { enabled: false } }), { status: 200, headers });
            
            // Logique Auto-Live
            if (file.content && file.content.takeover) {
                const tk = file.content.takeover;
                // On n'active le live auto QUE si on n'est pas en "off" manuel
                if (tk.startDate && tk.endDate && tk.status !== 'off') {
                    const now = new Date();
                    const start = new Date(tk.startDate);
                    const end = new Date(tk.endDate);
                    if (now >= start && now <= end) {
                        tk.status = 'live';
                        tk.isOnline = true;
                    } else if (tk.status === 'live') {
                        // Si le live était forcé mais qu'on est hors plage, on le repasse en 'edit'
                        tk.status = 'edit';
                        tk.isOnline = false;
                    }
                }
            }
            
            return new Response(JSON.stringify(file.content), { status: 200, headers });
        }

        if ((path === '/api/settings/takeover' || path === '/api/takeover-settings') && request.method === 'GET') {
            const SETTINGS_PATH = 'src/data/settings.json';
            const file = await fetchGitHubFile(SETTINGS_PATH, gitConfig);
            if (!file || !file.content.takeover) return new Response(JSON.stringify({ enabled: false, status: 'off' }), { status: 200, headers });
            
            const takeover = file.content.takeover;
            
            // Logique Auto-Live
            if (takeover.startDate && takeover.endDate && takeover.status !== 'off') {
                const now = new Date();
                const start = new Date(takeover.startDate);
                const end = new Date(takeover.endDate);
                if (now >= start && now <= end) {
                    takeover.status = 'live';
                    takeover.isOnline = true;
                } else if (takeover.status === 'edit') {
                    takeover.status = 'edit';
                    takeover.isOnline = false;
                }
            }
            
            if (!takeover.auddToken) takeover.auddToken = '0707d622c51645acc2e4fa26ed64538d';
            return new Response(JSON.stringify(takeover), { status: 200, headers });
        }

        if (path === '/api/takeover-settings' && request.method === 'POST') {
            const takeoverData = await request.json();
            const file = await fetchGitHubFile(SETTINGS_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'Could not fetch current settings for update' }), { status: 500, headers });
            
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
            const file = await fetchGitHubFile(SETTINGS_PATH, gitConfig);
            if (!file) return new Response(JSON.stringify({ error: 'Could not fetch current settings' }), { status: 500, headers });
            
            // Si le takeover est présent dans les nouvelles settings, s'assurer de ne pas écraser les champs critiques
            const merged = { 
                ...file.content, 
                ...newSettings, 
                master_session_id: file.content.master_session_id || 'initial-session-id' 
            };
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

        // --- API: TRACKLISTS ---
        if (path === '/api/tracklists' && request.method === 'GET') {
            const file = await fetchGitHubFile(TRACKLISTS_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/tracklists/pending' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const file = await fetchGitHubFile(TRACKLISTS_PENDING_PATH, gitConfig);
            return new Response(JSON.stringify(file ? file.content : []), { status: 200, headers });
        }

        if (path === '/api/tracklists/submit' && request.method === 'POST') {
            try {
                const newTracklist = await request.json();
                const file = await fetchGitHubFile(TRACKLISTS_PENDING_PATH, gitConfig) || { content: [], sha: null };
                
                const submission = {
                    ...newTracklist,
                    id: Date.now().toString(),
                    status: 'pending',
                    createdAt: new Date().toISOString()
                };
                
                const updated = [submission, ...file.content];
                const saved = await saveGitHubFile(TRACKLISTS_PENDING_PATH, updated, `New tracklist submission: ${newTracklist.title}`, file.sha, gitConfig);
                return new Response(JSON.stringify({ success: saved.ok, error: saved.error }), { status: saved.ok ? 200 : 500, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/tracklists/moderate' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { id, action, updates } = await request.json();
                const pendingFile = await fetchGitHubFile(TRACKLISTS_PENDING_PATH, gitConfig);
                if (!pendingFile) return new Response(JSON.stringify({ error: 'Pending file not found' }), { status: 404, headers });
                
                const tracklist = pendingFile.content.find(t => t.id === id);
                if (!tracklist) return new Response(JSON.stringify({ error: 'Tracklist not found' }), { status: 404, headers });
                
                let savedPending, savedValidated;
                
                if (action === 'approve') {
                    const validatedFile = await fetchGitHubFile(TRACKLISTS_PATH, gitConfig) || { content: [], sha: null };
                    const approvedTracklist = { ...tracklist, ...(updates || {}), status: 'validated', validatedAt: new Date().toISOString() };
                    
                    const updatedValidated = [approvedTracklist, ...validatedFile.content];
                    const updatedPending = pendingFile.content.filter(t => t.id !== id);
                    
                    savedValidated = await saveGitHubFile(TRACKLISTS_PATH, updatedValidated, `Approve tracklist: ${approvedTracklist.title}`, validatedFile.sha, gitConfig);
                    savedPending = await saveGitHubFile(TRACKLISTS_PENDING_PATH, updatedPending, `Remove from pending: ${id}`, pendingFile.sha, gitConfig);
                } else if (action === 'delete') {
                    const updatedPending = pendingFile.content.filter(t => t.id !== id);
                    savedPending = await saveGitHubFile(TRACKLISTS_PENDING_PATH, updatedPending, `Delete pending tracklist: ${id}`, pendingFile.sha, gitConfig);
                    savedValidated = { ok: true };
                } else if (action === 'update_validated') {
                    const validatedFile = await fetchGitHubFile(TRACKLISTS_PATH, gitConfig);
                    if (!validatedFile) return new Response(JSON.stringify({ error: 'Validated file not found' }), { status: 404, headers });
                    const updatedValidated = validatedFile.content.map(t => t.id === id ? { ...t, ...updates } : t);
                    savedValidated = await saveGitHubFile(TRACKLISTS_PATH, updatedValidated, `Update validated tracklist: ${id}`, validatedFile.sha, gitConfig);
                    savedPending = { ok: true };
                } else if (action === 'delete_validated') {
                    const validatedFile = await fetchGitHubFile(TRACKLISTS_PATH, gitConfig);
                    if (!validatedFile) return new Response(JSON.stringify({ error: 'Validated file not found' }), { status: 404, headers });
                    const updatedValidated = validatedFile.content.filter(t => t.id !== id);
                    savedValidated = await saveGitHubFile(TRACKLISTS_PATH, updatedValidated, `Delete validated tracklist: ${id}`, validatedFile.sha, gitConfig);
                    savedPending = { ok: true };
                }
                
                return new Response(JSON.stringify({ success: savedPending.ok && savedValidated.ok, error: savedPending.error || savedValidated.error }), { status: (savedPending.ok && savedValidated.ok) ? 200 : 500, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
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
                const { email, emails } = await request.json();
                const emailsToDelete = (Array.isArray(emails) ? emails : (email ? [email] : [])).map(String);
                
                if (emailsToDelete.length === 0) {
                    return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400, headers });
                }

                const file = await fetchGitHubFile(PATH, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                const initialCount = file.content.length;
                const updatedData = file.content.filter(sub => !emailsToDelete.includes(String(sub.email)));
                
                if (updatedData.length === initialCount) {
                    return new Response(JSON.stringify({ error: 'Email(s) not found' }), { status: 404, headers });
                }

                const commitMsg = emailsToDelete.length > 1 
                    ? `Désinscription groupée : ${emailsToDelete.length} abonnés` 
                    : `Désinscription : ${emailsToDelete[0]}`;

                const saved = await saveGitHubFile(PATH, updatedData, commitMsg, file.sha, gitConfig);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true, count: emailsToDelete.length }), { status: 200, headers });
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
                    link: `https://dropsiders.fr/news/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
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
                    ctx.waitUntil(sendPushNotification(env, {
                        title: `NOUVEAUTÉ : ${title}`,
                        body: cleanStr(generateSummary(content, summary)),
                        url: newArticle.link,
                        icon: newArticle.image || '/android-chrome-192x192.png'
                    }));
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
                    link: `https://dropsiders.fr/recaps/${newId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
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

                if (body.sendPush) {
                    ctx.waitUntil(sendPushNotification(env, {
                        title: `NOUVEAU RÉCAP : ${title}`,
                        body: cleanStr(generateSummary(content, summary)),
                        url: newItem.link,
                        icon: newItem.image || '/android-chrome-192x192.png'
                    }));
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

                if (sendPush) {
                    ctx.waitUntil(sendPushNotification(env, {
                        title: `NEW : ${title || existing.title}`,
                        body: cleanStr(generateSummary(content, summary)) || existing.summary,
                        url: currentData[index].link,
                        icon: currentData[index].image || '/android-chrome-192x192.png'
                    }));
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
                const { id, title, date, startDate, endDate, venue, location, country, type, image, description, url: eventUrl, genre, month, isWeekly, isSoldOut, isLiveDropsiders, dayOfWeek, additionalDates } = body;
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

                    const currentDate = new Date(start);
                    let maxId = currentData.reduce((max, item) => (item.id > max ? item.id : max), 0);

                    const newEvents = [];
                    while (currentDate <= end) {
                        maxId++;
                        newEvents.push({
                            id: maxId,
                            title: title || existing.title,
                            date: currentDate.toISOString().split('T')[0],
                            startDate: currentDate.toISOString().split('T')[0],
                            endDate: currentDate.toISOString().split('T')[0],
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
                        isLiveDropsiders: isLiveDropsiders !== undefined ? isLiveDropsiders : existing.isLiveDropsiders,
                        additionalDates: additionalDates || existing.additionalDates || []
                    };
                }

                // --- AUTO CLEANUP OF PAST EVENTS ---
                const todayStr = new Date().toISOString().split('T')[0];
                currentData = currentData.filter(item => {
                    const end = item.endDate || item.startDate || item.date;
                    if (end && end < todayStr) return false;
                    return true;
                });

                const saved = await saveGitHubFile(FILE_PATH, currentData, `Update agenda: ${title || existing.title}`, agendaFile.sha, gitConfig);
                if (saved.ok) {
                    if (body.sendPush) {
                        ctx.waitUntil(sendPushNotification(env, {
                            title: `ÉVÉNEMENT MODIFIÉ : ${title || existing.title}`,
                            body: `${venue || location}${country ? ` (${country})` : ''}`,
                            url: `https://dropsiders.fr/agenda`,
                            icon: image || existing.image || '/android-chrome-192x192.png'
                        }));
                    }
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
                const { title, date, startDate, endDate, venue, location, country, type, image, description, url: eventUrl, genre, month, isWeekly, isSoldOut, isLiveDropsiders, dayOfWeek, additionalDates } = body;
                if (!title) return new Response(JSON.stringify({ error: 'Missing title' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH, gitConfig) || { content: [], sha: null };
                let currentData = agendaFile.content;
                let maxId = currentData.reduce((max, item) => (item.id > max ? item.id : max), 0);

                if (isWeekly && startDate && endDate && startDate !== endDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);

                    const currentDate = new Date(start);
                    const newEvents = [];
                    while (currentDate <= end) {
                        maxId++;
                        newEvents.push({
                            id: maxId,
                            title,
                            date: currentDate.toISOString().split('T')[0],
                            startDate: currentDate.toISOString().split('T')[0],
                            endDate: currentDate.toISOString().split('T')[0],
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
                        isLiveDropsiders: isLiveDropsiders || false,
                        additionalDates: additionalDates || []
                    };
                    currentData = [...currentData, newItem];
                }

                // --- AUTO CLEANUP OF PAST EVENTS ---
                const todayStr2 = new Date().toISOString().split('T')[0];
                currentData = currentData.filter(item => {
                    const end = item.endDate || item.startDate || item.date;
                    if (end && end < todayStr2) return false;
                    return true;
                });

                const saved = await saveGitHubFile(FILE_PATH, currentData, `Add agenda: ${title}`, agendaFile.sha, gitConfig);
                if (saved.ok) {
                    if (body.sendPush) {
                        ctx.waitUntil(sendPushNotification(env, {
                            title: `NOUVEL ÉVÉNEMENT : ${title}`,
                            body: `${venue || location}${country ? ` (${country})` : ''} - ${new Date(date || startDate).toLocaleDateString('fr-FR')}`,
                            url: `https://dropsiders.fr/agenda`,
                            icon: image || '/android-chrome-192x192.png'
                        }));
                    }
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: UPDATE RESIDENCE PHOTOS ---
        if (path === '/api/agenda/update-residence-photos' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/agenda.json';
            try {
                const body = await request.json();
                const { title, location, image } = body;
                if (!title || !location || !image) return new Response(JSON.stringify({ error: 'Missing title/location/image' }), { status: 400, headers });

                const agendaFile = await fetchGitHubFile(FILE_PATH, gitConfig);
                if (!agendaFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                const currentData = agendaFile.content;
                let updatedCount = 0;
                const newData = currentData.map(item => {
                    const isCorrectResidence = (item.title === title && item.location === location);
                    const isResidenceType = item.type === 'Residence' || item.type === 'Résidence';
                    
                    if (isCorrectResidence && (item.isWeekly || isResidenceType)) {
                        updatedCount++;
                        return { ...item, image };
                    }
                    return item;
                });

                if (updatedCount === 0) return new Response(JSON.stringify({ error: 'No residence found' }), { status: 404, headers });

                const saved = await saveGitHubFile(FILE_PATH, newData, `Update residence photos: ${title} @ ${location} (${updatedCount} items)`, agendaFile.sha, gitConfig);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true, count: updatedCount }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: BULK UPDATE YEAR ---
        if (path === '/api/admin/bulk-update-year' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            try {
                const body = await request.json();
                const { type, oldYear, newYear } = body;
                if (!type || !oldYear || !newYear) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers });

                const FILE_PATH = type === 'agenda' ? 'src/data/agenda.json' : 'src/data/news.json';
                const file = await fetchGitHubFile(FILE_PATH, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });

                const currentData = file.content;
                let updatedCount = 0;
                const newData = currentData.map(item => {
                    let hasChanged = false;
                    const res = { ...item };

                    if (type === 'agenda') {
                        ['date', 'startDate', 'endDate'].forEach(field => {
                            if (res[field] && res[field].startsWith(`${oldYear}-`)) {
                                res[field] = res[field].replace(`${oldYear}-`, `${newYear}-`);
                                hasChanged = true;
                            }
                        });
                        // Update title if it contains the year
                        if (res.title && res.title.includes(String(oldYear))) {
                            res.title = res.title.replace(new RegExp(String(oldYear), 'g'), String(newYear));
                            hasChanged = true;
                        }
                        // Update year field
                        if (res.startDate && res.startDate.startsWith(`${newYear}-`)) {
                             res.year = String(newYear);
                             const d = new Date(res.startDate);
                             const months = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
                             res.month = months[d.getMonth()];
                             hasChanged = true;
                        }
                    } else if (type === 'news') {
                        if (String(res.year) === String(oldYear)) {
                            res.year = String(newYear);
                            hasChanged = true;
                        }
                        if (res.date && res.date.startsWith(`${oldYear}-`)) {
                            res.date = res.date.replace(`${oldYear}-`, `${newYear}-`);
                            hasChanged = true;
                        }
                        if (res.title && res.title.includes(String(oldYear))) {
                            res.title = res.title.replace(new RegExp(String(oldYear), 'g'), String(newYear));
                            hasChanged = true;
                        }
                    }

                    if (hasChanged) updatedCount++;
                    return res;
                });

                if (updatedCount === 0) return new Response(JSON.stringify({ error: `Aucun élément trouvé pour l'année ${oldYear}` }), { status: 404, headers });

                const saved = await saveGitHubFile(FILE_PATH, newData, `Bulk update year ${oldYear} -> ${newYear} (${updatedCount} items)`, file.sha, gitConfig);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true, count: updatedCount }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
                }
            } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }

        // --- API: CLEANUP PAST AGENDA ---
        if (path === '/api/admin/cleanup-past-agenda' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILE_PATH = 'src/data/agenda.json';
            try {
                const agendaFile = await fetchGitHubFile(FILE_PATH, gitConfig);
                if (!agendaFile) return new Response(JSON.stringify({ error: 'Error fetching' }), { status: 502, headers });
                
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const originalData = agendaFile.content;
                
                const newData = originalData.filter((item: any) => {
                    // Consider an event passed if its endDate or startDate is before today
                    const eventDate = item.endDate || item.date || item.startDate;
                    return eventDate >= todayStr;
                });
                
                const removedCount = originalData.length - newData.length;
                if (removedCount === 0) return new Response(JSON.stringify({ success: true, count: 0, message: "Aucun événement passé trouvé." }), { status: 200, headers });
                
                const saved = await saveGitHubFile(FILE_PATH, newData, `Cleanup ${removedCount} past events from agenda`, agendaFile.sha, gitConfig);
                if (saved.ok) {
                    return new Response(JSON.stringify({ success: true, count: removedCount }), { status: 200, headers });
                } else {
                    return new Response(JSON.stringify({ error: 'Error saving: ' + saved.error }), { status: 500, headers });
                }
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
        }
        
        // --- API: CLEAN ENCODING ---
        if (path === '/api/admin/clean-encoding' && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });
            const FILES_TO_FIX = [
                'src/data/news.json',
                'src/data/agenda.json',
                'src/data/festivals.json',
                'src/data/wiki_festivals.json',
                'src/data/wiki_artists.json',
                'src/data/wiki_clubs.json',
                'src/data/wiki_labels.json',
                'src/data/settings.json'
            ];
            
            let fixedCount = 0;
            try {
                for (const filePath of FILES_TO_FIX) {
                    const file = await fetchGitHubFile(filePath, gitConfig);
                    if (file && file.content) {
                        fixedCount++;
                        await saveGitHubFile(filePath, file.content, `Fix encoding in ${filePath}`, file.sha, gitConfig);
                    }
                }
                return new Response(JSON.stringify({ success: true, fixedFiles: fixedCount }), { status: 200, headers });
            } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
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
                const { name, email, subject, message, attachments } = body;
                if (!name || !email || !subject || !message) {
                    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
                }

                // --- HANDLE ATTACHMENTS ---
                const processedAttachments: any[] = [];
                const brevoAttachments: any[] = [];
                
                if (Array.isArray(attachments) && env.R2) {
                    for (const file of attachments.slice(0, 5)) { // Max 5 files
                        try {
                            const b64 = file.content;
                            const binaryStr = atob(b64);
                            const bytes = new Uint8Array(binaryStr.length);
                            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
                            
                            const key = `contacts/${Date.now()}_${file.name}`;
                            await env.R2.put(key, bytes, { httpMetadata: { contentType: file.type } });
                            
                            const r2Url = `https://dropsiders.fr/uploads/${key}`; // Assumes a public worker/endpoint for R2
                            processedAttachments.push({ name: file.name, url: r2Url, size: bytes.length });
                            brevoAttachments.push({ content: b64, name: file.name });
                        } catch (e) { console.error('R2 upload skipped for file:', file.name, e); }
                    }
                } else if (Array.isArray(attachments)) {
                    // Fallback if R2 not available, just names for record
                    attachments.slice(0, 5).forEach((f: any) => {
                        processedAttachments.push({ name: f.name, size: 0 });
                        brevoAttachments.push({ content: f.content, name: f.name });
                    });
                }

                const CONTACTS_PATH = 'src/data/contacts.json';
                const file = await fetchGitHubFile(CONTACTS_PATH, gitConfig) || { content: [], sha: null };
                const contacts = Array.isArray(file.content) ? file.content : [];
                const newMsg = {
                    id: Date.now().toString(),
                    name, email, subject, message,
                    attachments: processedAttachments,
                    date: new Date().toISOString(),
                    read: false,
                    replied: false
                };
                contacts.push(newMsg);
                await saveGitHubFile(CONTACTS_PATH, contacts, `New contact: ${name} (with ${processedAttachments.length} attachments) [skip ci] [CF-Pages-Skip]`, file.sha, gitConfig);

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
                                                
                                                ${processedAttachments.length > 0 ? `
                                                    <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
                                                        <p style="margin-top: 0; font-weight: bold; font-size: 12px; color: #666;">PIÈCES JOINTES :</p>
                                                        <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                                                            ${processedAttachments.map((a: any) => `<li><a href="${a.url || '#'}">${a.name}</a> (${(a.size/1024).toFixed(0)} KB)</li>`).join('')}
                                                        </ul>
                                                    </div>
                                                ` : ''}

                                                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                                                <a href="https://dropsiders.fr/admin" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; font-size: 14px;">Répondre via l'Admin</a>
                                            </div>
                                        </div>
                                    `,
                                    ...(brevoAttachments.length > 0 ? { attachment: brevoAttachments } : {})
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
                await saveGitHubFile(CONTACTS_PATH, updated, `Mark read: ${id}`, file.sha, gitConfig);
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
                await saveGitHubFile(CONTACTS_PATH, updated, `Delete contact: ${id}`, file.sha, gitConfig);
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
                const { to, from, name, subject, message, lang, attachments } = body;
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

                let brevoAttachments: any[] = [];
                if (Array.isArray(attachments)) {
                    attachments.slice(0, 5).forEach((f: any) => {
                        if (f.content && f.name) {
                            brevoAttachments.push({ content: f.content, name: f.name });
                        }
                    });
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
                                                ${lang === 'EN' ? 'Best regards,' : 'Cordialement,'}<br>
                                                ${lang === 'EN' ? 'The <span style="color:#ff0033;">Dropsiders</span> Team' : "L'équipe <span style=\"color:#ff0033;\">Dropsiders</span>"}
                                            </div>
                                            
                                            <!-- CATEGORIES BAR -->
                                            <div style="color:#ff0033; font-size:7.5px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:20px; border-bottom:1px solid #222; padding-bottom:12px; line-height:1.4; white-space: nowrap;">
                                                ${lang === 'EN' ? 'NEWS&nbsp;·&nbsp;RECAPS&nbsp;·&nbsp;INTERVIEWS&nbsp;·&nbsp;CONTESTS' : 'NEWS&nbsp;·&nbsp;RÉCAPS&nbsp;·&nbsp;INTERVIEWS&nbsp;·&nbsp;CONCOURS'}
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
                                        ${lang === 'EN' ? 'DROPSIDERS · COMPREHENSIVE FESTIVAL COVERAGE' : "DROPSIDERS · TOUTE L'ACTU DES FESTIVALS"}
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
                    },
                    ...(brevoAttachments.length > 0 ? { attachment: brevoAttachments } : {})
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

                    await saveGitHubFile(CONTACTS_PATH, updatedContacts, `Reply sent to: ${to}`, file.sha, gitConfig);
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
                const { to, subject, message, pdfBase64, invoiceHtml, filename, invoiceData } = body;

                if (!to) {
                    return new Response(JSON.stringify({ error: 'Destinataire manquant' }), { status: 400, headers });
                }

                let attachments: any[] = [];

                if (pdfBase64) {
                    const base64Content = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
                    attachments = [{ content: base64Content, name: filename || 'facture.pdf' }];
                } else if (invoiceHtml) {
                    const encoder = new TextEncoder();
                    const htmlBytes = encoder.encode(invoiceHtml);
                    let binary = '';
                    htmlBytes.forEach(b => { binary += String.fromCharCode(b); });
                    const base64Html = btoa(binary);
                    attachments = [{ content: base64Html, name: filename || 'facture.html' }];
                }

                const htmlBody = (message || 'Bonjour,\n\nVeuillez trouver en pièce jointe votre facture.\n\nCordialement,\nCUENCA ALEXANDRE').replace(/\n/g, '<br>');

                const payload = {
                    sender: { name: 'CUENCA ALEXANDRE', email: 'alex@dropsiders.fr' },
                    to: [{ email: to }],
                    bcc: [{ email: 'alexlight3034@icloud.com' }],
                    replyTo: { email: 'alex@dropsiders.fr', name: 'CUENCA ALEXANDRE' },
                    subject: subject || 'Votre Facture',
                    htmlContent: `<p style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6">${htmlBody}</p>`,
                    ...(attachments.length > 0 ? { attachment: attachments } : {})
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

                // Upload PDF to R2
                let pdfUrl = '';
                if (pdfBase64 && env.R2) {
                    try {
                        const b64Parts = pdfBase64.split('base64,');
                        const b64Content = b64Parts.length > 1 ? b64Parts[1] : b64Parts[0];
                        const binaryStr = atob(b64Content);
                        const bytes = new Uint8Array(binaryStr.length);
                        for (let i = 0; i < binaryStr.length; i++) {
                            bytes[i] = binaryStr.charCodeAt(i);
                        }
                        const key = `factures/${Date.now()}_${filename || 'facture.pdf'}`;
                        await env.R2.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });
                        pdfUrl = `/uploads/${key}`;
                    } catch (e) { console.error('R2 upload failed', e); }
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
                        paid: false,
                        emailTo: to,
                        pdfUrl: pdfUrl
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

        if (path === '/api/invoices/delete' && request.method === 'POST') {
            try {
                const { id } = await request.json();
                const INVOICE_FILE = 'src/data/invoices.json';
                const file = await fetchGitHubFile(INVOICE_FILE, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                const invoice = file.content.find((inv: any) => inv.id === id);
                if (invoice && invoice.pdfUrl && env.R2) {
                    try {
                        const r2Key = invoice.pdfUrl.split('/uploads/').pop();
                        if (r2Key) await env.R2.delete(r2Key);
                    } catch (e) { console.error('Failed to delete PDF from R2:', e); }
                }

                const updated = file.content.filter((inv: any) => inv.id !== id);
                await saveGitHubFile(INVOICE_FILE, updated, `Delete invoice: ${id}`, file.sha, gitConfig);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- API: DELETE CONTENT ---
        const contentDeletePaths = ['/api/news/delete', '/api/recaps/delete', '/api/agenda/delete', '/api/galerie/delete'];
        if (contentDeletePaths.includes(path) && request.method === 'POST') {
            if (!TOKEN) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500, headers });

            try {
                const { id, ids } = await request.json();
                const idsToDelete = (Array.isArray(ids) ? ids : (id ? [id] : [])).map(String);
                
                if (idsToDelete.length === 0) {
                    return new Response(JSON.stringify({ error: 'Missing ID(s)' }), { status: 400, headers });
                }

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

                const initialCount = file.content.length;
                const updatedData = file.content.filter(item => !idsToDelete.includes(String(item.id)));
                
                if (updatedData.length === initialCount) {
                    return new Response(JSON.stringify({ error: 'No items found in metadata for specified IDs' }), { status: 404, headers });
                }

                const commitMsg = idsToDelete.length > 1 
                    ? `Delete ${idsToDelete.length} items from ${FILE_PATH}`
                    : `Delete content: ${idsToDelete[0]}`;

                await saveGitHubFile(FILE_PATH, updatedData, commitMsg, file.sha, gitConfig);

                // 2. Delete Content (News/Recaps)
                if (CONTENT_FILES.length > 0) {
                    for (const cp of CONTENT_FILES) {
                        const cf = await fetchGitHubFile(cp, gitConfig);
                        if (cf) {
                            const newCfContent = cf.content.filter(item => !idsToDelete.includes(String(item.id)));
                            if (newCfContent.length !== cf.content.length) {
                                await saveGitHubFile(cp, newCfContent, `Cleanup bodies from ${cp} for ${idsToDelete.length} items`, cf.sha, gitConfig);
                            }
                        }
                    }
                }

                return new Response(JSON.stringify({ success: true, count: idsToDelete.length }), { status: 200, headers });
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

        // Note: /api/push/subscribe and /api/push/unsubscribe are handled above (pre-auth)

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
                const count = list.keys.length;

                // Use waitUntil to not block the response
                ctx.waitUntil(sendPushNotification(env, {
                    title: title,
                    body: body,
                    url: url || 'https://dropsiders.fr',
                    icon: '/android-chrome-192x192.png',
                    badge: '/android-chrome-192x192.png'
                }));

                return new Response(JSON.stringify({ success: true, sentTo: count }), { status: 200, headers });
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

                    const savedGal = await saveGitHubFile(GALERIE_PATH, galleries, `Approve photo for ${galleryTitle}`, galFile.sha, gitConfig);
                    if (!savedGal.ok) return new Response(JSON.stringify({ error: 'Failed to update gallery: ' + savedGal.error }), { status: 500, headers });

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

                // Update status instead of removing (requested by user)
                let savedPending = { ok: false, error: '' };
                let attempts = 0;
                while (attempts < 3) {
                    const currentSubFile = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH, gitConfig);
                    if (!currentSubFile) break;
                    
                    const updatedSubs = currentSubFile.content.map(s => {
                        if (s.id === id) {
                            return { ...s, status: action === 'approve' ? 'approved' : 'rejected' };
                        }
                        return s;
                    });
                    
                    savedPending = await saveGitHubFile(PENDING_SUBMISSIONS_PATH, updatedSubs, `${action === 'approve' ? 'Approve' : 'Reject'} photo submission ${id}`, currentSubFile.sha, gitConfig);
                    if (savedPending.ok) break;
                    if (savedPending.status !== 409) break;
                    attempts++;
                    await new Promise(r => setTimeout(r, 500 * attempts));
                }
                
                if (!savedPending.ok) return new Response(JSON.stringify({ error: 'Failed to update pending: ' + (savedPending.error || 'Conflict') }), { status: 500, headers });

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }

        }

        if (path === '/api/photos/update-url' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { id, imageUrl } = await request.json();
                if (!id || !imageUrl) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                let saved = { ok: false, error: '' };
                let attempts = 0;
                while (attempts < 3) {
                    const file = await fetchGitHubFile(PENDING_SUBMISSIONS_PATH, gitConfig);
                    if (!file) break;

                    const submissions = file.content;
                    const index = submissions.findIndex((s: any) => s.id === id);
                    if (index === -1) return new Response(JSON.stringify({ error: 'Submission not found' }), { status: 404, headers });

                    submissions[index].imageUrl = imageUrl;

                    saved = await saveGitHubFile(PENDING_SUBMISSIONS_PATH, submissions, `Update photo for submission ${id}`, file.sha, gitConfig);
                    if (saved.ok) break;
                    if (saved.status !== 409) break;
                    attempts++;
                    await new Promise(r => setTimeout(r, 500 * attempts));
                }

                if (!saved.ok) return new Response(JSON.stringify({ error: 'Failed to update: ' + (saved.error || 'Conflict') }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/r2/stats' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                if (!env.R2) return new Response(JSON.stringify({ used: 0, limit: 10737418240 }), { status: 200, headers });
                
                let totalSize = 0;
                let objectCount = 0;
                let cursor = undefined;
                
                // Cloudflare R2 list() - we iterate to get the full bucket size
                while (true) {
                    const listResult = await env.R2.list({ cursor });
                    listResult.objects.forEach(obj => {
                        totalSize += obj.size;
                        objectCount++;
                    });
                    
                    if (!listResult.truncated) break;
                    cursor = listResult.cursor;
                }
                
                return new Response(JSON.stringify({ 
                    used: totalSize, 
                    limit: 10737418240, // 10 GB (standard free limit)
                    objectCount,
                    remaining: Math.max(0, 10737418240 - totalSize)
                }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
            }
        }

        // --- NEW: BROKEN IMAGES DETECTOR ---
        if ((path === '/api/admin/broken-images' || path === '/api/broken-images') && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                // 1. Get ALL keys currently in R2
                const allKeys = new Set();
                let cursor = undefined;
                do {
                    const listResult = await env.R2.list({ cursor });
                    listResult.objects.forEach(o => allKeys.add(o.key));
                    cursor = listResult.truncated ? listResult.cursor : undefined;
                } while (cursor);

                // 2. All data files to scan
                const dataFiles = [
                    WIKI_DJS_PATH, WIKI_CLUBS_PATH, WIKI_FESTIVALS_PATH,
                    NEWS_PATH, ...NEWS_CONTENT_FILES,
                    AGENDA_PATH, GALERIE_PATH, 
                    RECAPS_PATH, ...RECAPS_CONTENT_FILES,
                    TEAM_PATH, SHOP_PATH, CLIPS_PATH, TRACKLISTS_PATH,
                    SETTINGS_PATH, 'src/data/home_layout.json', 'src/data/spotify.json'
                ];

                const brokenImages = [];
                const dataContents = await Promise.all(
                    dataFiles.map(path => fetchGitHubFile(path, gitConfig).catch(() => null))
                );

                // Updated Regex to support www. and absolute/relative paths
                const urlRegex = /(?:(?:"|')(?:(?:\/|https?:\/\/(?:www\.)?dropsiders\.fr)\/uploads\/)([^"']+\.[a-z0-9]{2,5})(?:"|'))/gi;

                for (let i = 0; i < dataFiles.length; i++) {
                    const fileObj = dataContents[i];
                    if (!fileObj || !fileObj.content) continue;
                    
                    const fileName = dataFiles[i].split('/').pop() || dataFiles[i];
                    const items = Array.isArray(fileObj.content) ? fileObj.content : [fileObj.content];

                    items.forEach((item: any, index: number) => {
                        // Scan all items regardless of verification status to find truly broken images

                        const itemStr = JSON.stringify(item);
                        // Reset regex state for each item
                        const localRegex = new RegExp(urlRegex.source, urlRegex.flags);
                        
                        let match;
                        while ((match = localRegex.exec(itemStr)) !== null) {
                            const key = match[1];
                            const fullPathKey = `uploads/${key}`;
                            
                            // If it's not in R2, it's broken!
                            if (!allKeys.has(fullPathKey) && !allKeys.has(key)) {
                                brokenImages.push({
                                    url: match[0].replace(/['"]/g, ''),
                                    key: key,
                                    location: fileName,
                                    entityId: item.id || index,
                                    entityName: item.name || item.title || item.label || `Item ${index}`,
                                    directLink: item.link || null,
                                    type: fileName.toLowerCase().includes('dj') ? 'DJS' : 
                                          fileName.toLowerCase().includes('club') ? 'CLUBS' :
                                          fileName.toLowerCase().includes('fest') ? 'FESTIVALS' :
                                          fileName.toLowerCase().includes('news') ? 'NEWS' : 'OTHER'
                                });
                            }
                        }
                    });
                }

                return new Response(JSON.stringify({ 
                    success: true, 
                    broken: brokenImages.filter((v, i, a) => a.findIndex(t => t.url === v.url && t.location === v.location) === i)
                }), { status: 200, headers: { ...headers, 'Cache-Control': 'no-cache' } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }
 
        // --- NEW: UNUSED R2 IMAGES DETECTOR ---
        if (path === '/api/admin/unused-r2-images' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                // 1. Get ALL keys from R2
                const allR2Keys = [];
                let cursor = undefined;
                do {
                    const listResult = await env.R2.list({ cursor });
                    listResult.objects.forEach(o => {
                        allR2Keys.push({ 
                            key: o.key, 
                            size: o.size, 
                            uploaded: o.uploaded
                        });
                    });
                    cursor = listResult.truncated ? listResult.cursor : undefined;
                } while (cursor);

                // 2. All data files to scan
                const WIKI_DJS_PATH = 'src/data/wiki_djs.json';
                const WIKI_CLUBS_PATH = 'src/data/wiki_clubs.json';
                const WIKI_FESTIVALS_PATH = 'src/data/wiki_festivals.json';
                const NEWS_PATH = 'src/data/news.json';
                const AGENDA_PATH = 'src/data/agenda.json';
                const GALERIE_PATH = 'src/data/galerie.json';
                const RECAPS_PATH = 'src/data/recaps.json';
                const TEAM_PATH = 'src/data/team.json';
                const SHOP_PATH = 'src/data/shop.json';
                const CLIPS_PATH = 'src/data/clips.json';
                const TRACKLISTS_PATH = 'src/data/tracklists.json';
                const SETTINGS_PATH = 'src/data/settings.json';

                const dataFiles = [
                    WIKI_DJS_PATH, WIKI_CLUBS_PATH, WIKI_FESTIVALS_PATH,
                    NEWS_PATH, 
                    AGENDA_PATH, GALERIE_PATH, 
                    RECAPS_PATH,
                    TEAM_PATH, SHOP_PATH, CLIPS_PATH, TRACKLISTS_PATH,
                    SETTINGS_PATH, 'src/data/home_layout.json', 'src/data/spotify.json',
                    'src/data/contact_messages.json', 'src/data/newsletter_subscribers.json'
                ];

                const dataContents = await Promise.all(
                    dataFiles.map(filePath => fetchGitHubFile(filePath, gitConfig).catch(() => null))
                );

                const usedKeys = new Set();
                const urlRegex = /(?:(?:"|'|src=)(?:\/uploads\/|https:\/\/dropsiders\.fr\/uploads\/)([^"'\s>]+)(?:"|'|\s|>))/gi;

                for (const fileObj of dataContents) {
                    if (!fileObj || !fileObj.content) continue;
                    const itemStr = JSON.stringify(fileObj.content);
                    const localRegex = new RegExp(urlRegex.source, urlRegex.flags);
                    let match;
                    while ((match = localRegex.exec(itemStr)) !== null) {
                        const key = match[1];
                        usedKeys.add(key);
                        usedKeys.add(`uploads/${key}`);
                    }
                }

                // 3. Find Unused and Used
                const usedInR2 = new Set();
                const unused = [];
                
                allR2Keys.forEach(obj => {
                    const isUsed = usedKeys.has(obj.key) || usedKeys.has(obj.key.replace('uploads/', ''));
                    if (isUsed) {
                        usedInR2.add(obj.key);
                    } else {
                        // On inclut désormais tous les fichiers inutilisés, quel que soit le dossier (uploads, migrated, mp3, root...)
                        unused.push(obj);
                    }
                });

                unused.sort((a,b) => b.uploaded.getTime() - a.uploaded.getTime());

                return new Response(JSON.stringify({ 
                    success: true, 
                    unused: unused,
                    totalR2Count: allR2Keys.length,
                    usedOnSiteCount: usedInR2.size,
                    unusedCount: unused.length
                }), { status: 200, headers: { ...headers, 'Cache-Control': 'no-cache' } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/admin/remove-broken-image' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { location, entityId } = await request.json();
                if (!location || entityId === undefined) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                const filePath = `src/data/${location}`;
                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                const items = Array.isArray(file.content) ? file.content : [file.content];
                const index = items.findIndex((item: any, idx: number) => (item.id !== undefined ? String(item.id) === String(entityId) : idx === entityId));

                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                if (Array.isArray(file.content)) {
                    if (file.content[index].image !== undefined) file.content[index].image = "";
                    if (file.content[index].cover !== undefined) file.content[index].cover = "";
                    if (file.content[index].photo !== undefined) file.content[index].photo = "";
                    file.content[index].photo_verified = true;
                } else {
                    if (file.content.image !== undefined) file.content.image = "";
                    if (file.content.cover !== undefined) file.content.cover = "";
                    if (file.content.photo !== undefined) file.content.photo = "";
                    file.content.photo_verified = true;
                }

                const saved = await saveGitHubFile(filePath, file.content, `Remove broken photo for ${location} ID ${entityId}`, file.sha, gitConfig);
                if (!saved.ok) return new Response(JSON.stringify({ error: saved.error }), { status: 500, headers });

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/admin/validate-photo' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { location, entityId, newUrl } = await request.json();
                if (!location || entityId === undefined) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                const filePath = `src/data/${location}`;
                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                const items = Array.isArray(file.content) ? file.content : [file.content];
                const index = items.findIndex((item: any, idx: number) => (item.id !== undefined ? String(item.id) === String(entityId) : idx === entityId));

                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                // Mark as verified
                if (Array.isArray(file.content)) {
                    file.content[index].photo_verified = true;
                    if (newUrl) {
                        if (file.content[index].image !== undefined) file.content[index].image = newUrl;
                        else if (file.content[index].cover !== undefined) file.content[index].cover = newUrl;
                        else if (file.content[index].photo !== undefined) file.content[index].photo = newUrl;
                    }
                    if (location.includes('wiki_')) {
                        file.content[index].status = 'verified';
                    }
                } else {
                    file.content.photo_verified = true;
                    if (newUrl) {
                        if (file.content.image !== undefined) file.content.image = newUrl;
                        else if (file.content.cover !== undefined) file.content.cover = newUrl;
                        else if (file.content.photo !== undefined) file.content.photo = newUrl;
                    }
                    if (location.includes('wiki_')) {
                        file.content.status = 'verified';
                    }
                }

                const saved = await saveGitHubFile(filePath, file.content, `Manually validate photo for ${location} ID ${entityId}`, file.sha, gitConfig);
                if (!saved.ok) return new Response(JSON.stringify({ error: saved.error }), { status: 500, headers });

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/admin/auto-fix-photos' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { brokenImages } = await request.json(); 
                if (!Array.isArray(brokenImages)) return new Response(JSON.stringify({ error: 'Missing array' }), { status: 400, headers });

                // 1. Fetch all R2 objects once to create a quick lookup map
                const allR2Keys: string[] = [];
                let cursor;
                do {
                    const listResult = await env.R2.list({ cursor, prefix: 'uploads/' });
                    if (listResult.objects) {
                        listResult.objects.forEach(o => allR2Keys.push(o.key));
                    }
                    cursor = listResult.truncated ? listResult.cursor : null;
                } while (cursor);

                let rootCursor;
                do {
                    const listResult = await env.R2.list({ cursor: rootCursor });
                    if (listResult.objects) {
                        listResult.objects.forEach(o => {
                            if (!o.key.startsWith('uploads/')) allR2Keys.push(o.key);
                        });
                    }
                    rootCursor = listResult.truncated ? listResult.cursor : null;
                } while (rootCursor);

                // Create a map from FILENAME to R2 FULL KEY
                const nameToKeyMap = new Map();
                allR2Keys.forEach(k => {
                    const filename = k.split('/').pop();
                    if (filename && !nameToKeyMap.has(filename)) { 
                        nameToKeyMap.set(filename, k);
                    }
                });

                let fixedCount = 0;
                const grouped: Record<string, any[]> = {};
                for (const img of brokenImages) {
                    const filename = img.key.split('/').pop();
                    if (!filename) continue;

                    const matchKey = nameToKeyMap.get(filename);
                    if (matchKey) {
                        // Found it! Map it to a new URL
                        const newUrl = matchKey.startsWith('http') ? matchKey : `/uploads/${matchKey.replace('uploads/', '')}`;
                        
                        if (!grouped[img.location]) grouped[img.location] = [];
                        grouped[img.location].push({ entityId: img.entityId, newUrl });
                    }
                }

                // 3. Update the files
                for (const [location, fixes] of Object.entries(grouped)) {
                    const filePath = `src/data/${location}`;
                    const file = await fetchGitHubFile(filePath, gitConfig);
                    if (!file) continue;

                    const items = Array.isArray(file.content) ? file.content : [file.content];
                    let modified = false;

                    for (const fix of fixes) {
                        const index = items.findIndex((item: any, idx: number) => (item.id !== undefined ? String(item.id) === String(fix.entityId) : idx === fix.entityId));
                        if (index !== -1) {
                            if (Array.isArray(file.content)) {
                                file.content[index].photo_verified = true;
                                if (file.content[index].image !== undefined) file.content[index].image = fix.newUrl;
                                else if (file.content[index].cover !== undefined) file.content[index].cover = fix.newUrl;
                                else if (file.content[index].photo !== undefined) file.content[index].photo = fix.newUrl;
                            } else {
                                file.content.photo_verified = true;
                                if (file.content.image !== undefined) file.content.image = fix.newUrl;
                                else if (file.content.cover !== undefined) file.content.cover = fix.newUrl;
                                else if (file.content.photo !== undefined) file.content.photo = fix.newUrl;
                            }
                            modified = true;
                            fixedCount++;
                        }
                    }

                    if (modified) {
                        await saveGitHubFile(filePath, file.content, `Auto-fix ${fixes.length} broken photos in ${location}`, file.sha, gitConfig);
                    }
                }

                return new Response(JSON.stringify({ success: true, fixedCount }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/admin/validate-photo-bulk' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { items: itemsToValidate } = await request.json(); // Array of { location, entityId }
                if (!itemsToValidate || !Array.isArray(itemsToValidate)) return new Response(JSON.stringify({ error: 'Missing items array' }), { status: 400, headers });

                // Group by location to minimize GitHub fetches
                const grouped = itemsToValidate.reduce((acc: any, curr: any) => {
                    if (!acc[curr.location]) acc[curr.location] = [];
                    acc[curr.location].push(curr.entityId);
                    return acc;
                }, {});

                for (const [location, entityIds] of Object.entries(grouped)) {
                    const filePath = `src/data/${location}`;
                    const file = await fetchGitHubFile(filePath, gitConfig);
                    if (!file) continue;

                    const items = Array.isArray(file.content) ? file.content : [file.content];
                    let modified = false;

                    (entityIds as any[]).forEach(eid => {
                        const index = items.findIndex((item: any, idx: number) => (item.id !== undefined ? String(item.id) === String(eid) : idx === eid));
                        if (index !== -1) {
                            if (Array.isArray(file.content)) {
                                file.content[index].photo_verified = true;
                                if (location.includes('wiki_')) file.content[index].status = 'verified';
                            } else {
                                file.content.photo_verified = true;
                                if (location.includes('wiki_')) file.content.status = 'verified';
                            }
                            modified = true;
                        }
                    });

                    if (modified) {
                        await saveGitHubFile(filePath, file.content, `Bulk validate ${entityIds.length} photos in ${location}`, file.sha, gitConfig);
                    }
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/admin/remove-broken-image-bulk' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { items: itemsToRemove } = await request.json(); 
                if (!itemsToRemove || !Array.isArray(itemsToRemove)) return new Response(JSON.stringify({ error: 'Missing items array' }), { status: 400, headers });

                const grouped = itemsToRemove.reduce((acc: any, curr: any) => {
                    if (!acc[curr.location]) acc[curr.location] = [];
                    acc[curr.location].push(curr.entityId);
                    return acc;
                }, {});

                for (const [location, entityIds] of Object.entries(grouped)) {
                    const filePath = `src/data/${location}`;
                    const file = await fetchGitHubFile(filePath, gitConfig);
                    if (!file) continue;

                    const items = Array.isArray(file.content) ? file.content : [file.content];
                    let modified = false;

                    (entityIds as any[]).forEach(eid => {
                        const index = items.findIndex((item: any, idx: number) => (item.id !== undefined ? String(item.id) === String(eid) : idx === eid));
                        if (index !== -1) {
                            const target = Array.isArray(file.content) ? file.content[index] : file.content;
                            if (target.image !== undefined) target.image = "";
                            if (target.cover !== undefined) target.cover = "";
                            if (target.photo !== undefined) target.photo = "";
                            target.photo_verified = true;
                            modified = true;
                        }
                    });

                    if (modified) {
                        await saveGitHubFile(filePath, file.content, `Bulk remove ${entityIds.length} broken photos in ${location}`, file.sha, gitConfig);
                    }
                }
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/agenda/favorites' && request.method === 'GET') {
            const email = url.searchParams.get('email');
            if (!email) return new Response(JSON.stringify([]), { headers });
            const key = `agenda_favorites_${email.toLowerCase().trim()}`;
            const data = await env.CHAT_KV.get(key) || "[]";
            return new Response(data, { headers });
        }

        if (path === '/api/agenda/favorites' && request.method === 'POST') {
            const { email, favorites } = await request.json();
            if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers });
            const key = `agenda_favorites_${email.toLowerCase().trim()}`;
            await env.CHAT_KV.put(key, JSON.stringify(favorites || []));
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (path === '/api/r2/duplicates' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                if (!env.R2) return new Response(JSON.stringify([]), { status: 200, headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
                
                const allObjects = [];
                let cursor = undefined;
                while (true) {
                    const listResult = await env.R2.list({ cursor, prefix: 'uploads/' });
                    allObjects.push(...listResult.objects);
                    if (!listResult.truncated) break;
                    cursor = listResult.cursor;
                }
                
                const groups = new Map();
                for (const obj of allObjects) {
                    // ETag is the content hash (MD5) which is perfect for finding duplicates
                    const hash = obj.etag;
                    if (!groups.has(hash)) groups.set(hash, []);
                    groups.get(hash).push({
                        key: obj.key,
                        size: obj.size,
                        uploaded: obj.uploaded,
                        etag: obj.etag
                    });
                }
                
                let duplicateSets = Array.from(groups.values())
                    .filter((set: any) => set.length > 1)
                    .sort((a: any, b: any) => b[0].size - a[0].size); // Show biggest files first

                // LIMIT to 500 groups for performance (Cloudflare Worker CPU limit)
                if (duplicateSets.length > 500) {
                    duplicateSets = duplicateSets.slice(0, 500);
                }

                if (duplicateSets.length === 0) {
                    return new Response(JSON.stringify([]), { status: 200, headers });
                }

                // --- NEW: COMPREHENSIVE USAGE TRACKING ---
                // We scan EVERY file that might contain a reference to an image
                const dataFiles = [
                    WIKI_DJS_PATH, WIKI_CLUBS_PATH, WIKI_FESTIVALS_PATH,
                    NEWS_PATH, ...NEWS_CONTENT_FILES,
                    AGENDA_PATH, GALERIE_PATH, 
                    RECAPS_PATH, ...RECAPS_CONTENT_FILES,
                    TEAM_PATH, SHOP_PATH, CLIPS_PATH, TRACKLISTS_PATH
                ];

                const usageMap: Record<string, string[]> = {};
                
                // Fetch all data content in parallel
                const dataContents = await Promise.all(
                    dataFiles.map(path => fetchGitHubFile(path, gitConfig).catch(() => null))
                );

                // Build a combined string of all keys we care about
                const allDuplicateKeys = duplicateSets.flatMap((set: any) => set.map((obj: any) => obj.key));
                
                for (let i = 0; i < dataFiles.length; i++) {
                    const fileObj = dataContents[i];
                    if (!fileObj || !fileObj.content) continue;
                    
                    const fileName = dataFiles[i].split('/').pop() || dataFiles[i];
                    const contentStr = JSON.stringify(fileObj.content);
                    
                    // Check search for EACH duplicate key in this file
                    for (const key of allDuplicateKeys) {
                        if (contentStr.indexOf(key) !== -1) {
                            if (!usageMap[key]) usageMap[key] = [];
                            usageMap[key].push(fileName);
                        }
                    }
                }

                const duplicateSetsWithUsage = duplicateSets.map((set: any) => 
                    set.map((obj: any) => ({
                        ...obj,
                        usages: usageMap[obj.key] || []
                    }))
                );
                
                return new Response(JSON.stringify(duplicateSetsWithUsage), { 
                    status: 200, 
                    headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate' } 
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate' } });
            }
        }

        if (path === '/api/r2/delete' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { key, keys } = await request.json();
                if (!key && (!keys || !Array.isArray(keys))) {
                    return new Response(JSON.stringify({ error: 'Key or keys array required' }), { status: 400, headers });
                }
                
                if (!env.R2) return new Response(JSON.stringify({ error: 'R2 not configured' }), { status: 500, headers });
                
                if (keys && Array.isArray(keys)) {
                    await Promise.all(keys.map(k => env.R2.delete(k)));
                    return new Response(JSON.stringify({ success: true, count: keys.length }), { status: 200, headers });
                } else {
                    await env.R2.delete(key);
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                }
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/list' && request.method === 'GET') {
            try {
                const type = url.searchParams.get('type');
                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                return new Response(JSON.stringify(file.content), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        // --- NEW: R2 LIST ALL PHOTOS ---
        if (path === '/api/r2/list' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                if (!env.R2) return new Response(JSON.stringify({ objects: [], truncated: false }), { status: 200, headers });
                
                const cursor = url.searchParams.get('cursor') || undefined;
                const prefix = url.searchParams.get('prefix') || 'uploads/';
                const limit = parseInt(url.searchParams.get('limit') || '50');
                const sort = url.searchParams.get('sort');
                
                // If sorting by date, we need to get ALL objects because R2 only lists alphabetically
                if (sort === 'date') {
                    const allObjects = [];
                    let currentCursor = undefined;
                    // We limit to 2000 objects to avoid timeout/memory issues, 
                    // usually enough for a photo library
                    let safetyCounter = 0;
                    
                    while (safetyCounter < 20) { // Max 2000 items (20 * 100)
                        const res = await env.R2.list({ cursor: currentCursor, prefix, limit: 100 });
                        allObjects.push(...res.objects);
                        if (!res.truncated) break;
                        currentCursor = res.cursor;
                        safetyCounter++;
                    }
                    
                    // Sort by upload date (latest first)
                    allObjects.sort((a: any, b: any) => b.uploaded.getTime() - a.uploaded.getTime());
                    
                    // Handle pagination for the sorted list manually or just return the first chunk
                    // Since we already have everything, we can just slice it
                    const offset = cursor ? parseInt(atob(cursor)) : 0;
                    const paginated = allObjects.slice(offset, offset + limit);
                    const nextOffset = (offset + limit < allObjects.length) ? btoa((offset + limit).toString()) : undefined;

                    return new Response(JSON.stringify({
                        objects: paginated.map(obj => ({
                            key: obj.key,
                            size: obj.size,
                            uploaded: obj.uploaded,
                            etag: obj.etag,
                            url: `/${obj.key}`
                        })),
                        truncated: !!nextOffset,
                        cursor: nextOffset,
                        total: allObjects.length
                    }), { headers });
                }

                const listResult = await env.R2.list({ cursor, prefix, limit });
                
                const objects = listResult.objects.map(obj => ({
                    key: obj.key,
                    size: obj.size,
                    uploaded: obj.uploaded,
                    etag: obj.etag,
                    url: `/${obj.key}`
                }));
                
                return new Response(JSON.stringify({
                    objects,
                    truncated: listResult.truncated,
                    cursor: listResult.cursor,
                }), { headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/update-photo' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { id, type, imageUrl } = await request.json();
                if (!id || !type || !imageUrl) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                const index = file.content.findIndex(item => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                // Update item
                file.content[index].image = imageUrl;
                if (file.content[index].status === 'waiting') {
                    file.content[index].status = 'verified';
                }

                const saved = await saveGitHubFile(filePath, file.content, `Update photo for ${file.content[index].name} (${type})`, file.sha, gitConfig);
                
                if (!saved.ok) {
                    return new Response(JSON.stringify({ error: saved.error }), { status: 500, headers });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/approve-bulk' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { ids, type } = await request.json();
                if (!ids || !Array.isArray(ids) || !type) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
                const idsArray = ids.map(String);

                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                const gitConfig = { OWNER, REPO, TOKEN };
                
                let saved = { ok: false, error: '' };
                let count = 0;
                let approveAttempts = 0;
                
                while (approveAttempts < 3) {
                    const file = await fetchGitHubFile(filePath, gitConfig);
                    if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                    count = 0;
                    file.content.forEach(item => {
                        const itemId = String(item.id);
                        if (idsArray.includes(itemId)) {
                            if (item.status === 'waiting') {
                                item.status = 'verified';
                                count++;
                            }
                        }
                    });

                    if (count === 0) {
                        return new Response(JSON.stringify({ success: true, count: 0 }), { status: 200, headers });
                    }

                    saved = await saveGitHubFile(filePath, file.content, `Bulk approve ${count} items in ${type}`, file.sha, gitConfig);
                    if (saved.ok) break;
                    if (saved.status !== 409) break;
                    approveAttempts++;
                    await new Promise(r => setTimeout(r, 600 * approveAttempts));
                }

                if (!saved.ok) {
                    return new Response(JSON.stringify({ error: saved.error || 'Conflict after retries' }), { status: 500, headers });
                }

                return new Response(JSON.stringify({ success: true, count }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/delete' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { id, ids, type } = await request.json();
                const idsToDelete = (Array.isArray(ids) ? ids : (id ? [id] : [])).map(String);

                if (idsToDelete.length === 0 || !type) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                // Check if at least one item exists
                const hasValidItems = file.content.some((item: any) => idsToDelete.includes(String(item.id)));
                if (!hasValidItems) return new Response(JSON.stringify({ error: 'Items not found' }), { status: 404, headers });

                // Retry logic for Wiki deletion
                let saved = { ok: false, error: '' };
                let deleteAttempts = 0;
                while (deleteAttempts < 3) {
                    const currentFile = await fetchGitHubFile(filePath, gitConfig);
                    if (!currentFile) break;
                    const cRows = currentFile.content.filter((item: any) => !idsToDelete.includes(String(item.id)));
                    
                    const commitMessage = idsToDelete.length > 1 
                        ? `Delete ${idsToDelete.length} items from Wiki (${type})`
                        : `Delete item from Wiki (${type})`;
                        
                    saved = await saveGitHubFile(filePath, cRows, commitMessage, currentFile.sha, gitConfig);
                    if (saved.ok) break;
                    if (saved.status !== 409) break;
                    deleteAttempts++;
                    await new Promise(r => setTimeout(r, 500 * deleteAttempts));
                }
                
                if (!saved.ok) {
                    return new Response(JSON.stringify({ error: saved.error || 'Conflict after retries' }), { status: 500, headers });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/update' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { id, type, entry } = await request.json();
                if (!id || !type || !entry) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                const index = file.content.findIndex((item: any) => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                // Update entry but keep ID and votes/rating if not provided
                file.content[index] = {
                    ...file.content[index],
                    ...entry,
                    id: id // Ensure ID never changes
                };

                const saved = await saveGitHubFile(filePath, file.content, `Update ${file.content[index].name} in Wiki (${type})`, file.sha, gitConfig);
                
                if (!saved.ok) {
                    return new Response(JSON.stringify({ error: saved.error }), { status: 500, headers });
                }

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/add' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { type, entry } = await request.json();
                if (!type || !entry) return new Response(JSON.stringify({ error: 'Missing type or entry' }), { status: 400, headers });

                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                // Find max ID
                let maxId = 0;
                file.content.forEach((item: any) => {
                    const nid = parseInt(item.id);
                    if (!isNaN(nid) && nid > maxId) maxId = nid;
                });
                const newId = (maxId + 1).toString();

                const newEntry = {
                    ...entry,
                    id: newId,
                    rating: entry.rating || "0.0",
                    votes: entry.votes || 0
                };

                const newContent = [...file.content, newEntry];
                const saved = await saveGitHubFile(filePath, newContent, `Add ${newEntry.name} to Wiki (${type})`, file.sha, gitConfig);
                
                if (!saved.ok) {
                    return new Response(JSON.stringify({ error: saved.error }), { status: 500, headers });
                }

                return new Response(JSON.stringify({ success: true, id: newId }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/report-broken' && request.method === 'POST') {
            try {
                const { id, type } = await request.json();
                if (!id || !type) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                const file = await fetchGitHubFile(filePath, gitConfig);
                if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                const index = file.content.findIndex(item => item.id === id);
                if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                // Mark as waiting
                file.content[index].status = 'waiting';
                
                const saved = await saveGitHubFile(filePath, file.content, `Report broken image for ${file.content[index].name} (${type})`, file.sha, gitConfig);
                if (!saved.ok) return new Response(JSON.stringify({ error: saved.error }), { status: 500, headers });

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

        // Reset all leaderboards
        if (path === '/api/admin/reset-leaderboards' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            try {
                const { type } = await request.json(); // 'xp', 'wiki', 'music', 'all'
                const gitConfig = await getGitConfig(env);
                const tasks = [];
                
                // 1. Reset XP
                if (type === 'xp' || type === 'all') {
                    tasks.push((async () => {
                        const list = await env.CHAT_KV.list({ prefix: 'community_player_xp_' });
                        for (const key of list.keys) {
                            await env.CHAT_KV.delete(key.name);
                        }
                    })());
                }

                // 2. Reset Wiki JSONs
                if (type === 'wiki' || type === 'all') {
                    tasks.push((async () => {
                        const DJS_PATH = 'src/data/wiki_djs.json';
                        const CLUBS_PATH = 'src/data/wiki_clubs.json';
                        const FESTS_PATH = 'src/data/wiki_festivals.json';

                        const djFile = await fetchGitHubFile(DJS_PATH, gitConfig);
                        if (djFile?.content) {
                            const content = djFile.content.map((d: any) => ({ ...d, rating: "0", votes: 0 }));
                            await saveGitHubFile(DJS_PATH, content, "Reset DJ ratings & votes", djFile.sha, gitConfig);
                        }
                        const clubFile = await fetchGitHubFile(CLUBS_PATH, gitConfig);
                        if (clubFile?.content) {
                            const content = clubFile.content.map((c: any) => ({ ...c, votes: 0, rating: "0" }));
                            await saveGitHubFile(CLUBS_PATH, content, "Reset Club votes & ratings", clubFile.sha, gitConfig);
                        }
                        const festFile = await fetchGitHubFile(FESTS_PATH, gitConfig);
                        if (festFile?.content) {
                            const content = festFile.content.map((f: any) => ({ ...f, votes: 0, rating: "0" }));
                            await saveGitHubFile(FESTS_PATH, content, "Reset Festival votes & ratings", festFile.sha, gitConfig);
                        }
                    })());
                }

                // 3. Reset Music Tracks in KV
                if (type === 'music' || type === 'all') {
                    tasks.push((async () => {
                        const list = await env.CHAT_KV.list({ prefix: 'music_track:' });
                        for (const key of list.keys) {
                            await env.CHAT_KV.delete(key.name);
                        }
                    })());
                }

                await Promise.all(tasks);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (error: any) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
            }
        }

        // --- NEW: MUSIC TRACK VOTING ---
        if (path === '/api/music/vote' && request.method === 'POST') {
            try {
                const { trackTitle } = await request.json();
                if (!trackTitle) return new Response(JSON.stringify({ error: 'Title required' }), { status: 400, headers });

                const trackId = trackTitle.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
                const kvKey = `music_track:${trackId}`;

                let data = await env.CHAT_KV.get(kvKey, { type: 'json' }) as { title: string, votes: number } | null;
                if (!data) {
                    data = { title: trackTitle, votes: 1 };
                } else {
                    data.votes = (data.votes || 0) + 1;
                }

                await env.CHAT_KV.put(kvKey, JSON.stringify(data));
                return new Response(JSON.stringify({ success: true, votes: data.votes }), { status: 200, headers });
            } catch (error: any) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
            }
        }

        if (path === '/api/music/top-tracks' && request.method === 'GET') {
            try {
                const list = await env.CHAT_KV.list({ prefix: 'music_track:' });
                const tracks = await Promise.all(
                    list.keys.map(async (key) => {
                        return await env.CHAT_KV.get(key.name, { type: 'json' });
                    })
                );

                const top10 = (tracks.filter(Boolean) as { title: string, votes: number }[])
                    .sort((a, b) => b.votes - a.votes)
                    .slice(0, 10);

                return new Response(JSON.stringify(top10), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...headers }
                });
            } catch (error: any) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
            }
        }

        if (path === '/api/wiki/vote' && request.method === 'POST') {
            try {
                const { artistId, type } = await request.json();
                if (!artistId || !type) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

                let filePath = '';
                if (type === 'DJS') filePath = WIKI_DJS_PATH;
                else if (type === 'CLUBS') filePath = WIKI_CLUBS_PATH;
                else if (type === 'FESTIVALS') filePath = WIKI_FESTIVALS_PATH;
                else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

                let attempts = 0;
                let saved = { ok: false, error: '' };
                
                while (attempts < 3) {
                    const file = await fetchGitHubFile(filePath, gitConfig);
                    if (!file) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

                    const index = file.content.findIndex((item: any) => item.id === artistId);
                    if (index === -1) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });

                    // Increment votes & rating
                    file.content[index].votes = (file.content[index].votes || 0) + 1;
                    if (type === 'DJS') {
                        const currentRating = parseInt(file.content[index].rating || "0");
                        file.content[index].rating = (currentRating + 1).toString();
                    }

                    saved = await saveGitHubFile(filePath, file.content, `Vote for ${file.content[index].name} (${type})`, file.sha, gitConfig);
                    if (saved.ok) break;
                    if (saved.status !== 409) break;
                    attempts++;
                    await new Promise(r => setTimeout(r, 500 * attempts));
                }

                if (!saved.ok) return new Response(JSON.stringify({ error: saved.error }), { status: 500, headers });
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
            }
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
            if (activeRaw === "[]" || active.length < 50) {
                // Fetch default data from GitHub to keep worker small
                const configStr = await env.CHAT_KV.get('config') || "{}";
                const config = JSON.parse(configStr);
                const quizDataRaw = await fetchGitHubFile('src/data/quizzes_default.json', config);
                let defaultQuizzes = [];
                let musicTitlesPool = [];
                try {
                    const parsed = JSON.parse(quizDataRaw);
                    defaultQuizzes = parsed.quizzes || [];
                    musicTitlesPool = parsed.musicTitlesPool || [];
                } catch (e) {
                    console.error('Failed to parse default quizzes', e);
                }
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
            const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

            // IF CONTEST MODE, ENFORCE ONE ENTRY PER IP AND ACCOUNT
            if (result.isContest) {
                const logRaw = await env.CHAT_KV.get('quiz_contest_participation_log') || "{\"ips\":{},\"users\":{}}";
                let log;
                try {
                    log = JSON.parse(logRaw);
                } catch (e) {
                    log = { ips: {}, users: {} };
                }

                if (!log.ips) log.ips = {};
                if (!log.users) log.users = {};

                const alreadyParticipated = (result.userId && log.users[result.userId]) || log.ips[ip];

                if (alreadyParticipated) {
                    return new Response(JSON.stringify({ 
                        success: false, 
                        error: 'Désolé, une seule participation par compte et par IP est autorisée pour ce concours !' 
                    }), { status: 403, headers });
                }

                // Record participation
                log.ips[ip] = { timestamp: Date.now(), pseudo: result.pseudo };
                if (result.userId) {
                    log.users[result.userId] = { timestamp: Date.now(), pseudo: result.pseudo, email: result.userEmail };
                }
                await env.CHAT_KV.put('quiz_contest_participation_log', JSON.stringify(log));
            }

            const raw = await env.CHAT_KV.get('quiz_leaderboard') || "[]";
            const leaderboard = JSON.parse(raw);

            leaderboard.push(result);
            // Sort by score (desc) then time (asc)
            leaderboard.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.time - b.time;
            });

            // If it's a contest, also save to a dedicated contest results list
            if (result.isContest) {
                const contestRaw = await env.CHAT_KV.get('quiz_contest_results') || "[]";
                const contestResults = JSON.parse(contestRaw);
                contestResults.push({
                    ...result,
                    timestamp: Date.now(),
                    ip
                });
                // Sort contest results
                contestResults.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return a.time - b.time;
                });
                // Keep all contest results for the current session (admin can reset them)
                await env.CHAT_KV.put('quiz_contest_results', JSON.stringify(contestResults));
            }

            // Keep only top 20 for global
            const sliced = leaderboard.slice(0, 20);
            await env.CHAT_KV.put('quiz_leaderboard', JSON.stringify(sliced));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/quiz/contest/results' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const results = await env.CHAT_KV.get('quiz_contest_results') || "[]";
            return new Response(results, { status: 200, headers });
        }

        if (path === '/api/quiz/contest/reset' && request.method === 'POST') {
            const adminPass = (request.headers.get('X-Admin-Password') || '').trim();
            const requiredPass = adminPassword;
            if (adminPass !== requiredPass) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            }
            await env.CHAT_KV.delete('quiz_contest_participation_log');
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        // --- API: INSTAGRAM CONTEST ---
        if (path === '/api/instagram-contest/participate' && request.method === 'POST') {
            const result = await request.json();
            const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

            // Check if already participated (account level)
            const logRaw = await env.CHAT_KV.get('instagram_contest_participation_log') || "{\"ips\":{},\"users\":{}}";
            let log;
            try {
                log = JSON.parse(logRaw);
            } catch (e) {
                log = { ips: {}, users: {} };
            }

            if (!log.ips) log.ips = {};
            if (!log.users) log.users = {};

            const alreadyParticipated = (result.userId && log.users[result.userId]) || log.ips[ip];

            if (alreadyParticipated) {
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: 'Désolé, une seule participation par compte et par IP est autorisée !' 
                }), { status: 403, headers });
            }

            // Record participation log
            log.ips[ip] = { timestamp: Date.now(), handle: result.handle };
            if (result.userId) {
                log.users[result.userId] = { timestamp: Date.now(), handle: result.handle, email: result.email };
            }
            await env.CHAT_KV.put('instagram_contest_participation_log', JSON.stringify(log));

            // Save entries
            const entriesRaw = await env.CHAT_KV.get('instagram_contest_entries') || "[]";
            const entries = JSON.parse(entriesRaw);
            entries.push({
                ...result,
                timestamp: Date.now(),
                ip
            });
            await env.CHAT_KV.put('instagram_contest_entries', JSON.stringify(entries));

            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/instagram-contest/participants' && request.method === 'GET') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const entries = await env.CHAT_KV.get('instagram_contest_entries') || "[]";
            return new Response(entries, { status: 200, headers });
        }

        if (path === '/api/instagram-contest/update-status' && request.method === 'POST') {
            if (!authenticated) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            const { handle, timestamp, status } = await request.json();
            
            const entriesRaw = await env.CHAT_KV.get('instagram_contest_entries') || "[]";
            let entries = JSON.parse(entriesRaw);
            
            entries = entries.map((e: any) => {
                if (e.handle === handle && e.timestamp === timestamp) {
                    return { ...e, status };
                }
                return e;
            });
            
            await env.CHAT_KV.put('instagram_contest_entries', JSON.stringify(entries));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (path === '/api/musique/charts/update' && request.method === 'POST') {
            const adminPass = (request.headers.get('X-Admin-Password') || '').trim();
            const requiredPass = adminPassword;
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
            if (adminPass !== adminPassword) {
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
                    { "rank": 1, "id": "24508685", "title": "Talk To You (Extended Mix)", "artist": "ANOTR, 54 Ultra", "label": "NO ART", "url": "https://www.beatport.com/track/talk-to-you/24508685", "embedUrl": "https://embed.beatport.com/?id=24508685&type=track" },
                    { "rank": 2, "id": "24508402", "title": "Addicted To Bass (Dom Dolla Relapse)", "artist": "Puretone, Dom Dolla", "label": "TMRW Music", "url": "https://www.beatport.com/track/addicted-to-bass-dom-dolla-relapse/24508402", "embedUrl": "https://embed.beatport.com/?id=24508402&type=track" },
                    { "rank": 3, "id": "23451068", "title": "Make My Day (Original Mix)", "artist": "ESSE (US)", "label": "ESSEntial.", "url": "https://www.beatport.com/track/make-my-day/23451068", "embedUrl": "https://embed.beatport.com/?id=23451068&type=track" },
                    { "rank": 4, "id": "24441099", "title": "Lifting (Extended)", "artist": "Riordan, Silva Bumpa", "label": "Room Two Recordings", "url": "https://www.beatport.com/track/lifting/24441099", "embedUrl": "https://embed.beatport.com/?id=24441099&type=track" },
                    { "rank": 5, "id": "23443670", "title": "Good Time (Extended Mix)", "artist": "Trace (UZ)", "label": "8Bit", "url": "https://www.beatport.com/track/good-time/23443670", "embedUrl": "https://embed.beatport.com/?id=23443670&type=track" },
                    { "rank": 6, "id": "26834198", "title": "Science Fiction (Original Mix)", "artist": "Brunello", "label": "Mellow Circus Records", "url": "https://www.beatport.com/track/science-fiction/26834198", "embedUrl": "https://embed.beatport.com/?id=26834198&type=track" },
                    { "rank": 7, "id": "23308330", "title": "neck (Extended Mix)", "artist": "Mau P", "label": "Black Book Records", "url": "https://www.beatport.com/track/neck/23308330", "embedUrl": "https://embed.beatport.com/?id=23308330&type=track" },
                    { "rank": 8, "id": "23904036", "title": "Loco Loco (Extended Mix)", "artist": "Reinier Zonneveld, GORDO (US)", "label": "SPINNIN' RECORDS", "url": "https://www.beatport.com/track/loco-loco/23904036", "embedUrl": "https://embed.beatport.com/?id=23904036&type=track" },
                    { "rank": 9, "id": "23451235", "title": "Out of My Mind (Extended Mix)", "artist": "Joshwa", "label": "Hellbent Records", "url": "https://www.beatport.com/track/out-of-my-mind/23451235", "embedUrl": "https://embed.beatport.com/?id=23451235&type=track" },
                    { "rank": 10, "id": "24133364", "title": "I Can't Wait (Extended)", "artist": "Bob Sinclar, Kiesza", "label": "Yellow Productions", "url": "https://www.beatport.com/track/i-cant-wait/24133364", "embedUrl": "https://embed.beatport.com/?id=24133364&type=track" }
                ],
                traxsource: [
                    { id: 'ts-14359025', rank: 1, title: 'Take Me Up (ft. Donna Blakely)', artist: 'Ralphi Rosario, Bob Sinclar', label: 'Altra Moda Music', url: 'https://traxsource.com/track/14359025/take-me-up-ft-donna-blakely', embedUrl: 'https://embed.traxsource.com/player/track/14359025' },
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
                    { id: 'jn-7425809-02', rank: 1, title: 'Bombaclart (Furniss remix)', artist: 'Furniss / Majistrate', label: 'Low Down Deep Recordings', url: 'https://www.junodownload.com/products/bombaclart-furniss-remix/7425809-02/?track_number=1', embedUrl: 'https://www.junodownload.com/player-embed/7425809-02.m3u/' },
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

        const assetsBinding = env.APP_ASSETS || env.ASSETS;
        let response;
        if (assetsBinding) {
            response = await assetsBinding.fetch(request);
            if (response.status === 404 || path === '/admin') {
                response = await assetsBinding.fetch(new URL('/index.html', request.url));
            }
        } else {
            return new Response("Not Found (No Assets Binding)", { status: 404 });
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

            const jsonLd = {
                "@context": "https://schema.org",
                "@type": foundItem ? (path.includes('/news') ? "NewsArticle" : "Article") : "WebSite",
                "headline": title,
                "description": description,
                "image": image,
                "url": `${origin}${path}`,
                "publisher": {
                    "@type": "Organization",
                    "name": "Dropsiders",
                    "logo": {
                        "@type": "ImageObject",
                        "url": `${origin}/Logo.png`
                    }
                }
            };

            if (foundItem) {
                jsonLd.datePublished = foundItem.date;
                jsonLd.author = {
                    "@type": "Person",
                    "name": foundItem.author || "Dropsiders"
                };
            }

            return new HTMLRewriter()
                .on('title', { element(e) { e.setInnerContent(title); } })
                .on('head', {
                    element(e) {
                        e.append(`<link rel="canonical" href="${origin}${path}">`, { html: true });
                        e.append(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`, { html: true });
                    }
                })
                .on('meta[name="description"]', { element(e) { e.setAttribute("content", description); } })
                .on('meta[name="author"]', { element(e) { e.setAttribute("content", foundItem?.author || "Dropsiders"); } })
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
        const lastChartsUpdate = await env.CHAT_KV.get('last_charts_update');
        const res = await fetchGitHubFile(SETTINGS_PATH, scheduledGitConfig);
        if (!res) return;
        const content = res.content;
        const fileData = { sha: res.sha };

        let settingsChanged = false;
        let agendaChanged = false;
        const todayStr = new Date().toISOString().split('T')[0];

        // --- AUTO-CLEANUP AGENDA ---
        const agendaRes = await fetchGitHubFile(AGENDA_PATH, scheduledGitConfig);
        let agendaContent = agendaRes?.content || [];
        const originalAgendaLength = agendaContent.length;

        agendaContent = agendaContent.filter(item => {
            const end = item.endDate || item.startDate || item.date;
            if (end && end < todayStr) return false;
            return true;
        });

        if (agendaContent.length !== originalAgendaLength) {
            agendaChanged = true;
        }

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

        if (agendaChanged) {
            await saveGitHubFile(AGENDA_PATH, agendaContent, 'Auto-cleanup past agenda (Scheduled)', agendaRes.sha, scheduledGitConfig);
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

        // Send one notification per artist to subscribers who have them as favorites
        for (const artist of newArtistsToNotify) {
            console.log(`Sending push for ${artist.artist}`);
            await sendPushNotification(
                env,
                {
                    title: '🎧 DROPSIDERS LIVE',
                    body: `${artist.artist} est maintenant en LIVE !`,
                    url: 'https://dropsiders.fr/live',
                    icon: '/android-chrome-192x192.png',
                    badge: '/android-chrome-192x192.png'
                },
                // Only send to subscribers who have this artist in favorites
                (subData) => Array.isArray(subData.favorites) && subData.favorites.includes(artist.artist)
            );
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
