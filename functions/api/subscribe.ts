
import { jsonResponse, CORSH, updateGitHubFile } from '../utils';

export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: { ...CORSH } });
    }

    try {
        const body = await request.json();
        const { email, firstName, lastName } = body;

        if (!email) {
            return jsonResponse({ error: 'Email requis' }, 400);
        }

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return jsonResponse({ error: 'Format d\'email invalide' }, 400);
        }

        const PATH = 'src/data/subscribers.json';
        const newSubscriber = {
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            subscribedAt: new Date().toISOString()
        };

        await updateGitHubFile(env, PATH, (currentSubscribers: any[]) => {
            if (!Array.isArray(currentSubscribers)) {
                currentSubscribers = [];
            }

            // Check for duplicates
            if (currentSubscribers.some((sub: any) => sub.email === email)) {
                throw new Error('DUPLICATE_EMAIL');
            }

            currentSubscribers.push(newSubscriber);
            return currentSubscribers;
        }, `Nouvel abonné : ${email}`);

        return jsonResponse({ success: true, subscriber: newSubscriber });

    } catch (err: any) {
        if (err.message && err.message.includes('DUPLICATE_EMAIL')) {
            return jsonResponse({ error: 'Cet email est déjà inscrit' }, 409);
        }
        console.error('Subscribe Error:', err);
        return jsonResponse({ error: err.message || 'Erreur interne lors de l\'inscription' }, 500);
    }
};
