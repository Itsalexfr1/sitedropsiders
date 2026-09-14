import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tv, Plus, Trash2, ChevronUp, ChevronDown, Save, ExternalLink, RotateCcw, CheckCircle2, Loader2, AlertCircle, Film, ChevronRight, Sparkles, Copy } from 'lucide-react';
import { apiFetch, getAuthHeaders } from '../../../utils/auth';
import type { TVVideo, PromoVideo } from '../../../pages/DropsidersTVPage';
import { getVideoPromos } from '../../../pages/DropsidersTVPage';

export type { TVVideo, PromoVideo };

const DEFAULT_PLAYLIST: TVVideo[] = [
    {
        id: '1',
        title: 'Tomorrowland 2024 – Best of Mainstage Sets',
        description: 'Les sets légendaires et les moments les plus intenses de Tomorrowland',
        youtubeId: 'H5QLyGiDr_0',
        promos: []
    },
    {
        id: '2',
        title: 'Martin Garrix Live @ Amsterdam Music Festival',
        description: 'Set exclusif de Martin Garrix avec tous ses hymnes',
        youtubeId: 'iyIBWoFr7DY',
        promos: []
    },
    {
        id: '3',
        title: 'Ultra Music Festival Miami 2024 – Main Stage Highlights',
        description: 'L\'énergie brute d\'Ultra Miami en haute définition',
        youtubeId: 'tBQsniJdWi8',
        promos: []
    },
    {
        id: '4',
        title: 'EDC Las Vegas 2024 – Kineticfield Stage Recap',
        description: 'Le plus grand spectacle sous le ciel électrique de Las Vegas',
        youtubeId: 'y4fR1VbCqhI',
        promos: []
    },
    {
        id: '5',
        title: 'HARD Summer 2024 – Official Highlights',
        description: 'Basses lourdes et ambiance estivale sur la scène de HARD Summer',
        youtubeId: 'rFQJDcNzXw0',
        promos: []
    }
];

/**
 * Ultra-tolerant YouTube ID extractor supporting:
 * - standard watch URLs (?v=...)
 * - youtu.be shortlinks
 * - shorts (/shorts/...)
 * - live streams (/live/...)
 * - embed URLs (/embed/...)
 * - tracking tags (?si=..., &feature=..., etc.)
 * - raw 11-char IDs
 */
export function extractYouTubeId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    // Raw 11-character alphanumeric ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

        // youtu.be/ID
        if (urlObj.hostname.includes('youtu.be')) {
            const cleanPath = urlObj.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
            if (/^[a-zA-Z0-9_-]{11}$/.test(cleanPath)) return cleanPath;
        }

        // ?v=ID
        const vParam = urlObj.searchParams.get('v');
        if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

        // /embed/ID, /shorts/ID, /live/ID, /v/ID
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        const prefixIndex = pathSegments.findIndex(p => ['embed', 'shorts', 'live', 'v'].includes(p.toLowerCase()));
        if (prefixIndex !== -1 && pathSegments[prefixIndex + 1]) {
            const id = pathSegments[prefixIndex + 1].split('?')[0];
            if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        }
    } catch {
        // Fallback to regex
    }

    // Comprehensive regex fallback
    const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/|\/live\/|watch\?v=|\&v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

/**
 * Automatically fetch the official YouTube title using noembed (CORS enabled for browsers)
 * with youtube.com/oembed fallback
 */
export async function fetchYouTubeTitle(urlOrId: string): Promise<string | null> {
    const ytid = extractYouTubeId(urlOrId);
    if (!ytid) return null;

    // 1. noembed.com (CORS friendly)
    try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytid}`);
        if (res.ok) {
            const data = await res.json();
            if (data?.title) return data.title;
        }
    } catch {
        // continue to fallback
    }

    // 2. youtube oembed
    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytid}&format=json`);
        if (res.ok) {
            const data = await res.json();
            if (data?.title) return data.title;
        }
    } catch {
        // no title found
    }

    return null;
}

