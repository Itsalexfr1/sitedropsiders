
import { jsonResponse } from '../../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    try {
        const adminPassword = request.headers.get('X-Admin-Password');
        if (adminPassword !== env.ADMIN_PASSWORD) {
            return jsonResponse({ error: 'Accès non autorisé' }, 401);
        }

        const body = await request.json();
        const { subject, htmlContent, recipients } = body;

        if (!subject || !htmlContent || !recipients || !Array.isArray(recipients)) {
            return jsonResponse({ error: 'Champs manquants' }, 400);
        }

        const BREVO_KEY = env.BREVO_API_KEY;
        if (!BREVO_KEY) {
            return jsonResponse({ error: 'Clé API Brevo manquante' }, 500);
        }

        const brevoUrl = 'https://api.brevo.com/v3/smtp/email';
        const CHUNK_SIZE = 99;
        const chunks = [];
        for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
            chunks.push(recipients.slice(i, i + CHUNK_SIZE));
        }

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
                results.push({ success: false, error: err });
            }
        }

        return jsonResponse({ success: true, details: results });

    } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
    }
};
