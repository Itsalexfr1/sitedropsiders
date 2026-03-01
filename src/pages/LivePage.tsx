import { useState, useEffect } from 'react';
import { TakeoverPage } from './TakeoverPage';
import { apiFetch } from '../utils/auth';
import { EqualizerLoader } from '../components/ui/EqualizerLoader';

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

    const isAdmin = localStorage.getItem('admin_auth') === 'true';

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <EqualizerLoader count={8} />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] animate-pulse">Syncing with satellite...</p>
            </div>
        );
    }

    const status = takeover?.status || (takeover?.enabled ? 'live' : 'off');

    // Case: Off
    if (status === 'off' || !takeover || (!takeover.enabled && !isAdmin)) {
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

    // Case: Edit mode (Preparation)
    if (status === 'edit' && !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 border border-orange-500/20">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 text-center">
                    Live en <span className="text-orange-500">Préparation</span>
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-center max-w-md">
                    Nous préparons actuellement la diffusion. <br />Le live débutera très bientôt, restez connectés !
                </p>
                <div className="mt-12 flex flex-col items-center gap-4">
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Dropsiders Live Module</p>
                    <a href="/" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white uppercase hover:bg-white/10 transition-all">
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        );
    }

    return <TakeoverPage settings={takeover} />;
}
