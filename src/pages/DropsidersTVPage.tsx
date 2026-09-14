import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Volume2, VolumeX, Volume1, Play, Pause, Maximize2, Minimize2, Radio, Film, Settings, X, ListMusic, Home } from 'lucide-react';
import { SEO } from '../components/utils/SEO';
import { apiFetch } from '../utils/auth';
import { AdminTVModal } from '../components/admin/modals/AdminTVModal';

const checkAdminAuth = () => {
    try {
        if (localStorage.getItem('admin_auth_v2') === 'true') return true;
        if (localStorage.getItem('admin_auth') === 'true') return true;
        if (localStorage.getItem('modo_auth') === 'true') return true;
        if (localStorage.getItem('editeur_auth') === 'true') return true;
        if (localStorage.getItem('admin_user')) return true;
        if (localStorage.getItem('admin_password')) return true;
        if (localStorage.getItem('admin_session_id')) return true;
    } catch {}
    return false;
};

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

const TV_GLOBAL_ANCHOR = 1789420139214;

const DEFAULT_MAIN_PLAYLIST: TVVideo[] = [
    {
        id: 'tv_1789417248675',
        title: 'Wiley Live @ Lost Lands 2025 - Full Set',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '8YbWq5urfww',
        duration: 3600
    },
    {
        id: 'tv_1789421420308',
        title: 'Fisher WE2 | Tomorrowland 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'DuXXMZLfAkQ',
        duration: 4500
    },
    {
        id: 'tv_1789421482764',
        title: 'The Chainsmokers Live at EDC Las Vegas 2026 (Official Full Set)',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '3AQ_Srbe1lQ',
        duration: 4200
    },
    {
        id: 'tv_1789421504931',
        title: 'RÜFÜS DU SOL (DJ SET) - Mayan Warrior - Burning Man 2024',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'eQ-OVsdK-hM',
        duration: 5400
    },
    {
        id: 'tv_1789421516069',
        title: 'D-Block & S-te-Fan | Defqon.1 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'IEJUg98lIHs',
        duration: 3600
    },
    {
        id: 'tv_1789421527830',
        title: 'TOMAN | Awakenings Festival 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '5hj5UTZR_Ss',
        duration: 5400
    },
    {
        id: 'tv_1789421557683',
        title: 'JOHN SUMMIT LIVE @ ULTRA MIAMI MAIN STAGE 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'aloPGSlq31Y',
        duration: 4500
    },
    {
        id: 'tv_1789422346501',
        title: 'Ray Volpe Live @ Lost Lands 2025 - Full Set',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'nyaGV-jeST8',
        duration: 3600
    },
    {
        id: 'tv_1789422358781',
        title: 'Dimitri Vegas B2B Nico Moreno WE2 | Tomorrowland 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'OTKgBZS8if0',
        duration: 3600
    },
    {
        id: 'tv_1789422374723',
        title: 'Kaskade Live at EDC Las Vegas 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'l5wro3bMZWc',
        duration: 4500
    },
    {
        id: 'tv_1789422388915',
        title: 'ERIC PRYDZ LIVE @ ULTRA MUSIC FESTIVAL MIAMI 2026 |',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'hU-z3iV0LOg',
        duration: 4500
    },
    {
        id: 'tv_1789422401109',
        title: 'Joris Voorn x Kevin de Vries | Awakenings Festival 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '_MqFasX6Fas',
        duration: 5400
    },
    {
        id: 'tv_1789422409939',
        title: 'Ran-D & Adaro | Defqon.1 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'w4QJvock5Rk',
        duration: 3600
    },
    {
        id: 'tv_1789422422115',
        title: 'Mita Gami & Meir Briskman Orchestra Set - Mayan Warrior - Burning Man 2024',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'm8EAmSvzgAQ',
        duration: 5400
    },
    {
        id: 'tv_1789422704818',
        title: 'Tomorrowland Belgium 2026 | Official Aftermovie',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'k5yQBhDnrvM',
        duration: 1200
    },
    {
        id: 'tv_1789422726963',
        title: 'Laidback Luke B2B Chuckie Live at EDC Las Vegas 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'IzsShRhd5cw',
        duration: 4500
    },
    {
        id: 'tv_1789422747707',
        title: 'WORSHIP @ ULTRA MUSIC FESTIVAL MIAMI 2026 | UMF',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'V2lD_pq5c3M',
        duration: 3600
    },
    {
        id: 'tv_1789422759691',
        title: 'Mau P | Awakenings Festival 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'CNGB66x4ygk',
        duration: 5400
    },
    {
        id: 'tv_1789422770591',
        title: 'Coone | Defqon.1 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'fsHgYLT_FCc',
        duration: 3600
    },
    {
        id: 'tv_1789422784155',
        title: 'Keinemusik (&ME, Rampa, Adam Port) - Mayan Warrior - Burning Man 2022',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '2ECWX8GdDvA',
        duration: 6300
    }
];

