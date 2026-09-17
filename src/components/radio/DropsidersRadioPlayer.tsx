import { useState, useEffect, useMemo, useRef } from 'react';
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
    computeDaySchedule,
    DEFAULT_TV_BLOCKS,
    formatDurationExact,
    type ComputedScheduleItem
} from '../../utils/tvSchedule';
import { useLocation } from 'react-router-dom';

// Helper: heure Paris en secondes depuis minuit
function getParisSec(): number {
    const now = new Date();
    try {
        const pStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour12: false });
        const p = new Date(pStr);
        return p.getHours() * 3600 + p.getMinutes() * 60 + p.getSeconds();
    } catch {
        return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    }
}

export function DropsidersRadioPlayer() {
    const location = useLocation();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // ─── Activation ────────────────────────────────────────────────────────────
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

    // Vérifie aussi côté serveur au montage — permet à TOUS les visiteurs de voir
    // la radio quand l'admin l'active (pas seulement le navigateur de l'admin)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('radio') === '1' || params.get('radio_preview') === 'true') return;
        fetch('/api/settings')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && typeof data.radio_enabled === 'boolean') {
                    setIsEnabled(data.radio_enabled);
                    localStorage.setItem('dropsiders_radio_enabled', data.radio_enabled ? 'true' : 'false');
                }
            })
            .catch(() => {});
    }, []);

    // ─── UI clock (seulement pour la progress bar, jamais pour l'iframe) ───────
    const [uiTimeSec, setUiTimeSec] = useState<number>(getParisSec);
    useEffect(() => {
        const id = setInterval(() => setUiTimeSec(getParisSec()), 5000);
        return () => clearInterval(id);
    }, []);

    // ─── Pistes custom ─────────────────────────────────────────────────────────
    const [customTracks, setCustomTracks] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_radio_tracks');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return [];
    });

    useEffect(() => {
        const handle = () => {
            try {
                const saved = localStorage.getItem('dropsiders_radio_tracks');
                const parsed = saved ? JSON.parse(saved) : [];
                setCustomTracks(Array.isArray(parsed) && parsed.length > 0 ? parsed : []);
            } catch {}
        };
        window.addEventListener('dropsiders_radio_tracks_updated', handle);
        window.addEventListener('storage', handle);
        return () => {
            window.removeEventListener('dropsiders_radio_tracks_updated', handle);
            window.removeEventListener('storage', handle);
        };
    }, []);

    // ─── Programme 24/7 — recalcule UNIQUEMENT quand les pistes changent ───────
    // N'utilise PAS uiTimeSec: ca evite de recalculer/remonter l'iframe toutes
    // les 5s => micro-coupures supprimees.
    const scheduleItems = useMemo<ComputedScheduleItem[]>(() => {
        const nowSec = getParisSec();
        if (customTracks.length > 0) {
            let cursor = 0;
            const items: ComputedScheduleItem[] = [];
            let i = 0;
            while (cursor < 86400 && i < 120) {
                const track = customTracks[i % customTracks.length];
                const dur = track.duration || (track.category === 'clip' ? 240 : 3600);
                const start = cursor;
                const end = start + dur;
                const sH = Math.floor(start / 3600) % 24;
                const sM = Math.floor((start % 3600) / 60);
                const eH = Math.floor(end / 3600) % 24;
                const eM = Math.floor((end % 3600) / 60);
                items.push({
                    id: `radio_${track.id}_${i}`,
                    blockId: 'radio_rotation',
                    blockTitle: track.category === 'clip' ? 'Clip Rotation' : 'Liveset 24/7',
                    blockColor: track.category === 'clip' ? '#a855f7' : '#00ffff',
                    blockEmoji: track.category === 'clip' ? '🎬' : '🎪',
                    title: track.title,
                    artist: track.artist || 'Artiste',
                    event: track.category === 'clip' ? 'DROPSIDERS CLIP' : 'DROPSIDERS LIVE',
                    youtubeId: track.youtubeId,
                    startTime: `${String(sH).padStart(2, '0')}h${String(sM).padStart(2, '0')}`,
                    endTime: `${String(eH).padStart(2, '0')}h${String(eM).padStart(2, '0')}`,
                    startSecondsFromMidnight: start,
                    durationSeconds: dur,
                    durationFormatted: formatDurationExact(dur),
                    isCurrentlyLive: nowSec >= start && nowSec < end,
                    category: track.category
                });
                cursor += dur;
                i++;
            }
            return items;
        }
        try { return computeDaySchedule(DEFAULT_TV_BLOCKS); } catch { return []; }
    }, [customTracks]); // ← PAS de uiTimeSec ici

    // ─── Set actuellement diffuse (suit uiTimeSec pour l'affichage) ────────────
    const currentSet = useMemo<ComputedScheduleItem | null>(() => {
        if (!scheduleItems.length) return null;
        const live = scheduleItems.find(item => item.isCurrentlyLive);
        if (live) return live;
        const next = scheduleItems.find(
            item => item.startSecondsFromMidnight + item.durationSeconds >= uiTimeSec
        );
        return next || scheduleItems[0];
    }, [scheduleItems, uiTimeSec]);

    // ─── Offset UI (progress bar uniquement) ───────────────────────────────────
    const uiOffset = useMemo(() => {
        if (!currentSet) return 0;
        let diff = uiTimeSec - currentSet.startSecondsFromMidnight;
        if (diff < 0) diff += 86400;
        return Math.max(0, Math.min(diff, currentSet.durationSeconds || 3600));
    }, [currentSet, uiTimeSec]);

    // ─── Source audio gelee - capturee UNE SEULE FOIS au clic Play ─────────────
    // frozenSrc ne change jamais pendant la lecture => iframe jamais rechargee
    // => ZERO micro-coupure.
    const [frozenSrc, setFrozenSrc] = useState<string | null>(null);

    // ─── Etat lecteur ───────────────────────────────────────────────────────────
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(80);
    const [isMinimized, setIsMinimized] = useState(false);

    const handlePlay = () => {
        if (!isPlaying && currentSet?.youtubeId) {
            // Capturer l'offset MAINTENANT et le geler definitivement
            const nowSec = getParisSec();
            let diff = nowSec - currentSet.startSecondsFromMidnight;
            if (diff < 0) diff += 86400;
            const offset = Math.max(0, Math.min(diff, currentSet.durationSeconds || 3600));
            setFrozenSrc(
                `https://www.youtube.com/embed/${currentSet.youtubeId}` +
                `?autoplay=1&start=${Math.floor(offset)}&enablejsapi=1&controls=0&mute=0`
            );
        }
        setIsPlaying(prev => !prev);
    };

    const handleStop = () => {
        setIsPlaying(false);
        setFrozenSrc(null);
        setIsMinimized(true);
    };

    const toggleMute = () => setIsMuted(prev => !prev);

    // ─── Mute via postMessage (ne recharge PAS l'iframe) ───────────────────────
    useEffect(() => {
        if (!iframeRef.current) return;
        try {
            const cmd = isMuted
                ? '{"event":"command","func":"mute","args":""}'
                : '{"event":"command","func":"unMute","args":""}';
            iframeRef.current.contentWindow?.postMessage(cmd, '*');
        } catch {}
    }, [isMuted]);

    // ─── Guard pages ───────────────────────────────────────────────────────────
    const isTVPage = location.pathname === '/tv';
    if (!isEnabled || isTVPage || !currentSet) return null;

    return (
        <aside
            aria-label="Lecteur Dropsiders Radio"
            className="fixed bottom-20 lg:bottom-4 left-4 z-[90] max-w-[calc(100vw-2rem)] select-none pointer-events-auto font-sans"
        >
            {/* Iframe audio - montee UNE FOIS, jamais rechargee tant que frozenSrc ne change pas */}
            <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
                {isPlaying && frozenSrc && (
                    <iframe
                        ref={iframeRef}
                        key={frozenSrc}
                        src={frozenSrc}
                        allow="autoplay"
                        title="Dropsiders Radio Audio Stream"
                        className="w-1 h-1"
                    />
                )}
            </div>

            <AnimatePresence mode="wait">
                {isMinimized ? (
                    // ── Mini pill ──────────────────────────────────────────────────────────
                    <motion.div
                        key="minimized-radio"
                        initial={{ opacity: 0, scale: 0.85, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 15 }}
                        onClick={() => setIsMinimized(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-black/90 backdrop-blur-2xl border border-neon-cyan/40 shadow-[0_0_25px_rgba(0,255,255,0.25)] hover:border-neon-cyan transition-all cursor-pointer group"
                    >
                        <div className="relative flex items-center justify-center">
                            <Disc3
                                className={`w-4 h-4 text-neon-cyan ${isPlaying ? 'animate-spin' : ''}`}
                                style={{ animationDuration: '3s' }}
                            />
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
                        {isPlaying && (
                            <div className="flex items-end gap-0.5 h-3 ml-1">
                                <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '60%', animationDuration: '450ms' }} />
                                <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '100%', animationDuration: '320ms' }} />
                                <span className="w-0.5 bg-neon-cyan rounded-full animate-pulse" style={{ height: '40%', animationDuration: '550ms' }} />
                            </div>
                        )}
                        <button
                            onClick={e => { e.stopPropagation(); handlePlay(); }}
                            className="w-6 h-6 rounded-full bg-neon-cyan/20 hover:bg-neon-cyan hover:text-black text-neon-cyan flex items-center justify-center transition-all cursor-pointer ml-1"
                        >
                            {isPlaying
                                ? <Pause className="w-3 h-3 fill-current" />
                                : <Play className="w-3 h-3 fill-current ml-0.5" />
                            }
                        </button>
                    </motion.div>
                ) : (
                    // ── Lecteur developpe ──────────────────────────────────────────────────
                    <motion.div
                        key="expanded-radio"
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        className="w-72 sm:w-80 bg-gradient-to-b from-[#0e0e14] via-[#09090e] to-[#050508] border border-white/15 rounded-3xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(0,255,255,0.15)] flex flex-col gap-3 relative overflow-hidden backdrop-blur-2xl"
                    >
                        {/* Lueurs */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/15 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-red/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

                        {/* Top bar */}
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
                                        <span className="inline-flex items-center gap-1 px-1.5 rounded-full bg-neon-red/20 text-neon-red border border-neon-red/40 text-[7px] font-black uppercase animate-pulse">
                                            <span className="w-1 h-1 rounded-full bg-neon-red" />
                                            LIVE
                                        </span>
                                    </div>
                                    <p className="text-[7.5px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        Web Radio Electro 24/7
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                                    title="Reduire le lecteur"
                                >
                                    <Minimize2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                                    title="Arreter et reduire"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Set en cours */}
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
                            <div className="shrink-0 flex flex-col items-end justify-center">
                                <span className="text-[7px] font-bold text-gray-500 uppercase">DUREE</span>
                                <span className="text-[9px] font-mono font-black text-white/90">
                                    {currentSet.durationFormatted}
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="relative z-10 space-y-1">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-red rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, Math.max(0, (uiOffset / (currentSet.durationSeconds || 3600)) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[7px] font-mono text-gray-400">
                                <span>{formatDurationExact(uiOffset)}</span>
                                <span className="flex items-center gap-1 text-neon-cyan font-semibold">
                                    <Clock className="w-2 h-2" /> {currentSet.startTime}
                                </span>
                                <span>{currentSet.durationFormatted}</span>
                            </div>
                        </div>

                        {/* Controles */}
                        <div className="flex items-center justify-between gap-3 relative z-10 pt-1 border-t border-white/10">
                            <button
                                onClick={handlePlay}
                                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                                    isPlaying
                                        ? 'bg-neon-cyan text-black shadow-neon-cyan/30'
                                        : 'bg-white text-black hover:bg-neon-cyan'
                                }`}
                            >
                                {isPlaying
                                    ? <><Pause className="w-3.5 h-3.5 fill-current" /><span>PAUSE</span></>
                                    : <><Play className="w-3.5 h-3.5 fill-current ml-0.5" /><span>ECOUTER</span></>
                                }
                            </button>
                            <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
                                <button onClick={toggleMute} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
                                    {isMuted || volume === 0
                                        ? <VolumeX className="w-3.5 h-3.5 text-neon-red" />
                                        : <Volume2 className="w-3.5 h-3.5 text-neon-cyan" />
                                    }
                                </button>
                                <input
                                    type="range" min="0" max="100" value={isMuted ? 0 : volume}
                                    onChange={e => { setVolume(Number(e.target.value)); if (isMuted) setIsMuted(false); }}
                                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                />
                            </div>
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
