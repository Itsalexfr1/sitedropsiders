import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Radio,
    Plus,
    Trash2,
    Pencil,
    Music2,
    Search,
    Check,
    Save,
    Loader2,
    Calendar,
    Tv,
    Clock,
    Play,
    Pause,
    Volume2,
    Folder,
    FolderOpen,
    FileAudio,
    Sparkles,
    ChevronRight,
    ChevronDown,
    Sliders,
    Layers,
    ListMusic,
    Upload,
    Maximize2,
    Minimize2,
    ChevronUp
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';
import { YouTubeSearchModal } from './YouTubeSearchModal';
import { apiFetch, getAuthHeaders } from '../../../utils/auth';
import defaultSettings from '../../../data/settings.json';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { DuplicateAuditModal, detectRadioDuplicates, type DuplicateEntry } from '../../ui/DuplicateAuditModal';
import {
    STORAGE_RADIO_BLOCKS_KEY,
    STORAGE_RADIO_TOP_HORAIRE_KEY,
    DEFAULT_TOP_HORAIRE,
    getTopHoraireConfig,
    DAYS_OF_WEEK,
    ALL_DAYS,
    formatRadioTimeSlot,
    formatDurationExact,
    isRadioBlockActiveNow,
    sortRadioBlocksByBroadcastOrder,
    getActiveRadioBlock,
    getRadioCategoryMeta,
    type RadioScheduleBlock,
    type RadioTrackItem,
    type RadioSpecialJingle,
    type RadioThemeJingle,
    type RadioTopHoraireConfig,
    type RadioTrackCategory
} from '../../../utils/radioSchedule';
import { parseArtistAndEvent } from '../../../utils/tvSchedule';
import { RadioJingleUploadModal } from '../radio/RadioJingleUploadModal';
import { DEFAULT_JINGLES_PUBS, type RadionomyItem } from './RadionomyJinglesBox';

