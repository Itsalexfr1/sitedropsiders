import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Volume2, VolumeX, Volume1, Play, Pause, Maximize2, Minimize2, Radio, Film, Settings, X, ListMusic, Home, Clock, CalendarDays, ChevronRight, Shuffle, Share2, Sparkles } from 'lucide-react';
import { SEO } from '../components/utils/SEO';
import { apiFetch } from '../utils/auth';
import { AdminTVModal } from '../components/admin/modals/AdminTVModal';
import { TVShareScheduleModal } from '../components/tv/TVShareScheduleModal';
import type { TVScheduleBlock, TVVideoCategory } from '../utils/tvSchedule';
import { 
    DEFAULT_TV_BLOCKS, 
    STORAGE_TV_BLOCKS_KEY, 
    getActiveTVBlock, 
    getSeededShuffle, 
    buildBlockSegments, 
    calculateBlockLivePosition,
    getElapsedSecondsInBlock,
    DAYS_OF_WEEK,
    getBlocksForDay,
    formatBlockDays,
    DEFAULT_DURATIONS,
    detectVideoCategory
} from '../utils/tvSchedule';

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
    category?: TVVideoCategory;
}

// ── EPG / 5 Time Blocks ──────────────────────────────────────────────────
export type { TVScheduleBlock };

function formatMins(secs: number): string {
    const m = Math.round(secs / 60);
    if (m <= 0) return 'maintenant';
    if (m >= 60) {
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return rem > 0 ? `${h}h${String(rem).padStart(2, '0')}` : `${h}h`;
    }
    return `${m}min`;
}

