import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Tv, Plus, Trash2, ChevronUp, ChevronDown, Save, ExternalLink, 
    RotateCcw, CheckCircle2, Loader2, AlertCircle, Film, ChevronRight, 
    Sparkles, Radio, Zap, Eye, Calendar, Home, Video, Shield, ShieldAlert, 
    Pin, PinOff, MessageSquare, Clock, Lock, User, Upload, 
    Image as ImageIcon, Pencil, LayoutDashboard, Globe, Activity 
} from 'lucide-react';
import { apiFetch, getAuthHeaders } from '../../../utils/auth';
import { uploadFile } from '../../../utils/uploadService';
import type { TVVideo, PromoVideo } from '../../../pages/DropsidersTVPage';
import type { TVScheduleBlock } from '../../../utils/tvSchedule';
import { 
    DEFAULT_TV_BLOCKS, 
    STORAGE_TV_BLOCKS_KEY, 
    getActiveTVBlock 
} from '../../../utils/tvSchedule';

export type { TVVideo, PromoVideo, TVScheduleBlock };

// Format seconds to human-readable duration: 2h 34min 12s
function formatDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return '?';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0) return `${h}h ${m}min`;
    if (m > 0) return `${m}min ${s}s`;
    return `${s}s`;
}

const DEFAULT_MAIN_PLAYLIST: TVVideo[] = [
    {
        id: 'tv_1',
        title: 'Wiley Live @ Lost Lands 2025 - Full Set',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '8YbWq5urfww',
        duration: 3600
    },
    {
        id: 'tv_2',
        title: 'Fisher WE2 | Tomorrowland 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'DuXXMZLfAkQ',
        duration: 3600
    },
    {
        id: 'tv_3',
        title: 'The Chainsmokers Live at EDC Las Vegas 2026 (Official Full Set)',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '3AQ_Srbe1lQ',
        duration: 4500
    },
    {
        id: 'tv_4',
        title: 'RÜFÜS DU SOL (DJ SET) - Mayan Warrior - Burning Man 2024',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'eQ-OVsdK-hM',
        duration: 5400
    },
    {
        id: 'tv_5',
        title: 'D-Block & S-te-Fan | Defqon.1 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'IEJUg98lIHs',
        duration: 3600
    },
    {
        id: 'tv_6',
        title: 'TOMAN | Awakenings Festival 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '5hj5UTZR_Ss',
        duration: 5400
    },
    {
        id: 'tv_7',
        title: 'JOHN SUMMIT LIVE @ ULTRA MIAMI MAIN STAGE 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'aloPGSlq31Y',
        duration: 4500
    },
    {
        id: 'tv_8',
        title: 'Ray Volpe Live @ Lost Lands 2025 - Full Set',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'nyaGV-jeST8',
        duration: 3600
    },
    {
        id: 'tv_9',
        title: 'Dimitri Vegas B2B Nico Moreno WE2 | Tomorrowland 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'OTKgBZS8if0',
        duration: 3600
    },
    {
        id: 'tv_10',
        title: 'Kaskade Live at EDC Las Vegas 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'l5wro3bMZWc',
        duration: 4500
    },
    {
        id: 'tv_11',
        title: 'ERIC PRYDZ LIVE @ ULTRA MUSIC FESTIVAL MIAMI 2026 |',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'hU-z3iV0LOg',
        duration: 3600
    },
    {
        id: 'tv_12',
        title: 'Joris Voorn x Kevin de Vries | Awakenings Festival 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '_MqFasX6Fas',
        duration: 5400
    },
    {
        id: 'tv_13',
        title: 'Ran-D & Adaro | Defqon.1 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'w4QJvock5Rk',
        duration: 3600
    },
    {
        id: 'tv_14',
        title: 'Mita Gami & Meir Briskman Orchestra Set - Mayan Warrior - Burning Man 2024',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'm8EAmSvzgAQ',
        duration: 5400
    },
    {
        id: 'tv_15',
        title: 'Tomorrowland Belgium 2026 | Official Aftermovie',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'k5yQBhDnrvM',
        duration: 900
    },
    {
        id: 'tv_16',
        title: 'Laidback Luke B2B Chuckie Live at EDC Las Vegas 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'IzsShRhd5cw',
        duration: 4500
    },
    {
        id: 'tv_17',
        title: 'WORSHIP @ ULTRA MUSIC FESTIVAL MIAMI 2026 | UMF',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'V2lD_pq5c3M',
        duration: 3600
    },
    {
        id: 'tv_18',
        title: 'Mau P | Awakenings Festival 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'CNGB66x4ygk',
        duration: 5400
    },
    {
        id: 'tv_19',
        title: 'Coone | Defqon.1 2026',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: 'fsHgYLT_FCc',
        duration: 3600
    },
    {
        id: 'tv_20',
        title: 'Keinemusik (&ME, Rampa, Adam Port) - Mayan Warrior - Burning Man 2022',
        description: 'Diffusé sur DropsidersTV',
        youtubeId: '2ECWX8GdDvA',
        duration: 7200
    }
];

export function extractYouTubeId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

        if (urlObj.hostname.includes('youtu.be')) {
            const cleanPath = urlObj.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
            if (/^[a-zA-Z0-9_-]{11}$/.test(cleanPath)) return cleanPath;
        }

        const vParam = urlObj.searchParams.get('v');
        if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        const prefixIndex = pathSegments.findIndex(p => ['embed', 'shorts', 'live', 'v'].includes(p.toLowerCase()));
        if (prefixIndex !== -1 && pathSegments[prefixIndex + 1]) {
            const id = pathSegments[prefixIndex + 1].split('?')[0];
            if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        }
    } catch {}

    const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/|\/live\/|watch\?v=|\&v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

export async function fetchYouTubeTitle(urlOrId: string): Promise<string | null> {
    const ytid = extractYouTubeId(urlOrId);
    if (!ytid) return null;

    try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytid}`);
        if (res.ok) {
            const data = await res.json();
            if (data?.title) return data.title;
        }
    } catch {}

    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytid}&format=json`);
        if (res.ok) {
            const data = await res.json();
            if (data?.title) return data.title;
        }
    } catch {}

    return null;
}

export interface TakeoverStatePartial {
    enabled: boolean;
    status?: 'off' | 'edit' | 'live';
    youtubeId?: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    forceHomepage?: boolean;
    showInNavbar?: boolean;
    showInAgenda?: boolean;
    showTopBanner?: boolean;
    isSecret?: boolean;
    password?: string;
    moderators?: string;
    lineup?: string;
    channels?: string;
    tickerType?: 'news' | 'planning' | 'custom';
    tickerText?: string;
    tickerLink?: string;
    tickerBgColor?: string;
    tickerTextColor?: string;
    showTickerBanner?: boolean;
    autoMessage?: string;
    autoMessageInterval?: number;
    customCommands?: string;
    pinnedMessage?: string;
    [key: string]: any;
}

interface AdminTVModalProps {
    isOpen: boolean;
    onClose: () => void;
    takeoverState?: TakeoverStatePartial;
    onUpdateLiveStatus?: (status: 'off' | 'edit' | 'live') => Promise<void>;
    onSaveTakeover?: () => Promise<void>;
    onTakeoverChange?: (updated: TakeoverStatePartial) => void;
    isUpdatingTakeover?: boolean;
}