const PRESET_EMOJIS = ['🎧', '🔥', '⚡', '🚀', '🎵', '🕺', '📻', '💎', '🎉', '🌙', '☀️', '⭐', '🌅', '🎪'];
const PRESET_COLORS = [
    { name: 'Cyan', hex: '#00f0ff' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Ambre', hex: '#f59e0b' },
    { name: 'Émeraude', hex: '#10b981' },
    { name: 'Rouge Néon', hex: '#ff1241' },
    { name: 'Rose', hex: '#ec4899' },
    { name: 'Bleu', hex: '#3b82f6' },
    { name: 'Orange', hex: '#f97316' },
];

interface AdminRadioModalProps {
    isOpen: boolean;
    onClose: () => void;
    isRadioActive: boolean;
    onToggleRadio: () => void;
}

export interface TVVideoItem {
    id: string;
    title: string;
    youtubeId: string;
    duration?: number;
    category?: 'liveset' | 'clip';
    blockTitle?: string;
    blockColor?: string;
    blockEmoji?: string;
}

export interface TVBlock {
    id: string;
    title: string;
    color?: string;
    emoji?: string;
    timeSlot?: string;
    videos: TVVideoItem[];
}

function getInitialTVBlocks(): TVBlock[] {
    const raw = (defaultSettings as any)?.tv_blocks;
    if (Array.isArray(raw)) {
        return raw.map((b: any) => ({
            id: b.id,
            title: b.title || b.name || 'Bloc TV',
            color: b.color || '#00f0ff',
            emoji: b.emoji || '📺',
            timeSlot: b.timeSlot || '',
            videos: (b.videos || []).map((v: any) => ({
                id: v.id || v.youtubeId,
                title: v.title,
                youtubeId: v.youtubeId,
                duration: v.duration || 3600,
                category: v.category || ((v.duration || 3600) < 1200 ? 'clip' : 'liveset'),
                blockTitle: b.title || b.name || 'Bloc TV',
                blockColor: b.color || '#00f0ff',
                blockEmoji: b.emoji || '📺'
            }))
        }));
    }
    return [];
}

export function AdminRadioModal({
    isOpen,
    onClose,
    isRadioActive,
    onToggleRadio
}: AdminRadioModalProps) {
    // ─── Émissions radio ───────────────────────────────────────────────────────
    const [blocks, setBlocks] = useState<RadioScheduleBlock[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

    // ─── Sélection dans l'arborescence (TreeView façon RadioManager) ───────────
    // 'emission:<id>' | 'tv_lib' | 'general_jingles' | 'block_jingles:<id>'
    const [activeFolder, setActiveFolder] = useState<string>('emission:first');
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        emissions: true,
        jingles: true,
        music: true
    });

    // ─── Jingles Généraux ──────────────────────────────────────────────────────
    const [generalJingles, setGeneralJingles] = useState<RadionomyItem[]>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_radionomy_palette');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_JINGLES_PUBS;
    });

    // ─── Bibliothèque TV (240 vidéos) ──────────────────────────────────────────
    const [tvBlocks, setTvBlocks] = useState<TVBlock[]>(getInitialTVBlocks);
    const [searchFilter, setSearchFilter] = useState('');

    // ─── Modale d'Upload Jingle avec MENU DÉROULANT ───────────────────────────
    const [isUploadJingleModalOpen, setIsUploadJingleModalOpen] = useState(false);

    // ─── Formulaire rapide d'ajout de morceau ─────────────────────────────────
    const [showAddTrackBox, setShowAddTrackBox] = useState(false);
    const [newTrackUrl, setNewTrackUrl] = useState('');
    const [newTrackTitle, setNewTrackTitle] = useState('');
    const [newTrackArtist, setNewTrackArtist] = useState('');
    const [newTrackCategory, setNewTrackCategory] = useState<RadioTrackCategory>('liveset');
    const [newTrackDuration, setNewTrackDuration] = useState('60');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // ─── Lecteur audio intégré en bas (Player permanent RadioManager) ──────────
    const [currentAudio, setCurrentAudio] = useState<{ id: string; title: string; url: string; artist?: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioVolume, setAudioVolume] = useState(0.85);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // ─── Toasts & États UI ────────────────────────────────────────────────────
    const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'warn' | 'info' } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Formulaire d'édition d'une émission
    const [isEditingBlock, setIsEditingBlock] = useState(false);
    const [editBlockForm, setEditBlockForm] = useState({
        title: '',
        emoji: '🎧',
        color: PRESET_COLORS[0].hex,
        startHour: 0,
        endHour: 4,
        days: ALL_DAYS,
        randomize: true
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'danger' | 'warning' | 'info';
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        onConfirm: () => {},
    });

    const [radioDuplicates, setRadioDuplicates] = useState<DuplicateEntry[]>([]);
    const [showDuplicateAudit, setShowDuplicateAudit] = useState(false);

    // Édition d'un morceau
    const [editingTrack, setEditingTrack] = useState<{
        trackId: string;
        artist: string;
        title: string;
        category: 'liveset' | 'clip' | 'jingle';
        durationMinutes: number;
        youtubeId: string;
    } | null>(null);

    const [topHoraireConfig, setTopHoraireConfig] = useState<RadioTopHoraireConfig>(getTopHoraireConfig);

    const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ─── Audio Player Permanent ────────────────────────────────────────────────
    const handlePlayAudio = (id: string, url: string, title: string, artist?: string) => {
        if (currentAudio?.id === id && isPlaying) {
            audioPlayerRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
        }

        const a = new Audio(url);
        a.volume = audioVolume;
        a.onloadedmetadata = () => {
            setAudioDuration(a.duration || 0);
        };
        a.ontimeupdate = () => {
            setAudioProgress(a.currentTime || 0);
        };
        a.onended = () => {
            setIsPlaying(false);
            setAudioProgress(0);
        };
        a.onerror = () => {
            setIsPlaying(false);
            showToast('Impossible de lire ce flux audio', 'warn');
        };

        a.play().then(() => {
            setIsPlaying(true);
        }).catch(() => {
            setIsPlaying(false);
        });

        audioPlayerRef.current = a;
        setCurrentAudio({ id, title, url, artist });
    };

    const handleTogglePlayPause = () => {
        if (!audioPlayerRef.current || !currentAudio) return;
        if (isPlaying) {
            audioPlayerRef.current.pause();
            setIsPlaying(false);
        } else {
            audioPlayerRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    };

    // Nettoyage audio à la fermeture
    useEffect(() => {
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }
        };
    }, []);

    // ─── Chargement des réglages ──────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/settings', {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.radio_top_horaire && typeof data.radio_top_horaire.enabled === 'boolean') {
                        setTopHoraireConfig(data.radio_top_horaire);
                        localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(data.radio_top_horaire));
                    }
                    if (Array.isArray(data?.radio_blocks) && data.radio_blocks.length > 0) {
                        const sorted = sortRadioBlocksByBroadcastOrder(data.radio_blocks, true);
                        setBlocks(sorted);
                        if (!selectedBlockId && sorted.length > 0) {
                            setSelectedBlockId(sorted[0].id);
                            setActiveFolder(`emission:${sorted[0].id}`);
                        }
                    } else {
                        try {
                            const saved = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
                            if (saved) {
                                const parsed = JSON.parse(saved);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    const sorted = sortRadioBlocksByBroadcastOrder(parsed, true);
                                    setBlocks(sorted);
                                    if (!selectedBlockId && sorted.length > 0) {
                                        setSelectedBlockId(sorted[0].id);
                                        setActiveFolder(`emission:${sorted[0].id}`);
                                    }
                                }
                            }
                        } catch {}
                    }
                }
            } catch (e) {
                console.error('Erreur chargement radio:', e);
            }
        };
        fetchSettings();
    }, [isOpen]);

    // Bloc sélectionné actuel
    const selectedBlock = useMemo(() => {
        if (activeFolder.startsWith('emission:')) {
            const bId = activeFolder.replace('emission:', '');
            return blocks.find(b => b.id === bId) || blocks[0] || null;
        }
        if (activeFolder.startsWith('block_jingles:')) {
            const bId = activeFolder.replace('block_jingles:', '');
            return blocks.find(b => b.id === bId) || null;
        }
        return selectedBlockId ? blocks.find(b => b.id === selectedBlockId) || null : null;
    }, [blocks, activeFolder, selectedBlockId]);

    // Total vidéos TV
    const allTVVideos = useMemo(() => {
        const list: TVVideoItem[] = [];
        tvBlocks.forEach(b => {
            b.videos.forEach(v => list.push({
                ...v,
                blockTitle: b.title,
                blockColor: b.color,
                blockEmoji: b.emoji
            }));
        });
        return list;
    }, [tvBlocks]);

    // ─── Enregistrement d'un jingle uploadé ────────────────────────────────────
    const handleSaveJingleForBlock = (blockId: string, jingle: RadioSpecialJingle, insertInTracks: boolean) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const existingSpecial = b.specialJingles || [];
            const updatedSpecial = [...existingSpecial, jingle];

            let updatedTracks = [...(b.tracks || [])];
            if (insertInTracks) {
                const trackJingle: RadioTrackItem = {
                    id: `track_jingle_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                    title: jingle.title,
                    artist: `${b.title} JINGLE`,
                    audioUrl: jingle.audioUrl,
                    youtubeId: jingle.youtubeId,
                    duration: jingle.duration,
                    category: 'jingle'
                };
                updatedTracks.push(trackJingle);
            }

            return {
                ...b,
                specialJingles: updatedSpecial,
                tracks: updatedTracks
            };
        }));
    };

    const handleSaveGeneralJingle = (item: RadionomyItem) => {
        setGeneralJingles(prev => {
            const updated = [item, ...prev.filter(i => i.id !== item.id)];
            try {
                localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(updated));
            } catch {}
            return updated;
        });
    };

    // ─── Ajout rapide de morceau dans l'émission active ───────────────────────
    const handleAddTrackToCurrentEmission = () => {
        if (!selectedBlock) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        if (!newTrackTitle.trim()) {
            showToast('Veuillez saisir un titre', 'warn');
            return;
        }

        const ytId = extractYouTubeId(newTrackUrl);
        const durSec = Math.max(10, (parseInt(newTrackDuration, 10) || 60) * 60);

        const newTrack: RadioTrackItem = {
            id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: newTrackTitle.trim(),
            artist: newTrackArtist.trim() || undefined,
            youtubeId: ytId || undefined,
            audioUrl: newTrackUrl.startsWith('http') && !ytId ? newTrackUrl.trim() : undefined,
            duration: durSec,
            category: newTrackCategory
        };

        setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? {
            ...b,
            tracks: [...(b.tracks || []), newTrack]
        } : b));

        setNewTrackUrl('');
        setNewTrackTitle('');
        setNewTrackArtist('');
        setNewTrackDuration('60');
        setShowAddTrackBox(false);
        showToast(`✓ « ${newTrack.title} » ajouté à l'émission !`);
    };

    // Monter / Descendre dans la liste
    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        if (!selectedBlock) return;
        const currentTracks = [...(selectedBlock.tracks || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentTracks.length) return;

        const temp = currentTracks[index];
        currentTracks[index] = currentTracks[targetIndex];
        currentTracks[targetIndex] = temp;

        setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? {
            ...b,
            tracks: currentTracks
        } : b));
    };

    // Supprimer un morceau ou un jingle de la liste
    const handleDeleteTrack = (index: number) => {
        if (!selectedBlock) return;
        const currentTracks = [...(selectedBlock.tracks || [])];
        const removed = currentTracks.splice(index, 1);
        setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? {
            ...b,
            tracks: currentTracks
        } : b));
        if (removed[0]) {
            showToast(`« ${removed[0].title} » retiré de la liste`);
        }
    };

    // Sauvegarde globale
    const handleSaveAll = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(blocks));
            localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(topHoraireConfig));
            const flatTracks = blocks.flatMap(b => b.tracks || []);
            const res = await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    radio_blocks: blocks,
                    radio_tracks: flatTracks,
                    radio_top_horaire: topHoraireConfig,
                    tv_blocks: tvBlocks
                }),
            });
            if (res.ok) {
                setSaveSuccess(true);
                showToast('✓ Grille radio et jingles sauvegardés avec succès !', 'success');
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (e) {
            console.error(e);
            showToast('Erreur sauvegarde', 'warn');
        } finally {
            setIsSaving(false);
        }
    };

    interface TableItem {
        id: string;
        index?: number;
        type: RadioTrackCategory | 'clip' | 'set' | 'jingle';
        title: string;
        artist: string;
        duration: number;
        box: string;
        audioUrl?: string;
        youtubeId?: string;
        isSpecialJingle?: boolean;
    }

    // Éléments affichés dans le grand tableau central selon le dossier actif
    const currentTableItems = useMemo<TableItem[]>(() => {
        const query = searchFilter.toLowerCase().trim();

        if (activeFolder === 'tv_lib') {
            return allTVVideos
                .filter(v => !query || v.title.toLowerCase().includes(query))
                .map(v => ({
                    id: v.id,
                    type: (v.category === 'clip' ? 'clip' : 'set') as RadioTrackCategory,
                    title: v.title,
                    artist: 'TV SET',
                    duration: v.duration || 3600,
                    box: v.blockTitle || 'TV BACS',
                    youtubeId: v.youtubeId,
                    audioUrl: undefined
                }));
        }

        if (activeFolder === 'general_jingles') {
            return generalJingles
                .filter(j => !query || j.title.toLowerCase().includes(query))
                .map(j => ({
                    id: j.id,
                    type: 'jingle' as const,
                    title: j.title,
                    artist: 'DROPSIDERS JINGLE',
                    duration: j.duration || 15,
                    box: 'JINGLES GÉNÉRAUX',
                    audioUrl: j.audioUrl,
                    youtubeId: j.youtubeId
                }));
        }

        if (activeFolder.startsWith('block_jingles:') && selectedBlock) {
            return (selectedBlock.specialJingles || [])
                .filter(j => !query || j.title.toLowerCase().includes(query))
                .map(j => ({
                    id: j.id,
                    type: 'jingle' as const,
                    title: j.title,
                    artist: `${selectedBlock.title} JINGLE`,
                    duration: j.duration || 15,
                    box: `JINGLES • ${selectedBlock.title}`,
                    audioUrl: j.audioUrl,
                    youtubeId: j.youtubeId
                }));
        }

        if (selectedBlock) {
            // Affichage complet de l'émission : SETS, CLIPS, JINGLES SPÉCIAUX, GÉNÉRIQUE
            return (selectedBlock.tracks || [])
                .filter(t => !query || t.title.toLowerCase().includes(query) || (t.artist && t.artist.toLowerCase().includes(query)))
                .map((t, idx) => ({
                    id: t.id || `idx_${idx}`,
                    index: idx,
                    type: t.category || 'set',
                    title: t.title,
                    artist: t.artist || (t.category === 'jingle' ? `${selectedBlock.title} JINGLE` : 'Artiste'),
                    duration: t.duration || 3600,
                    box: selectedBlock.title,
                    audioUrl: t.audioUrl,
                    youtubeId: t.youtubeId,
                    isSpecialJingle: t.category === 'jingle'
                }));
        }

        return [];
    }, [activeFolder, selectedBlock, allTVVideos, generalJingles, searchFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-1 sm:p-3 overflow-hidden font-sans">
            {/* Notification Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-2xl border bg-black/90 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>{toastMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`bg-[#0d1017] border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-200 ${
                    isFullscreen
                        ? 'w-screen h-screen rounded-none'
                        : 'w-full max-w-[1700px] h-[96vh] rounded-3xl'
                }`}
            >
                {/* ═════════════════════════════════════════════════════════════
                    1. EN-TÊTE PRINCIPAL (Style RadioManager / Navigation)
                ═════════════════════════════════════════════════════════════ */}
                <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-[#0d1b2a] via-[#101c2e] to-[#0a121e]">
                    <div className="flex items-center gap-6">
                        {/* Logo RadioManager */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                <Radio className="w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="text-base font-display font-black text-white uppercase italic tracking-tighter flex items-center gap-1.5">
                                    Radio<span className="text-cyan-400">Manager</span>
                                    <span className="text-[9px] font-mono not-italic px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                        PRO
                                    </span>
                                </h1>
                            </div>
                        </div>

                        {/* Onglets façon RadioManager */}
                        <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                            <button
                                type="button"
                                className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                            >
                                Audio & Bacs
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveFolder('general_jingles')}
                                className="px-3.5 py-1.5 rounded-lg text-gray-400 hover:text-white"
                            >
                                Bacs de Jingles
                            </button>
                        </div>
                    </div>

                    {/* Actions droites */}
                    <div className="flex items-center gap-2.5">
                        {/* Bouton Uploader un Jingle (AVEC MENU DÉROULANT DEMANDÉ) */}
                        <button
                            type="button"
                            onClick={() => setIsUploadJingleModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Uploader un Jingle</span>
                        </button>

                        {/* Indicateur ON AIR */}
                        <button
                            type="button"
                            onClick={onToggleRadio}
                            className={`px-3.5 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                                isRadioActive
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                    : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${isRadioActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                            {isRadioActive ? 'ON AIR' : 'HORS LIGNE'}
                        </button>

                        {/* Sauvegarder */}
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                saveSuccess
                                    ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                    : 'bg-cyan-500 hover:bg-white text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                            }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{isSaving ? 'Enregistrement...' : saveSuccess ? 'Sauvegardé !' : 'Sauvegarder'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    2. CORPS : ARBORESCENCE (Gauche) + GRAND TABLEAU (Centre)
                ═════════════════════════════════════════════════════════════ */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                    {/* ── ARBORESCENCE RADIONOMY / TREEVIEW (Gauche) ── */}
                    <div className="w-72 shrink-0 border-r border-white/10 flex flex-col bg-[#0a0f18] select-none">
                        <div className="p-3 border-b border-white/10 bg-cyan-950/20 text-cyan-300 font-display font-black text-xs uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                                Radio active : Dropsiders
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar text-xs">
                            {/* DOSSIER 1 : BACS MUSICAUX */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setExpandedFolders(f => ({ ...f, music: !f.music }))}
                                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-300 hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]"
                                >
                                    <span className="flex items-center gap-2 text-cyan-400">
                                        {expandedFolders.music ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        📁 Bacs musicaux TV
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-500">240 sets</span>
                                </button>
                                {expandedFolders.music && (
                                    <div className="pl-6 pt-1 space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveFolder('tv_lib')}
                                            className={`w-full text-left py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                                activeFolder === 'tv_lib'
                                                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Tv className="w-3.5 h-3.5" />
                                                Bibliothèque TV
                                            </span>
                                            <span className="text-[10px] font-mono opacity-80">240</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* DOSSIER 2 : PLAYLISTS / ÉMISSIONS (LA GRILLE 24/7) */}
                            <div>
                                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-300 hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedFolders(f => ({ ...f, emissions: !f.emissions }))}
                                        className="flex items-center gap-2 text-indigo-400 cursor-pointer"
                                    >
                                        {expandedFolders.emissions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        📁 Émissions ({blocks.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingBlockId(null);
                                            setEditBlockForm({
                                                title: `ÉMISSION ${blocks.length + 1}`,
                                                emoji: '🎧',
                                                color: '#00f0ff',
                                                startHour: 0,
                                                endHour: 4,
                                                days: ALL_DAYS,
                                                randomize: true
                                            });
                                            setIsEditingBlock(true);
                                        }}
                                        className="p-1 rounded hover:bg-white/10 text-cyan-400"
                                        title="Créer une émission"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {expandedFolders.emissions && (
                                    <div className="pl-4 pt-1 space-y-1">
                                        {blocks.map(b => {
                                            const isActive = activeFolder === `emission:${b.id}`;
                                            const isLive = isRadioBlockActiveNow(b);
                                            const specialCount = (b.specialJingles || []).length;
                                            return (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBlockId(b.id);
                                                        setActiveFolder(`emission:${b.id}`);
                                                        setIsEditingBlock(false);
                                                    }}
                                                    className={`w-full text-left py-2 px-2.5 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="text-base shrink-0">{b.emoji}</span>
                                                        <div className="min-w-0 flex-1 truncate">
                                                            <p className="truncate font-display font-black uppercase italic leading-tight">
                                                                {b.title}
                                                            </p>
                                                            <span className="text-[9px] font-mono opacity-70">
                                                                {b.timeSlot}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                                        {isLive && (
                                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="À l'antenne" />
                                                        )}
                                                        {specialCount > 0 && (
                                                            <span className="text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded" title={`${specialCount} jingles spéciaux`}>
                                                                🔔{specialCount}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 opacity-80">
                                                            {b.tracks?.length || 0}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* DOSSIER 3 : BACS DE JINGLES (GÉNÉRAUX & PAR ÉMISSION) */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setExpandedFolders(f => ({ ...f, jingles: !f.jingles }))}
                                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-gray-300 hover:bg-white/5 font-bold uppercase tracking-wider text-[11px]"
                                >
                                    <span className="flex items-center gap-2 text-amber-400">
                                        {expandedFolders.jingles ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        🔔 Bacs de Jingles
                                    </span>
                                </button>

                                {expandedFolders.jingles && (
                                    <div className="pl-4 pt-1 space-y-1">
                                        {/* Jingles Généraux */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveFolder('general_jingles')}
                                            className={`w-full text-left py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                                activeFolder === 'general_jingles'
                                                    ? 'bg-amber-600 text-black font-bold shadow-sm'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                🌐 Jingles Généraux
                                            </span>
                                            <span className="text-[10px] font-mono opacity-80">{generalJingles.length}</span>
                                        </button>

                                        {/* Jingles Spécifiques par Émission */}
                                        {blocks.map(b => (
                                            <button
                                                key={`j_${b.id}`}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBlockId(b.id);
                                                    setActiveFolder(`block_jingles:${b.id}`);
                                                }}
                                                className={`w-full text-left py-1.5 px-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                                    activeFolder === `block_jingles:${b.id}`
                                                        ? 'bg-amber-600 text-black font-bold shadow-sm'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <span className="truncate flex items-center gap-1.5">
                                                    <span>{b.emoji}</span>
                                                    <span className="truncate">Jingles • {b.title}</span>
                                                </span>
                                                <span className="text-[9px] font-mono px-1 rounded bg-black/40">
                                                    {(b.specialJingles || []).length}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── GRAND TABLEAU CENTRAL FAÇON RADIOMANAGER (Centre) ── */}
                    <div className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-[#0c1018]">

                        {/* Formulaire d'édition de l'émission si activé */}
                        {isEditingBlock && (
                            <div className="p-5 border-b border-white/10 bg-[#121622] space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-cyan-400" />
                                        {editingBlockId ? 'Modifier les paramètres de l\'émission' : 'Créer une nouvelle émission'}
                                    </h3>
                                    <button type="button" onClick={() => setIsEditingBlock(false)} className="text-gray-400 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-6 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Nom de l'émission</label>
                                        <input
                                            type="text"
                                            value={editBlockForm.title}
                                            onChange={e => setEditBlockForm(f => ({ ...f, title: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Créneau</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min={0} max={23}
                                                value={editBlockForm.startHour}
                                                onChange={e => setEditBlockForm(f => ({ ...f, startHour: parseInt(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-center text-xs font-mono"
                                            />
                                            <span className="text-gray-400 text-xs">h →</span>
                                            <input
                                                type="number" min={1} max={24}
                                                value={editBlockForm.endHour}
                                                onChange={e => setEditBlockForm(f => ({ ...f, endHour: parseInt(e.target.value) || 4 }))}
                                                className="w-16 px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-center text-xs font-mono"
                                            />
                                            <span className="text-gray-400 text-xs">h</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 flex items-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!editBlockForm.title.trim()) return;
                                                if (editingBlockId) {
                                                    setBlocks(prev => prev.map(b => b.id === editingBlockId ? {
                                                        ...b,
                                                        title: editBlockForm.title.trim().toUpperCase(),
                                                        startHour: editBlockForm.startHour,
                                                        endHour: editBlockForm.endHour,
                                                        timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour)
                                                    } : b));
                                                    showToast('Émission modifiée');
                                                } else {
                                                    const newId = `bloc_${Date.now()}`;
                                                    const newB: RadioScheduleBlock = {
                                                        id: newId,
                                                        title: editBlockForm.title.trim().toUpperCase(),
                                                        name: editBlockForm.title.trim().toUpperCase(),
                                                        startHour: editBlockForm.startHour,
                                                        endHour: editBlockForm.endHour,
                                                        timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour),
                                                        color: editBlockForm.color,
                                                        emoji: editBlockForm.emoji,
                                                        randomize: true,
                                                        tracks: [],
                                                        specialJingles: []
                                                    };
                                                    setBlocks(prev => [...prev, newB]);
                                                    setSelectedBlockId(newId);
                                                    setActiveFolder(`emission:${newId}`);
                                                    showToast('Émission créée');
                                                }
                                                setIsEditingBlock(false);
                                            }}
                                            className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-white text-black font-display font-black text-xs uppercase italic cursor-pointer"
                                        >
                                            Valider
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Barre d'action et recherche du tableau */}
                        <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="font-display font-black text-white uppercase italic text-xs flex items-center gap-2">
                                    {activeFolder === 'tv_lib' ? '📺 Bibliothèque TV (240 vidéos)' :
                                     activeFolder === 'general_jingles' ? '🔔 Bacs de Jingles Généraux' :
                                     activeFolder.startsWith('block_jingles:') ? `🔔 Jingles Spécifiques • ${selectedBlock?.title}` :
                                     `📻 Émission : ${selectedBlock?.emoji || ''} ${selectedBlock?.title || ''}`}
                                </span>
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                                    {currentTableItems.length} élément{currentTableItems.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
                                {/* Recherche rapide */}
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchFilter}
                                        onChange={e => setSearchFilter(e.target.value)}
                                        placeholder="Recherche rapide..."
                                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                                    />
                                </div>

                                {/* Bouton Ajouter Morceau */}
                                {selectedBlock && !activeFolder.includes('jingle') && activeFolder !== 'tv_lib' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddTrackBox(!showAddTrackBox)}
                                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Ajouter Morceau</span>
                                    </button>
                                )}

                                {/* Bouton Uploader Jingle */}
                                <button
                                    type="button"
                                    onClick={() => setIsUploadJingleModalOpen(true)}
                                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Nouveau Jingle</span>
                                </button>
                            </div>
                        </div>

                        {/* Formulaire ajout rapide morceau si ouvert */}
                        {showAddTrackBox && (
                            <div className="p-4 border-b border-cyan-500/30 bg-cyan-950/20 space-y-2">
                                <span className="text-[10px] font-display font-black text-cyan-400 uppercase italic block">
                                    + Ajouter un morceau ou set à « {selectedBlock?.title} »
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                    <input
                                        type="text"
                                        value={newTrackUrl}
                                        onChange={async (e) => {
                                            const u = e.target.value;
                                            setNewTrackUrl(u);
                                            const ytId = extractYouTubeId(u);
                                            if (ytId && !newTrackTitle) {
                                                setIsFetchingTitle(true);
                                                try {
                                                    const fetched = await fetchYouTubeTitle(ytId);
                                                    if (fetched) setNewTrackTitle(fetched);
                                                } finally {
                                                    setIsFetchingTitle(false);
                                                }
                                            }
                                        }}
                                        placeholder="Lien YouTube ou audio..."
                                        className="md:col-span-4 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                                    />
                                    <input
                                        type="text"
                                        value={newTrackTitle}
                                        onChange={e => setNewTrackTitle(e.target.value)}
                                        placeholder="Titre du morceau / set"
                                        className="md:col-span-3 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                                    />
                                    <input
                                        type="text"
                                        value={newTrackArtist}
                                        onChange={e => setNewTrackArtist(e.target.value)}
                                        placeholder="Artiste / DJ"
                                        className="md:col-span-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                                    />
                                    <select
                                        value={newTrackCategory}
                                        onChange={e => setNewTrackCategory(e.target.value as any)}
                                        className="md:col-span-1 px-2 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                                    >
                                        <option value="liveset">🎧 Set</option>
                                        <option value="clip">🎬 Clip</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={newTrackDuration}
                                        onChange={e => setNewTrackDuration(e.target.value)}
                                        placeholder="Min"
                                        title="Durée en minutes"
                                        className="md:col-span-1 px-2 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono text-center"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTrackToCurrentEmission}
                                        className="md:col-span-1 py-1.5 rounded-xl bg-cyan-500 hover:bg-white text-black font-display font-black text-xs uppercase cursor-pointer"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── GRAND TABLEAU STYLE RADIOMANAGER AVEC COLONNES ── */}
                        <div className="flex-1 overflow-x-auto overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 bg-black/60 text-gray-400 font-display font-black uppercase italic text-[10px] tracking-wider sticky top-0 z-10">
                                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                                        <th className="py-2.5 px-3 w-28">Type</th>
                                        <th className="py-2.5 px-3 w-48">Artiste / Animateur</th>
                                        <th className="py-2.5 px-3">Titre de l'élément</th>
                                        <th className="py-2.5 px-3 w-24 text-center">Durée</th>
                                        <th className="py-2.5 px-3 w-36">Bac / Box</th>
                                        <th className="py-2.5 px-3 w-32 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-sans">
                                    {currentTableItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-gray-500">
                                                <ListMusic className="w-10 h-10 mx-auto mb-2 text-gray-600 opacity-40" />
                                                <p className="font-bold text-xs uppercase tracking-wider">Aucun élément dans ce bac</p>
                                                <p className="text-[11px] text-gray-600 mt-1">
                                                    Utilisez « Ajouter Morceau » ou « Uploader un Jingle » pour alimenter cette émission.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentTableItems.map((item, idx) => {
                                            const isCurrentPlaying = currentAudio?.id === item.id && isPlaying;
                                            const meta = getRadioCategoryMeta(item.type);
                                            const isSpecialJingle = (item as any).isSpecialJingle || item.type === 'jingle';

                                            return (
                                                <tr
                                                    key={item.id || idx}
                                                    className={`transition-colors cursor-pointer group ${
                                                        isCurrentPlaying
                                                            ? 'bg-cyan-500/15'
                                                            : isSpecialJingle
                                                                ? 'bg-amber-950/20 hover:bg-amber-900/30 border-l-4 border-l-amber-400'
                                                                : idx % 2 === 0
                                                                    ? 'bg-white/[0.01] hover:bg-white/5'
                                                                    : 'bg-black/30 hover:bg-white/5'
                                                    }`}
                                                >
                                                    {/* # Ordre / Play */}
                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (item.audioUrl) {
                                                                    handlePlayAudio(item.id, item.audioUrl, item.title, item.artist);
                                                                } else if (item.youtubeId) {
                                                                    showToast(`YouTube : https://youtube.com/watch?v=${item.youtubeId}`, 'info');
                                                                }
                                                            }}
                                                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                                                isCurrentPlaying
                                                                    ? 'bg-cyan-500 text-black shadow-md'
                                                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/15'
                                                            }`}
                                                            title={item.audioUrl ? "Écouter dans le lecteur" : "Ouvrir"}
                                                        >
                                                            {isCurrentPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                                        </button>
                                                    </td>

                                                    {/* Type / Badge visible */}
                                                    <td className="py-2 px-3">
                                                        <span
                                                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                                                isSpecialJingle
                                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                                                    : meta.bg
                                                            }`}
                                                            style={!isSpecialJingle ? { color: meta.color, borderColor: `${meta.color}40` } : {}}
                                                        >
                                                            {isSpecialJingle ? '🔔 JINGLE SPÉCIAL' : `${meta.emoji} ${meta.label}`}
                                                        </span>
                                                    </td>

                                                    {/* Artiste */}
                                                    <td className="py-2 px-3 font-semibold text-gray-300 text-xs truncate max-w-[180px]">
                                                        {item.artist}
                                                    </td>

                                                    {/* Titre (mis en valeur pour les jingles spéciaux) */}
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs truncate font-display italic font-black uppercase ${
                                                                isSpecialJingle ? 'text-amber-300 font-bold' : 'text-white'
                                                            }`}>
                                                                {item.title}
                                                            </span>
                                                            {isSpecialJingle && (
                                                                <span className="text-[8px] font-mono uppercase bg-amber-400 text-black px-1.5 py-0.2 rounded font-bold">
                                                                    Jingle Émission
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Durée */}
                                                    <td className="py-2 px-3 text-center font-mono text-[11px] text-gray-400">
                                                        {formatDurationExact(item.duration)}
                                                    </td>

                                                    {/* Bac / Box */}
                                                    <td className="py-2 px-3 text-gray-400 text-[11px] font-mono truncate max-w-[140px]">
                                                        {item.box}
                                                    </td>

                                                    {/* Actions (Monter, Descendre, Supprimer) */}
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="inline-flex items-center gap-1">
                                                            {(item as any).index !== undefined && selectedBlock && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        disabled={(item as any).index === 0}
                                                                        onClick={() => handleMoveItem((item as any).index, 'up')}
                                                                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                                                        title="Monter"
                                                                    >
                                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={(item as any).index === (selectedBlock.tracks?.length || 0) - 1}
                                                                        onClick={() => handleMoveItem((item as any).index, 'down')}
                                                                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                                                        title="Descendre"
                                                                    >
                                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteTrack((item as any).index)}
                                                                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    3. LECTEUR PERMANENT EN BAS (Style Radionomy / RadioManager)
                ═════════════════════════════════════════════════════════════ */}
                <div className="h-16 px-6 border-t border-white/10 bg-gradient-to-r from-[#070b12] via-[#0d131f] to-[#070b12] flex items-center justify-between gap-6 shrink-0 z-20">
                    <div className="flex items-center gap-4 min-w-0 w-80">
                        {/* Vignette audio */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                            isPlaying
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                : 'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                            <FileAudio className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-display font-black text-white uppercase italic tracking-tight truncate">
                                {currentAudio ? currentAudio.title : 'Aucun média en cours d\'écoute'}
                            </p>
                            <span className="text-[10px] text-gray-400 font-mono">
                                {currentAudio?.artist ? currentAudio.artist : 'Cliquez sur Play pour pré-écouter un élément'}
                            </span>
                        </div>
                    </div>

                    {/* Contrôles lecteur Play / Progression */}
                    <div className="flex-1 max-w-xl flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleTogglePlayPause}
                            disabled={!currentAudio}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                isPlaying
                                    ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                                    : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-30'
                            }`}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
                                {formatDurationExact(Math.round(audioProgress))}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden relative">
                                <div
                                    className="h-full bg-cyan-400 transition-all"
                                    style={{
                                        width: audioDuration > 0
                                            ? `${(audioProgress / audioDuration) * 100}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 w-10">
                                {formatDurationExact(Math.round(audioDuration))}
                            </span>
                        </div>
                    </div>

                    {/* Contrôle Volume */}
                    <div className="flex items-center gap-2 w-36 justify-end">
                        <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={audioVolume}
                            onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setAudioVolume(v);
                                if (audioPlayerRef.current) audioPlayerRef.current.volume = v;
                            }}
                            className="w-20 accent-cyan-400 cursor-pointer"
                        />
                    </div>
                </div>
            </motion.div>

            {/* ── MODALE D'UPLOAD DE JINGLE AVEC MENU DÉROULANT ── */}
            <RadioJingleUploadModal
                isOpen={isUploadJingleModalOpen}
                onClose={() => setIsUploadJingleModalOpen(false)}
                blocks={blocks}
                defaultBlockId={selectedBlock?.id}
                onSaveJingleForBlock={handleSaveJingleForBlock}
                onSaveGeneralJingle={handleSaveGeneralJingle}
                onShowToast={showToast}
            />

            {/* ── MODAL CONFIRMATION ── */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(f => ({ ...f, isOpen: false }))}
            />

            {/* ── MODAL AUDIT DOUBLONS ── */}
            <DuplicateAuditModal
                isOpen={showDuplicateAudit}
                onClose={() => setShowDuplicateAudit(false)}
                mode="radio"
                duplicates={radioDuplicates}
                onResolve={(ytId: string, _keepId: string, removeIds: string[]) => {
                    setBlocks(prev => prev.map(b => {
                        if (!removeIds.includes(b.id)) return b;
                        return { ...b, tracks: (b.tracks || []).filter(t => t.youtubeId !== ytId) };
                    }));
                    setRadioDuplicates(prev => prev.filter(d => d.youtubeId !== ytId));
                    showToast('✓ Doublon résolu !');
                }}
            />
        </div>
    );
}
