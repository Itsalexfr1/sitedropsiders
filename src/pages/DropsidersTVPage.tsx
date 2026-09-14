import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Volume2, VolumeX, SkipForward, SkipBack, Play, Pause, Maximize2, Minimize2, Wifi, Plus, Trash2, RotateCcw, Settings, Radio } from 'lucide-react';
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

function extractYouTubeId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|watch\?v=|\&v=)([^#\&\?]{11})/);
    return match ? match[1] : null;
}

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
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');
    const [newVideoDesc, setNewVideoDesc] = useState('');

    const [liveSettings, setLiveSettings] = useState<any>(null);
    const [loadingLive, setLoadingLive] = useState(true);
    const [forceLivePreview, setForceLivePreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const ytReadyRef = useRef(false);

    // Fetch site settings to detect live festival mode
    useEffect(() => {
        const checkLive = async () => {
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const d = await res.json();
                    if (d?.takeover) {
                        setLiveSettings(d.takeover);
                    }
                }
            } catch (err) {
                console.error("Erreur vérification live festival:", err);
            } finally {
                setLoadingLive(false);
            }
        };

        checkLive();
        const interval = setInterval(checkLive, 25000);
        return () => clearInterval(interval);
    }, []);

    // Save playlist changes
    const updatePlaylist = (newPl: TVVideo[]) => {
        setPlaylist(newPl);
        try {
            localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(newPl));
        } catch {}
    };

    const currentVideo = playlist[currentIndex] || playlist[0];

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % (playlist.length || 1));
    }, [playlist.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % (playlist.length || 1));
    }, [playlist.length]);

    // YouTube Iframe API setup for automatic video chaining
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

            const video = playlist[currentIndex] || playlist[0];
            if (!video?.youtubeId) return;

            try {
                playerRef.current = new window.YT.Player('dropsiders-tv-yt-iframe', {
                    videoId: video.youtubeId,
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
                            // YT.PlayerState.ENDED is 0
                            if (event.data === 0) {
                                // Chaining: automatically go to next video!
                                goNext();
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
    }, [currentIndex, playlist, goNext]);

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
    }, [currentIndex, resetTimer]);

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

    const handleAddVideo = (e: React.FormEvent) => {
        e.preventDefault();
        const ytid = extractYouTubeId(newVideoUrl);
        if (!ytid) {
            alert('Lien YouTube invalide. Exemple: https://www.youtube.com/watch?v=VIDEO_ID');
            return;
        }
        const newVid: TVVideo = {
            id: `tv_${Date.now()}`,
            title: newVideoTitle.trim() || `Vidéo ${playlist.length + 1}`,
            description: newVideoDesc.trim() || 'Ajouté à la programmation DropsidersTV',
            youtubeId: ytid
        };
        const updated = [...playlist, newVid];
        updatePlaylist(updated);
        setNewVideoUrl('');
        setNewVideoTitle('');
        setNewVideoDesc('');
    };

    const handleDeleteVideo = (id: string) => {
        if (playlist.length <= 1) {
            alert('La chaîne doit contenir au moins une vidéo.');
            return;
        }
        const updated = playlist.filter(v => v.id !== id);
        updatePlaylist(updated);
        if (currentIndex >= updated.length) {
            setCurrentIndex(0);
        }
    };

    const handleResetPlaylist = () => {
        if (confirm('Réinitialiser la programmation par défaut ?')) {
            updatePlaylist(DEFAULT_TV_PLAYLIST);
            setCurrentIndex(0);
        }
    };

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
    // If a festival is active, the live site mode takes full control!
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

    const fallbackEmbedUrl = `https://www.youtube.com/embed/${currentVideo?.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0&enablejsapi=1`;

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
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-red bg-neon-red/10 border border-neon-red/20">
                                    <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                    NON-STOP STREAM
                                </div>
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
                                <button
                                    onClick={() => setShowConfigModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Playlist</span> ({playlist.length})
                                </button>
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
                                title={currentVideo?.title || 'DropsidersTV'}
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
                                        <span className="text-[9px] font-black uppercase tracking-widest text-neon-red px-2.5 py-0.5 rounded-full bg-neon-red/15 border border-neon-red/30">
                                            Vidéo {currentIndex + 1} sur {playlist.length}
                                        </span>
                                        <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider">
                                            Enchaînement automatique actif
                                        </span>
                                    </div>
                                    <h2 className="text-white font-display font-black text-lg md:text-2xl uppercase italic tracking-tight truncate drop-shadow-lg">
                                        {currentVideo?.title}
                                    </h2>
                                    {currentVideo?.description && (
                                        <p className="text-white/50 text-xs line-clamp-1 mt-0.5">
                                            {currentVideo.description}
                                        </p>
                                    )}
                                </div>

                                {/* Thumbnails Carousel */}
                                <div className="flex items-center gap-2.5 mb-5 overflow-x-auto no-scrollbar pb-1">
                                    {playlist.map((vid, idx) => {
                                        const isSelected = idx === currentIndex;
                                        return (
                                            <button
                                                key={vid.id}
                                                onClick={() => setCurrentIndex(idx)}
                                                className="flex-shrink-0 relative rounded-xl overflow-hidden transition-all text-left group"
                                                style={{
                                                    width: isSelected ? '120px' : '82px',
                                                    height: '56px',
                                                    border: isSelected ? '2px solid #ff1241' : '1px solid rgba(255,255,255,0.15)',
                                                    opacity: isSelected ? 1 : 0.55,
                                                    boxShadow: isSelected ? '0 0 15px rgba(255,18,65,0.5)' : 'none'
                                                }}
                                            >
                                                <img
                                                    src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`}
                                                    alt={vid.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                                                    <span className="text-[8px] font-black text-white truncate drop-shadow">
                                                        #{idx + 1}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                                )}
                                            </button>
                                        );
                                    })}
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
                                                background: 'linear-gradient(135deg, #ff1241, #c7002d)',
                                                boxShadow: '0 4px 25px rgba(255, 18, 65, 0.5)'
                                            }}
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                        </button>
                                        <button
                                            onClick={goNext}
                                            title="Vidéo suivante"
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

                {/* Playlist Manager Modal */}
                <AnimatePresence>
                    {showConfigModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl max-h-[85vh] flex flex-col"
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                    <div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic">
                                            Programmation DropsidersTV
                                        </h3>
                                        <p className="text-white/40 text-xs mt-1">
                                            Ajoutez vos liens YouTube pour personnaliser la diffusion enchaînée
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowConfigModal(false)}
                                        className="text-white/40 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold"
                                    >
                                        Fermer
                                    </button>
                                </div>

                                {/* Add video form */}
                                <form onSubmit={handleAddVideo} className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neon-red">
                                        Ajouter une vidéo YouTube
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Lien YouTube (ex: https://youtu.be/... ou https://youtube.com/watch?v=...)"
                                        value={newVideoUrl}
                                        onChange={(e) => setNewVideoUrl(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Titre de la vidéo (optionnel)"
                                        value={newVideoTitle}
                                        onChange={(e) => setNewVideoTitle(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 rounded-xl bg-neon-red text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neon-red/90 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Ajouter à la playlist
                                    </button>
                                </form>

                                {/* List of current videos */}
                                <div className="mt-5 flex-1 overflow-y-auto space-y-2 pr-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                                        Vidéos actuelles ({playlist.length})
                                    </div>
                                    {playlist.map((v, i) => (
                                        <div
                                            key={v.id}
                                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                                                i === currentIndex ? 'bg-neon-red/10 border-neon-red/30' : 'bg-white/5 border-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`}
                                                    alt={v.title}
                                                    className="w-12 h-8 rounded object-cover flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-white truncate">
                                                        #{i + 1} {v.title}
                                                    </div>
                                                    <div className="text-[10px] text-white/40 truncate">
                                                        ID: {v.youtubeId}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCurrentIndex(i);
                                                        setShowConfigModal(false);
                                                    }}
                                                    className="text-[10px] font-bold text-neon-red hover:underline px-2 py-1"
                                                >
                                                    Lire
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVideo(v.id)}
                                                    className="text-white/30 hover:text-red-400 p-1.5"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                                    <button
                                        onClick={handleResetPlaylist}
                                        className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Réinitialiser la playlist par défaut
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