const DEFAULT_PROMO_PLAYLIST: PromoVideo[] = [
    {
        id: 'promo_1789420138099',
        title: 'Tomorrowland Winter 2027 Promo',
        youtubeId: 'pQdsHoG2yhw',
        duration: 60
    },
    {
        id: 'promo_1789421449603',
        title: 'EDC Orlando 2026 Official Trailer',
        youtubeId: '61tiIdIrjUQ',
        duration: 60
    }
];

const DEFAULT_DURATIONS: Record<string, number> = {
    '8YbWq5urfww': 3600,
    'DuXXMZLfAkQ': 4500,
    '3AQ_Srbe1lQ': 4200,
    'eQ-OVsdK-hM': 5400,
    'IEJUg98lIHs': 3600,
    '5hj5UTZR_Ss': 5400,
    'aloPGSlq31Y': 4500,
    'nyaGV-jeST8': 3600,
    'OTKgBZS8if0': 3600,
    'l5wro3bMZWc': 4500,
    'hU-z3iV0LOg': 4500,
    '_MqFasX6Fas': 5400,
    'w4QJvock5Rk': 3600,
    'm8EAmSvzgAQ': 5400,
    'k5yQBhDnrvM': 1200,
    'IzsShRhd5cw': 4500,
    'V2lD_pq5c3M': 3600,
    'CNGB66x4ygk': 5400,
    'fsHgYLT_FCc': 3600,
    '2ECWX8GdDvA': 6300,
    'pQdsHoG2yhw': 60,
    '61tiIdIrjUQ': 60
};

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
        const mainDur = (durationsMap && durationsMap[mainVid.youtubeId]) || DEFAULT_DURATIONS[mainVid.youtubeId] || mainVid.duration || 3600;
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
                const promoDur = (durationsMap && durationsMap[promoVid.youtubeId]) || DEFAULT_DURATIONS[promoVid.youtubeId] || promoVid.duration || 60;
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

