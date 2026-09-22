import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio, Play, Pause, Volume2, VolumeX, Minimize2, X,
    Clock, Sparkles, Disc3, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
    DEFAULT_RADIO_BLOCKS, STORAGE_RADIO_BLOCKS_KEY,
    getParisSeconds, formatDurationExact, getCurrentLiveRadioTrack,
    type RadioScheduleBlock
} from '../../utils/radioSchedule';
import { useLocation } from 'react-router-dom';

// ─── URL YouTube embed ────────────────────────────────────────────────────────
function buildSrc(youtubeId: string, start: number, muted: 0 | 1) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`
        + `?autoplay=1&start=${Math.floor(start)}&enablejsapi=1&controls=0`
        + `&mute=${muted}&playsinline=1&rel=0&fs=0`
        + `&origin=${encodeURIComponent(origin)}`;
}

// ─── Barres audio animées ─────────────────────────────────────────────────────
function AudioBars({ playing }: { playing: boolean }) {
    return (
        <div className="flex items-end gap-[2px] h-4 shrink-0">
            {[{ h: '70%', d: '420ms' }, { h: '100%', d: '280ms' }, { h: '55%', d: '560ms' }, { h: '85%', d: '340ms' }]
                .map((b, i) => (
                    <span key={i}
                        className={`w-[2.5px] rounded-full ${playing ? 'bg-neon-cyan animate-pulse' : 'bg-white/25'}`}
                        style={{ height: playing ? b.h : '20%', animationDuration: b.d }}
                    />
                ))}
        </div>
    );
}

// ─── Hook logique audio partagée ─────────────────────────────────────────────
/**
 * STRATÉGIE MOBILE-FIRST :
 * 1. L'iframe se charge immédiatement avec mute=1 + autoplay=1 (autorisé sur tous les navigateurs mobiles)
 * 2. Au premier tap "Play" de l'utilisateur → on envoie unMute via postMessage (geste utilisateur = autorisé)
 * 3. Pour pause/play suivants → on envoie pauseVideo/playVideo + (un)mute
 * Cette approche fonctionne sur iOS Safari, Android Chrome, etc.
 */
function useRadioAudio() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const currentYtIdRef = useRef<string | null>(null);

    // ─── Activation ──────────────────────────────────────────────────────────
    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        try {
            const p = new URLSearchParams(window.location.search);
            if (p.get('radio') === '1' || p.get('radio_preview') === 'true') return true;
            return localStorage.getItem('dropsiders_radio_enabled') === 'true';
        } catch { return false; }
    });

    useEffect(() => {
        const h = () => setIsEnabled(localStorage.getItem('dropsiders_radio_enabled') === 'true');
        window.addEventListener('dropsiders_radio_toggle', h);
        window.addEventListener('storage', h);
        return () => { window.removeEventListener('dropsiders_radio_toggle', h); window.removeEventListener('storage', h); };
    }, []);

    // ─── Blocs radio ─────────────────────────────────────────────────────────
    const [radioBlocks, setRadioBlocks] = useState<RadioScheduleBlock[]>(() => {
        try {
            const s = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
            if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
        } catch {}
        return DEFAULT_RADIO_BLOCKS;
    });

    useEffect(() => {
        const h = () => {
            try {
                const s = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
                if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) setRadioBlocks(p); }
            } catch {}
        };
        window.addEventListener('dropsiders_radio_blocks_updated', h);
        window.addEventListener('storage', h);
        return () => { window.removeEventListener('dropsiders_radio_blocks_updated', h); window.removeEventListener('storage', h); };
    }, []);

    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        fetch('/api/settings').then(r => r.ok ? r.json() : null).then(data => {
            if (!data) return;
            if (p.get('radio') !== '1' && p.get('radio_preview') !== 'true' && typeof data.radio_enabled === 'boolean') {
                setIsEnabled(data.radio_enabled);
                localStorage.setItem('dropsiders_radio_enabled', data.radio_enabled ? 'true' : 'false');
            }
            if (Array.isArray(data.radio_blocks) && data.radio_blocks.length > 0) {
                setRadioBlocks(data.radio_blocks);
                localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(data.radio_blocks));
            }
        }).catch(() => {});
    }, []);

    // ─── Horloge Paris ───────────────────────────────────────────────────────
    const [uiTimeSec, setUiTimeSec] = useState<number>(getParisSeconds);
    useEffect(() => {
        const id = setInterval(() => setUiTimeSec(getParisSeconds()), 2000);
        return () => clearInterval(id);
    }, []);

    const liveInfo = useMemo(() => getCurrentLiveRadioTrack(radioBlocks, uiTimeSec), [radioBlocks, uiTimeSec]);
    const currentSet = liveInfo?.item || null;
    const uiOffset = liveInfo?.offsetSeconds ?? 0;

    // ─── État audio ──────────────────────────────────────────────────────────
    const [iframeSrc, setIframeSrc] = useState<string | null>(null);
    const [iframeReady, setIframeReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);  // audio démuté et actif
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState<number>(() => {
        try { const s = localStorage.getItem('dropsiders_radio_volume'); return s ? Math.max(0, Math.min(100, Number(s))) : 80; }
        catch { return 80; }
    });

    // ─── postMessage vers YouTube ─────────────────────────────────────────────
    const sendCmd = useCallback((func: string, args: any = '') => {
        try {
            iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func, args }), '*'
            );
        } catch {}
    }, []);

    // ─── Préchargement muet dès que la radio est activée ─────────────────────
    // L'iframe se charge avec mute=1 → autoplay autorisé sur tous les navigateurs
    useEffect(() => {
        if (!isEnabled || !currentSet?.youtubeId) return;
        if (currentYtIdRef.current === currentSet.youtubeId) return; // déjà chargé

        currentYtIdRef.current = currentSet.youtubeId;
        setIframeReady(false);
        setIsPlaying(false);
        // mute=1 : préchargement silencieux autorisé
        setIframeSrc(buildSrc(currentSet.youtubeId, uiOffset, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEnabled, currentSet?.youtubeId]);

    const handleIframeLoad = useCallback(() => {
        setIframeReady(true);
        // Si l'user avait déjà cliqué Play, on désourdine tout de suite
        if (isPlaying) {
            setTimeout(() => {
                sendCmd('unMute');
                sendCmd('setVolume', [isMuted ? 0 : volume]);
            }, 300);
        }
    }, [isPlaying, isMuted, volume, sendCmd]);

    // ─── Gestion volume/mute ─────────────────────────────────────────────────
    useEffect(() => {
        try { localStorage.setItem('dropsiders_radio_volume', String(volume)); } catch {}
        if (!iframeReady || !isPlaying) return;
        if (isMuted) { sendCmd('mute'); }
        else { sendCmd('unMute'); sendCmd('setVolume', [volume]); }
    }, [isMuted, volume, iframeReady, isPlaying, sendCmd]);

    // ─── Play / Pause ────────────────────────────────────────────────────────
    /**
     * Premier tap : l'iframe tourne déjà en muet → on désourdine (geste utilisateur = ok)
     * Taps suivants : on pause/reprend
     */
    const handlePlay = useCallback(() => {
        if (!currentSet?.youtubeId) return;

        if (!iframeSrc) {
            // Cas extrême : pas encore chargé, on charge maintenant avec mute=0
            // (le tap de l'utilisateur rend ça légal)
            currentYtIdRef.current = currentSet.youtubeId;
            setIframeSrc(buildSrc(currentSet.youtubeId, uiOffset, 0));
            setIsPlaying(true);
            return;
        }

        if (!isPlaying) {
            // L'iframe tourne en muet → désourdiner + play
            sendCmd('playVideo');
            sendCmd('unMute');
            sendCmd('setVolume', [isMuted ? 0 : volume]);
            setIsPlaying(true);
        } else {
            sendCmd('pauseVideo');
            sendCmd('mute'); // aussi muter pour ne pas avoir de son résiduel
            setIsPlaying(false);
        }
    }, [currentSet, iframeSrc, uiOffset, isPlaying, isMuted, volume, sendCmd]);

    const handleStop = useCallback(() => {
        sendCmd('pauseVideo');
        sendCmd('mute');
        setIsPlaying(false);
        setIframeSrc(null);
        setIframeReady(false);
        currentYtIdRef.current = null;
    }, [sendCmd]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            if (isPlaying) {
                if (next) sendCmd('mute');
                else { sendCmd('unMute'); sendCmd('setVolume', [volume]); }
            }
            return next;
        });
    }, [isPlaying, volume, sendCmd]);

    // ─── Broadcast vers autres composants ────────────────────────────────────
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('dropsiders_radio_state', {
            detail: { isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled }
        }));
    }, [isPlaying, isMuted, volume, currentSet, uiOffset, isEnabled]);

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
    }, [handlePlay, handleStop, toggleMute, isMuted]);

    return {
        isEnabled, currentSet, uiOffset, iframeSrc, iframeRef, iframeReady,
        isPlaying, isMuted, volume, setVolume, setIsMuted,
        handlePlay, handleStop, handleIframeLoad, toggleMute,
    };
}

// ─── Iframe partagée (offscreen mais dans le viewport pour éviter le throttling) ──
function RadioIframe({ iframeSrc, iframeRef, onLoad }: {
    iframeSrc: string | null;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    onLoad: () => void;
}) {
    if (!iframeSrc) return null;
    return (
        // Toujours dans le viewport mais invisible — évite le throttling iOS/Android
        <div style={{
            position: 'fixed', right: 0, bottom: 0,
            width: 1, height: 1,
            overflow: 'hidden', opacity: 0,
            pointerEvents: 'none', zIndex: -1
        }} aria-hidden="true">
            <iframe
                ref={iframeRef as React.RefObject<HTMLIFrameElement>}
                src={iframeSrc}
                onLoad={onLoad}
                allow="autoplay; encrypted-media; picture-in-picture"
                title="Dropsiders Radio"
                style={{ width: 320, height: 180, border: 'none', position: 'absolute' }}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER MOBILE — Barre Spotify + panneau expansible
// ═══════════════════════════════════════════════════════════════════════════════
function MobileRadioPlayer() {
    const audio = useRadioAudio();
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    if (!audio.isEnabled || !audio.currentSet || dismissed) return null;

    const { currentSet, uiOffset, isPlaying, isMuted, handlePlay, handleStop, toggleMute } = audio;
    const progress = Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100));

    return (
        <>
            <RadioIframe iframeSrc={audio.iframeSrc} iframeRef={audio.iframeRef} onLoad={audio.handleIframeLoad} />

            {/* ── Panneau expansible ── */}
            <AnimatePresence>
                {expanded && (
                    <>
                        <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm" style={{ zIndex: 99990 }}
                            onClick={() => setExpanded(false)} />

                        <motion.div key="panel"
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            style={{ zIndex: 99995, bottom: 'calc(62px + env(safe-area-inset-bottom, 0px))' }}
                            className="fixed left-0 right-0 rounded-t-[2rem] overflow-hidden"
                        >
                            <div className="relative bg-gradient-to-b from-[#0d0d18] to-[#050508] border-t border-white/10 px-6 pt-5 pb-10">
                                {/* Lueurs */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-neon-red/8 rounded-full blur-3xl pointer-events-none" />

                                {/* Handle */}
                                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

                                {/* Header */}
                                <div className="flex items-center justify-between mb-5 relative z-10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.25)]">
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
                                            <span className="w-1.5 h-1.5 rounded-full bg-neon-red" />LIVE
                                        </span>
                                        <button onClick={() => { handleStop(); setDismissed(true); setExpanded(false); }}
                                            className="p-1.5 rounded-xl bg-white/5 text-gray-400 active:bg-white/10 active:scale-90 transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Infos set */}
                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-5 relative z-10">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-neon-cyan mb-1.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" /> EN CE MOMENT
                                    </p>
                                    <h3 className="text-[17px] font-black text-white uppercase italic tracking-tight truncate leading-tight">
                                        {currentSet.artist}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 font-semibold truncate mt-0.5">
                                        {currentSet.title || (currentSet as any).event}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2.5 text-[9px] font-mono text-gray-500">
                                        <Clock className="w-3 h-3 text-neon-cyan" />
                                        <span className="text-neon-cyan font-bold">{currentSet.startTime}</span>
                                        <span className="text-gray-600">·</span>
                                        <span>{currentSet.durationFormatted}</span>
                                    </div>
                                </div>

                                {/* Progression */}
                                <div className="mb-6 relative z-10">
                                    <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-red rounded-full transition-all duration-1000"
                                            style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-1.5 text-[9px] font-mono text-gray-500">
                                        <span>{formatDurationExact(uiOffset)}</span>
                                        <span>{currentSet.durationFormatted}</span>
                                    </div>
                                </div>

                                {/* Contrôles principaux */}
                                <div className="flex items-center justify-center gap-8 relative z-10 mb-5">
                                    {/* Mute */}
                                    <button onClick={toggleMute}
                                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 active:scale-90 active:bg-white/10 transition-all">
                                        {isMuted
                                            ? <VolumeX className="w-5 h-5 text-neon-red" />
                                            : <Volume2 className="w-5 h-5" />
                                        }
                                    </button>

                                    {/* Play / Pause */}
                                    <button onClick={handlePlay}
                                        className={`w-[76px] h-[76px] rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                                            isPlaying
                                                ? 'bg-neon-cyan shadow-[0_0_45px_rgba(0,255,255,0.55)]'
                                                : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.25)]'
                                        }`}
                                    >
                                        {isPlaying
                                            ? <Pause className="w-9 h-9 text-black fill-black" />
                                            : <Play className="w-9 h-9 text-black fill-black ml-1" />
                                        }
                                    </button>

                                    {/* Barres animées */}
                                    <div className="w-12 h-12 flex items-center justify-center">
                                        <AudioBars playing={isPlaying} />
                                    </div>
                                </div>

                                {!isPlaying && (
                                    <p className="text-center text-[8.5px] text-gray-500 font-bold uppercase tracking-widest relative z-10 -mt-2 mb-3">
                                        Appuie sur ▶ pour démarrer
                                    </p>
                                )}

                                {/* Fermer */}
                                <button onClick={() => setExpanded(false)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] text-gray-600 font-bold uppercase tracking-widest active:text-white transition-colors relative z-10">
                                    <ChevronDown className="w-3.5 h-3.5" />Réduire
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Barre compacte permanente (Spotify-style) ── */}
            <div
                style={{ zIndex: 99998, bottom: 'calc(62px + env(safe-area-inset-bottom, 0px))' }}
                className="fixed left-0 right-0 lg:hidden"
            >
                {/* Progression ultra-fine */}
                <div className="h-[2px] bg-white/5">
                    <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-red transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>

                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0d0d18]/98 backdrop-blur-xl border-t border-white/[0.07] cursor-pointer"
                    onClick={() => setExpanded(true)}>

                    {/* Disque animé */}
                    <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center ${isPlaying ? 'shadow-[0_0_16px_rgba(0,255,255,0.4)]' : ''}`}>
                            <Disc3 className={`w-5 h-5 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                    </div>

                    {/* Texte */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] font-black text-white uppercase italic truncate leading-tight">{currentSet.artist}</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider truncate">DROPSIDERS RADIO · 24/7</p>
                    </div>

                    <AudioBars playing={isPlaying} />

                    {/* Bouton Play/Pause */}
                    <button
                        onClick={e => { e.stopPropagation(); handlePlay(); }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 shadow-lg ${
                            isPlaying ? 'bg-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.5)]' : 'bg-white'
                        }`}
                    >
                        {isPlaying
                            ? <Pause className="w-5 h-5 text-black fill-black" />
                            : <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                        }
                    </button>

                    <ChevronUp className="w-4 h-4 text-white/25 shrink-0" />
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER DESKTOP — Carte flottante
// ═══════════════════════════════════════════════════════════════════════════════
function DesktopRadioPlayer() {
    const audio = useRadioAudio();
    const [isMinimized, setIsMinimized] = useState(false);

    if (!audio.isEnabled || !audio.currentSet) return null;

    const { currentSet, uiOffset, isPlaying, isMuted, volume, setVolume, setIsMuted,
        handlePlay, handleStop, toggleMute } = audio;
    const progress = Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100));

    return (
        <>
            <RadioIframe iframeSrc={audio.iframeSrc} iframeRef={audio.iframeRef} onLoad={audio.handleIframeLoad} />

            <aside className="hidden lg:block fixed bottom-4 left-4 z-[100000] w-80 select-none pointer-events-auto font-sans">
                <AnimatePresence mode="wait">
                    {isMinimized ? (
                        <motion.div key="mini"
                            initial={{ opacity: 0, scale: 0.88, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: 15 }}
                            onClick={() => setIsMinimized(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#0a0b12]/95 backdrop-blur-2xl border border-neon-cyan/50 shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:border-neon-cyan transition-all cursor-pointer"
                        >
                            <div className="relative shrink-0">
                                <Disc3 className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red animate-ping" />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-red" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-white leading-none">DROPSIDERS RADIO <span className="text-neon-cyan text-[8px] font-mono">24/7</span></span>
                                <span className="text-[8.5px] font-bold text-gray-300 truncate mt-0.5">{currentSet.artist}</span>
                            </div>
                            {isPlaying && (
                                <div className="flex items-end gap-0.5 h-3 ml-1 shrink-0">
                                    {[{ h: '60%', d: '450ms' }, { h: '100%', d: '320ms' }, { h: '40%', d: '550ms' }].map((b, i) => (
                                        <span key={i} className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: b.h, animationDuration: b.d }} />
                                    ))}
                                </div>
                            )}
                            <button onClick={e => { e.stopPropagation(); handlePlay(); }}
                                className="w-8 h-8 rounded-full bg-neon-cyan/25 hover:bg-neon-cyan text-neon-cyan hover:text-black flex items-center justify-center transition-all cursor-pointer ml-1 shrink-0 active:scale-90">
                                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="full"
                            initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="w-full bg-gradient-to-b from-[#0e0e16] via-[#090912] to-[#040409] border border-white/20 rounded-3xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(0,255,255,0.2)] flex flex-col gap-3 relative overflow-hidden backdrop-blur-2xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-red/15 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.35)]"><Radio className="w-4 h-4" /></div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-display font-black text-white uppercase italic tracking-tight">DROPSIDERS <span className="text-neon-cyan">RADIO</span></span>
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neon-red/25 text-neon-red border border-neon-red/50 text-[7.5px] font-black uppercase animate-pulse">
                                                <span className="w-1 h-1 rounded-full bg-neon-red" />LIVE
                                            </span>
                                        </div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Web Radio Electro 24/7</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"><Minimize2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={handleStop} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 transition-all cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>

                            <div className="bg-black/50 border border-white/15 rounded-2xl p-3 relative z-10 flex items-center justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[7.5px] font-black uppercase tracking-widest text-neon-cyan mb-0.5 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /><span>EN CE MOMENT</span></div>
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
                                    className={`px-4 py-2 rounded-xl font-black text-[10.5px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${isPlaying ? 'bg-neon-cyan text-black' : 'bg-white text-black hover:bg-neon-cyan'}`}>
                                    {isPlaying ? <><Pause className="w-3.5 h-3.5 fill-current" /><span>PAUSE</span></> : <><Play className="w-3.5 h-3.5 fill-current ml-0.5" /><span>ÉCOUTER</span></>}
                                </button>
                                <div className="flex items-center gap-2 flex-1 max-w-[130px]">
                                    <button onClick={toggleMute} className="p-1 text-gray-300 hover:text-white transition-colors cursor-pointer">
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
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function DropsidersRadioPlayer() {
    const location = useLocation();
    if (location.pathname === '/tv') return null;
    return (
        <>
            <MobileRadioPlayer />
            <DesktopRadioPlayer />
        </>
    );
}
