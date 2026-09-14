import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, Plus, Trash2, ChevronUp, ChevronDown, Save, ExternalLink, RotateCcw, CheckCircle2, Loader2, AlertCircle, Film, ChevronRight, Sparkles, Radio, Zap, Eye, Calendar, Home } from 'lucide-react';
import { apiFetch, getAuthHeaders } from '../../../utils/auth';
import type { TVVideo, PromoVideo } from '../../../pages/DropsidersTVPage';

export type { TVVideo, PromoVideo };

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

interface TakeoverStatePartial {
    enabled: boolean;
    status?: 'off' | 'edit' | 'live';
    youtubeId?: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    forceHomepage?: boolean;
    showInNavbar?: boolean;
    showInAgenda?: boolean;
    isSecret?: boolean;
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

export function AdminTVModal({ isOpen, onClose, takeoverState, onUpdateLiveStatus, onSaveTakeover, onTakeoverChange, isUpdatingTakeover }: AdminTVModalProps) {
    const [activeTab, setActiveTab] = useState<'main' | 'promo' | 'live'>('main');
    const [liveSaving, setLiveSaving] = useState(false);
    const [liveSaved, setLiveSaved] = useState(false);

    // Main Videos list
    const [playlist, setPlaylist] = useState<TVVideo[]>(DEFAULT_MAIN_PLAYLIST);
    // Promo Videos list
    const [promos, setPromos] = useState<PromoVideo[]>([]);

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

    useEffect(() => {
        if (!isOpen) return;
        const fetchSettings = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
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
        if (confirm('Restaurer la liste par défaut des sets de festivals ?')) {
            setPlaylist(DEFAULT_MAIN_PLAYLIST);
            setPromos([]);
        }
    };

    // Save All
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

        setSaving(true);
        setError(null);
        setSaveMessage(null);

        const startTime = Date.now();

        // 1. Immediate LocalStorage save so /tv works immediately & restarts broadcast
        try {
            localStorage.setItem('dropsiders_tv_playlist_v2', JSON.stringify(currentPlaylist));
            localStorage.setItem('dropsiders_tv_promos_v2', JSON.stringify(currentPromos));
            localStorage.setItem('dropsiders_tv_start_time', startTime.toString());
            localStorage.setItem('dropsiders_tv_state', JSON.stringify({
                index: 0,
                isPromo: false,
                currentTime: 0,
                updatedAt: startTime
            }));

            try {
                const bc = new BroadcastChannel('dropsiders_tv_sync');
                bc.postMessage({
                    type: 'TV_SCHEDULE_UPDATED',
                    startTime,
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
                setSaveMessage('Programmation et promos enregistrées avec succès !');
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/95 backdrop-blur-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 max-w-3xl w-full shadow-[0_0_100px_rgba(255,18,65,0.15)] relative overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="flex justify-between items-start mb-4 relative z-10 shrink-0">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red">
                                        <Tv className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                            DROPSIDERS <span className="text-neon-red">TV</span>
                                        </h2>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                                            Programmation continue · Sets & Vidéos Promo
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href="/tv"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all flex items-center gap-1.5"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Voir la TV
                                </a>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Alternation Diagram */}
                        <div className="mb-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 flex items-center justify-between gap-2 overflow-x-auto text-[10px] font-bold">
                            <span className="text-white/40 uppercase tracking-widest text-[9px] shrink-0">
                                Ordre de diffusion :
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">
                                    Vidéo 1
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <span className="px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                    Promo 1
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <span className="px-2 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">
                                    Vidéo 2
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <span className="px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                    Promo 2
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <span className="px-2 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">
                                    Vidéo 3
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <span className="px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                    {promos.length > 2 ? 'Promo 3' : 'Promo 1'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20" />
                                <span className="text-white/30">...</span>
                            </div>
                        </div>

                        {/* Tabs Switcher */}
                        <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-white/10 pb-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('main')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                                    activeTab === 'main'
                                        ? 'bg-neon-red text-white shadow-lg shadow-neon-red/30'
                                        : 'bg-white/5 text-white/50 hover:text-white'
                                }`}
                            >
                                <Tv className="w-4 h-4" />
                                1. Vidéos Principales ({playlist.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('promo')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                                    activeTab === 'promo'
                                        ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/30'
                                        : 'bg-white/5 text-white/50 hover:text-white'
                                }`}
                            >
                                <Film className="w-4 h-4" />
                                2. Vidéos Promo ({promos.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('live')}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                                    activeTab === 'live'
                                        ? takeoverState?.status === 'live'
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/30 animate-pulse'
                                            : 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-white/5 text-white/50 hover:text-white'
                                }`}
                            >
                                <Radio className="w-4 h-4" />
                                3. Live Takeover
                                {takeoverState?.status === 'live' && (
                                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                )}
                            </button>
                        </div>

                        {/* Tab Content: MAIN VIDEOS */}
                        {activeTab === 'main' && (
                            <>
                                {/* Add Main Form */}
                                <form onSubmit={handleAddMainVideo} className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 shrink-0 space-y-2.5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neon-red flex items-center gap-2">
                                        <Plus className="w-3.5 h-3.5" />
                                        Ajouter une vidéo principale (Set, festival...)
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                                        <div className="md:col-span-6 relative">
                                            <input
                                                type="text"
                                                placeholder="Lien YouTube (watch, youtu.be, shorts, live...)"
                                                value={newMainUrl}
                                                onChange={(e) => handleMainUrlChange(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-4 relative flex items-center">
                                            <input
                                                type="text"
                                                placeholder="Titre du set"
                                                value={newMainTitle}
                                                onChange={(e) => setNewMainTitle(e.target.value)}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red pr-8"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleManualFetchMainTitle}
                                                disabled={isFetchingMainTitle || !newMainUrl}
                                                title="Récupérer le titre automatique"
                                                className="absolute right-2 text-white/40 hover:text-neon-cyan disabled:opacity-30 transition-colors"
                                            >
                                                {isFetchingMainTitle ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neon-cyan" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            className="md:col-span-2 py-2.5 rounded-xl bg-neon-red text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-neon-red/90 transition-all active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Ajouter
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Description (optionnel)"
                                        value={newMainDesc}
                                        onChange={(e) => setNewMainDesc(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
                                    />
                                </form>

                                {/* Main List */}
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
                                    {loading ? (
                                        <div className="py-12 flex justify-center items-center">
                                            <Loader2 className="w-7 h-7 text-neon-red animate-spin" />
                                        </div>
                                    ) : playlist.length === 0 ? (
                                        <div className="py-8 text-center text-white/40 text-xs">
                                            Aucune vidéo principale configurée.
                                        </div>
                                    ) : (
                                        playlist.map((vid, idx) => (
                                            <div
                                                key={vid.id}
                                                className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-7 h-7 rounded-xl bg-neon-red/10 border border-neon-red/20 text-neon-red flex items-center justify-center text-xs font-black shrink-0">
                                                        #{idx + 1}
                                                    </span>
                                                    <img
                                                        src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`}
                                                        alt={vid.title}
                                                        className="w-16 h-10 object-cover rounded-lg bg-black border border-white/10 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate">
                                                            {vid.title}
                                                        </h4>
                                                        <span className="text-[10px] text-white/30 font-mono">
                                                            ID: {vid.youtubeId}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveUpMain(idx)}
                                                        disabled={idx === 0}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                        title="Monter"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDownMain(idx)}
                                                        disabled={idx === playlist.length - 1}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                        title="Descendre"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteMain(vid.id)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 ml-1"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* Tab Content: PROMO VIDEOS */}
                        {activeTab === 'promo' && (
                            <>
                                {/* Add Promo Form */}
                                <form onSubmit={handleAddPromoVideo} className="mb-4 p-4 rounded-2xl bg-neon-purple/[0.06] border border-neon-purple/20 shrink-0 space-y-2.5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neon-purple flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Plus className="w-3.5 h-3.5" />
                                            Ajouter une vidéo promo (Pub, Teaser, Événement...)
                                        </span>
                                        <span className="text-[9px] text-white/40 normal-case italic">
                                            Jouée automatiquement entre chaque set
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                                        <div className="md:col-span-6 relative">
                                            <input
                                                type="text"
                                                placeholder="Lien YouTube promo (watch, shorts...)"
                                                value={newPromoUrl}
                                                onChange={(e) => handlePromoUrlChange(e.target.value)}
                                                className="w-full bg-black/60 border border-neon-purple/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-purple"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-4 relative flex items-center">
                                            <input
                                                type="text"
                                                placeholder="Titre de la promo"
                                                value={newPromoTitle}
                                                onChange={(e) => setNewPromoTitle(e.target.value)}
                                                className="w-full bg-black/60 border border-neon-purple/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-purple pr-8"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleManualFetchPromoTitle}
                                                disabled={isFetchingPromoTitle || !newPromoUrl}
                                                title="Récupérer le titre automatique"
                                                className="absolute right-2 text-white/40 hover:text-neon-purple disabled:opacity-30 transition-colors"
                                            >
                                                {isFetchingPromoTitle ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neon-purple" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            className="md:col-span-2 py-2.5 rounded-xl bg-neon-purple text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-neon-purple/90 transition-all active:scale-95 shadow-lg shadow-neon-purple/20"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Ajouter
                                        </button>
                                    </div>
                                </form>

                                {/* Promos List */}
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
                                    {promos.length === 0 ? (
                                        <div className="py-10 text-center text-white/30 text-xs italic bg-white/[0.01] rounded-2xl border border-dashed border-white/10 p-6">
                                            <Film className="w-8 h-8 text-neon-purple/40 mx-auto mb-2" />
                                            Aucune vidéo promo active.
                                            <br />
                                            Ajoutez une ou plusieurs promos ci-dessus pour qu'elles alternent automatiquement entre les sets !
                                        </div>
                                    ) : (
                                        promos.map((p, idx) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between gap-3 p-3 bg-neon-purple/[0.04] rounded-2xl border border-neon-purple/20 hover:border-neon-purple/30 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-7 h-7 rounded-xl bg-neon-purple/20 border border-neon-purple/30 text-neon-purple flex items-center justify-center text-xs font-black shrink-0">
                                                        P{idx + 1}
                                                    </span>
                                                    <img
                                                        src={`https://img.youtube.com/vi/${p.youtubeId}/mqdefault.jpg`}
                                                        alt={p.title}
                                                        className="w-16 h-10 object-cover rounded-lg bg-black border border-white/10 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate">
                                                            {p.title}
                                                        </h4>
                                                        <span className="text-[10px] text-white/30 font-mono">
                                                            ID: {p.youtubeId}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveUpPromo(idx)}
                                                        disabled={idx === 0}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                        title="Monter"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDownPromo(idx)}
                                                        disabled={idx === promos.length - 1}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20"
                                                        title="Descendre"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePromo(p.id)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 ml-1"
                                                        title="Supprimer la promo"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* Tab Content: LIVE TAKEOVER */}
                        {activeTab === 'live' && (
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                {/* Status Banner */}
                                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
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
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Statut actuel</div>
                                        <div className={`text-sm font-black uppercase tracking-wider ${
                                            takeoverState?.status === 'live' ? 'text-green-400' :
                                            takeoverState?.status === 'edit' ? 'text-orange-400' : 'text-white/40'
                                        }`}>
                                            {takeoverState?.status === 'live' ? '🔴 EN DIRECT – ON AIR' :
                                             takeoverState?.status === 'edit' ? '🟠 MODE ÉDITION' :
                                             '⚫ HORS LIGNE – OFF'}
                                        </div>
                                    </div>
                                    {/* Quick link */}
                                    <a
                                        href="/live"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Voir Live
                                    </a>
                                </div>

                                {/* ON AIR Controls */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5" />
                                        Contrôle diffusion
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('off')}
                                            disabled={isUpdatingTakeover}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 border ${
                                                takeoverState?.status === 'off' || !takeoverState?.enabled
                                                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                                            } disabled:opacity-60`}
                                        >
                                            <span className="text-base">⚫</span>
                                            OFF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('edit')}
                                            disabled={isUpdatingTakeover}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 border ${
                                                takeoverState?.status === 'edit'
                                                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                                            } disabled:opacity-60`}
                                        >
                                            <span className="text-base">🟠</span>
                                            ÉDIT
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateLiveStatus?.('live')}
                                            disabled={isUpdatingTakeover}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 border ${
                                                takeoverState?.status === 'live'
                                                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/30 animate-pulse'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                                            } disabled:opacity-60`}
                                        >
                                            <span className="text-base">🔴</span>
                                            ON AIR
                                        </button>
                                    </div>
                                    {isUpdatingTakeover && (
                                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Mise à jour en cours...
                                        </div>
                                    )}
                                </div>

                                {/* Config Fields */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                        <Radio className="w-3.5 h-3.5" />
                                        Paramètres du live
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Nom du festival / événement</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Tomorrowland 2025"
                                            value={takeoverState?.title || ''}
                                            onChange={(e) => onTakeoverChange?.({ ...takeoverState!, title: e.target.value })}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                        />
                                    </div>

                                    {/* YouTube ID */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Lien YouTube Live</label>
                                        <input
                                            type="text"
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={takeoverState?.youtubeId || ''}
                                            onChange={(e) => {
                                                const extracted = extractYouTubeId(e.target.value) || e.target.value;
                                                onTakeoverChange?.({ ...takeoverState!, youtubeId: extracted });
                                            }}
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red font-mono"
                                        />
                                        {takeoverState?.youtubeId && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <img
                                                    src={`https://img.youtube.com/vi/${takeoverState.youtubeId}/mqdefault.jpg`}
                                                    alt="preview"
                                                    className="w-20 h-12 object-cover rounded-lg border border-white/10"
                                                />
                                                <span className="text-[10px] text-white/40 font-mono">ID: {takeoverState.youtubeId}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Début
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
                                                <Calendar className="w-3 h-3" /> Fin
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

                                {/* Toggles */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Options d'affichage</div>

                                    {([
                                        { key: 'forceHomepage', icon: <Home className="w-3.5 h-3.5" />, label: 'Rediriger la homepage vers le live', color: 'neon-red' },
                                        { key: 'showInNavbar', icon: <Eye className="w-3.5 h-3.5" />, label: 'Afficher dans la navigation', color: 'neon-cyan' },
                                        { key: 'showInAgenda', icon: <Calendar className="w-3.5 h-3.5" />, label: 'Afficher dans l\'agenda', color: 'neon-purple' },
                                    ] as const).map(({ key, icon, label }) => (
                                        <div key={key} className="flex items-center justify-between gap-3">
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

                                {/* Save Live Settings Button */}
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setLiveSaving(true);
                                        try {
                                            await onSaveTakeover?.();
                                            setLiveSaved(true);
                                            setTimeout(() => setLiveSaved(false), 3000);
                                        } finally {
                                            setLiveSaving(false);
                                        }
                                    }}
                                    disabled={liveSaving || !onSaveTakeover}
                                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 active:scale-95"
                                >
                                    {liveSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : liveSaved ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {liveSaved ? 'Paramètres sauvegardés !' : 'Sauvegarder les paramètres live'}
                                </button>
                            </div>
                        )}

                        {/* Footer Controls */}
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Réinitialiser par défaut
                            </button>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {saveSuccess && (
                                    <div className="flex items-center gap-1.5 text-xs text-neon-green font-bold animate-fade-in">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {saveMessage || 'Enregistré !'}
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold max-w-xs truncate" title={error}>
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-neon-red/20 disabled:opacity-50 active:scale-95"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Enregistrer la programmation
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
