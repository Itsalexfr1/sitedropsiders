import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Volume2, VolumeX, SkipForward, SkipBack, Play, Pause, Maximize2, Minimize2, Wifi, Radio, Film } from 'lucide-react';
import { TakeoverPage } from './TakeoverPage';
import { apiFetch } from '../utils/auth';
import { SEO } from '../components/utils/SEO';

declare global {
    interface Window {
        onYouTubeIframeAPIReady?: () => void;
        YT?: any;
    }
}

export interface TVVideo {
    id: string;
    title: string;
    description: string;
    youtubeId: string;
    promoId?: string;       // Optional promo video that plays AFTER this video
    promoTitle?: string;    // Label for the promo
}

const DEFAULT_TV_PLAYLIST: TVVideo[] = [
    {
        id: '1',
        title: 'Tomorrowland 2024 – Best of Mainstage Sets',
        description: 'Les sets légendaires et les moments les plus intenses de Tomorrowland',
        youtubeId: 'H5QLyGiDr_0'
    },
    {
        id: '2',
        title: 'Martin Garrix Live @ Amsterdam Music Festival',
        description: 'Set exclusif de Martin Garrix avec tous ses hymnes',
        youtubeId: 'iyIBWoFr7DY'
    },
    {
        id: '3',
        title: 'Ultra Music Festival Miami 2024 – Main Stage Highlights',
        description: 'L\'énergie brute d\'Ultra Miami en haute définition',
        youtubeId: 'tBQsniJdWi8'
    },
    {
        id: '4',
        title: 'EDC Las Vegas 2024 – Kineticfield Stage Recap',
        description: 'Le plus grand spectacle sous le ciel électrique de Las Vegas',
        youtubeId: 'y4fR1VbCqhI'
    },
    {
        id: '5',
        title: 'HARD Summer 2024 – Official Highlights',
        description: 'Basses lourdes et ambiance estivale sur la scène de HARD Summer',
        youtubeId: 'rFQJDcNzXw0'
    }
];

const STORAGE_PLAYLIST_KEY = 'dropsiders_tv_playlist_v2';

