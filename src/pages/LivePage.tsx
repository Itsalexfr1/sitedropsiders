import { useState, useEffect } from 'react';
import { TakeoverPage } from './TakeoverPage';
import { apiFetch } from '../utils/auth';

export function LivePage() {
    const [takeover, setTakeover] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTakeover = async () => {
            try {
                const resp = await apiFetch('/api/settings');
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && data.takeover) {
                        setTakeover(data.takeover);
                    }
                }
            } catch (e: any) {
                console.error("Failed to fetch live settings", e);
            } finally {
                setLoading(false);
            }
        };

        fetchTakeover();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-red"></div>
            </div>
        );
    }

    if (!takeover || !takeover.enabled) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">
                    Live <span className="text-neon-red">Indisponible</span>
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-center">
                    Le live n'est pas actif pour le moment. Revenez plus tard !
                </p>
                <a href="/" className="mt-8 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white uppercase hover:bg-white/10 transition-all">
                    Retour à l'accueil
                </a>
            </div>
        );
    }

    return <TakeoverPage settings={takeover} />;
}
