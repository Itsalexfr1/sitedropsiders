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
    Disc3,
    ChevronDown,
    ChevronUp,
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

// ─── Hook partagé : logique audio ────────────────────────────────────────────
function useRadioLogic() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const loadedTrackIdRef = useRef<string | null>(null);

    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('radio') === '1' || params.get('radio_preview') === 'true') return true;
            return localStorage.getItem('dropsiders_radio_enabled') === 'true';
        } catch { return false; }
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        fetch('/api/settings')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                if (params.get('radio') !== '1' && params.get('radio_preview') !== 'true' && typeof data.radio_enabled === 'boolean') {
                    setIsEnabled(data.radio_enabled);
                    localStorage.setItem('dropsiders_radio_enabled', data.radio_enabled ? 'true' : 'false');
                }
                if (Array.isArray(data.radio_blocks) && data.radio_blocks.length > 0) {
                    setRadioBlocks(data.radio_blocks);
                    localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(data.radio_blocks));
                }
            })
            .catch(() => {});
    }, []);

    const [uiTimeSec, setUiTimeSec] = useState<number>(getParisSeconds);
    useEffect(() => {
        const id = setInterval(() => setUiTimeSec(getParisSeconds()), 2000);
        return () => clearInterval(id);
    }, []);

    const liveInfo = useMemo(() => getCurrentLiveRadioTrack(radioBlocks, uiTimeSec), [radioBlocks, uiTimeSec]);
    const currentSet = liveInfo?.item || null;
    const uiOffset = liveInfo?.offsetSeconds ?? 0;

    const [frozenSrc, setFrozenSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_radio_volume');
            return saved !== null ? Math.max(0, Math.min(100, Number(saved))) : 80;
        } catch { return 80; }
    });

    const sendIframeCommand = useCallback((func: string, args: any = '') => {
        if (!iframeRef.current?.contentWindow) return;
        try {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
        } catch {}
    }, []);

    useEffect(() => {
        try { localStorage.setItem('dropsiders_radio_volume', String(volume)); } catch {}
        if (isMuted) { sendIframeCommand('mute'); }
        else { sendIframeCommand('unMute'); sendIframeCommand('setVolume', [volume]); }
    }, [isMuted, volume, sendIframeCommand]);

    // Transition automatique
    useEffect(() => {
        if (!isPlaying || !liveInfo?.item?.youtubeId) return;
        if (loadedTrackIdRef.current && loadedTrackIdRef.current !== liveInfo.item.youtubeId) {
            const src = buildSrc(liveInfo.item.youtubeId, liveInfo.offsetSeconds, isMuted ? 1 : 0);
            loadedTrackIdRef.current = liveInfo.item.youtubeId;
            setFrozenSrc(src);
        }
    }, [isPlaying, liveInfo?.item?.youtubeId, liveInfo?.offsetSeconds, isMuted]);

    const handlePlay = useCallback(() => {
        if (!liveInfo?.item?.youtubeId) return;
        if (!isPlaying) {
            if (!frozenSrc || loadedTrackIdRef.current !== liveInfo.item.youtubeId) {
                const src = buildSrc(liveInfo.item.youtubeId, liveInfo.offsetSeconds, isMuted ? 1 : 0);
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
    }, [sendIframeCommand]);

    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

    // Broadcast state
    const stateRef = useRef({ isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled });
    useEffect(() => { stateRef.current = { isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled }; },
        [isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled]);

    useEffect(() => {
        const broadcast = () => window.dispatchEvent(new CustomEvent('dropsiders_radio_state', { detail: stateRef.current }));
        const onToggle = () => handlePlay();
        const onPlay = () => { if (!stateRef.current.isPlaying) handlePlay(); };
        const onPause = () => { if (stateRef.current.isPlaying) handlePlay(); };
        const onStop = () => handleStop();
        const onMute = () => toggleMute();
        const onVolume = (e: any) => {
            if (typeof e.detail === 'number') { setVolume(Math.max(0, Math.min(100, e.detail))); if (isMuted) setIsMuted(false); }
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

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('dropsiders_radio_state', {
            detail: { isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled }
        }));
    }, [isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled]);

    return { isEnabled, currentSet, uiOffset, frozenSrc, isPlaying, isMuted, volume,
        setVolume, setIsMuted, iframeRef, handlePlay, handleStop, toggleMute };
}

function buildSrc(youtubeId: string, start: number, muted: number) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&start=${start}&enablejsapi=1&controls=0&mute=${muted}&playsinline=1&rel=0&fs=0&origin=${encodeURIComponent(origin)}`;
}

// ─── Barres d'animation audio ─────────────────────────────────────────────────
function AudioBars({ playing, color = 'neon-cyan' }: { playing: boolean; color?: string }) {
    return (
        <div className="flex items-end gap-[2px] h-4">
            {[{ h: '70%', d: '420ms' }, { h: '100%', d: '280ms' }, { h: '55%', d: '560ms' }, { h: '85%', d: '340ms' }].map((b, i) => (
                <span key={i}
                    className={`w-[2.5px] rounded-full transition-all ${playing ? `bg-${color} animate-pulse` : 'bg-white/25'}`}
                    style={{ height: playing ? b.h : '20%', animationDuration: b.d }}
                />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER MOBILE — Barre compacte + panneau expansible (style Spotify mobile)
// ═══════════════════════════════════════════════════════════════════════════════
function MobileRadioPlayer() {
    const { isEnabled, currentSet, uiOffset, frozenSrc, isPlaying, isMuted, volume,
        setVolume, setIsMuted, iframeRef, handlePlay, handleStop, toggleMute } = useRadioLogic();
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (!isEnabled || !currentSet || dismissed) return null;

    const progress = Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100));

    return (
        <>
            {/* Iframe audio offscreen */}
            <div style={{ position: 'fixed', left: -9999, bottom: -9999, width: 320, height: 180, opacity: 0.01, pointerEvents: 'none', zIndex: -9999 }} aria-hidden="true">
                {frozenSrc && (
                    <iframe ref={iframeRef} key={frozenSrc} src={frozenSrc}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        title="Dropsiders Radio Audio Stream"
                        style={{ width: '100%', height: '100%', border: 'none' }} />
                )}
            </div>

            {/* ── Panneau expansible (slide depuis le bas) ── */}
            <AnimatePresence>
                {expanded && (
                    <>
                        {/* Overlay sombre */}
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                            style={{ zIndex: 99990 }}
                            onClick={() => setExpanded(false)}
                        />
                        {/* Panneau */}
                        <motion.div
                            key="panel"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            style={{ zIndex: 99995, bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
                            className="fixed left-0 right-0 rounded-t-[2rem] overflow-hidden"
                        >
                            {/* Fond dégradé premium */}
                            <div className="relative bg-gradient-to-b from-[#0d0d18] to-[#050508] border-t border-white/10 px-6 pt-5 pb-8">
                                {/* Lueurs décoratives */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-neon-red/8 rounded-full blur-3xl pointer-events-none" />

                                {/* Handle bar */}
                                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                                {/* Header */}
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan">
                                            <Radio className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-display font-black text-white uppercase italic tracking-tight">
                                                DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                                            </p>
                                            <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Web Radio Electro 24/7</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-red/20 text-neon-red border border-neon-red/40 text-[7px] font-black uppercase animate-pulse">
                                            <span className="w-1 h-1 rounded-full bg-neon-red" />LIVE
                                        </span>
                                        <button onClick={() => { handleStop(); setDismissed(true); setExpanded(false); }}
                                            className="p-1.5 rounded-lg bg-white/5 text-gray-400 active:bg-white/10 active:scale-90 transition-all">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Infos du set */}
                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-5 relative z-10">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-neon-cyan mb-1 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" /> EN CE MOMENT
                                    </p>
                                    <h3 className="text-base font-black text-white uppercase italic tracking-tight truncate leading-tight">
                                        {currentSet.artist}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 font-semibold truncate mt-0.5">
                                        {currentSet.title || (currentSet as any).event}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-gray-500">
                                        <Clock className="w-3 h-3 text-neon-cyan" />
                                        <span>{currentSet.startTime}</span>
                                        <span>·</span>
                                        <span>{currentSet.durationFormatted}</span>
                                    </div>
                                </div>

                                {/* Barre de progression */}
                                <div className="mb-5 relative z-10">
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-red rounded-full transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1.5 text-[9px] font-mono text-gray-500">
                                        <span>{formatDurationExact(uiOffset)}</span>
                                        <span>{currentSet.durationFormatted}</span>
                                    </div>
                                </div>

                                {/* Bouton Play/Pause central — énorme pour le tap */}
                                <div className="flex items-center justify-center gap-6 relative z-10 mb-4">
                                    {/* Bouton mute à gauche */}
                                    <button onClick={toggleMute}
                                        className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 active:scale-90 active:bg-white/10 transition-all">
                                        {isMuted ? <VolumeX className="w-5 h-5 text-neon-red" /> : <Volume2 className="w-5 h-5" />}
                                    </button>

                                    {/* Play/Pause principal */}
                                    <button
                                        onClick={handlePlay}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                                            isPlaying
                                                ? 'bg-neon-cyan shadow-[0_0_40px_rgba(0,255,255,0.5)]'
                                                : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                                        }`}
                                    >
                                        {isPlaying
                                            ? <Pause className="w-9 h-9 text-black fill-black" />
                                            : <Play className="w-9 h-9 text-black fill-black ml-1" />
                                        }
                                    </button>

                                    {/* Barres animées à droite */}
                                    <div className="w-11 h-11 flex items-center justify-center">
                                        <AudioBars playing={isPlaying} />
                                    </div>
                                </div>

                                {/* Fermer le panneau */}
                                <button onClick={() => setExpanded(false)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[9px] text-gray-500 font-bold uppercase tracking-widest active:text-white transition-colors relative z-10">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    Réduire
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Barre compacte permanente (Spotify-style) ── */}
            <div
                style={{
                    zIndex: 99998,
                    bottom: 'calc(62px + env(safe-area-inset-bottom, 0px))',
                }}
                className="fixed left-0 right-0 lg:hidden"
            >
                {/* Barre de progression ultra-fine en haut */}
                <div className="h-[2px] bg-white/5">
                    <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-red transition-all duration-1000"
                        style={{ width: `${progress}%` }} />
                </div>

                <div
                    className="flex items-center gap-3 px-4 py-3 bg-[#0d0d18]/97 backdrop-blur-xl border-t border-white/[0.07]"
                    onClick={() => setExpanded(true)}
                >
                    {/* Icône radio animée */}
                    <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center ${isPlaying ? 'shadow-[0_0_14px_rgba(0,255,255,0.4)]' : ''}`}>
                            <Disc3 className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                    </div>

                    {/* Texte */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase italic truncate leading-tight">
                            {currentSet.artist}
                        </p>
                        <p className="text-[8.5px] text-gray-400 font-semibold truncate">
                            DROPSIDERS RADIO · 24/7
                        </p>
                    </div>

                    {/* Barres animées */}
                    <AudioBars playing={isPlaying} />

                    {/* Bouton Play/Pause — grand pour le tap */}
                    <button
                        onClick={e => { e.stopPropagation(); handlePlay(); }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 shadow-lg ${
                            isPlaying ? 'bg-neon-cyan shadow-neon-cyan/40' : 'bg-white'
                        }`}
                    >
                        {isPlaying
                            ? <Pause className="w-5 h-5 text-black fill-black" />
                            : <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                        }
                    </button>

                    {/* Chevron pour expand */}
                    <ChevronUp className="w-4 h-4 text-white/30 shrink-0 ml-1" />
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER DESKTOP — Carte flottante (inchangée)
// ═══════════════════════════════════════════════════════════════════════════════
function DesktopRadioPlayer() {
    const { isEnabled, currentSet, uiOffset, frozenSrc, isPlaying, isMuted, volume,
        setVolume, setIsMuted, iframeRef, handlePlay, handleStop, toggleMute } = useRadioLogic();
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isEnabled || !currentSet) return null;

    const progress = Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100));

    return (
        <>
            <div style={{ position: 'fixed', left: -9999, bottom: -9999, width: 320, height: 180, opacity: 0.01, pointerEvents: 'none', zIndex: -9999 }} aria-hidden="true">
                {frozenSrc && (
                    <iframe ref={iframeRef} key={frozenSrc} src={frozenSrc}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        title="Dropsiders Radio Audio Stream"
                        style={{ width: '100%', height: '100%', border: 'none' }} />
                )}
            </div>

            <aside aria-label="Lecteur Dropsiders Radio"
                className="hidden lg:block fixed bottom-4 left-4 z-[100000] w-80 select-none pointer-events-auto font-sans">
                <AnimatePresence mode="wait">
                    {isMinimized ? (
                        <motion.div key="minimized"
                            initial={{ opacity: 0, scale: 0.88, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: 15 }}
                            onClick={() => setIsMinimized(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#0a0b12]/95 backdrop-blur-2xl border border-neon-cyan/50 shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:border-neon-cyan transition-all cursor-pointer"
                        >
                            <div className="relative shrink-0">
                                <Disc3 className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-white leading-none">
                                    DROPSIDERS RADIO <span className="text-neon-cyan text-[8px] font-mono">24/7</span>
                                </span>
                                <span className="text-[8.5px] font-bold text-gray-300 truncate mt-0.5 max-w-[180px]">{currentSet.artist}</span>
                            </div>
                            {isPlaying && (
                                <div className="flex items-end gap-0.5 h-3 ml-1 shrink-0">
                                    {[{ h: '60%', d: '450ms' }, { h: '100%', d: '320ms' }, { h: '40%', d: '550ms' }].map((b, i) => (
                                        <span key={i} className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: b.h, animationDuration: b.d }} />
                                    ))}
                                </div>
                            )}
                            <button onClick={e => { e.stopPropagation(); handlePlay(); }}
                                className="w-8 h-8 rounded-full bg-neon-cyan/25 hover:bg-neon-cyan hover:text-black text-neon-cyan flex items-center justify-center transition-all cursor-pointer ml-1 shrink-0 active:scale-90">
                                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="expanded"
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="w-full bg-gradient-to-b from-[#0e0e16] via-[#090912] to-[#040409] border border-white/20 rounded-3xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(0,255,255,0.2)] flex flex-col gap-3 relative overflow-hidden backdrop-blur-2xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-red/15 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

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
                                                <span className="w-1 h-1 rounded-full bg-neon-red" />LIVE
                                            </span>
                                        </div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Web Radio Electro 24/7</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer" title="Réduire">
                                        <Minimize2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={handleStop} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 transition-all cursor-pointer" title="Arrêter">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/50 border border-white/15 rounded-2xl p-3 relative z-10 flex items-center justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[7.5px] font-black uppercase tracking-widest text-neon-cyan mb-0.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" /><span>EN CE MOMENT</span>
                                    </div>
                                    <h4 className="text-[12px] font-black text-white uppercase italic tracking-tight truncate">{currentSet.artist}</h4>
                                    <p className="text-[8.5px] font-semibold text-gray-300 truncate mt-0.5">{currentSet.title || (currentSet as any).event}</p>
                                </div>
                                <div className="shrink-0 flex flex-col items-end justify-center pl-2 border-l border-white/10">
                                    <span className="text-[7px] font-bold text-gray-400 uppercase">DURÉE</span>
                                    <span className="text-[9.5px] font-mono font-black text-white/90">{currentSet.durationFormatted}</span>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-1">
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-red rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="flex items-center justify-between text-[7.5px] font-mono text-gray-400">
                                    <span>{formatDurationExact(uiOffset)}</span>
                                    <span className="flex items-center gap-1 text-neon-cyan font-semibold"><Clock className="w-2 h-2" /> {currentSet.startTime}</span>
                                    <span>{currentSet.durationFormatted}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 relative z-10 pt-1.5 border-t border-white/10">
                                <button onClick={handlePlay}
                                    className={`px-4 py-2 rounded-xl font-black text-[10.5px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${isPlaying ? 'bg-neon-cyan text-black shadow-neon-cyan/40' : 'bg-white text-black hover:bg-neon-cyan'}`}>
                                    {isPlaying ? <><Pause className="w-3.5 h-3.5 fill-current" /><span>PAUSE</span></> : <><Play className="w-3.5 h-3.5 fill-current ml-0.5" /><span>ÉCOUTER</span></>}
                                </button>
                                <div className="flex items-center gap-2 flex-1 max-w-[130px]">
                                    <button onClick={toggleMute} className="p-1 text-gray-300 hover:text-white transition-colors cursor-pointer" title={isMuted ? 'Son' : 'Mute'}>
                                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-neon-red" /> : <Volume2 className="w-4 h-4 text-neon-cyan" />}
                                    </button>
                                    <input type="range" min="0" max="100" value={isMuted ? 0 : volume}
                                        onChange={e => { setVolume(Number(e.target.value)); if (isMuted) setIsMuted(false); }}
                                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan" />
                                </div>
                                <AudioBars playing={isPlaying} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </aside>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT — Sélectionne le bon player selon l'écran
// ═══════════════════════════════════════════════════════════════════════════════
export function DropsidersRadioPlayer() {
    const location = useLocation();
    const isTVPage = location.pathname === '/tv';
    if (isTVPage) return null;

    return (
        <>
            <MobileRadioPlayer />
            <DesktopRadioPlayer />
        </>
    );
}