export function AdminTVModal({
    isOpen,
    onClose,
    takeoverState,
    onUpdateLiveStatus,
    onSaveTakeover,
    onTakeoverChange,
    isUpdatingTakeover
}: AdminTVModalProps) {
    const [activeTab, setActiveTab] = useState<'blocks' | 'promo' | 'main' | 'live'>('blocks');
    const [liveSubTab, setLiveSubTab] = useState<'general' | 'planning' | 'moderation' | 'ticker' | 'bot' | 'mods' | 'access'>('general');
    const [liveSaving, setLiveSaving] = useState(false);
    const [liveSaved, setLiveSaved] = useState(false);

    // 5 Time Blocks Schedule
    const [blocks, setBlocks] = useState<TVScheduleBlock[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_TV_BLOCKS;
    });
    const [selectedBlockId, setSelectedBlockId] = useState<string>('bloc_1');

    // Add video to block form
    const [blockVideoUrl, setBlockVideoUrl] = useState('');
    const [blockVideoTitle, setBlockVideoTitle] = useState('');
    const [isFetchingBlockTitle, setIsFetchingBlockTitle] = useState(false);

    // Main Videos list
    const [playlist, setPlaylist] = useState<TVVideo[]>(DEFAULT_MAIN_PLAYLIST);
    // Promo Videos list
    const [promos, setPromos] = useState<PromoVideo[]>([]);
    // Known durations from localStorage (populated by TV player as it plays videos)
    const [durationsMap, setDurationsMap] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_tv_durations');
            if (saved) return JSON.parse(saved);
        } catch {}
        return {};
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form: Add Main Video
    const [newMainUrl, setNewMainUrl] = useState('');
    const [newMainTitle, setNewMainTitle] = useState('');
    const [newMainDesc, setNewMainDesc] = useState('');
    const [isFetchingMainTitle, setIsFetchingMainTitle] = useState(false);

    // Form: Add Promo Video
    const [newPromoUrl, setNewPromoUrl] = useState('');
    const [newPromoTitle, setNewPromoTitle] = useState('');
    const [isFetchingPromoTitle, setIsFetchingPromoTitle] = useState(false);

    // Banned chat users local state
    const [bannedChatUsers, setBannedChatUsers] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchSettings = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data?.tv_blocks) && data.tv_blocks.length > 0) {
                        setBlocks(data.tv_blocks);
                    } else {
                        try {
                            const localBlocks = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
                            if (localBlocks) setBlocks(JSON.parse(localBlocks));
                        } catch {}
                    }
                    if (Array.isArray(data?.tv_playlist) && data.tv_playlist.length > 0) {
                        setPlaylist(data.tv_playlist);
                    } else {
                        setPlaylist(DEFAULT_MAIN_PLAYLIST);
                    }
                    if (Array.isArray(data?.tv_promos)) {
                        setPromos(data.tv_promos);
                    }
                }
            } catch (e: any) {
                console.error("Erreur chargement TV settings:", e);
                try {
                    const localBlocks = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
                    if (localBlocks) setBlocks(JSON.parse(localBlocks));
                    const localPlay = localStorage.getItem('dropsiders_tv_playlist_v2');
                    if (localPlay) setPlaylist(JSON.parse(localPlay));
                    const localProm = localStorage.getItem('dropsiders_tv_promos_v2');
                    if (localProm) setPromos(JSON.parse(localProm));
                } catch {}
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
        // Refresh durationsMap from localStorage each time modal opens
        try {
            const saved = localStorage.getItem('dropsiders_tv_durations');
            if (saved) setDurationsMap(JSON.parse(saved));
        } catch {}
    }, [isOpen]);

    // Auto-fetch Title on main URL input
    const handleMainUrlChange = async (val: string) => {
        setNewMainUrl(val);
        const ytid = extractYouTubeId(val);
        if (ytid && !newMainTitle.trim()) {
            setIsFetchingMainTitle(true);
            const fetched = await fetchYouTubeTitle(ytid);
            setIsFetchingMainTitle(false);
            if (fetched) setNewMainTitle(fetched);
        }
    };

    // Auto-fetch Title on block video URL input
    const handleBlockUrlChange = async (val: string) => {
        setBlockVideoUrl(val);
        const ytid = extractYouTubeId(val);
        if (ytid && !blockVideoTitle.trim()) {
            setIsFetchingBlockTitle(true);
            const fetched = await fetchYouTubeTitle(ytid);
            setIsFetchingBlockTitle(false);
            if (fetched) setBlockVideoTitle(fetched);
        }
    };

    const handleAddVideoToBlock = () => {
        const ytid = extractYouTubeId(blockVideoUrl);
        if (!ytid) {
            alert('Veuillez entrer un lien YouTube valide.');
            return;
        }
        const block = blocks.find(b => b.id === selectedBlockId);
        const newVid: TVVideo = {
            id: `bv_${Date.now()}`,
            title: blockVideoTitle.trim() || `Vidéo ${ytid}`,
            description: `Diffusé sur DropsidersTV · ${block?.title || ''}`,
            youtubeId: ytid,
            duration: 3600
        };
        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlockId) return b;
            return {
                ...b,
                videos: [...(b.videos || []), newVid]
            };
        }));
        setBlockVideoUrl('');
        setBlockVideoTitle('');
    };

    const handleRemoveVideoFromBlock = (blockId: string, index: number) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const nextVids = [...(b.videos || [])];
            nextVids.splice(index, 1);
            return { ...b, videos: nextVids };
        }));
    };

    const handleMoveVideoInBlock = (blockId: string, index: number, direction: -1 | 1) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const nextVids = [...(b.videos || [])];
            const target = index + direction;
            if (target < 0 || target >= nextVids.length) return b;
            const tmp = nextVids[target];
            nextVids[target] = nextVids[index];
            nextVids[index] = tmp;
            return { ...b, videos: nextVids };
        }));
    };

    const handleToggleBlockRandom = (blockId: string) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            return { ...b, randomize: !b.randomize };
        }));
    };

    const handleManualFetchMainTitle = async () => {
        const ytid = extractYouTubeId(newMainUrl);
        if (!ytid) {
            alert('Entrez d\'abord un lien YouTube valide.');
            return;
        }
        setIsFetchingMainTitle(true);
        const fetched = await fetchYouTubeTitle(ytid);
        setIsFetchingMainTitle(false);
        if (fetched) setNewMainTitle(fetched);
    };

    // Auto-fetch Title on promo URL input
    const handlePromoUrlChange = async (val: string) => {
        setNewPromoUrl(val);
        const ytid = extractYouTubeId(val);
        if (ytid && !newPromoTitle.trim()) {
            setIsFetchingPromoTitle(true);
            const fetched = await fetchYouTubeTitle(ytid);
            setIsFetchingPromoTitle(false);
            if (fetched) setNewPromoTitle(fetched);
        }
    };

    const handleManualFetchPromoTitle = async () => {
        const ytid = extractYouTubeId(newPromoUrl);
        if (!ytid) {
            alert('Entrez d\'abord un lien YouTube promo valide.');
            return;
        }
        setIsFetchingPromoTitle(true);
        const fetched = await fetchYouTubeTitle(ytid);
        setIsFetchingPromoTitle(false);
        if (fetched) setNewPromoTitle(fetched);
    };

    // Add main video
    const handleAddMainVideo = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const ytid = extractYouTubeId(newMainUrl);
        if (!ytid) {
            alert('Lien YouTube invalide.');
            return;
        }

        const newVid: TVVideo = {
            id: `tv_${Date.now()}`,
            title: newMainTitle.trim() || `Vidéo ${playlist.length + 1}`,
            description: newMainDesc.trim() || 'Diffusé sur DropsidersTV',
            youtubeId: ytid
        };

        setPlaylist(prev => [...prev, newVid]);
        setNewMainUrl('');
        setNewMainTitle('');
        setNewMainDesc('');
    };

    // Add promo video
    const handleAddPromoVideo = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const ytid = extractYouTubeId(newPromoUrl);
        if (!ytid) {
            alert('Lien YouTube promo invalide.');
            return;
        }

        const newP: PromoVideo = {
            id: `promo_${Date.now()}`,
            title: newPromoTitle.trim() || `Promo ${promos.length + 1}`,
            youtubeId: ytid
        };

        setPromos(prev => [...prev, newP]);
        setNewPromoUrl('');
        setNewPromoTitle('');
    };

    // Main reorder & delete
    const handleDeleteMain = (id: string) => {
        if (playlist.length <= 1) {
            alert('Il doit rester au moins une vidéo principale dans la programmation.');
            return;
        }
        setPlaylist(prev => prev.filter(v => v.id !== id));
    };

    const handleMoveUpMain = (idx: number) => {
        if (idx <= 0) return;
        setPlaylist(prev => {
            const next = [...prev];
            const temp = next[idx - 1];
            next[idx - 1] = next[idx];
            next[idx] = temp;
            return next;
        });
    };

    const handleMoveDownMain = (idx: number) => {
        if (idx >= playlist.length - 1) return;
        setPlaylist(prev => {
            const next = [...prev];
            const temp = next[idx + 1];
            next[idx + 1] = next[idx];
            next[idx] = temp;
            return next;
        });
    };

    // Promo reorder & delete
    const handleDeletePromo = (id: string) => {
        setPromos(prev => prev.filter(p => p.id !== id));
    };

    const handleMoveUpPromo = (idx: number) => {
        if (idx <= 0) return;
        setPromos(prev => {
            const next = [...prev];
            const temp = next[idx - 1];
            next[idx - 1] = next[idx];
            next[idx] = temp;
            return next;
        });
    };

    const handleMoveDownPromo = (idx: number) => {
        if (idx >= promos.length - 1) return;
        setPromos(prev => {
            const next = [...prev];
            const temp = next[idx + 1];
            next[idx + 1] = next[idx];
            next[idx] = temp;
            return next;
        });
    };

    const handleReset = () => {
        if (activeTab === 'blocks') {
            if (confirm('Restaurer la grille des 5 blocs par défaut avec les sets recommandés ?')) {
                setBlocks(DEFAULT_TV_BLOCKS);
            }
        } else {
            if (confirm('Restaurer la liste par défaut des sets de festivals ?')) {
                setPlaylist(DEFAULT_MAIN_PLAYLIST);
                setPromos([]);
            }
        }
    };

    // Save TV Playlist & Blocks
    const handleSave = async () => {
        let currentPlaylist = [...playlist];
        if (newMainUrl.trim()) {
            const ytid = extractYouTubeId(newMainUrl);
            if (ytid) {
                currentPlaylist.push({
                    id: `tv_${Date.now()}`,
                    title: newMainTitle.trim() || `Vidéo ${currentPlaylist.length + 1}`,
                    description: newMainDesc.trim() || 'Diffusé sur DropsidersTV',
                    youtubeId: ytid
                });
                setPlaylist(currentPlaylist);
                setNewMainUrl('');
                setNewMainTitle('');
                setNewMainDesc('');
            }
        }

        let currentPromos = [...promos];
        if (newPromoUrl.trim()) {
            const ytid = extractYouTubeId(newPromoUrl);
            if (ytid) {
                currentPromos.push({
                    id: `promo_${Date.now()}`,
                    title: newPromoTitle.trim() || `Promo ${currentPromos.length + 1}`,
                    youtubeId: ytid
                });
                setPromos(currentPromos);
                setNewPromoUrl('');
                setNewPromoTitle('');
            }
        }

        let currentBlocks = [...blocks];
        if (blockVideoUrl.trim()) {
            const ytid = extractYouTubeId(blockVideoUrl);
            if (ytid) {
                const block = currentBlocks.find(b => b.id === selectedBlockId);
                const newVid: TVVideo = {
                    id: `bv_${Date.now()}`,
                    title: blockVideoTitle.trim() || `Vidéo ${ytid}`,
                    description: `Diffusé sur DropsidersTV · ${block?.title || ''}`,
                    youtubeId: ytid,
                    duration: 3600
                };
                currentBlocks = currentBlocks.map(b => {
                    if (b.id !== selectedBlockId) return b;
                    return { ...b, videos: [...(b.videos || []), newVid] };
                });
                setBlocks(currentBlocks);
                setBlockVideoUrl('');
                setBlockVideoTitle('');
            }
        }

        setSaving(true);
        setError(null);
        setSaveMessage(null);

        // Preserve existing TV start time so saving programming never restarts playback at 0
        let existingStartTime = 0;
        try {
            const saved = localStorage.getItem('dropsiders_tv_start_time');
            if (saved) existingStartTime = parseInt(saved, 10);
        } catch {}
        if (!existingStartTime || isNaN(existingStartTime)) {
            existingStartTime = Date.now();
        }
        const startTime = existingStartTime;

        // 1. Immediate LocalStorage save (updates blocks, playlist & promos without resetting position)
        try {
            localStorage.setItem(STORAGE_TV_BLOCKS_KEY, JSON.stringify(currentBlocks));
            localStorage.setItem('dropsiders_tv_playlist_v2', JSON.stringify(currentPlaylist));
            localStorage.setItem('dropsiders_tv_promos_v2', JSON.stringify(currentPromos));
            localStorage.setItem('dropsiders_tv_start_time', startTime.toString());

            try {
                const bc = new BroadcastChannel('dropsiders_tv_sync');
                bc.postMessage({
                    type: 'TV_SCHEDULE_UPDATED',
                    blocks: currentBlocks,
                    playlist: currentPlaylist,
                    promos: currentPromos
                });
                bc.close();
            } catch {}
        } catch (e) {
            console.warn("LocalStorage save warning:", e);
        }

        // 2. Sync to server
        try {
            const settingsRes = await apiFetch('/api/settings');
            const currentSettings = settingsRes.ok ? await settingsRes.json() : {};

            const newSettings = {
                ...currentSettings,
                tv_blocks: currentBlocks,
                tv_playlist: currentPlaylist,
                tv_promos: currentPromos,
                tv_start_time: startTime
            };

            const res = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (res.ok) {
                setSaveSuccess(true);
                setSaveMessage('Grille horaire (5 blocs) et programmation enregistrées avec succès !');
                setTimeout(() => {
                    setSaveSuccess(false);
                    setSaveMessage(null);
                }, 3500);
            } else {
                const errData = await res.json().catch(() => ({}));
                const msg = errData?.error || `Erreur ${res.status}`;
                setError(`Enregistré localement, mais échec serveur : ${msg}`);
            }
        } catch (e: any) {
            console.error("Erreur sauvegarde TV:", e);
            setSaveSuccess(true);
            setSaveMessage('Enregistré localement (serveur distant indisponible)');
            setTimeout(() => {
                setSaveSuccess(false);
                setSaveMessage(null);
            }, 3500);
        } finally {
            setSaving(false);
        }
    };

    // Helper to upload image for Lineup
    const handleUploadImageForLineup = (onSuccess: (url: string) => void) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                try {
                    const url = await uploadFile(file, 'festivals');
                    onSuccess(url);
                } catch (err) {
                    console.error("Upload failed", err);
                    alert("Erreur lors de l'upload de l'image.");
                }
            }
        };
        input.click();
    };

    const location = useLocation();
    const isOnTvPage = typeof window !== 'undefined' && (location.pathname.startsWith('/tv') || window.location.pathname.startsWith('/tv'));

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const bgVideoId = playlist?.[0]?.youtubeId || 'H5QLyGiDr_0';

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-1 sm:p-2 md:p-2.5 bg-black/85 backdrop-blur-md overflow-hidden"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    {/* Live TV Background (blurred, muted, ambient backdrop when opened from Admin) */}
                    {!isOnTvPage && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                            <div 
                                className="w-full h-full scale-125 filter blur-2xl opacity-35 transition-transform duration-700"
                                style={{ transformOrigin: 'center center' }}
                            >
                                <iframe
                                    className="w-full h-full object-cover"
                                    src={`https://www.youtube-nocookie.com/embed/${bgVideoId}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${bgVideoId}&cc_load_policy=0&iv_load_policy=3`}
                                    allow="autoplay; encrypted-media"
                                    tabIndex={-1}
                                    title="Dropsiders TV Background"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 15 }}
                        className="bg-[#0c0c0c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[1.75rem] p-3 sm:p-4 md:p-5 w-[99vw] max-w-[1720px] h-[97vh] max-h-[98vh] shadow-2xl relative overflow-hidden flex flex-col z-10"
                    >
                        {/* Red Accent top line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />

                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-2.5 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red shrink-0">
                                    <Tv className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg md:text-xl font-display font-black text-white uppercase italic tracking-tighter leading-tight">
                                        DROPSIDERS <span className="text-neon-red">TV</span> & <span className="text-neon-purple">LIVE</span>
                                    </h2>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">
                                        Programmation continue TV · Live Takeover · Timetable & Modération
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {!isOnTvPage && (
                                    <a
                                        href="/tv"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all flex items-center gap-1.5"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Voir la TV
                                    </a>
                                )}
                                <a
                                    href="/live"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/30 text-[9px] font-black uppercase tracking-widest text-neon-purple transition-all flex items-center gap-1.5"
                                >
                                    <Radio className="w-3 h-3" />
                                    Voir le Live
                                </a>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Top Main Navigation Tabs */}
                        <div className="flex items-center gap-1.5 mb-2.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('blocks')}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                    activeTab === 'blocks'
                                        ? 'bg-gradient-to-r from-amber-500 to-neon-red text-white shadow-md shadow-neon-red/20'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                Grille 5 Blocs TV ({blocks.reduce((acc, b) => acc + (b.videos?.length || 0), 0)})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('promo')}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                    activeTab === 'promo'
                                        ? 'bg-neon-purple text-white shadow-md shadow-neon-purple/20'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Film className="w-3.5 h-3.5" />
                                Vidéos Promo ({promos.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('main')}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                    activeTab === 'main'
                                        ? 'bg-neon-red text-white shadow-md shadow-neon-red/20'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Tv className="w-3.5 h-3.5" />
                                Tous les Sets ({playlist.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('live')}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                    activeTab === 'live'
                                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md shadow-red-600/30'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Radio className="w-3.5 h-3.5 text-white" />
                                Live Takeover {takeoverState?.status === 'live' ? '🔴' : takeoverState?.status === 'edit' ? '🟠' : ''}
                            </button>
                        </div>

                        {/* ── Duration stats bar ── */}
                        {!loading && (() => {
                            const mainTotal = playlist.reduce((sum, v) => sum + (durationsMap[v.youtubeId] || 0), 0);
                            const promoTotal = promos.reduce((sum, v) => sum + (durationsMap[v.youtubeId] || 0), 0);
                            const mainKnown = playlist.filter(v => durationsMap[v.youtubeId] > 0).length;
                            const promoKnown = promos.filter(v => durationsMap[v.youtubeId] > 0).length;
                            // One full cycle = all main videos + one promo after each
                            const cycleTotal = mainTotal + (playlist.length > 0 && promos.length > 0 ? promoTotal * Math.ceil(playlist.length / Math.max(promos.length, 1)) : 0);
                            const allUnknown = mainKnown === 0 && promoKnown === 0;
                            return (
                                <div className="mb-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/10 shrink-0">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        Durées de la programmation
                                        {allUnknown && <span className="text-white/30 normal-case font-normal tracking-normal ml-1">(jouer la TV pour détecter les durées)</span>}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="py-1 px-2 rounded-lg bg-neon-red/5 border border-neon-red/20 text-center flex items-center justify-center gap-2">
                                            <div className="text-xs font-black text-neon-red">
                                                {mainTotal > 0 ? formatDuration(mainTotal) : '–'}
                                            </div>
                                            <div className="text-[8px] text-white/40 uppercase tracking-widest">
                                                Sets ({mainKnown}/{playlist.length})
                                            </div>
                                        </div>
                                        <div className="py-1 px-2 rounded-lg bg-neon-purple/5 border border-neon-purple/20 text-center flex items-center justify-center gap-2">
                                            <div className="text-xs font-black text-neon-purple">
                                                {promoTotal > 0 ? formatDuration(promoTotal) : '–'}
                                            </div>
                                            <div className="text-[8px] text-white/40 uppercase tracking-widest">
                                                Promos ({promoKnown}/{promos.length})
                                            </div>
                                        </div>
                                        <div className="py-1 px-2 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 text-center flex items-center justify-center gap-2">
                                            <div className="text-xs font-black text-neon-cyan">
                                                {cycleTotal > 0 ? formatDuration(cycleTotal) : '–'}
                                            </div>
                                            <div className="text-[8px] text-white/40 uppercase tracking-widest">
                                                Cycle complet
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ========================================================= */}
                        {/* TAB: 5 BLOCS HORAIRES (GRILLE TV) */}
                        {/* ========================================================= */}
                        {activeTab === 'blocks' && (
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 flex flex-col min-h-0">
                                {/* 5 Blocks Selector Header & Compact Tabs */}
                                <div className="space-y-1.5 shrink-0">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
                                            Grille TV · 5 Blocs 24h
                                        </span>
                                        <span className="text-[10px] font-mono text-white/40">
                                            {blocks.reduce((acc, b) => acc + (b.videos?.length || 0), 0)} vidéos réparties
                                        </span>
                                    </div>

                                    {/* 5 Blocks Selector Buttons */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 shrink-0">
                                        {blocks.map(b => {
                                            const isSelected = b.id === selectedBlockId;
                                            const isLiveNow = getActiveTVBlock(blocks).id === b.id;
                                            return (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => setSelectedBlockId(b.id)}
                                                    className={`group px-2.5 py-1.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 overflow-hidden ${
                                                        isSelected
                                                            ? 'bg-white/[0.08] shadow-sm'
                                                            : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 opacity-70 hover:opacity-100'
                                                    }`}
                                                    style={{
                                                        borderColor: isSelected ? b.color : undefined,
                                                        boxShadow: isSelected ? `0 0 12px ${b.color}20` : undefined,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-base shrink-0">{b.emoji}</span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span 
                                                                    className="text-xs font-black truncate"
                                                                    style={{ color: isSelected ? b.color : 'white' }}
                                                                >
                                                                    {b.title}
                                                                </span>
                                                                {isLiveNow && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-ping shrink-0" title="En direct" />
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] text-white/40 font-mono">
                                                                {b.timeSlot}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                                                            isSelected ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40'
                                                        }`}>
                                                            {b.videos?.length || 0}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Selected Block Details & Link Management */}
                                {(() => {
                                    const currentBlock = blocks.find(b => b.id === selectedBlockId) || blocks[0];
                                    if (!currentBlock) return null;
                                    const isLiveNow = getActiveTVBlock(blocks).id === currentBlock.id;

                                    return (
                                        <div 
                                            className="p-2.5 sm:p-3 rounded-xl border bg-black/40 backdrop-blur-md space-y-2 flex-1 flex flex-col min-h-0"
                                            style={{ borderColor: `${currentBlock.color}35` }}
                                        >
                                            {/* Header of selected block */}
                                            <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-white/10 shrink-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-base shrink-0">{currentBlock.emoji}</span>
                                                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: currentBlock.color }}>
                                                        {currentBlock.title}
                                                    </span>
                                                    <span className="text-[10px] text-white/40 font-mono">
                                                        ({currentBlock.timeSlot})
                                                    </span>
                                                    {isLiveNow && (
                                                        <span className="px-1.5 py-0.2 rounded text-[7px] font-black uppercase bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse">
                                                            En direct
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Random rotation toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleBlockRandom(currentBlock.id)}
                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 border ${
                                                        currentBlock.randomize
                                                            ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
                                                            : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                                                    }`}
                                                >
                                                    <span>🔀</span>
                                                    <span>Rotation aléatoire : <strong className="uppercase">{currentBlock.randomize ? 'Oui' : 'Non'}</strong></span>
                                                </button>
                                            </div>

                                            {/* Add video form for this block */}
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2 shrink-0">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={blockVideoUrl}
                                                        onChange={(e) => handleBlockUrlChange(e.target.value)}
                                                        placeholder="Lien ou ID YouTube (ex: https://youtube.com/watch?v=...)"
                                                        className="w-full px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-white/30 font-mono"
                                                    />
                                                    {isFetchingBlockTitle && (
                                                        <div className="absolute right-2.5 top-1.5 text-xs text-white/40">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>

                                                <input
                                                    type="text"
                                                    value={blockVideoTitle}
                                                    onChange={(e) => setBlockVideoTitle(e.target.value)}
                                                    placeholder="Titre de la vidéo (auto-détecté ou personnalisé)"
                                                    className="w-72 md:w-96 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-white/30"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={handleAddVideoToBlock}
                                                    disabled={!blockVideoUrl.trim()}
                                                    className="h-7 px-3 rounded-md text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm shrink-0 active:scale-95"
                                                    style={{ background: currentBlock.color }}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Ajouter
                                                </button>
                                            </div>

                                            {/* Video list inside this block */}
                                            <div className="space-y-1 flex-1 min-h-0 flex flex-col">
                                                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/40 shrink-0">
                                                    <span>Vidéos dans ce bloc ({currentBlock.videos?.length || 0})</span>
                                                    <span>Tourne aléatoirement chaque jour si l'option est activée</span>
                                                </div>

                                                {(!currentBlock.videos || currentBlock.videos.length === 0) ? (
                                                    <div className="p-4 text-center rounded-lg bg-white/[0.02] border border-white/5">
                                                        <p className="text-xs font-bold text-white/40">Aucune vidéo dans ce bloc pour l'instant.</p>
                                                        <p className="text-[10px] text-white/20 mt-0.5">Collez un lien YouTube ci-dessus pour alimenter ce créneau horaire.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1 flex-1 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                                                        {currentBlock.videos.map((vid, idx) => {
                                                            const dur = durationsMap[vid.youtubeId] || vid.duration || 0;
                                                            return (
                                                                <div
                                                                    key={vid.id || idx}
                                                                    className="p-1 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-2 transition-colors group"
                                                                >
                                                                    {/* Thumbnail + Index */}
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="text-[10px] font-black text-white/30 w-4 text-center shrink-0">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <div className="relative w-14 h-8 rounded-md overflow-hidden bg-black/50 shrink-0 border border-white/10">
                                                                            <img
                                                                                src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`}
                                                                                alt={vid.title}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e: any) => {
                                                                                    e.currentTarget.src = `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`;
                                                                                }}
                                                                            />
                                                                            {dur > 0 && (
                                                                                <span className="absolute bottom-0.5 right-0.5 px-0.5 rounded bg-black/80 text-[7px] font-black text-white">
                                                                                    {formatDuration(dur)}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0">
                                                                            <h5 className="text-xs font-bold text-white truncate" title={vid.title}>
                                                                                {vid.title}
                                                                            </h5>
                                                                            <div className="flex items-center gap-2 text-[9px] text-white/40">
                                                                                <span className="font-mono">ID: {vid.youtubeId}</span>
                                                                                <a
                                                                                    href={`https://www.youtube.com/watch?v=${vid.youtubeId}`}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="hover:text-white flex items-center gap-0.5 transition-colors"
                                                                                    title="Ouvrir sur YouTube"
                                                                                >
                                                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                                                    Voir
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleMoveVideoInBlock(currentBlock.id, idx, -1)}
                                                                            disabled={idx === 0}
                                                                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
                                                                            title="Monter"
                                                                        >
                                                                            <ChevronUp className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleMoveVideoInBlock(currentBlock.id, idx, 1)}
                                                                            disabled={idx === currentBlock.videos.length - 1}
                                                                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
                                                                            title="Descendre"
                                                                        >
                                                                            <ChevronDown className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveVideoFromBlock(currentBlock.id, idx)}
                                                                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all ml-0.5"
                                                                            title="Supprimer ce lien"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* TAB: PROGRAMMATION TV (SETS PRINCIPAUX) */}
                        {/* ========================================================= */}
                        {activeTab === 'main' && (
                            <>
                                {/* Alternation Diagram */}
                                <div className="mb-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 flex items-center justify-between gap-2 overflow-x-auto text-[9px] font-bold">
                                    <span className="text-white/40 uppercase tracking-widest text-[8px] shrink-0">
                                        Règle de diffusion continue :
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="px-1.5 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">
                                            Vidéo 1
                                        </span>
                                        <ChevronRight className="w-2.5 h-2.5 text-white/20" />
                                        <span className="px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                            Promo 1
                                        </span>
                                        <ChevronRight className="w-2.5 h-2.5 text-white/20" />
                                        <span className="px-1.5 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">
                                            Vidéo 2
                                        </span>
                                        <ChevronRight className="w-2.5 h-2.5 text-white/20" />
                                        <span className="px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                            Promo 2
                                        </span>
                                        <ChevronRight className="w-2.5 h-2.5 text-white/20" />
                                        <span className="text-white/40 italic text-[8px]">etc...</span>
                                    </div>
                                </div>

                                {/* Form: Add Main Video */}
                                <form onSubmit={handleAddMainVideo} className="mb-2.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 space-y-2">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                                        <Plus className="w-3 h-3 text-neon-red" />
                                        Ajouter un set principal à la programmation
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5">
                                        <div className="md:col-span-6 relative">
                                            <input
                                                type="text"
                                                placeholder="Lien ou ID YouTube (ex: https://youtube.com/watch?v=...)"
                                                value={newMainUrl}
                                                onChange={(e) => handleMainUrlChange(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red font-mono"
                                            />
                                            {isFetchingMainTitle && (
                                                <div className="absolute right-3 top-2 text-neon-cyan">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-6 flex gap-1.5">
                                            <input
                                                type="text"
                                                placeholder="Titre du set (auto-détecté ou personnalisé)"
                                                value={newMainTitle}
                                                onChange={(e) => setNewMainTitle(e.target.value)}
                                                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleManualFetchMainTitle}
                                                title="Recharger le titre YouTube"
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all text-xs"
                                            >
                                                <Sparkles className="w-3 h-3 text-neon-cyan" />
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-3.5 py-1.5 bg-neon-red hover:bg-neon-red/90 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Ajouter
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                {/* List of Main Videos */}
                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0">
                                    {loading ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-white/40 gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-neon-red" />
                                            <span className="text-xs uppercase tracking-widest font-bold">Chargement de la programmation...</span>
                                        </div>
                                    ) : playlist.length === 0 ? (
                                        <div className="py-12 text-center text-white/40 text-xs uppercase tracking-widest font-bold">
                                            Aucune vidéo dans la programmation TV.
                                        </div>
                                    ) : (
                                        playlist.map((video, idx) => {
                                            const nextPromo = promos.length > 0 ? promos[idx % promos.length] : null;
                                            const nextPromoIdx = promos.length > 0 ? (idx % promos.length) : null;
                                            return (
                                                <div key={video.id || idx} className="space-y-1">
                                                    {/* Main Video Item */}
                                                    <div className="group p-1.5 px-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 transition-all flex items-center gap-2.5">
                                                        <div className="w-6 h-6 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center justify-center text-[10px] font-black font-mono text-neon-red shrink-0">
                                                            #{idx + 1}
                                                        </div>

                                                        <div className="w-16 h-10 rounded-lg bg-black overflow-hidden relative shrink-0 border border-white/10">
                                                            <img
                                                                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                                                alt={video.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-neon-red/15 text-neon-red border border-neon-red/30">
                                                                    Set Principal
                                                                </span>
                                                                {durationsMap[video.youtubeId] > 0 && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white/60 bg-white/5 border border-white/10 flex items-center gap-1">
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        {formatDuration(durationsMap[video.youtubeId])}
                                                                    </span>
                                                                )}
                                                                <h4 className="text-white font-bold text-xs truncate">
                                                                    {video.title}
                                                                </h4>
                                                            </div>
                                                            <div className="text-[9px] text-white/40 font-mono mt-0.5">
                                                                ID: {video.youtubeId}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveUpMain(idx)}
                                                                disabled={idx === 0}
                                                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                                title="Monter"
                                                            >
                                                                <ChevronUp className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveDownMain(idx)}
                                                                disabled={idx === playlist.length - 1}
                                                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                                title="Descendre"
                                                            >
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteMain(video.id)}
                                                                disabled={playlist.length <= 1}
                                                                className="p-1 rounded-md bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 ml-0.5 disabled:opacity-20"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Interleaved Promo video right after this video */}
                                                    {nextPromo && (
                                                        <div className="ml-5 md:ml-8 p-1.5 px-2.5 rounded-xl bg-neon-purple/[0.04] border border-neon-purple/20 flex items-center gap-2.5 relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:w-2.5 before:h-0.5 before:bg-neon-purple/40">
                                                            <div className="w-5 h-5 rounded-md bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center text-[9px] font-black font-mono text-neon-purple shrink-0">
                                                                P{nextPromoIdx! + 1}
                                                            </div>
                                                            <div className="w-12 h-7 rounded bg-black overflow-hidden relative shrink-0 border border-neon-purple/30">
                                                                <img
                                                                    src={`https://img.youtube.com/vi/${nextPromo.youtubeId}/mqdefault.jpg`}
                                                                    alt={nextPromo.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                                                                        Promo intercalée
                                                                    </span>
                                                                    <h5 className="text-white/90 font-bold text-xs truncate">
                                                                        {nextPromo.title}
                                                                    </h5>
                                                                </div>
                                                                <div className="text-[9px] text-white/40 font-mono mt-0.5">
                                                                    ID: {nextPromo.youtubeId}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveTab('promo')}
                                                                className="text-[9px] text-neon-purple hover:underline px-2 py-0.5 rounded bg-neon-purple/10 hover:bg-neon-purple/20 font-bold uppercase tracking-wider shrink-0 transition-all"
                                                            >
                                                                Gérer promos →
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}

                        {/* ========================================================= */}
                        {/* TAB: VIDÉOS PROMO */}
                        {/* ========================================================= */}
                        {activeTab === 'promo' && (
                            <>
                                <div className="mb-2.5 p-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 shrink-0">
                                    <h3 className="text-xs font-black uppercase text-neon-purple tracking-wider mb-0.5">
                                        Vidéos Promo intercalées
                                    </h3>
                                    <p className="text-[10px] text-white/60">
                                        Chaque promo est diffusée automatiquement à la fin d'une vidéo principale :
                                        <strong className="text-white"> Vidéo 1 → Promo 1 → Vidéo 2 → Promo 2 → Vidéo 3 → Promo 3 (ou 1)</strong>.
                                    </p>
                                </div>

                                <form onSubmit={handleAddPromoVideo} className="mb-2.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 space-y-2">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-neon-purple flex items-center gap-1.5">
                                        <Plus className="w-3 h-3" />
                                        Ajouter une vidéo promo / teaser
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5">
                                        <div className="md:col-span-6 relative">
                                            <input
                                                type="text"
                                                placeholder="Lien ou ID YouTube de la promo"
                                                value={newPromoUrl}
                                                onChange={(e) => handlePromoUrlChange(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-purple font-mono"
                                            />
                                            {isFetchingPromoTitle && (
                                                <div className="absolute right-3 top-2 text-neon-cyan">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-6 flex gap-1.5">
                                            <input
                                                type="text"
                                                placeholder="Titre de la promo"
                                                value={newPromoTitle}
                                                onChange={(e) => setNewPromoTitle(e.target.value)}
                                                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-purple"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleManualFetchPromoTitle}
                                                title="Recharger le titre"
                                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all text-xs"
                                            >
                                                <Sparkles className="w-3 h-3 text-neon-cyan" />
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-3.5 py-1.5 bg-neon-purple hover:bg-neon-purple/90 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Ajouter
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0">
                                    {promos.length === 0 ? (
                                        <div className="py-12 text-center text-white/40 text-xs uppercase tracking-widest font-bold">
                                            Aucune vidéo promo configurée. Les sets principaux s'enchaîneront directement sans promo.
                                        </div>
                                    ) : (
                                        promos.map((p, idx) => (
                                            <div
                                                key={p.id || idx}
                                                className="group p-1.5 px-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-neon-purple/30 transition-all flex items-center gap-2.5"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-[10px] font-black font-mono text-neon-purple shrink-0">
                                                    P{idx + 1}
                                                </div>

                                                <div className="w-16 h-10 rounded-lg bg-black overflow-hidden relative shrink-0 border border-white/10">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${p.youtubeId}/mqdefault.jpg`}
                                                        alt={p.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-bold text-xs truncate">
                                                        {p.title}
                                                    </h4>
                                                    <div className="text-[9px] text-white/40 font-mono mt-0.5">
                                                        ID: {p.youtubeId} · Jouée après le set {idx + 1}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveUpPromo(idx)}
                                                        disabled={idx === 0}
                                                        className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                        title="Monter"
                                                    >
                                                        <ChevronUp className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDownPromo(idx)}
                                                        disabled={idx === promos.length - 1}
                                                        className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                        title="Descendre"
                                                    >
                                                        <ChevronDown className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePromo(p.id)}
                                                        className="p-1 rounded-md bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 ml-0.5"
                                                        title="Supprimer la promo"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* ========================================================= */}
                        {/* TAB: LIVE TAKEOVER (FULL INTERFACE AVEC PLANNING, MODS, BOT...) */}
                        {/* ========================================================= */}
                        {activeTab === 'live' && (
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 flex flex-col">
                                {/* Status Banner */}
                                <div className={`p-4 rounded-2xl border flex items-center gap-4 shrink-0 ${
                                    takeoverState?.status === 'live'
                                        ? 'bg-green-950/40 border-green-600/40'
                                        : takeoverState?.status === 'edit'
                                            ? 'bg-orange-950/40 border-orange-500/40'
                                            : 'bg-black/40 border-white/10'
                                }`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                        takeoverState?.status === 'live'
                                            ? 'bg-green-600/20 text-green-400'
                                            : takeoverState?.status === 'edit'
                                                ? 'bg-orange-500/20 text-orange-400'
                                                : 'bg-white/5 text-white/30'
                                    }`}>
                                        <Radio className={`w-5 h-5 ${takeoverState?.status === 'live' ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Statut Live Takeover</div>
                                        <div className={`text-sm font-black uppercase tracking-wider ${
                                            takeoverState?.status === 'live' ? 'text-green-400' :
                                            takeoverState?.status === 'edit' ? 'text-orange-400' : 'text-white/40'
                                        }`}>
                                            {takeoverState?.status === 'live' ? '🔴 EN DIRECT – ON AIR' :
                                             takeoverState?.status === 'edit' ? '🟠 MODE ÉDITION' :
                                             '⚫ HORS LIGNE – OFF'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('off')}
                                            disabled={isUpdatingTakeover}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                takeoverState?.status === 'off' || !takeoverState?.enabled ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'
                                            }`}
                                        >
                                            OFF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('edit')}
                                            disabled={isUpdatingTakeover}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                takeoverState?.status === 'edit' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/50 hover:text-white'
                                            }`}
                                        >
                                            ÉDIT
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('live')}
                                            disabled={isUpdatingTakeover}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                takeoverState?.status === 'live' ? 'bg-green-600 text-white animate-pulse' : 'bg-white/5 text-white/50 hover:text-white'
                                            }`}
                                        >
                                            ON AIR
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-navigation Bar for Live Options */}
                                <div className="flex bg-black/60 border border-white/10 rounded-2xl p-1 shrink-0 overflow-x-auto no-scrollbar">
                                    <div className="flex min-w-max gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setLiveSubTab('general')}
                                            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                liveSubTab === 'general' ? 'bg-white/15 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            🔴 LIVESTREAM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLiveSubTab('planning')}
                                            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                liveSubTab === 'planning' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-lg' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            📅 PLANNING & TIMETABLE
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLiveSubTab('moderation')}
                                            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                liveSubTab === 'moderation' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-lg' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            🛡️ MODÉRATION
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLiveSubTab('ticker')}
                                            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                liveSubTab === 'ticker' ? 'bg-neon-red/20 text-neon-red border border-neon-red/30 shadow-lg' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            📢 BANDEAU TICKER
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLiveSubTab('bot')}
                                            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                liveSubTab === 'bot' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 shadow-lg' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            🤖 BOT CHAT
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLiveSubTab('mods')}
                                            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                liveSubTab === 'mods' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 shadow-lg' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            👥 ÉQUIPE MODOS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLiveSubTab('access')}
                                            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                liveSubTab === 'access' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-lg' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            🔒 ACCÈS SECRET
                                        </button>
                                    </div>
                                </div>

                                {/* SUB-TAB 1: LIVESTREAM & CAMERAS */}
                                {liveSubTab === 'general' && (
                                    <div className="space-y-4 flex-1">
                                        {/* Main Stream URL */}
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Radio className="w-3.5 h-3.5 text-neon-red" />
                                                    Flux YouTube Live Principal
                                                </label>
                                                {takeoverState?.youtubeId && (
                                                    <a
                                                        href={`https://youtube.com/watch?v=${takeoverState.youtubeId}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] text-neon-cyan flex items-center gap-1 hover:underline"
                                                    >
                                                        Ouvrir sur YouTube <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Lien ou ID YouTube (ex: https://youtube.com/watch?v=...)"
                                                value={takeoverState?.youtubeId || ''}
                                                onChange={(e) => {
                                                    const extracted = extractYouTubeId(e.target.value) || e.target.value;
                                                    onTakeoverChange?.({ ...takeoverState!, youtubeId: extracted });
                                                }}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red font-mono"
                                            />
                                            {takeoverState?.youtubeId && (
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${takeoverState.youtubeId}/mqdefault.jpg`}
                                                        alt="preview"
                                                        className="w-24 h-14 object-cover rounded-lg border border-white/10"
                                                    />
                                                    <span className="text-[10px] text-white/50 font-mono">ID: {takeoverState.youtubeId}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Multi-Cameras / Channels */}
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-4 h-4 text-neon-red" />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                                        Multi-Caméras / Chaînes ({((takeoverState?.channels || '').split('\n').filter(Boolean)).length})
                                                    </h3>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = (takeoverState?.channels || '').split('\n').filter(Boolean);
                                                        const updated = [...current, ':NOUVELLE CAM'].join('\n');
                                                        onTakeoverChange?.({ ...takeoverState!, channels: updated });
                                                    }}
                                                    className="px-3 py-1.5 bg-neon-red text-white text-[9px] font-black uppercase rounded-lg hover:scale-105 transition-all"
                                                >
                                                    + Ajouter une caméra
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {((takeoverState?.channels || '').split('\n').filter(Boolean)).map((line, idx) => {
                                                    const parts = line.split(':');
                                                    const id = parts[0] || '';
                                                    const camTitle = parts.slice(1).join(':') || '';

                                                    const updateChannel = (newId: string, newTitle: string) => {
                                                        const rows = (takeoverState?.channels || '').split('\n').map((l, i) => {
                                                            if (i === idx) return `${newId}:${newTitle}`;
                                                            return l;
                                                        });
                                                        onTakeoverChange?.({ ...takeoverState!, channels: rows.join('\n') });
                                                    };

                                                    const deleteChannel = () => {
                                                        const rows = (takeoverState?.channels || '').split('\n').filter((_, i) => i !== idx);
                                                        onTakeoverChange?.({ ...takeoverState!, channels: rows.join('\n') });
                                                    };

                                                    return (
                                                        <div key={idx} className="grid grid-cols-12 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                                                            <div className="col-span-5">
                                                                <input
                                                                    type="text"
                                                                    value={id}
                                                                    onChange={(e) => updateChannel(e.target.value, camTitle)}
                                                                    placeholder="ID YouTube..."
                                                                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-neon-red outline-none font-mono"
                                                                />
                                                            </div>
                                                            <div className="col-span-6">
                                                                <input
                                                                    type="text"
                                                                    value={camTitle}
                                                                    onChange={(e) => updateChannel(id, e.target.value.toUpperCase())}
                                                                    placeholder="TITRE (EX: MAIN STAGE, CAM 2...)"
                                                                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neon-red font-black uppercase focus:border-neon-red outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 flex justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={deleteChannel}
                                                                    className="p-1.5 text-gray-500 hover:text-neon-red transition-all"
                                                                    title="Supprimer la caméra"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {!(takeoverState?.channels && takeoverState.channels.trim()) && (
                                                    <p className="text-[10px] text-white/30 italic text-center py-2">
                                                        Aucune caméra additionnelle. Le live utilisera uniquement le flux principal.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Titre & Dates */}
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                                                    Nom du festival / événement
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Tomorrowland 2025"
                                                    value={takeoverState?.title || ''}
                                                    onChange={(e) => onTakeoverChange?.({ ...takeoverState!, title: e.target.value })}
                                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Date de Début
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={takeoverState?.startDate || ''}
                                                        onChange={(e) => onTakeoverChange?.({ ...takeoverState!, startDate: e.target.value })}
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-neon-red"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Date de Fin
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={takeoverState?.endDate || ''}
                                                        onChange={(e) => onTakeoverChange?.({ ...takeoverState!, endDate: e.target.value })}
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-neon-red"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Toggles */}
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Options d'affichage</div>
                                            {([
                                                { key: 'forceHomepage', icon: <Home className="w-3.5 h-3.5" />, label: 'Rediriger la homepage vers le live' },
                                                { key: 'showInNavbar', icon: <Eye className="w-3.5 h-3.5" />, label: 'Afficher dans la navigation (Menu)' },
                                                { key: 'showInAgenda', icon: <Calendar className="w-3.5 h-3.5" />, label: 'Afficher dans l\'agenda (Widget Accueil)' },
                                                { key: 'showTopBanner', icon: <Globe className="w-3.5 h-3.5" />, label: 'Afficher le bandeau haut de page' }
                                            ] as const).map(({ key, icon, label }) => (
                                                <div key={key} className="flex items-center justify-between gap-3 p-2 bg-black/30 rounded-xl">
                                                    <div className="flex items-center gap-2 text-xs text-white/70">
                                                        {icon}
                                                        {label}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => onTakeoverChange?.({ ...takeoverState!, [key]: !takeoverState?.[key] })}
                                                        className={`w-11 h-6 rounded-full relative transition-all ${
                                                            takeoverState?.[key] ? 'bg-neon-red shadow-[0_0_15px_#ff003344]' : 'bg-gray-800'
                                                        }`}
                                                    >
                                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                                                            takeoverState?.[key] ? 'right-1' : 'left-1'
                                                        }`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB 2: PLANNING / TIMETABLE / LINEUP */}
                                {liveSubTab === 'planning' && (
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">
                                                    Éditeur de <span className="text-neon-red">Planning & Timetable</span>
                                                </h3>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                                                    Synchronisé avec le widget Timetable du live et la commande !lineup
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentLines = (takeoverState?.lineup || '').split('\n').filter(Boolean);
                                                    const newRow = `[22:00 - 23:00] NOUVEL ARTISTE - MAINSTAGE - @instagram - `;
                                                    const updated = [...currentLines, newRow].join('\n');
                                                    onTakeoverChange?.({ ...takeoverState!, lineup: updated });
                                                }}
                                                className="px-4 py-2 bg-neon-red text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 transition-all shadow-lg shadow-neon-red/20 flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                + Ajouter un passage
                                            </button>
                                        </div>

                                        {/* Lineup Table Headers */}
                                        {takeoverState?.lineup && takeoverState.lineup.trim() !== '' && (
                                            <div className="grid grid-cols-12 gap-2 px-2 pb-1 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                                <div className="col-span-1 text-center">Début</div>
                                                <div className="col-span-1 text-center">Fin</div>
                                                <div className="col-span-3">Artiste</div>
                                                <div className="col-span-2">Scène</div>
                                                <div className="col-span-2">Instagram</div>
                                                <div className="col-span-2">Image Artiste</div>
                                                <div className="col-span-1 text-right">Actions</div>
                                            </div>
                                        )}

                                        {/* Lineup Rows */}
                                        <div className="space-y-2">
                                            {(takeoverState?.lineup || '').split('\n').filter(Boolean).map((line, idx, arr) => {
                                                const timeMatch = line.match(/\[(.*?)\]/);
                                                const timeRange = timeMatch ? timeMatch[1] : '';
                                                const [startTime, endTime] = timeRange.includes('-')
                                                    ? timeRange.split('-').map(s => s.trim())
                                                    : [timeRange.trim(), ''];
                                                const rest = line.replace(/\[.*?\]/, '').trim();
                                                const parts = rest.includes('|')
                                                    ? rest.split('|').map(p => p.trim())
                                                    : rest.split('-').map(p => p.trim());

                                                const row = {
                                                    time: startTime,
                                                    endTime: endTime,
                                                    artist: parts[0] || '',
                                                    stage: parts[1] || '',
                                                    instagram: parts[2] || '',
                                                    image: parts[3] || ''
                                                };

                                                const updateRow = (newData: Partial<typeof row>) => {
                                                    const updatedRow = { ...row, ...newData };
                                                    const newFormatted = `[${updatedRow.time || '00:00'}${updatedRow.endTime ? ` - ${updatedRow.endTime}` : ''}] ${updatedRow.artist || 'ARTISTE'} - ${updatedRow.stage || ' '} - ${updatedRow.instagram || ' '} - ${updatedRow.image || ' '}`;
                                                    const rows = (takeoverState?.lineup || '').split('\n').map((l, i) => i === idx ? newFormatted : l);
                                                    onTakeoverChange?.({ ...takeoverState!, lineup: rows.join('\n') });
                                                };

                                                const moveRow = (direction: 'up' | 'down') => {
                                                    const rows = (takeoverState?.lineup || '').split('\n').filter(Boolean);
                                                    if (direction === 'up' && idx > 0) {
                                                        [rows[idx], rows[idx - 1]] = [rows[idx - 1], rows[idx]];
                                                    } else if (direction === 'down' && idx < rows.length - 1) {
                                                        [rows[idx], rows[idx + 1]] = [rows[idx + 1], rows[idx]];
                                                    }
                                                    onTakeoverChange?.({ ...takeoverState!, lineup: rows.join('\n') });
                                                };

                                                const deleteRow = () => {
                                                    const rows = (takeoverState?.lineup || '').split('\n').filter((_, i) => i !== idx);
                                                    onTakeoverChange?.({ ...takeoverState!, lineup: rows.join('\n') });
                                                };

                                                return (
                                                    <div key={idx} className="grid grid-cols-12 gap-2 bg-white/[0.03] border border-white/5 p-2 rounded-xl hover:border-white/15 transition-all items-center">
                                                        <div className="col-span-1">
                                                            <input
                                                                type="text"
                                                                value={row.time}
                                                                onChange={(e) => updateRow({ time: e.target.value })}
                                                                placeholder="22:00"
                                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-1 py-1.5 text-[10px] text-white font-black text-center focus:border-neon-red outline-none"
                                                            />
                                                        </div>
                                                        <div className="col-span-1">
                                                            <input
                                                                type="text"
                                                                value={row.endTime}
                                                                onChange={(e) => updateRow({ endTime: e.target.value })}
                                                                placeholder="23:00"
                                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-1 py-1.5 text-[10px] text-white font-black text-center focus:border-neon-red outline-none"
                                                            />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <input
                                                                type="text"
                                                                value={row.artist}
                                                                onChange={(e) => updateRow({ artist: e.target.value })}
                                                                placeholder="Artiste..."
                                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-black uppercase focus:border-neon-red outline-none"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input
                                                                type="text"
                                                                value={row.stage}
                                                                onChange={(e) => updateRow({ stage: e.target.value })}
                                                                placeholder="Scène..."
                                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-bold uppercase focus:border-neon-red outline-none"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input
                                                                type="text"
                                                                value={row.instagram}
                                                                onChange={(e) => updateRow({ instagram: e.target.value })}
                                                                placeholder="@insta..."
                                                                className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white font-bold uppercase focus:border-neon-red outline-none"
                                                            />
                                                        </div>
                                                        <div className="col-span-2 flex items-center gap-1.5">
                                                            <div className="w-7 h-7 rounded bg-black/80 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                                                                {row.image ? (
                                                                    <img src={row.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={row.image}
                                                                onChange={(e) => updateRow({ image: e.target.value })}
                                                                placeholder="URL Image"
                                                                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-1.5 py-1 text-[9px] text-white outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUploadImageForLineup((url) => updateRow({ image: url }))}
                                                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all shrink-0"
                                                                title="Uploader une photo"
                                                            >
                                                                <Upload className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="col-span-1 flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveRow('up')}
                                                                disabled={idx === 0}
                                                                className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                                                                title="Monter"
                                                            >
                                                                <ChevronUp className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveRow('down')}
                                                                disabled={idx === arr.length - 1}
                                                                className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                                                                title="Descendre"
                                                            >
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={deleteRow}
                                                                className="p-1 text-gray-500 hover:text-red-400"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {!(takeoverState?.lineup && takeoverState.lineup.trim()) && (
                                                <div className="text-center py-8 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                                                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
                                                        Aucun passage dans le planning. Cliquez sur "+ Ajouter un passage" pour commencer.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB 3: MODÉRATION */}
                                {liveSubTab === 'moderation' && (
                                    <div className="space-y-4 flex-1">
                                        {/* Link security */}
                                        <div className="p-5 bg-red-500/5 border border-red-500/15 rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                    <ShieldAlert className="w-4 h-4 text-red-500" />
                                                    Sécurité anti-spam et liens
                                                </span>
                                                <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-[9px] font-black uppercase border border-green-500/30">
                                                    Actif en continu
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400">
                                                Les viewers standard ne peuvent pas poster d'URL. Seuls les administrateurs et membres de l'équipe modération ont l'autorisation d'envoyer des liens.
                                            </p>
                                        </div>

                                        {/* Pinned message */}
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Pin className="w-4 h-4 text-neon-red" />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                                        Message Épinglé dans le Chat
                                                    </h3>
                                                </div>
                                                {takeoverState?.pinnedMessage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onTakeoverChange?.({ ...takeoverState!, pinnedMessage: '' })}
                                                        className="flex items-center gap-1 text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                                                    >
                                                        <PinOff className="w-3 h-3" />
                                                        Retirer l'épingle
                                                    </button>
                                                )}
                                            </div>

                                            <textarea
                                                value={takeoverState?.pinnedMessage || ''}
                                                onChange={(e) => onTakeoverChange?.({ ...takeoverState!, pinnedMessage: e.target.value })}
                                                placeholder="Ex: ⚠️ Set de Martin Garrix en cours sur la Main Stage ! Votez dans le chat !"
                                                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red min-h-[70px] resize-none"
                                            />
                                            <p className="text-[9px] text-gray-500 italic">
                                                Ce message sera affiché de manière permanente en haut du chat pour tous les spectateurs.
                                            </p>
                                        </div>

                                        {/* Banned Users */}
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-yellow-500" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                                    Utilisateurs Bloqués / Bannis du Chat
                                                </h3>
                                            </div>
                                            {bannedChatUsers.length === 0 ? (
                                                <p className="text-[10px] text-white/40 italic py-2">
                                                    Aucun utilisateur actuellement bloqué dans le chat.
                                                </p>
                                            ) : (
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                    {bannedChatUsers.map((user) => (
                                                        <div key={user} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                                                            <span className="text-xs font-black text-white">{user}</span>
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    setBannedChatUsers(prev => prev.filter(u => u !== user));
                                                                    try {
                                                                        await apiFetch('/api/chat/unban', {
                                                                            method: 'POST',
                                                                            headers: getAuthHeaders(),
                                                                            body: JSON.stringify({ pseudo: user })
                                                                        });
                                                                    } catch {}
                                                                }}
                                                                className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-[9px] font-black uppercase"
                                                            >
                                                                Débloquer
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB 4: BANDEAU TICKER */}
                                {liveSubTab === 'ticker' && (
                                    <div className="space-y-4 flex-1">
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-neon-red" />
                                                        Bandeau Défilant sous le Player
                                                    </p>
                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
                                                        Affiche des infos en direct sous le stream
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onTakeoverChange?.({ ...takeoverState!, showTickerBanner: !takeoverState?.showTickerBanner })}
                                                    className={`w-11 h-6 rounded-full relative transition-all ${
                                                        takeoverState?.showTickerBanner ? 'bg-neon-red shadow-[0_0_15px_#ff003344]' : 'bg-gray-800'
                                                    }`}
                                                >
                                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                                                        takeoverState?.showTickerBanner ? 'right-1' : 'left-1'
                                                    }`} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                        Type de contenu
                                                    </label>
                                                    <select
                                                        value={takeoverState?.tickerType || 'news'}
                                                        onChange={(e) => onTakeoverChange?.({ ...takeoverState!, tickerType: e.target.value as any })}
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-neon-red outline-none"
                                                    >
                                                        <option value="news">Actu Automatique du Site</option>
                                                        <option value="planning">Programme en Cours (Timetable)</option>
                                                        <option value="custom">Texte Personnalisé</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            Couleur Fond
                                                        </label>
                                                        <input
                                                            type="color"
                                                            value={takeoverState?.tickerBgColor || '#000000'}
                                                            onChange={(e) => onTakeoverChange?.({ ...takeoverState!, tickerBgColor: e.target.value })}
                                                            className="w-full h-[38px] bg-black/60 border border-white/10 rounded-xl p-1 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            Couleur Texte
                                                        </label>
                                                        <input
                                                            type="color"
                                                            value={takeoverState?.tickerTextColor || '#ffffff'}
                                                            onChange={(e) => onTakeoverChange?.({ ...takeoverState!, tickerTextColor: e.target.value })}
                                                            className="w-full h-[38px] bg-black/60 border border-white/10 rounded-xl p-1 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {takeoverState?.tickerType === 'custom' && (
                                                <div className="space-y-3 pt-2 border-t border-white/5">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            Texte à faire défiler
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={takeoverState?.tickerText || ''}
                                                            onChange={(e) => onTakeoverChange?.({ ...takeoverState!, tickerText: e.target.value })}
                                                            placeholder="Ex: Suivez-nous sur Instagram @dropsiders pour les coulisses !"
                                                            className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-neon-red outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            Lien au clic (Optionnel)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={takeoverState?.tickerLink || ''}
                                                            onChange={(e) => onTakeoverChange?.({ ...takeoverState!, tickerLink: e.target.value })}
                                                            placeholder="https://..."
                                                            className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-neon-red outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB 5: BOT CHAT */}
                                {liveSubTab === 'bot' && (
                                    <div className="space-y-4 flex-1">
                                        {/* Auto message */}
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-neon-cyan" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                                    Message Automatique Programmé
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                                <div className="md:col-span-8">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                        Contenu du message
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={takeoverState?.autoMessage || ''}
                                                        onChange={(e) => onTakeoverChange?.({ ...takeoverState!, autoMessage: e.target.value })}
                                                        placeholder="Ex: Bienvenue sur le Live Dropsiders ! Partagez vos moments forts."
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-neon-cyan outline-none"
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                        Intervalle (Secondes)
                                                    </label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                                        <input
                                                            type="number"
                                                            value={takeoverState?.autoMessageInterval || 60}
                                                            onChange={(e) => onTakeoverChange?.({ ...takeoverState!, autoMessageInterval: parseInt(e.target.value) || 60 })}
                                                            className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-black focus:border-neon-cyan outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-gray-500 italic">
                                                * Laissez le champ message vide pour désactiver la diffusion automatique du bot.
                                            </p>
                                        </div>

                                        {/* Custom commands */}
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-neon-cyan" />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                                        Commandes Personnalisées du Chat ({((takeoverState?.customCommands || '').split('\n').filter(Boolean)).length})
                                                    </h3>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = (takeoverState?.customCommands || '').split('\n').filter(Boolean);
                                                        const updated = [...current, '!commande:Votre réponse ici'].join('\n');
                                                        onTakeoverChange?.({ ...takeoverState!, customCommands: updated });
                                                    }}
                                                    className="px-3 py-1.5 bg-neon-cyan text-black text-[9px] font-black uppercase rounded-lg hover:scale-105 transition-all"
                                                >
                                                    + Créer une commande
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {((takeoverState?.customCommands || '').split('\n').filter(Boolean)).map((line, idx) => {
                                                    const parts = line.split(':');
                                                    const cmd = parts[0] || '';
                                                    const res = parts.slice(1).join(':') || '';

                                                    const updateCmd = (newCmd: string, newRes: string) => {
                                                        const rows = (takeoverState?.customCommands || '').split('\n').map((l, i) => i === idx ? `${newCmd}:${newRes}` : l);
                                                        onTakeoverChange?.({ ...takeoverState!, customCommands: rows.join('\n') });
                                                    };

                                                    const deleteCmd = () => {
                                                        const rows = (takeoverState?.customCommands || '').split('\n').filter((_, i) => i !== idx);
                                                        onTakeoverChange?.({ ...takeoverState!, customCommands: rows.join('\n') });
                                                    };

                                                    return (
                                                        <div key={idx} className="grid grid-cols-12 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="text"
                                                                    value={cmd}
                                                                    onChange={(e) => updateCmd(e.target.value, res)}
                                                                    placeholder="!cmd"
                                                                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neon-cyan font-black focus:border-neon-cyan outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-7">
                                                                <input
                                                                    type="text"
                                                                    value={res}
                                                                    onChange={(e) => updateCmd(cmd, e.target.value)}
                                                                    placeholder="Réponse du bot..."
                                                                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-neon-cyan outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 flex justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={deleteCmd}
                                                                    className="p-1.5 text-gray-500 hover:text-red-400"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB 6: ÉQUIPE MODOS */}
                                {liveSubTab === 'mods' && (
                                    <div className="space-y-4 flex-1">
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-neon-red" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                                                    Membres de l'Équipe & Modérateurs
                                                </h3>
                                            </div>
                                            <input
                                                type="text"
                                                value={takeoverState?.moderators || ''}
                                                onChange={(e) => onTakeoverChange?.({ ...takeoverState!, moderators: e.target.value.toUpperCase() })}
                                                placeholder="Séparez les pseudos par des virgules (EX: ALEX, TANGUY, EMMA)"
                                                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-bold focus:border-neon-red outline-none"
                                            />
                                            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed tracking-wider">
                                                    LES UTILISATEURS LISTÉS ICI AURONT AUTOMATIQUEMENT LE DROIT DE :
                                                </p>
                                                <ul className="text-[10px] text-white/80 font-bold list-disc list-inside space-y-0.5">
                                                    <li>Supprimer des messages du chat</li>
                                                    <li>Partager des liens externes sans restriction</li>
                                                    <li>Bannir / débloquer des utilisateurs indésirables</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB 7: ACCÈS / MODE SECRET */}
                                {liveSubTab === 'access' && (
                                    <div className="space-y-4 flex-1">
                                        <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                        <Lock className="w-4 h-4 text-neon-purple" />
                                                        Mode Secret & Protection par Code
                                                    </p>
                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
                                                        Exige un mot de passe pour accéder à la page Live
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onTakeoverChange?.({ ...takeoverState!, isSecret: !takeoverState?.isSecret })}
                                                    className={`w-11 h-6 rounded-full relative transition-all ${
                                                        takeoverState?.isSecret ? 'bg-neon-purple shadow-[0_0_15px_#bc13fe44]' : 'bg-gray-800'
                                                    }`}
                                                >
                                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                                                        takeoverState?.isSecret ? 'right-1' : 'left-1'
                                                    }`} />
                                                </button>
                                            </div>

                                            {takeoverState?.isSecret && (
                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                    <label className="block text-[9px] font-black text-neon-purple uppercase tracking-widest">
                                                        Code secret d'accès
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={takeoverState?.password || ''}
                                                        onChange={(e) => onTakeoverChange?.({ ...takeoverState!, password: e.target.value })}
                                                        placeholder="EX: 2026"
                                                        className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-black tracking-[0.3em] text-center focus:border-neon-purple outline-none"
                                                    />
                                                </div>
                                            )}

                                            <p className="text-[9px] text-gray-500 italic">
                                                * Idéal pour tester votre installation avec votre équipe technique avant l'ouverture publique du live.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Save Button for Live Takeover */}
                                <div className="pt-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setLiveSaving(true);
                                            try {
                                                if (onSaveTakeover) {
                                                    await onSaveTakeover();
                                                } else {
                                                    const resSets = await apiFetch('/api/settings');
                                                    const current = resSets.ok ? await resSets.json() : {};
                                                    await apiFetch('/api/settings/update', {
                                                        method: 'POST',
                                                        headers: getAuthHeaders(),
                                                        body: JSON.stringify({ ...current, takeover: takeoverState })
                                                    });
                                                }
                                                setLiveSaved(true);
                                                setTimeout(() => setLiveSaved(false), 3000);
                                            } catch (e) {
                                                console.error("Erreur sauvegarde live takeover:", e);
                                            } finally {
                                                setLiveSaving(false);
                                            }
                                        }}
                                        disabled={liveSaving}
                                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-neon-red to-neon-purple text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-xl shadow-red-600/25 disabled:opacity-50 active:scale-95"
                                    >
                                        {liveSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : liveSaved ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-300" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {liveSaved ? 'Paramètres Live Takeover sauvegardés avec succès !' : 'Enregistrer tous les réglages Live Takeover'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Modal Footer Controls for TV Tab */}
                        {activeTab !== 'live' && (
                            <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restaurer la liste par défaut
                                </button>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    {saveSuccess && (
                                        <div className="flex items-center gap-1 text-xs text-neon-green font-bold animate-fade-in">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {saveMessage || 'Enregistré !'}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="flex items-center gap-1 text-xs text-red-400 font-bold max-w-xs truncate" title={error}>
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-neon-red to-neon-purple text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-neon-red/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3.5 h-3.5" />
                                                Enregistrer la programmation
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
