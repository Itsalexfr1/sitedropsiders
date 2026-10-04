import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Youtube, Play, Pause, Square, Search, Volume2, VolumeX,
    SkipForward, SkipBack, Loader2, X, Link2, Clock, Zap, ExternalLink
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from '../modals/AdminTVModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CuedTrack {
    id: string;
    youtubeId: string;
    title: string;
    addedAt: number;
}

const STORAGE_CUE_HISTORY_KEY = 'dropsiders_radio_yt_cue_history';

function getHistory(): CuedTrack[] {
    try {
        const raw = localStorage.getItem(STORAGE_CUE_HISTORY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.slice(0, 20);
        }
    } catch {}
    return [];
}

function saveHistory(tracks: CuedTrack[]) {
    try {
        localStorage.setItem(STORAGE_CUE_HISTORY_KEY, JSON.stringify(tracks.slice(0, 20)));
    } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RadioYouTubeCuePlayer() {
    const [urlInput, setUrlInput] = useState('');
    const [cueStartInput, setCueStartInput] = useState('0:00');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCue, setActiveCue] = useState<CuedTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(80);
    const [elapsed, setElapsed] = useState(0);
    const [duration, setDuration] = useState(0);
    const [history, setHistory] = useState<CuedTrack[]>(getHistory);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── postMessage vers YouTube ─────────────────────────────────────────────
    const sendCmd = useCallback((func: string, args: any = '') => {
        try {
            iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func, args }), '*'
            );
        } catch {}
    }, []);

    // ─── Écoute des messages YouTube ──────────────────────────────────────────
    useEffect(() => {
        const handleMsg = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                // Durée rapportée par YouTube
                if (data?.info?.duration && data.info.duration > 0) {
                    setDuration(Math.round(data.info.duration));
                }
                // État du player
                if (data?.info !== undefined && typeof data.info === 'number') {
                    if (data.info === 0) { // ENDED
                        setIsPlaying(false);
                        setElapsed(0);
                        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
                    } else if (data.info === 1) { // PLAYING
                        setIsPlaying(true);
                    } else if (data.info === 2) { // PAUSED
                        setIsPlaying(false);
                    }
                }
                // Temps courant
                if (data?.info?.currentTime !== undefined) {
                    setElapsed(Math.round(data.info.currentTime));
                }
            } catch {}
        };
        window.addEventListener('message', handleMsg);
        return () => window.removeEventListener('message', handleMsg);
    }, []);

    // Timer d'elapsed (backup si postMessage ne donne pas currentTime)
    useEffect(() => {
        if (isPlaying) {
            elapsedTimerRef.current = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        } else {
            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        }
        return () => { if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current); };
    }, [isPlaying]);

    // ─── Charger un cue ───────────────────────────────────────────────────────
    const handleLoadCue = useCallback(async () => {
        if (!urlInput.trim()) return;
        setError(null);
        setIsLoading(true);

        const ytId = extractYouTubeId(urlInput.trim());
        if (!ytId) {
            setError('URL YouTube invalide');
            setIsLoading(false);
            return;
        }

        let title = `YouTube ${ytId}`;
        try {
            const fetched = await fetchYouTubeTitle(ytId);
            if (fetched) title = fetched;
        } catch {}

        // Calculer le point de départ
        const parseCueStart = (val: string): number => {
            const trimmed = val.trim();
            if (/^\d+$/.test(trimmed)) return Math.max(0, parseInt(trimmed, 10));
            const parts = trimmed.split(':');
            if (parts.length === 2) {
                const m = parseInt(parts[0], 10) || 0;
                const s = parseInt(parts[1], 10) || 0;
                return Math.max(0, m * 60 + s);
            }
            if (parts.length === 3) {
                const h = parseInt(parts[0], 10) || 0;
                const m = parseInt(parts[1], 10) || 0;
                const s = parseInt(parts[2], 10) || 0;
                return Math.max(0, h * 3600 + m * 60 + s);
            }
            return 0;
        };
        const cueStartSec = parseCueStart(cueStartInput);

        const track: CuedTrack = {
            id: `cue_${Date.now()}`,
            youtubeId: ytId,
            title,
            addedAt: Date.now()
        };

        setActiveCue(track);
        setIsPlaying(false);
        setElapsed(cueStartSec);
        setDuration(0);
        setIsLoading(false);
        setUrlInput('');

        // Précharger avec le point de départ en muet dans l'iframe
        if (iframeRef.current) {
            const origin = window.location.origin;
            iframeRef.current.src = `https://www.youtube.com/embed/${ytId}?autoplay=0&start=${cueStartSec}&enablejsapi=1&controls=0&mute=1&playsinline=1&rel=0&fs=0&origin=${encodeURIComponent(origin)}`;
        }

        // Ajouter à l'historique
        const updated = [track, ...history.filter(h => h.youtubeId !== ytId)].slice(0, 20);
        setHistory(updated);
        saveHistory(updated);
    }, [urlInput, history]);

    // ─── Relancer un cue depuis l'historique ──────────────────────────────────
    const handleLoadFromHistory = useCallback((track: CuedTrack) => {
        setActiveCue(track);
        setIsPlaying(false);
        setElapsed(0);
        setDuration(0);

        if (iframeRef.current) {
            const origin = window.location.origin;
            iframeRef.current.src = `https://www.youtube.com/embed/${track.youtubeId}?autoplay=0&enablejsapi=1&controls=0&mute=1&playsinline=1&rel=0&fs=0&origin=${encodeURIComponent(origin)}`;
        }
    }, []);

    // ─── Contrôles de lecture ─────────────────────────────────────────────────
    const handlePlay = useCallback(() => {
        if (!activeCue) return;
        if (isPlaying) {
            sendCmd('pauseVideo');
            setIsPlaying(false);
        } else {
            // Si on est au tout début et qu'on a un elapsed > 0 (point de départ calé), seekTo avant play
            if (elapsed > 0) {
                sendCmd('seekTo', [elapsed, true]);
            }
            sendCmd('unMute');
            sendCmd('setVolume', [volume]);
            sendCmd('playVideo');
            setIsPlaying(true);
        }
    }, [activeCue, isPlaying, elapsed, volume, sendCmd]);

    const handleStop = useCallback(() => {
        sendCmd('pauseVideo');
        sendCmd('seekTo', [0, true]);
        setIsPlaying(false);
        setElapsed(0);
    }, [sendCmd]);

    const handleSeek = useCallback((seconds: number) => {
        const target = Math.max(0, elapsed + seconds);
        sendCmd('seekTo', [target, true]);
        setElapsed(target);
    }, [elapsed, sendCmd]);

    const handleVolumeChange = useCallback((val: number) => {
        setVolume(val);
        sendCmd('setVolume', [val]);
        if (val > 0 && isMuted) {
            setIsMuted(false);
            sendCmd('unMute');
        }
    }, [isMuted, sendCmd]);

    const handleMuteToggle = useCallback(() => {
        if (isMuted) {
            sendCmd('unMute');
            sendCmd('setVolume', [volume]);
        } else {
            sendCmd('mute');
        }
        setIsMuted(!isMuted);
    }, [isMuted, volume, sendCmd]);

    const handleRemoveHistory = useCallback((id: string) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        saveHistory(updated);
    }, [history]);

    // Format time
    const formatTime = (sec: number) => {
        if (!sec || sec < 0) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30">
                    <Youtube className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider">
                        YouTube <span className="text-red-400">Cue Player</span>
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Calage audio YouTube en direct
                    </p>
                </div>
            </div>

            {/* Input URL + Start Time */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={urlInput}
                        onChange={e => { setUrlInput(e.target.value); setError(null); }}
                        onKeyDown={e => e.key === 'Enter' && handleLoadCue()}
                        placeholder="Coller une URL YouTube ou un ID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition-all"
                    />
                </div>
                <button
                    onClick={handleLoadCue}
                    disabled={isLoading || !urlInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Charger
                </button>
            </div>

            {/* Calage du point de départ */}
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">Départ :</span>
                <input
                    type="text"
                    value={cueStartInput}
                    onChange={e => setCueStartInput(e.target.value)}
                    placeholder="0:00 ou secondes"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 transition-all font-mono"
                />
                <span className="text-[10px] text-gray-600 font-mono whitespace-nowrap">mm:ss ou sec</span>
            </div>

            {error && (
                <p className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> {error}
                </p>
            )}

            {/* Cue actif */}
            <AnimatePresence mode="wait">
                {activeCue && (
                    <motion.div
                        key={activeCue.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-gradient-to-br from-red-500/10 via-white/[0.03] to-transparent border border-red-500/20 rounded-2xl overflow-hidden"
                    >
                        {/* Track info */}
                        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center ${isPlaying ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}`}>
                                    <Youtube className={`w-6 h-6 text-red-400 ${isPlaying ? 'animate-pulse' : ''}`} />
                                </div>
                                {isPlaying && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0a0e17] animate-pulse" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-white truncate">{activeCue.title}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                                    <span className="text-red-400">{activeCue.youtubeId}</span>
                                    {duration > 0 && (
                                        <>
                                            <span>·</span>
                                            <Clock className="w-3 h-3" />
                                            <span>{formatTime(duration)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => { handleStop(); setActiveCue(null); if (iframeRef.current) iframeRef.current.src = 'about:blank'; }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                                title="Retirer le cue"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="px-5">
                            <div
                                className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                                onClick={e => {
                                    if (!duration) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pct = (e.clientX - rect.left) / rect.width;
                                    const target = Math.round(pct * duration);
                                    sendCmd('seekTo', [target, true]);
                                    setElapsed(target);
                                }}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-[9px] font-mono text-gray-500">
                                <span>{formatTime(elapsed)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="px-5 py-4 flex items-center gap-3">
                            {/* Seek back */}
                            <button
                                onClick={() => handleSeek(-10)}
                                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90"
                                title="-10s"
                            >
                                <SkipBack className="w-4 h-4" />
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={handlePlay}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                                    isPlaying
                                        ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] text-white'
                                        : 'bg-white/90 hover:bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                }`}
                            >
                                {isPlaying
                                    ? <Pause className="w-6 h-6 fill-current" />
                                    : <Play className="w-6 h-6 fill-current ml-0.5" />
                                }
                            </button>

                            {/* Stop */}
                            <button
                                onClick={handleStop}
                                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer active:scale-90"
                                title="Stop"
                            >
                                <Square className="w-4 h-4" />
                            </button>

                            {/* Seek forward */}
                            <button
                                onClick={() => handleSeek(10)}
                                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-90"
                                title="+10s"
                            >
                                <SkipForward className="w-4 h-4" />
                            </button>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Mute */}
                            <button
                                onClick={handleMuteToggle}
                                className="p-2 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                            </button>

                            {/* Volume */}
                            <input
                                type="range" min="0" max="100"
                                value={isMuted ? 0 : volume}
                                onChange={e => handleVolumeChange(Number(e.target.value))}
                                className="w-24 h-1.5 bg-white/15 rounded-full appearance-none accent-red-400 cursor-pointer"
                            />

                            {/* Open in YouTube */}
                            <a
                                href={`https://www.youtube.com/watch?v=${activeCue.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-all"
                                title="Ouvrir sur YouTube"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Iframe cachée pour le cue player */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: 240,
                height: 140,
                overflow: 'hidden',
                opacity: 0.01,
                pointerEvents: 'none',
                zIndex: 1
            }} aria-hidden="true">
                <iframe
                    ref={iframeRef}
                    allow="autoplay; encrypted-media"
                    title="YouTube Cue Player"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                />
            </div>

            {/* Historique des cues récents */}
            {history.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Cues récents
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                        {history.map(track => (
                            <div
                                key={track.id}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group cursor-pointer ${
                                    activeCue?.youtubeId === track.youtubeId
                                        ? 'bg-red-500/15 border border-red-500/30'
                                        : 'bg-white/[0.02] border border-transparent hover:bg-white/5 hover:border-white/10'
                                }`}
                                onClick={() => handleLoadFromHistory(track)}
                            >
                                <Youtube className="w-4 h-4 text-red-400/60 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-200 truncate">{track.title}</p>
                                    <p className="text-[9px] text-gray-600 font-mono">{track.youtubeId}</p>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); handleRemoveHistory(track.id); }}
                                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tip */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-[11px] text-amber-200 font-bold">Astuce — Calage YouTube</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        Collez l'URL d'une vidéo YouTube, puis utilisez les boutons Play/Pause/Stop pour la diffuser
                        au moment exact que vous souhaitez pendant votre émission en direct. Le son est indépendant
                        du flux radio automatique.
                    </p>
                </div>
            </div>
        </div>
    );
}
