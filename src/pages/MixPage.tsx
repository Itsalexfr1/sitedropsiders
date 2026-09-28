import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, DownloadCloud, 
    Share2, Heart, Music, Disc, ExternalLink, ListMusic, 
    ChevronDown, ChevronUp, User, Check, Radio, Smartphone,
    SkipBack, SkipForward, Sparkles, SmartphoneCharging, Gauge
} from 'lucide-react';
import { SEO } from '../components/utils/SEO';

interface TrackItem {
    id: string;
    artist: string;
    title: string;
    timestamp?: string;
}

interface MixData {
    id: string;
    title: string;
    genre?: string;
    description?: string;
    cover?: string;
    type?: 'Track' | 'Remix' | 'Edit' | 'Mix';
    allowDownload?: boolean;
    audioUrl?: string;
    url?: string;
    embedUrl?: string;
    duration?: string;
    uploadDate?: string;
    username?: string;
    handle?: string;
    avatar?: string;
    ownerEmail?: string;
    tracklist?: TrackItem[];
    likes?: number;
}

export function MixPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    const [mix, setMix] = useState<MixData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isTracklistOpen, setIsTracklistOpen] = useState(true);
    const [copiedLink, setCopiedLink] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [dragSeekTime, setDragSeekTime] = useState<number | null>(null);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
    const [wakeLockActive, setWakeLockActive] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const wakeLockRef = useRef<any>(null);
    const initialSeekDoneRef = useRef(false);
    const isSeekingRef = useRef(false);

    // Fetch Mix details (public endpoint)
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);

        fetch(`/api/mix/${encodeURIComponent(id)}`)
            .then(async (res) => {
                if (!res.ok) {
                    // Fallback to community mixes search
                    const comRes = await fetch('/api/community/mixes');
                    if (comRes.ok) {
                        const mixes = await comRes.json();
                        const found = mixes.find((m: any) => m.id === id);
                        if (found) return found;
                    }
                    throw new Error("Mix introuvable ou retiré.");
                }
                return res.json();
            })
            .then((data: MixData) => {
                setMix(data);
                setLikesCount(data.likes || 0);
            })
            .catch((err) => {
                console.error("Error loading mix:", err);
                setError("Ce mix n'existe pas ou a été supprimé.");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const audioSource = mix ? (mix.audioUrl || mix.url || (mix as any).audio || '') : '';
    const isExternalEmbed = !audioSource && !!mix?.embedUrl;

    // Format time helpers
    const formatTime = (secs: number) => {
        if (isNaN(secs) || secs < 0) return '00:00';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const parseTimestampToSeconds = (ts?: string) => {
        if (!ts) return 0;
        const parts = ts.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
    };

    // Auto-detect current track in tracklist based on currentTime
    useEffect(() => {
        if (!mix?.tracklist || mix.tracklist.length === 0) return;
        let detected = -1;
        for (let i = 0; i < mix.tracklist.length; i++) {
            const startSec = parseTimestampToSeconds(mix.tracklist[i].timestamp);
            const nextSec = i + 1 < mix.tracklist.length 
                ? parseTimestampToSeconds(mix.tracklist[i + 1].timestamp) 
                : Infinity;
            if (currentTime >= startSec && currentTime < nextSec) {
                detected = i;
                break;
            }
        }
        setCurrentTrackIndex(detected);
    }, [currentTime, mix?.tracklist]);

    // Skip to previous track in tracklist
    const handlePreviousTrack = useCallback(() => {
        if (!mix?.tracklist || mix.tracklist.length === 0) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
            }
            return;
        }
        if (currentTrackIndex > 0) {
            const prev = mix.tracklist[currentTrackIndex - 1];
            jumpToTrack(prev.timestamp);
        } else {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
            }
        }
    }, [mix?.tracklist, currentTrackIndex]);

    // Skip to next track in tracklist
    const handleNextTrack = useCallback(() => {
        if (!mix?.tracklist || mix.tracklist.length === 0) return;
        if (currentTrackIndex < mix.tracklist.length - 1) {
            const next = mix.tracklist[currentTrackIndex + 1];
            jumpToTrack(next.timestamp);
        }
    }, [mix?.tracklist, currentTrackIndex]);

    // MediaSession API setup for background playback on mobile (iOS Safari / Android Chrome)
    useEffect(() => {
        if (!mix || !('mediaSession' in navigator)) return;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: mix.title,
                artist: mix.username || mix.handle || 'Dropsiders DJ',
                album: `${mix.type || 'Mix'} • Dropsiders Studio`,
                artwork: mix.cover ? [
                    { src: mix.cover, sizes: '512x512', type: 'image/png' },
                    { src: mix.cover, sizes: '256x256', type: 'image/png' },
                    { src: mix.cover, sizes: '128x128', type: 'image/png' },
                    { src: mix.cover, sizes: '96x96', type: 'image/png' },
                ] : [
                    { src: '/images/branding/logo-dropsiders.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                audioRef.current?.play().then(() => {
                    setIsPlaying(true);
                    setAutoplayBlocked(false);
                }).catch(() => {});
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                audioRef.current?.pause();
                setIsPlaying(false);
            });

            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined && audioRef.current && isFinite(details.seekTime)) {
                    audioRef.current.currentTime = details.seekTime;
                    setCurrentTime(details.seekTime);
                }
            });

            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skipTime = details.seekOffset || 15;
                if (audioRef.current) {
                    const target = Math.max(audioRef.current.currentTime - skipTime, 0);
                    audioRef.current.currentTime = target;
                    setCurrentTime(target);
                }
            });

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skipTime = details.seekOffset || 15;
                if (audioRef.current) {
                    const max = audioRef.current.duration || Infinity;
                    const target = Math.min(audioRef.current.currentTime + skipTime, max);
                    audioRef.current.currentTime = target;
                    setCurrentTime(target);
                }
            });

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                handlePreviousTrack();
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => {
                handleNextTrack();
            });

            navigator.mediaSession.setActionHandler('stop', () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    setIsPlaying(false);
                }
            });
        } catch (e) {
            console.warn("MediaSession registration failed", e);
        }
    }, [mix, handlePreviousTrack, handleNextTrack]);

    // Keep MediaSession playbackState synced with isPlaying
    useEffect(() => {
        if ('mediaSession' in navigator && navigator.mediaSession) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [isPlaying]);

    // Dynamic Browser Tab Title
    useEffect(() => {
        if (!mix) return;
        const prefix = isPlaying ? '▶ ' : '⏸ ';
        document.title = `${prefix}${mix.title} — Dropsiders Mix Player`;
    }, [isPlaying, mix?.title]);

    // Screen Wake Lock API (keeps screen awake if desired)
    const toggleWakeLock = async () => {
        if (!('wakeLock' in navigator)) return;
        try {
            if (wakeLockActive && wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
                setWakeLockActive(false);
            } else {
                const lock = await (navigator as any).wakeLock.request('screen');
                wakeLockRef.current = lock;
                setWakeLockActive(true);
                lock.addEventListener('release', () => setWakeLockActive(false));
            }
        } catch (e) {
            console.warn("Wake lock failed", e);
        }
    };

    // Autoplay attempt on load
    useEffect(() => {
        if (!audioSource || !audioRef.current) return;

        const attemptAutoplay = () => {
            const playPromise = audioRef.current?.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                    setAutoplayBlocked(false);
                }).catch((err) => {
                    console.log("Autoplay deferred until user gesture (normal on mobile Safari):", err);
                    setAutoplayBlocked(true);
                });
            }
        };

        const timer = setTimeout(attemptAutoplay, 300);
        return () => clearTimeout(timer);
    }, [audioSource]);

    // Handle loaded metadata & initial seek
    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        const dur = audioRef.current.duration;
        if (isFinite(dur) && dur > 0) {
            setDuration(dur);
        }
        if (!initialSeekDoneRef.current) {
            const tParam = searchParams.get('t');
            if (tParam) {
                const startTime = parseFloat(tParam);
                if (isFinite(startTime) && startTime > 0) {
                    audioRef.current.currentTime = startTime;
                    setCurrentTime(startTime);
                }
            }
            initialSeekDoneRef.current = true;
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
            }).catch((e) => {
                console.warn("Playback prevented", e);
                setAutoplayBlocked(true);
            });
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current || isSeekingRef.current) return;
        const curr = audioRef.current.currentTime;
        setCurrentTime(curr);

        if ('mediaSession' in navigator && isFinite(duration) && duration > 0) {
            try {
                const safePos = Math.min(Math.max(0, curr), duration);
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: audioRef.current.playbackRate || 1,
                    position: safePos
                });
            } catch (_) {}
        }
    };

    const handleSkip = (seconds: number) => {
        if (audioRef.current) {
            const maxDuration = (isFinite(audioRef.current.duration) && audioRef.current.duration > 0)
                ? audioRef.current.duration 
                : (duration > 0 ? duration : Infinity);
            const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, maxDuration));
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        const nextMuted = !isMuted;
        audioRef.current.muted = nextMuted;
        setIsMuted(nextMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (audioRef.current) {
            audioRef.current.volume = val;
            audioRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    const cyclePlaybackRate = () => {
        const rates = [1, 1.05, 1.1, 1.15, 0.95];
        const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
        const nextRate = rates[nextIdx];
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    const jumpToTrack = (ts?: string) => {
        const sec = parseTimestampToSeconds(ts);
        if (audioRef.current) {
            audioRef.current.currentTime = sec;
            setCurrentTime(sec);
            if (!isPlaying) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setAutoplayBlocked(false);
                }).catch(() => {});
            }
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/mix/${mix?.id}${currentTime > 10 ? `?t=${Math.floor(currentTime)}` : ''}`;
        const shareData = {
            title: mix ? `${mix.title} — Dropsiders Mix Player` : 'Dropsiders Live Mix',
            text: mix ? `🎧 Écoute "${mix.title}" par ${mix.username || 'Dropsiders DJ'} en continu sur Dropsiders Studio !` : 'Écoute ce mix sur Dropsiders !',
            url: shareUrl
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.warn("Share cancelled", err);
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    const handleDownload = () => {
        if (!audioSource) return;
        const a = document.createElement('a');
        a.href = audioSource;
        const ext = audioSource.split('.').pop()?.split('?')[0] || 'mp3';
        a.download = `${mix?.title || 'Dropsiders_Mix'}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleLike = async () => {
        if (hasLiked || !mix) return;
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
        try {
            await fetch('/api/community/mixes/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: mix.id })
            });
        } catch (_) {}
    };

    const getBadgeStyle = (t?: string) => {
        switch (t) {
            case 'Track': return 'bg-neon-red/10 border-neon-red/30 text-neon-red shadow-[0_0_15px_rgba(255,0,0,0.2)]';
            case 'Edit': return 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]';
            case 'Mix': return 'bg-neon-green/10 border-neon-green/30 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]';
            default: return 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.2)]';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-neon-cyan animate-spin" />
                    <Disc className="w-10 h-10 text-neon-cyan absolute animate-pulse" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Ouverture du lecteur dédié...</p>
                <p className="text-[10px] text-neon-cyan/70 font-bold uppercase tracking-widest mt-1">Dropsiders Standalone Mix Player</p>
            </div>
        );
    }

    if (error || !mix) {
        return (
            <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto text-red-400">
                    <Music className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-wider">Mix Introuvable</h2>
                    <p className="text-xs text-gray-400 font-medium">{error || "Ce contenu n'est plus disponible ou a été déplacé."}</p>
                </div>
                <Link
                    to="/communaute"
                    className="px-8 py-4 bg-neon-purple/20 hover:bg-neon-purple border border-neon-purple/40 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                    Explorer la communauté
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050508] text-white selection:bg-neon-cyan selection:text-black flex flex-col justify-between relative overflow-x-hidden pb-12 pt-6 sm:pt-8">
            <SEO
                title={`${mix.title} | Lecteur Dédié Dropsiders`}
                description={`Écoute "${mix.title}" par ${mix.username || 'Dropsiders DJ'} en continu et en arrière-plan sur Dropsiders Player.`}
                image={mix.cover || '/images/branding/meta-banner.png'}
            />

            {/* Native HTML5 Audio Element for Background / Lock Screen / MediaSession Playback */}
            {audioSource && (
                <audio
                    ref={audioRef}
                    src={audioSource}
                    preload="auto"
                    playsInline
                    onPlay={() => {
                        setIsPlaying(true);
                        setAutoplayBlocked(false);
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {/* Top Bar: Brand + Background Audio Badge + Quick Actions */}
            <header className="relative z-30 w-full max-w-4xl mx-auto px-4 sm:px-6 mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:scale-105 transition-transform">
                                <Radio className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                                <span className="text-sm font-display font-black text-white uppercase italic tracking-wider block leading-none">
                                    DROPSIDERS
                                </span>
                                <span className="text-[8px] font-black text-neon-cyan uppercase tracking-widest block mt-0.5">
                                    PLAYER DÉDIÉ
                                </span>
                            </div>
                        </Link>

                        {/* Mobile Background Mode Badge */}
                        <div className="flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Arrière-plan actif</span>
                        </div>
                    </div>

                    {/* Desktop Background Mode Guarantee Badge */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>Écoute en arrière-plan & écran verrouillé</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Screen wake lock toggle */}
                        {'wakeLock' in navigator && (
                            <button
                                onClick={toggleWakeLock}
                                className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    wakeLockActive 
                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                }`}
                                title={wakeLockActive ? "Écran maintenu allumé" : "Garder l'écran allumé"}
                            >
                                <SmartphoneCharging className="w-3.5 h-3.5" />
                            </button>
                        )}

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 cursor-pointer"
                        >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-neon-cyan" />}
                            <span>{copiedLink ? 'Copié !' : 'Partager'}</span>
                        </button>

                        <Link
                            to="/communaute"
                            className="px-3 py-2 rounded-xl bg-neon-cyan text-black hover:bg-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 flex items-center gap-1.5"
                        >
                            <span className="hidden sm:inline">Communauté</span>
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Autoplay Prompt Banner (One-touch user gesture for mobile iOS/Android) */}
            <AnimatePresence>
                {autoplayBlocked && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-30 max-w-xl mx-auto px-4 mb-4"
                    >
                        <button
                            onClick={togglePlay}
                            className="w-full py-3.5 px-5 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple bg-[length:200%_auto] animate-gradient text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center justify-center gap-3 cursor-pointer active:scale-95 border border-white/30"
                        >
                            <Play className="w-4 h-4 fill-black" />
                            <span>Touchez pour démarrer le mix & l'arrière-plan</span>
                            <Sparkles className="w-4 h-4 text-black" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Interactive DJ Deck Center */}
            <main className="relative z-20 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 flex flex-col items-center justify-center text-center">
                
                {/* Turntable / Rotating Vinyl */}
                <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] my-3 flex items-center justify-center group">
                    {/* Background Pulsing Neon Glow */}
                    <div className={`absolute inset-0 rounded-full blur-[60px] transition-all duration-700 pointer-events-none ${
                        isPlaying 
                            ? 'bg-gradient-to-tr from-neon-cyan/40 via-neon-purple/30 to-neon-red/30 scale-110 opacity-80' 
                            : 'bg-transparent scale-95 opacity-0'
                    }`} />

                    {/* Outer Steel / Vinyl Base Ring */}
                    <div className="absolute inset-0 rounded-full border-[10px] border-white/10 bg-[#08080f] shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex items-center justify-center">
                        {/* Inner Grooves Background */}
                        <div className="absolute inset-[16px] rounded-full border border-white/5 bg-[#0c0c16]" />

                        {/* Interactive Rotating Vinyl Record */}
                        <motion.div
                            animate={isPlaying ? { rotate: 360 } : {}}
                            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                            className="w-[230px] h-[230px] sm:w-[290px] sm:h-[290px] rounded-full bg-[#10101c] border-2 border-white/20 flex items-center justify-center relative cursor-pointer shadow-2xl overflow-hidden select-none"
                            onClick={togglePlay}
                            title={isPlaying ? "Mettre en pause" : "Lancer le mix"}
                        >
                            {/* PICTURE DISC VINYL WITH COVER */}
                            {mix.cover ? (
                                <>
                                    <img 
                                        src={mix.cover} 
                                        alt={mix.title} 
                                        className="absolute inset-0 w-full h-full object-cover rounded-full select-none pointer-events-none" 
                                    />
                                    {/* Realistic Vinyl Grooves Texture Overlay */}
                                    <div 
                                        className="absolute inset-0 rounded-full pointer-events-none"
                                        style={{
                                            background: 'radial-gradient(circle, transparent 25%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.75) 100%)'
                                        }}
                                    />
                                    <div className="absolute inset-6 rounded-full border border-white/10 pointer-events-none" />
                                    <div className="absolute inset-12 rounded-full border border-white/10 pointer-events-none" />
                                    <div className="absolute inset-20 rounded-full border border-white/15 pointer-events-none" />
                                    {/* Sheen sheen reflection */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/25 via-transparent to-black/50 pointer-events-none" />
                                    
                                    {/* LED Strobe Ring */}
                                    <div className={`absolute inset-2 rounded-full border-2 border-dashed transition-opacity duration-500 pointer-events-none ${
                                        isPlaying 
                                            ? 'border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.7)] opacity-100' 
                                            : 'border-transparent opacity-0'
                                    }`} />

                                    {/* Center Spindle Hole */}
                                    <div className="w-6 h-6 rounded-full bg-[#08080c] border-2 border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_0_10px_rgba(255,255,255,0.4)] absolute z-20 flex items-center justify-center pointer-events-none">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-6 rounded-full border border-white/5" />
                                    <div className="absolute inset-12 rounded-full border border-white/[0.03]" />
                                    <div className="absolute inset-20 rounded-full border border-white/[0.02]" />

                                    {/* Equalizer Rim */}
                                    <div className={`absolute inset-2 rounded-full border-2 border-dashed transition-opacity duration-500 ${
                                        isPlaying ? 'border-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.6)] opacity-100' : 'border-transparent opacity-0'
                                    }`} />

                                    {/* Center DS Label */}
                                    <div className="w-[85px] h-[85px] sm:w-[105px] sm:h-[105px] rounded-full bg-gradient-to-br from-neon-purple to-neon-red flex flex-col items-center justify-center text-center shadow-2xl border border-black/30 relative">
                                        <span className="text-white font-black text-sm uppercase tracking-wider italic leading-none">DS</span>
                                        <span className="text-white/80 text-[7px] font-black uppercase mt-1 leading-none">STUDIO</span>
                                        <div className="w-3.5 h-3.5 rounded-full bg-[#08080c] border border-white/40 absolute shadow-inner" />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>

                    {/* Mechanical Tone-Arm Needle Mechanism */}
                    <div 
                        className="absolute top-[-14px] right-2 sm:right-6 w-24 h-40 pointer-events-none origin-top-right transition-transform duration-700 z-20"
                        style={{
                            transform: isPlaying ? 'rotate(24deg)' : 'rotate(0deg)'
                        }}
                    >
                        <div className="w-2.5 h-28 bg-white/30 border-r border-white/20 rounded-full mx-auto shadow-xl" />
                        <div className="w-6 h-9 bg-white/50 rounded-lg absolute bottom-2 left-9 border border-white/40 shadow-2xl flex items-center justify-center">
                            <div className="w-1 h-3 bg-neon-cyan rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Track Metadata Header */}
                <div className="space-y-3 mt-4 max-w-lg w-full">
                    <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${getBadgeStyle(mix.type)}`}>
                            {mix.type || 'Mix'}
                        </span>
                        {mix.genre && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-gray-300">
                                {mix.genre}
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Arrière-plan
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-display font-black text-white uppercase italic tracking-tight leading-tight">
                        {mix.title}
                    </h1>

                    {/* DJ Artist info */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                        {mix.avatar ? (
                            <img src={mix.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-white/20" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                                <User className="w-3.5 h-3.5" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase text-gray-300 tracking-wider">
                            {mix.username || mix.handle || 'Dropsider DJ'}
                        </span>
                    </div>

                    {/* Active Track in Mix Display */}
                    {currentTrackIndex !== -1 && mix.tracklist && mix.tracklist[currentTrackIndex] && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                            <span className="text-gray-400 uppercase text-[9px] font-black">EN CE MOMENT :</span>
                            <span className="text-neon-cyan font-black uppercase truncate max-w-[200px] sm:max-w-xs">
                                {mix.tracklist[currentTrackIndex].title} — {mix.tracklist[currentTrackIndex].artist}
                            </span>
                        </div>
                    )}

                    {mix.description && (
                        <p className="text-xs text-gray-400 font-medium italic pt-1 leading-relaxed max-w-md mx-auto">
                            "{mix.description}"
                        </p>
                    )}
                </div>

                {/* Animated LED Frequency Equalizer Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-10 my-4 w-full max-w-sm">
                    {[14, 28, 18, 36, 22, 40, 16, 32, 20, 38, 26, 18, 34, 22, 16, 30].map((h, i) => (
                        <span
                            key={i}
                            className={`w-1.5 rounded-full transition-all duration-200 ${
                                isPlaying 
                                    ? 'bg-gradient-to-t from-neon-purple via-neon-cyan to-white shadow-[0_0_10px_rgba(0,240,255,0.5)]' 
                                    : 'bg-white/10'
                            }`}
                            style={{
                                height: isPlaying ? `${Math.max(6, (h * ((currentTime % 5) + 1.2)) % 38)}px` : '4px',
                                animationDelay: `${i * 0.06}s`
                            }}
                        />
                    ))}
                </div>

                {/* Seeker / Timeline Progress Slider */}
                <div className="w-full max-w-lg space-y-2">
                    <div className="relative group py-2 cursor-pointer">
                        <input
                            type="range"
                            min={0}
                            max={duration && duration > 0 ? duration : 100}
                            value={dragSeekTime !== null ? dragSeekTime : currentTime}
                            onMouseDown={() => { isSeekingRef.current = true; }}
                            onTouchStart={() => { isSeekingRef.current = true; }}
                            onChange={(e) => {
                                setDragSeekTime(parseFloat(e.target.value));
                            }}
                            onMouseUp={(e) => {
                                isSeekingRef.current = false;
                                const target = parseFloat((e.target as HTMLInputElement).value);
                                if (audioRef.current) {
                                    audioRef.current.currentTime = target;
                                    setCurrentTime(target);
                                }
                                setDragSeekTime(null);
                            }}
                            onTouchEnd={() => {
                                isSeekingRef.current = false;
                                if (dragSeekTime !== null && audioRef.current) {
                                    audioRef.current.currentTime = dragSeekTime;
                                    setCurrentTime(dragSeekTime);
                                }
                                setDragSeekTime(null);
                            }}
                            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-cyan focus:outline-none"
                        />
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-neon-purple via-neon-cyan to-white rounded-full pointer-events-none"
                            style={{
                                width: `${duration ? ((dragSeekTime !== null ? dragSeekTime : currentTime) / duration) * 100 : 0}%`
                            }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-black uppercase text-gray-400 font-mono tracking-wider px-1">
                        <span className={isPlaying ? 'text-neon-cyan font-bold' : ''}>
                            {formatTime(dragSeekTime !== null ? dragSeekTime : currentTime)}
                        </span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Playback Transport Controls */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6">
                    {/* Previous Track in Tracklist */}
                    {mix.tracklist && mix.tracklist.length > 0 && (
                        <button
                            onClick={handlePreviousTrack}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Piste précédente"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>
                    )}

                    {/* -15s */}
                    <button
                        onClick={() => handleSkip(-15)}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                        title="Reculer de 15s"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>

                    {/* Main Big Play/Pause Toggle */}
                    <button
                        onClick={togglePlay}
                        className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all transform active:scale-90 shadow-2xl cursor-pointer ${
                            isPlaying
                                ? 'bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.6)]'
                                : 'bg-neon-cyan text-black shadow-[0_0_35px_rgba(0,240,255,0.6)] hover:scale-105'
                        }`}
                        title={isPlaying ? "Mettre en pause" : "Lancer le mix"}
                    >
                        {isPlaying ? (
                            <Pause className="w-9 h-9 fill-current" />
                        ) : (
                            <Play className="w-9 h-9 fill-current ml-1" />
                        )}
                    </button>

                    {/* +15s */}
                    <button
                        onClick={() => handleSkip(15)}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                        title="Avancer de 15s"
                    >
                        <RotateCw className="w-5 h-5" />
                    </button>

                    {/* Next Track in Tracklist */}
                    {mix.tracklist && mix.tracklist.length > 0 && (
                        <button
                            onClick={handleNextTrack}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Piste suivante"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Secondary Utility Controls (Volume, Pitch, Like, Download) */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    {/* Like button */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer active:scale-95 ${
                            hasLiked 
                                ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-red-400' : ''}`} />
                        <span>{likesCount}</span>
                    </button>

                    {/* DJ Pitch / Speed Control */}
                    <button
                        onClick={cyclePlaybackRate}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-neon-cyan transition-all cursor-pointer active:scale-95"
                        title="Changer la vitesse / pitch"
                    >
                        <Gauge className="w-4 h-4 text-neon-cyan" />
                        <span>{playbackRate}x</span>
                    </button>

                    {/* Download button if allowed */}
                    {mix.allowDownload && audioSource && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95"
                        >
                            <DownloadCloud className="w-4 h-4 text-neon-cyan" />
                            <span>Télécharger</span>
                        </button>
                    )}

                    {/* Volume Mute & Slider */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                        <button
                            onClick={toggleMute}
                            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                            title={isMuted ? "Activer le son" : "Couper le son"}
                        >
                            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-cyan focus:outline-none"
                        />
                    </div>
                </div>

                {/* External Embed Notice fallback */}
                {isExternalEmbed && (
                    <div className="w-full max-w-lg mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                        <p className="text-xs text-gray-400 font-bold mb-2">Flux externe SoundCloud / YouTube</p>
                        <iframe 
                            src={mix.embedUrl} 
                            className="w-full h-44 rounded-xl border border-white/10" 
                            allow="autoplay"
                        />
                    </div>
                )}

                {/* Interactive Tracklist Section */}
                {mix.tracklist && mix.tracklist.length > 0 && (
                    <div className="w-full max-w-lg mt-8 text-left bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        <button
                            onClick={() => setIsTracklistOpen(!isTracklistOpen)}
                            className="w-full px-6 py-4 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <ListMusic className="w-4 h-4 text-neon-cyan" />
                                <span className="text-xs font-black uppercase tracking-widest text-white">
                                    Tracklist Complète ({mix.tracklist.length} titres)
                                </span>
                            </div>
                            {isTracklistOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>

                        <AnimatePresence>
                            {isTracklistOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="divide-y divide-white/5 max-h-72 overflow-y-auto custom-scrollbar"
                                >
                                    {mix.tracklist.map((trackItem, index) => {
                                        const trackSeconds = parseTimestampToSeconds(trackItem.timestamp);
                                        const isCurrent = currentTrackIndex === index;

                                        return (
                                            <div
                                                key={trackItem.id || index}
                                                onClick={() => jumpToTrack(trackItem.timestamp)}
                                                className={`px-6 py-3.5 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                                                    isCurrent 
                                                        ? 'bg-neon-cyan/15 text-white font-black' 
                                                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`text-[10px] font-black w-4 ${isCurrent ? 'text-neon-cyan' : 'text-gray-600'}`}>
                                                        {isCurrent ? '▶' : index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold uppercase truncate">{trackItem.title}</p>
                                                        <p className="text-[9px] text-gray-500 font-medium uppercase truncate">{trackItem.artist}</p>
                                                    </div>
                                                </div>

                                                {trackItem.timestamp && (
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg shrink-0 ${
                                                        isCurrent ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-white/5 text-gray-500'
                                                    }`}>
                                                        {trackItem.timestamp}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Bottom Community Footer Banner */}
            <footer className="relative z-20 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-neon-purple/20 via-black/60 to-neon-cyan/20 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xl">
                    <div>
                        <h4 className="text-sm font-display font-black text-white uppercase italic tracking-wider">
                            Rejoins la communauté Dropsiders
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            Écoute, vote & publie tes propres mixes et prods
                        </p>
                    </div>
                    <Link
                        to="/communaute"
                        className="px-6 py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-neon-cyan transition-all shrink-0 shadow-lg active:scale-95"
                    >
                        Rejoindre
                    </Link>
                </div>
            </footer>
        </div>
    );
}