function toHHMM(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
    // 5 Time Blocks state
    const [tvBlocks, setTvBlocks] = useState<TVScheduleBlock[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_TV_BLOCKS;
    });

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

    // Compute active block & its shuffled videos for today
    const [currentHourState, setCurrentHourState] = useState(() => new Date().getHours());
    const [currentDayState, setCurrentDayState] = useState(() => new Date().getDay());
    const [epgSelectedDay, setEpgSelectedDay] = useState<number>(() => new Date().getDay());
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'clip' | 'liveset' | 'interview'>('all');

    // Auto-update hour and day on 30s heartbeat to guarantee seamless show transitions
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const h = now.getHours();
            const d = now.getDay();
            setCurrentHourState(prevH => (prevH !== h ? h : prevH));
            setCurrentDayState(prevD => (prevD !== d ? d : prevD));
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    const activeScheduleBlock = useMemo(() => {
        return getActiveTVBlock(tvBlocks, currentHourState, currentDayState);
    }, [tvBlocks, currentHourState, currentDayState]);

    const activeBlockVideos = useMemo(() => {
        const raw = activeScheduleBlock.videos && activeScheduleBlock.videos.length > 0 
            ? activeScheduleBlock.videos 
            : playlist;
        if (activeScheduleBlock.randomize === false) return raw;
        const todayStr = new Date().toISOString().slice(0, 10);
        return getSeededShuffle(raw, `${todayStr}_${activeScheduleBlock.id}`);
    }, [activeScheduleBlock, playlist]);

    // Compute initial live position in the active block
    const [initialLive] = useState(() => {
        try {
            const savedBlocks = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
            const blks = savedBlocks ? JSON.parse(savedBlocks) : DEFAULT_TV_BLOCKS;
            const now = new Date();
            const curBlk = getActiveTVBlock(blks, now.getHours(), now.getDay());
            const savedPl = localStorage.getItem(STORAGE_PLAYLIST_KEY);
            const pl = savedPl ? JSON.parse(savedPl) : DEFAULT_MAIN_PLAYLIST;
            const rawVids = curBlk.videos && curBlk.videos.length > 0 ? curBlk.videos : pl;
            const todayStr = now.toISOString().slice(0, 10);
            const vids = curBlk.randomize === false ? rawVids : getSeededShuffle(rawVids, `${todayStr}_${curBlk.id}`);

            const savedPr = localStorage.getItem(STORAGE_PROMOS_KEY);
            const pr = savedPr ? JSON.parse(savedPr) : DEFAULT_PROMO_PLAYLIST;
            const savedDur = localStorage.getItem(STORAGE_DURATIONS_KEY);
            const dur = savedDur ? { ...DEFAULT_DURATIONS, ...JSON.parse(savedDur) } : DEFAULT_DURATIONS;

            const segs = buildBlockSegments(vids, pr, dur);
            const elapsed = getElapsedSecondsInBlock(curBlk, now);
            return calculateBlockLivePosition(segs, elapsed);
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
    const [isShareScheduleOpen, setIsShareScheduleOpen] = useState(false);
    const prevMuteStateRef = useRef<boolean | null>(hasAdminParam ? false : null);

    const isAdminTVModalOpenRef = useRef(isAdminTVModalOpen);
    isAdminTVModalOpenRef.current = isAdminTVModalOpen;
    const isMutedRef = useRef(isMuted);
    isMutedRef.current = isMuted;
    const volumeRef = useRef(volume);
    volumeRef.current = volume;
    const currentLoadedVideoIdRef = useRef<string | null>(null);

    const [isYtApiReady, setIsYtApiReady] = useState(() => {
        return !!(typeof window !== 'undefined' && window.YT && window.YT.Player);
    });
    const initPlayerRef = useRef<() => boolean>(() => false);

    const allSegments = useMemo(() => buildBlockSegments(activeBlockVideos, promos, durationsMap), [activeBlockVideos, promos, durationsMap]);

    useEffect(() => {
        const isAdm = checkAdminAuth();
        const adminFromUrl = searchParams.get('admin') === 'true';
        if (isAdm || adminFromUrl) {
            setIsAdmin(true);
        }
        if (adminFromUrl) {
            setIsAdminTVModalOpen(true);
            isAdminTVModalOpenRef.current = true;
            if (prevMuteStateRef.current === null) {
                prevMuteStateRef.current = isMuted;
            }
            if (playerRef.current && typeof playerRef.current.mute === 'function') {
                try { playerRef.current.mute(); } catch {}
            }
            setIsMuted(true);
            isMutedRef.current = true;
        }
    }, [searchParams]);

    // Whenever the admin edit modal is opened, strictly mute the video
    useEffect(() => {
        if (isAdminTVModalOpen) {
            isAdminTVModalOpenRef.current = true;
            if (prevMuteStateRef.current === null) {
                prevMuteStateRef.current = isMuted;
            }
            setIsMuted(true);
            isMutedRef.current = true;
            if (playerRef.current && typeof playerRef.current.mute === 'function') {
                try { playerRef.current.mute(); } catch {}
            }
        }
    }, [isAdminTVModalOpen]);

    const openAdminModal = () => {
        prevMuteStateRef.current = isMuted;
        isAdminTVModalOpenRef.current = true;
        if (playerRef.current && typeof playerRef.current.mute === 'function') {
            try { playerRef.current.mute(); } catch {}
        }
        setIsMuted(true);
        isMutedRef.current = true;
        setIsAdminTVModalOpen(true);
    };

    const closeAdminModal = () => {
        setIsAdminTVModalOpen(false);
        isAdminTVModalOpenRef.current = false;

        // Remove ?admin=true from URL cleanly without harsh re-mounts
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('admin')) {
                url.searchParams.delete('admin');
                window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
            }
        } catch {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Unconditionally unmute video when closing the admin modal so the user has sound directly
        setIsMuted(false);
        isMutedRef.current = false;
        try {
            localStorage.setItem('dropsiders_tv_muted', 'false');
        } catch {}

        const targetVol = volumeRef.current > 0 ? volumeRef.current : 80;

        if (playerRef.current && typeof playerRef.current.unMute === 'function') {
            try {
                playerRef.current.unMute();
                playerRef.current.setVolume(targetVol);
                const state = playerRef.current.getPlayerState();
                if (state !== 1) { // 1 = PLAYING
                    playerRef.current.playVideo();
                }
                setIsPlaying(true);
            } catch {}
        }
        prevMuteStateRef.current = null;

        // Ensure playback continues and volume/unmute is applied smoothly without resetting video position
        setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.unMute === 'function') {
                try {
                    playerRef.current.unMute();
                    playerRef.current.setVolume(targetVol);
                    const state = playerRef.current.getPlayerState();
                    if (state !== 1) {
                        playerRef.current.playVideo();
                    }
                    setIsPlaying(true);
                } catch {}
            }
        }, 150);

        setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.unMute === 'function') {
                try {
                    playerRef.current.unMute();
                    playerRef.current.setVolume(targetVol);
                } catch {}
            }
        }, 400);
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

    // ── EPG / Time Block State ─────────────────────────────────────────────
    const [showEPG, setShowEPG] = useState(false);
    const [epgTimeRemaining, setEpgTimeRemaining] = useState<number | null>(null);

    // Update hour and detect block changes every minute
    const prevBlockIdRef = useRef(activeScheduleBlock.id);
    useEffect(() => {
        const tick = () => {
            const h = new Date().getHours();
            setCurrentHourState(h);
            const fresh = getActiveTVBlock(tvBlocks, h);
            if (fresh.id !== prevBlockIdRef.current) {
                prevBlockIdRef.current = fresh.id;
                pendingSeekRef.current = 0;
                setCurrentIndex(0);
                setIsPlayingPromo(false);
            }
        };
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [tvBlocks]);

    // Poll YT player every 5s to get seconds remaining in current video
    useEffect(() => {
        const poll = () => {
            try {
                if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
                    const dur = playerRef.current.getDuration();
                    const cur = playerRef.current.getCurrentTime();
                    if (dur > 0 && cur >= 0) setEpgTimeRemaining(Math.max(0, Math.floor(dur - cur)));
                }
            } catch {}
        };
        poll();
        const id = setInterval(poll, 5_000);
        return () => clearInterval(id);
    }, [currentIndex, isPlayingPromo]);

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
                    if (Array.isArray(d?.tv_blocks) && d.tv_blocks.length > 0) {
                        setTvBlocks(d.tv_blocks);
                        try {
                            localStorage.setItem(STORAGE_TV_BLOCKS_KEY, JSON.stringify(d.tv_blocks));
                        } catch {}
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

    // Real-time listener: When Admin clicks "Enregistrer", seamlessly update blocks, playlist & promos
    useEffect(() => {
        const handleTvUpdate = (data: { startTime?: number; playlist?: TVVideo[]; promos?: PromoVideo[]; blocks?: TVScheduleBlock[] }) => {
            if (Array.isArray(data.blocks) && data.blocks.length > 0) {
                setTvBlocks(data.blocks);
            }
            if (Array.isArray(data.playlist) && data.playlist.length > 0) {
                setPlaylist(data.playlist);
            }
            if (Array.isArray(data.promos)) {
                setPromos(data.promos);
            }
            if (data.startTime) {
                setTvStartTime(data.startTime);
            }
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
            if (e.key === STORAGE_TV_BLOCKS_KEY && e.newValue) {
                try {
                    const blks = JSON.parse(e.newValue);
                    if (Array.isArray(blks) && blks.length > 0) setTvBlocks(blks);
                } catch {}
            }
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

    // Current main video from active block
    const currentMainVideo = activeBlockVideos[currentIndex] || activeBlockVideos[0];

    // Current promo derived according to rule:
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
    const nextMainIndex = (currentIndex + 1) % (activeBlockVideos.length || 1);
    const nextMainVideo = activeBlockVideos[nextMainIndex] || null;

    // EPG: list of upcoming main sets with projected start times (promos skipped)
    const upcomingMainSets = useMemo(() => {
        if (activeBlockVideos.length === 0 || epgTimeRemaining === null) return [];
        const result: { video: TVVideo; startAt: Date }[] = [];
        let offset = epgTimeRemaining; // seconds until current video ends
        const now = new Date();
        for (let i = 0; i < Math.min(8, activeBlockVideos.length); i++) {
            const idx = (nextMainIndex + i) % activeBlockVideos.length;
            const video = activeBlockVideos[idx];
            const startAt = new Date(now.getTime() + offset * 1000);
            result.push({ video, startAt });
            offset += video.duration ?? 3600;
        }
        return result;
    }, [activeBlockVideos, nextMainIndex, epgTimeRemaining]);

    const filteredUpcomingSets = useMemo(() => {
        if (selectedCategory === 'all') return upcomingMainSets;
        return upcomingMainSets.filter(({ video }) => {
            const cat = video.category || detectVideoCategory(video.title, video.description);
            return cat === selectedCategory;
        });
    }, [upcomingMainSets, selectedCategory]);

    // Next main video (skipping any active promo)
    const goNextMain = useCallback(() => {
        pendingSeekRef.current = 0; // Natural transition starts from beginning
        setIsPlayingPromo(false);
        setCurrentIndex((prev) => (prev + 1) % (activeBlockVideos.length || 1));
    }, [activeBlockVideos.length]);

    // Go to previous main video
    const goPrev = () => {
        pendingSeekRef.current = 0;
        setIsPlayingPromo(false);
        setCurrentIndex((prev) => (prev - 1 + activeBlockVideos.length) % activeBlockVideos.length);
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

    // YouTube Iframe API Loader with reactive state
    useEffect(() => {
        if (window.YT && window.YT.Player) {
            ytReadyRef.current = true;
            setIsYtApiReady(true);
            return;
        }

        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof prevReady === 'function') {
                try { prevReady(); } catch {}
            }
            ytReadyRef.current = true;
            setIsYtApiReady(true);
        };

        if (!document.getElementById('yt-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'yt-iframe-api';
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const pollTimer = setInterval(() => {
            if (window.YT && window.YT.Player) {
                ytReadyRef.current = true;
                setIsYtApiReady(true);
                clearInterval(pollTimer);
            }
        }, 200);

        return () => clearInterval(pollTimer);
    }, []);

    // Initialize or load YouTube Player
    const initPlayer = useCallback(() => {
        if (!window.YT || !window.YT.Player) return false;

        let targetDiv = document.getElementById('tv-yt-player');
        if (!targetDiv) {
            const slot = document.getElementById('tv-yt-player-slot');
            if (slot) {
                slot.innerHTML = '<div id="tv-yt-player" class="w-full h-full"></div>';
                targetDiv = document.getElementById('tv-yt-player');
            }
        }
        if (!targetDiv) return false;

        const startSec = pendingSeekRef.current ?? 0;

        // If player already exists and its iframe is currently attached in the DOM
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
            try {
                const iframe = typeof playerRef.current.getIframe === 'function' ? playerRef.current.getIframe() : null;
                if (iframe && document.body.contains(iframe)) {
                    // IF THE SAME VIDEO IS ALREADY LOADED, NEVER RELOAD OR RESTART TO 0!
                    if (currentLoadedVideoIdRef.current === currentVideoId) {
                        if (isAdminTVModalOpenRef.current || isMutedRef.current) {
                            try { playerRef.current.mute(); } catch {}
                        } else {
                            try {
                                playerRef.current.unMute();
                                playerRef.current.setVolume(volumeRef.current > 0 ? volumeRef.current : 80);
                            } catch {}
                        }
                        try {
                            const st = playerRef.current.getPlayerState();
                            if (st !== 1) {
                                playerRef.current.playVideo();
                            }
                        } catch {}
                        return true;
                    }

                    // A different video is requested
                    currentLoadedVideoIdRef.current = currentVideoId;
                    pendingSeekRef.current = null;
                    playerRef.current.loadVideoById({
                        videoId: currentVideoId,
                        startSeconds: startSec
                    });
                    disableCaptions(playerRef.current);
                    if (isAdminTVModalOpenRef.current || isMutedRef.current) {
                        playerRef.current.mute();
                    } else {
                        playerRef.current.unMute();
                        playerRef.current.setVolume(volumeRef.current > 0 ? volumeRef.current : 80);
                    }
                    playerRef.current.playVideo();
                    setIsPlaying(true);
                    return true;
                }
            } catch {
                playerRef.current = null;
            }
        }

        pendingSeekRef.current = null;
        try {
            currentLoadedVideoIdRef.current = currentVideoId;
            playerRef.current = new window.YT.Player('tv-yt-player', {
                width: '100%',
                height: '100%',
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
                    mute: 1, // Start muted for 100% reliable autoplay across all browsers
                    origin: typeof window !== 'undefined' ? window.location.origin : undefined
                },
                events: {
                    onReady: (event: any) => {
                        currentLoadedVideoIdRef.current = currentVideoId;
                        disableCaptions(event.target);
                        try {
                            event.target.mute();
                        } catch {}

                        if (startSec > 0) {
                            try {
                                event.target.seekTo(startSec, true);
                            } catch {}
                        }

                        // Strictly MUTE if admin edit modal is currently open!
                        if (isAdminTVModalOpenRef.current) {
                            try {
                                event.target.mute();
                            } catch {}
                        } else if (!isMutedRef.current) {
                            try {
                                event.target.unMute();
                                event.target.setVolume(volumeRef.current > 0 ? volumeRef.current : 80);
                            } catch {}
                        }

                        try {
                            event.target.playVideo();
                        } catch {}
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
                        if (event.data === 0) {
                            handleVideoEnded();
                        } else if (event.data === 1) {
                            setIsPlaying(true);
                            // Keep muted if admin modal is open
                            if (isAdminTVModalOpenRef.current) {
                                try {
                                    event.target.mute();
                                } catch {}
                            }
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
    }, [currentVideoId, handleVideoEnded, goNextMain, recordDuration]);

    useEffect(() => {
        initPlayerRef.current = initPlayer;
    }, [initPlayer]);

    useEffect(() => {
        if (!currentVideoId || !isYtApiReady) return;

        let checkInterval: NodeJS.Timeout | null = null;
        if (!initPlayer()) {
            checkInterval = setInterval(() => {
                if (initPlayer() && checkInterval) {
                    clearInterval(checkInterval);
                }
            }, 250);
        }

        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
    }, [currentVideoId, isYtApiReady]);

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

    // Unmute & ensure playback on user screen interaction
    const handleShieldClick = () => {
        resetControlsTimer();
        if (playerRef.current) {
            try {
                if (typeof playerRef.current.getPlayerState === 'function') {
                    const state = playerRef.current.getPlayerState();
                    if (state !== 1) {
                        playerRef.current.playVideo();
                        setIsPlaying(true);
                    }
                } else if (typeof playerRef.current.playVideo === 'function') {
                    playerRef.current.playVideo();
                    setIsPlaying(true);
                }
            } catch {}

            if (isMuted && typeof playerRef.current.unMute === 'function') {
                try {
                    playerRef.current.unMute();
                    playerRef.current.setVolume(volume > 0 ? volume : 80);
                    setIsMuted(false);
                    localStorage.setItem('dropsiders_tv_muted', 'false');
                } catch {}
            }
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
            } else if (e.code === 'KeyG') {
                e.preventDefault();
                setShowEPG(prev => !prev);
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
                                <div className="flex flex-col px-3.5 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 shadow-xl">
                                    <div className="flex items-center gap-2">
                                        <Tv className="w-3.5 h-3.5 text-neon-red animate-pulse" />
                                        <span className="text-white font-display font-black text-sm uppercase tracking-tight leading-none">
                                            DROPSIDERS <span className="text-neon-red">TV</span>
                                        </span>
                                    </div>
                                    <span
                                        className="text-[10px] font-black uppercase tracking-wider mt-1 leading-none"
                                        style={{ color: activeScheduleBlock?.color || '#00f0ff' }}
                                    >
                                        {isPlayingPromo ? 'Promo Dropsiders' : activeScheduleBlock?.title}
                                    </span>
                                </div>

                                {/* Partager le programme button: accessible to all viewers */}
                                <button
                                    onClick={() => setIsShareScheduleOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white hover:text-white bg-gradient-to-r from-neon-red/30 to-neon-purple/30 hover:from-neon-red/50 hover:to-neon-purple/50 border border-neon-red/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer pointer-events-auto shadow-[0_0_15px_rgba(255,18,65,0.2)] hover:shadow-[0_0_20px_rgba(255,18,65,0.4)]"
                                    title="Partager le programme du jour avec la vraie durée des sets"
                                >
                                    <Sparkles className="w-3 h-3 text-neon-cyan animate-pulse" />
                                    <span className="hidden xs:inline">Partager le programme</span>
                                    <span className="xs:hidden">Programme</span>
                                </button>

                                {/* Filtre de catégorie : Tout / Liveset / Clip / Interview */}
                                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/15 p-1 rounded-full shadow-lg">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                            selectedCategory === 'all'
                                                ? 'bg-white text-black shadow'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Tout
                                    </button>
                                    <button
                                        onClick={() => setSelectedCategory('liveset')}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                            selectedCategory === 'liveset'
                                                ? 'bg-neon-cyan text-black shadow'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        title="Filtrer les Livesets"
                                    >
                                        <span>🎪</span>
                                        <span className="hidden sm:inline">Liveset</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedCategory('clip')}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                            selectedCategory === 'clip'
                                                ? 'bg-neon-purple text-white shadow'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        title="Filtrer les Clips"
                                    >
                                        <span>🎬</span>
                                        <span className="hidden sm:inline">Clips</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedCategory('interview')}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                            selectedCategory === 'interview'
                                                ? 'bg-neon-red text-white shadow'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        title="Filtrer les Interviews"
                                    >
                                        <span>🎙️</span>
                                        <span className="hidden sm:inline">Interviews</span>
                                    </button>
                                </div>

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
                    {/* Outer wrapper with zoom & blur effects managed by React */}
                    <div
                        className="w-full h-full pointer-events-none"
                        style={{
                            transform: isAdminTVModalOpen
                                ? 'scale(1.3) translateY(-4%)'
                                : 'scale(1.12) translateY(-3.5%)',
                            transformOrigin: 'center center',
                            filter: isAdminTVModalOpen ? 'blur(20px) brightness(0.35)' : 'none',
                            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease'
                        }}
                    >
                        {/* Dedicated slot for YouTube iframe - React won't re-create or diff changing styles on this element */}
                        <div id="tv-yt-player-slot" className="w-full h-full">
                            <div id="tv-yt-player" className="w-full h-full" />
                        </div>
                    </div>

                    {/* Transparent Click Shield: on tap or click, ensures playback starts & un-mutes, double click toggles fullscreen */}
                    <div
                        onClick={handleShieldClick}
                        onTouchEnd={handleShieldClick}
                        onDoubleClick={toggleFullscreen}
                        className="absolute inset-0 z-10 cursor-pointer"
                        title={isMuted ? "Cliquer pour activer le son · Double-clic pour plein écran" : "Double-clic pour plein écran"}
                    />

                    {/* Prominent Play Overlay when playback is not active (essential for mobile browser autoplay policy) */}
                    {!isPlaying && !isAdminTVModalOpen && (
                        <div
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            onTouchEnd={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] cursor-pointer pointer-events-auto"
                        >
                            <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-black/85 border border-white/20 shadow-2xl active:scale-95 transition-transform">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-neon-red to-neon-purple flex items-center justify-center shadow-lg shadow-neon-red/50 animate-pulse">
                                    <Play className="w-8 h-8 fill-white text-white ml-1" />
                                </div>
                                <div className="text-center">
                                    <span className="text-white font-display font-black text-sm md:text-base uppercase tracking-wider block">
                                        Lancer le direct
                                    </span>
                                    <span className="text-neon-cyan text-xs font-bold mt-1 block">
                                        {activeScheduleBlock?.title}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            onClick={() => setIsShareScheduleOpen(true)}
                                            title="Partager le programme du jour"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red/40 transition-all active:scale-95 text-white cursor-pointer shadow-lg"
                                        >
                                            <Share2 className="w-4 h-4 text-neon-cyan" />
                                        </button>
                                        <button
                                            onClick={toggleFullscreen}
                                            title="Plein écran (F)"
                                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 transition-all active:scale-95 text-white cursor-pointer"
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

                {/* Modal: Partager le Programme du Jour (Vraies durées des sets) */}
                <TVShareScheduleModal
                    isOpen={isShareScheduleOpen}
                    onClose={() => setIsShareScheduleOpen(false)}
                    tvBlocks={tvBlocks}
                    durationsMap={durationsMap}
                    promos={promos}
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
                {/* EPG Guide Modal */}
                <AnimatePresence>
                    {showEPG && (
                        <div
                            className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl"
                            onClick={() => setShowEPG(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 30 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-[#0a0a0a]/98 border border-white/10 rounded-[2rem] p-5 sm:p-7 max-w-lg w-full max-h-[82vh] shadow-2xl relative overflow-hidden flex flex-col"
                            >
                                {/* Accent top bar */}
                                <div
                                    className="absolute top-0 left-0 w-full h-0.5 rounded-t-[2rem]"
                                    style={{ background: `linear-gradient(90deg, ${activeScheduleBlock.color}, #8b5cf6, #06b6d4)` }}
                                />

                                {/* Header */}
                                <div className="flex items-center justify-between mb-3 shrink-0">
                                    <div>
                                        <h3 className="text-white font-display font-black text-lg uppercase italic tracking-tight">Guide des Programmes</h3>
                                        <p className="text-white/35 text-[10px] uppercase tracking-widest mt-0.5">
                                            DropsidersTV · {DAYS_OF_WEEK.find(d => d.value === epgSelectedDay)?.label || 'Semaine'} {epgSelectedDay === currentDayState ? '(Aujourd\'hui)' : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowEPG(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Day selection tabs */}
                                <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
                                    {DAYS_OF_WEEK.map(d => {
                                        const isSelected = epgSelectedDay === d.value;
                                        const isToday = currentDayState === d.value;
                                        const dayBlockCount = getBlocksForDay(tvBlocks, d.value).length;
                                        return (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => setEpgSelectedDay(d.value)}
                                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                                                    isSelected
                                                        ? 'bg-white text-black border-white shadow-md font-black'
                                                        : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                                                }`}
                                            >
                                                <span>{d.short}</span>
                                                {isToday && (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-500' : 'bg-neon-cyan animate-pulse'}`} title="Aujourd'hui" />
                                                )}
                                                <span className={`text-[9px] font-mono ${isSelected ? 'text-black/60 font-black' : 'text-white/40'}`}>
                                                    ({dayBlockCount})
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {(() => {
                                    const epgDayBlocks = getBlocksForDay(tvBlocks, epgSelectedDay);
                                    const isSelectedDayToday = epgSelectedDay === currentDayState;

                                    return (
                                        <>
                                            {/* Category filter tabs */}
                                            <div className="flex items-center gap-1.5 mb-3 bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCategory('all')}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex-1 text-center cursor-pointer ${
                                                        selectedCategory === 'all'
                                                            ? 'bg-white text-black shadow font-black'
                                                            : 'text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    Tout
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCategory('liveset')}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex-1 text-center cursor-pointer flex items-center justify-center gap-1 ${
                                                        selectedCategory === 'liveset'
                                                            ? 'bg-neon-cyan text-black shadow font-black'
                                                            : 'text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    <span>🎪</span>
                                                    <span>Liveset</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCategory('clip')}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex-1 text-center cursor-pointer flex items-center justify-center gap-1 ${
                                                        selectedCategory === 'clip'
                                                            ? 'bg-neon-purple text-white shadow font-black'
                                                            : 'text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    <span>🎬</span>
                                                    <span>Clip</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCategory('interview')}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex-1 text-center cursor-pointer flex items-center justify-center gap-1 ${
                                                        selectedCategory === 'interview'
                                                            ? 'bg-neon-red text-white shadow font-black'
                                                            : 'text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    <span>🎙️</span>
                                                    <span>Interview</span>
                                                </button>
                                            </div>

                                            {/* Blocks timeline strip for the selected day */}
                                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
                                                {epgDayBlocks.length === 0 && (
                                                    <div className="py-2 text-white/40 text-xs italic">
                                                        Aucune émission programmée ce jour.
                                                    </div>
                                                )}
                                                {epgDayBlocks.map(block => {
                                                    const isActive = isSelectedDayToday && block.id === activeScheduleBlock.id;
                                                    return (
                                                        <div
                                                            key={block.id}
                                                            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border shrink-0 transition-all"
                                                            style={{
                                                                background: isActive ? `${block.color}20` : 'rgba(255,255,255,0.04)',
                                                                borderColor: isActive ? `${block.color}60` : 'rgba(255,255,255,0.08)',
                                                            }}
                                                        >
                                                            <span className="text-base">{block.emoji}</span>
                                                            <span
                                                                className="text-[7px] font-black uppercase tracking-widest whitespace-nowrap font-mono"
                                                                style={{ color: isActive ? block.color : 'rgba(255,255,255,0.40)' }}
                                                            >
                                                                {block.timeSlot}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-white/70 max-w-[90px] truncate text-center">
                                                                {block.title}
                                                            </span>
                                                            {isActive && (
                                                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: block.color }} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* If today: show live block banner and upcoming sets */}
                                            {isSelectedDayToday ? (
                                                <>
                                                    {/* Current block banner */}
                                                    <div
                                                        className="mb-3 px-4 py-3 rounded-2xl border shrink-0"
                                                        style={{ background: `${activeScheduleBlock.color}12`, borderColor: `${activeScheduleBlock.color}40` }}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs">{activeScheduleBlock.emoji}</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: activeScheduleBlock.color }}>
                                                                {activeScheduleBlock.name} · {activeScheduleBlock.title} ({activeScheduleBlock.timeSlot})
                                                            </span>
                                                            <span className="ml-auto flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeScheduleBlock.color }} />
                                                                <span className="text-[8px] font-bold text-white/35 uppercase">En cours</span>
                                                            </span>
                                                        </div>
                                                        <p className="text-white font-bold text-sm truncate">{isPlayingPromo ? 'Clip promo' : currentDisplayTitle}</p>
                                                        {epgTimeRemaining !== null && !isPlayingPromo && (
                                                            <p className="text-white/35 text-[10px] mt-0.5">Se termine dans {formatMins(epgTimeRemaining)}</p>
                                                        )}
                                                    </div>

                                                    {/* Upcoming sets list */}
                                                    <div className="overflow-y-auto flex-1 space-y-1.5 pr-0.5 custom-scrollbar">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-white/25 text-[9px] font-black uppercase tracking-widest">
                                                                À venir aujourd'hui {selectedCategory !== 'all' ? `(${selectedCategory})` : ''}
                                                            </p>
                                                            <span className="text-[8px] font-mono text-white/30">
                                                                {filteredUpcomingSets.length} vidéo(s)
                                                            </span>
                                                        </div>
                                                        {filteredUpcomingSets.length === 0 && (
                                                            <p className="text-white/25 text-xs text-center py-6">
                                                                Aucun élément trouvé pour cette catégorie dans la file d'attente immédiate.
                                                            </p>
                                                        )}
                                                        {filteredUpcomingSets.map(({ video, startAt }, i) => {
                                                            const videoCat = video.category || detectVideoCategory(video.title, video.description);
                                                            return (
                                                                <div
                                                                    key={`epg-${i}-${video.id}`}
                                                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors group"
                                                                >
                                                                    <div className="flex flex-col items-center w-10 shrink-0">
                                                                        <span className="text-[9px] font-black text-white/30 font-mono">{toHHMM(startAt)}</span>
                                                                        {i === 0 && (
                                                                            <ChevronRight className="w-3 h-3 mt-0.5" style={{ color: activeScheduleBlock.color }} />
                                                                        )}
                                                                    </div>
                                                                    <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                                        <img
                                                                            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                                                            alt={video.title}
                                                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                        <span className="text-white/65 text-xs font-semibold truncate group-hover:text-white transition-colors">
                                                                            {video.title}
                                                                        </span>
                                                                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 border ${
                                                                            videoCat === 'interview'
                                                                                ? 'bg-neon-red/15 text-neon-red border-neon-red/30'
                                                                                : videoCat === 'clip'
                                                                                ? 'bg-neon-purple/15 text-neon-purple border-neon-purple/30'
                                                                                : 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30'
                                                                        }`}>
                                                                            {videoCat === 'interview' ? '🎙️ Interview' : videoCat === 'clip' ? '🎬 Clip' : '🎪 Liveset'}
                                                                        </span>
                                                                    </div>
                                                                    {video.duration && (
                                                                        <span className="text-white/20 text-[9px] font-mono shrink-0">{formatMins(video.duration)}</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            ) : (
                                                /* Other day: Show programming schedule overview */
                                                <div className="overflow-y-auto flex-1 space-y-2 pr-0.5 custom-scrollbar">
                                                    <div className="flex items-center justify-between text-white/30 text-[9px] font-black uppercase tracking-widest pb-1 border-b border-white/5">
                                                        <span>Grille du {DAYS_OF_WEEK.find(d => d.value === epgSelectedDay)?.label}</span>
                                                        <span>{epgDayBlocks.length} émission(s)</span>
                                                    </div>

                                                    {epgDayBlocks.length === 0 ? (
                                                        <div className="py-8 text-center text-white/40 text-xs">
                                                            Aucune émission configurée pour ce jour.
                                                        </div>
                                                    ) : (
                                                        epgDayBlocks.map((blk) => (
                                                            <div
                                                                key={blk.id}
                                                                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 hover:bg-white/[0.06] transition-all"
                                                                style={{ borderLeftColor: blk.color, borderLeftWidth: 4 }}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <span className="text-xl shrink-0">{blk.emoji}</span>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <h4 className="text-white font-bold text-xs truncate">{blk.title}</h4>
                                                                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-white/10 text-white/80">
                                                                                {blk.timeSlot}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-white/40 truncate mt-0.5">
                                                                            {blk.name} · {blk.videos?.length || 0} vidéo(s) dans la rotation
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right shrink-0">
                                                                    <span className="text-[9px] font-mono text-white/50 block">
                                                                        {blk.randomize === false ? 'Ordre fixe' : 'Aléatoire'}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-white/30 uppercase">
                                                                        {formatBlockDays(blk.days)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* Footer shortcut hint */}
                                <div className="mt-4 pt-3 border-t border-white/[0.06] text-center shrink-0">
                                    <span className="text-white/20 text-[9px] uppercase tracking-widest">Touche G pour fermer · Mis à jour toutes les 5s</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
