import React, { useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Tv, Plus, Trash2, ChevronUp, ChevronDown, Save, ExternalLink, 
    RotateCcw, CheckCircle2, Loader2, AlertCircle, Film, ChevronRight, 
    Sparkles, Radio, Zap, Eye, Calendar, Home, Video, Shield, ShieldAlert, ShieldCheck, Instagram, Camera, 
    Pin, PinOff, MessageSquare, Clock, Lock, User, Upload, 
    Image as ImageIcon, Pencil, LayoutDashboard, Globe, Activity,
    Layers, Palette, Sliders, Search, Check, ListPlus, ArrowUpDown,
    ArrowDownToLine, Maximize2, Minimize2
} from 'lucide-react';
import { RadionomyJinglesBox, type RadionomyItem } from './RadionomyJinglesBox';
import { YouTubeSearchModal } from './YouTubeSearchModal';
import { apiFetch, getAuthHeaders } from '../../../utils/auth';
import { uploadFile } from '../../../utils/uploadService';
import type { TVVideo, PromoVideo } from '../../../pages/DropsidersTVPage';
import type { TVScheduleBlock } from '../../../utils/tvSchedule';
import { DuplicateAuditModal, detectTVDuplicates, type DuplicateEntry } from '../../ui/DuplicateAuditModal';
import { ConfirmModal, type ConfirmModalData } from '../../ui/ConfirmModal';
import { 
    DEFAULT_TV_BLOCKS, 
    STORAGE_TV_BLOCKS_KEY, 
    getActiveTVBlock,
    formatTimeSlot,
    DAYS_OF_WEEK,
    ALL_DAYS,
    WEEKDAYS,
    WEEKEND_DAYS,
    formatBlockDays,
    isBlockActiveOnDay,
    sortBlocksByBroadcastOrder,
    detectVideoCategory,
    shareSameArtist,
    type TVVideoCategory
} from '../../../utils/tvSchedule';

export type { TVVideo, PromoVideo, TVScheduleBlock };

