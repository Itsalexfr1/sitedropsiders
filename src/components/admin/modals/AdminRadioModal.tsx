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
    GripVertical,
    Sparkles,
    PanelRightClose,
    PanelRightOpen,
    AlertTriangle,
    Shuffle,
    Maximize2,
    Minimize2,
    Sliders,
    Volume2,
    CheckCircle2
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
    type RadioScheduleBlock,
    type RadioTrackItem,
    type RadioThemeJingle,
    type RadioTopHoraireConfig,
    type RadioTrackCategory
} from '../../../utils/radioSchedule';
import { parseArtistAndEvent } from '../../../utils/tvSchedule';
import { RadioEmissionTracksPanel } from '../radio/RadioEmissionTracksPanel';
import { RadioEmissionJinglesPanel } from '../radio/RadioEmissionJinglesPanel';

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
    const [activeEmissionTab, setActiveEmissionTab] = useState<'tracks' | 'jingles'>('tracks');

    // ─── Bibliothèque TV (240 vidéos) ──────────────────────────────────────────
    const [tvBlocks, setTvBlocks] = useState<TVBlock[]>(getInitialTVBlocks);
    const [isTVLibOpen, setIsTVLibOpen] = useState(false);
    const [tvSearch, setTvSearch] = useState('');
    const [tvFilter, setTvFilter] = useState<'all' | 'liveset' | 'clip'>('all');
    const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

    // ─── Toasts et Modales ─────────────────────────────────────────────────────
    const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'warn' | 'info' } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isYouTubeSearchOpen, setIsYouTubeSearchOpen] = useState(false);

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

    // Modal édition d'un morceau
    const [editingTrack, setEditingTrack] = useState<{
        trackId: string;
        artist: string;
        title: string;
        category: 'liveset' | 'clip';
        durationMinutes: number;
        youtubeId: string;
    } | null>(null);
    const [isFetchingEditTitle, setIsFetchingEditTitle] = useState(false);

    // Modal envoyer vers TV
    const [sendToTVTrack, setSendToTVTrack] = useState<RadioTrackItem | null>(null);
    const [sendToTVBlockId, setSendToTVBlockId] = useState<string>('');

    // TOP Horaire
    const [topHoraireConfig, setTopHoraireConfig] = useState<RadioTopHoraireConfig>(getTopHoraireConfig);

    // Pré-écoute audio
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    const handleToggleAudioPreview = (id: string, url: string) => {
        if (playingAudioId === id) {
            audioPreviewRef.current?.pause();
            audioPreviewRef.current = null;
            setPlayingAudioId(null);
            return;
        }
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current = null;
        }
        const a = new Audio(url);
        a.volume = 0.85;
        a.onended = () => setPlayingAudioId(null);
        a.onerror = () => setPlayingAudioId(null);
        a.play().catch(() => setPlayingAudioId(null));
        audioPreviewRef.current = a;
        setPlayingAudioId(id);
    };

    // Formulaire d'édition de l'émission
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

    // Sauvegarde globale
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ─── Chargement initial ────────────────────────────────────────────────────
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
                                    }
                                }
                            }
                        } catch {}
                    }

                    if (Array.isArray(data?.tv_blocks) && data.tv_blocks.length > 0) {
                        const loadedTV: TVBlock[] = data.tv_blocks.map((b: any) => ({
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
                        if (loadedTV.reduce((a, b) => a + b.videos.length, 0) > 0) {
                            setTvBlocks(loadedTV);
                        }
                    }
                }
            } catch (e) {
                console.error('Erreur chargement radio:', e);
            }
        };
        fetchSettings();
    }, [isOpen]);

    // Bloc sélectionné
    const selectedBlock = useMemo(() => {
        if (!selectedBlockId) return null;
        return blocks.find(b => b.id === selectedBlockId) || null;
    }, [blocks, selectedBlockId]);

    const liveBlockNow = useMemo(() => getActiveRadioBlock(blocks), [blocks]);

    const totalTVVideos = useMemo(() => {
        return tvBlocks.reduce((acc, b) => acc + b.videos.length, 0);
    }, [tvBlocks]);

    // Vidéos TV filtrées
    const filteredTVVideos = useMemo(() => {
        const query = tvSearch.toLowerCase().trim();
        const all: TVVideoItem[] = [];
        tvBlocks.forEach(b => {
            b.videos.forEach(v => {
                if (tvFilter !== 'all' && v.category !== tvFilter) return;
                if (query && !v.title.toLowerCase().includes(query)) return;
                all.push({
                    ...v,
                    blockTitle: b.title,
                    blockColor: b.color,
                    blockEmoji: b.emoji
                });
            });
        });
        return all;
    }, [tvBlocks, tvSearch, tvFilter]);

    // ─── Actions Émissions ─────────────────────────────────────────────────────
    const openNewBlockForm = () => {
        setEditingBlockId(null);
        setEditBlockForm({
            title: `ÉMISSION ${blocks.length + 1}`,
            emoji: PRESET_EMOJIS[blocks.length % PRESET_EMOJIS.length],
            color: PRESET_COLORS[blocks.length % PRESET_COLORS.length].hex,
            startHour: (blocks.length * 4) % 24,
            endHour: ((blocks.length * 4) + 4) % 24 || 24,
            days: ALL_DAYS,
            randomize: true
        });
        setIsEditingBlock(true);
    };

    const openEditBlockForm = (b: RadioScheduleBlock) => {
        setEditingBlockId(b.id);
        setSelectedBlockId(b.id);
        setEditBlockForm({
            title: b.title,
            emoji: b.emoji,
            color: b.color,
            startHour: b.startHour,
            endHour: b.endHour,
            days: b.days || ALL_DAYS,
            randomize: b.randomize
        });
        setIsEditingBlock(true);
    };

    const handleSaveBlock = () => {
        if (!editBlockForm.title.trim()) {
            showToast('Donnez un nom à votre émission', 'warn');
            return;
        }

        if (editingBlockId) {
            const updated = blocks.map(b => {
                if (b.id !== editingBlockId) return b;
                return {
                    ...b,
                    title: editBlockForm.title.trim().toUpperCase(),
                    name: editBlockForm.title.trim().toUpperCase(),
                    emoji: editBlockForm.emoji,
                    color: editBlockForm.color,
                    startHour: editBlockForm.startHour,
                    endHour: editBlockForm.endHour,
                    days: editBlockForm.days,
                    randomize: editBlockForm.randomize,
                    timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour)
                };
            });
            const sorted = sortRadioBlocksByBroadcastOrder(updated, false);
            setBlocks(sorted);
            setSelectedBlockId(editingBlockId);
            showToast(`Émission « ${editBlockForm.title} » mise à jour !`);
        } else {
            const newId = `radio_bloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const newBlock: RadioScheduleBlock = {
                id: newId,
                name: editBlockForm.title.trim().toUpperCase(),
                title: editBlockForm.title.trim().toUpperCase(),
                timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour),
                startHour: editBlockForm.startHour,
                endHour: editBlockForm.endHour,
                color: editBlockForm.color,
                emoji: editBlockForm.emoji,
                randomize: editBlockForm.randomize,
                days: editBlockForm.days,
                tracks: [],
                specialJingles: []
            };
            const sorted = sortRadioBlocksByBroadcastOrder([...blocks, newBlock], false);
            setBlocks(sorted);
            setSelectedBlockId(newId);
            showToast(`Émission « ${newBlock.title} » créée avec succès !`);
        }
        setIsEditingBlock(false);
        setEditingBlockId(null);
    };

    const handleDeleteBlock = (blockId: string) => {
        const target = blocks.find(b => b.id === blockId);
        setConfirmModal({
            isOpen: true,
            title: `SUPPRIMER « ${target?.title || 'CETTE ÉMISSION'} » ?`,
            message: `Êtes-vous sûr de vouloir supprimer cette émission et ses ${target?.tracks?.length || 0} morceau(x) ?`,
            type: 'danger',
            confirmText: 'OUI, SUPPRIMER',
            cancelText: 'ANNULER',
            onConfirm: () => {
                const next = blocks.filter(b => b.id !== blockId);
                setBlocks(next);
                if (selectedBlockId === blockId) {
                    setSelectedBlockId(next[0]?.id || null);
                }
                showToast('Émission supprimée');
            }
        });
    };

    const handleResetGrid = () => {
        setConfirmModal({
            isOpen: true,
            title: "RÉINITIALISER LA GRILLE RADIO",
            message: "Voulez-vous vraiment remettre la grille radio à zéro (supprimer toutes les émissions) ?",
            type: "danger",
            confirmText: "TOUT EFFACER",
            cancelText: "ANNULER",
            onConfirm: async () => {
                setBlocks([]);
                setSelectedBlockId(null);
                setEditingBlockId(null);
                setIsEditingBlock(false);
                localStorage.removeItem(STORAGE_RADIO_BLOCKS_KEY);
                try {
                    await apiFetch('/api/settings/update', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ radio_blocks: [], radio_tracks: [] }),
                    });
                    window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                    showToast('Grille radio remise à zéro');
                } catch (e) {
                    console.error('Erreur reset grille:', e);
                }
            }
        });
    };

    // ─── Gestion des pistes d'une émission ────────────────────────────────────
    const handleAddTrack = (track: RadioTrackItem) => {
        if (!selectedBlockId) return;
        setBlocks(prev => prev.map(b => b.id === selectedBlockId ? {
            ...b,
            tracks: [...(b.tracks || []), track]
        } : b));
    };

    const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
        if (!selectedBlockId || !selectedBlock) return;
        const currentTracks = [...(selectedBlock.tracks || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentTracks.length) return;

        const temp = currentTracks[index];
        currentTracks[index] = currentTracks[targetIndex];
        currentTracks[targetIndex] = temp;

        setBlocks(prev => prev.map(b => b.id === selectedBlockId ? {
            ...b,
            tracks: currentTracks
        } : b));
    };

    const handleDeleteTrack = (index: number) => {
        if (!selectedBlockId || !selectedBlock) return;
        const currentTracks = [...(selectedBlock.tracks || [])];
        const removed = currentTracks.splice(index, 1);
        setBlocks(prev => prev.map(b => b.id === selectedBlockId ? {
            ...b,
            tracks: currentTracks
        } : b));
        if (removed[0]) {
            showToast(`« ${removed[0].title} » retiré de l'émission`);
        }
    };

    const handleToggleRandomize = () => {
        if (!selectedBlockId) return;
        setBlocks(prev => prev.map(b => b.id === selectedBlockId ? {
            ...b,
            randomize: !b.randomize
        } : b));
        showToast(selectedBlock?.randomize ? 'Ordre fixe activé' : 'Lecture aléatoire (Shuffle) activée');
    };

    // Import depuis la TV
    const handleImportFromTV = (vid: TVVideoItem, targetBlockId?: string | null) => {
        const blockId = targetBlockId || selectedBlockId;
        if (!blockId) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        const target = blocks.find(b => b.id === blockId);
        if (!target) return;

        const alreadyInTarget = target.tracks?.some(t => t.youtubeId === vid.youtubeId);
        if (alreadyInTarget) {
            showToast(`⚠️ Ce set est déjà dans « ${target.title} »`, 'warn');
            return;
        }

        const { artist, event } = parseArtistAndEvent(vid.title);
        const newTrack: RadioTrackItem = {
            id: `rt_tv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: event || vid.title,
            artist: artist || 'Artiste',
            youtubeId: vid.youtubeId,
            duration: vid.duration || 3600,
            category: (vid.duration && vid.duration < 1200) || vid.category === 'clip' ? 'clip' : 'liveset',
            addedAt: Date.now(),
        };

        setBlocks(prev => prev.map(b => b.id === blockId ? {
            ...b,
            tracks: [...(b.tracks || []), newTrack]
        } : b));

        showToast(`✨ « ${newTrack.title} » ajouté à « ${target.title} » !`);
    };

    // ─── Sauvegarde globale ───────────────────────────────────────────────────
    const handleSave = async () => {
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
                showToast('✓ Grille radio et émissions sauvegardées avec succès !', 'success');
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                showToast('Erreur lors de la sauvegarde sur le serveur', 'warn');
            }
        } catch (e) {
            console.error('Erreur sauvegarde:', e);
            showToast('Erreur sauvegarde', 'warn');
        } finally {
            setIsSaving(false);
        }
    };

    // Jours d'une émission
    const handleToggleDay = (day: number) => {
        const current = editBlockForm.days;
        const has = current.includes(day);
        if (has && current.length <= 1) {
            showToast("L'émission doit être diffusée au moins un jour", 'warn');
            return;
        }
        const next = has ? current.filter(d => d !== day) : [...current, day];
        setEditBlockForm(f => ({ ...f, days: next }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-6 overflow-hidden">
            {/* Toast notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2.5 shadow-2xl border ${
                            toastMessage.type === 'warn'
                                ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-500/20'
                                : toastMessage.type === 'info'
                                    ? 'bg-blue-950/90 text-blue-300 border-blue-500/50 shadow-blue-500/20'
                                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                        }`}
                    >
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{toastMessage.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`bg-[#0b0c14] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-200 ${
                    isFullscreen
                        ? 'w-screen h-screen rounded-none'
                        : 'w-full max-w-[1550px] h-[95vh] rounded-3xl'
                }`}
            >
                {/* ── BANDEAU SUPÉRIEUR PRO & CLEAN ── */}
                <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                            <Radio className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                DROPSIDERS <span className="text-neon-cyan">RADIO</span> STUDIO
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 not-italic">
                                    V2 PRO
                                </span>
                            </h2>
                            <p className="text-[10px] text-gray-400 font-sans">
                                Grille de diffusion 24/7 · Programmation & Jingles spéciaux par émission
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Indicateur ON AIR direct */}
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

                        {/* Bouton Bibliothèque TV */}
                        <button
                            type="button"
                            onClick={() => setIsTVLibOpen(!isTVLibOpen)}
                            className={`px-3 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                                isTVLibOpen
                                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Tv className="w-4 h-4 text-purple-400" />
                            <span className="hidden sm:inline">Bibliothèque TV ({totalTVVideos})</span>
                            {isTVLibOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                        </button>

                        {/* Bouton Sauvegarder */}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                saveSuccess
                                    ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                    : 'bg-neon-cyan text-black hover:bg-white shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                            }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span>{isSaving ? 'Enregistrement...' : saveSuccess ? 'Sauvegardé !' : 'Sauvegarder'}</span>
                        </button>

                        {/* Plein écran */}
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        {/* Fermer */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                {/* ── CORPS DU STUDIO RADIO ── */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                    {/* ═════════════════════════════════════════════════════
                        COLONNE 1 : ÉMISSIONS RADIO (24/7) (Gauche)
                    ═════════════════════════════════════════════════════ */}
                    <div className="w-72 shrink-0 border-r border-white/10 flex flex-col bg-black/30">
                        {/* En-tête sidebar */}
                        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                            <span className="text-[11px] font-display font-black uppercase italic tracking-wider text-gray-300 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-neon-cyan" />
                                Émissions ({blocks.length})
                            </span>

                            <div className="flex items-center gap-1.5">
                                {blocks.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleResetGrid}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                        title="Réinitialiser la grille"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={openNewBlockForm}
                                    className="px-2.5 py-1.5 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan text-neon-cyan hover:text-black border border-neon-cyan/40 text-[10px] font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Créer</span>
                                </button>
                            </div>
                        </div>

                        {/* Liste des émissions */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                            {blocks.length === 0 && !isEditingBlock && (
                                <div className="p-8 text-center text-gray-500">
                                    <Radio className="w-10 h-10 mx-auto mb-2 text-gray-600 opacity-40" />
                                    <p className="font-display font-black uppercase italic text-xs text-gray-300">Aucune émission</p>
                                    <p className="text-[11px] mt-1 text-gray-500">Cliquez sur « Créer » pour configurer votre premier créneau.</p>
                                </div>
                            )}

                            {blocks.map(b => {
                                const isSelected = b.id === selectedBlockId;
                                const isLive = isRadioBlockActiveNow(b);
                                const specialCount = (b.specialJingles || []).length;
                                const hasTheme = b.themeJingle?.enabled;

                                return (
                                    <div
                                        key={b.id}
                                        onClick={() => { setSelectedBlockId(b.id); setIsEditingBlock(false); }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'copy';
                                            setDragOverBlockId(b.id);
                                        }}
                                        onDragLeave={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                setDragOverBlockId(null);
                                            }
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragOverBlockId(null);
                                            try {
                                                const raw = e.dataTransfer.getData('application/json');
                                                if (raw) {
                                                    const vid = JSON.parse(raw);
                                                    handleImportFromTV(vid, b.id);
                                                }
                                            } catch (err) {
                                                console.error('Erreur drop:', err);
                                            }
                                        }}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer group relative ${
                                            dragOverBlockId === b.id
                                                ? 'bg-neon-cyan/25 border-neon-cyan ring-2 ring-neon-cyan scale-[1.02]'
                                                : isSelected
                                                    ? 'bg-white/[0.08] border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                                                    : 'bg-[#0e0f17] border-white/5 hover:border-white/20 hover:bg-[#141622]'
                                        }`}
                                        style={{ borderLeftColor: b.color, borderLeftWidth: 4 }}
                                    >
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className="text-2xl leading-none">{b.emoji}</span>
                                            <div className="flex items-center gap-1.5">
                                                {isLive && (
                                                    <span className="text-[8px] font-display font-black uppercase italic px-1.5 py-0.5 rounded-full bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse">
                                                        ON AIR
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedBlockId(b.id); openEditBlockForm(b); }}
                                                    className="p-1 rounded-lg text-gray-500 hover:text-neon-cyan hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                    title="Paramètres de l'émission"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteBlock(b.id); }}
                                                    className="p-1 rounded-lg text-gray-500 hover:text-neon-red hover:bg-neon-red/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                    title="Supprimer cette émission"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs font-display font-black text-white uppercase italic tracking-tight truncate leading-tight">
                                            {b.title}
                                        </p>

                                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                                            <span className="text-[9px] font-mono text-gray-400">{b.timeSlot}</span>
                                            <div className="flex items-center gap-1.5">
                                                {(hasTheme || specialCount > 0) && (
                                                    <span
                                                        className="text-[8.5px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                                                        title={`${specialCount} jingles spéciaux configurés`}
                                                    >
                                                        🔔 {specialCount + (hasTheme ? 1 : 0)}
                                                    </span>
                                                )}
                                                <span className="text-[8.5px] font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/20">
                                                    {b.tracks?.length || 0} titre{(b.tracks?.length || 0) > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ═════════════════════════════════════════════════════
                        COLONNE 2 : L'ÉMISSION SÉLECTIONNÉE (Centre)
                    ═════════════════════════════════════════════════════ */}
                    <div className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-[#08090d]/60">

                        {/* ── FORMULAIRE ÉDITION DE L'ÉMISSION ── */}
                        {isEditingBlock && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="m-5 p-6 rounded-3xl bg-[#0e0f18] border border-neon-cyan/40 space-y-5 shadow-2xl relative"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2.5">
                                        <Radio className="w-5 h-5 text-neon-cyan" />
                                        {editingBlockId ? 'PARAMÈTRES DE L\'ÉMISSION' : 'CRÉER UNE NOUVELLE ÉMISSION'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingBlock(false)}
                                        className="text-gray-500 hover:text-white cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Emoji + Nom + Couleur */}
                                <div className="flex items-start gap-4">
                                    <div className="relative group shrink-0">
                                        <button
                                            type="button"
                                            className="text-3xl w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
                                        >
                                            {editBlockForm.emoji}
                                        </button>
                                        <div className="absolute top-full left-0 mt-2 p-2 bg-[#121422] border border-white/20 rounded-2xl grid grid-cols-7 gap-1.5 shadow-2xl z-40 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                                            {PRESET_EMOJIS.map(em => (
                                                <button
                                                    key={em}
                                                    type="button"
                                                    onClick={() => setEditBlockForm(f => ({ ...f, emoji: em }))}
                                                    className="text-xl p-1.5 hover:bg-white/10 rounded-xl cursor-pointer"
                                                >{em}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider">
                                            Nom de l'émission
                                        </label>
                                        <input
                                            type="text"
                                            value={editBlockForm.title}
                                            onChange={e => setEditBlockForm(f => ({ ...f, title: e.target.value }))}
                                            placeholder="EX: TECHNO BUNKER, MORNING GROOVE..."
                                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white font-display font-black text-base uppercase italic tracking-wide focus:outline-none focus:border-neon-cyan"
                                        />
                                    </div>

                                    <div className="shrink-0 space-y-1">
                                        <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block">
                                            Couleur
                                        </label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c.hex}
                                                    type="button"
                                                    onClick={() => setEditBlockForm(f => ({ ...f, color: c.hex }))}
                                                    className={`w-7 h-7 rounded-xl border-2 transition-all cursor-pointer ${
                                                        editBlockForm.color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-white/50'
                                                    }`}
                                                    style={{ backgroundColor: c.hex }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Horaires & Aléatoire */}
                                <div className="flex items-center gap-5 flex-wrap pt-1">
                                    <div className="flex items-center gap-2.5 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                                        <Clock className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-[10px] font-display font-black text-gray-300 uppercase italic">Créneau :</span>
                                        <input
                                            type="number" min={0} max={23}
                                            value={editBlockForm.startHour}
                                            onChange={e => setEditBlockForm(f => ({ ...f, startHour: parseInt(e.target.value) || 0 }))}
                                            className="w-14 px-2 py-1 rounded-xl bg-black/50 border border-white/15 text-white text-center text-xs font-mono font-bold"
                                        />
                                        <span className="text-gray-400 text-xs font-mono">h →</span>
                                        <input
                                            type="number" min={1} max={24}
                                            value={editBlockForm.endHour}
                                            onChange={e => setEditBlockForm(f => ({ ...f, endHour: parseInt(e.target.value) || 4 }))}
                                            className="w-14 px-2 py-1 rounded-xl bg-black/50 border border-white/15 text-white text-center text-xs font-mono font-bold"
                                        />
                                        <span className="text-gray-400 text-xs font-mono">h</span>
                                    </div>

                                    <label className="flex items-center gap-2.5 cursor-pointer bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={editBlockForm.randomize}
                                            onChange={e => setEditBlockForm(f => ({ ...f, randomize: e.target.checked }))}
                                            className="rounded accent-neon-cyan w-4 h-4 cursor-pointer"
                                        />
                                        <Shuffle className="w-3.5 h-3.5 text-neon-cyan" />
                                        <span className="text-[10px] font-display font-black text-gray-300 uppercase italic">Lecture Aléatoire (Shuffle)</span>
                                    </label>
                                </div>

                                {/* Jours de diffusion */}
                                <div>
                                    <span className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block mb-2">
                                        Jours de diffusion :
                                    </span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {DAYS_OF_WEEK.map(d => {
                                            const active = editBlockForm.days.includes(d.value);
                                            return (
                                                <button
                                                    key={d.value}
                                                    type="button"
                                                    onClick={() => handleToggleDay(d.value)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic transition-all cursor-pointer ${
                                                        active
                                                            ? 'bg-neon-cyan text-black shadow-md'
                                                            : 'bg-white/5 text-gray-500 hover:text-white'
                                                    }`}
                                                >
                                                    {d.short}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveBlock}
                                        className="flex-1 py-3 rounded-2xl bg-neon-cyan text-black font-display font-black text-xs uppercase italic tracking-wider hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Check className="w-4 h-4" />
                                        Valider l'émission
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingBlock(false)}
                                        className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-display font-black text-xs uppercase italic transition-all cursor-pointer"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── PAS D'ÉMISSION SÉLECTIONNÉE ── */}
                        {!selectedBlock && !isEditingBlock && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 rounded-3xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                                    <Radio className="w-10 h-10 text-neon-cyan" />
                                </div>
                                <h3 className="text-white font-display font-black text-2xl uppercase italic tracking-tight mb-2">
                                    STUDIO RADIO DROPSIDERS
                                </h3>
                                <p className="text-gray-400 text-xs max-w-md font-sans leading-relaxed">
                                    Sélectionnez une émission dans la liste à gauche ou créez-en une nouvelle pour gérer vos morceaux et configurer vos jingles spéciaux.
                                </p>
                                <button
                                    type="button"
                                    onClick={openNewBlockForm}
                                    className="mt-6 px-8 py-3.5 rounded-2xl bg-neon-cyan text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2.5 hover:bg-white transition-all shadow-[0_0_30px_rgba(0,240,255,0.4)] cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    Créer une émission
                                </button>
                            </div>
                        )}

                        {/* ── ÉMISSION SÉLECTIONNÉE (SANS TIMELINE D'ANTENNE INUTILE) ── */}
                        {selectedBlock && !isEditingBlock && (
                            <div className="flex flex-col flex-1 min-h-0">
                                {/* Bandeau En-tête de l'émission */}
                                <div
                                    className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white/[0.02]"
                                    style={{ borderLeftColor: selectedBlock.color, borderLeftWidth: 5 }}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <span className="text-3xl">{selectedBlock.emoji}</span>
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <h3 className="text-base md:text-lg font-display font-black text-white uppercase italic tracking-tight">
                                                    {selectedBlock.title}
                                                </h3>
                                                {isRadioBlockActiveNow(selectedBlock) && (
                                                    <span className="text-[9px] font-display font-black uppercase italic px-2 py-0.5 rounded-full bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse">
                                                        EN DIRECT ACTUELLEMENT
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                <span className="font-mono text-neon-cyan font-bold">{selectedBlock.timeSlot}</span>
                                                <span>•</span>
                                                <span>{selectedBlock.tracks?.length || 0} morceau{(selectedBlock.tracks?.length || 0) > 1 ? 'x' : ''}</span>
                                                <span>•</span>
                                                <span>{(selectedBlock.specialJingles || []).length} jingle(s) spéciaux</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sélecteur d'onglets de l'émission : Morceaux VS Jingles */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-black/50 p-1 rounded-2xl border border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => setActiveEmissionTab('tracks')}
                                                className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                                    activeEmissionTab === 'tracks'
                                                        ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <Music2 className="w-3.5 h-3.5" />
                                                <span>Morceaux ({selectedBlock.tracks?.length || 0})</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveEmissionTab('jingles')}
                                                className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                                    activeEmissionTab === 'jingles'
                                                        ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <Volume2 className="w-3.5 h-3.5" />
                                                <span>Jingles Spéciaux ({(selectedBlock.specialJingles || []).length})</span>
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openEditBlockForm(selectedBlock)}
                                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                            title="Modifier l'émission (nom, horaires, couleur)"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Paramètres</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Contenu selon l'onglet actif */}
                                <div className="flex-1 overflow-y-auto">
                                    {activeEmissionTab === 'tracks' && (
                                        <RadioEmissionTracksPanel
                                            tracks={selectedBlock.tracks || []}
                                            emissionTitle={selectedBlock.title}
                                            emissionColor={selectedBlock.color}
                                            randomize={selectedBlock.randomize}
                                            onToggleRandomize={handleToggleRandomize}
                                            onAddTrack={handleAddTrack}
                                            onMoveTrack={handleMoveTrack}
                                            onDeleteTrack={handleDeleteTrack}
                                            onEditTrack={(track, idx) => setEditingTrack({
                                                trackId: track.id,
                                                artist: track.artist || '',
                                                title: track.title,
                                                category: track.category === 'clip' ? 'clip' : 'liveset',
                                                durationMinutes: Math.round((track.duration || 3600) / 60),
                                                youtubeId: track.youtubeId || ''
                                            })}
                                            onSendToTV={(track) => setSendToTVTrack(track)}
                                            playingAudioId={playingAudioId}
                                            onToggleAudioPreview={handleToggleAudioPreview}
                                            onOpenTVLibrary={() => setIsTVLibOpen(true)}
                                            onShowToast={showToast}
                                        />
                                    )}

                                    {activeEmissionTab === 'jingles' && (
                                        <RadioEmissionJinglesPanel
                                            block={selectedBlock}
                                            onUpdateBlock={(updated) => {
                                                setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
                                            }}
                                            playingAudioId={playingAudioId}
                                            onToggleAudioPreview={handleToggleAudioPreview}
                                            onShowToast={showToast}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═════════════════════════════════════════════════════
                        COLONNE 3 : BIBLIOTHÈQUE TV (Droite - Rétractable)
                    ═════════════════════════════════════════════════════ */}
                    {isTVLibOpen && (
                        <div className="w-96 shrink-0 border-l border-white/10 flex flex-col bg-[#0b0c14]/95">
                            <div className="p-4 border-b border-white/10 space-y-3 bg-black/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Tv className="w-4 h-4 text-purple-400" />
                                        <h4 className="text-xs font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                            BIBLIOTHÈQUE TV
                                            <span className="text-[9px] font-mono normal-case px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                {totalTVVideos} vidéos
                                            </span>
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsTVLibOpen(false)}
                                        className="text-gray-500 hover:text-white p-1 cursor-pointer"
                                        title="Fermer le volet TV"
                                    >
                                        <PanelRightClose className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Recherche */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={tvSearch}
                                        onChange={e => setTvSearch(e.target.value)}
                                        placeholder="Rechercher DJ, festival..."
                                        className="w-full pl-9 pr-7 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
                                    />
                                </div>

                                {/* Filtres */}
                                <div className="flex gap-1">
                                    {(['all', 'liveset', 'clip'] as const).map(f => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => setTvFilter(f)}
                                            className={`flex-1 py-1 rounded-xl text-[10px] font-display font-black uppercase italic transition-all cursor-pointer ${
                                                tvFilter === f
                                                    ? 'bg-purple-600 text-white shadow-sm'
                                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {f === 'all' ? 'Tout' : f === 'liveset' ? '🎧 Sets' : '🎬 Clips'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Liste des vidéos TV */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {filteredTVVideos.slice(0, 100).map((v, i) => (
                                    <div
                                        key={v.id || i}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/json', JSON.stringify(v));
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        className="flex items-center justify-between p-2.5 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/40 transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-10 h-7 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                                                <img
                                                    src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-display font-black text-white uppercase italic tracking-tight truncate">
                                                    {v.title}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-[9px] text-gray-400 mt-0.5">
                                                    <span>{v.category === 'clip' ? '🎬 Clip' : '🎧 Set'}</span>
                                                    <span>•</span>
                                                    <span>{formatDurationExact(v.duration || 3600)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleImportFromTV(v)}
                                            className="px-2 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-black border border-purple-500/30 text-[9px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer shrink-0 ml-2"
                                            title="Ajouter à l'émission sélectionnée"
                                        >
                                            + Ajouter
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── MODAL DROPSIDERS CONFIRMATION ── */}
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
                onResolveRadio={(ytId, keepId, removeIds) => {
                    setBlocks(prev => prev.map(b => {
                        if (!removeIds.includes(b.id)) return b;
                        return { ...b, tracks: (b.tracks || []).filter(t => t.youtubeId !== ytId) };
                    }));
                    setRadioDuplicates(prev => prev.filter(d => d.youtubeId !== ytId));
                    showToast('✓ Doublon résolu !');
                }}
            />

            {/* ── MODAL ÉDITION DE PISTE ── */}
            {editingTrack && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0e0f18] border border-white/20 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-display font-black text-white uppercase italic tracking-wider">
                                Modifier la piste
                            </h4>
                            <button
                                type="button"
                                onClick={() => setEditingTrack(null)}
                                className="text-gray-500 hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Titre</label>
                                <input
                                    type="text"
                                    value={editingTrack.title}
                                    onChange={e => setEditingTrack(t => t ? { ...t, title: e.target.value } : null)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Artiste</label>
                                <input
                                    type="text"
                                    value={editingTrack.artist}
                                    onChange={e => setEditingTrack(t => t ? { ...t, artist: e.target.value } : null)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Durée (minutes)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={editingTrack.durationMinutes}
                                        onChange={e => setEditingTrack(t => t ? { ...t, durationMinutes: parseInt(e.target.value) || 60 } : null)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono text-center focus:outline-none focus:border-neon-cyan"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Catégorie</label>
                                    <select
                                        value={editingTrack.category}
                                        onChange={e => setEditingTrack(t => t ? { ...t, category: e.target.value as any } : null)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                    >
                                        <option value="liveset">🎧 Set</option>
                                        <option value="clip">🎬 Clip</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!selectedBlockId || !editingTrack) return;
                                    setBlocks(prev => prev.map(b => b.id === selectedBlockId ? {
                                        ...b,
                                        tracks: (b.tracks || []).map(t => t.id === editingTrack.trackId ? {
                                            ...t,
                                            title: editingTrack.title,
                                            artist: editingTrack.artist,
                                            category: editingTrack.category,
                                            duration: editingTrack.durationMinutes * 60
                                        } : t)
                                    } : b));
                                    showToast('✓ Piste mise à jour !');
                                    setEditingTrack(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-neon-cyan text-black font-display font-black text-xs uppercase italic tracking-wider hover:bg-white transition-all cursor-pointer"
                            >
                                Enregistrer
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingTrack(null)}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-display font-black text-xs uppercase italic cursor-pointer"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
