import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Radio,
    Plus,
    Trash2,
    Pencil,
    ChevronUp,
    ChevronDown,
    ExternalLink,
    CheckCircle2,
    Music2,
    Search,
    Check,
    Save,
    Loader2,
    Calendar,
    Play,
    Tv,
    Clock,
    Film,
    GripVertical,
    Sparkles,
    PanelRightClose,
    PanelRightOpen,
    AlertTriangle,
    Shuffle
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';
import { apiFetch } from '../../../utils/auth';
import defaultSettings from '../../../data/settings.json';
import { ConfirmModal } from '../../ui/ConfirmModal';
import {
    STORAGE_RADIO_BLOCKS_KEY,
    DAYS_OF_WEEK,
    ALL_DAYS,
    WEEKDAYS,
    WEEKEND_DAYS,
    formatRadioTimeSlot,
    formatDurationExact,
    isRadioBlockActiveOnDay,
    sortRadioBlocksByBroadcastOrder,
    getActiveRadioBlock,
    type RadioScheduleBlock,
    type RadioTrackItem
} from '../../../utils/radioSchedule';
import { parseArtistAndEvent } from '../../../utils/tvSchedule';

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

// Vidéo issue de la TV
export interface TVVideoItem {
    id: string;
    title: string;
    youtubeId: string;
    duration?: number;
    category?: 'liveset' | 'clip';
    blockTitle?: string;
}

// Bloc TV avec ses vidéos
export interface TVBlock {
    id: string;
    title: string;
    emoji?: string;
    timeSlot?: string;
    videos: TVVideoItem[];
}