const PRESET_EMOJIS = ['🌅', '🎪', '☀️', '⭐', '🌙', '🎧', '🔥', '⚡', '🚀', '🎵', '🕺', '📻', '💎', '🎉'];
const PRESET_COLORS = [
    { name: 'Ambre', hex: '#f59e0b' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Émeraude', hex: '#10b981' },
    { name: 'Rouge Neon', hex: '#ff1241' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Rose', hex: '#ec4899' },
    { name: 'Bleu', hex: '#3b82f6' },
    { name: 'Orange', hex: '#f97316' },
];

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

interface LibraryVideoItem {
    youtubeId: string;
    title: string;
    description?: string;
    duration?: number;
    sources: string[];
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

export interface LineupArtist {
    id: string;
    artist: string;
    image: string; // Photo obligatoire
    stage: string; // Flux enregistré sélectionné
    startTime: string;
    endTime: string;
    instagram?: string;
    day?: string;
}

export interface TakeoverStatePartial {
    enabled?: boolean;
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
    onSaveTakeover?: (updated?: TakeoverStatePartial) => Promise<void>;
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
    const navigate = useNavigate();
    const handleCloseModal = () => {
        onClose();
        navigate('/admin');
    };

    const updateTakeoverField = useCallback((field: string, value: any) => {
        const updated: TakeoverStatePartial = {
            enabled: false,
            ...(takeoverState || {}),
            [field]: value
        };
        if (onTakeoverChange) onTakeoverChange(updated);
    }, [takeoverState, onTakeoverChange]);

    const handleSaveLive = async () => {
        setLiveSaving(true);
        try {
            if (onSaveTakeover) {
                await onSaveTakeover(takeoverState);
            }
            setLiveSaved(true);
            setTimeout(() => setLiveSaved(false), 2500);
        } catch (e) {
            console.error('Save live error', e);
        } finally {
            setLiveSaving(false);
        }
    };

    const [_isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<'blocks' | 'promo' | 'main' | 'live'>('blocks');
    const switchTab = useCallback((tab: 'blocks' | 'promo' | 'main' | 'live') => {
        startTransition(() => setActiveTab(tab));
    }, [startTransition]);
        // ─── États Lineup avec Photo Obligatoire & Flux Enregistrés ───
    const [showAddArtistModal, setShowAddArtistModal] = useState(false);
    const [newArtistName, setNewArtistName] = useState('');
    const [newArtistImage, setNewArtistImage] = useState('');
    const [newArtistStage, setNewArtistStage] = useState('Main Stage');
    const [newArtistStartTime, setNewArtistStartTime] = useState('');
    const [newArtistEndTime, setNewArtistEndTime] = useState('');
    const [newArtistInstagram, setNewArtistInstagram] = useState('');
    const [newArtistDay, setNewArtistDay] = useState(() => new Date().toISOString().split('T')[0]);
    const [isUploadingArtistImage, setIsUploadingArtistImage] = useState(false);
    const [artistFormError, setArtistFormError] = useState<string | null>(null);

    // Extraction des flux enregistrés pour le choix des stages
    const recordedStages = useMemo(() => {
        const list: string[] = ['Main Stage (Flux Principal)'];
        if (takeoverState?.channels) {
            takeoverState.channels.split(/[,;\n]/).forEach((c: string) => {
                const trimmed = c.trim();
                if (trimmed && !list.includes(trimmed)) list.push(trimmed);
            });
        }
        if (takeoverState?.streams && Array.isArray(takeoverState.streams)) {
            takeoverState.streams.forEach((s: any) => {
                if (s?.name && !list.includes(s.name)) list.push(s.name);
            });
        }
        if (!list.includes('Stage 2')) list.push('Stage 2');
        if (!list.includes('Stage 3')) list.push('Stage 3');
        return list;
    }, [takeoverState?.channels, takeoverState?.streams]);

    // Parse du lineup (compatibilité JSON LineupItem[] ou fallback texte)
    const parsedLineupArtists = useMemo<LineupArtist[]>(() => {
        const raw = takeoverState?.lineup;
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch {}
        return raw.split('\n').filter(Boolean).map((line: string, idx: number) => {
            let time = '', artist = '', stage = 'Main Stage', image = '', instagram = '';
            const timeMatch = line.match(/\[(.*?)\]/);
            if (timeMatch) {
                time = timeMatch[1];
                const parts = line.replace(timeMatch[0], '').split('|').map((p: string) => p.trim());
                artist = parts[0] || '';
                stage = parts[1] || 'Main Stage';
                image = parts[2] || '';
                instagram = parts[3] || '';
            } else {
                const parts = line.split('|').map((p: string) => p.trim());
                artist = parts[0] || '';
                stage = parts[1] || 'Main Stage';
                image = parts[2] || '';
                instagram = parts[3] || '';
            }
            const [st, et] = time.includes('-') ? time.split('-').map((t: string) => t.trim()) : [time, ''];
            return {
                id: `artist_${idx}_${Date.now()}`,
                artist,
                stage,
                startTime: st,
                endTime: et,
                image,
                instagram,
                day: new Date().toISOString().split('T')[0]
            };
        });
    }, [takeoverState?.lineup]);

    const handleSaveNewArtist = () => {
        if (!newArtistName.trim()) {
            setArtistFormError("Le nom de l'artiste est obligatoire.");
            return;
        }
        if (!newArtistImage.trim()) {
            setArtistFormError("⚠️ La photo de l'artiste est OBLIGATOIRE.");
            return;
        }
        if (!newArtistStartTime.trim()) {
            setArtistFormError("L'heure de passage est requise.");
            return;
        }

        const newEntry: LineupArtist = {
            id: `artist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            artist: newArtistName.trim().toUpperCase(),
            image: newArtistImage.trim(),
            stage: newArtistStage,
            startTime: newArtistStartTime,
            endTime: newArtistEndTime || newArtistStartTime,
            instagram: newArtistInstagram.trim(),
            day: newArtistDay
        };

        const updated = [...parsedLineupArtists, newEntry];
        updateTakeoverField('lineup', JSON.stringify(updated));

        // Reset
        setNewArtistName('');
        setNewArtistImage('');
        setNewArtistStartTime('');
        setNewArtistEndTime('');
        setNewArtistInstagram('');
        setArtistFormError(null);
        setShowAddArtistModal(false);
    };

    const handleDeleteArtist = (id: string) => {
        const updated = parsedLineupArtists.filter(a => a.id !== id);
        updateTakeoverField('lineup', JSON.stringify(updated));
    };

    const handleUploadArtistPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingArtistImage(true);
        setArtistFormError(null);
        try {
            const url = await uploadFile(file, 'lineup');
            if (url) {
                setNewArtistImage(url);
            }
        } catch (err: any) {
            console.error('Upload failed', err);
            setArtistFormError("Échec upload image. Réessayez.");
        } finally {
            setIsUploadingArtistImage(false);
        }
    };

    const [liveSubTab, setLiveSubTab] = useState<'general' | 'planning' | 'moderation' | 'ticker' | 'bot' | 'mods' | 'access'>('general');
    const [liveSaving, setLiveSaving] = useState(false);
    const [liveSaved, setLiveSaved] = useState(false);

    // ─── Mode Plein Écran & Radionomy & Recherche YouTube ─────────────────────
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRadionomyOpen, setIsRadionomyOpen] = useState(false);
    const [isYouTubeSearchOpen, setIsYouTubeSearchOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<ConfirmModalData>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        hideCancel: false,
        onConfirm: () => {}
    });

    // 5 Time Blocks Schedule
    // 5 Time Blocks Schedule (trié automatiquement selon l'ordre chronologique de passage 06h -> 06h)
    const [blocks, setBlocks] = useState<TVScheduleBlock[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return sortBlocksByBroadcastOrder(parsed, true);
                }
            }
        } catch {}
        return sortBlocksByBroadcastOrder(DEFAULT_TV_BLOCKS, true);
    });
    const [selectedBlockId, setSelectedBlockId] = useState<string>('bloc_1');
    const [showAllBlocksOverview, setShowAllBlocksOverview] = useState(false);
    const [filterDay, setFilterDay] = useState<'all' | number>('all');

    // Add video to block form
    const [blockVideoUrl, setBlockVideoUrl] = useState('');
    const [blockVideoTitle, setBlockVideoTitle] = useState('');
    const [blockVideoCategory, setBlockVideoCategory] = useState<TVVideoCategory>('liveset');
    const [blockCategoryFilter, setBlockCategoryFilter] = useState<'all' | TVVideoCategory>('all');
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

    // Inline title editing state
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
    const [editingVideoTitle, setEditingVideoTitle] = useState('');
    const [editingVideoCategory, setEditingVideoCategory] = useState<TVVideoCategory>('liveset');

    // Modal Bibliothèque : Clips & Lives déjà programmés
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [libraryTarget, setLibraryTarget] = useState<'block' | 'main'>('block');
    const [librarySearch, setLibrarySearch] = useState('');
    const deferredLibrarySearch = useDeferredValue(librarySearch);
    const [libraryFilter, setLibraryFilter] = useState<string>('all');
    const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);

    // Audit doublons TV
    const [tvDuplicates, setTvDuplicates] = useState<DuplicateEntry[]>([]);
    const [showTVDuplicateAudit, setShowTVDuplicateAudit] = useState(false);

    // Blocks radio chargés (pour la feature 'Ajouter depuis Radio')
    const [radioBlocks, setRadioBlocks] = useState<Array<{ id: string; title: string; emoji?: string; color?: string; tracks?: Array<{ id: string; title?: string; artist?: string; youtubeId: string; duration?: number; category?: string }> }>>([]);
    const [showAddFromRadio, setShowAddFromRadio] = useState(false);
    const [radioLibSearch, setRadioLibSearch] = useState('');
    const deferredRadioSearch = useDeferredValue(radioLibSearch);

    // Catalogue complet et dédoublonné de tous les clips & lives déjà programmés
    const availableLibraryVideos = useMemo<LibraryVideoItem[]>(() => {
        const map = new Map<string, LibraryVideoItem>();

        // 1. Émissions actuelles
        (blocks || []).forEach(b => {
            const blockLabel = b.title || b.name || 'Émission';
            (b.videos || []).forEach(v => {
                if (!v.youtubeId) return;
                const existing = map.get(v.youtubeId);
                if (existing) {
                    if (!existing.sources.includes(blockLabel)) {
                        existing.sources.push(blockLabel);
                    }
                } else {
                    map.set(v.youtubeId, {
                        youtubeId: v.youtubeId,
                        title: v.title || `Vidéo ${v.youtubeId}`,
                        description: v.description,
                        duration: v.duration,
                        sources: [blockLabel]
                    });
                }
            });
        });

        // 2. Programmation principale actuelle
        (playlist || []).forEach(v => {
            if (!v.youtubeId) return;
            const existing = map.get(v.youtubeId);
            if (existing) {
                if (!existing.sources.includes('Programmation principale')) {
                    existing.sources.push('Programmation principale');
                }
            } else {
                map.set(v.youtubeId, {
                    youtubeId: v.youtubeId,
                    title: v.title || `Vidéo ${v.youtubeId}`,
                    description: v.description,
                    duration: v.duration,
                    sources: ['Programmation principale']
                });
            }
        });

        // 3. Catalogue par défaut des blocs (Sets & Clips cultes)
        DEFAULT_TV_BLOCKS.forEach(b => {
            const blockLabel = b.title || b.name || 'Catalogue';
            (b.videos || []).forEach(v => {
                if (!v.youtubeId) return;
                const existing = map.get(v.youtubeId);
                if (existing) {
                    if (!existing.sources.includes(blockLabel)) {
                        existing.sources.push(blockLabel);
                    }
                } else {
                    map.set(v.youtubeId, {
                        youtubeId: v.youtubeId,
                        title: v.title || `Vidéo ${v.youtubeId}`,
                        description: v.description,
                        duration: v.duration,
                        sources: [blockLabel]
                    });
                }
            });
        });

        // 4. Catalogue par défaut de la playlist principale
        DEFAULT_MAIN_PLAYLIST.forEach(v => {
            if (!v.youtubeId) return;
            const existing = map.get(v.youtubeId);
            if (existing) {
                if (!existing.sources.includes('Programmation principale')) {
                    existing.sources.push('Programmation principale');
                }
            } else {
                map.set(v.youtubeId, {
                    youtubeId: v.youtubeId,
                    title: v.title || `Vidéo ${v.youtubeId}`,
                    description: v.description,
                    duration: v.duration,
                    sources: ['Programmation principale']
                });
            }
        });

        return Array.from(map.values());
    }, [blocks, playlist]);

    // Liste des sources distinctes pour le filtrage par onglets
    const librarySources = useMemo(() => {
        const set = new Set<string>();
        availableLibraryVideos.forEach(v => v.sources.forEach(s => set.add(s)));
        return Array.from(set);
    }, [availableLibraryVideos]);

    // Filtrage recherche & source
    const filteredLibraryVideos = useMemo(() => {
        let list = availableLibraryVideos;
        if (libraryFilter !== 'all') {
            list = list.filter(v => v.sources.includes(libraryFilter));
        }
        if (deferredLibrarySearch.trim()) {
            const q = deferredLibrarySearch.toLowerCase().trim();
            list = list.filter(v => 
                v.title.toLowerCase().includes(q) ||
                (v.description && v.description.toLowerCase().includes(q)) ||
                v.youtubeId.toLowerCase().includes(q) ||
                v.sources.some(s => s.toLowerCase().includes(q))
            );
        }
        return list;
    }, [availableLibraryVideos, libraryFilter, deferredLibrarySearch]);

    // Vérifie si une vidéo est déjà programmée dans la cible active (émission ou playlist principale)
    const isVideoInTarget = useCallback((ytid: string): boolean => {
        if (libraryTarget === 'block') {
            const targetBlock = blocks.find(b => b.id === selectedBlockId);
            return !!targetBlock?.videos?.some(v => v.youtubeId === ytid);
        } else {
            return playlist.some(v => v.youtubeId === ytid);
        }
    }, [libraryTarget, blocks, selectedBlockId, playlist]);

    // Style et couleur d'une source (émission TV ou Radio) pour l'affichage des badges
    const getSourceStyle = (sourceName: string) => {
        const tvBlock = (blocks || []).find(b => (b.title || b.name) === sourceName);
        if (tvBlock) return { color: tvBlock.color || '#00f0ff', emoji: tvBlock.emoji || '📺' };
        const rBlock = (radioBlocks || []).find(r => r.title === sourceName);
        if (rBlock) return { color: rBlock.color || '#f59e0b', emoji: rBlock.emoji || '📻' };
        if (sourceName === 'Programmation principale') return { color: '#ff1241', emoji: '🎬' };
        return { color: '#94a3b8', emoji: '📁' };
    };

    // Ouverture de la bibliothèque avec initialisation de la cible
    const handleOpenLibrary = (target: 'block' | 'main') => {
        setLibraryTarget(target);
        setSelectedLibraryIds([]);
        setLibrarySearch('');
        setLibraryFilter('all');
        setIsLibraryOpen(true);
    };

    // Basculer la sélection pour l'ajout multiple
    const handleToggleSelectLibraryItem = (ytid: string) => {
        if (isVideoInTarget(ytid)) return; // Empêcher sélection d'un doublon
        setSelectedLibraryIds(prev => 
            prev.includes(ytid) ? prev.filter(id => id !== ytid) : [...prev, ytid]
        );
    };

    // Sélectionner tout / désélectionner tout parmi les résultats filtrés non doublons
    const handleToggleSelectAllLibrary = () => {
        const addableIds = filteredLibraryVideos
            .filter(v => !isVideoInTarget(v.youtubeId))
            .map(v => v.youtubeId);

        const allSelected = addableIds.length > 0 && addableIds.every(id => selectedLibraryIds.includes(id));
        if (allSelected) {
            setSelectedLibraryIds([]);
        } else {
            setSelectedLibraryIds(addableIds);
        }
    };

    // Ajout direct 1-clic d'une vidéo depuis la bibliothèque
    const handleAddSingleFromLibrary = (item: LibraryVideoItem) => {
        if (isVideoInTarget(item.youtubeId)) return;

        if (libraryTarget === 'block') {
            const targetBlock = blocks.find(b => b.id === selectedBlockId);
            const newVid: TVVideo = {
                id: `bv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                title: item.title,
                description: item.description || `Diffusé sur DropsidersTV · ${targetBlock?.title || ''}`,
                youtubeId: item.youtubeId,
                duration: item.duration || 3600
            };
            setBlocks(prev => prev.map(b => {
                if (b.id !== selectedBlockId) return b;
                return { ...b, videos: [...(b.videos || []), newVid] };
            }));
        } else {
            const newVid: TVVideo = {
                id: `tv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                title: item.title,
                description: item.description || 'Diffusé sur DropsidersTV',
                youtubeId: item.youtubeId
            };
            setPlaylist(prev => [...prev, newVid]);
        }
    };

    // Ajout groupé des vidéos sélectionnées depuis la bibliothèque
    const handleAddBatchFromLibrary = () => {
        if (selectedLibraryIds.length === 0) return;

        const itemsToAdd = availableLibraryVideos.filter(
            v => selectedLibraryIds.includes(v.youtubeId) && !isVideoInTarget(v.youtubeId)
        );

        if (itemsToAdd.length === 0) {
            alert('Toutes les vidéos sélectionnées sont déjà programmées dans cette destination.');
            return;
        }

        if (libraryTarget === 'block') {
            const targetBlock = blocks.find(b => b.id === selectedBlockId);
            const newVids: TVVideo[] = itemsToAdd.map((item, idx) => ({
                id: `bv_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
                title: item.title,
                description: item.description || `Diffusé sur DropsidersTV · ${targetBlock?.title || ''}`,
                youtubeId: item.youtubeId,
                duration: item.duration || 3600
            }));
            setBlocks(prev => prev.map(b => {
                if (b.id !== selectedBlockId) return b;
                return { ...b, videos: [...(b.videos || []), ...newVids] };
            }));
        } else {
            const newVids: TVVideo[] = itemsToAdd.map((item, idx) => ({
                id: `tv_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
                title: item.title,
                description: item.description || 'Diffusé sur DropsidersTV',
                youtubeId: item.youtubeId
            }));
            setPlaylist(prev => [...prev, ...newVids]);
        }

        setSelectedLibraryIds([]);
        setIsLibraryOpen(false);
    };

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
                        setBlocks(sortBlocksByBroadcastOrder(data.tv_blocks, true));
                    } else {
                        try {
                            const localBlocks = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
                            if (localBlocks) setBlocks(sortBlocksByBroadcastOrder(JSON.parse(localBlocks), true));
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
                    if (localBlocks) setBlocks(sortBlocksByBroadcastOrder(JSON.parse(localBlocks), true));
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

        // Détection doublons TV après chargement
        setTimeout(() => {
            setBlocks(prev => {
                const dups = detectTVDuplicates(prev);
                if (dups.length > 0) {
                    setTvDuplicates(dups);
                    setShowTVDuplicateAudit(true);
                }
                return prev;
            });
        }, 1500);

        // Refresh durationsMap from localStorage each time modal opens
        try {
            const saved = localStorage.getItem('dropsiders_tv_durations');
            if (saved) setDurationsMap(JSON.parse(saved));
        } catch {}
    }, [isOpen]);

    // Résolution doublon TV
    const handleResolveTVDuplicate = (youtubeId: string, keepBlockId: string, removeFromBlockIds: string[]) => {
        setBlocks(prev => prev.map(b => {
            if (!removeFromBlockIds.includes(b.id)) return b;
            return { ...b, videos: (b.videos || []).filter(v => v.youtubeId !== youtubeId) };
        }));
        setTvDuplicates(prev => prev.filter(d => d.youtubeId !== youtubeId));
    };

    // Ajouter une piste radio dans un bloc TV
    const handleAddRadioTrackToTV = (track: { id: string; title?: string; artist?: string; youtubeId: string; duration?: number; category?: string }, targetBlockId: string) => {
        const targetBlock = blocks.find(b => b.id === targetBlockId);
        if (!targetBlock) return;
        if (targetBlock.videos?.some(v => v.youtubeId === track.youtubeId)) return; // doublon
        const newVid: TVVideo = {
            id: `bv_from_radio_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            title: track.artist ? `${track.artist} - ${track.title || track.youtubeId}` : (track.title || track.youtubeId),
            description: `Importé depuis la Radio · ${targetBlock.title || ''}`,
            youtubeId: track.youtubeId,
            duration: track.duration || 3600,
            category: (track.category as any) || 'liveset',
        };
        setBlocks(prev => prev.map(b => {
            if (b.id !== targetBlockId) return b;
            return { ...b, videos: [...(b.videos || []), newVid] };
        }));
    };

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
            setConfirmModal({
                isOpen: true,
                title: 'Lien Invalide',
                type: 'warning',
                confirmText: 'Compris',
                hideCancel: true,
                message: 'Veuillez entrer un lien YouTube valide.',
                onConfirm: () => {}
            });
            return;
        }
        const block = blocks.find(b => b.id === selectedBlockId);
        if (!block) return;

        // Anti-doublon créneau courant
        const existingInCurrent = block.videos?.find(v => v.youtubeId === ytid);
        if (existingInCurrent) {
            setConfirmModal({
                isOpen: true,
                title: 'Sécurité Anti-Doublon',
                type: 'danger',
                confirmText: 'Compris',
                hideCancel: true,
                message: (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-gray-300">
                            Cette vidéo YouTube est déjà programmée dans cette émission <span className="text-red-400 font-black">"{block.title}"</span> :
                        </p>
                        <div className="w-full p-3 rounded-2xl bg-white/5 border border-red-500/30 text-red-300 font-semibold text-xs text-center flex items-center justify-center gap-2">
                            <span>🚫</span>
                            <span className="truncate max-w-[280px]">"{existingInCurrent.title}"</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            L'ajout d'un doublon dans le même créneau est bloqué pour éviter les répétitions.
                        </p>
                    </div>
                ),
                onConfirm: () => {}
            });
            return;
        }

        const commitAdd = () => {
            const newVid: TVVideo = {
                id: `bv_${Date.now()}`,
                title: blockVideoTitle.trim() || `Vidéo ${ytid}`,
                description: `Diffusé sur Dropsiders TV · ${block?.title || ''}`,
                youtubeId: ytid,
                duration: 3600,
                category: blockVideoCategory
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

        // Information si déjà dans un autre créneau
        const otherBlock = blocks.find(b => b.id !== selectedBlockId && b.videos?.some(v => v.youtubeId === ytid));
        if (otherBlock) {
            const existingInOther = otherBlock.videos?.find(v => v.youtubeId === ytid);
            const videoTitle = existingInOther?.title || blockVideoTitle.trim() || ytid;
            setConfirmModal({
                isOpen: true,
                title: 'Information Doublon',
                type: 'warning',
                confirmText: 'Ajouter tout de même',
                cancelText: 'Annuler',
                hideCancel: false,
                message: (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-gray-300">
                            Cette vidéo est déjà programmée dans le créneau <span className="text-amber-400 font-black">"{otherBlock.title}"</span> :
                        </p>
                        <div className="w-full p-3.5 rounded-2xl bg-white/5 border border-amber-500/30 text-amber-300 font-semibold text-xs text-center flex items-center justify-center gap-2">
                            <span>🎬</span>
                            <span className="truncate max-w-[280px]">"{videoTitle}"</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Souhaitez-vous tout de même l'ajouter à l'émission <span className="text-white font-bold">"{block.title}"</span> ?
                        </p>
                    </div>
                ),
                onConfirm: () => {
                    commitAdd();
                }
            });
            return;
        }

        commitAdd();
    };

    // Nettoyage rapide des doublons dans une émission
    const handleCleanBlockDuplicates = (blockId: string) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const seen = new Set<string>();
            const cleaned: TVVideo[] = [];
            let count = 0;
            for (const v of b.videos || []) {
                if (v.youtubeId && seen.has(v.youtubeId)) {
                    count++;
                } else {
                    if (v.youtubeId) seen.add(v.youtubeId);
                    cleaned.push(v);
                }
            }
            if (count > 0) {
                alert(`Nettoyage terminé : ${count} doublon(s) supprimé(s) dans l'émission "${b.title}".`);
            }
            return { ...b, videos: cleaned };
        }));
    };

    const handleRemoveVideoFromBlock = useCallback((blockId: string, index: number) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const nextVids = [...(b.videos || [])];
            nextVids.splice(index, 1);
            return { ...b, videos: nextVids };
        }));
    }, []);

    const handleMoveVideoInBlock = useCallback((blockId: string, index: number, direction: -1 | 1) => {
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
    }, []);

    // Rename & style/category video inside a block
    const handleRenameVideoInBlock = (blockId: string, videoIdx: number, newTitle: string, newCategory?: TVVideoCategory) => {
        if (!newTitle.trim()) return;
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const nextVids = [...(b.videos || [])];
            if (nextVids[videoIdx]) {
                nextVids[videoIdx] = { 
                    ...nextVids[videoIdx], 
                    title: newTitle.trim(),
                    ...(newCategory ? { category: newCategory } : {})
                };
            }
            return { ...b, videos: nextVids };
        }));
        setEditingVideoId(null);
        setEditingVideoTitle('');
    };

    // Cycle or set video category/style directly (Liveset -> Clip -> Interview)
    const handleCycleVideoCategoryInBlock = useCallback((blockId: string, videoIdx: number, currentCategory?: TVVideoCategory) => {
        const order: TVVideoCategory[] = ['liveset', 'clip', 'interview'];
        const current = currentCategory || 'liveset';
        const nextIndex = (order.indexOf(current) + 1) % order.length;
        const nextCategory = order[nextIndex];
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const nextVids = [...(b.videos || [])];
            if (nextVids[videoIdx]) {
                nextVids[videoIdx] = { ...nextVids[videoIdx], category: nextCategory };
            }
            return { ...b, videos: nextVids };
        }));
    }, []);

    // Rename main video
    const handleRenameMainVideo = (videoId: string, newTitle: string) => {
        if (!newTitle.trim()) return;
        setPlaylist(prev => prev.map(v => v.id === videoId ? { ...v, title: newTitle.trim() } : v));
        setEditingVideoId(null);
        setEditingVideoTitle('');
    };

    // Rename promo video
    const handleRenamePromo = (promoId: string, newTitle: string) => {
        if (!newTitle.trim()) return;
        setPromos(prev => prev.map(p => p.id === promoId ? { ...p, title: newTitle.trim() } : p));
        setEditingVideoId(null);
        setEditingVideoTitle('');
    };

    const handleToggleBlockRandom = (blockId: string) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            return { ...b, randomize: !b.randomize };
        }));
    };

    // Update show name, hours, time slot, emoji, color (tri automatique de l'ordre de passage)
    const handleUpdateBlockMeta = (blockId: string, updates: Partial<TVScheduleBlock>) => {
        setBlocks(prev => {
            const updatedList = prev.map(b => {
                if (b.id !== blockId) return b;
                const updated = { ...b, ...updates };
                // Auto update timeSlot if startHour or endHour changed and timeSlot wasn't explicitly supplied
                if (('startHour' in updates || 'endHour' in updates) && !updates.timeSlot) {
                    const s = updated.startHour ?? 0;
                    const e = updated.endHour ?? 24;
                    updated.timeSlot = formatTimeSlot(s, e);
                }
                // Keep block name label synced if title is edited
                if (updates.title && !updates.name) {
                    const prefix = b.name.includes('·') ? b.name.split('·')[0].trim() : `Bloc`;
                    updated.name = `${prefix} · ${updates.title}`;
                }
                return updated;
            });
            // Si les heures de passage ont été modifiées, trier automatiquement dans l'ordre chronologique
            if ('startHour' in updates || 'endHour' in updates) {
                return sortBlocksByBroadcastOrder(updatedList, true);
            }
            return updatedList;
        });
    };

    // Add a new emission block (inséré et ordonné automatiquement)
    const handleAddBlock = () => {
        const newId = `bloc_${Date.now()}`;
        const nextNum = blocks.length + 1;
        const newBlock: TVScheduleBlock = {
            id: newId,
            name: `Bloc ${nextNum} · Nouvelle émission`,
            title: `Émission ${nextNum}`,
            timeSlot: '12h - 14h',
            startHour: 12,
            endHour: 14,
            color: '#06b6d4',
            emoji: '📺',
            randomize: true,
            days: [...ALL_DAYS],
            videos: []
        };
        setBlocks(prev => sortBlocksByBroadcastOrder([...prev, newBlock], true));
        setSelectedBlockId(newId);
    };

    // Toggle a day for a specific block
    const handleToggleBlockDay = (blockId: string, day: number) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const currentDays = b.days && Array.isArray(b.days) && b.days.length > 0 
                ? [...b.days] 
                : [...ALL_DAYS];
            const nextDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            // Don't allow 0 days selected - fallback to all days
            const finalDays = nextDays.length === 0 ? [...ALL_DAYS] : nextDays;
            return { ...b, days: finalDays };
        }));
    };

    // Set days preset (all / weekdays / weekend)
    const handleSetBlockDaysPreset = (blockId: string, preset: 'all' | 'weekdays' | 'weekend') => {
        let days: number[];
        if (preset === 'all') days = [...ALL_DAYS];
        else if (preset === 'weekdays') days = [...WEEKDAYS];
        else days = [...WEEKEND_DAYS];
        handleUpdateBlockMeta(blockId, { days });
    };

    // Delete an emission block
    const handleDeleteBlock = (blockId: string) => {
        if (blocks.length <= 1) {
            setConfirmModal({
                isOpen: true,
                title: 'Action Impossible',
                message: 'Il doit rester au moins une émission dans la grille.',
                type: 'warning',
                confirmText: 'Compris',
                hideCancel: true,
                onConfirm: () => {}
            });
            return;
        }
        const blockToDelete = blocks.find(b => b.id === blockId);
        setConfirmModal({
            isOpen: true,
            title: "Supprimer l'émission",
            message: `Supprimer l'émission "${blockToDelete?.title || blockId}" et toutes ses vidéos associées ?`,
            type: 'danger',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            hideCancel: false,
            onConfirm: () => {
                setBlocks(prev => {
                    const next = sortBlocksByBroadcastOrder(prev.filter(b => b.id !== blockId), true);
                    if (selectedBlockId === blockId && next.length > 0) {
                        setSelectedBlockId(next[0].id);
                    }
                    return next;
                });
            }
        });
    };

    // Tri manuel ou ré-alignement de l'ordre de passage
    const handleSortBlocksOrder = () => {
        setBlocks(prev => sortBlocksByBroadcastOrder(prev, true));
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

        // Anti-doublon playlist principale
        const existingMain = playlist.find(v => v.youtubeId === ytid);
        if (existingMain) {
            const idx = playlist.findIndex(v => v.youtubeId === ytid) + 1;
            alert(`⚠️ Sécurité anti-doublon :\n\nCe set YouTube est déjà présent dans la programmation principale à la position #${idx} :\n"${existingMain.title}".\n\nL'ajout d'un doublon est bloqué.`);
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

    // Nettoyage rapide des doublons de la programmation principale
    const handleCleanPlaylistDuplicates = () => {
        const seen = new Set<string>();
        let count = 0;
        const cleaned: TVVideo[] = [];
        for (const v of playlist) {
            if (v.youtubeId && seen.has(v.youtubeId)) {
                count++;
            } else {
                if (v.youtubeId) seen.add(v.youtubeId);
                cleaned.push(v);
            }
        }
        setPlaylist(cleaned);
        if (count > 0) {
            alert(`Nettoyage terminé : ${count} doublon(s) supprimé(s) de la programmation principale.`);
        }
    };

    // Add promo video
    const handleAddPromoVideo = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const ytid = extractYouTubeId(newPromoUrl);
        if (!ytid) {
            alert('Lien YouTube promo invalide.');
            return;
        }

        // Anti-doublon vidéos promo
        const existingPromo = promos.find(p => p.youtubeId === ytid);
        if (existingPromo) {
            const idx = promos.findIndex(p => p.youtubeId === ytid) + 1;
            alert(`⚠️ Sécurité anti-doublon :\n\nCette vidéo promo est déjà enregistrée à la position #${idx} :\n"${existingPromo.title}".\n\nL'ajout d'un doublon est bloqué.`);
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

    // Nettoyage rapide des doublons promo
    const handleCleanPromoDuplicates = () => {
        const seen = new Set<string>();
        let count = 0;
        const cleaned: PromoVideo[] = [];
        for (const p of promos) {
            if (p.youtubeId && seen.has(p.youtubeId)) {
                count++;
            } else {
                if (p.youtubeId) seen.add(p.youtubeId);
                cleaned.push(p);
            }
        }
        setPromos(cleaned);
        if (count > 0) {
            alert(`Nettoyage terminé : ${count} doublon(s) promo supprimé(s).`);
        }
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
            setConfirmModal({
                isOpen: true,
                title: 'Réinitialiser la grille',
                message: 'Voulez-vous restaurer la grille des 5 blocs par défaut avec les sets recommandés ?',
                type: 'warning',
                confirmText: 'Restaurer',
                cancelText: 'Annuler',
                hideCancel: false,
                onConfirm: () => {
                    setBlocks(DEFAULT_TV_BLOCKS);
                }
            });
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Réinitialiser les sets',
                message: 'Voulez-vous restaurer la liste par défaut des sets de festivals ?',
                type: 'warning',
                confirmText: 'Restaurer',
                cancelText: 'Annuler',
                hideCancel: false,
                onConfirm: () => {
                    setPlaylist(DEFAULT_MAIN_PLAYLIST);
                    setPromos([]);
                }
            });
        }
    };

    // Save TV Playlist & Blocks
    const handleSave = async () => {
        let currentPlaylist = [...playlist];
        if (newMainUrl.trim()) {
            const ytid = extractYouTubeId(newMainUrl);
            if (ytid && !currentPlaylist.some(v => v.youtubeId === ytid)) {
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
            if (ytid && !currentPromos.some(p => p.youtubeId === ytid)) {
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
                if (block && !block.videos?.some(v => v.youtubeId === ytid)) {
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
        }

        // Nettoyage automatique de sécurité anti-doublon avant sauvegarde
        let totalDuplicatesCleaned = 0;

        const seenPlaylist = new Set<string>();
        currentPlaylist = currentPlaylist.filter(v => {
            if (!v.youtubeId) return true;
            if (seenPlaylist.has(v.youtubeId)) {
                totalDuplicatesCleaned++;
                return false;
            }
            seenPlaylist.add(v.youtubeId);
            return true;
        });

        const seenPromos = new Set<string>();
        currentPromos = currentPromos.filter(p => {
            if (!p.youtubeId) return true;
            if (seenPromos.has(p.youtubeId)) {
                totalDuplicatesCleaned++;
                return false;
            }
            seenPromos.add(p.youtubeId);
            return true;
        });

        currentBlocks = currentBlocks.map(b => {
            const seenBlock = new Set<string>();
            const cleanVideos = (b.videos || []).filter(v => {
                if (!v.youtubeId) return true;
                if (seenBlock.has(v.youtubeId)) {
                    totalDuplicatesCleaned++;
                    return false;
                }
                seenBlock.add(v.youtubeId);
                return true;
            });
            return { ...b, videos: cleanVideos };
        });

        // Garantir le tri chronologique de diffusion (06h -> 06h) et renumérotation des blocs
        currentBlocks = sortBlocksByBroadcastOrder(currentBlocks, true);
        setBlocks(currentBlocks);

        if (totalDuplicatesCleaned > 0) {
            setPlaylist(currentPlaylist);
            setPromos(currentPromos);
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

            const cleanNote = totalDuplicatesCleaned > 0 ? ` (${totalDuplicatesCleaned} doublon(s) nettoyé(s))` : '';
            if (res.ok) {
                setSaveSuccess(true);
                setSaveMessage(`Grille horaire (5 blocs) et programmation enregistrées avec succès !${cleanNote}`);
                setTimeout(() => {
                    setSaveSuccess(false);
                    setSaveMessage(null);
                }, 3500);
            } else {
                const errData = await res.json().catch(() => ({}));
                const msg = errData?.error || `Erreur ${res.status}`;
                setError(`Enregistré localement, mais échec serveur : ${msg}${cleanNote}`);
            }
        } catch (e: any) {
            console.error("Erreur sauvegarde TV:", e);
            const cleanNote = totalDuplicatesCleaned > 0 ? ` (${totalDuplicatesCleaned} doublon(s) nettoyé(s))` : '';
            setSaveSuccess(true);
            setSaveMessage(`Enregistré localement (serveur distant indisponible)${cleanNote}`);
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

    // ─── Radionomy : Insertion d'un jingle / pub / élément ─────────────────────
    const handleInsertRadionomyItem = (item: RadionomyItem) => {
        const prefix = item.category === 'jingle' ? '🔔 [JINGLE]' : item.category === 'pub' ? '📢 [PUB]' : '✨';
        const newVid: TVVideo = {
            id: `rad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: `${prefix} ${item.title}`,
            description: 'Diffusé sur Dropsiders TV',
            youtubeId: item.youtubeId ?? '',
            duration: item.duration || 15,
            category: 'clip'
        };

        if (activeTab === 'blocks') {
            if (!selectedBlockId) return;
            setBlocks(prev => prev.map(b => {
                if (b.id !== selectedBlockId) return b;
                return { ...b, videos: [...(b.videos || []), newVid] };
            }));
            const targetB = blocks.find(b => b.id === selectedBlockId);
            setSaveMessage(`✓ ${item.category === 'jingle' ? 'Jingle' : 'Élément'} ajouté à « ${targetB?.title || 'Créneau'} » !`);
        } else {
            setPlaylist(prev => [...prev, newVid]);
            setSaveMessage(`✓ ${item.category === 'jingle' ? 'Jingle' : 'Élément'} ajouté à la playlist TV !`);
        }
        setTimeout(() => setSaveMessage(null), 3000);
    };

    // ─── Radionomy : Règle Horloge (Jingle tous les N sets / Pubs) ─────────────
    const handleApplyRadionomyRule = ({ jingleEveryN, pubEveryN }: { jingleEveryN: number; pubEveryN: number }) => {
        let palette: RadionomyItem[] = [];
        try {
            const saved = localStorage.getItem('dropsiders_radionomy_palette');
            if (saved) palette = JSON.parse(saved);
        } catch {}
        // Only use items that have a valid YouTube ID (TV needs a video source)
        const jingles = palette.filter(p => p.category === 'jingle' && p.youtubeId && p.youtubeId.trim().length > 0);
        const pubs = palette.filter(p => p.category === 'pub' && p.youtubeId && p.youtubeId.trim().length > 0);

        if (jingles.length === 0 && pubs.length === 0) {
            alert('Aucun jingle ou pub avec un lien YouTube valide trouvé.\n\nPour la TV, chaque jingle / pub doit avoir un YouTube ID (ex: depuis un clip YouTube). Ajoutez des vidéos YouTube dans la boîte Radionomy !');
            return;
        }

        if (activeTab === 'blocks') {
            if (!selectedBlockId) return;
            setBlocks(prev => prev.map(b => {
                if (b.id !== selectedBlockId) return b;
                const pureVideos = (b.videos || []).filter(v => !v.id?.startsWith('rad_'));
                if (pureVideos.length === 0) return b;

                const newVideos: TVVideo[] = [];
                let jingleIdx = 0;
                let pubIdx = 0;

                pureVideos.forEach((vid, index) => {
                    newVideos.push(vid);
                    const pos = index + 1;
                    if (pubEveryN > 0 && pos % pubEveryN === 0 && pubs.length > 0) {
                        const pub = pubs[pubIdx % pubs.length];
                        pubIdx++;
                        newVideos.push({
                            id: `rad_pub_${Date.now()}_${pos}`,
                            title: `📢 [PUB] ${pub.title}`,
                            description: 'Diffusé sur Dropsiders TV',
                            youtubeId: pub.youtubeId ?? '',
                            duration: pub.duration || 30,
                            category: 'clip'
                        });
                    } else if (jingleEveryN > 0 && pos % jingleEveryN === 0 && jingles.length > 0) {
                        const jing = jingles[jingleIdx % jingles.length];
                        jingleIdx++;
                        newVideos.push({
                            id: `rad_jing_${Date.now()}_${pos}`,
                            title: `🔔 [JINGLE] ${jing.title}`,
                            description: 'Diffusé sur Dropsiders TV',
                            youtubeId: jing.youtubeId ?? '',
                            duration: jing.duration || 15,
                            category: 'clip'
                        });
                    }
                });

                return { ...b, videos: newVideos };
            }));
            setSaveMessage('✓ Règle Horloge Radionomy appliquée au créneau TV !');
        } else {
            const purePlaylist = playlist.filter(v => !v.id?.startsWith('rad_'));
            if (purePlaylist.length === 0) return;
            const newVideos: TVVideo[] = [];
            let jingleIdx = 0;
            let pubIdx = 0;

            purePlaylist.forEach((vid, index) => {
                newVideos.push(vid);
                const pos = index + 1;
                if (pubEveryN > 0 && pos % pubEveryN === 0 && pubs.length > 0) {
                    const pub = pubs[pubIdx % pubs.length];
                    pubIdx++;
                    newVideos.push({
                        id: `rad_pub_${Date.now()}_${pos}`,
                        title: `📢 [PUB] ${pub.title}`,
                        description: 'Diffusé sur Dropsiders TV',
                        youtubeId: pub.youtubeId ?? '',
                        duration: pub.duration || 30,
                        category: 'clip'
                    });
                } else if (jingleEveryN > 0 && pos % jingleEveryN === 0 && jingles.length > 0) {
                    const jing = jingles[jingleIdx % jingles.length];
                    jingleIdx++;
                    newVideos.push({
                        id: `rad_jing_${Date.now()}_${pos}`,
                        title: `🔔 [JINGLE] ${jing.title}`,
                        description: 'Diffusé sur Dropsiders TV',
                        youtubeId: jing.youtubeId ?? '',
                        duration: jing.duration || 15,
                        category: 'clip'
                    });
                }
            });
            setPlaylist(newVideos);
            setSaveMessage('✓ Règle Horloge Radionomy appliquée à la playlist TV !');
        }
        setTimeout(() => setSaveMessage(null), 3000);
    };

    // ─── Recherche YouTube directe : Ajout d'une vidéo ─────────────────────────
    const handleYouTubeAddVideo = (video: {
        youtubeId: string;
        title: string;
        duration: number;
        category: any;
    }) => {
        const newVid: TVVideo = {
            id: `yt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: video.title,
            description: 'Diffusé sur Dropsiders TV',
            youtubeId: video.youtubeId,
            duration: video.duration || 240,
            category: video.category === 'clip' ? 'clip' : 'liveset'
        };

        if (activeTab === 'blocks') {
            if (!selectedBlockId) return;
            setBlocks(prev => prev.map(b => {
                if (b.id !== selectedBlockId) return b;
                return { ...b, videos: [...(b.videos || []), newVid] };
            }));
            const targetB = blocks.find(b => b.id === selectedBlockId);
            setSaveMessage(`✓ « ${video.title} » ajouté à « ${targetB?.title || 'Créneau'} » !`);
        } else {
            setPlaylist(prev => [...prev, newVid]);
            setSaveMessage(`✓ « ${video.title} » ajouté à la playlist TV !`);
        }
        setTimeout(() => setSaveMessage(null), 3000);
    };

    // Mémoïser le bloc sélectionné (évite de recalculer à chaque render)
    const currentBlockMemo = useMemo(
        () => blocks.find(b => b.id === selectedBlockId) || blocks[0] || null,
        [blocks, selectedBlockId]
    );

    // Mémoïser l'ID du bloc actif TV pour éviter de recalculer dans le JSX
    const activeTVBlockId = useMemo(
        () => (blocks.length > 0 ? getActiveTVBlock(blocks).id : ''),
        [blocks]
    );

    const location = useLocation();

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCloseModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);


    return (
        <>
            <AnimatePresence>
            {isOpen && (
                <div
                    className={`fixed inset-0 z-[120] flex items-center justify-center bg-black/90 overflow-hidden ${
                        isFullscreen ? 'p-0' : 'p-1 sm:p-2 md:p-3'
                    }`}
                    onClick={(e) => { if (e.target === e.currentTarget && !isFullscreen) handleCloseModal(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.12, ease: 'easeOut' }}
                        className={`bg-[#0d1017] border border-neon-red/30 shadow-2xl relative overflow-hidden flex flex-col z-10 ${
                            isFullscreen
                                ? 'w-screen h-screen rounded-none'
                                : 'w-full max-w-[1720px] h-[96vh] rounded-3xl'
                        }`}
                    >
                        {/* Red Accent top line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />

                        {/* Top Header (Style RadioManager) */}
                        <div className="h-14 px-4 sm:px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-[#170d10] via-[#1a1017] to-[#0d1017]">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-neon-red/20 border border-neon-red/40 flex items-center justify-center text-neon-red shadow-[0_0_15px_rgba(255,18,65,0.3)] shrink-0">
                                        <Tv className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h1 className="text-base font-display font-black text-white uppercase italic tracking-tighter flex items-center gap-1.5">
                                            TV<span className="text-neon-red">Manager</span>
                                            <span className="text-[9px] font-mono not-italic px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/30 font-bold">
                                                PRO
                                            </span>
                                        </h1>
                                    </div>
                                </div>

                                {/* Navigation Onglets style RadioManager */}
                                <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('blocks')}
                                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            activeTab === 'blocks'
                                                ? 'bg-neon-red/20 text-white border border-neon-red/40 shadow-sm font-bold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        Émissions & Grille
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-white/70">
                                            {blocks.length}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('main')}
                                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            activeTab === 'main'
                                                ? 'bg-neon-red/20 text-white border border-neon-red/40 shadow-sm font-bold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Tv className="w-3.5 h-3.5 text-neon-cyan" />
                                        Tous les Sets
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-white/70">
                                            {playlist.length}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('promo')}
                                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            activeTab === 'promo'
                                                ? 'bg-neon-purple/20 text-purple-200 border border-neon-purple/40 shadow-sm font-bold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Film className="w-3.5 h-3.5 text-neon-purple" />
                                        Promos & Jingles
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-white/70">
                                            {promos.length}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('live')}
                                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            activeTab === 'live'
                                                ? 'bg-gradient-to-r from-red-600/30 to-orange-600/30 text-white border border-red-500/50 shadow-sm font-bold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Radio className={`w-3.5 h-3.5 ${takeoverState?.status === 'live' ? 'text-neon-red animate-pulse' : 'text-gray-400'}`} />
                                        Prise d'Antenne Live
                                        <span className={`w-2 h-2 rounded-full ${
                                            takeoverState?.status === 'live' ? 'bg-neon-red animate-ping' :
                                            takeoverState?.status === 'edit' ? 'bg-orange-500' : 'bg-gray-600'
                                        }`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRadionomyOpen(true)}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border bg-purple-900/30 border-purple-500/40 text-purple-200 hover:text-white hover:border-purple-400 transition-all cursor-pointer"
                                    title="Boîte à Jingles, Pubs et Règle Horloge façon Radionomy"
                                >
                                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="hidden sm:inline">Radionomy</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsYouTubeSearchOpen(true)}
                                    className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border bg-red-600/20 border-red-500/40 text-red-300 hover:text-white hover:bg-red-600/30 transition-all cursor-pointer"
                                    title="Recherche YouTube intégrée pour sets et clips"
                                >
                                    <Search className="w-3.5 h-3.5 text-red-400" />
                                    <span className="hidden sm:inline">Recherche YouTube</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-neon-red hover:bg-neon-red/90 text-white flex items-center gap-1.5 shadow-lg shadow-neon-red/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : saveSuccess ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                                    ) : (
                                        <Save className="w-3.5 h-3.5" />
                                    )}
                                    <span>{saving ? 'Sauvegarde...' : saveSuccess ? 'Enregistré !' : 'Sauvegarder'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 border rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                                    title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="p-2 bg-white/5 hover:bg-neon-red/20 border border-white/10 hover:border-neon-red/40 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                                    title="Fermer et retourner au tableau de bord"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Barre d'onglets pour mobile */}
                        <div className="flex md:hidden items-center gap-1 p-1 bg-black/50 border-b border-white/10 overflow-x-auto text-[10px] font-bold shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab('blocks')}
                                className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'blocks' ? 'bg-neon-red text-white' : 'text-gray-400'}`}
                            >
                                📺 Émissions ({blocks.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('main')}
                                className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'main' ? 'bg-neon-red text-white' : 'text-gray-400'}`}
                            >
                                🎬 Sets ({playlist.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('promo')}
                                className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'promo' ? 'bg-neon-purple text-white' : 'text-gray-400'}`}
                            >
                                📢 Promos ({promos.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('live')}
                                className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'live' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
                            >
                                🔴 Live Takeover
                            </button>
                        </div>

                        {/* Modal Body Wrapper */}
                        <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col min-h-0 overflow-hidden">
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
                                {/* Blocks Selector Header & Action Buttons */}
                                <div className="space-y-1.5 shrink-0">
                                    <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
                                                Grille TV · Émissions & Créneaux ({blocks.length})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowAllBlocksOverview(prev => !prev)}
                                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border ${
                                                    showAllBlocksOverview
                                                        ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan shadow-sm shadow-neon-cyan/20'
                                                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
                                                }`}
                                                title="Afficher le tableau récapitulatif de toutes les émissions"
                                            >
                                                <Layers className="w-3 h-3" />
                                                {showAllBlocksOverview ? 'Masquer le tableau' : 'Vue tableau (Toutes les émissions)'}
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleSortBlocksOrder}
                                                className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                                title="Trier automatiquement les émissions selon l'ordre chronologique de passage TV (06h00 -> 06h00)"
                                            >
                                                <ArrowUpDown className="w-3 h-3 text-neon-cyan" />
                                                Ordre de passage auto
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAddBlock}
                                                className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                                title="Ajouter une nouvelle émission à la grille"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-neon-cyan" />
                                                + Nouvelle émission
                                            </button>
                                            <span className="text-[10px] font-mono text-white/40 hidden sm:inline">
                                                {blocks.reduce((acc, b) => acc + (b.videos?.length || 0), 0)} vidéos réparties
                                            </span>
                                        </div>
                                    </div>

                                    {/* Table Overview of ALL Emissions (when showAllBlocksOverview is true) */}
                                    {showAllBlocksOverview && (
                                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan flex items-center gap-1.5">
                                                    <Layers className="w-3 h-3" />
                                                    Tableau Récapitulatif · Modification directe des noms et horaires
                                                </span>
                                                <span className="text-[9px] text-white/40">
                                                    Modifiez directement le nom et les heures de chaque émission ci-dessous
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                {blocks.map((b) => {
                                                    const isSelected = b.id === selectedBlockId;
                                                    const isLive = activeTVBlockId === b.id;
                                                    return (
                                                        <div
                                                            key={b.id}
                                                            className={`p-2 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-all ${
                                                                isSelected 
                                                                    ? 'bg-white/[0.07] border-white/30 shadow-md' 
                                                                    : 'bg-black/40 border-white/5 hover:border-white/15'
                                                            }`}
                                                            style={{ borderLeftColor: b.color, borderLeftWidth: 4 }}
                                                        >
                                                            {/* Emoji + Title */}
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <input
                                                                    type="text"
                                                                    value={b.emoji}
                                                                    onChange={(e) => handleUpdateBlockMeta(b.id, { emoji: e.target.value })}
                                                                    maxLength={4}
                                                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-center text-base focus:border-white/30 outline-none shrink-0"
                                                                    title="Emoji de l'émission"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <input
                                                                        type="text"
                                                                        value={b.title}
                                                                        onChange={(e) => handleUpdateBlockMeta(b.id, { title: e.target.value })}
                                                                        placeholder="Nom de l'émission"
                                                                        className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-white/30"
                                                                    />
                                                                </div>
                                                                {isLive && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse shrink-0">
                                                                        En direct
                                                                    </span>
                                                                )}
                                                            </div>

                                                             {/* Days pills in overview table row */}
                                                            <div className="flex items-center gap-0.5 shrink-0 bg-black/40 px-1.5 py-1 rounded-lg border border-white/5" title="Jours de diffusion de cette émission">
                                                                {DAYS_OF_WEEK.map(day => {
                                                                    const isActive = isBlockActiveOnDay(b, day.value);
                                                                    return (
                                                                        <button
                                                                            key={day.value}
                                                                            type="button"
                                                                            onClick={() => handleToggleBlockDay(b.id, day.value)}
                                                                            className={`w-5 h-5 rounded text-[8px] font-black uppercase flex items-center justify-center transition-all ${
                                                                                isActive
                                                                                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-sm font-black'
                                                                                    : 'bg-transparent text-white/20 hover:text-white/50 hover:bg-white/5'
                                                                            }`}
                                                                            title={`${day.label} : ${isActive ? 'Diffusé (cliquer pour désactiver)' : 'Non diffusé (cliquer pour activer)'}`}
                                                                        >
                                                                            {day.short[0]}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Hours: Début & Fin */}
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[9px] font-bold text-white/40 uppercase">De</span>
                                                                    <select
                                                                        value={b.startHour ?? 0}
                                                                        onChange={(e) => handleUpdateBlockMeta(b.id, { startHour: parseInt(e.target.value, 10) })}
                                                                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-white/30"
                                                                    >
                                                                        {Array.from({ length: 24 }).map((_, i) => (
                                                                            <option key={i} value={i} className="bg-[#121212] text-white">
                                                                                {String(i).padStart(2, '0')}h
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[9px] font-bold text-white/40 uppercase">À</span>
                                                                    <select
                                                                        value={b.endHour ?? 24}
                                                                        onChange={(e) => handleUpdateBlockMeta(b.id, { endHour: parseInt(e.target.value, 10) })}
                                                                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-white/30"
                                                                    >
                                                                        {Array.from({ length: 24 }).map((_, i) => {
                                                                            const h = i + 1;
                                                                            return (
                                                                                <option key={h} value={h} className="bg-[#121212] text-white">
                                                                                    {h === 24 ? '00h (24h)' : `${String(h).padStart(2, '0')}h`}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>

                                                                {/* Custom timeSlot text */}
                                                                <input
                                                                    type="text"
                                                                    value={b.timeSlot}
                                                                    onChange={(e) => handleUpdateBlockMeta(b.id, { timeSlot: e.target.value })}
                                                                    className="w-24 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] font-mono text-center focus:outline-none focus:border-white/30"
                                                                    title="Libellé du créneau horaire"
                                                                />

                                                                {/* Color picker */}
                                                                <input
                                                                    type="color"
                                                                    value={b.color || '#f59e0b'}
                                                                    onChange={(e) => handleUpdateBlockMeta(b.id, { color: e.target.value })}
                                                                    className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                                                    title="Couleur de l'émission"
                                                                />

                                                                {/* Video count badge */}
                                                                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                                                                    {b.videos?.length || 0} vids
                                                                </span>

                                                                {/* Select Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedBlockId(b.id)}
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                                        isSelected 
                                                                            ? 'bg-white text-black font-black' 
                                                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                                                    }`}
                                                                >
                                                                    {isSelected ? 'Sélectionnée' : 'Sélectionner'}
                                                                </button>

                                                                {blocks.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteBlock(b.id)}
                                                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                                                                        title="Supprimer cette émission"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Day Filter Bar */}
                                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 custom-scrollbar text-xs shrink-0">
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-white/40 mr-1 flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-neon-cyan" />
                                                Filtrer par jour :
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setFilterDay('all')}
                                                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all ${
                                                    filterDay === 'all'
                                                        ? 'bg-white text-black font-black shadow-sm'
                                                        : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                                                }`}
                                            >
                                                Tous (7j/7) <span className="opacity-60 text-[8px]">({blocks.length})</span>
                                            </button>
                                            {DAYS_OF_WEEK.map(d => {
                                                const isToday = new Date().getDay() === d.value;
                                                const activeCount = blocks.filter(b => isBlockActiveOnDay(b, d.value)).length;
                                                const isSelectedFilter = filterDay === d.value;
                                                return (
                                                    <button
                                                        key={d.value}
                                                        type="button"
                                                        onClick={() => setFilterDay(d.value)}
                                                        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 border ${
                                                            isSelectedFilter
                                                                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-sm font-black'
                                                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                                                        }`}
                                                    >
                                                        <span>{d.short}</span>
                                                        <span className="text-[8px] opacity-60 font-mono">({activeCount})</span>
                                                        {isToday && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" title="Aujourd'hui" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {filterDay !== 'all' && (
                                            <span className="text-[9px] text-neon-cyan/80 font-mono hidden sm:inline shrink-0">
                                                {blocks.filter(b => isBlockActiveOnDay(b, filterDay)).length} émission(s) active(s) le {DAYS_OF_WEEK.find(d => d.value === filterDay)?.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* 5 Blocks Selector Buttons */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 shrink-0">
                                        {(() => {
                                            const activeTVBlockId = getActiveTVBlock(blocks).id;
                                            return blocks.map(b => {
                                            const isSelected = b.id === selectedBlockId;
                                            const isLiveNow = activeTVBlockId === b.id;
                                            const matchesFilter = filterDay === 'all' || isBlockActiveOnDay(b, filterDay);
                                            return (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => setSelectedBlockId(b.id)}
                                                    className={`group px-2.5 py-1.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 overflow-hidden ${
                                                        isSelected
                                                            ? 'bg-white/[0.08] shadow-sm'
                                                            : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10'
                                                    } ${matchesFilter ? 'opacity-100' : 'opacity-35 hover:opacity-75'}`}
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
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <span className="text-[9px] text-white/40 font-mono">
                                                                    {b.timeSlot}
                                                                </span>
                                                                <span className="text-[7px] px-1 py-0.2 rounded bg-white/5 border border-white/5 text-white/60 font-mono truncate max-w-[65px]" title={formatBlockDays(b.days)}>
                                                                    {formatBlockDays(b.days)}
                                                                </span>
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
                                        });
                                        })()}
                                    </div>
                                </div>

                                {/* Selected Block Details & Link Management */}
                                {(() => {
                                    const currentBlock = currentBlockMemo;
                                    if (!currentBlock) return null;
                                    const isLiveNow = activeTVBlockId === currentBlock.id;

                                    return (
                                        <div 
                                            className="p-2.5 sm:p-3 rounded-xl border bg-black/40 backdrop-blur-md space-y-2 flex-1 flex flex-col min-h-0"
                                            style={{ borderColor: `${currentBlock.color}35` }}
                                        >
                                            {/* Configuration & Paramètres de l'émission sélectionnée */}
                                            <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 shrink-0">
                                                <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/5">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentBlock.color }} />
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-white/70">
                                                            Paramètres de l'émission : <span style={{ color: currentBlock.color }}>{currentBlock.title}</span>
                                                        </span>
                                                        <span className="text-[10px] text-white/40 font-mono">
                                                            ({currentBlock.timeSlot})
                                                        </span>
                                                        {isLiveNow && (
                                                            <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse">
                                                                En direct
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {/* Random rotation toggle */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleBlockRandom(currentBlock.id)}
                                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 border ${
                                                                currentBlock.randomize
                                                                    ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
                                                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                                                            }`}
                                                            title="Ordre aléatoire quotidien"
                                                        >
                                                            <span>🔀</span>
                                                            <span>Aléatoire : <strong className="uppercase">{currentBlock.randomize ? 'Oui' : 'Non'}</strong></span>
                                                        </button>

                                                        {blocks.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBlock(currentBlock.id)}
                                                                className="p-1 px-2 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold transition-all flex items-center gap-1"
                                                                title="Supprimer cette émission"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                                <span className="hidden md:inline">Supprimer l'émission</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Form inputs: Nom, Heure Début, Heure Fin, Créneau, Emoji, Couleur */}
                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                                    {/* Emoji picker */}
                                                    <div className="sm:col-span-1">
                                                        <label className="block text-[8px] font-black uppercase tracking-wider text-white/40 mb-0.5">
                                                            Emoji
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={currentBlock.emoji || '📺'}
                                                            onChange={(e) => handleUpdateBlockMeta(currentBlock.id, { emoji: e.target.value })}
                                                            maxLength={4}
                                                            className="w-full text-center py-1 rounded-md bg-white/5 border border-white/10 text-base focus:border-white/30 outline-none"
                                                            title="Emoji de l'émission"
                                                        />
                                                    </div>

                                                    {/* Show Name input */}
                                                    <div className="sm:col-span-4">
                                                        <label className="block text-[8px] font-black uppercase tracking-wider text-white/40 mb-0.5">
                                                            Nom de l'émission
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={currentBlock.title}
                                                            onChange={(e) => handleUpdateBlockMeta(currentBlock.id, { title: e.target.value })}
                                                            placeholder="Ex: Morning Clips, Prime Time..."
                                                            className="w-full px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-white/30"
                                                        />
                                                    </div>

                                                    {/* Start hour select */}
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-[8px] font-black uppercase tracking-wider text-white/40 mb-0.5">
                                                            Heure Début
                                                        </label>
                                                        <select
                                                            value={currentBlock.startHour ?? 0}
                                                            onChange={(e) => handleUpdateBlockMeta(currentBlock.id, { startHour: parseInt(e.target.value, 10) })}
                                                            className="w-full px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-white/30"
                                                        >
                                                            {Array.from({ length: 24 }).map((_, i) => (
                                                                <option key={i} value={i} className="bg-[#121212] text-white">
                                                                    {String(i).padStart(2, '0')}h00 {i === 0 ? '(Minuit)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* End hour select */}
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-[8px] font-black uppercase tracking-wider text-white/40 mb-0.5">
                                                            Heure Fin
                                                        </label>
                                                        <select
                                                            value={currentBlock.endHour ?? 24}
                                                            onChange={(e) => handleUpdateBlockMeta(currentBlock.id, { endHour: parseInt(e.target.value, 10) })}
                                                            className="w-full px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-white/30"
                                                        >
                                                            {Array.from({ length: 24 }).map((_, i) => {
                                                                const h = i + 1;
                                                                return (
                                                                    <option key={h} value={h} className="bg-[#121212] text-white">
                                                                        {h === 24 ? '00h00 (24h/Minuit)' : `${String(h).padStart(2, '0')}h00`}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>

                                                    {/* Custom timeSlot input */}
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-[8px] font-black uppercase tracking-wider text-white/40 mb-0.5">
                                                            Créneau affiché
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={currentBlock.timeSlot || ''}
                                                            onChange={(e) => handleUpdateBlockMeta(currentBlock.id, { timeSlot: e.target.value })}
                                                            placeholder="Ex: 06h - 10h"
                                                            className="w-full px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                                                            title="Libellé affiché sur la TV et le guide EPG"
                                                        />
                                                    </div>

                                                    {/* Color picker */}
                                                    <div className="sm:col-span-1 flex flex-col items-center">
                                                        <label className="block text-[8px] font-black uppercase tracking-wider text-white/40 mb-0.5 text-center">
                                                            Couleur
                                                        </label>
                                                        <input
                                                            type="color"
                                                            value={currentBlock.color || '#f59e0b'}
                                                            onChange={(e) => handleUpdateBlockMeta(currentBlock.id, { color: e.target.value })}
                                                            className="w-8 h-7 rounded-md bg-transparent border-0 cursor-pointer p-0"
                                                            title="Couleur d'accent de l'émission"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Quick Presets row: Emojis & Colors */}
                                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
                                                    <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                                                        <span className="text-[8px] font-black uppercase tracking-wider text-white/30 mr-1">Icônes rapides :</span>
                                                        {PRESET_EMOJIS.map(em => (
                                                            <button
                                                                key={em}
                                                                type="button"
                                                                onClick={() => handleUpdateBlockMeta(currentBlock.id, { emoji: em })}
                                                                className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-transform hover:scale-125 ${
                                                                    currentBlock.emoji === em ? 'bg-white/20 ring-1 ring-white/50' : 'bg-white/5 hover:bg-white/10'
                                                                }`}
                                                            >
                                                                {em}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-1 py-0.5">
                                                        <span className="text-[8px] font-black uppercase tracking-wider text-white/30 mr-1">Couleurs :</span>
                                                        {PRESET_COLORS.map(c => (
                                                            <button
                                                                key={c.hex}
                                                                type="button"
                                                                onClick={() => handleUpdateBlockMeta(currentBlock.id, { color: c.hex })}
                                                                className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${
                                                                    currentBlock.color === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                                                                }`}
                                                                style={{ backgroundColor: c.hex }}
                                                                title={c.name}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Jours de diffusion de l'émission sélectionnée */}
                                                <div className="pt-2 pb-0.5 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-neon-cyan flex items-center gap-1 shrink-0">
                                                            <Calendar className="w-3 h-3" />
                                                            Jours de diffusion :
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetBlockDaysPreset(currentBlock.id, 'all')}
                                                                className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-all hover:border-white/30"
                                                                title="Diffuser tous les jours (Lundi au Dimanche)"
                                                            >
                                                                7j/7 (Tous)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetBlockDaysPreset(currentBlock.id, 'weekdays')}
                                                                className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-all hover:border-white/30"
                                                                title="Diffuser uniquement en semaine (Lundi au Vendredi)"
                                                            >
                                                                Semaine (Lun-Ven)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetBlockDaysPreset(currentBlock.id, 'weekend')}
                                                                className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-all hover:border-white/30"
                                                                title="Diffuser uniquement le week-end (Samedi et Dimanche)"
                                                            >
                                                                Week-end (Sam-Dim)
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {DAYS_OF_WEEK.map(day => {
                                                            const isActive = isBlockActiveOnDay(currentBlock, day.value);
                                                            return (
                                                                <button
                                                                    key={day.value}
                                                                    type="button"
                                                                    onClick={() => handleToggleBlockDay(currentBlock.id, day.value)}
                                                                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all border ${
                                                                        isActive
                                                                            ? 'bg-white text-black border-white shadow-sm font-black'
                                                                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
                                                                    }`}
                                                                    title={`${day.label} : ${isActive ? 'Actif (cliquer pour désactiver)' : 'Inactif (cliquer pour activer)'}`}
                                                                >
                                                                    {day.short}
                                                                </button>
                                                            );
                                                        })}
                                                        <span className="text-[9px] font-mono text-neon-cyan/90 ml-1.5 font-bold">
                                                            ({formatBlockDays(currentBlock.days)})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add video form for this block with Anti-Duplicate Security */}
                                            {(() => {
                                                const blockYtId = extractYouTubeId(blockVideoUrl);
                                                const blockDuplicateInCurrent = blockYtId ? currentBlock.videos?.find(v => v.youtubeId === blockYtId) : null;
                                                const blockDuplicateInOther = blockYtId && !blockDuplicateInCurrent ? blocks.find(b => b.id !== currentBlock.id && b.videos?.some(v => v.youtubeId === blockYtId)) : null;

                                                const blockYtCounts = (currentBlock.videos || []).reduce((acc, v) => {
                                                    if (v.youtubeId) acc[v.youtubeId] = (acc[v.youtubeId] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>);
                                                const blockDuplicateCount = Object.values(blockYtCounts).filter(c => c > 1).length;

                                                return (
                                                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    value={blockVideoUrl}
                                                                    onChange={(e) => handleBlockUrlChange(e.target.value)}
                                                                    placeholder="Lien ou ID YouTube (ex: https://youtube.com/watch?v=...)"
                                                                    className={`w-full px-2.5 py-1.5 rounded-md bg-white/5 border text-white placeholder-gray-500 text-xs focus:outline-none font-mono transition-colors ${
                                                                        blockDuplicateInCurrent
                                                                            ? 'border-red-500/70 bg-red-500/10 focus:border-red-500'
                                                                            : 'border-white/10 focus:border-white/30'
                                                                    }`}
                                                                />
                                                                {isFetchingBlockTitle && (
                                                                    <div className="absolute right-2.5 top-2 text-xs text-white/40">
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <input
                                                                type="text"
                                                                value={blockVideoTitle}
                                                                onChange={(e) => setBlockVideoTitle(e.target.value)}
                                                                placeholder="Titre de la vidéo (auto-détecté ou personnalisé)"
                                                                className="w-56 md:w-72 px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-white/30"
                                                            />

                                                            {/* Sélecteur de catégorie : Clip / Liveset / Interview */}
                                                            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-md border border-white/10 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlockVideoCategory('clip')}
                                                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                                                        blockVideoCategory === 'clip'
                                                                            ? 'bg-neon-purple text-white shadow-sm'
                                                                            : 'text-gray-400 hover:text-white'
                                                                    }`}
                                                                    title="Catégorie : Clip Vidéo"
                                                                >
                                                                    🎬 Clip
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlockVideoCategory('liveset')}
                                                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                                                        blockVideoCategory === 'liveset'
                                                                            ? 'bg-neon-cyan text-black shadow-sm'
                                                                            : 'text-gray-400 hover:text-white'
                                                                    }`}
                                                                    title="Catégorie : Liveset Festival"
                                                                >
                                                                    🎪 Liveset
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlockVideoCategory('interview')}
                                                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                                                        blockVideoCategory === 'interview'
                                                                            ? 'bg-neon-red text-white shadow-sm'
                                                                            : 'text-gray-400 hover:text-white'
                                                                    }`}
                                                                    title="Catégorie : Interview Artiste"
                                                                >
                                                                    🎙️ Interview
                                                                </button>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={handleAddVideoToBlock}
                                                                disabled={!blockVideoUrl.trim() || !!blockDuplicateInCurrent}
                                                                className="h-8 px-3 rounded-md text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm shrink-0 active:scale-95"
                                                                style={{ background: blockDuplicateInCurrent ? '#ef4444' : currentBlock.color }}
                                                                title={blockDuplicateInCurrent ? "Cette vidéo est déjà dans ce créneau (doublon bloqué)" : "Ajouter à l'émission"}
                                                            >
                                                                {blockDuplicateInCurrent ? (
                                                                    <>
                                                                        <ShieldAlert className="w-3.5 h-3.5" />
                                                                        Doublon
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                        Ajouter
                                                                    </>
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenLibrary('block')}
                                                                className="h-8 px-2.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
                                                                title="Choisir parmi les clips ou lives déjà programmés pour les réutiliser"
                                                            >
                                                                <ListPlus className="w-3.5 h-3.5 text-neon-cyan" />
                                                                <span className="hidden sm:inline">Bibliothèque ({availableLibraryVideos.length})</span>
                                                                <span className="sm:hidden">Bibliothèque</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setIsYouTubeSearchOpen(true)}
                                                                className="h-8 px-2.5 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
                                                                title="Recherche YouTube intégrée pour ce créneau"
                                                            >
                                                                <Search className="w-3.5 h-3.5 text-red-400" />
                                                                <span className="hidden sm:inline">YouTube</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setIsRadionomyOpen(true)}
                                                                className="h-8 px-2.5 rounded-md bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
                                                                title="Ajouter un jingle ou une pub façon Radionomy"
                                                            >
                                                                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                                                                <span className="hidden sm:inline">Jingles</span>
                                                            </button>
                                                        </div>

                                                        {/* Anti-duplicate feedback banner */}
                                                        {blockDuplicateInCurrent && (
                                                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] animate-in fade-in">
                                                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                                                                <span className="font-bold">Sécurité anti-doublon :</span>
                                                                <span className="truncate">Déjà dans cette émission ("{blockDuplicateInCurrent.title}"). Ajout bloqué.</span>
                                                            </div>
                                                        )}
                                                        {blockDuplicateInOther && (
                                                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] animate-in fade-in">
                                                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                                                <span className="font-bold">Information :</span>
                                                                <span className="truncate">Déjà programmée dans le bloc "{blockDuplicateInOther.title}". Une confirmation sera demandée.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Video list inside this block */}
                                            <div className="space-y-1 flex-1 min-h-0 flex flex-col">
                                                {(() => {
                                                    const blockYtCounts = (currentBlock.videos || []).reduce((acc, v) => {
                                                        if (v.youtubeId) acc[v.youtubeId] = (acc[v.youtubeId] || 0) + 1;
                                                        return acc;
                                                    }, {} as Record<string, number>);
                                                    const blockDuplicateCount = Object.values(blockYtCounts).filter(c => c > 1).length;

                                                    return (
                                                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/40 shrink-0 gap-2 flex-wrap">
                                                            <div className="flex items-center gap-2">
                                                                <span>Vidéos ({currentBlock.videos?.length || 0})</span>
                                                                {blockDuplicateCount > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCleanBlockDuplicates(currentBlock.id)}
                                                                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[8px] font-black uppercase flex items-center gap-1 transition-all"
                                                                        title="Supprimer les vidéos en doublon de ce créneau"
                                                                    >
                                                                        <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                                                                        Nettoyer {blockDuplicateCount} doublon(s)
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Filtre de tri Clip / Liveset / Interview dans la liste */}
                                                            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlockCategoryFilter('all')}
                                                                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${
                                                                        blockCategoryFilter === 'all'
                                                                            ? 'bg-white text-black shadow'
                                                                            : 'text-gray-400 hover:text-white'
                                                                    }`}
                                                                >
                                                                    Tous
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlockCategoryFilter('liveset')}
                                                                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1 ${
                                                                        blockCategoryFilter === 'liveset'
                                                                            ? 'bg-neon-cyan text-black shadow'
                                                                            : 'text-gray-400 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span>🎪</span>
                                                                    <span>Livesets</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlockCategoryFilter('clip')}
                                                                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1 ${
                                                                        blockCategoryFilter === 'clip'
                                                                            ? 'bg-neon-purple text-white shadow'
                                                                            : 'text-gray-400 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span>🎬</span>
                                                                    <span>Clips</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlockCategoryFilter('interview')}
                                                                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1 ${
                                                                        blockCategoryFilter === 'interview'
                                                                            ? 'bg-neon-red text-white shadow'
                                                                            : 'text-gray-400 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span>🎙️</span>
                                                                    <span>Interviews</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {(!currentBlock.videos || currentBlock.videos.length === 0) ? (
                                                    <div className="p-4 text-center rounded-lg bg-white/[0.02] border border-white/5">
                                                        <p className="text-xs font-bold text-white/40">Aucune vidéo dans ce bloc pour l'instant.</p>
                                                        <p className="text-[10px] text-white/20 mt-0.5">Collez un lien YouTube ci-dessus pour alimenter ce créneau horaire.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1 flex-1 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar" style={{ contain: 'layout style' }}>
                                                        {(() => {
                                                            const currentBlockDuplicates = new Set<string>();
                                                            const counts = new Map<string, number>();
                                                            (currentBlock.videos || []).forEach(v => {
                                                                if (v.youtubeId) counts.set(v.youtubeId, (counts.get(v.youtubeId) || 0) + 1);
                                                            });
                                                            counts.forEach((cnt, ytid) => { if (cnt > 1) currentBlockDuplicates.add(ytid); });
                                                            return currentBlock.videos
                                                            .filter(v => {
                                                                if (blockCategoryFilter === 'all') return true;
                                                                const c = v.category || detectVideoCategory(v.title, v.description);
                                                                return c === blockCategoryFilter;
                                                            })
                                                            .map((vid, idx) => {
                                                            const dur = durationsMap[vid.youtubeId] || vid.duration || 0;
                                                            const vCat = vid.category || detectVideoCategory(vid.title, vid.description);
                                                            return (
                                                                <div
                                                                    key={vid.id || idx}
                                                                    className="p-1 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-2 transition-colors group"
                                                                >
                                                                    {/* Thumbnail + Index */}
                                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                        <span className="text-[10px] font-black text-white/30 w-4 text-center shrink-0">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <div className="relative w-14 h-8 rounded-md overflow-hidden bg-black/50 shrink-0 border border-white/10">
                                                                            <img loading="lazy" decoding="async" src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`}
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

                                                                        <div className="min-w-0 flex-1">
                                                                            {editingVideoId === `block_${currentBlock.id}_${idx}` ? (
                                                                                <form
                                                                                    className="flex flex-col gap-1.5 py-0.5"
                                                                                    onSubmit={(e) => { e.preventDefault(); handleRenameVideoInBlock(currentBlock.id, idx, editingVideoTitle, editingVideoCategory); }}
                                                                                >
                                                                                    <div className="flex items-center gap-1">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editingVideoTitle}
                                                                                            onChange={(e) => setEditingVideoTitle(e.target.value)}
                                                                                            className="flex-1 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-white/40"
                                                                                            autoFocus
                                                                                            onKeyDown={(e) => { if (e.key === 'Escape') { setEditingVideoId(null); setEditingVideoTitle(''); } }}
                                                                                        />
                                                                                        <button type="submit" className="p-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all" title="Sauvegarder">
                                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                                        </button>
                                                                                        <button type="button" onClick={() => { setEditingVideoId(null); setEditingVideoTitle(''); }} className="p-0.5 rounded bg-white/5 text-white/40 hover:text-white transition-all" title="Annuler">
                                                                                            <X className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                    {/* Sélecteur de style / catégorie */}
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="text-[8px] font-bold text-white/40 uppercase">Style :</span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setEditingVideoCategory('liveset')}
                                                                                            className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase transition-all cursor-pointer ${
                                                                                                editingVideoCategory === 'liveset'
                                                                                                    ? 'bg-neon-cyan text-black shadow'
                                                                                                    : 'bg-white/5 text-white/40 hover:text-white'
                                                                                            }`}
                                                                                        >
                                                                                            🎪 Liveset
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setEditingVideoCategory('clip')}
                                                                                            className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase transition-all cursor-pointer ${
                                                                                                editingVideoCategory === 'clip'
                                                                                                    ? 'bg-neon-purple text-white shadow'
                                                                                                    : 'bg-white/5 text-white/40 hover:text-white'
                                                                                            }`}
                                                                                        >
                                                                                            🎬 Clip
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setEditingVideoCategory('interview')}
                                                                                            className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase transition-all cursor-pointer ${
                                                                                                editingVideoCategory === 'interview'
                                                                                                    ? 'bg-neon-red text-white shadow'
                                                                                                    : 'bg-white/5 text-white/40 hover:text-white'
                                                                                            }`}
                                                                                        >
                                                                                            🎙️ Interview
                                                                                        </button>
                                                                                    </div>
                                                                                </form>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2">
                                                                                    <h5 className="text-xs font-bold text-white truncate" title={vid.title}>
                                                                                        {vid.title}
                                                                                    </h5>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleCycleVideoCategoryInBlock(currentBlock.id, idx, vCat)}
                                                                                        className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 transition-all cursor-pointer hover:scale-105 ${
                                                                                            vCat === 'interview'
                                                                                                ? 'bg-neon-red/15 text-neon-red border-neon-red/30 hover:bg-neon-red/25'
                                                                                                : vCat === 'clip'
                                                                                                ? 'bg-neon-purple/15 text-neon-purple border-neon-purple/30 hover:bg-neon-purple/25'
                                                                                                : 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/25'
                                                                                        }`}
                                                                                        title="Changer le style (cliquer pour basculer Liveset / Clip / Interview)"
                                                                                    >
                                                                                        {vCat === 'interview' ? '🎙️ Interview' : vCat === 'clip' ? '🎬 Clip' : '🎪 Liveset'}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center gap-2 text-[9px] text-white/40">
                                                                                <span className="font-mono">ID: {vid.youtubeId}</span>
                                                                                {currentBlockDuplicates.has(vid.youtubeId) && (
                                                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                                                                        <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                                                                                        Doublon
                                                                                    </span>
                                                                                )}
                                                                                {idx > 0 && shareSameArtist(currentBlock.videos?.[idx - 1]?.title || '', vid.title || '') && (
                                                                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0" title="Même artiste consécutif (espacé automatiquement en diffusion TV)">
                                                                                        <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                                                                                        Même artiste consécutif
                                                                                    </span>
                                                                                )}
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
                                                                            onClick={() => handleCycleVideoCategoryInBlock(currentBlock.id, idx, vCat)}
                                                                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-neon-purple transition-all cursor-pointer"
                                                                            title={`Style actuel: ${vCat}. Cliquer pour changer (Liveset / Clip / Interview)`}
                                                                        >
                                                                            <Palette className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { 
                                                                                setEditingVideoId(`block_${currentBlock.id}_${idx}`); 
                                                                                setEditingVideoTitle(vid.title); 
                                                                                setEditingVideoCategory(vCat);
                                                                            }}
                                                                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-neon-cyan disabled:opacity-20 transition-all cursor-pointer"
                                                                            title="Modifier le titre et le style"
                                                                        >
                                                                            <Pencil className="w-3 h-3" />
                                                                        </button>
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
                                                        });
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Promos section inside block */}
                                            {promos.length > 0 && (
                                                <div className="p-2 rounded-lg bg-neon-purple/[0.03] border border-neon-purple/15 space-y-1 shrink-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-neon-purple/70 flex items-center gap-1">
                                                            <Film className="w-3 h-3" />
                                                            Promos intercalées ({promos.length})
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => switchTab('promo')}
                                                            className="text-[8px] text-neon-purple hover:underline font-bold uppercase tracking-wider transition-all"
                                                        >
                                                            Gérer →
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {promos.map((p, pIdx) => (
                                                            <div
                                                                key={p.id}
                                                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neon-purple/10 border border-neon-purple/20"
                                                            >
                                                                <div className="w-8 h-5 rounded overflow-hidden shrink-0 border border-neon-purple/20">
                                                                    <img loading="lazy" decoding="async" src={`https://img.youtube.com/vi/${p.youtubeId}/mqdefault.jpg`}
                                                                        alt={p.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <span className="text-[9px] font-bold text-neon-purple/80 truncate max-w-[120px]">
                                                                    P{pIdx + 1}: {p.title}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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

                                {/* Form: Add Main Video with Anti-Duplicate Security */}
                                {(() => {
                                    const mainYtId = extractYouTubeId(newMainUrl);
                                    const mainDuplicate = mainYtId ? playlist.find(v => v.youtubeId === mainYtId) : null;
                                    const mainDuplicateIdx = mainYtId ? playlist.findIndex(v => v.youtubeId === mainYtId) : -1;

                                    return (
                                        <form onSubmit={handleAddMainVideo} className="mb-2.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 space-y-2">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                                                    <Plus className="w-3 h-3 text-neon-red" />
                                                    Ajouter un set principal à la programmation
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenLibrary('main')}
                                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                                    title="Choisir parmi les clips ou sets déjà programmés dans la TV pour les réutiliser"
                                                >
                                                    <ListPlus className="w-3.5 h-3.5 text-neon-cyan" />
                                                    Choisir set existant ({availableLibraryVideos.length})
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5">
                                                <div className="md:col-span-6 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Lien ou ID YouTube (ex: https://youtube.com/watch?v=...)"
                                                        value={newMainUrl}
                                                        onChange={(e) => handleMainUrlChange(e.target.value)}
                                                        className={`w-full bg-black/60 border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none font-mono transition-colors ${
                                                            mainDuplicate 
                                                                ? 'border-red-500/70 bg-red-500/10 focus:border-red-500' 
                                                                : 'border-white/10 focus:border-neon-red'
                                                        }`}
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
                                                        disabled={!newMainUrl.trim() || !!mainDuplicate}
                                                        className="px-3.5 py-1.5 bg-neon-red hover:bg-neon-red/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
                                                        style={{ background: mainDuplicate ? '#ef4444' : undefined }}
                                                        title={mainDuplicate ? "Ce set est déjà dans la playlist (doublon bloqué)" : "Ajouter à la playlist"}
                                                    >
                                                        {mainDuplicate ? (
                                                            <>
                                                                <ShieldAlert className="w-3.5 h-3.5" />
                                                                Doublon
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="w-3.5 h-3.5" />
                                                                Ajouter
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Anti-duplicate feedback banner */}
                                            {mainDuplicate && (
                                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] animate-in fade-in">
                                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                                                    <span className="font-bold">Sécurité anti-doublon active :</span>
                                                    <span className="truncate">Déjà dans la playlist principale en position #{mainDuplicateIdx + 1} ("{mainDuplicate.title}"). Ajout bloqué.</span>
                                                </div>
                                            )}
                                        </form>
                                    );
                                })()}

                                {/* Duplicate Warning & Quick Cleanup Banner for Main Playlist */}
                                {(() => {
                                    const playlistYtCounts = playlist.reduce((acc, v) => {
                                        if (v.youtubeId) acc[v.youtubeId] = (acc[v.youtubeId] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>);
                                    const duplicateCount = Object.values(playlistYtCounts).filter(c => c > 1).length;

                                    if (duplicateCount === 0) return null;
                                    return (
                                        <div className="mb-2 p-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                                                <span>Des doublons ont été détectés dans la playlist principale ({duplicateCount} vidéo(s) dupliquée(s)).</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCleanPlaylistDuplicates}
                                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                                                title="Purger les doublons en ne conservant que la 1ère occurrence"
                                            >
                                                <ShieldAlert className="w-3 h-3 text-amber-400" />
                                                Nettoyer les doublons
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* List of Main Videos */}
                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0" style={{ contain: 'layout style' }}>
                                    {loading ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-white/40 gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-neon-red" />
                                            <span className="text-xs uppercase tracking-widest font-bold">Chargement de la programmation...</span>
                                        </div>
                                    ) : playlist.length === 0 ? (
                                        <div className="py-12 text-center text-white/40 text-xs uppercase tracking-widest font-bold">
                                            Aucune vidéo dans la programmation TV.
                                        </div>
                                    ) : (() => {
                                            const playlistDupSet = new Set<string>();
                                            const playlistYtCount = new Map<string, number>();
                                            playlist.forEach(v => { if (v.youtubeId) playlistYtCount.set(v.youtubeId, (playlistYtCount.get(v.youtubeId) || 0) + 1); });
                                            playlistYtCount.forEach((cnt, ytid) => { if (cnt > 1) playlistDupSet.add(ytid); });
                                            return playlist.map((video, idx) => {
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
                                                            <img loading="lazy" decoding="async" src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
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
                                                                {editingVideoId === `main_${video.id}` ? (
                                                                    <form
                                                                        className="flex items-center gap-1 flex-1 min-w-0"
                                                                        onSubmit={(e) => { e.preventDefault(); handleRenameMainVideo(video.id, editingVideoTitle); }}
                                                                    >
                                                                        <input
                                                                            type="text"
                                                                            value={editingVideoTitle}
                                                                            onChange={(e) => setEditingVideoTitle(e.target.value)}
                                                                            className="flex-1 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-white/40"
                                                                            autoFocus
                                                                            onKeyDown={(e) => { if (e.key === 'Escape') { setEditingVideoId(null); setEditingVideoTitle(''); } }}
                                                                        />
                                                                        <button type="submit" className="p-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                        </button>
                                                                        <button type="button" onClick={() => { setEditingVideoId(null); setEditingVideoTitle(''); }} className="p-0.5 rounded bg-white/5 text-white/40 hover:text-white transition-all">
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </form>
                                                                ) : (
                                                                    <h4 className="text-white font-bold text-xs truncate">
                                                                        {video.title}
                                                                    </h4>
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] text-white/40 font-mono mt-0.5 flex items-center gap-2">
                                                                <span>ID: {video.youtubeId}</span>
                                                                {playlistDupSet.has(video.youtubeId) && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                                                                        Doublon
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setEditingVideoId(`main_${video.id}`); setEditingVideoTitle(video.title); }}
                                                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-neon-cyan transition-all"
                                                                title="Modifier le titre"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
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
                                                                <img loading="lazy" decoding="async" src={`https://img.youtube.com/vi/${nextPromo.youtubeId}/mqdefault.jpg`}
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
                                                                onClick={() => switchTab('promo')}
                                                                className="text-[9px] text-neon-purple hover:underline px-2 py-0.5 rounded bg-neon-purple/10 hover:bg-neon-purple/20 font-bold uppercase tracking-wider shrink-0 transition-all"
                                                            >
                                                                Gérer promos →
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                        })()}
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

                                {/* Form: Add Promo Video with Anti-Duplicate Security */}
                                {(() => {
                                    const promoYtId = extractYouTubeId(newPromoUrl);
                                    const promoDuplicate = promoYtId ? promos.find(p => p.youtubeId === promoYtId) : null;
                                    const promoDuplicateIdx = promoYtId ? promos.findIndex(p => p.youtubeId === promoYtId) : -1;

                                    return (
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
                                                        className={`w-full bg-black/60 border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none font-mono transition-colors ${
                                                            promoDuplicate
                                                                ? 'border-red-500/70 bg-red-500/10 focus:border-red-500'
                                                                : 'border-white/10 focus:border-neon-purple'
                                                        }`}
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
                                                        disabled={!newPromoUrl.trim() || !!promoDuplicate}
                                                        className="px-3.5 py-1.5 bg-neon-purple hover:bg-neon-purple/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
                                                        style={{ background: promoDuplicate ? '#ef4444' : undefined }}
                                                        title={promoDuplicate ? "Cette promo est déjà dans la liste (doublon bloqué)" : "Ajouter la promo"}
                                                    >
                                                        {promoDuplicate ? (
                                                            <>
                                                                <ShieldAlert className="w-3.5 h-3.5" />
                                                                Doublon
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="w-3.5 h-3.5" />
                                                                Ajouter
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Anti-duplicate feedback banner */}
                                            {promoDuplicate && (
                                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] animate-in fade-in">
                                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                                                    <span className="font-bold">Sécurité anti-doublon active :</span>
                                                    <span className="truncate">Cette promo est déjà enregistrée en position #{promoDuplicateIdx + 1} ("{promoDuplicate.title}"). Ajout bloqué.</span>
                                                </div>
                                            )}
                                        </form>
                                    );
                                })()}

                                {/* Duplicate Warning & Quick Cleanup Banner for Promos */}
                                {(() => {
                                    const promoYtCounts = promos.reduce((acc, p) => {
                                        if (p.youtubeId) acc[p.youtubeId] = (acc[p.youtubeId] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>);
                                    const duplicateCount = Object.values(promoYtCounts).filter(c => c > 1).length;

                                    if (duplicateCount === 0) return null;
                                    return (
                                        <div className="mb-2 p-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                                                <span>Des doublons ont été détectés dans les vidéos promo ({duplicateCount} vidéo(s) dupliquée(s)).</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCleanPromoDuplicates}
                                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                                                title="Purger les doublons promo en conservant la 1ère occurrence"
                                            >
                                                <ShieldAlert className="w-3 h-3 text-amber-400" />
                                                Nettoyer les doublons
                                            </button>
                                        </div>
                                    );
                                })()}

                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0">
                                    {promos.length === 0 ? (
                                        <div className="py-12 text-center text-white/40 text-xs uppercase tracking-widest font-bold">
                                            Aucune vidéo promo configurée. Les sets principaux s'enchaîneront directement sans promo.
                                        </div>
                                    ) : (() => {
                                            const promoDupSet = new Set<string>();
                                            const promoYtCnt = new Map<string, number>();
                                            promos.forEach(x => { if (x.youtubeId) promoYtCnt.set(x.youtubeId, (promoYtCnt.get(x.youtubeId) || 0) + 1); });
                                            promoYtCnt.forEach((cnt, ytid) => { if (cnt > 1) promoDupSet.add(ytid); });
                                            return promos.map((p, idx) => { return (
                                            <div
                                                key={p.id || idx}
                                                className="group p-1.5 px-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-neon-purple/30 transition-all flex items-center gap-2.5"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-[10px] font-black font-mono text-neon-purple shrink-0">
                                                    P{idx + 1}
                                                </div>

                                                <div className="w-16 h-10 rounded-lg bg-black overflow-hidden relative shrink-0 border border-white/10">
                                                    <img loading="lazy" decoding="async" src={`https://img.youtube.com/vi/${p.youtubeId}/mqdefault.jpg`}
                                                        alt={p.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {editingVideoId === `promo_${p.id}` ? (
                                                        <form
                                                            className="flex items-center gap-1"
                                                            onSubmit={(e) => { e.preventDefault(); handleRenamePromo(p.id, editingVideoTitle); }}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={editingVideoTitle}
                                                                onChange={(e) => setEditingVideoTitle(e.target.value)}
                                                                className="flex-1 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-white/40"
                                                                autoFocus
                                                                onKeyDown={(e) => { if (e.key === 'Escape') { setEditingVideoId(null); setEditingVideoTitle(''); } }}
                                                            />
                                                            <button type="submit" className="p-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                            </button>
                                                            <button type="button" onClick={() => { setEditingVideoId(null); setEditingVideoTitle(''); }} className="p-0.5 rounded bg-white/5 text-white/40 hover:text-white transition-all">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </form>
                                                    ) : (
                                                        <h4 className="text-white font-bold text-xs truncate">
                                                            {p.title}
                                                        </h4>
                                                    )}
                                                    <div className="text-[9px] text-white/40 font-mono mt-0.5 flex items-center gap-2">
                                                        <span>ID: {p.youtubeId} · Jouée après le set {idx + 1}</span>
                                                        {promoDupSet.has(p.youtubeId) && (
                                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                                                                Doublon
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingVideoId(`promo_${p.id}`); setEditingVideoTitle(p.title); }}
                                                        className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-neon-cyan transition-all"
                                                        title="Modifier le titre"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
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
                                        );
                                        });
                                        })()}
                                </div>
                            </>
                        )}

                        {/* ========================================================= */}
                        {/* TAB: LIVE TAKEOVER (NATIVE COMPLETE PANEL - NO IFRAME) */}
                        {activeTab === 'live' && (
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 flex flex-col custom-scrollbar">
                                {/* Status Banner with Big Toggles */}
                                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 transition-all ${
                                    takeoverState?.status === 'live'
                                        ? 'bg-green-950/40 border-green-600/40 shadow-lg shadow-green-900/20'
                                        : takeoverState?.status === 'edit'
                                            ? 'bg-orange-950/40 border-orange-500/40 shadow-lg shadow-orange-900/20'
                                            : 'bg-[#121620] border-white/10'
                                }`}>
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                                            takeoverState?.status === 'live'
                                                ? 'bg-green-600/20 text-green-400 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                                : takeoverState?.status === 'edit'
                                                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                                                    : 'bg-white/5 text-white/30 border-white/10'
                                        }`}>
                                            <Radio className={`w-6 h-6 ${takeoverState?.status === 'live' ? 'animate-pulse' : ''}`} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Statut Live Takeover</div>
                                            <div className={`text-base font-black uppercase tracking-wider flex items-center gap-2 ${
                                                takeoverState?.status === 'live' ? 'text-green-400' :
                                                takeoverState?.status === 'edit' ? 'text-orange-400' : 'text-white/40'
                                            }`}>
                                                {takeoverState?.status === 'live' ? '🔴 EN DIRECT – ON AIR' : '⚫ HORS LIGNE – OFF'}
                                            </div>
                                            <p className="text-[10px] text-white/40 mt-0.5">
                                                {takeoverState?.status === 'live' ? 'Le flux vidéo live remplace la programmation continue et le chat est ouvert.' : 'La diffusion continue normale de DropsidersTV est active.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Big Radio Status Buttons (OFF / ON AIR UNIQUEMENT) */}
                                    <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('off')}
                                            disabled={isUpdatingTakeover}
                                            className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                takeoverState?.status !== 'live'
                                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/40 font-black'
                                                    : 'bg-transparent text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                            title="Désactiver le Live (Repasser sur la programmation continue TV)"
                                        >
                                            OFF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('live')}
                                            disabled={isUpdatingTakeover}
                                            className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                takeoverState?.status === 'live'
                                                    ? 'bg-green-600 text-white shadow-md shadow-green-600/40 font-black animate-pulse'
                                                    : 'bg-transparent text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                            title="Prendre l'antenne en direct (ON AIR)"
                                        >
                                            ON AIR
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-Tabs Navigation for Live Takeover */}
                                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0 text-xs font-bold overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setLiveSubTab('general')}
                                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            liveSubTab === 'general' ? 'bg-neon-red/20 text-white border border-neon-red/40 shadow-sm' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Radio className="w-3.5 h-3.5 text-neon-red" />
                                        Signal & Flux Vidéo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLiveSubTab('planning')}
                                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            liveSubTab === 'planning' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                        Lineup & Horaires
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLiveSubTab('ticker')}
                                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            liveSubTab === 'ticker' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                                        Bannières & Ticker
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLiveSubTab('moderation')}
                                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            liveSubTab === 'moderation' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                        Chat, Bot & Modération
                                    </button>
                                </div>

                                {/* SUB-TAB: GENERAL & FLUX VIDÉO */}
                                {liveSubTab === 'general' && (
                                    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Titre de l'événement en direct
                                                </label>
                                                <input
                                                    type="text"
                                                    value={takeoverState?.title || ''}
                                                    onChange={(e) => updateTakeoverField('title', e.target.value)}
                                                    placeholder="Ex: LIVESTREAM ULTRA MIAMI 2026"
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:border-neon-red outline-none"
                                                />
                                                <p className="text-[10px] text-white/30 mt-1">Affiché en tête du lecteur et dans la barre de titre.</p>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Lien ou ID YouTube du direct
                                                </label>
                                                <input
                                                    type="text"
                                                    value={takeoverState?.youtubeId || ''}
                                                    onChange={(e) => {
                                                        const ytid = extractYouTubeId(e.target.value) || e.target.value;
                                                        updateTakeoverField('youtubeId', ytid);
                                                    }}
                                                    placeholder="Ex: https://www.youtube.com/watch?v=... ou ID vidéo"
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono font-bold focus:border-neon-cyan outline-none"
                                                />
                                                <p className="text-[10px] text-white/30 mt-1">Accepte les URLs complètes, raccourcies youtu.be ou directement l'ID.</p>
                                            </div>
                                        </div>

                                        {takeoverState?.youtubeId && (
                                            <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                                                <div className="w-20 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${extractYouTubeId(takeoverState.youtubeId) || takeoverState.youtubeId}/mqdefault.jpg`}
                                                        alt="Aperçu YouTube"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-black uppercase text-neon-cyan">Flux YouTube Configuré</div>
                                                    <div className="text-xs font-mono text-white/80 truncate">ID: {extractYouTubeId(takeoverState.youtubeId) || takeoverState.youtubeId}</div>
                                                </div>
                                                <a
                                                    href={`https://www.youtube.com/watch?v=${extractYouTubeId(takeoverState.youtubeId) || takeoverState.youtubeId}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 hover:text-white flex items-center gap-1.5"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Tester sur YouTube
                                                </a>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                Chaînes & flux complémentaires (Twitch, Kick, URL externe)
                                            </label>
                                            <input
                                                type="text"
                                                value={takeoverState?.channels || ''}
                                                onChange={(e) => updateTakeoverField('channels', e.target.value)}
                                                placeholder="Ex: twitch.tv/dropsiders, kick.com/dropsiders"
                                                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-neon-purple outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB: LINEUP & PLANNING (MODAL & CARDS ARTISTES : PHOTO OBLIGATOIRE, STAGE FLUX ENREGISTRÉS, INSTAGRAM) */}
                                {liveSubTab === 'planning' && (
                                    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        {/* Header section planning */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                                    Lineup & Artistes ({parsedLineupArtists.length})
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                                                        Photo obligatoire
                                                    </span>
                                                </h3>
                                                <p className="text-[11px] text-white/50 mt-0.5">
                                                    Chaque artiste possède sa photo, son heure de passage, sa scène (flux enregistré) et son Instagram.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setArtistFormError(null);
                                                    setShowAddArtistModal(true);
                                                }}
                                                className="px-4 py-2 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-neon-cyan/20 cursor-pointer shrink-0 active:scale-95"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Ajouter un artiste</span>
                                            </button>
                                        </div>

                                        {/* MODAL / FORMULAIRE D'AJOUT D'ARTISTE */}
                                        {showAddArtistModal && (
                                            <div className="p-4 rounded-2xl bg-black/80 border-2 border-neon-cyan/50 shadow-2xl space-y-4 animate-in fade-in">
                                                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                                    <span className="text-xs font-black uppercase tracking-widest text-neon-cyan flex items-center gap-2">
                                                        <Plus className="w-4 h-4" />
                                                        Nouvel Artiste au Lineup
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddArtistModal(false)}
                                                        className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {artistFormError && (
                                                    <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                                        <span>{artistFormError}</span>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Colonne 1: Photo OBLIGATOIRE */}
                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/70">
                                                            Photo de l'artiste <span className="text-neon-red font-bold">* (OBLIGATOIRE)</span>
                                                        </label>

                                                        <div className={`w-full h-36 rounded-xl border-2 ${newArtistImage ? 'border-neon-cyan/50' : 'border-dashed border-red-500/50 bg-red-950/20'} overflow-hidden relative flex flex-col items-center justify-center`}>
                                                            {newArtistImage ? (
                                                                <>
                                                                    <img src={newArtistImage} alt="Preview" className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setNewArtistImage('')}
                                                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-red-400 hover:text-white"
                                                                        title="Supprimer la photo"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                                                    <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-2">
                                                                        <Camera className="w-5 h-5" />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-red-300">Aucune photo sélectionnée</span>
                                                                    <span className="text-[10px] text-white/40 mt-0.5">La photo est obligatoire pour valider l'artiste</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Boutons Upload et URL */}
                                                        <div className="flex items-center gap-2">
                                                            <label className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                                                                <Upload className="w-3.5 h-3.5 text-neon-cyan" />
                                                                <span>{isUploadingArtistImage ? 'Upload en cours...' : 'Choisir une photo...'}</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleUploadArtistPhoto}
                                                                    disabled={isUploadingArtistImage}
                                                                    className="hidden"
                                                                />
                                                            </label>

                                                            <input
                                                                type="text"
                                                                value={newArtistImage}
                                                                onChange={(e) => setNewArtistImage(e.target.value)}
                                                                placeholder="Ou coller une URL d'image..."
                                                                className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-neon-cyan outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Colonne 2 : Nom, Stage (Flux enregistrés), Horaires, Instagram */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">
                                                                Nom de l'artiste <span className="text-neon-red font-bold">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={newArtistName}
                                                                onChange={(e) => setNewArtistName(e.target.value)}
                                                                placeholder="Ex: MARTIN GARRIX, DAVID GUETTA..."
                                                                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-black uppercase tracking-wider focus:border-neon-cyan outline-none"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">
                                                                Stage / Scène (Flux enregistrés) <span className="text-neon-cyan font-bold">*</span>
                                                            </label>
                                                            <select
                                                                value={newArtistStage}
                                                                onChange={(e) => setNewArtistStage(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:border-neon-cyan outline-none"
                                                            >
                                                                {recordedStages.map((stg) => (
                                                                    <option key={stg} value={stg} className="bg-[#121212] text-white">
                                                                        {stg}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Horaires début / fin */}
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">
                                                                    Heure Début <span className="text-neon-cyan font-bold">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={newArtistStartTime}
                                                                    onChange={(e) => setNewArtistStartTime(e.target.value)}
                                                                    placeholder="Ex: 20:00"
                                                                    className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono font-bold text-center focus:border-neon-cyan outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">
                                                                    Heure Fin <span className="text-neon-cyan font-bold">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={newArtistEndTime}
                                                                    onChange={(e) => setNewArtistEndTime(e.target.value)}
                                                                    placeholder="Ex: 21:30"
                                                                    className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono font-bold text-center focus:border-neon-cyan outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Instagram */}
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/70 mb-1 flex items-center gap-1.5">
                                                                <Instagram className="w-3 h-3 text-pink-400" />
                                                                Instagram de l'artiste
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={newArtistInstagram}
                                                                onChange={(e) => setNewArtistInstagram(e.target.value)}
                                                                placeholder="Ex: @martingarrix ou lien profil"
                                                                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:border-pink-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bouton de validation de l'artiste */}
                                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddArtistModal(false)}
                                                        className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveNewArtist}
                                                        className="px-6 py-2 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
                                                    >
                                                        Valider et Ajouter
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* LISTE DES CARTES D'ARTISTES PROGRAMMÉS */}
                                        {parsedLineupArtists.length === 0 ? (
                                            <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                                                <Calendar className="w-10 h-10 mx-auto text-white/20" />
                                                <p className="text-xs font-bold text-white/50">Aucun artiste programmé pour le moment.</p>
                                                <p className="text-[10px] text-white/30">Cliquez sur « Ajouter un artiste » pour créer le planning avec photo obligatoire et scène.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                                                {parsedLineupArtists.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center gap-3 transition-all relative overflow-hidden group"
                                                    >
                                                        {/* Photo miniature (Obligatoire) */}
                                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/15">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.artist} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-red-950/40 border border-red-500/50 flex flex-col items-center justify-center text-center p-1">
                                                                    <AlertCircle className="w-5 h-5 text-red-400 mb-0.5" />
                                                                    <span className="text-[7px] font-black text-red-400 uppercase">Sans Photo</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Détails artiste */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 truncate max-w-[140px]">
                                                                    {item.stage || 'Main Stage'}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-white/60 font-bold flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-amber-400" />
                                                                    {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                                                                </span>
                                                            </div>

                                                            <h4 className="text-sm font-black text-white uppercase italic tracking-tight truncate mt-1">
                                                                {item.artist}
                                                            </h4>

                                                            {item.instagram && (
                                                                <a
                                                                    href={item.instagram.startsWith('http') ? item.instagram : `https://instagram.com/${item.instagram.replace('@', '')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[9px] font-bold text-pink-400 hover:text-pink-300 mt-1 hover:underline truncate"
                                                                >
                                                                    <Instagram className="w-3 h-3" />
                                                                    <span>{item.instagram}</span>
                                                                </a>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="shrink-0 flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteArtist(item.id)}
                                                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                                                                title="Supprimer cet artiste"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Configuration globale dates de l'événement */}
                                        <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Date & Heure de début générale
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={takeoverState?.startDate || ''}
                                                    onChange={(e) => updateTakeoverField('startDate', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-amber-400 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Date & Heure de fin générale
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={takeoverState?.endDate || ''}
                                                    onChange={(e) => updateTakeoverField('endDate', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-amber-400 outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-white">Afficher dans l'Agenda</div>
                                                    <div className="text-[9px] text-white/40">Visible dans la programmation du site</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTakeoverField('showInAgenda', !takeoverState?.showInAgenda)}
                                                    className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${takeoverState?.showInAgenda ? 'bg-amber-400' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState?.showInAgenda ? 'right-0.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB: BANNIÈRES & TICKER */}
                                {liveSubTab === 'ticker' && (
                                    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-white">Forcer l'accueil</div>
                                                    <div className="text-[8px] text-white/40">Remplace la page d'accueil par le Live</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTakeoverField('forceHomepage', !takeoverState?.forceHomepage)}
                                                    className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${takeoverState?.forceHomepage ? 'bg-neon-red' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState?.forceHomepage ? 'right-0.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-white">Afficher dans le Menu</div>
                                                    <div className="text-[8px] text-white/40">Badge Live dans la barre de navigation</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTakeoverField('showInNavbar', !takeoverState?.showInNavbar)}
                                                    className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${takeoverState?.showInNavbar ? 'bg-neon-cyan' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState?.showInNavbar ? 'right-0.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-white">Bannière haute</div>
                                                    <div className="text-[8px] text-white/40">Bandeau d'alerte sous le header</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTakeoverField('showTopBanner', !takeoverState?.showTopBanner)}
                                                    className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${takeoverState?.showTopBanner ? 'bg-neon-purple' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState?.showTopBanner ? 'right-0.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Ticker Banner Controls */}
                                        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Sliders className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-xs font-black uppercase text-white">Bandeau Ticker Défilant</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTakeoverField('showTickerBanner', !takeoverState?.showTickerBanner)}
                                                    className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${takeoverState?.showTickerBanner ? 'bg-cyan-400' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState?.showTickerBanner ? 'right-0.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">
                                                        Texte du bandeau défilant
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={takeoverState?.tickerText || ''}
                                                        onChange={(e) => updateTakeoverField('tickerText', e.target.value)}
                                                        placeholder="Ex: ⚡ EN DIRECT : ULTRA MIAMI 2026 SUR DROPSIDERS TV"
                                                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:border-cyan-400 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">
                                                        Lien au clic sur le bandeau
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={takeoverState?.tickerLink || ''}
                                                        onChange={(e) => updateTakeoverField('tickerLink', e.target.value)}
                                                        placeholder="Ex: /live"
                                                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 pt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-white/60 uppercase">Fond :</span>
                                                    <input
                                                        type="color"
                                                        value={takeoverState?.tickerBgColor || '#000000'}
                                                        onChange={(e) => updateTakeoverField('tickerBgColor', e.target.value)}
                                                        className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-white/60 uppercase">Texte :</span>
                                                    <input
                                                        type="color"
                                                        value={takeoverState?.tickerTextColor || '#ffffff'}
                                                        onChange={(e) => updateTakeoverField('tickerTextColor', e.target.value)}
                                                        className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SUB-TAB: CHAT, BOT & MODÉRATION */}
                                {liveSubTab === 'moderation' && (
                                    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Modérateurs du Live (séparés par des virgules)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={takeoverState?.moderators || ''}
                                                    onChange={(e) => updateTakeoverField('moderators', e.target.value)}
                                                    placeholder="Alex, Tanguy, Julien..."
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:border-purple-400 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Message épinglé en tête du Chat
                                                </label>
                                                <input
                                                    type="text"
                                                    value={takeoverState?.pinnedMessage || ''}
                                                    onChange={(e) => updateTakeoverField('pinnedMessage', e.target.value)}
                                                    placeholder="Bienvenue sur le Live Dropsiders ! Restez respectueux."
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-purple-400 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Message automatique périodique du Bot
                                                </label>
                                                <input
                                                    type="text"
                                                    value={takeoverState?.autoMessage || ''}
                                                    onChange={(e) => updateTakeoverField('autoMessage', e.target.value)}
                                                    placeholder="N'hésitez pas à poser vos questions dans le chat !"
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-purple-400 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                    Intervalle du message automatique (en secondes)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={10}
                                                    step={10}
                                                    value={takeoverState?.autoMessageInterval || 60}
                                                    onChange={(e) => updateTakeoverField('autoMessageInterval', parseInt(e.target.value, 10) || 60)}
                                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-purple-400 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1.5">
                                                Commandes personnalisées du chat (ex: !lineup, !horaires)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={takeoverState?.customCommands || ''}
                                                onChange={(e) => updateTakeoverField('customCommands', e.target.value)}
                                                placeholder="!lineup: Retrouvez le planning complet sur dropsiders.fr
!radio: Écoutez également notre radio sur dropsiders.fr/radio"
                                                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-purple-400 outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-white">Mode Secret / Privé</div>
                                                    <div className="text-[8px] text-white/40">Accessible uniquement via code</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTakeoverField('isSecret', !takeoverState?.isSecret)}
                                                    className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${takeoverState?.isSecret ? 'bg-purple-500' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState?.isSecret ? 'right-0.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">
                                                    Mot de passe (si mode secret)
                                                </label>
                                                <input
                                                    type="password"
                                                    value={takeoverState?.password || ''}
                                                    onChange={(e) => updateTakeoverField('password', e.target.value)}
                                                    placeholder="Mot de passe secret"
                                                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-purple-400 outline-none"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-white">Votes DJ Wiki</div>
                                                    <div className="text-[8px] text-white/40">Permet au public de voter</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateTakeoverField('wikiVotesEnabled', !takeoverState?.wikiVotesEnabled)}
                                                    className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${takeoverState?.wikiVotesEnabled ? 'bg-green-500' : 'bg-gray-800'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${takeoverState?.wikiVotesEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Live Actions Bar */}
                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <a
                                            href="/live"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Tester la page publique /live</span>
                                        </a>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSaveLive}
                                        disabled={liveSaving}
                                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan hover:opacity-90 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl shadow-neon-red/20 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {liveSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : liveSaved ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-300" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        <span>{liveSaving ? 'Sauvegarde des réglages...' : liveSaved ? 'Réglages Live Enregistrés !' : 'Enregistrer les réglages Live'}</span>
                                    </button>
                                </div>
                            </div>
                        )}{/* Modal Footer Controls for TV Tab */}
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
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal Bibliothèque de clips & lives déjà programmés */}
            {isLibraryOpen && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4 bg-black/85 overflow-hidden animate-in fade-in">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-[#0f1117] border border-white/15 w-full max-w-4xl h-[88vh] max-h-[820px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
                                    <ListPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        Bibliothèque TV · Clips & Lives
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                                            {availableLibraryVideos.length} disponibles
                                        </span>
                                    </h3>
                                    <p className="text-[11px] text-white/50">
                                        {libraryTarget === 'block' ? (
                                            (() => {
                                                const targetBlock = blocks.find(b => b.id === selectedBlockId);
                                                return (
                                                    <>
                                                        Destination : Émission <span className="text-neon-cyan font-bold">"{targetBlock?.title || 'Créneau'}"</span> ({targetBlock?.timeSlot || ''})
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <>
                                                Destination : <span className="text-neon-red font-bold">Programmation principale (Playlist TV)</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLibraryOpen(false)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search & Source Filter Bar */}
                        <div className="p-3 bg-white/[0.02] border-b border-white/10 space-y-2.5 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par titre, artiste, ID YouTube ou émission..."
                                        value={librarySearch}
                                        onChange={(e) => setLibrarySearch(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan font-medium"
                                    />
                                    {librarySearch && (
                                        <button
                                            type="button"
                                            onClick={() => setLibrarySearch('')}
                                            className="absolute right-2.5 top-2 text-white/40 hover:text-white text-xs"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleToggleSelectAllLibrary}
                                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all shrink-0"
                                >
                                    Tout (dé)sélectionner
                                </button>
                            </div>

                            {/* Horizontal scroll of category filter tabs */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
                                <button
                                    type="button"
                                    onClick={() => setLibraryFilter('all')}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
                                        libraryFilter === 'all'
                                            ? 'bg-neon-cyan text-black shadow-sm shadow-neon-cyan/30'
                                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                                    }`}
                                >
                                    Tous ({availableLibraryVideos.length})
                                </button>
                                {librarySources.map(source => {
                                    const count = availableLibraryVideos.filter(v => v.sources.includes(source)).length;
                                    const isSelected = libraryFilter === source;
                                    return (
                                        <button
                                            key={source}
                                            type="button"
                                            onClick={() => setLibraryFilter(source)}
                                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all ${
                                                isSelected
                                                    ? 'bg-neon-cyan text-black shadow-sm shadow-neon-cyan/30'
                                                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                                            }`}
                                        >
                                            {source} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* List of Videos */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                            {filteredLibraryVideos.length === 0 ? (
                                <div className="py-16 text-center text-white/40 space-y-2">
                                    <Film className="w-10 h-10 mx-auto text-white/20" />
                                    <p className="text-sm font-semibold">Aucune vidéo trouvée</p>
                                    <p className="text-xs text-white/30">Modifiez votre recherche ou vos filtres.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
                                    {filteredLibraryVideos.map((item) => {
                                        const isAlreadyInTarget = isVideoInTarget(item.youtubeId);
                                        const isSelected = selectedLibraryIds.includes(item.youtubeId);

                                        return (
                                            <div
                                                key={item.youtubeId}
                                                className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center gap-3 select-none ${
                                                    isAlreadyInTarget
                                                        ? 'bg-white/[0.02] border-white/5 opacity-55 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-neon-cyan/10 border-neon-cyan/50 shadow-sm shadow-neon-cyan/10'
                                                            : 'bg-white/[0.04] hover:bg-white/[0.07] border-white/10'
                                                }`}
                                            >
                                                {/* Checkbox */}
                                                <div
                                                    onClick={() => !isAlreadyInTarget && handleToggleSelectLibraryItem(item.youtubeId)}
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                                        isAlreadyInTarget
                                                            ? 'bg-white/5 border-white/10 cursor-not-allowed text-white/20'
                                                            : isSelected
                                                                ? 'bg-neon-cyan border-neon-cyan text-black cursor-pointer'
                                                                : 'border-white/20 hover:border-white/50 cursor-pointer'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>

                                                {/* Thumbnail preview */}
                                                <div className="w-16 h-10 rounded-lg overflow-hidden bg-black shrink-0 relative border border-white/10">
                                                    <img loading="lazy" decoding="async" src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Title & Metadata */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold text-white truncate" title={item.title}>
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                        <span className="text-[10px] font-mono text-white/40">
                                                            {item.youtubeId}
                                                        </span>
                                                        {item.sources.map((s, idx) => {
                                                            const style = getSourceStyle(s);
                                                            return (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-1 text-[8px] font-display font-black uppercase italic px-1.5 py-0.5 rounded border truncate max-w-[130px]"
                                                                    style={{
                                                                        backgroundColor: `${style.color}18`,
                                                                        borderColor: `${style.color}45`,
                                                                        color: style.color,
                                                                    }}
                                                                    title={s}
                                                                >
                                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_4px_currentColor]" style={{ backgroundColor: style.color }} />
                                                                    <span className="truncate">{style.emoji} {s}</span>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Quick Action Button */}
                                                <div className="shrink-0">
                                                    {isAlreadyInTarget ? (
                                                        <span className="text-[10px] font-bold text-white/40 px-2 py-1 rounded bg-white/5 border border-white/5 whitespace-nowrap flex items-center gap-1">
                                                            <Check className="w-3 h-3 text-emerald-400" />
                                                            Déjà présent
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddSingleFromLibrary(item)}
                                                            className="px-2.5 py-1 rounded-lg bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/40 text-neon-cyan hover:text-white text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                                                            title="Ajouter immédiatement cette vidéo"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Ajouter
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer with batch add */}
                        <div className="p-3 sm:p-4 bg-black/60 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-white/60">
                                {selectedLibraryIds.length > 0 ? (
                                    <span className="text-neon-cyan font-bold">
                                        {selectedLibraryIds.length} vidéo(s) sélectionnée(s)
                                    </span>
                                ) : (
                                    <span>Sélectionnez plusieurs vidéos pour les ajouter en groupe</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLibraryOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Fermer
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddBatchFromLibrary}
                                    disabled={selectedLibraryIds.length === 0}
                                    className="px-4 py-2 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 disabled:opacity-30 disabled:cursor-not-allowed text-black text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-neon-cyan/20 active:scale-95 flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4 stroke-[3]" />
                                    Ajouter la sélection ({selectedLibraryIds.length})
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* ── AUDIT DOUBLONS TV ── */}
        <DuplicateAuditModal
            isOpen={showTVDuplicateAudit && tvDuplicates.length > 0}
            mode="tv"
            duplicates={tvDuplicates}
            onResolve={handleResolveTVDuplicate}
            onClose={() => setShowTVDuplicateAudit(false)}
        />

        {/* ── RADIONOMY JINGLES & PUBS MANAGER (TV) ── */}
        <RadionomyJinglesBox
            isOpen={isRadionomyOpen}
            onClose={() => setIsRadionomyOpen(false)}
            currentBlockTitle={currentBlockMemo?.title || 'Programmation TV'}
            onInsertItem={handleInsertRadionomyItem}
            onApplyRadionomyRule={handleApplyRadionomyRule}
            onOpenYouTubeSearch={() => {
                setIsRadionomyOpen(false);
                setIsYouTubeSearchOpen(true);
            }}
        />

        {/* ── RECHERCHE YOUTUBE DIRECTE (TV) ── */}
        <YouTubeSearchModal
            isOpen={isYouTubeSearchOpen}
            onClose={() => setIsYouTubeSearchOpen(false)}
            mode="tv"
            blockTitle={currentBlockMemo?.title || 'Programmation TV'}
            onAddVideo={handleYouTubeAddVideo}
        />

        {/* ── MODAL DE CONFIRMATION DROPSIDERS ── */}
        <ConfirmModal
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            type={confirmModal.type}
            confirmText={confirmModal.confirmText}
            cancelText={confirmModal.cancelText}
            hideCancel={confirmModal.hideCancel}
            onConfirm={() => {
                confirmModal.onConfirm?.();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }}
            onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
        </>
    );
}