// Pure deterministic live continuous broadcast calculation:
// Every single device in the world opens the TV at the exact same segment and exact same second!
export function calculateLivePosition(
    segments: TVScheduleSegment[],
    startTime: number
): { index: number; isPromo: boolean; startSeconds: number } {
    if (!segments || segments.length === 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    const totalCycle = segments.reduce((sum, s) => sum + s.duration, 0);
    if (totalCycle <= 0) {
        return { index: 0, isPromo: false, startSeconds: 0 };
    }

    const now = Date.now();
    const effectiveStart = startTime > 0 ? startTime : TV_GLOBAL_ANCHOR;
    const elapsedTotal = Math.floor(Math.abs(now - effectiveStart) / 1000);
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
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_PROMO_PLAYLIST;
    });

    const [durationsMap, setDurationsMap] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_DURATIONS_KEY);
            if (saved) return { ...DEFAULT_DURATIONS, ...JSON.parse(saved) };
        } catch {}
        return DEFAULT_DURATIONS;
    });

    const [, setTvStartTime] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_START_TIME_KEY);
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed > 0) return parsed;
            }
        } catch {}
        return TV_GLOBAL_ANCHOR;
    });

    // Compute initial live position on initial render (Guaranteed synchronized world clock, never restarts at 0!)
    const [initialLive] = useState(() => {
        try {
            const savedPl = localStorage.getItem(STORAGE_PLAYLIST_KEY);
            const pl = savedPl ? JSON.parse(savedPl) : DEFAULT_MAIN_PLAYLIST;
            const savedPr = localStorage.getItem(STORAGE_PROMOS_KEY);
            const pr = savedPr ? JSON.parse(savedPr) : DEFAULT_PROMO_PLAYLIST;
            const savedDur = localStorage.getItem(STORAGE_DURATIONS_KEY);
            const dur = savedDur ? { ...DEFAULT_DURATIONS, ...JSON.parse(savedDur) } : DEFAULT_DURATIONS;
            const savedSt = localStorage.getItem(STORAGE_START_TIME_KEY);
            const st = savedSt ? parseInt(savedSt, 10) : TV_GLOBAL_ANCHOR;

            const segments = buildTVSegments(pl, pr, dur);
            return calculateLivePosition(segments, st);
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

    const [searchParams, setSearchParams] = useSearchParams();
    const hasAdminParam = searchParams.get('admin') === 'true';

    const [isAdmin, setIsAdmin] = useState(() => checkAdminAuth() || hasAdminParam);
    const [isAdminTVModalOpen, setIsAdminTVModalOpen] = useState(() => hasAdminParam);
    const [showSchedule, setShowSchedule] = useState(false);
    const prevMuteStateRef = useRef<boolean | null>(null);

    const allSegments = useMemo(() => buildTVSegments(playlist, promos, durationsMap), [playlist, promos, durationsMap]);

    useEffect(() => {
        const isAdm = checkAdminAuth();
        const adminFromUrl = searchParams.get('admin') === 'true';
        if (isAdm || adminFromUrl) {
            setIsAdmin(true);
        }
        if (adminFromUrl) {
            setIsAdminTVModalOpen(true);
            prevMuteStateRef.current = isMuted;
            if (playerRef.current && typeof playerRef.current.mute === 'function') {
                playerRef.current.mute();
            }
            setIsMuted(true);
        }
    }, [searchParams]);

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
        try {
            if (searchParams.has('admin')) {
                const next = new URLSearchParams(searchParams);
                next.delete('admin');
                setSearchParams(next, { replace: true });
            }
        } catch {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (prevMuteStateRef.current === false) {
            if (playerRef.current && typeof playerRef.current.unMute === 'function') {
                playerRef.current.unMute();
                playerRef.current.setVolume(volume);
            }
            setIsMuted(false);
        }
        prevMuteStateRef.current = null;
    };

    // Close admin modal on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isAdminTVModalOpen) closeAdminModal();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isAdminTVModalOpen]);

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

    // Next main video (skipping promos entirely) — used for the "À suivre" banner
    const nextMainIndex = (currentIndex + 1) % (playlist.length || 1);
    const nextMainVideo = playlist[nextMainIndex] || null;

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
        const el = containerRef.current as any;
        const doc = document as any;

        const isCurrentlyFullscreen = !!(
            doc.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement ||
            isFullscreen
        );

        if (!isCurrentlyFullscreen) {
            try {
                if (el?.requestFullscreen) {
                    el.requestFullscreen().catch(() => {});
                } else if (el?.webkitRequestFullscreen) {
                    el.webkitRequestFullscreen();
                } else if (el?.mozRequestFullScreen) {
                    el.mozRequestFullScreen();
                } else if (el?.msRequestFullscreen) {
                    el.msRequestFullscreen();
                }
            } catch {}
            setIsFullscreen(true);
        } else {
            try {
                if (doc.exitFullscreen) {
                    doc.exitFullscreen().catch(() => {});
                } else if (doc.webkitExitFullscreen) {
                    doc.webkitExitFullscreen();
                } else if (doc.mozCancelFullScreen) {
                    doc.mozCancelFullScreen();
                } else if (doc.msExitFullscreen) {
                    doc.msExitFullscreen();
                }
            } catch {}
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const doc = document as any;
            const isFull = !!(
                doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement
            );
            setIsFullscreen(isFull);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
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
                className={`${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-[100dvh]' : 'relative w-full h-[100dvh]'} bg-black overflow-hidden select-none flex flex-col justify-between`}
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
                    {showControls && !isAdminTVModalOpen && (
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
                                {isPlayingPromo && currentPromoIndex !== null && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neon-purple bg-neon-purple/10 border border-neon-purple/30">
                                        <Film className="w-3 h-3 animate-pulse" />
                                        PROMO {currentPromoIndex + 1}/{promos.length}
                                    </div>
                                )}

                                {/* Programmation Button: only displayed for admins, hidden for regular visitors */}
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowSchedule(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto shadow-lg"
                                        title="Voir toute la programmation continue (vidéos + promos)"
                                    >
                                        <ListMusic className="w-3 h-3 text-neon-red" />
                                        <span>Programmation ({allSegments.length})</span>
                                    </button>
                                )}
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

                                    {/* À suivre — next main set preview (promos skipped) */}
                                    {nextMainVideo && !isAdminTVModalOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 0.15 }}
                                            className="mt-2 flex items-center gap-2.5 group"
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35 shrink-0">À suivre</span>
                                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden max-w-[260px] md:max-w-[400px]">
                                                <div className="w-9 h-6 rounded-md overflow-hidden shrink-0 border border-white/10">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${nextMainVideo.youtubeId}/mqdefault.jpg`}
                                                        alt={nextMainVideo.title}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                    />
                                                </div>
                                                <span className="text-white/60 text-[10px] font-bold uppercase tracking-wide truncate">
                                                    {nextMainVideo.title}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Controls Row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 md:gap-4">
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
                                                className={`p-3 rounded-2xl border transition-all cursor-default flex items-center gap-3 ${
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
