
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

        // ─────────────────────────────────────────────
        // CLOUDINARY UPLOAD (méthode principale)
        // ─────────────────────────────────────────────
        const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;
        const CLOUDINARY_UPLOAD_PRESET = env.CLOUDINARY_UPLOAD_PRESET;

        if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
            const cloudinaryFormData = new FormData();
            cloudinaryFormData.append('file', file);
            cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            // Organise les images dans des dossiers par section
            cloudinaryFormData.append('folder', `dropsiders/${subPath}`);
            // Tag pour identifier la source
            cloudinaryFormData.append('tags', `dropsiders,${subPath}`);

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

            const uploadRes = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: cloudinaryFormData,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.text();
                console.error('Cloudinary error:', err);
                // Si Cloudinary échoue, tombe sur GitHub
            } else {
                const cloudData = await uploadRes.json() as any;
                return jsonResponse({
                    success: true,
                    url: cloudData.secure_url,
                    filename: cloudData.public_id,
                    provider: 'cloudinary'
                });
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

        const publicUrl = `/images/${subPath}/${filename}`;

        return jsonResponse({
            success: true,
            url: publicUrl,
            filename: filename,
            provider: 'github'
        });

    } catch (err: any) {
        console.error('Upload error:', err);
        return jsonResponse({ error: err.message || 'Erreur interne lors de l\'upload' }, 500);
    }
};
