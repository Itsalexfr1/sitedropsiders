import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Volume2, VolumeX, SkipForward, SkipBack, Play, Pause, Maximize2, Minimize2, Wifi, Radio, Film } from 'lucide-react';
import { SEO } from '../components/utils/SEO';
import { apiFetch } from '../utils/auth';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export interface PromoVideo {
    id: string;
    youtubeId: string;
    title: string;
}

export interface TVVideo {
    id: string;
    title: string;
    description: string;
    youtubeId: string;
    // Multiple promos chained sequentially after this main video
    promos?: PromoVideo[];
    // Legacy single promo support
    promoId?: string;
    promoTitle?: string;
}

export function getVideoPromos(video?: TVVideo): PromoVideo[] {
    if (!video) return [];
    if (Array.isArray(video.promos) && video.promos.length > 0) {
        return video.promos;
    }
    if (video.promoId) {
        return [{
            id: `${video.id}_legacy_promo`,
            youtubeId: video.promoId,
            title: video.promoTitle || 'Vidéo Promo'
        }];
    }
    return [];
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
    // currentPromoIndex: null when main video is playing, 0, 1, 2... for promo chain
    const [currentPromoIndex, setCurrentPromoIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [viewerCount, setViewerCount] = useState(128);
    const [liveSettings, setLiveSettings] = useState<any>(null);
    const [, setLoadingLive] = useState(true);

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    // Current main video and its promo list
    const currentMainVideo = playlist[currentIndex] || playlist[0];
    const activePromos = getVideoPromos(currentMainVideo);
    const isPlayingPromo = currentPromoIndex !== null && activePromos.length > 0;
    const currentPromo = isPlayingPromo && currentPromoIndex !== null ? activePromos[currentPromoIndex] : null;

    // Derived current YouTube ID & Title
    const currentVideoId = isPlayingPromo && currentPromo
        ? currentPromo.youtubeId
        : currentMainVideo?.youtubeId;

    const currentDisplayTitle = isPlayingPromo && currentPromo
        ? (currentPromo.title || 'Vidéo Promo')
        : currentMainVideo?.title;

    // Advance to next main video (cancelling promo state)
    const goNextMain = useCallback(() => {
        setCurrentPromoIndex(null);
        setCurrentIndex((prev) => (prev + 1) % (playlist.length || 1));
    }, [playlist.length]);

    // Go to previous main video
    const goPrev = () => {
        setCurrentPromoIndex(null);
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    };

    // Manual Skip always skips to next MAIN video (skips promo completely)
    const goNext = () => {
        goNextMain();
    };

    // Callback when a video finishes playing
    const handleVideoEnded = useCallback(() => {
        if (!currentMainVideo) return;
        const promos = getVideoPromos(currentMainVideo);

        if (currentPromoIndex === null) {
            // Main video ended: start first promo if any
            if (promos.length > 0) {
                setCurrentPromoIndex(0);
            } else {
                goNextMain();
            }
        } else {
            // Promo video ended: check if there is a next promo in chain
            if (currentPromoIndex + 1 < promos.length) {
                setCurrentPromoIndex(currentPromoIndex + 1);
            } else {
                // All promos finished: advance to next main video
                goNextMain();
            }
        }
    }, [currentMainVideo, currentPromoIndex, goNextMain]);

    // Live viewer simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setViewerCount((prev) => {
                const delta = Math.floor(Math.random() * 7) - 3;
                return Math.max(84, Math.min(320, prev + delta));
            });
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    // Auto-hide controls
    const resetControlsTimer = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 4500);
    };

    const handleMouseMove = () => resetControlsTimer();

    // YouTube Iframe API Loader
    useEffect(() => {
        if (window.YT && window.YT.Player) {
            ytReadyRef.current = true;
            return;
        }
        if (!document.getElementById('yt-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'yt-iframe-api';
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }
        window.onYouTubeIframeAPIReady = () => {
            ytReadyRef.current = true;
        };
    }, []);

    // Initialize or load YouTube Player
    useEffect(() => {
        if (!currentVideoId) return;

        let checkInterval: NodeJS.Timeout | null = null;

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player) return false;

            const targetDiv = document.getElementById('tv-yt-player');
            if (!targetDiv) return false;

            if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
                try {
                    playerRef.current.loadVideoById({
                        videoId: currentVideoId,
                        startSeconds: 0
                    });
                    if (isMuted) playerRef.current.mute();
                    else playerRef.current.unMute();
                    playerRef.current.playVideo();
                    setIsPlaying(true);
                    return true;
                } catch {
                    // fall through to recreate player
                }
            }

            try {
                playerRef.current = new window.YT.Player('tv-yt-player', {
                    videoId: currentVideoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        rel: 0,
                        iv_load_policy: 3,
                        playsinline: 1,
                        enablejsapi: 1,
                        mute: isMuted ? 1 : 0
                    },
                    events: {
                        onReady: (event: any) => {
                            if (isMuted) event.target.mute();
                            else event.target.unMute();
                            event.target.playVideo();
                            setIsPlaying(true);
                        },
                        onStateChange: (event: any) => {
                            // YT.PlayerState.ENDED === 0
                            if (event.data === 0) {
                                handleVideoEnded();
                            } else if (event.data === 1) {
                                setIsPlaying(true);
                            } else if (event.data === 2) {
                                setIsPlaying(false);
                            }
                        },
                        onError: () => {
                            setTimeout(() => goNextMain(), 2000);
                        }
                    }
                });
                return true;
            } catch (err) {
                console.error("Erreur init YT player:", err);
                return false;
            }
        };

        if (!initPlayer()) {
            checkInterval = setInterval(() => {
                if (initPlayer() && checkInterval) {
                    clearInterval(checkInterval);
                }
            }, 300);
        }

        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, currentPromoIndex, playlist, isMuted]);

    const togglePlay = () => {
        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
            const state = playerRef.current.getPlayerState();
            if (state === 1) {
                playerRef.current.pauseVideo();
                setIsPlaying(false);
            } else {
                playerRef.current.playVideo();
                setIsPlaying(true);
            }
        } else {
            setIsPlaying((prev) => !prev);
        }
        resetControlsTimer();
    };

    const toggleMute = () => {
        if (playerRef.current) {
            if (isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else {
                playerRef.current.mute();
                setIsMuted(true);
            }
        } else {
            setIsMuted((prev) => !prev);
        }
        resetControlsTimer();
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'KeyM') {
                e.preventDefault();
                toggleMute();
            } else if (e.code === 'KeyF') {
                e.preventDefault();
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    // Fallback embed url
    const fallbackEmbedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0&enablejsapi=1`;

    return (
        <>
            <SEO
                title="DropsidersTV – La Chaîne Live Non-Stop des Festivals Électro"
                description="Diffusion continue des meilleurs sets, recaps et moments forts des plus grands festivals électro du monde."
                image="https://img.youtube.com/vi/H5QLyGiDr_0/maxresdefault.jpg"
            />

            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                className="relative w-full h-[100dvh] bg-black overflow-hidden select-none flex flex-col justify-between"
            >
                {/* Live Takeover Banner Override */}
                {liveSettings?.enabled && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute top-0 left-0 w-full z-50 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan px-4 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            <span className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                                <Radio className="w-4 h-4" />
                                FESTIVAL EN DIRECT : {liveSettings.title || 'FESTIVAL LIVE'}
                            </span>
                        </div>
                        <a
                            href="/live"
                            className="px-3.5 py-1 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-wider hover:scale-105 transition-transform"
                        >
                            Basculer sur le Live →
                        </a>
                    </motion.div>
                )}

                {/* Top Channel Header Bar */}
                <AnimatePresence>
                    {showControls && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute ${liveSettings?.enabled ? 'top-14' : 'top-0'} left-0 w-full z-40 p-4 md:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                                    <Tv className="w-4 h-4 text-neon-red animate-pulse" />
                                    <span className="text-white font-display font-black text-sm uppercase tracking-tight">
                                        DROPSIDERS <span className="text-neon-red">TV</span>
                                    </span>
                                </div>
                                {/* Promo / Main badge */}
                                {isPlayingPromo ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-purple bg-neon-purple/10 border border-neon-purple/30">
                                        <Film className="w-3 h-3 animate-pulse" />
                                        {activePromos.length > 1 ? `PROMO ${currentPromoIndex! + 1}/${activePromos.length}` : 'VIDÉO PROMO'}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-red bg-neon-red/10 border border-neon-red/20">
                                        <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                        DIFFUSION CONTINUE
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-white/70 bg-black/60 backdrop-blur-md border border-white/10">
                                    <Wifi className="w-3 h-3 text-neon-green animate-pulse" />
                                    <span>{viewerCount} spectateurs</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Video Player Area */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    {/* YouTube API target div */}
                    <div
                        id="tv-yt-player"
                        className="w-full h-full pointer-events-none scale-105"
                    />

                    {/* Fallback iframe in case API failed */}
                    <div className="absolute inset-0 -z-10 pointer-events-none">
                        <iframe
                            src={fallbackEmbedUrl}
                            className="w-full h-full border-0 pointer-events-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={currentDisplayTitle || 'DropsidersTV'}
                        />
                    </div>

                    {/* Transparent Click Shield */}
                    <div
                        onClick={togglePlay}
                        onDoubleClick={toggleFullscreen}
                        className="absolute inset-0 z-10 cursor-pointer"
                        title="Cliquer pour Play/Pause, Double-cliquer pour Plein Écran"
                    />

                    {/* TV Logo Watermark */}
                    <div className="absolute bottom-6 right-6 z-20 pointer-events-none opacity-40 flex items-center gap-2">
                        <Tv className="w-5 h-5 text-neon-red" />
                        <span className="text-white font-display font-black text-xs uppercase tracking-widest">
                            DROPSIDERS <span className="text-neon-red">TV</span>
                        </span>
                    </div>

                    {/* Bottom Controls Bar */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-0 left-0 w-full z-30 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto"
                            >
                                {/* Video Info */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        {isPlayingPromo ? (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-neon-purple px-2.5 py-0.5 rounded-full bg-neon-purple/15 border border-neon-purple/30 flex items-center gap-1">
                                                <Film className="w-2.5 h-2.5" />
                                                Promo {currentPromoIndex! + 1}/{activePromos.length} · après vidéo {currentIndex + 1}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-neon-red px-2.5 py-0.5 rounded-full bg-neon-red/15 border border-neon-red/30">
                                                Vidéo {currentIndex + 1} sur {playlist.length}
                                            </span>
                                        )}
                                        <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider">
                                            Enchaînement automatique
                                        </span>
                                        {!isPlayingPromo && activePromos.length > 0 && (
                                            <span className="text-[9px] font-bold text-neon-purple/70 uppercase tracking-wider flex items-center gap-1">
                                                <Film className="w-2.5 h-2.5" />
                                                → {activePromos.length} promo{activePromos.length > 1 ? 's' : ''} ensuite
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

                                {/* Controls Row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <button
                                            onClick={goPrev}
                                            title="Vidéo précédente"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            <SkipBack className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={togglePlay}
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
                                            title="Vidéo suivante (passe directement au set suivant)"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={toggleMute}
                                            title={isMuted ? "Activer le son" : "Couper le son"}
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            {isMuted ? <VolumeX className="w-4 h-4 text-neon-red" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleFullscreen}
                                            title="Plein écran (F)"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
