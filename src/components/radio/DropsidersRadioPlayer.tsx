import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Radio, 
    Play, 
    Pause, 
    Volume2, 
    VolumeX, 
    Minimize2, 
    Maximize2, 
    X, 
    Clock, 
    Sparkles,
    Disc3
} from 'lucide-react';
import { 
    computeDaySchedule, 
    DEFAULT_TV_BLOCKS, 
    formatDurationExact,
    type ComputedScheduleItem 
} from '../../utils/tvSchedule';
import { useLocation } from 'react-router-dom';

export function DropsidersRadioPlayer() {
    const location = useLocation();
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Vérifie si la radio est activée dans le dashboard admin ou en aperçu d'URL
    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('radio') === '1' || params.get('radio_preview') === 'true') {
                return true;
            }
            return localStorage.getItem('dropsiders_radio_enabled') === 'true';
        } catch {
            return false;
        }
    });

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(80);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [currentTimeSec, setCurrentTimeSec] = useState<number>(() => {
        const now = new Date();
        return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    });

    // Écoute les changements d'état depuis le tableau de bord (sans rechargement)
    useEffect(() => {
        const handleToggle = () => {
            const enabled = localStorage.getItem('dropsiders_radio_enabled') === 'true';
            setIsEnabled(enabled);
        };
        window.addEventListener('dropsiders_radio_toggle', handleToggle);
        window.addEventListener('storage', handleToggle);
        return () => {
            window.removeEventListener('dropsiders_radio_toggle', handleToggle);
            window.removeEventListener('storage', handleToggle);
        };
    }, []);

    // Horloge temps réel (actualisation toutes les 5 secondes)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            let parisDate = now;
            try {
                const pStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false });
                parisDate = new Date(pStr);
            } catch {}
            setCurrentTimeSec(parisDate.getHours() * 3600 + parisDate.getMinutes() * 60 + parisDate.getSeconds());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Calcul du programme du jour
    const scheduleItems = useMemo(() => {
        try {
            return computeDaySchedule(DEFAULT_TV_BLOCKS);
        } catch {
            return [];
        }
    }, []);

    // Détermination du set en cours de diffusion
    const currentSet = useMemo<ComputedScheduleItem | null>(() => {
        if (!scheduleItems || scheduleItems.length === 0) return null;
        const live = scheduleItems.find(item => item.isCurrentlyLive);
        if (live) return live;
        // Fallback sur le set le plus proche
        const next = scheduleItems.find(item => (item.startSecondsFromMidnight + item.durationSeconds) >= currentTimeSec);
        return next || scheduleItems[0];
    }, [scheduleItems, currentTimeSec]);

    // Calcul de l'offset dans le set actuel (à quelle seconde on est)
    const currentOffsetInSeconds = useMemo(() => {
        if (!currentSet) return 0;
        let diff = currentTimeSec - currentSet.startSecondsFromMidnight;
        if (diff < 0) diff += 86400;
        return Math.max(0, Math.min(diff, currentSet.durationSeconds || 3600));
    }, [currentSet, currentTimeSec]);

    // Ne pas afficher le lecteur Radio sur la page TV pour éviter un conflit audio avec le lecteur vidéo principal
    const isTVPage = location.pathname === '/tv';

    if (!isEnabled || isTVPage || !currentSet) {
        return null;
    }

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
    };

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    return (
        <aside 
            aria-label="Lecteur Dropsiders Radio"
            className="fixed bottom-4 left-4 z-[90] max-w-[calc(100vw-2rem)] select-none pointer-events-auto font-sans"
        >
            {/* Lecteur audio masqué en tâche de fond (YouTube audio sync) */}
            <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
                {isPlaying && currentSet.youtubeId && (
                    <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${currentSet.youtubeId}?autoplay=1&start=${Math.floor(currentOffsetInSeconds)}&enablejsapi=1&controls=0&mute=${isMuted ? 1 : 0}`}
                        allow="autoplay"
                        title="Dropsiders Radio Audio Stream"
                        className="w-1 h-1"
                    />
                )}
            </div>

            <AnimatePresence mode="wait">
                {isMinimized ? (
                    /* Mini Pill Réduite */
                    <motion.div
                        key="minimized-radio"
                        initial={{ opacity: 0, scale: 0.85, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 15 }}
                        onClick={() => setIsMinimized(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/90 backdrop-blur-2xl border border-neon-cyan/40 shadow-[0_0_25px_rgba(0,255,255,0.25)] hover:border-neon-cyan transition-all cursor-pointer group"
                    >
                        <div className="relative flex items-center justify-center">
                            <Disc3 className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 leading-none">
                                <span>RADIO</span>
                                <span className="text-neon-cyan text-[7.5px] font-mono">24/7</span>
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 max-w-[110px] truncate mt-0.5">
                                {currentSet.artist}
                            </span>
                        </div>

                        {/* Equalizer animation */}
                        {isPlaying && (
                            <div className="flex items-end gap-0.5 h-3 ml-1">
                                <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '60%', animationDuration: '450ms' }} />
                                <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '100%', animationDuration: '320ms' }} />
                                <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '40%', animationDuration: '550ms' }} />
                            </div>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            className="w-6 h-6 rounded-full bg-neon-cyan/20 hover:bg-neon-cyan hover:text-black text-neon-cyan flex items-center justify-center transition-all cursor-pointer ml-1"
                        >
                            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                        </button>
                    </motion.div>
                ) : (
                    /* Lecteur Développé */
                    <motion.div
                        key="expanded-radio"
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        className="w-72 sm:w-80 bg-gradient-to-b from-[#0e0e14] via-[#09090e] to-[#050508] border border-white/15 rounded-3xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(0,255,255,0.15)] flex flex-col gap-3 relative overflow-hidden backdrop-blur-2xl"
                    >
                        {/* Lueur d'ambiance */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/15 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-red/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

                        {/* Top Bar du Player */}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.3)]">
                                    <Radio className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10.5px] font-display font-black text-white uppercase italic tracking-tight">
                                            DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-neon-red/20 text-neon-red border border-neon-red/40 text-[7px] font-black uppercase animate-pulse">
                                            <span className="w-1 h-1 rounded-full bg-neon-red" />
                                            LIVE
                                        </span>
                                    </div>
                                    <p className="text-[7.5px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        Web Radio Électro 24/7
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                                    title="Réduire le lecteur"
                                >
                                    <Minimize2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsPlaying(false);
                                        setIsMinimized(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                                    title="Mettre en pause & réduire"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Informations sur le Set en cours */}
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-2.5 relative z-10 flex items-center justify-between gap-2.5">
                            <div className="min-w-0 flex-1">
                                <div className="text-[7.5px] font-black uppercase tracking-widest text-neon-cyan mb-0.5 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>EN CE MOMENT</span>
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase italic tracking-tight truncate">
                                    {currentSet.artist}
                                </h4>
                                <p className="text-[8px] font-semibold text-gray-400 truncate mt-0.5">
                                    {currentSet.event}
                                </p>
                            </div>

                            {/* Badge Durée */}
                            <div className="shrink-0 flex flex-col items-end justify-center">
                                <span className="text-[7px] font-bold text-gray-500 uppercase">DURÉE</span>
                                <span className="text-[9px] font-mono font-black text-white/90">
                                    {currentSet.durationFormatted}
                                </span>
                            </div>
                        </div>

                        {/* Barre de progression du Set */}
                        <div className="relative z-10 space-y-1">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                                <div 
                                    className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-red rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, (currentOffsetInSeconds / (currentSet.durationSeconds || 3600)) * 100))}%`
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[7px] font-mono text-gray-400">
                                <span>{formatDurationExact(currentOffsetInSeconds)}</span>
                                <span className="flex items-center gap-1 text-neon-cyan font-semibold">
                                    <Clock className="w-2 h-2" /> {currentSet.startTime}
                                </span>
                                <span>{currentSet.durationFormatted}</span>
                            </div>
                        </div>

                        {/* Contrôles de Lecture & Volume */}
                        <div className="flex items-center justify-between gap-3 relative z-10 pt-1 border-t border-white/10">
                            {/* Bouton Play/Pause Principal */}
                            <button
                                onClick={togglePlay}
                                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                                    isPlaying 
                                        ? 'bg-neon-cyan text-black shadow-neon-cyan/30' 
                                        : 'bg-white text-black hover:bg-neon-cyan'
                                }`}
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="w-3.5 h-3.5 fill-current" />
                                        <span>PAUSE</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                        <span>ÉCOUTER</span>
                                    </>
                                )}
                            </button>

                            {/* Contrôle de Volume */}
                            <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
                                <button
                                    onClick={toggleMute}
                                    className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title={isMuted ? "Réactiver le son" : "Couper le son"}
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="w-3.5 h-3.5 text-neon-red" />
                                    ) : (
                                        <Volume2 className="w-3.5 h-3.5 text-neon-cyan" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                        setVolume(Number(e.target.value));
                                        if (isMuted) setIsMuted(false);
                                    }}
                                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                />
                            </div>

                            {/* Spectre Audio Animé */}
                            <div className="flex items-end gap-0.5 h-4 w-6 justify-end">
                                <span className={`w-0.5 rounded-full ${isPlaying ? 'bg-neon-cyan animate-pulse' : 'bg-white/20'}`} style={{ height: isPlaying ? '70%' : '20%', animationDuration: '400ms' }} />
                                <span className={`w-0.5 rounded-full ${isPlaying ? 'bg-neon-purple animate-pulse' : 'bg-white/20'}`} style={{ height: isPlaying ? '100%' : '20%', animationDuration: '280ms' }} />
                                <span className={`w-0.5 rounded-full ${isPlaying ? 'bg-neon-red animate-pulse' : 'bg-white/20'}`} style={{ height: isPlaying ? '50%' : '20%', animationDuration: '520ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}
