import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Volume2, VolumeX, Volume1, SkipForward, SkipBack, Play, Pause, Maximize2, Minimize2, Radio, Film, Settings, X, ListMusic, Home } from 'lucide-react';
import { SEO } from '../components/utils/SEO';
import { apiFetch } from '../utils/auth';
import { AdminTVModal } from '../components/admin/modals/AdminTVModal';

const disableCaptions = (player: any) => {
    if (!player) return;
    const execute = () => {
        try {
            if (typeof player.unloadModule === 'function') {
                player.unloadModule("captions");
                player.unloadModule("cc");
            }
            if (typeof player.setOption === 'function') {
                player.setOption("captions", "track", {});
                player.setOption("cc", "track", {});
                player.setOption("captions", "reload", false);
                player.setOption("captions", "fontSize", -1);
            }
        } catch {}
    };
    execute();
    setTimeout(execute, 150);
    setTimeout(execute, 600);
    setTimeout(execute, 1500);
};

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
    duration?: number;
}

export interface TVVideo {
    id: string;
    title: string;
    description: string;
    youtubeId: string;
    duration?: number;
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
const STORAGE_START_TIME_KEY = 'dropsiders_tv_start_time';
const STORAGE_STATE_KEY = 'dropsiders_tv_state';
const STORAGE_DURATIONS_KEY = 'dropsiders_tv_durations';

export interface TVScheduleSegment {
    type: 'main' | 'promo';
    index: number;
    video: TVVideo | PromoVideo;
    duration: number;
}

// Build the ordered broadcast schedule:
// Video 1 -> Promo 1 -> Video 2 -> Promo 2 -> Video 3 -> Promo 3 (or 1) etc.
export function buildTVSegments(
    playlist: TVVideo[],
    promos: PromoVideo[],
    durationsMap: Record<string, number>
): TVScheduleSegment[] {
    if (!playlist || playlist.length === 0) return [];

    const segments: TVScheduleSegment[] = [];
    const hasPromos = Array.isArray(promos) && promos.length > 0;

    for (let i = 0; i < playlist.length; i++) {
        const mainVid = playlist[i];
        if (!mainVid) continue;
        const mainDur = (durationsMap && durationsMap[mainVid.youtubeId]) || mainVid.duration || 300;
        segments.push({
            type: 'main',
            index: i,
            video: mainVid,
            duration: Math.max(15, mainDur)
        });

        if (hasPromos) {
            const promoIdx = i % promos.length;
            const promoVid = promos[promoIdx];
            if (promoVid) {
                const promoDur = (durationsMap && durationsMap[promoVid.youtubeId]) || promoVid.duration || 30;
                segments.push({
                    type: 'promo',
                    index: promoIdx,
                    video: promoVid,
                    duration: Math.max(5, promoDur)
                });
            }
        }
    }

    return segments;
}

// Calculate the exact live continuous position so the TV never starts from 0 on page visit
export function calculateLivePosition(
    segments: TVScheduleSegment[],
    startTime: number,
    savedState?: { index: number; isPromo: boolean; currentTime: number; updatedAt: number } | null
): { index: number; isPromo: boolean; startSeconds: number } {
    if (!segments || segments.length === 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    const now = Date.now();

    // Priority 1: If there is a state saved recently (within the last 4 hours)
    if (savedState && savedState.updatedAt && now >= savedState.updatedAt && (now - savedState.updatedAt) < 4 * 3600 * 1000) {
        const elapsedSec = (now - savedState.updatedAt) / 1000;
        let segIdx = segments.findIndex(s =>
            (s.type === (savedState.isPromo ? 'promo' : 'main')) && s.index === savedState.index
        );
        if (segIdx === -1) segIdx = 0;

        let curTime = (savedState.currentTime || 0) + elapsedSec;
        while (curTime >= segments[segIdx].duration) {
            curTime -= segments[segIdx].duration;
            segIdx = (segIdx + 1) % segments.length;
        }

        const targetSeg = segments[segIdx];
        return {
            index: targetSeg.index,
            isPromo: targetSeg.type === 'promo',
            startSeconds: Math.floor(curTime)
        };
    }

    // Priority 2: Synchronized global timeline from broadcast start time
    const totalCycle = segments.reduce((sum, s) => sum + s.duration, 0);
    if (totalCycle <= 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    const effectiveStart = startTime > 0 ? startTime : now;
    const elapsedTotal = Math.max(0, (now - effectiveStart) / 1000);
    let cyclePos = elapsedTotal % totalCycle;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (cyclePos < seg.duration) {
            return {
                index: seg.index,
                isPromo: seg.type === 'promo',
                startSeconds: Math.floor(cyclePos)
            };
        }
        cyclePos -= seg.duration;
    }

    const first = segments[0];
    return {
        index: first.index,
        isPromo: first.type === 'promo',
        startSeconds: 0
    };
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

    const [durationsMap, setDurationsMap] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_DURATIONS_KEY);
            if (saved) return JSON.parse(saved);
        } catch {}
        return {};
    });

    const [, setTvStartTime] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_START_TIME_KEY);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed > 0) return parsed;
            }
        } catch {}
        return Date.now();
    });

    // Compute initial live position on initial render (Never restarts at 0 on page visit!)
    const [initialLive] = useState(() => {
        try {
            const savedPl = localStorage.getItem(STORAGE_PLAYLIST_KEY);
            const pl = savedPl ? JSON.parse(savedPl) : DEFAULT_MAIN_PLAYLIST;
            const savedPr = localStorage.getItem(STORAGE_PROMOS_KEY);
            const pr = savedPr ? JSON.parse(savedPr) : DEFAULT_PROMO_PLAYLIST;
            const savedDur = localStorage.getItem(STORAGE_DURATIONS_KEY);
            const dur = savedDur ? JSON.parse(savedDur) : {};
            const savedSt = localStorage.getItem(STORAGE_START_TIME_KEY);
            const st = savedSt ? parseInt(savedSt, 10) : Date.now();
            const savedStateStr = localStorage.getItem(STORAGE_STATE_KEY);
            const savedState = savedStateStr ? JSON.parse(savedStateStr) : null;

            const segments = buildTVSegments(pl, pr, dur);
            return calculateLivePosition(segments, st, savedState);
        } catch {
            return { index: 0, isPromo: false, startSeconds: 0 };
        }
    });

    const [currentIndex, setCurrentIndex] = useState(initialLive.index);
    const [isPlayingPromo, setIsPlayingPromo] = useState(initialLive.isPromo);
    const pendingSeekRef = useRef<number | null>(initialLive.startSeconds);

    const [isPlaying, setIsPlaying] = useState(true);
    // Start muted by default to guarantee instant browser autoplay without policy restrictions
    const [isMuted, setIsMuted] = useState(() => {
        try {
            const saved = localStorage.getItem('dropsiders_tv_muted');
            if (saved !== null) return saved === 'true';
        } catch {}
        return true;
    });
    const [volume, setVolume] = useState(80);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const [liveSettings, setLiveSettings] = useState<any>(null);
    const [, setLoadingLive] = useState(true);

    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminTVModalOpen, setIsAdminTVModalOpen] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const prevMuteStateRef = useRef<boolean | null>(null);

    const allSegments = useMemo(() => buildTVSegments(playlist, promos, durationsMap), [playlist, promos, durationsMap]);

    useEffect(() => {
        try {
            const adminAuth = localStorage.getItem('admin_auth_v2') === 'true';
            const modoAuth = localStorage.getItem('modo_auth') === 'true';
            const isAdm = adminAuth || modoAuth;
            setIsAdmin(isAdm);

            const params = new URLSearchParams(window.location.search);
            if (params.get('admin') === 'true' && isAdm) {
                openAdminModal();
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch {}
    }, []);

    const openAdminModal = () => {
        prevMuteStateRef.current = isMuted;
        if (playerRef.current && typeof playerRef.current.mute === 'function') {
            playerRef.current.mute();
        }
        setIsMuted(true);
        setIsAdminTVModalOpen(true);
    };

    const closeAdminModal = () => {
        setIsAdminTVModalOpen(false);
        if (prevMuteStateRef.current === false) {
            if (playerRef.current && typeof playerRef.current.unMute === 'function') {
                playerRef.current.unMute();
                playerRef.current.setVolume(volume);
            }
            setIsMuted(false);
        }
        prevMuteStateRef.current = null;
    };

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const ytReadyRef = useRef(false);

    // Save newly discovered video duration for precise TV clock calculation
    const recordDuration = useCallback((videoId: string, durSec: number) => {
        if (!videoId || durSec <= 5) return;
        setDurationsMap(prev => {
            if (prev[videoId] === durSec) return prev;
            const updated = { ...prev, [videoId]: durSec };
            try {
                localStorage.setItem(STORAGE_DURATIONS_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
        });
    }, []);

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
                    if (d?.tv_start_time && typeof d.tv_start_time === 'number') {
                        setTvStartTime(d.tv_start_time);
                        try {
                            localStorage.setItem(STORAGE_START_TIME_KEY, d.tv_start_time.toString());
                        } catch {}
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

    // Real-time listener: When Admin clicks "Enregistrer", seamlessly update playlist & promos without interrupting or restarting playback
    useEffect(() => {
        const handleTvUpdate = (data: { startTime?: number; playlist?: TVVideo[]; promos?: PromoVideo[] }) => {
            if (Array.isArray(data.playlist) && data.playlist.length > 0) {
                setPlaylist(data.playlist);
            }
            if (Array.isArray(data.promos)) {
                setPromos(data.promos);
            }
            if (data.startTime) {
                setTvStartTime(data.startTime);
            }
            // Continuous TV broadcast: keep playing currently active stream without resetting to 0!
        };

        let channel: BroadcastChannel | null = null;
        try {
            channel = new BroadcastChannel('dropsiders_tv_sync');
            channel.onmessage = (event) => {
                if (event?.data?.type === 'TV_SCHEDULE_UPDATED') {
                    handleTvUpdate(event.data);
                }
            };
        } catch {}

        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_START_TIME_KEY && e.newValue) {
                const st = parseInt(e.newValue, 10);
                if (st) setTvStartTime(st);
            }
            if (e.key === STORAGE_PLAYLIST_KEY && e.newValue) {
                try {
                    const pl = JSON.parse(e.newValue);
                    if (Array.isArray(pl) && pl.length > 0) setPlaylist(pl);
                } catch {}
            }
            if (e.key === STORAGE_PROMOS_KEY && e.newValue) {
                try {
                    const pr = JSON.parse(e.newValue);
                    if (Array.isArray(pr)) setPromos(pr);
                } catch {}
            }
        };

        window.addEventListener('storage', handleStorage);

        return () => {
            if (channel) channel.close();
            window.removeEventListener('storage', handleStorage);
        };
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
        pendingSeekRef.current = 0; // Natural transition starts from beginning
        setIsPlayingPromo(false);
        setCurrentIndex((prev) => (prev + 1) % (playlist.length || 1));
    }, [playlist.length]);

    // Go to previous main video
    const goPrev = () => {
        pendingSeekRef.current = 0;
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
        pendingSeekRef.current = 0;
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

    // Heartbeat: continuously record the current TV playback position every 2s
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            try {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    const curTime = playerRef.current.getCurrentTime();
                    if (typeof curTime === 'number' && curTime >= 0) {
                        localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify({
                            index: currentIndex,
                            isPromo: isPlayingPromo,
                            currentTime: Math.floor(curTime),
                            updatedAt: Date.now()
                        }));
                    }
                }
            } catch {}
        }, 2000);

        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, isPlayingPromo]);

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

            const startSec = pendingSeekRef.current ?? 0;
            pendingSeekRef.current = null;

            if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
                try {
                    playerRef.current.loadVideoById({
                        videoId: currentVideoId,
                        startSeconds: startSec
                    });
                    disableCaptions(playerRef.current);
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
                        cc_load_policy: 0,
                        cc_lang_pref: 'none',
                        hl: 'fr',
                        playsinline: 1,
                        enablejsapi: 1,
                        start: startSec,
                        mute: isMuted ? 1 : 0
                    },
                    events: {
                        onReady: (event: any) => {
                            disableCaptions(event.target);
                            if (startSec > 0) {
                                try {
                                    event.target.seekTo(startSec, true);
                                } catch {}
                            }
                            if (isMuted) {
                                event.target.mute();
                            } else {
                                event.target.unMute();
                                event.target.setVolume(volume);
                            }
                            event.target.playVideo();
                            setIsPlaying(true);

                            // Capture actual video duration for TV schedule precision
                            try {
                                const dur = event.target.getDuration();
                                if (dur && dur > 5) {
                                    recordDuration(currentVideoId, Math.round(dur));
                                }
                            } catch {}
                        },
                        onApiChange: (event: any) => {
                            disableCaptions(event.target);
                        },
                        onStateChange: (event: any) => {
                            disableCaptions(event.target);
                            // YT.PlayerState.ENDED === 0
                            if (event.data === 0) {
                                handleVideoEnded();
                            } else if (event.data === 1) {
                                setIsPlaying(true);
                                try {
                                    const dur = event.target.getDuration();
                                    if (dur && dur > 5) {
                                        recordDuration(currentVideoId, Math.round(dur));
                                    }
                                } catch {}
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
                try {
                    localStorage.setItem('dropsiders_tv_muted', 'false');
                } catch {}
            } else {
                playerRef.current.mute();
                setIsMuted(true);
                try {
                    localStorage.setItem('dropsiders_tv_muted', 'true');
                } catch {}
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
                try {
                    localStorage.setItem('dropsiders_tv_muted', 'true');
                } catch {}
            } else {
                if (isMuted) {
                    playerRef.current.unMute();
                    setIsMuted(false);
                    try {
                        localStorage.setItem('dropsiders_tv_muted', 'false');
                    } catch {}
                }
            }
        }
    };

    // Unmute on first user screen interaction if currently muted
    const handleShieldClick = () => {
        resetControlsTimer();
        if (isMuted && playerRef.current) {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume > 0 ? volume : 80);
            setIsMuted(false);
            try {
                localStorage.setItem('dropsiders_tv_muted', 'false');
            } catch {}
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
                            <div className="flex items-center gap-3 flex-wrap">
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

                                {/* Programmation Button: displays complete sequence of videos + promos */}
                                <button
                                    onClick={() => setShowSchedule(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto shadow-lg"
                                    title="Voir toute la programmation continue (vidéos + promos)"
                                >
                                    <ListMusic className="w-3 h-3 text-neon-red" />
                                    <span>Programmation ({allSegments.length})</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Admin TV Settings Button */}
                                {isAdmin && (
                                    <button
                                        onClick={openAdminModal}
                                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
                                        title="Gérer la programmation Dropsiders TV & Live"
                                    >
                                        <Settings className="w-3.5 h-3.5 text-neon-red" />
                                        <span className="hidden sm:inline">Gestion TV</span>
                                    </button>
                                )}

                                {/* Back to site button */}
                                <a
                                    href="/"
                                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
                                    title="Retour sur le site Dropsiders"
                                >
                                    <Home className="w-3.5 h-3.5 text-neon-cyan" />
                                    <span className="hidden sm:inline">Site</span>
                                </a>

                                {/* Unmute alert button when muted (ensures user discovers sound easily) */}
                                {isMuted && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={toggleMute}
                                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neon-red hover:bg-neon-red/90 text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-neon-red/40 transition-all active:scale-95 animate-pulse cursor-pointer pointer-events-auto"
                                    >
                                        <VolumeX className="w-3.5 h-3.5" />
                                        <span>Activer le son</span>
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Video Player Area */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    {/* YouTube API target div with slightly reduced zoom to keep bottom controls fully visible */}
                    <div
                        id="tv-yt-player"
                        className="w-full h-full pointer-events-none"
                        style={{
                            transform: isAdminTVModalOpen
                                ? 'scale(1.3) translateY(-4%)'
                                : 'scale(1.12) translateY(-3.5%)',
                            transformOrigin: 'center center',
                            filter: isAdminTVModalOpen ? 'blur(20px) brightness(0.35)' : 'none',
                            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease'
                        }}
                    />

                    {/* Transparent Click Shield: DOES NOT trigger Play/Pause on click (user request), single click un-mutes, double click toggles fullscreen */}
                    <div
                        onClick={handleShieldClick}
                        onDoubleClick={toggleFullscreen}
                        className="absolute inset-0 z-10 cursor-default"
                        title={isMuted ? "Cliquer pour activer le son · Double-clic pour plein écran" : "Double-clic pour plein écran"}
                    />

                    {/* TV Logo Watermark */}
                    <div className="absolute bottom-20 md:bottom-24 right-6 z-20 pointer-events-none opacity-40 flex items-center gap-2">
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
                                className="absolute bottom-0 left-0 w-full z-30 px-4 md:px-6 pb-4 md:pb-6 pt-10 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-auto"
                            >
                                {/* Video Info */}
                                <div className="mb-3">
                                    <h2 className="text-white font-display font-black text-base md:text-xl uppercase italic tracking-tight truncate drop-shadow-lg">
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

                {/* Modal Dropsiders TV & Live */}
                <AdminTVModal
                    isOpen={isAdminTVModalOpen}
                    onClose={closeAdminModal}
                    takeoverState={liveSettings}
                    onTakeoverChange={(updated) => setLiveSettings(updated)}
                />

                {/* Modal: Programmation Complète (Vidéos + Promos) */}
                <AnimatePresence>
                    {showSchedule && (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-[#0e0e0e]/95 border border-white/10 rounded-[2rem] p-5 sm:p-7 max-w-3xl w-full max-h-[85vh] shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />

                                {/* Header */}
                                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center text-neon-red">
                                            <ListMusic className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-display font-black text-white uppercase italic tracking-tight">
                                                PROGRAMMATION <span className="text-neon-red">TV</span> ({allSegments.length})
                                            </h3>
                                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                                                Grille continue · Sets principaux & Promos intercalées
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSchedule(false)}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* List of segments */}
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
                                    {allSegments.map((seg, i) => {
                                        const isCurrentlyPlaying = seg.type === (isPlayingPromo ? 'promo' : 'main') && seg.index === (isPlayingPromo ? currentPromoIndex : currentIndex);
                                        return (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    if (seg.type === 'main') {
                                                        setCurrentIndex(seg.index);
                                                        setIsPlayingPromo(false);
                                                    } else {
                                                        setCurrentIndex(seg.index);
                                                        setIsPlayingPromo(true);
                                                    }
                                                    pendingSeekRef.current = 0;
                                                    setShowSchedule(false);
                                                }}
                                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                                    isCurrentlyPlaying
                                                        ? 'bg-neon-red/10 border-neon-red/50 shadow-lg shadow-neon-red/10 ring-1 ring-neon-red/30'
                                                        : seg.type === 'promo'
                                                        ? 'bg-neon-purple/[0.03] border-neon-purple/20 hover:border-neon-purple/40 ml-4 md:ml-6'
                                                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                                                }`}
                                            >
                                                <div className={`w-7 h-7 rounded-xl border flex items-center justify-center text-[10px] font-black font-mono shrink-0 ${
                                                    isCurrentlyPlaying
                                                        ? 'bg-neon-red text-white border-neon-red animate-pulse'
                                                        : seg.type === 'promo'
                                                        ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
                                                        : 'bg-white/5 text-white/70 border-white/10'
                                                }`}>
                                                    {seg.type === 'promo' ? `P${seg.index + 1}` : `#${seg.index + 1}`}
                                                </div>

                                                <div className="w-16 h-10 rounded-lg bg-black overflow-hidden relative shrink-0 border border-white/10">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${seg.video.youtubeId}/mqdefault.jpg`}
                                                        alt={seg.video.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                            seg.type === 'promo'
                                                                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                                                                : 'bg-neon-red/15 text-neon-red border border-neon-red/30'
                                                        }`}>
                                                            {seg.type === 'promo' ? 'Promo' : 'Set Principal'}
                                                        </span>
                                                        {isCurrentlyPlaying && (
                                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white text-black animate-pulse">
                                                                En Direct
                                                            </span>
                                                        )}
                                                        <h4 className="text-white font-bold text-xs truncate">
                                                            {seg.video.title}
                                                        </h4>
                                                    </div>
                                                    <div className="text-[10px] text-white/40 font-mono mt-0.5 flex items-center gap-3">
                                                        <span>ID: {seg.video.youtubeId}</span>
                                                        {seg.duration > 0 && (
                                                            <span>Durée : {Math.floor(seg.duration / 60)}m {seg.duration % 60}s</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
