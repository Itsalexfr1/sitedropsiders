
import { jsonResponse, CORSH } from '../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: { ...CORSH }
        });
    }

    try {
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return jsonResponse({ error: 'Accès non autorisé' }, 401);
        }

        const formData = await request.formData();
        const file = formData.get('image') as File;
        const subPath = formData.get('path') as string || 'uploads';

        if (!file) {
            return jsonResponse({ error: 'Aucun fichier reçu' }, 400);
        }

        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const TOKEN = env.GITHUB_TOKEN;

        if (!TOKEN) {
            return jsonResponse({ error: 'GITHUB_TOKEN non configuré' }, 500);
        }

        // Generate a clean filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
        const filename = `${timestamp}_${originalName}`;
        const filePath = `public/images/${subPath}/${filename}`;

        // Convert to base64
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Content = btoa(binary);

        // Upload to GitHub
        const githubUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

        const putResponse = await fetch(githubUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'User-Agent': 'Cloudflare-Worker',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload image: ${filename} via Admin Panel`,
                content: base64Content
            })
        });

        if (!putResponse.ok) {
            const errorText = await putResponse.text();
            return jsonResponse({ error: 'Erreur lors de l\'envoi vers GitHub', details: errorText }, 502);
        }

        // Construct the URL to be used in the site
        const publicUrl = `/images/${subPath}/${filename}`;

        return jsonResponse({
            success: true,
            url: publicUrl,
            filename: filename
        });

    } catch (err: any) {
        console.error('Upload error:', err);
        return jsonResponse({ error: err.message || 'Erreur interne lors de l\'upload' }, 500);
    }
};
