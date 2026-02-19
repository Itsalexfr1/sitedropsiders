
import { jsonResponse, CORSH } from '../utils';

export const onRequest = async (context: any) => {
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

        // ─────────────────────────────────────────────
        // CLOUDINARY UPLOAD (méthode principale)
        // ─────────────────────────────────────────────
        const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME || 'drd0k6wve';
        const CLOUDINARY_UPLOAD_PRESET = env.CLOUDINARY_UPLOAD_PRESET || 'dropsiders_unsigned';

        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
            try {
                const cloudinaryFormData = new FormData();
                cloudinaryFormData.append('file', file);
                cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                cloudinaryFormData.append('folder', `dropsiders/${subPath.replace(/[^a-zA-Z0-9-_]/g, '')}`);

                const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

                const uploadRes = await fetch(cloudinaryUrl, {
                    method: 'POST',
                    body: cloudinaryFormData,
                });

                if (uploadRes.ok) {
                    const cloudData: any = await uploadRes.json();
                    return jsonResponse({
                        success: true,
                        url: cloudData.secure_url,
                        filename: cloudData.public_id,
                        provider: 'cloudinary'
                    });
                } else {
                    const errText = await uploadRes.text();
                    console.error('Cloudinary Upload Failed:', errText);
                    // Continue to GitHub fallback
                }
            } catch (cloudErr) {
                console.error('Cloudinary Exception:', cloudErr);
            }
        }

        // ─────────────────────────────────────────────
        // GITHUB FALLBACK (si Cloudinary pas configuré)
        // ─────────────────────────────────────────────
        const OWNER = env.GITHUB_OWNER || 'Itsalexfr1';
        const REPO = env.GITHUB_REPO || 'sitedropsiders';
        const TOKEN = env.GITHUB_TOKEN;

        if (!TOKEN) {
            return jsonResponse({
                error: 'Aucun hébergeur d\'image configuré. Configurez CLOUDINARY_CLOUD_NAME et CLOUDINARY_UPLOAD_PRESET dans Cloudflare.'
            }, 500);
        }

        // Generate a clean filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
        const filename = `${timestamp}_${originalName}`;
        const filePath = `public/images/${subPath}/${filename}`;

        // Convert to base64
        let base64Content = "";
        const arrayBuffer = await file.arrayBuffer();

        // Use a more robust way to convert ArrayBuffer to base64
        // Chunk processing to avoid stack overflow with large files
        const bytes = new Uint8Array(arrayBuffer);
        const chunkSize = 8192; // Process in 8KB chunks
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            base64Content += String.fromCharCode.apply(null, Array.from(chunk));
        }
        base64Content = btoa(base64Content);

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

        // Use GitHub Raw URL to ensure image is visible immediately (even locally) and persists across rebuilds
        const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${filePath}`;

        return jsonResponse({
            success: true,
            url: rawUrl,
            filename: filename,
            provider: 'github'
        });

    } catch (err: any) {
        console.error('Upload error:', err);
        return jsonResponse({ error: err.message || 'Erreur interne lors de l\'upload' }, 500);
    }
};
