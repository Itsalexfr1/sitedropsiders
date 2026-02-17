
import {
    jsonResponse,
    hashPassword,
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
        const { title, summary, content, image, category, date } = body;

        if (!title || !content || !image || !category) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
        }

        // Configuration GitHub
        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const PATH = 'src/data/news.json';
        const TOKEN = env.GITHUB_TOKEN;

        // 1. Fetch current news file
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
            return new Response(JSON.stringify({ error: 'Failed to fetch existing news', details: errorText }), { status: 502, headers });
        }

        const fileData: any = await getResponse.json();
        let currentNews: any[] = [];
        try {
            const content = b64_to_utf8(fileData.content.replace(/\n/g, ''));
            currentNews = JSON.parse(content);
        } catch (e) {
            console.error("Error parsing news data:", e);
            currentNews = [];
        }

        // 2. Add new article
        const newId = currentNews.length > 0 ? Math.max(...currentNews.map((n: any) => n.id)) + 1 : 1;

        // Generate a simple link/slug
        const slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove non-word chars
            .replace(/\s+/g, '-') // Replace spaces with -
            .substring(0, 50);

        const link = `https://www.dropsiders.eu/news/${newId}_${slug}`;

        const newArticle = {
            id: newId,
            title,
            date: date || new Date().toISOString().split('T')[0],
            summary,
            content, // Assumes HTML or handled by frontend
            image,
            images: [image], // Default to single image array
            youtubeId: "", // Optional, not in form yet
            link,
            category
        };

        // Add to beginning of array
        currentNews.unshift(newArticle);

        // 3. Update file on GitHub
        const updatedContent = utf8_to_b64(JSON.stringify(currentNews, null, 2));

        const putBody: any = {
            message: `Add news article: ${title}`,
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
            return new Response(JSON.stringify({ error: 'Failed to save news', details: errorText }), { status: 502, headers });
        }

        return new Response(JSON.stringify({ success: true, article: newArticle }), { status: 200, headers });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500, headers });
    }
};