interface AdminTVModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminTVModal({ isOpen, onClose }: AdminTVModalProps) {
    const [playlist, setPlaylist] = useState<TVVideo[]>(DEFAULT_PLAYLIST);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Add Video Form state
    const [newUrl, setNewUrl] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isFetchingMainTitle, setIsFetchingMainTitle] = useState(false);

    // Promos to attach to the new video being created
    const [newVideoPromos, setNewVideoPromos] = useState<PromoVideo[]>([]);
    const [tempPromoUrl, setTempPromoUrl] = useState('');
    const [tempPromoTitle, setTempPromoTitle] = useState('');
    const [isFetchingPromoTitle, setIsFetchingPromoTitle] = useState(false);

    // Expanded inline promo panel per video id
    const [expandedPromoVidId, setExpandedPromoVidId] = useState<string | null>(null);
    // Add promo input per video in playlist
    const [inlinePromoUrl, setInlinePromoUrl] = useState<Record<string, string>>({});
    const [inlinePromoTitle, setInlinePromoTitle] = useState<Record<string, string>>({});
    const [isFetchingInlineTitle, setIsFetchingInlineTitle] = useState<Record<string, boolean>>({});

    // Load settings on modal open
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
                        // Normalize legacy promos
                        const normalized = data.tv_playlist.map((v: TVVideo) => ({
                            ...v,
                            promos: getVideoPromos(v)
                        }));
                        setPlaylist(normalized);
                    } else {
                        setPlaylist(DEFAULT_PLAYLIST);
                    }
                }
            } catch (e: any) {
                console.error("Erreur chargement playlist TV:", e);
                // Try localStorage fallback
                try {
                    const local = localStorage.getItem('dropsiders_tv_playlist_v2');
                    if (local) {
                        const parsed = JSON.parse(local);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setPlaylist(parsed);
                        }
                    }
                } catch {}
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [isOpen]);

    // Auto-fetch title when main URL changes
    const handleUrlBlurOrChange = async (val: string) => {
        setNewUrl(val);
        const ytid = extractYouTubeId(val);
        if (ytid && !newTitle.trim()) {
            setIsFetchingMainTitle(true);
            const fetched = await fetchYouTubeTitle(ytid);
            setIsFetchingMainTitle(false);
            if (fetched) {
                setNewTitle(fetched);
            }
        }
    };

    const handleManualFetchMainTitle = async () => {
        const ytid = extractYouTubeId(newUrl);
        if (!ytid) {
            alert('Entrez d\'abord un lien YouTube valide.');
            return;
        }
        setIsFetchingMainTitle(true);
        const fetched = await fetchYouTubeTitle(ytid);
        setIsFetchingMainTitle(false);
        if (fetched) {
            setNewTitle(fetched);
        } else {
            alert('Impossible de récupérer le titre automatiquement. Vous pouvez le saisir manuellement.');
        }
    };

    // Auto-fetch title for temp promo when creating a new video
    const handleTempPromoUrlChange = async (val: string) => {
        setTempPromoUrl(val);
        const ytid = extractYouTubeId(val);
        if (ytid && !tempPromoTitle.trim()) {
            setIsFetchingPromoTitle(true);
            const fetched = await fetchYouTubeTitle(ytid);
            setIsFetchingPromoTitle(false);
            if (fetched) {
                setTempPromoTitle(fetched);
            }
        }
    };

    const handleAddPromoToNewVideo = () => {
        const ytid = extractYouTubeId(tempPromoUrl);
        if (!ytid) {
            alert('Lien YouTube promo invalide.');
            return;
        }
        const newP: PromoVideo = {
            id: `promo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            youtubeId: ytid,
            title: tempPromoTitle.trim() || 'Vidéo Promo'
        };
        setNewVideoPromos(prev => [...prev, newP]);
        setTempPromoUrl('');
        setTempPromoTitle('');
    };

    const handleRemovePromoFromNewVideo = (promoId: string) => {
        setNewVideoPromos(prev => prev.filter(p => p.id !== promoId));
    };

    // Add main video to playlist
    const handleAddVideo = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const ytid = extractYouTubeId(newUrl);
        if (!ytid) {
            alert('Lien YouTube invalide. Exemples : https://youtube.com/watch?v=... ou https://youtu.be/...');
            return false;
        }

        const newVid: TVVideo = {
            id: `tv_${Date.now()}`,
            title: newTitle.trim() || `Vidéo ${playlist.length + 1}`,
            description: newDesc.trim() || 'Diffusé sur DropsidersTV',
            youtubeId: ytid,
            promos: newVideoPromos
        };

        setPlaylist(prev => [...prev, newVid]);
        setNewUrl('');
        setNewTitle('');
        setNewDesc('');
        setNewVideoPromos([]);
        setTempPromoUrl('');
        setTempPromoTitle('');
        return true;
    };

    const handleDelete = (id: string) => {
        if (playlist.length <= 1) {
            alert('Il doit rester au moins une vidéo dans la programmation.');
            return;
        }
        setPlaylist(prev => prev.filter(v => v.id !== id));
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        setPlaylist(prev => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleMoveDown = (index: number) => {
        if (index >= playlist.length - 1) return;
        setPlaylist(prev => {
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            return next;
        });
    };

    const handleReset = () => {
        if (confirm('Restaurer la liste par défaut des sets de festivals ?')) {
            setPlaylist(DEFAULT_PLAYLIST);
        }
    };

    // Inline promo management per video in playlist
    const handleTogglePromoPanel = (vidId: string) => {
        setExpandedPromoVidId(prev => (prev === vidId ? null : vidId));
    };

    const handleInlinePromoUrlChange = async (vidId: string, val: string) => {
        setInlinePromoUrl(prev => ({ ...prev, [vidId]: val }));
        const ytid = extractYouTubeId(val);
        if (ytid && !inlinePromoTitle[vidId]?.trim()) {
            setIsFetchingInlineTitle(prev => ({ ...prev, [vidId]: true }));
            const fetched = await fetchYouTubeTitle(ytid);
            setIsFetchingInlineTitle(prev => ({ ...prev, [vidId]: false }));
            if (fetched) {
                setInlinePromoTitle(prev => ({ ...prev, [vidId]: fetched }));
            }
        }
    };

    const handleAddInlinePromo = (vidId: string) => {
        const url = inlinePromoUrl[vidId] || '';
        const title = inlinePromoTitle[vidId] || '';
        const ytid = extractYouTubeId(url);
        if (!ytid) {
            alert('Lien YouTube promo invalide.');
            return;
        }

        const newPromo: PromoVideo = {
            id: `promo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            youtubeId: ytid,
            title: title.trim() || 'Vidéo Promo'
        };

        setPlaylist(prev => prev.map(v => {
            if (v.id !== vidId) return v;
            const currentPromos = getVideoPromos(v);
            return {
                ...v,
                promos: [...currentPromos, newPromo],
                promoId: undefined,
                promoTitle: undefined
            };
        }));

        setInlinePromoUrl(prev => ({ ...prev, [vidId]: '' }));
        setInlinePromoTitle(prev => ({ ...prev, [vidId]: '' }));
    };

    const handleDeleteInlinePromo = (vidId: string, promoId: string) => {
        setPlaylist(prev => prev.map(v => {
            if (v.id !== vidId) return v;
            const currentPromos = getVideoPromos(v);
            return {
                ...v,
                promos: currentPromos.filter(p => p.id !== promoId),
                promoId: undefined,
                promoTitle: undefined
            };
        }));
    };

    const handleApplyPromosToAll = (sourceVidId: string) => {
        const sourceVid = playlist.find(v => v.id === sourceVidId);
        const sourcePromos = getVideoPromos(sourceVid);
        if (sourcePromos.length === 0) {
            alert('Cette vidéo n\'a aucune promo à copier.');
            return;
        }

        if (confirm(`Voulez-vous copier ces ${sourcePromos.length} promo(s) sur TOUTES les vidéos de la programmation ?`)) {
            setPlaylist(prev => prev.map(v => ({
                ...v,
                promos: sourcePromos.map((p, i) => ({
                    ...p,
                    id: `promo_${v.id}_${i}_${Date.now()}`
                })),
                promoId: undefined,
                promoTitle: undefined
            })));
            alert(`Séquence promo appliquée à toutes les ${playlist.length} vidéos !`);
        }
    };

    // Save logic
    const handleSave = async () => {
        // If user typed a URL in the form without clicking "Ajouter", auto-add it!
        let currentList = [...playlist];
        if (newUrl.trim()) {
            const ytid = extractYouTubeId(newUrl);
            if (ytid) {
                const autoVid: TVVideo = {
                    id: `tv_${Date.now()}`,
                    title: newTitle.trim() || `Vidéo ${currentList.length + 1}`,
                    description: newDesc.trim() || 'Diffusé sur DropsidersTV',
                    youtubeId: ytid,
                    promos: newVideoPromos
                };
                currentList.push(autoVid);
                setPlaylist(currentList);
                setNewUrl('');
                setNewTitle('');
                setNewDesc('');
                setNewVideoPromos([]);
            }
        }

        setSaving(true);
        setError(null);
        setSaveMessage(null);

        // Normalize promos on all items before saving
        const finalPlaylist = currentList.map(v => ({
            ...v,
            promos: getVideoPromos(v)
        }));

        // 1. Immediately save to LocalStorage so /tv works immediately even offline/locally
        try {
            localStorage.setItem('dropsiders_tv_playlist_v2', JSON.stringify(finalPlaylist));
        } catch (e) {
            console.warn("LocalStorage save warning:", e);
        }

        // 2. Fetch current settings from backend first, then merge and save
        try {
            const settingsRes = await apiFetch('/api/settings');
            const currentSettings = settingsRes.ok ? await settingsRes.json() : {};

            const newSettings = {
                ...currentSettings,
                tv_playlist: finalPlaylist
            };

            const res = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (res.ok) {
                setSaveSuccess(true);
                setSaveMessage('Enregistré avec succès sur le serveur !');
                setTimeout(() => {
                    setSaveSuccess(false);
                    setSaveMessage(null);
                }, 3500);
            } else {
                const errData = await res.json().catch(() => ({}));
                const msg = errData?.error || `Erreur ${res.status}`;
                setError(`Enregistré localement mais échec serveur : ${msg}`);
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
                                            Programmation · Chaîne en continu & Promos
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

                        {/* Visual Workflow Hint */}
                        <div className="mb-3 shrink-0 flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-wider px-1 overflow-x-auto">
                            <span className="flex items-center gap-1 text-neon-red">
                                <span className="w-2 h-2 rounded-full bg-neon-red" />
                                Vidéo A
                            </span>
                            <ChevronRight className="w-3 h-3 text-white/20" />
                            <span className="flex items-center gap-1 text-neon-purple">
                                <Film className="w-3 h-3 text-neon-purple" />
                                Promo(s)
                            </span>
                            <ChevronRight className="w-3 h-3 text-white/20" />
                            <span className="flex items-center gap-1 text-neon-red">
                                <span className="w-2 h-2 rounded-full bg-neon-red" />
                                Vidéo B
                            </span>
                            <ChevronRight className="w-3 h-3 text-white/20" />
                            <span className="text-white/30">...</span>
                        </div>

                        {/* Add Video Form */}
                        <form onSubmit={(e) => { e.preventDefault(); handleAddVideo(); }} className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 shrink-0 space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-neon-red flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" />
                                Ajouter un set ou une vidéo principale
                            </div>

                            {/* Main Video Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                                <div className="md:col-span-6 relative">
                                    <input
                                        type="text"
                                        placeholder="Lien YouTube (watch, youtu.be, shorts, live...)"
                                        value={newUrl}
                                        onChange={(e) => handleUrlBlurOrChange(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-4 relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Titre de la vidéo"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-neon-red pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleManualFetchMainTitle}
                                        disabled={isFetchingMainTitle || !newUrl}
                                        title="Récupérer automatiquement le titre depuis YouTube"
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
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
                            />

                            {/* Promos to attach to this video */}
                            <div className="border-t border-white/5 pt-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-neon-purple flex items-center gap-1.5">
                                        <Film className="w-3 h-3" />
                                        Vidéos Promo après cette vidéo ({newVideoPromos.length})
                                    </div>
                                    <span className="text-[9px] text-white/40 italic">
                                        Optionnel · Jouées à la fin de cette vidéo
                                    </span>
                                </div>

                                {/* List of promos already queued for this new video */}
                                {newVideoPromos.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {newVideoPromos.map((p, idx) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center gap-2 bg-neon-purple/10 border border-neon-purple/30 rounded-xl px-2.5 py-1 text-[11px] text-white"
                                            >
                                                <span className="font-bold text-neon-purple text-[10px]">#{idx + 1}</span>
                                                <span className="max-w-[150px] truncate">{p.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePromoFromNewVideo(p.id)}
                                                    className="text-white/40 hover:text-red-400 ml-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Mini form to add promo to new video */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Lien YouTube promo (watch, shorts...)"
                                        value={tempPromoUrl}
                                        onChange={(e) => handleTempPromoUrlChange(e.target.value)}
                                        className="md:col-span-5 bg-black/40 border border-neon-purple/20 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon-purple/50"
                                    />
                                    <div className="md:col-span-5 relative flex items-center">
                                        <input
                                            type="text"
                                            placeholder="Titre de la promo (auto-rempli)"
                                            value={tempPromoTitle}
                                            onChange={(e) => setTempPromoTitle(e.target.value)}
                                            className="w-full bg-black/40 border border-neon-purple/20 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon-purple/50 pr-7"
                                        />
                                        {isFetchingPromoTitle && (
                                            <Loader2 className="w-3 h-3 animate-spin text-neon-purple absolute right-2" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddPromoToNewVideo}
                                        disabled={!tempPromoUrl.trim()}
                                        className="md:col-span-2 py-1.5 rounded-xl bg-neon-purple/20 hover:bg-neon-purple/40 border border-neon-purple/30 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 disabled:opacity-40 transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                        + Promo
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* List of videos */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 px-1">
                                <span>Ordre de passage ({playlist.length} vidéos principales)</span>
                                <span>Actions</span>
                            </div>

                            {loading ? (
                                <div className="py-14 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 text-neon-red animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                        Chargement de la programmation...
                                    </span>
                                </div>
                            ) : playlist.length === 0 ? (
                                <div className="py-12 text-center text-white/30 text-xs font-bold">
                                    Aucune vidéo dans la programmation.
                                </div>
                            ) : (
                                playlist.map((vid, idx) => {
                                    const videoPromos = getVideoPromos(vid);
                                    const isExpanded = expandedPromoVidId === vid.id;

                                    return (
                                        <div key={vid.id} className="rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all bg-white/[0.02]">
                                            {/* Video Row */}
                                            <div className="flex items-center justify-between gap-3 p-3 bg-white/5 group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Index badge */}
                                                    <span className="w-7 h-7 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xs font-black text-white/70 shrink-0">
                                                        {idx + 1}
                                                    </span>

                                                    {/* Thumbnail */}
                                                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-black/80 shrink-0 relative border border-white/10">
                                                        <img
                                                            src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`}
                                                            alt={vid.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Titles & Promos badge */}
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate group-hover:text-neon-red transition-colors">
                                                            {vid.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-white/30 font-mono">
                                                                ID: {vid.youtubeId}
                                                            </span>
                                                            {videoPromos.length > 0 && (
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-neon-purple px-1.5 py-0.2 rounded bg-neon-purple/15 border border-neon-purple/30 flex items-center gap-1">
                                                                    <Film className="w-2.5 h-2.5" />
                                                                    {videoPromos.length} promo{videoPromos.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {/* Toggle Promos button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePromoPanel(vid.id)}
                                                        title="Gérer les vidéos promo liées à cette vidéo"
                                                        className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                                                            videoPromos.length > 0
                                                                ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/40 hover:bg-neon-purple/30'
                                                                : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <Film className="w-3 h-3" />
                                                        Promos ({videoPromos.length})
                                                    </button>

                                                    {/* Move Up */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveUp(idx)}
                                                        disabled={idx === 0}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 transition-all"
                                                        title="Monter"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Move Down */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDown(idx)}
                                                        disabled={idx === playlist.length - 1}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 transition-all"
                                                        title="Descendre"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(vid.id)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all ml-1"
                                                        title="Supprimer de la programmation"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expandable Promos Inline Panel */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="border-t border-neon-purple/20 bg-neon-purple/[0.04] p-3 md:p-4 space-y-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-neon-purple flex items-center gap-1.5">
                                                                <Film className="w-3.5 h-3.5" />
                                                                Vidéos Promo diffusées après « {vid.title} »
                                                            </div>
                                                            {videoPromos.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApplyPromosToAll(vid.id)}
                                                                    title="Appliquer cette même séquence de promo(s) à toutes les vidéos de la TV"
                                                                    className="px-2 py-1 rounded-lg bg-neon-purple/15 hover:bg-neon-purple/30 border border-neon-purple/30 text-neon-purple text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                                                                >
                                                                    <Copy className="w-2.5 h-2.5" />
                                                                    Appliquer à toute la TV
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Existing promos list for this video */}
                                                        {videoPromos.length === 0 ? (
                                                            <div className="text-[11px] text-white/40 italic py-1">
                                                                Aucune promo associée. Le lecteur passera directement au set suivant.
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                {videoPromos.map((promo, pIdx) => (
                                                                    <div
                                                                        key={promo.id}
                                                                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-neon-purple/20"
                                                                    >
                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                            <span className="text-[10px] font-bold text-neon-purple w-4">
                                                                                #{pIdx + 1}
                                                                            </span>
                                                                            <img
                                                                                src={`https://img.youtube.com/vi/${promo.youtubeId}/mqdefault.jpg`}
                                                                                alt={promo.title}
                                                                                className="w-10 h-6 object-cover rounded bg-black border border-white/10 shrink-0"
                                                                            />
                                                                            <div className="min-w-0">
                                                                                <div className="text-[11px] font-bold text-white truncate">
                                                                                    {promo.title}
                                                                                </div>
                                                                                <div className="text-[9px] text-white/30 font-mono">
                                                                                    ID: {promo.youtubeId}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteInlinePromo(vid.id, promo.id)}
                                                                            className="p-1 text-white/30 hover:text-red-400 transition-colors"
                                                                            title="Supprimer cette promo"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Add another promo to this video */}
                                                        <div className="pt-2 border-t border-white/5 space-y-2">
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                                                + Ajouter une vidéo promo à cet enchaînement
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Lien YouTube promo..."
                                                                    value={inlinePromoUrl[vid.id] || ''}
                                                                    onChange={(e) => handleInlinePromoUrlChange(vid.id, e.target.value)}
                                                                    className="md:col-span-5 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon-purple"
                                                                />
                                                                <div className="md:col-span-5 relative flex items-center">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Titre de la promo"
                                                                        value={inlinePromoTitle[vid.id] || ''}
                                                                        onChange={(e) => setInlinePromoTitle(prev => ({ ...prev, [vid.id]: e.target.value }))}
                                                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-neon-purple pr-7"
                                                                    />
                                                                    {isFetchingInlineTitle[vid.id] && (
                                                                        <Loader2 className="w-3 h-3 animate-spin text-neon-purple absolute right-2" />
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddInlinePromo(vid.id)}
                                                                    disabled={!inlinePromoUrl[vid.id]?.trim()}
                                                                    className="md:col-span-2 py-1.5 rounded-xl bg-neon-purple text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-neon-purple/90 disabled:opacity-40 transition-all"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Ajouter
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Réinitialiser les sets
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
