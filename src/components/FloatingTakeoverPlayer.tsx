import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingTakeoverPlayer() {
    const location = useLocation();
    const [takeover, setTakeover] = useState<any>(null);
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/takeover');
                if (res.ok) {
                    const data = await res.json();
                    setTakeover(data);
                }
            } catch (err: any) {
                console.error(err);
            }
        };
        fetchSettings();
    }, []);

    const isLivePage = location.pathname === '/live';
    const showFloating = takeover?.enabled && !isLivePage && !isClosed && (takeover?.youtubeId || takeover?.channels);

    if (!showFloating) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                className="fixed bottom-6 right-6 z-[100] w-[300px] sm:w-[380px] aspect-video bg-black rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 hover:border-neon-red/50 overflow-hidden group transition-all duration-500"
            >
                {/* Glossy Overlay Grid */}
                <div className="absolute inset-0 bg-gradient-to-t from-neon-red/10 to-transparent pointer-events-none z-[5]" />

                {/* Controls Overlay */}
                <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded-full">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
                        </div>
                        <span className="text-[10px] text-white font-black uppercase tracking-widest truncate max-w-[120px]">
                            {takeover.title}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Link
                            to="/live"
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white group/btn"
                            title="Retour au Live"
                        >
                            <ExternalLink className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                        </Link>
                        <button
                            onClick={() => setIsClosed(true)}
                            className="p-2 bg-white/5 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red/30 rounded-lg transition-all text-gray-300 hover:text-white group/close"
                            title="Fermer le lecteur"
                        >
                            <X className="w-3.5 h-3.5 group-hover/close:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Player container with subtle glow */}
                <div className="w-full h-full relative">
                    {(() => {
                        let videoId = takeover.youtubeId;
                        if (!videoId && takeover.channels) {
                            const firstChannel = takeover.channels.split('\n')[0];
                            videoId = firstChannel?.split(':')[0]?.trim();
                        }

                        const extractYoutubeId = (url: string) => {
                            if (!url) return '';
                            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([\w-]{11})/);
                            return match ? match[1] : url.trim();
                        };

                        return (
                            <iframe
                                className="w-full h-full pointer-events-auto"
                                src={`https://www.youtube.com/embed/${extractYoutubeId(videoId)}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`}
                                title="Live Takeover"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                referrerPolicy="no-referrer"
                            ></iframe>
                        );
                    })()}
                    <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-2xl z-20" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
