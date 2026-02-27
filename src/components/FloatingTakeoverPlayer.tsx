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
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, []);

    const isHome = location.pathname === '/';
    const showFloating = takeover?.active && !isHome && !isClosed && takeover?.youtubeId;

    if (!showFloating) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                className="fixed bottom-6 right-6 z-[100] w-[300px] sm:w-[350px] aspect-video bg-black rounded-xl shadow-2xl border border-neon-red/30 overflow-hidden group"
            >
                {/* Controls Overlay */}
                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-between px-3">
                    <span className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-neon-red rounded-full animate-pulse shadow-[0_0_10px_rgba(255,18,65,0.8)]" />
                        LIVE
                    </span>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white"
                            title="Retour au Live"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={() => setIsClosed(true)}
                            className="p-1.5 hover:bg-neon-red/20 rounded-md transition-colors text-gray-300 hover:text-white"
                            title="Fermer le lecteur"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* PiP uses mute=1 & controls=1 by default to ensure autoplay on navigation */}
                <iframe
                    className="w-full h-full pointer-events-auto"
                    src={`https://www.youtube.com/embed/${takeover.youtubeId}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`}
                    title="Live Takeover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </motion.div>
        </AnimatePresence>
    );
}
