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
            <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-6 relative">
                {/* Background Ambient Glows */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/5 animate-pulse [animation-delay:2s] transition-all duration-1000" />
                </div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <EqualizerLoader count={8} />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] animate-pulse">Syncing with satellite...</p>
                </div>
            </div>
        );
    }

    const status = takeover?.status || (takeover?.enabled ? 'live' : 'off');

    // Case: Off
    if (status === 'off' || !takeover || (!takeover.enabled && !isAdmin)) {
        return (
            <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative">
                {/* Background Ambient Glows */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/5 animate-pulse [animation-delay:2s] transition-all duration-1000" />
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-4">
                        Live <span className="text-neon-red drop-shadow-[0_0_20px_rgba(255,0,51,0.5)]">Indisponible</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm max-w-md mx-auto">
                        Le live n'est pas actif pour le moment. Revenez plus tard !
                    </p>
                    <a href="/" className="mt-12 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        );
    }

    // Case: Edit mode (Preparation)
    if (status === 'edit' && !isAdmin) {
        return (
            <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative">
                {/* Background Ambient Glows */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/5 animate-pulse [animation-delay:2s] transition-all duration-1000" />
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-4 text-center">
                        Live en <span className="text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">Préparation</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm text-center max-w-md">
                        Nous préparons actuellement la diffusion. <br /><span className="text-white/50">Le live débutera très bientôt, restez connectés !</span>
                    </p>
                    <div className="mt-12 flex flex-col items-center gap-6">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] italic">Dropsiders Live Module</p>
                        <a href="/" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                            Retour à l'accueil
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return <TakeoverPage initialSettings={takeover} />;
}
