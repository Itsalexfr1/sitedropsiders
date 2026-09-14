import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Volume2, VolumeX, Volume1, SkipForward, SkipBack, Play, Pause, Maximize2, Minimize2, Radio, Film } from 'lucide-react';
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
}

const DEFAULT_MAIN_PLAYLIST: TVVideo[] = [
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

const DEFAULT_PROMO_PLAYLIST: PromoVideo[] = [];

const STORAGE_PLAYLIST_KEY = 'dropsiders_tv_playlist_v2';
const STORAGE_PROMOS_KEY = 'dropsiders_tv_promos_v2';

export function DropsidersTVPage() {
    const [playlist, setPlaylist] = useState<TVVideo[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_PLAYLIST_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_MAIN_PLAYLIST;
    });

    const [promos, setPromos] = useState<PromoVideo[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_PROMOS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {}
        return DEFAULT_PROMO_PLAYLIST;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    // isPlayingPromo: boolean indicating whether the current video playing is a promo
    const [isPlayingPromo, setIsPlayingPromo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(80);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const [liveSettings, setLiveSettings] = useState<any>(null);
    const [, setLoadingLive] = useState(true);

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const ytReadyRef = useRef(false);

    // Fetch site settings from backend
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
                    if (Array.isArray(d?.tv_promos)) {
                        setPromos(d.tv_promos);
                        try {
                            localStorage.setItem(STORAGE_PROMOS_KEY, JSON.stringify(d.tv_promos));
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

    // Current main video
    const currentMainVideo = playlist[currentIndex] || playlist[0];

    // Current promo derived according to user's rule:
    // Video 1 (index 0) -> Promo 1 (index 0)
    // Video 2 (index 1) -> Promo 2 (index 1)
    // Video 3 (index 2) -> Promo 3 or Promo 1 (index 2 % promos.length)
    const currentPromoIndex = promos.length > 0 ? (currentIndex % promos.length) : null;
    const currentPromo = isPlayingPromo && currentPromoIndex !== null ? promos[currentPromoIndex] : null;

    // Active YouTube ID & Display Title
    const currentVideoId = isPlayingPromo && currentPromo
        ? currentPromo.youtubeId
        : currentMainVideo?.youtubeId;

    const currentDisplayTitle = isPlayingPromo && currentPromo
        ? currentPromo.title
        : currentMainVideo?.title;

    // Next main video (skipping any active promo)
    const goNextMain = useCallback(() => {
        setIsPlayingPromo(false);
        setCurrentIndex((prev) => (prev + 1) % (playlist.length || 1));
    }, [playlist.length]);

    // Go to previous main video
    const goPrev = () => {
        setIsPlayingPromo(false);
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    };

    // Manual Skip always skips to next MAIN video directly
    const goNext = () => {
        goNextMain();
    };

    // Automated chaining rule:
    // Video 1 ends -> Promo 1 -> Video 2 -> Promo 2 -> Video 3 -> Promo 3 (or 1)
    const handleVideoEnded = useCallback(() => {
        if (isPlayingPromo) {
            // Promo just ended: move to the next main video!
            goNextMain();
        } else {
            // Main video just ended: if promos exist, play the interleaved promo!
            if (promos.length > 0) {
                setIsPlayingPromo(true);
            } else {
                goNextMain();
            }
        }
    }, [isPlayingPromo, promos.length, goNextMain]);



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

    // Initialize or load YouTube Player (SINGLE instance, no duplicate background iframes!)
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
                    if (isMuted) {
                        playerRef.current.mute();
                    } else {
                        playerRef.current.unMute();
                        playerRef.current.setVolume(volume);
                    }
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
                            if (isMuted) {
                                event.target.mute();
                            } else {
                                event.target.unMute();
                                event.target.setVolume(volume);
                            }
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
        // Only re-init when the actual video ID changes (avoids double-play on playlist/promos state updates)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentVideoId]);

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
                playerRef.current.setVolume(volume > 0 ? volume : 80);
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

    const handleVolumeChange = (newVol: number) => {
        setVolume(newVol);
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(newVol);
            if (newVol === 0) {
                playerRef.current.mute();
                setIsMuted(true);
            } else {
                if (isMuted) {
                    playerRef.current.unMute();
                    setIsMuted(false);
                }
            }
        }
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
                                {isPlayingPromo && currentPromoIndex !== null ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-purple bg-neon-purple/10 border border-neon-purple/30">
                                        <Film className="w-3 h-3 animate-pulse" />
                                        PROMO {currentPromoIndex + 1}/{promos.length}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-red bg-neon-red/10 border border-neon-red/20">
                                        <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                        DIFFUSION CONTINUE
                                    </div>
                                )}
                            </div>


                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Video Player Area with Zoom of 12% to crop out YouTube top header/title */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    {/* YouTube API target div with 12% zoom and slight upward shift to crop the top title bar */}
                    <div
                        id="tv-yt-player"
                        className="w-full h-full pointer-events-none"
                        style={{
                            transform: 'scale(1.2) translateY(-4.5%)',
                            transformOrigin: 'center center'
                        }}
                    />

                    {/* Transparent Click Shield: DOES NOT trigger Play/Pause on click (user request), double click toggles fullscreen */}
                    <div
                        onClick={resetControlsTimer}
                        onDoubleClick={toggleFullscreen}
                        className="absolute inset-0 z-10 cursor-default"
                        title="Double-clic pour plein écran"
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
                                className="absolute bottom-0 left-0 w-full z-30 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto"
                            >
                                {/* Video Info */}
                                <div className="mb-4">
                                    <h2 className="text-white font-display font-black text-lg md:text-2xl uppercase italic tracking-tight truncate drop-shadow-lg">
                                        {currentDisplayTitle}
                                    </h2>
                                </div>

                                {/* Controls Row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                                        {/* Prev */}
                                        <button
                                            onClick={goPrev}
                                            title="Vidéo précédente"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            <SkipBack className="w-4 h-4" />
                                        </button>

                                        {/* Play/Pause (only from button) */}
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

                                        {/* Skip Forward */}
                                        <button
                                            onClick={goNext}
                                            title="Vidéo suivante (passe directement au set suivant)"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                        </button>

                                        {/* Volume Control Group */}
                                        <div className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all">
                                            <button
                                                onClick={toggleMute}
                                                title={isMuted ? "Activer le son" : "Couper le son"}
                                                className="text-white hover:text-neon-red transition-colors"
                                            >
                                                {isMuted || volume === 0 ? (
                                                    <VolumeX className="w-4 h-4 text-neon-red" />
                                                ) : volume < 50 ? (
                                                    <Volume1 className="w-4 h-4" />
                                                ) : (
                                                    <Volume2 className="w-4 h-4" />
                                                )}
                                            </button>

                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={isMuted ? 0 : volume}
                                                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                                className="w-16 md:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-neon-red"
                                                title={`Volume: ${isMuted ? 0 : volume}%`}
                                            />
                                            <span className="text-[10px] font-mono font-bold text-white/50 w-7 text-right">
                                                {isMuted ? '0%' : `${volume}%`}
                                            </span>
                                        </div>
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