export function DropsidersTVPage() {
    const [playlist, setPlaylist] = useState<TVVideo[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_PLAYLIST_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_TV_PLAYLIST;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    // isPlayingPromo: true when the promo video for the current index is playing
    const [isPlayingPromo, setIsPlayingPromo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const [liveSettings, setLiveSettings] = useState<any>(null);
    const [loadingLive, setLoadingLive] = useState(true);
    const [forceLivePreview, setForceLivePreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const ytReadyRef = useRef(false);

    // Fetch site settings to detect live festival mode and official TV playlist from backend
    useEffect(() => {
        const checkSettings = async () => {
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const d = await res.json();
                    if (d?.takeover) {
                        setLiveSettings(d.takeover);
                    }
                    if (Array.isArray(d?.tv_playlist) && d.tv_playlist.length > 0) {
                        setPlaylist(d.tv_playlist);
                        try {
                            localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(d.tv_playlist));
                        } catch {}
                    }
                }
            } catch (err) {
                console.error("Erreur vérification live festival / TV settings:", err);
            } finally {
                setLoadingLive(false);
            }
        };

        checkSettings();
        const interval = setInterval(checkSettings, 25000);
        return () => clearInterval(interval);
    }, []);

    // The current video: if playing promo → use promoId of currentIndex video, else use main video
    const currentMainVideo = playlist[currentIndex] || playlist[0];
    const currentVideoId = isPlayingPromo && currentMainVideo?.promoId
        ? currentMainVideo.promoId
        : currentMainVideo?.youtubeId;
    const currentDisplayTitle = isPlayingPromo && currentMainVideo?.promoId
        ? (currentMainVideo.promoTitle || 'Vidéo Promo')
        : currentMainVideo?.title;

    // Advance to next main video
    const goNextMain = useCallback(() => {
        setIsPlayingPromo(false);
        setCurrentIndex((prev) => (prev + 1) % (playlist.length || 1));
    }, [playlist.length]);

    // When a video ends: check if there's a promo for the current main video
    const handleVideoEnded = useCallback(() => {
        if (!isPlayingPromo && currentMainVideo?.promoId) {
            // Play the promo
            setIsPlayingPromo(true);
        } else {
            // No promo (or promo just finished) → go to next main video
            goNextMain();
        }
    }, [isPlayingPromo, currentMainVideo, goNextMain]);

    const goNext = useCallback(() => {
        // Manual skip always goes to next MAIN video (skip promo)
        goNextMain();
    }, [goNextMain]);

    const goPrev = useCallback(() => {
        setIsPlayingPromo(false);
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % (playlist.length || 1));
    }, [playlist.length]);

    // YouTube Iframe API setup
    useEffect(() => {
        let isCancelled = false;

        const onYouTubeReady = () => {
            if (isCancelled) return;
            ytReadyRef.current = true;
            initPlayer();
        };

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player) return;
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch {}
                playerRef.current = null;
            }

            if (!currentVideoId) return;

            try {
                playerRef.current = new window.YT.Player('dropsiders-tv-yt-iframe', {
                    videoId: currentVideoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        modestbranding: 1,
                        rel: 0,
                        playsinline: 1,
                        enablejsapi: 1,
                        iv_load_policy: 3,
                        fs: 0,
                        origin: window.location.origin,
                    },
                    events: {
                        onReady: (event: any) => {
                            if (isMuted) event.target.mute();
                            else event.target.unMute();
                            event.target.playVideo();
                            setIsPlaying(true);
                        },
                        onStateChange: (event: any) => {
                            // YT.PlayerState.ENDED = 0
                            if (event.data === 0) {
                                handleVideoEnded();
                            } else if (event.data === 1) {
                                setIsPlaying(true);
                            } else if (event.data === 2) {
                                setIsPlaying(false);
                            }
                        }
                    }
                });
            } catch (e) {
                console.error("YouTube Player init error:", e);
            }
        };

        if (window.YT && window.YT.Player) {
            ytReadyRef.current = true;
            initPlayer();
        } else {
            const existingScript = document.getElementById('youtube-iframe-api');
            if (!existingScript) {
                const tag = document.createElement('script');
                tag.id = 'youtube-iframe-api';
                tag.src = 'https://www.youtube.com/iframe_api';
                document.body.appendChild(tag);
            }

            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prevCallback) prevCallback();
                onYouTubeReady();
            };
        }

        return () => {
            isCancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, isPlayingPromo, playlist, isMuted]);

    // Controls visibility timer
    const resetTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowControls(false), 4000);
    }, []);

    useEffect(() => {
        resetTimer();
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
    }, [currentIndex, isPlayingPromo, resetTimer]);

    const handlePlayPause = () => {
        if (!playerRef.current) {
            setIsPlaying(!isPlaying);
            return;
        }
        try {
            if (isPlaying) {
                playerRef.current.pauseVideo();
                setIsPlaying(false);
            } else {
                playerRef.current.playVideo();
                setIsPlaying(true);
            }
        } catch {
            setIsPlaying(!isPlaying);
        }
    };

    const handleToggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (playerRef.current) {
            try {
                if (nextMuted) playerRef.current.mute();
                else playerRef.current.unMute();
            } catch {}
        }
    };

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleFullscreen]);

    // Check if festival live takeover is active
    const isLiveFestivalActive = (!loadingLive && liveSettings?.enabled && liveSettings?.status === 'live') || forceLivePreview;

    if (loadingLive) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-10 h-10 rounded-full border-2 border-neon-red/20 border-t-neon-red" />
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        Connexion au signal DropsidersTV…
                    </p>
                </div>
            </div>
        );
    }

    // ─── FESTIVAL LIVE TAKEOVER OVERRIDE ───
    if (isLiveFestivalActive) {
        return (
            <>
                <SEO
                    title="DropsidersTV — DIRECT FESTIVAL EN COURS"
                    description="Festival en direct sur DropsidersTV ! Plusieurs scènes en live, programmation et chat en direct."
                />
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md shadow-2xl"
                    style={{ background: 'rgba(255, 18, 65, 0.92)', boxShadow: '0 0 30px rgba(255, 18, 65, 0.6)' }}
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span className="font-display italic">DROPSIDERS TV · FESTIVAL LIVE OVERRIDE ACTIF</span>
                    <Wifi className="w-3.5 h-3.5" />
                    {forceLivePreview && (
                        <button
                            onClick={() => setForceLivePreview(false)}
                            className="ml-2 px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-[9px] text-white/90"
                        >
                            Quitter preview
                        </button>
                    )}
                </div>
                <TakeoverPage initialSettings={liveSettings} />
            </>
        );
    }

    const fallbackEmbedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0&enablejsapi=1`;

    return (
        <>
            <SEO
                title="DropsidersTV — La Chaîne Électronique Non-Stop"
                description="Regardez les plus grands sets et moments de festivals en boucle sur DropsidersTV. Enchaînement automatique et direct festival."
            />
            <div
                ref={containerRef}
                className="relative w-full bg-black flex flex-col select-none overflow-hidden"
                style={{ minHeight: '100dvh' }}
                onMouseMove={resetTimer}
                onTouchStart={resetTimer}
            >
                {/* CRT / Scanlines Effect */}
                <div
                    className="fixed inset-0 pointer-events-none z-10 opacity-[0.035]"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.9) 2px, rgba(255,255,255,0.9) 3px)'
                    }}
                />

                {/* Top Overlay Bar */}
                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-5 flex items-center justify-between"
                            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neon-red/15 border border-neon-red/30 shadow-[0_0_15px_rgba(255,18,65,0.3)]">
                                    <Tv className="w-4 h-4 text-neon-red animate-pulse" />
                                    <span className="text-white font-black text-xs uppercase tracking-widest font-display">
                                        DROPSIDERS <span className="text-neon-red">TV</span>
                                    </span>
                                </div>
                                {/* Promo badge */}
                                {isPlayingPromo ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-purple bg-neon-purple/10 border border-neon-purple/30">
                                        <Film className="w-3 h-3 animate-pulse" />
                                        VIDÉO PROMO
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-red bg-neon-red/10 border border-neon-red/20">
                                        <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                        DIFFUSION CONTINUE
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {liveSettings?.enabled && (
                                    <button
                                        onClick={() => setForceLivePreview(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/15 border border-amber-400/30 hover:bg-amber-400/25 transition-all"
                                    >
                                        <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                        Mode Live Festival
                                    </button>
                                )}
                                <a
                                    href="/"
                                    className="text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors px-3 py-1.5 rounded-xl hover:bg-white/10"
                                >
                                    ← Quitter
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Player Container */}
                <div className="relative flex-1 w-full" style={{ minHeight: '100dvh' }}>
                    <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
                        <div id="dropsiders-tv-yt-iframe" className="w-full h-full border-0 pointer-events-none">
                            {/* Fallback iframe if YT api hasn't hydrated */}
                            <iframe
                                src={fallbackEmbedUrl}
                                className="w-full h-full border-0 pointer-events-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                title={currentDisplayTitle || 'DropsidersTV'}
                            />
                        </div>

                        {/* Shield overlay: blocks all clicking/seeking/scrubbing on YouTube progress bar */}
                        <div
                            className="absolute inset-0 z-[5] cursor-pointer"
                            onClick={handlePlayPause}
                            onDoubleClick={toggleFullscreen}
                        />
                    </div>

                    {/* Channel Watermark */}
                    <div className="absolute bottom-28 md:bottom-28 right-6 z-20 pointer-events-none opacity-40 flex items-center gap-2 drop-shadow-md">
                        <img src="/Logo.png" alt="Dropsiders" className="w-7 h-7 object-contain" />
                        <span className="text-white text-[10px] font-black uppercase tracking-widest font-display">
                            DROPSIDERS <span className="text-neon-red">TV</span>
                        </span>
                    </div>

                    {/* Bottom Controls Bar */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                initial={{ opacity: 0, y: 25 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 25 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-0 left-0 right-0 z-50 px-4 md:px-8 pb-6 pt-20"
                                style={{
                                    background: 'linear-gradient(0deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)'
                                }}
                            >
                                {/* Video Info */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {isPlayingPromo ? (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-neon-purple px-2.5 py-0.5 rounded-full bg-neon-purple/15 border border-neon-purple/30 flex items-center gap-1">
                                                <Film className="w-2.5 h-2.5" />
                                                Promo · après vidéo {currentIndex + 1}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-neon-red px-2.5 py-0.5 rounded-full bg-neon-red/15 border border-neon-red/30">
                                                Vidéo {currentIndex + 1} sur {playlist.length}
                                            </span>
                                        )}
                                        <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider">
                                            Enchaînement automatique
                                        </span>
                                        {!isPlayingPromo && currentMainVideo?.promoId && (
                                            <span className="text-[9px] font-bold text-neon-purple/50 uppercase tracking-wider flex items-center gap-1">
                                                <Film className="w-2.5 h-2.5" />
                                                → promo ensuite
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-white font-display font-black text-lg md:text-2xl uppercase italic tracking-tight truncate drop-shadow-lg">
                                        {currentDisplayTitle}
                                    </h2>
                                    {!isPlayingPromo && currentMainVideo?.description && (
                                        <p className="text-white/50 text-xs line-clamp-1 mt-0.5">
                                            {currentMainVideo.description}
                                        </p>
                                    )}
                                </div>

                                {/* Player Action Buttons */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={goPrev}
                                            title="Vidéo précédente"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            <SkipBack className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handlePlayPause}
                                            title={isPlaying ? "Pause" : "Lecture"}
                                            className="w-13 h-13 px-4 py-3 rounded-full flex items-center justify-center transition-all active:scale-95 text-white"
                                            style={{
                                                background: isPlayingPromo
                                                    ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                                    : 'linear-gradient(135deg, #ff1241, #c7002d)',
                                                boxShadow: isPlayingPromo
                                                    ? '0 4px 25px rgba(168, 85, 247, 0.5)'
                                                    : '0 4px 25px rgba(255, 18, 65, 0.5)'
                                            }}
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                        </button>
                                        <button
                                            onClick={goNext}
                                            title="Vidéo suivante (passe la promo)"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleToggleMute}
                                            title={isMuted ? "Activer le son" : "Couper le son"}
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white ml-1"
                                        >
                                            {isMuted ? <VolumeX className="w-4 h-4 text-neon-red" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <button
                                        onClick={toggleFullscreen}
                                        title={isFullscreen ? "Quitter le plein écran (F)" : "Plein écran (F)"}
                                        className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                    >
                                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
