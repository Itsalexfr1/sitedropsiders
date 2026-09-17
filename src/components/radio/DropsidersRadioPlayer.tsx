import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Minimize2,
    X,
    Clock,
    Sparkles,
    Disc3
} from 'lucide-react';
import {
    DEFAULT_RADIO_BLOCKS,
    STORAGE_RADIO_BLOCKS_KEY,
    getParisSeconds,
    formatDurationExact,
    getCurrentLiveRadioTrack,
    type RadioScheduleBlock
} from '../../utils/radioSchedule';
import { useLocation } from 'react-router-dom';

export function DropsidersRadioPlayer() {
    const location = useLocation();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const loadedTrackIdRef = useRef<string | null>(null);

    // ─── Activation (visible dès que la radio est activée côté serveur) ─────────
    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('radio') === '1' || params.get('radio_preview') === 'true') return true;
            return localStorage.getItem('dropsiders_radio_enabled') === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const handle = () => setIsEnabled(localStorage.getItem('dropsiders_radio_enabled') === 'true');
        window.addEventListener('dropsiders_radio_toggle', handle);
        window.addEventListener('storage', handle);
        return () => {
            window.removeEventListener('dropsiders_radio_toggle', handle);
            window.removeEventListener('storage', handle);
        };
    }, []);

    // ─── Blocs d'émissions radio ───────────────────────────────────────────────
    const [radioBlocks, setRadioBlocks] = useState<RadioScheduleBlock[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_RADIO_BLOCKS;
    });

    useEffect(() => {
        const handle = () => {
            try {
                const saved = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) setRadioBlocks(parsed);
                }
            } catch {}
        };
        window.addEventListener('dropsiders_radio_blocks_updated', handle);
        window.addEventListener('storage', handle);
        return () => {
            window.removeEventListener('dropsiders_radio_blocks_updated', handle);
            window.removeEventListener('storage', handle);
        };
    }, []);

    // Vérifie aussi côté serveur au montage
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        fetch('/api/settings')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    if (params.get('radio') !== '1' && params.get('radio_preview') !== 'true' && typeof data.radio_enabled === 'boolean') {
                        setIsEnabled(data.radio_enabled);
                        localStorage.setItem('dropsiders_radio_enabled', data.radio_enabled ? 'true' : 'false');
                    }
                    if (Array.isArray(data.radio_blocks) && data.radio_blocks.length > 0) {
                        setRadioBlocks(data.radio_blocks);
                        localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(data.radio_blocks));
                    }
                }
            })
            .catch(() => {});
    }, []);

    // ─── Horloge synchronisée Paris ─────────────────────────────────────────────
    const [uiTimeSec, setUiTimeSec] = useState<number>(getParisSeconds);
    useEffect(() => {
        const id = setInterval(() => setUiTimeSec(getParisSeconds()), 2000);
        return () => clearInterval(id);
    }, []);

    // ─── Morceau live calculé 100% déterministe ──────────────────────────────────
    const liveInfo = useMemo(() => {
        return getCurrentLiveRadioTrack(radioBlocks, uiTimeSec);
    }, [radioBlocks, uiTimeSec]);

    const currentSet = liveInfo?.item || null;
    const uiOffset = liveInfo?.offsetSeconds ?? 0;

    // ─── État de lecture ─────────────────────────────────────────────────────────
    const [frozenSrc, setFrozenSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_radio_volume');
            return saved !== null ? Math.max(0, Math.min(100, Number(saved))) : 80;
        } catch {
            return 80;
        }
    });
    const [isMinimized, setIsMinimized] = useState(false);

    // ─── Détection mobile ────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ─── Commandes postMessage vers YouTube ──────────────────────────────────────
    const sendIframeCommand = useCallback((func: string, args: any = '') => {
        if (!iframeRef.current?.contentWindow) return;
        try {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func, args }),
                '*'
            );
        } catch {}
    }, []);

    // Gestion du volume et mute via postMessage
    useEffect(() => {
        try {
            localStorage.setItem('dropsiders_radio_volume', String(volume));
        } catch {}

        if (isMuted) {
            sendIframeCommand('mute');
        } else {
            sendIframeCommand('unMute');
            sendIframeCommand('setVolume', [volume]);
        }
    }, [isMuted, volume, sendIframeCommand]);

    const handleIframeLoad = useCallback(() => {
        // Sur mobile YouTube requiert une interaction utilisateur — on ne force pas l'autoplay
        if (!isMuted) {
            sendIframeCommand('unMute');
            sendIframeCommand('setVolume', [volume]);
        } else {
            sendIframeCommand('mute');
        }
    }, [isMuted, volume, sendIframeCommand]);

    // Transition automatique lorsque le set se termine
    useEffect(() => {
        if (!isPlaying || !liveInfo?.item?.youtubeId) return;
        if (loadedTrackIdRef.current && loadedTrackIdRef.current !== liveInfo.item.youtubeId) {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const src = `https://www.youtube-nocookie.com/embed/${liveInfo.item.youtubeId}?autoplay=1&start=${liveInfo.offsetSeconds}&enablejsapi=1&controls=0&mute=0&playsinline=1&rel=0&origin=${encodeURIComponent(origin)}`;
            loadedTrackIdRef.current = liveInfo.item.youtubeId;
            setFrozenSrc(src);
        }
    }, [isPlaying, liveInfo?.item?.youtubeId, liveInfo?.offsetSeconds]);

    const handlePlay = useCallback(() => {
        if (!liveInfo?.item?.youtubeId) return;

        if (!isPlaying) {
            if (!frozenSrc || loadedTrackIdRef.current !== liveInfo.item.youtubeId) {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                // playsinline=1 est CRUCIAL pour iOS (sinon lecture plein écran forcée)
                // mute=0 car l'user a tapé sur Play (geste utilisateur = autoplay autorisé)
                const src = `https://www.youtube-nocookie.com/embed/${liveInfo.item.youtubeId}?autoplay=1&start=${liveInfo.offsetSeconds}&enablejsapi=1&controls=0&mute=${isMuted ? 1 : 0}&playsinline=1&rel=0&fs=0&origin=${encodeURIComponent(origin)}`;
                loadedTrackIdRef.current = liveInfo.item.youtubeId;
                setFrozenSrc(src);
            } else {
                sendIframeCommand('playVideo');
            }
            setIsPlaying(true);
        } else {
            sendIframeCommand('pauseVideo');
            setIsPlaying(false);
        }
    }, [liveInfo, isPlaying, frozenSrc, isMuted, sendIframeCommand]);

    const handleStop = useCallback(() => {
        sendIframeCommand('pauseVideo');
        setIsPlaying(false);
        setFrozenSrc(null);
        loadedTrackIdRef.current = null;
        setIsMinimized(true);
    }, [sendIframeCommand]);

    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

    // ─── Synchronisation avec DropsidersRadioCard et événements globaux ──────────
    const stateRef = useRef({ isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled });
    useEffect(() => {
        stateRef.current = { isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled };
    }, [isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled]);

    useEffect(() => {
        const broadcast = () => {
            window.dispatchEvent(new CustomEvent('dropsiders_radio_state', {
                detail: stateRef.current
            }));
        };

        const onToggle = () => handlePlay();
        const onPlay = () => { if (!stateRef.current.isPlaying) handlePlay(); };
        const onPause = () => { if (stateRef.current.isPlaying) handlePlay(); };
        const onStop = () => handleStop();
        const onMute = () => toggleMute();
        const onVolume = (e: any) => {
            if (typeof e.detail === 'number') {
                const v = Math.max(0, Math.min(100, e.detail));
                setVolume(v);
                if (isMuted) setIsMuted(false);
            }
        };

        window.addEventListener('dropsiders_radio_cmd_toggle', onToggle);
        window.addEventListener('dropsiders_radio_cmd_play', onPlay);
        window.addEventListener('dropsiders_radio_cmd_pause', onPause);
        window.addEventListener('dropsiders_radio_cmd_stop', onStop);
        window.addEventListener('dropsiders_radio_cmd_mute', onMute);
        window.addEventListener('dropsiders_radio_cmd_volume', onVolume);
        window.addEventListener('dropsiders_radio_query_state', broadcast);

        broadcast();

        return () => {
            window.removeEventListener('dropsiders_radio_cmd_toggle', onToggle);
            window.removeEventListener('dropsiders_radio_cmd_play', onPlay);
            window.removeEventListener('dropsiders_radio_cmd_pause', onPause);
            window.removeEventListener('dropsiders_radio_cmd_stop', onStop);
            window.removeEventListener('dropsiders_radio_cmd_mute', onMute);
            window.removeEventListener('dropsiders_radio_cmd_volume', onVolume);
            window.removeEventListener('dropsiders_radio_query_state', broadcast);
        };
    }, [handlePlay, handleStop, toggleMute, isMuted, liveInfo]);

    // Broadcast à chaque changement d'état
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('dropsiders_radio_state', {
            detail: { isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled }
        }));
    }, [isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled]);

    // ─── Guard pages ────────────────────────────────────────────────────────────
    const isTVPage = location.pathname === '/tv';
    if (!isEnabled || isTVPage || !currentSet) return null;

    return (
        <>
            {/* Iframe audio offscreen - dimensions réelles pour empêcher le throttling */}
            <div
                style={{
                    position: 'fixed',
                    left: -9999,
                    bottom: -9999,
                    width: 320,
                    height: 180,
                    opacity: 0.01,
                    pointerEvents: 'none',
                    zIndex: -9999
                }}
                aria-hidden="true"
            >
                {frozenSrc && (
                    <iframe
                        ref={iframeRef}
                        key={frozenSrc}
                        src={frozenSrc}
                        onLoad={handleIframeLoad}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        title="Dropsiders Radio Audio Stream"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                )}
            </div>

            {/* ── Lecteur flottant ── au-dessus de la navbar mobile (z-[100]) ─── */}
            <aside
                aria-label="Lecteur Dropsiders Radio"
                style={{
                    zIndex: 100000,
                    bottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : '1rem',
                    left: isMobile ? '0.5rem' : '1rem',
                    right: isMobile ? '0.5rem' : 'auto',
                }}
                className="fixed pointer-events-auto font-sans select-none"
            >
                <AnimatePresence mode="wait">
                    {isMinimized ? (
                        // ── Mini pill flottante ──────────────────────────────────────────────
                        <motion.div
                            key="minimized-radio"
                            initial={{ opacity: 0, scale: 0.88, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: 15 }}
                            onClick={() => setIsMinimized(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#0a0b12]/95 backdrop-blur-2xl border border-neon-cyan/50 shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:border-neon-cyan transition-all cursor-pointer group"
                        >
                            <div className="relative flex items-center justify-center shrink-0">
                                <Disc3
                                    className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`}
                                    style={{ animationDuration: '3s' }}
                                />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 leading-none">
                                    <span>DROPSIDERS RADIO</span>
                                    <span className="text-neon-cyan text-[8px] font-mono font-bold">24/7</span>
                                </span>
                                <span className="text-[8.5px] font-bold text-gray-300 truncate mt-0.5 max-w-[140px] sm:max-w-[180px]">
                                    {currentSet.artist}
                                </span>
                            </div>
                            {isPlaying && (
                                <div className="flex items-end gap-0.5 h-3 ml-1 shrink-0">
                                    <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '60%', animationDuration: '450ms' }} />
                                    <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '100%', animationDuration: '320ms' }} />
                                    <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '40%', animationDuration: '550ms' }} />
                                </div>
                            )}
                            <button
                                onClick={e => { e.stopPropagation(); handlePlay(); }}
                                className="w-8 h-8 rounded-full bg-neon-cyan/25 hover:bg-neon-cyan hover:text-black text-neon-cyan flex items-center justify-center transition-all cursor-pointer ml-1 shrink-0 active:scale-90"
                                title={isPlaying ? 'Mettre en pause' : 'Écouter la radio'}
                            >
                                {isPlaying
                                    ? <Pause className="w-3.5 h-3.5 fill-current" />
                                    : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                }
                            </button>
                        </motion.div>
                    ) : (
                        // ── Lecteur complet développé ──────────────────────────────────────────
                        <motion.div
                            key="expanded-radio"
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className={`bg-gradient-to-b from-[#0e0e16] via-[#090912] to-[#040409] border border-white/20 rounded-3xl p-3.5 shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(0,255,255,0.2)] flex flex-col gap-3 relative overflow-hidden backdrop-blur-2xl ${
                                isMobile ? 'w-full' : 'w-80'
                            }`}
                        >
                            {/* Lueurs */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-red/15 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

                            {/* Barre supérieure */}
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.35)]">
                                        <Radio className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-display font-black text-white uppercase italic tracking-tight">
                                                DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neon-red/25 text-neon-red border border-neon-red/50 text-[7.5px] font-black uppercase animate-pulse">
                                                <span className="w-1 h-1 rounded-full bg-neon-red" />
                                                LIVE
                                            </span>
                                        </div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                            Web Radio Electro 24/7
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsMinimized(true)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer active:scale-90"
                                        title="Réduire le lecteur"
                                    >
                                        <Minimize2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={handleStop}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 transition-all cursor-pointer active:scale-90"
                                        title="Arrêter et fermer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Informations sur le set en direct */}
                            <div className="bg-black/50 border border-white/15 rounded-2xl p-3 relative z-10 flex items-center justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[7.5px] font-black uppercase tracking-widest text-neon-cyan mb-0.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        <span>EN CE MOMENT</span>
                                    </div>
                                    <h4 className="text-[12px] font-black text-white uppercase italic tracking-tight truncate">
                                        {currentSet.artist}
                                    </h4>
                                    <p className="text-[8.5px] font-semibold text-gray-300 truncate mt-0.5">
                                        {currentSet.title || (currentSet as any).event}
                                    </p>
                                </div>
                                <div className="shrink-0 flex flex-col items-end justify-center pl-2 border-l border-white/10">
                                    <span className="text-[7px] font-bold text-gray-400 uppercase">DURÉE</span>
                                    <span className="text-[9.5px] font-mono font-black text-white/90">
                                        {currentSet.durationFormatted}
                                    </span>
                                </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="relative z-10 space-y-1">
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-red rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100))}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[7.5px] font-mono text-gray-400">
                                    <span>{formatDurationExact(uiOffset)}</span>
                                    <span className="flex items-center gap-1 text-neon-cyan font-semibold">
                                        <Clock className="w-2 h-2" /> {currentSet.startTime}
                                    </span>
                                    <span>{currentSet.durationFormatted}</span>
                                </div>
                            </div>

                            {/* Commandes de lecture et volume */}
                            <div className="flex items-center justify-between gap-3 relative z-10 pt-1.5 border-t border-white/10">
                                {/* Bouton Play/Pause — GRAND pour le tap mobile */}
                                <button
                                    onClick={handlePlay}
                                    className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                                        isPlaying
                                            ? 'bg-neon-cyan text-black shadow-neon-cyan/40'
                                            : 'bg-white text-black hover:bg-neon-cyan'
                                    }`}
                                >
                                    {isPlaying
                                        ? <><Pause className="w-4 h-4 fill-current" /><span>PAUSE</span></>
                                        : <><Play className="w-4 h-4 fill-current ml-0.5" /><span>ÉCOUTER</span></>
                                    }
                                </button>

                                {/* Volume (caché sur mobile pour gagner de la place) */}
                                <div className={`flex items-center gap-2 flex-1 ${isMobile ? 'max-w-[90px]' : 'max-w-[130px]'}`}>
                                    <button
                                        onClick={toggleMute}
                                        className="p-1.5 text-gray-300 hover:text-white transition-colors cursor-pointer active:scale-90"
                                        title={isMuted ? 'Activer le son' : 'Couper le son'}
                                    >
                                        {isMuted || volume === 0
                                            ? <VolumeX className="w-4 h-4 text-neon-red" />
                                            : <Volume2 className="w-4 h-4 text-neon-cyan" />
                                        }
                                    </button>
                                    {!isMobile && (
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={isMuted ? 0 : volume}
                                            onChange={e => {
                                                const v = Number(e.target.value);
                                                setVolume(v);
                                                if (isMuted) setIsMuted(false);
                                            }}
                                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                            title={`Volume : ${volume}%`}
                                        />
                                    )}
                                </div>

                                {/* Barres d'animation */}
                                <div className="flex items-end gap-0.5 h-4 w-6 justify-end shrink-0">
                                    <span className={`w-0.5 rounded-full ${isPlaying ? 'bg-neon-cyan animate-pulse' : 'bg-white/20'}`} style={{ height: isPlaying ? '70%' : '20%', animationDuration: '400ms' }} />
                                    <span className={`w-0.5 rounded-full ${isPlaying ? 'bg-neon-purple animate-pulse' : 'bg-white/20'}`} style={{ height: isPlaying ? '100%' : '20%', animationDuration: '280ms' }} />
                                    <span className={`w-0.5 rounded-full ${isPlaying ? 'bg-neon-red animate-pulse' : 'bg-white/20'}`} style={{ height: isPlaying ? '50%' : '20%', animationDuration: '520ms' }} />
                                </div>
                            </div>

                            {/* Astuce tap sur mobile */}
                            {isMobile && !isPlaying && (
                                <p className="text-[7.5px] text-center text-gray-500 font-bold uppercase tracking-widest -mt-1 relative z-10">
                                    Appuie sur ÉCOUTER pour démarrer
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </aside>
        </>
    );
}