// Initialise les 240 vidéos par défaut de la TV
function getInitialTVBlocks(): TVBlock[] {
    const raw = (defaultSettings as any)?.tv_blocks;
    if (Array.isArray(raw)) {
        return raw.map((b: any) => ({
            id: b.id,
            title: b.title || b.name || 'Bloc TV',
            emoji: b.emoji || '📺',
            timeSlot: b.timeSlot || '',
            videos: (b.videos || []).map((v: any) => ({
                id: v.id || v.youtubeId,
                title: v.title,
                youtubeId: v.youtubeId,
                duration: v.duration || 3600,
                category: v.category || ((v.duration || 3600) < 1200 ? 'clip' : 'liveset'),
                blockTitle: b.title || b.name || 'Bloc TV'
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

    // ─── Bibliothèque TV (240 vidéos toujours prêtes) ──────────────────────────
    const [tvBlocks, setTvBlocks] = useState<TVBlock[]>(getInitialTVBlocks);
    const [isTVLibOpen, setIsTVLibOpen] = useState(true);
    const [tvSearch, setTvSearch] = useState('');
    const [tvFilter, setTvFilter] = useState<'all' | 'liveset' | 'clip'>('all');
    const [tvSelectedBlockId, setTvSelectedBlockId] = useState<string>('all');

    // ─── Drag and Drop ────────────────────────────────────────────────────────
    const [draggingVideo, setDraggingVideo] = useState<TVVideoItem | null>(null);
    const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
    const [isDragOverMainArea, setIsDragOverMainArea] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'warn' | 'info' } | null>(null);

    // ─── Modal de Confirmation Dropsiders (Remplace les popups browser) ──────
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

    // ─── Formulaire nouvelle piste manuelle (rétractable) ─────────────────────
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [trackUrl, setTrackUrl] = useState('');
    const [trackTitle, setTrackTitle] = useState('');
    const [trackArtist, setTrackArtist] = useState('');
    const [trackCategory, setTrackCategory] = useState<'liveset' | 'clip'>('liveset');
    const [trackDuration, setTrackDuration] = useState('60');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // ─── Edition émission ─────────────────────────────────────────────────────
    const [isEditingBlock, setIsEditingBlock] = useState(false);
    const [editBlockForm, setEditBlockForm] = useState({
        title: '',
        emoji: '🎧',
        color: PRESET_COLORS[0].hex,
        startHour: 0,
        endHour: 4,
        days: ALL_DAYS,
        randomize: true,
    });

    // ─── Sauvegarde ───────────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // ─── Chargement depuis l'API ──────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
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
                            emoji: b.emoji || '📺',
                            timeSlot: b.timeSlot || '',
                            videos: (b.videos || []).map((v: any) => ({
                                id: v.id || v.youtubeId,
                                title: v.title,
                                youtubeId: v.youtubeId,
                                duration: v.duration || 3600,
                                category: v.category || ((v.duration || 3600) < 1200 ? 'clip' : 'liveset'),
                                blockTitle: b.title || b.name || 'Bloc TV'
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

    // Total vidéos TV
    const totalTVVideos = useMemo(() => {
        return tvBlocks.reduce((acc, b) => acc + b.videos.length, 0);
    }, [tvBlocks]);

    // Notification toast Dropsiders
    const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ─── Actions émissions ────────────────────────────────────────────────────
    const openNewBlockForm = () => {
        setEditBlockForm({
            title: `ÉMISSION ${blocks.length + 1}`,
            emoji: PRESET_EMOJIS[blocks.length % PRESET_EMOJIS.length],
            color: PRESET_COLORS[blocks.length % PRESET_COLORS.length].hex,
            startHour: (blocks.length * 4) % 24,
            endHour: ((blocks.length * 4) + 4) % 24 || 24,
            days: ALL_DAYS,
            randomize: true,
        });
        setIsEditingBlock(true);
    };

    const openEditBlockForm = (block: RadioScheduleBlock) => {
        setEditBlockForm({
            title: block.title,
            emoji: block.emoji,
            color: block.color,
            startHour: block.startHour,
            endHour: block.endHour,
            days: block.days || ALL_DAYS,
            randomize: block.randomize,
        });
        setIsEditingBlock(true);
    };

    const handleSaveBlock = () => {
        if (!editBlockForm.title.trim()) {
            showToast('Donnez un nom à votre émission', 'warn');
            return;
        }

        if (selectedBlockId && isEditingBlock && blocks.find(b => b.id === selectedBlockId)) {
            const updated = blocks.map(b => {
                if (b.id !== selectedBlockId) return b;
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
                    timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour),
                };
            });
            setBlocks(sortRadioBlocksByBroadcastOrder(updated, true));
            showToast(`Émission « ${editBlockForm.title} » mise à jour`);
        } else {
            const newId = `radio_bloc_${Date.now()}`;
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
            };
            const updated = sortRadioBlocksByBroadcastOrder([...blocks, newBlock], true);
            setBlocks(updated);
            setSelectedBlockId(newId);
            showToast(`Émission « ${newBlock.title} » créée avec succès !`);
        }
        setIsEditingBlock(false);
    };

    // Suppression d'émission avec la modal Dropsiders ConfirmModal
    const handleDeleteBlock = (blockId: string) => {
        const blk = blocks.find(b => b.id === blockId);
        setConfirmModal({
            isOpen: true,
            title: "SUPPRIMER L'ÉMISSION",
            message: `Voulez-vous vraiment supprimer l'émission « ${blk?.title || 'sélectionnée'} » et la totalité de ses pistes ? Cette action est irréversible.`,
            type: 'danger',
            confirmText: 'SUPPRIMER',
            cancelText: 'ANNULER',
            onConfirm: () => {
                const updated = blocks.filter(b => b.id !== blockId);
                setBlocks(updated);
                if (selectedBlockId === blockId) {
                    setSelectedBlockId(updated[0]?.id || null);
                }
                showToast(`Émission « ${blk?.title || ''} » supprimée`);
            }
        });
    };

    // Suppression d'une piste avec ConfirmModal
    const handleDeleteTrack = (trackId: string, trackTitle?: string) => {
        if (!selectedBlock) return;
        setConfirmModal({
            isOpen: true,
            title: "RETIRER DE L'ÉMISSION",
            message: `Retirer « ${trackTitle || 'cette piste'} » de l'émission « ${selectedBlock.title} » ?`,
            type: 'warning',
            confirmText: 'RETIRER',
            cancelText: 'ANNULER',
            onConfirm: () => {
                setBlocks(prev => prev.map(b =>
                    b.id === selectedBlock.id
                        ? { ...b, tracks: (b.tracks || []).filter(t => t.id !== trackId) }
                        : b
                ));
                showToast('Piste retirée de l\'émission');
            }
        });
    };

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

    // ─── Import Vidéo TV vers Émission (Drag & Drop ou Clic) ───────────────────
    const handleImportFromTV = (vid: TVVideoItem, targetBlockId?: string | null) => {
        const blockId = targetBlockId || selectedBlockId;
        if (!blockId) {
            showToast('Sélectionnez ou créez d\'abord une émission', 'warn');
            return;
        }

        const target = blocks.find(b => b.id === blockId);
        if (!target) return;

        const alreadyIn = target.tracks?.some(t => t.youtubeId === vid.youtubeId);
        if (alreadyIn) {
            showToast(`« ${vid.title.slice(0, 28)}... » est déjà dans cette émission`, 'info');
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

        setBlocks(prev => prev.map(b =>
            b.id === blockId
                ? { ...b, tracks: [...(b.tracks || []), newTrack] }
                : b
        ));

        if (selectedBlockId !== blockId) {
            setSelectedBlockId(blockId);
        }

        showToast(`✨ Ajouté à « ${target.title} » : ${newTrack.artist} - ${newTrack.title}`);
    };

    const handleImportAllFromTVBlock = (tvBlock: TVBlock) => {
        if (!selectedBlock) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        const currentIds = new Set((selectedBlock.tracks || []).map(t => t.youtubeId));
        const toAdd: RadioTrackItem[] = tvBlock.videos
            .filter(v => !currentIds.has(v.youtubeId))
            .map(v => {
                const { artist, event } = parseArtistAndEvent(v.title);
                return {
                    id: `rt_tv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    title: event || v.title,
                    artist: artist || 'Artiste',
                    youtubeId: v.youtubeId,
                    duration: v.duration || (v.category === 'clip' ? 240 : 3600),
                    category: v.category === 'clip' ? 'clip' : 'liveset',
                    addedAt: Date.now(),
                };
            });

        if (toAdd.length === 0) {
            showToast('Toutes les vidéos de ce bloc sont déjà ajoutées', 'info');
            return;
        }

        setBlocks(prev => prev.map(b =>
            b.id === selectedBlock.id
                ? { ...b, tracks: [...(b.tracks || []), ...toAdd] }
                : b
        ));
        showToast(`🎉 ${toAdd.length} vidéos importées dans « ${selectedBlock.title} » !`);
    };

    // ─── Ajout manuel URL YouTube ─────────────────────────────────────────────
    const handleFetchYouTube = async () => {
        const ytid = extractYouTubeId(trackUrl);
        if (!ytid) {
            showToast('Lien YouTube non valide', 'warn');
            return;
        }
        setIsFetchingTitle(true);
        try {
            const fetched = await fetchYouTubeTitle(ytid);
            if (fetched) {
                const { artist, event } = parseArtistAndEvent(fetched);
                setTrackArtist(artist || '');
                setTrackTitle(event || fetched);
            }
        } catch (e) {
            console.error('Erreur titre:', e);
        } finally {
            setIsFetchingTitle(false);
        }
    };

    const handleAddManualTrack = () => {
        const ytid = extractYouTubeId(trackUrl);
        if (!ytid) {
            showToast('Lien YouTube non valide', 'warn');
            return;
        }
        if (!selectedBlock) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }

        const durSec = Math.max(30, (parseInt(trackDuration, 10) || 60) * 60);
        const newTrack: RadioTrackItem = {
            id: `rt_${Date.now()}`,
            title: trackTitle.trim() || 'Piste Radio',
            artist: trackArtist.trim() || 'Artiste',
            youtubeId: ytid,
            duration: durSec,
            category: trackCategory,
            addedAt: Date.now(),
        };

        setBlocks(prev => prev.map(b =>
            b.id === selectedBlock.id
                ? { ...b, tracks: [...(b.tracks || []), newTrack] }
                : b
        ));
        setTrackUrl('');
        setTrackTitle('');
        setTrackArtist('');
        setTrackDuration(trackCategory === 'clip' ? '4' : '60');
        setShowManualAdd(false);
        showToast(`Ajouté : ${newTrack.artist} - ${newTrack.title}`);
    };

    const handleMoveTrack = (index: number, dir: 'up' | 'down') => {
        if (!selectedBlock) return;
        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlock.id) return b;
            const list = [...(b.tracks || [])];
            const targetIdx = dir === 'up' ? index - 1 : index + 1;
            if (targetIdx < 0 || targetIdx >= list.length) return b;
            [list[index], list[targetIdx]] = [list[targetIdx], list[index]];
            return { ...b, tracks: list };
        }));
    };

    // ─── Sauvegarde globale ───────────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(blocks));
            const flatTracks = blocks.flatMap(b => b.tracks || []);
            await apiFetch('/api/settings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ radio_blocks: blocks, radio_tracks: flatTracks }),
            });
            window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            setSaveSuccess(true);
            showToast('Programmation radio enregistrée');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error('Erreur sauvegarde radio:', e);
            showToast('Erreur sauvegarde. Données gardées en local.', 'warn');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Vidéos TV filtrées pour la bibliothèque ──────────────────────────────
    const filteredTVVideos = useMemo(() => {
        const q = tvSearch.toLowerCase().trim();
        const result: TVVideoItem[] = [];

        tvBlocks.forEach(b => {
            if (tvSelectedBlockId !== 'all' && b.id !== tvSelectedBlockId) return;
            b.videos.forEach(v => {
                if (tvFilter !== 'all' && v.category !== tvFilter) return;
                if (q) {
                    const matchTitle = v.title.toLowerCase().includes(q);
                    const matchYt = v.youtubeId.toLowerCase().includes(q);
                    if (!matchTitle && !matchYt) return;
                }
                result.push({ ...v, blockTitle: b.title });
            });
        });

        return result;
    }, [tvBlocks, tvSearch, tvFilter, tvSelectedBlockId]);

    const totalTracks = useMemo(() => blocks.reduce((acc, b) => acc + (b.tracks?.length || 0), 0), [blocks]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-xl"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-[#07080c]/98 backdrop-blur-3xl border border-white/10 rounded-3xl w-[99vw] max-w-[1540px] h-[95vh] shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col font-sans"
                >
                    {/* Ligne néon Dropsiders Signature en haut */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-purple-500 to-neon-red shadow-[0_0_15px_rgba(0,240,255,0.6)]" />

                    {/* Lueur d'ambiance Dropsiders */}
                    <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-neon-cyan/5 blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

                    {/* ── TOAST NOTIFICATION DROPSIDERS ───────────────────── */}
                    <AnimatePresence>
                        {toastMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -25, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -25, scale: 0.95 }}
                                className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl backdrop-blur-xl flex items-center gap-3 font-display font-black italic uppercase tracking-wider text-xs shadow-2xl border ${
                                    toastMessage.type === 'warn'
                                        ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                                        : toastMessage.type === 'info'
                                            ? 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                                            : 'bg-[#0a0f16]/95 border-neon-cyan/50 text-white shadow-[0_0_30px_rgba(0,240,255,0.4)]'
                                }`}
                            >
                                <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
                                <span>{toastMessage.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── HEADER DROPSIDERS ───────────────────────────────── */}
                    <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 shrink-0 bg-black/40">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-purple-600/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                                <Radio className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-display font-black text-white uppercase italic tracking-tighter leading-tight flex items-center gap-2.5">
                                    DROPSIDERS <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-purple-400 to-neon-red">RADIO</span>
                                    <span className="text-[10px] font-mono normal-case not-italic text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                                        {blocks.length} émission{blocks.length !== 1 ? 's' : ''} · {totalTracks} titre{totalTracks !== 1 ? 's' : ''}
                                    </span>
                                </h2>
                                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>Programmation Radio</span>
                                    <span className="text-white/20">|</span>
                                    <span className="text-purple-400 font-bold">Archives TV · {totalTVVideos} Vidéos</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {/* Volet Bibliothèque TV */}
                            <button
                                type="button"
                                onClick={() => setIsTVLibOpen(!isTVLibOpen)}
                                className={`px-3.5 py-2 rounded-xl text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                                    isTVLibOpen
                                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Tv className="w-3.5 h-3.5 text-purple-400" />
                                <span>Bibliothèque TV ({totalTVVideos})</span>
                                {isTVLibOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                            </button>

                            {/* Statut Radio Live */}
                            <button
                                type="button"
                                onClick={onToggleRadio}
                                className={`px-3.5 py-2 rounded-xl text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
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
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-5 py-2 rounded-xl text-[11px] font-display font-black uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                    saveSuccess
                                        ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                        : 'bg-neon-cyan text-black hover:bg-white shadow-[0_0_25px_rgba(0,240,255,0.4)]'
                                }`}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Enregistrement...' : saveSuccess ? 'Sauvegardé !' : 'Sauvegarder'}
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>

                    {/* ── CORPS DE LA MODALE (3 COLONNES) ─────────────────── */}
                    <div className="flex flex-1 overflow-hidden min-h-0">

                        {/* ═════════════════════════════════════════════════════
                            COLONNE 1 : ÉMISSIONS RADIO (Gauches)
                        ═════════════════════════════════════════════════════ */}
                        <div className="w-68 shrink-0 border-r border-white/10 flex flex-col bg-black/30">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                                <span className="text-[10px] font-display font-black uppercase italic tracking-wider text-gray-300 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-neon-cyan" />
                                    Émissions ({blocks.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={openNewBlockForm}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan text-neon-cyan hover:text-black border border-neon-cyan/40 text-[9px] font-display font-black uppercase italic tracking-wider transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Créer
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                                {blocks.length === 0 && !isEditingBlock && (
                                    <div className="p-6 text-center text-gray-500">
                                        <Radio className="w-10 h-10 mx-auto mb-2 text-gray-600 opacity-40" />
                                        <p className="font-display font-black uppercase italic text-xs text-gray-300">Aucune émission</p>
                                        <p className="text-[10px] mt-1 text-gray-500">Cliquez sur « Créer » pour configurer votre premier créneau radio.</p>
                                    </div>
                                )}

                                {blocks.map(b => {
                                    const isSelected = b.id === selectedBlockId;
                                    const isLive = liveBlockNow.id === b.id;
                                    const isDragTarget = dragOverBlockId === b.id;

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
                                                setDraggingVideo(null);
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
                                            className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer group relative ${
                                                isDragTarget
                                                    ? 'bg-neon-cyan/25 border-neon-cyan ring-2 ring-neon-cyan shadow-[0_0_25px_rgba(0,240,255,0.5)] scale-[1.02]'
                                                    : isSelected
                                                        ? 'bg-white/[0.08] border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                                                        : 'bg-[#0d0e15]/70 border-white/5 hover:border-white/20 hover:bg-[#121420]'
                                            }`}
                                            style={{ borderLeftColor: b.color, borderLeftWidth: 4 }}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="text-xl leading-none">{b.emoji}</span>
                                                <div className="flex items-center gap-1.5">
                                                    {isLive && (
                                                        <span className="text-[8px] font-display font-black uppercase italic px-1.5 py-0.5 rounded-full bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse">
                                                            ON AIR
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={e => { e.stopPropagation(); setSelectedBlockId(b.id); openEditBlockForm(b); }}
                                                        className="p-1 rounded-lg text-gray-500 hover:text-neon-cyan hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                        title="Paramètres de l'émission"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={e => { e.stopPropagation(); handleDeleteBlock(b.id); }}
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
                                                <span className="text-[8.5px] font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/20">
                                                    {b.tracks?.length || 0} piste{(b.tracks?.length || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Hover Drag & Drop Indicator */}
                                            {isDragTarget && (
                                                <div className="absolute inset-0 bg-neon-cyan/30 rounded-2xl backdrop-blur-[2px] flex items-center justify-center font-display font-black italic text-xs text-white uppercase tracking-wider border-2 border-neon-cyan animate-pulse">
                                                    + Déposer ici
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-3 border-t border-white/10 text-center bg-black/40">
                                <p className="text-[8.5px] font-mono text-gray-500 uppercase tracking-wider">
                                    💡 Déposez directement sur une émission
                                </p>
                            </div>
                        </div>

                        {/* ═════════════════════════════════════════════════════
                            COLONNE 2 : L'ÉMISSION SÉLECTIONNÉE (Centre)
                        ═════════════════════════════════════════════════════ */}
                        <div className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-[#08090d]/60">

                            {/* ── FORMULAIRE ÉDITION ÉMISSION DROPSIDERS ── */}
                            {isEditingBlock && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="m-5 p-6 rounded-3xl bg-[#0c0d16] border border-neon-cyan/40 space-y-5 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2.5">
                                            <Radio className="w-5 h-5 text-neon-cyan" />
                                            {selectedBlockId && blocks.find(b => b.id === selectedBlockId)
                                                ? 'MODIFIER L\'ÉMISSION'
                                                : 'CRÉER UNE NOUVELLE ÉMISSION'
                                            }
                                        </h3>
                                        <button type="button" onClick={() => setIsEditingBlock(false)} className="text-gray-500 hover:text-white cursor-pointer">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Emoji + Nom + Couleur */}
                                    <div className="flex items-start gap-4">
                                        <div className="relative group shrink-0">
                                            <button
                                                type="button"
                                                className="text-2xl w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                {editBlockForm.emoji}
                                            </button>
                                            <div className="absolute top-full left-0 mt-2 p-2 bg-[#121422] border border-white/20 rounded-2xl grid grid-cols-7 gap-1.5 shadow-2xl z-40 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                                                {PRESET_EMOJIS.map(em => (
                                                    <button
                                                        key={em}
                                                        type="button"
                                                        onClick={() => setEditBlockForm(f => ({ ...f, emoji: em }))}
                                                        className="text-lg p-1.5 hover:bg-white/10 rounded-xl cursor-pointer"
                                                    >{em}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider">Nom de l'émission</label>
                                            <input
                                                type="text"
                                                value={editBlockForm.title}
                                                onChange={e => setEditBlockForm(f => ({ ...f, title: e.target.value }))}
                                                placeholder="EX: TECHNO BUNKER, MORNING GROOVE..."
                                                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white font-display font-black text-base uppercase italic tracking-wide focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan placeholder:text-gray-600"
                                            />
                                        </div>

                                        <div className="shrink-0 space-y-1.5">
                                            <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block">Couleur néon</label>
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
                                                className="rounded accent-neon-cyan w-4 h-4"
                                            />
                                            <Shuffle className="w-3.5 h-3.5 text-neon-cyan" />
                                            <span className="text-[10px] font-display font-black text-gray-300 uppercase italic">Lecture Aléatoire (Shuffle)</span>
                                        </label>
                                    </div>

                                    {/* Jours */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-2.5">
                                            <span className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider">Jours de diffusion :</span>
                                            <button type="button" onClick={() => setEditBlockForm(f => ({ ...f, days: ALL_DAYS }))} className="text-[10px] font-mono text-neon-cyan hover:underline cursor-pointer">7j/7</button>
                                            <span className="text-gray-600">·</span>
                                            <button type="button" onClick={() => setEditBlockForm(f => ({ ...f, days: WEEKDAYS }))} className="text-[10px] font-mono text-neon-cyan hover:underline cursor-pointer">Semaine</button>
                                            <span className="text-gray-600">·</span>
                                            <button type="button" onClick={() => setEditBlockForm(f => ({ ...f, days: WEEKEND_DAYS }))} className="text-[10px] font-mono text-neon-cyan hover:underline cursor-pointer">Week-end</button>
                                        </div>
                                        <div className="flex gap-2">
                                            {DAYS_OF_WEEK.map(d => {
                                                const active = editBlockForm.days.includes(d.value);
                                                return (
                                                    <button
                                                        key={d.value}
                                                        type="button"
                                                        onClick={() => handleToggleDay(d.value)}
                                                        className={`w-11 h-11 rounded-2xl text-[11px] font-display font-black uppercase italic flex items-center justify-center transition-all cursor-pointer ${
                                                            active
                                                                ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105'
                                                                : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {d.short.slice(0, 3)}
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
                                            Enregistrer l'émission
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
                                        DROPSIDERS RADIO MANAGER
                                    </h3>
                                    <p className="text-gray-400 text-xs max-w-md font-sans leading-relaxed">
                                        Créez vos émissions et glissez-déposez simplement les clips et livesets TV de la bibliothèque à droite pour composer votre grille 24/7.
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

                            {/* ── ÉMISSION SÉLECTIONNÉE DROPSIDERS ── */}
                            {selectedBlock && !isEditingBlock && (
                                <div className="flex flex-col flex-1 min-h-0">

                                    {/* Header de l'émission */}
                                    <div
                                        className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]"
                                        style={{ borderLeftColor: selectedBlock.color, borderLeftWidth: 5 }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl">{selectedBlock.emoji}</span>
                                            <div>
                                                <h3 className="text-lg font-display font-black text-white uppercase italic tracking-tight leading-tight">
                                                    {selectedBlock.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-mono text-gray-400">{selectedBlock.timeSlot}</span>
                                                    <span className="text-gray-600">·</span>
                                                    <span className="text-[10px] font-mono text-gray-400">
                                                        {selectedBlock.days && selectedBlock.days.length === 7
                                                            ? '7j/7'
                                                            : DAYS_OF_WEEK.filter(d => isRadioBlockActiveOnDay(selectedBlock, d.value)).map(d => d.short.slice(0, 3)).join(', ')
                                                        }
                                                    </span>
                                                    <span className="text-gray-600">·</span>
                                                    <span className="text-[10px] font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/20">
                                                        {selectedBlock.tracks?.length || 0} piste{(selectedBlock.tracks?.length || 0) !== 1 ? 's' : ''}
                                                    </span>
                                                    {selectedBlock.randomize && (
                                                        <span className="text-[9px] font-display font-black uppercase italic text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30 flex items-center gap-1">
                                                            <Shuffle className="w-2.5 h-2.5" /> Aléatoire
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setShowManualAdd(!showManualAdd)}
                                                className={`px-3.5 py-2 rounded-xl text-[10px] font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                                                    showManualAdd
                                                        ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan'
                                                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Ajout par URL
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openEditBlockForm(selectedBlock)}
                                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[10px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Modifier
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── ZONE DE DROP DROPSIDERS (Glisser-Déposer les vidéos TV) ── */}
                                    <div className="p-5 pb-2 shrink-0">
                                        <div
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'copy';
                                                setIsDragOverMainArea(true);
                                            }}
                                            onDragLeave={(e) => {
                                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                    setIsDragOverMainArea(false);
                                                }
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragOverMainArea(false);
                                                setDraggingVideo(null);
                                                try {
                                                    const raw = e.dataTransfer.getData('application/json');
                                                    if (raw) {
                                                        const vid = JSON.parse(raw);
                                                        handleImportFromTV(vid, selectedBlock.id);
                                                    }
                                                } catch (err) {
                                                    console.error('Erreur drop zone:', err);
                                                }
                                            }}
                                            className={`p-5 rounded-3xl border-2 border-dashed transition-all flex items-center justify-between gap-5 relative overflow-hidden ${
                                                isDragOverMainArea
                                                    ? 'border-neon-cyan bg-neon-cyan/20 shadow-[0_0_40px_rgba(0,240,255,0.4)] scale-[1.01]'
                                                    : draggingVideo
                                                        ? 'border-neon-cyan/60 bg-neon-cyan/10 animate-pulse shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                                                        : 'border-white/15 bg-gradient-to-r from-white/[0.02] to-transparent hover:border-white/25 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                    isDragOverMainArea
                                                        ? 'bg-neon-cyan text-black scale-110 shadow-[0_0_20px_rgba(0,240,255,0.6)]'
                                                        : 'bg-white/5 text-neon-cyan border border-white/10'
                                                }`}>
                                                    <Tv className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-display font-black text-white uppercase italic tracking-tight">
                                                        {isDragOverMainArea ? 'LÂCHEZ LA VIDÉO ICI POUR L\'AJOUTER !' : 'GLISSER-DÉPOSER DES VIDÉOS TV ICI'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 font-sans">
                                                        Sélectionnez une vidéo dans la bibliothèque à droite et glissez-la directement dans cette zone.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="text-[9px] font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-3 py-1.5 rounded-xl border border-neon-cyan/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
                                                    {totalTVVideos} VIDÉOS TV PRÊTES
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── FORMULAIRE AJOUT MANUEL PAR URL (Optionnel rétractable) ── */}
                                    {showManualAdd && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="px-5 pb-3 shrink-0"
                                        >
                                            <div className="p-4 rounded-3xl bg-[#0c0d16] border border-white/15 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider">Ajouter manuellement une vidéo YouTube :</span>
                                                    <button type="button" onClick={() => setShowManualAdd(false)} className="text-gray-500 hover:text-white text-xs cursor-pointer">×</button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                    <div className="md:col-span-4 space-y-1">
                                                        <label className="text-[9px] font-mono text-gray-400 uppercase">Lien YouTube</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={trackUrl}
                                                                onChange={e => setTrackUrl(e.target.value)}
                                                                placeholder="https://youtube.com/watch?v=..."
                                                                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleFetchYouTube}
                                                                disabled={isFetchingTitle || !trackUrl}
                                                                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[9px] font-display font-black uppercase italic disabled:opacity-40 transition-all whitespace-nowrap cursor-pointer"
                                                            >
                                                                {isFetchingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Auto'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-3 space-y-1">
                                                        <label className="text-[9px] font-mono text-gray-400 uppercase">Artiste</label>
                                                        <input
                                                            type="text"
                                                            value={trackArtist}
                                                            onChange={e => setTrackArtist(e.target.value)}
                                                            placeholder="Ex: David Guetta..."
                                                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3 space-y-1">
                                                        <label className="text-[9px] font-mono text-gray-400 uppercase">Titre</label>
                                                        <input
                                                            type="text"
                                                            value={trackTitle}
                                                            onChange={e => setTrackTitle(e.target.value)}
                                                            placeholder="Ex: Live @ Tomorrowland..."
                                                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex items-end">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddManualTrack}
                                                            disabled={!trackUrl}
                                                            className="w-full py-2.5 rounded-xl bg-neon-cyan text-black text-[10px] font-display font-black uppercase italic disabled:opacity-40 hover:bg-white transition-all cursor-pointer"
                                                        >
                                                            + Ajouter
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ── LISTE DES PISTES ACTUELLES DE L'ÉMISSION ── */}
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'copy';
                                            setIsDragOverMainArea(true);
                                        }}
                                        onDragLeave={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                setIsDragOverMainArea(false);
                                            }
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragOverMainArea(false);
                                            setDraggingVideo(null);
                                            try {
                                                const raw = e.dataTransfer.getData('application/json');
                                                if (raw) {
                                                    const vid = JSON.parse(raw);
                                                    handleImportFromTV(vid, selectedBlock.id);
                                                }
                                            } catch (err) {
                                                console.error('Erreur drop piste:', err);
                                            }
                                        }}
                                        className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-display font-black uppercase italic tracking-wider text-gray-400 flex items-center gap-2">
                                                <Music2 className="w-3.5 h-3.5 text-neon-cyan" />
                                                PISTES DE L'ÉMISSION ({selectedBlock.tracks?.length || 0})
                                            </span>
                                            {(selectedBlock.tracks?.length || 0) > 0 && (
                                                <span className="text-[10px] font-mono text-gray-400">
                                                    Durée totale : <strong className="text-white">{formatDurationExact((selectedBlock.tracks || []).reduce((acc, t) => acc + (t.duration || 3600), 0))}</strong>
                                                </span>
                                            )}
                                        </div>

                                        {(!selectedBlock.tracks || selectedBlock.tracks.length === 0) ? (
                                            <div className="p-12 rounded-3xl bg-white/[0.01] border border-white/5 text-center flex flex-col items-center justify-center">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3 text-gray-500">
                                                    <Play className="w-7 h-7 text-gray-500" />
                                                </div>
                                                <p className="text-white font-display font-black text-sm uppercase italic">Cette émission est encore vide</p>
                                                <p className="text-gray-400 text-xs mt-1 max-w-sm font-sans">
                                                    Glissez une des 240 vidéos depuis la bibliothèque TV à droite pour composer votre playlist.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 pb-6">
                                                {selectedBlock.tracks.map((track, idx) => (
                                                    <div
                                                        key={track.id}
                                                        className="p-2.5 rounded-2xl bg-[#0d0e16]/80 hover:bg-[#131522] border border-white/5 hover:border-neon-cyan/30 flex items-center gap-3.5 transition-all group shadow-sm"
                                                    >
                                                        {/* Numéro + Réordonner */}
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className="text-[10px] font-mono font-bold text-neon-cyan/70 w-5 text-center">{idx + 1}</span>
                                                            <div className="flex flex-col gap-0.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveTrack(idx, 'up')}
                                                                    disabled={idx === 0}
                                                                    className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                                                                    title="Monter"
                                                                >
                                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveTrack(idx, 'down')}
                                                                    disabled={idx === (selectedBlock.tracks?.length || 0) - 1}
                                                                    className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                                                                    title="Descendre"
                                                                >
                                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Miniature YouTube */}
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                                                                alt=""
                                                                className="w-14 h-9 rounded-xl object-cover bg-black border border-white/10"
                                                            />
                                                            <span className="absolute bottom-0.5 right-0.5 text-[7.5px] font-mono bg-black/85 px-1 rounded text-gray-300">
                                                                {formatDurationExact(track.duration || 3600)}
                                                            </span>
                                                        </div>

                                                        {/* Titre & Artiste */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className={`text-[7.5px] font-display font-black uppercase italic px-1.5 py-0.5 rounded-md ${
                                                                    track.category === 'clip'
                                                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                                }`}>
                                                                    {track.category === 'clip' ? 'CLIP' : 'SET'}
                                                                </span>
                                                                <h5 className="text-xs font-display font-black text-white uppercase italic truncate">{track.artist}</h5>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 truncate font-sans">{track.title}</p>
                                                        </div>

                                                        {/* Durée & Actions */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <a
                                                                href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                                                title="Voir sur YouTube"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTrack(track.id, `${track.artist} - ${track.title}`)}
                                                                className="p-1.5 rounded-xl bg-white/5 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                                                title="Retirer de l'émission"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ═════════════════════════════════════════════════════
                            COLONNE 3 : BIBLIOTHÈQUE TV (240 VIDÉOS) (Droite)
                        ═════════════════════════════════════════════════════ */}
                        {isTVLibOpen && (
                            <div className="w-96 shrink-0 border-l border-white/10 flex flex-col bg-[#0b0c14]/95">
                                {/* Header bibliothèque */}
                                <div className="p-4 border-b border-white/10 space-y-3 bg-black/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Tv className="w-4 h-4 text-purple-400" />
                                            <div>
                                                <h4 className="text-xs font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                                    BIBLIOTHÈQUE TV
                                                    <span className="text-[9px] font-mono normal-case not-italic px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        {totalTVVideos} vidéos
                                                    </span>
                                                </h4>
                                            </div>
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

                                    {/* Indication Glisser-Déposer */}
                                    <div className="p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-[9.5px] text-purple-200 flex items-center gap-2.5 font-sans leading-tight shadow-sm">
                                        <GripVertical className="w-4 h-4 text-purple-400 shrink-0" />
                                        <span>
                                            <strong>Glisser-déposer :</strong> attrapez une vidéo ci-dessous et déposez-la dans votre émission au centre.
                                        </span>
                                    </div>

                                    {/* Barre de recherche */}
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            value={tvSearch}
                                            onChange={e => setTvSearch(e.target.value)}
                                            placeholder="Rechercher par DJ, titre..."
                                            className="w-full pl-9 pr-7 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
                                        />
                                        {tvSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setTvSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>

                                    {/* Filtres Type (Tous, Sets, Clips) & Filtre par bloc TV */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {(['all', 'liveset', 'clip'] as const).map(f => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setTvFilter(f)}
                                                className={`px-2.5 py-1 rounded-xl text-[9px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer ${
                                                    tvFilter === f
                                                        ? f === 'all' ? 'bg-white text-black' : f === 'liveset' ? 'bg-cyan-400 text-black' : 'bg-purple-500 text-white'
                                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                {f === 'all' ? 'Tous' : f === 'liveset' ? 'Sets' : 'Clips'}
                                            </button>
                                        ))}

                                        {/* Dropdown choix de bloc source */}
                                        <select
                                            value={tvSelectedBlockId}
                                            onChange={e => setTvSelectedBlockId(e.target.value)}
                                            className="ml-auto px-2.5 py-1 rounded-xl bg-[#14141e] border border-white/15 text-white text-[9px] font-mono cursor-pointer max-w-[145px] truncate"
                                        >
                                            <option value="all">Tous les blocs TV</option>
                                            {tvBlocks.map(tb => (
                                                <option key={tb.id} value={tb.id}>
                                                    {tb.emoji} {tb.title} ({tb.videos.length})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Bouton pour tout importer si un bloc spécifique est filtré */}
                                    {tvSelectedBlockId !== 'all' && selectedBlock && (
                                        <div className="pt-1">
                                            {(() => {
                                                const currentTB = tvBlocks.find(b => b.id === tvSelectedBlockId);
                                                if (!currentTB) return null;
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImportAllFromTVBlock(currentTB)}
                                                        className="w-full py-2 rounded-2xl bg-purple-600/25 hover:bg-purple-600 border border-purple-500/40 text-purple-200 hover:text-white text-[9.5px] font-display font-black uppercase italic tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                                    >
                                                        <Film className="w-3.5 h-3.5" />
                                                        Tout importer ({currentTB.videos.length} vidéos) dans « {selectedBlock.title} »
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Liste des vidéos TV (Draggables) */}
                                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                                    <div className="px-1 text-[9px] font-mono text-gray-500 mb-1 flex items-center justify-between">
                                        <span>{filteredTVVideos.length} vidéo{filteredTVVideos.length !== 1 ? 's' : ''}</span>
                                        <span>Glissez vers le centre ➡️</span>
                                    </div>

                                    {filteredTVVideos.length === 0 ? (
                                        <div className="text-center text-gray-500 text-xs py-8">
                                            Aucune vidéo ne correspond à votre recherche.
                                        </div>
                                    ) : (
                                        filteredTVVideos.map(vid => {
                                            const isAlreadyInSelected = selectedBlock?.tracks?.some(t => t.youtubeId === vid.youtubeId);
                                            const isBeingDragged = draggingVideo?.id === vid.id;

                                            return (
                                                <div
                                                    key={vid.id}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('application/json', JSON.stringify(vid));
                                                        e.dataTransfer.setData('text/plain', vid.id);
                                                        e.dataTransfer.effectAllowed = 'copy';
                                                        setDraggingVideo(vid);
                                                    }}
                                                    onDragEnd={() => {
                                                        setDraggingVideo(null);
                                                        setDragOverBlockId(null);
                                                        setIsDragOverMainArea(false);
                                                    }}
                                                    className={`p-2.5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing flex items-center gap-2.5 group relative select-none ${
                                                        isBeingDragged
                                                            ? 'opacity-40 border-dashed border-neon-cyan'
                                                            : isAlreadyInSelected
                                                                ? 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/40'
                                                                : 'bg-black/40 border-white/5 hover:border-neon-cyan/50 hover:bg-white/[0.04]'
                                                    }`}
                                                >
                                                    {/* Poignée de drag */}
                                                    <div className="text-gray-600 group-hover:text-neon-cyan shrink-0 transition-colors">
                                                        <GripVertical className="w-4 h-4" />
                                                    </div>

                                                    {/* Miniature */}
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={`https://img.youtube.com/vi/${vid.youtubeId}/default.jpg`}
                                                            alt=""
                                                            className="w-13 h-8.5 rounded-xl object-cover bg-black border border-white/10"
                                                        />
                                                        <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono bg-black/85 px-1 rounded text-gray-300">
                                                            {formatDurationExact(vid.duration || 3600)}
                                                        </span>
                                                    </div>

                                                    {/* Titre & Bloc d'origine */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10.5px] font-display font-black text-white italic uppercase truncate leading-tight group-hover:text-neon-cyan transition-colors">
                                                            {vid.title}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className={`text-[7px] font-display font-black uppercase italic px-1.5 py-0.2 rounded ${
                                                                vid.category === 'clip'
                                                                    ? 'bg-purple-500/20 text-purple-300'
                                                                    : 'bg-cyan-500/20 text-cyan-300'
                                                            }`}>
                                                                {vid.category === 'clip' ? 'CLIP' : 'SET'}
                                                            </span>
                                                            {vid.blockTitle && (
                                                                <span className="text-[8px] text-gray-500 truncate font-mono">
                                                                    {vid.blockTitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Bouton Ajouter (+) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImportFromTV(vid, selectedBlockId)}
                                                        className={`shrink-0 p-1.5 rounded-xl transition-all cursor-pointer ${
                                                            isAlreadyInSelected
                                                                ? 'text-emerald-400 hover:bg-emerald-500/20'
                                                                : 'bg-white/5 hover:bg-neon-cyan hover:text-black text-gray-300'
                                                        }`}
                                                        title={isAlreadyInSelected ? "Déjà dans l'émission (cliquez pour ajouter à nouveau)" : "Ajouter à l'émission sélectionnée"}
                                                    >
                                                        {isAlreadyInSelected ? (
                                                            <Check className="w-4 h-4 text-emerald-400" />
                                                        ) : (
                                                            <Plus className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ── MODALE DE CONFIRMATION DROPSIDERS (ConfirmModal) ── */}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    type={confirmModal.type}
                    confirmText={confirmModal.confirmText}
                    cancelText={confirmModal.cancelText}
                    onConfirm={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                />
            </div>
        </AnimatePresence>
    );
}
