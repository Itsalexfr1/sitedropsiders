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
    Filter
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';
import { apiFetch } from '../../../utils/auth';
import defaultSettings from '../../../data/settings.json';
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
    { hex: '#06b6d4' }, // cyan
    { hex: '#8b5cf6' }, // violet
    { hex: '#f59e0b' }, // ambre
    { hex: '#10b981' }, // émeraude
    { hex: '#ff1241' }, // rouge
    { hex: '#ec4899' }, // rose
    { hex: '#3b82f6' }, // bleu
    { hex: '#f97316' }, // orange
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
    const [toastMessage, setToastMessage] = useState<string | null>(null);

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
                    // 1. Radio blocks
                    if (Array.isArray(data?.radio_blocks) && data.radio_blocks.length > 0) {
                        const sorted = sortRadioBlocksByBroadcastOrder(data.radio_blocks, true);
                        setBlocks(sorted);
                        if (!selectedBlockId && sorted.length > 0) {
                            setSelectedBlockId(sorted[0].id);
                        }
                    } else {
                        // Fallback localStorage
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

                    // 2. TV Blocks (si personnalisés en BDD, sinon garde les 240 par défaut)
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

    // Notification toast
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ─── Actions émissions ────────────────────────────────────────────────────
    const openNewBlockForm = () => {
        setEditBlockForm({
            title: `Émission ${blocks.length + 1}`,
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
            alert('Donnez un nom à votre émission.');
            return;
        }

        if (selectedBlockId && isEditingBlock && blocks.find(b => b.id === selectedBlockId)) {
            // Modification
            const updated = blocks.map(b => {
                if (b.id !== selectedBlockId) return b;
                return {
                    ...b,
                    title: editBlockForm.title.trim(),
                    name: editBlockForm.title.trim(),
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
            // Création
            const newId = `radio_bloc_${Date.now()}`;
            const newBlock: RadioScheduleBlock = {
                id: newId,
                name: editBlockForm.title.trim(),
                title: editBlockForm.title.trim(),
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
            showToast(`Émission « ${newBlock.title} » créée ! Glissez-y maintenant des vidéos.`);
        }
        setIsEditingBlock(false);
    };

    const handleDeleteBlock = (blockId: string) => {
        const blk = blocks.find(b => b.id === blockId);
        if (!confirm(`Supprimer l'émission « ${blk?.title || 'sélectionnée'} » et toutes ses pistes ?`)) return;
        const updated = blocks.filter(b => b.id !== blockId);
        setBlocks(updated);
        if (selectedBlockId === blockId) {
            setSelectedBlockId(updated[0]?.id || null);
        }
        showToast('Émission supprimée');
    };

    const handleToggleDay = (day: number) => {
        const current = editBlockForm.days;
        const has = current.includes(day);
        if (has && current.length <= 1) { alert("L'émission doit être diffusée au moins un jour."); return; }
        const next = has ? current.filter(d => d !== day) : [...current, day];
        setEditBlockForm(f => ({ ...f, days: next }));
    };

    // ─── Import Vidéo TV vers Émission (Drag & Drop ou Clic) ───────────────────
    const handleImportFromTV = (vid: TVVideoItem, targetBlockId?: string | null) => {
        const blockId = targetBlockId || selectedBlockId;
        if (!blockId) {
            alert('Veuillez d\'abord créer ou sélectionner une émission pour y ajouter cette vidéo.');
            return;
        }

        const target = blocks.find(b => b.id === blockId);
        if (!target) return;

        // Vérifier si déjà présente
        const alreadyIn = target.tracks?.some(t => t.youtubeId === vid.youtubeId);
        if (alreadyIn) {
            showToast(`⚠️ « ${vid.title.slice(0, 30)}... » est déjà dans « ${target.title} »`);
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

        // Si l'émission ciblée n'est pas celle affichée, basculer dessus
        if (selectedBlockId !== blockId) {
            setSelectedBlockId(blockId);
        }

        showToast(`✨ Ajouté à « ${target.title} » : ${newTrack.artist} - ${newTrack.title}`);
    };

    const handleImportAllFromTVBlock = (tvBlock: TVBlock) => {
        if (!selectedBlock) { alert('Sélectionnez d\'abord une émission'); return; }
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
            alert('Toutes les vidéos de ce bloc sont déjà présentes dans cette émission.');
            return;
        }

        setBlocks(prev => prev.map(b =>
            b.id === selectedBlock.id
                ? { ...b, tracks: [...(b.tracks || []), ...toAdd] }
                : b
        ));
        showToast(`🎉 ${toAdd.length} vidéos ajoutées à « ${selectedBlock.title} » !`);
    };

    // ─── Ajout manuel URL YouTube ─────────────────────────────────────────────
    const handleFetchYouTube = async () => {
        const ytid = extractYouTubeId(trackUrl);
        if (!ytid) { alert('Lien YouTube invalide'); return; }
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
        if (!ytid) { alert('Lien YouTube invalide'); return; }
        if (!selectedBlock) { alert('Sélectionnez une émission'); return; }

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

    const handleDeleteTrack = (trackId: string) => {
        if (!selectedBlock) return;
        setBlocks(prev => prev.map(b =>
            b.id === selectedBlock.id
                ? { ...b, tracks: (b.tracks || []).filter(t => t.id !== trackId) }
                : b
        ));
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
            showToast('💾 Programmation radio sauvegardée avec succès !');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error('Erreur sauvegarde radio:', e);
            alert('Erreur lors de la sauvegarde. Les données locales sont conservées.');
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
                className="fixed inset-0 z-[120] flex items-center justify-center p-2 bg-black/85 backdrop-blur-md"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 10 }}
                    className="bg-[#0b0c10]/98 backdrop-blur-2xl border border-white/10 rounded-2xl w-[99vw] max-w-[1500px] h-[95vh] shadow-2xl relative overflow-hidden flex flex-col font-sans"
                >
                    {/* Ligne néon supérieure */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-neon-cyan via-purple-600 to-neon-red" />

                    {/* ── TOAST NOTIFICATION ───────────────────────────────── */}
                    <AnimatePresence>
                        {toastMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-black/90 border border-neon-cyan/50 text-white text-xs font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-neon-cyan animate-spin" />
                                <span>{toastMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── HEADER MODAL ─────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                                <Radio className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-white uppercase italic tracking-tight leading-tight flex items-center gap-2">
                                    DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                                    <span className="text-[9px] font-normal normal-case tracking-normal text-gray-400 non-italic bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                        {blocks.length} émission{blocks.length !== 1 ? 's' : ''} · {totalTracks} piste{totalTracks !== 1 ? 's' : ''}
                                    </span>
                                </h2>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span>Programmation radio & Bibliothèque TV ({totalTVVideos} vidéos)</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Toggle Bibliothèque TV */}
                            <button
                                type="button"
                                onClick={() => setIsTVLibOpen(!isTVLibOpen)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                                    isTVLibOpen
                                        ? 'bg-purple-600/25 border-purple-500/40 text-purple-300'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                }`}
                                title={isTVLibOpen ? "Masquer la bibliothèque TV" : "Afficher la bibliothèque TV"}
                            >
                                <Tv className="w-3.5 h-3.5 text-purple-400" />
                                <span>Bibliothèque TV ({totalTVVideos})</span>
                                {isTVLibOpen ? <PanelRightClose className="w-3 h-3 ml-1" /> : <PanelRightOpen className="w-3 h-3 ml-1" />}
                            </button>

                            {/* Toggle radio active/inactive */}
                            <button
                                type="button"
                                onClick={onToggleRadio}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border transition-all ${
                                    isRadioActive
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                        : 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isRadioActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                                {isRadioActive ? 'RADIO ACTIVE' : 'RADIO HORS LIGNE'}
                            </button>

                            {/* Bouton Sauvegarder */}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                    saveSuccess
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-neon-cyan text-black hover:bg-white'
                                }`}
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                                {isSaving ? 'Sauvegarde...' : saveSuccess ? 'Enregistré !' : 'Sauvegarder'}
                            </button>

                            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── CORPS DE LA MODALE : 3 COLONNES ──────────────────── */}
                    <div className="flex flex-1 overflow-hidden min-h-0">

                        {/* ═════════════════════════════════════════════════════
                            COLONNE 1 : LISTE DES ÉMISSIONS (Gauches)
                        ═════════════════════════════════════════════════════ */}
                        <div className="w-64 shrink-0 border-r border-white/10 flex flex-col bg-black/20">
                            <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-neon-cyan" />
                                    Mes émissions
                                </span>
                                <button
                                    type="button"
                                    onClick={openNewBlockForm}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/40 text-neon-cyan text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                    Créer
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-2 space-y-1.5 px-2">
                                {blocks.length === 0 && !isEditingBlock && (
                                    <div className="p-5 text-center text-gray-500 text-xs">
                                        <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-bold text-gray-400">Aucune émission</p>
                                        <p className="text-[10px] mt-1 text-gray-600">Cliquez sur « Créer » pour commencer votre grille radio.</p>
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
                                            className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group relative ${
                                                isDragTarget
                                                    ? 'bg-neon-cyan/20 border-neon-cyan ring-2 ring-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)] scale-[1.02]'
                                                    : isSelected
                                                        ? 'bg-white/[0.08] border-white/25'
                                                        : 'bg-black/30 border-white/5 hover:border-white/15 hover:bg-white/[0.03]'
                                            }`}
                                            style={{ borderLeftColor: b.color, borderLeftWidth: 3 }}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <span className="text-base leading-none">{b.emoji}</span>
                                                <div className="flex items-center gap-1">
                                                    {isLive && (
                                                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse">
                                                            LIVE
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={e => { e.stopPropagation(); setSelectedBlockId(b.id); openEditBlockForm(b); }}
                                                        className="p-1 rounded text-gray-500 hover:text-neon-cyan opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Modifier les horaires et paramètres"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={e => { e.stopPropagation(); handleDeleteBlock(b.id); }}
                                                        className="p-1 rounded text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Supprimer cette émission"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-[11px] font-black text-white uppercase italic tracking-tight truncate">{b.title}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[8px] font-mono text-gray-400">{b.timeSlot}</span>
                                                <span className="text-[8px] font-mono text-neon-cyan bg-neon-cyan/10 px-1.5 py-0.2 rounded font-bold">
                                                    {b.tracks?.length || 0} piste{(b.tracks?.length || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Indication Drag Hover */}
                                            {isDragTarget && (
                                                <div className="absolute inset-0 bg-neon-cyan/30 rounded-xl backdrop-blur-[1px] flex items-center justify-center font-black text-[10px] text-white uppercase tracking-wider border-2 border-neon-cyan animate-pulse">
                                                    + Déposer ici
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pied de colonne gauche */}
                            <div className="p-2 border-t border-white/10 text-center">
                                <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                                    💡 Glissez une vidéo TV sur une émission
                                </p>
                            </div>
                        </div>

                        {/* ═════════════════════════════════════════════════════
                            COLONNE 2 : L'ÉMISSION SÉLECTIONNÉE (Centre)
                        ═════════════════════════════════════════════════════ */}
                        <div className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-[#0d0e14]/50">

                            {/* ── FORMULAIRE ÉDITION ÉMISSION ── */}
                            {isEditingBlock && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="m-4 p-5 rounded-2xl bg-white/[0.03] border border-neon-cyan/30 space-y-4 shadow-xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                            <Radio className="w-4 h-4 text-neon-cyan" />
                                            {selectedBlockId && blocks.find(b => b.id === selectedBlockId)
                                                ? 'Modifier l\'émission'
                                                : 'Créer une nouvelle émission'
                                            }
                                        </h3>
                                        <button type="button" onClick={() => setIsEditingBlock(false)} className="text-gray-500 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Emoji + Nom + Couleur */}
                                    <div className="flex items-start gap-3">
                                        {/* Emoji picker */}
                                        <div className="relative group shrink-0">
                                            <button
                                                type="button"
                                                className="text-2xl w-12 h-12 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center hover:bg-white/10 transition-all"
                                            >
                                                {editBlockForm.emoji}
                                            </button>
                                            <div className="absolute top-full left-0 mt-1 p-2 bg-[#121218] border border-white/20 rounded-xl grid grid-cols-7 gap-1 shadow-2xl z-30 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                                                {PRESET_EMOJIS.map(em => (
                                                    <button
                                                        key={em}
                                                        type="button"
                                                        onClick={() => setEditBlockForm(f => ({ ...f, emoji: em }))}
                                                        className="text-lg p-1 hover:bg-white/10 rounded cursor-pointer"
                                                    >{em}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Nom */}
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nom de l'émission</label>
                                            <input
                                                type="text"
                                                value={editBlockForm.title}
                                                onChange={e => setEditBlockForm(f => ({ ...f, title: e.target.value }))}
                                                placeholder="Ex: Morning Beats, Electro Sessions..."
                                                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white font-black text-sm uppercase italic focus:outline-none focus:border-neon-cyan"
                                            />
                                        </div>

                                        {/* Couleurs */}
                                        <div className="shrink-0">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Couleur</label>
                                            <div className="flex gap-1 flex-wrap">
                                                {PRESET_COLORS.map(c => (
                                                    <button
                                                        key={c.hex}
                                                        type="button"
                                                        onClick={() => setEditBlockForm(f => ({ ...f, color: c.hex }))}
                                                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${editBlockForm.color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-white/50'}`}
                                                        style={{ backgroundColor: c.hex }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horaires & Aléatoire */}
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-neon-cyan" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Horaire :</span>
                                            <input
                                                type="number" min={0} max={23}
                                                value={editBlockForm.startHour}
                                                onChange={e => setEditBlockForm(f => ({ ...f, startHour: parseInt(e.target.value) || 0 }))}
                                                className="w-12 px-2 py-1 rounded-lg bg-white/5 border border-white/15 text-white text-center text-xs font-mono"
                                            />
                                            <span className="text-gray-400 text-xs">h →</span>
                                            <input
                                                type="number" min={1} max={24}
                                                value={editBlockForm.endHour}
                                                onChange={e => setEditBlockForm(f => ({ ...f, endHour: parseInt(e.target.value) || 4 }))}
                                                className="w-12 px-2 py-1 rounded-lg bg-white/5 border border-white/15 text-white text-center text-xs font-mono"
                                            />
                                            <span className="text-gray-400 text-xs">h</span>
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                            <input
                                                type="checkbox"
                                                checked={editBlockForm.randomize}
                                                onChange={e => setEditBlockForm(f => ({ ...f, randomize: e.target.checked }))}
                                                className="rounded accent-neon-cyan"
                                            />
                                            <span className="text-[10px] text-gray-300 font-bold uppercase">Ordre aléatoire (Shuffle)</span>
                                        </label>
                                    </div>

                                    {/* Jours */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Jours de diffusion :</span>
                                            <button type="button" onClick={() => setEditBlockForm(f => ({ ...f, days: ALL_DAYS }))} className="text-[9px] text-neon-cyan hover:underline">7j/7</button>
                                            <span className="text-gray-600">·</span>
                                            <button type="button" onClick={() => setEditBlockForm(f => ({ ...f, days: WEEKDAYS }))} className="text-[9px] text-neon-cyan hover:underline">Semaine</button>
                                            <span className="text-gray-600">·</span>
                                            <button type="button" onClick={() => setEditBlockForm(f => ({ ...f, days: WEEKEND_DAYS }))} className="text-[9px] text-neon-cyan hover:underline">Week-end</button>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {DAYS_OF_WEEK.map(d => {
                                                const active = editBlockForm.days.includes(d.value);
                                                return (
                                                    <button
                                                        key={d.value}
                                                        type="button"
                                                        onClick={() => handleToggleDay(d.value)}
                                                        className={`w-9 h-9 rounded-xl text-[10px] font-black uppercase flex items-center justify-center transition-all cursor-pointer ${
                                                            active ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(0,255,255,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {d.short.slice(0, 2)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Valider */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleSaveBlock}
                                            className="flex-1 py-2.5 rounded-xl bg-neon-cyan text-black font-black text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            Enregistrer l'émission
                                        </button>
                                        <button type="button" onClick={() => setIsEditingBlock(false)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs transition-all">
                                            Annuler
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── PAS D'ÉMISSION SÉLECTIONNÉE ── */}
                            {!selectedBlock && !isEditingBlock && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-4">
                                        <Radio className="w-8 h-8 text-neon-cyan" />
                                    </div>
                                    <h3 className="text-white font-black text-lg uppercase italic mb-2">Créez votre première émission</h3>
                                    <p className="text-gray-400 text-xs max-w-sm">
                                        Cliquez sur « Créer une émission » ci-dessous, puis glissez-y vos clips et livesets favoris depuis la bibliothèque TV à droite.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={openNewBlockForm}
                                        className="mt-5 px-6 py-3 rounded-xl bg-neon-cyan text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Créer une émission
                                    </button>
                                </div>
                            )}

                            {/* ── ÉMISSION SÉLECTIONNÉE ── */}
                            {selectedBlock && !isEditingBlock && (
                                <div className="flex flex-col flex-1 min-h-0">

                                    {/* Header de l'émission */}
                                    <div
                                        className="px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.01]"
                                        style={{ borderLeftColor: selectedBlock.color, borderLeftWidth: 4 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{selectedBlock.emoji}</span>
                                            <div>
                                                <h3 className="text-base font-black text-white uppercase italic tracking-tight">{selectedBlock.title}</h3>
                                                <p className="text-[10px] text-gray-400 font-mono">
                                                    {selectedBlock.timeSlot} · {
                                                        selectedBlock.days && selectedBlock.days.length === 7
                                                            ? '7j/7'
                                                            : DAYS_OF_WEEK.filter(d => isRadioBlockActiveOnDay(selectedBlock, d.value)).map(d => d.short.slice(0, 2)).join(', ')
                                                    } · <span className="text-neon-cyan font-bold">{selectedBlock.tracks?.length || 0} piste{(selectedBlock.tracks?.length || 0) !== 1 ? 's' : ''}</span>
                                                    {selectedBlock.randomize && ' · 🔀 Aléatoire'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowManualAdd(!showManualAdd)}
                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                                                    showManualAdd
                                                        ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan'
                                                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <Plus className="w-3 h-3" />
                                                Ajouter par URL
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openEditBlockForm(selectedBlock)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-[9px] font-bold uppercase transition-all"
                                            >
                                                <Pencil className="w-3 h-3" />
                                                Modifier
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── GRANDE ZONE DE DROP PRINCIPALE (Glisser-Déposer ici) ── */}
                                    <div className="p-4 shrink-0">
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
                                            className={`p-4 rounded-2xl border-2 border-dashed transition-all flex items-center justify-between gap-4 ${
                                                isDragOverMainArea
                                                    ? 'border-neon-cyan bg-neon-cyan/20 shadow-[0_0_30px_rgba(0,255,255,0.3)] scale-[1.01]'
                                                    : draggingVideo
                                                        ? 'border-neon-cyan/60 bg-neon-cyan/10 animate-pulse'
                                                        : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                    isDragOverMainArea ? 'bg-neon-cyan text-black scale-110' : 'bg-white/5 text-neon-cyan'
                                                }`}>
                                                    <Tv className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase italic tracking-tight">
                                                        {isDragOverMainArea ? 'Lâchez la vidéo ici pour l\'ajouter !' : 'Glissez-déposez des vidéos TV ici'}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400">
                                                        Prenez une vidéo dans la bibliothèque à droite et glissez-la directement dans cette zone ou dans la liste ci-dessous.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="text-[9px] font-mono text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded-lg border border-neon-cyan/20">
                                                    {totalTVVideos} vidéos TV disponibles
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
                                            className="px-4 pb-3 shrink-0"
                                        >
                                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ajouter manuellement une vidéo YouTube :</span>
                                                    <button type="button" onClick={() => setShowManualAdd(false)} className="text-gray-500 hover:text-white text-xs">×</button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                                                    <div className="md:col-span-4 space-y-1">
                                                        <label className="text-[8px] font-bold text-gray-500 uppercase">Lien YouTube</label>
                                                        <div className="flex gap-1.5">
                                                            <input
                                                                type="text"
                                                                value={trackUrl}
                                                                onChange={e => setTrackUrl(e.target.value)}
                                                                placeholder="https://youtube.com/watch?v=..."
                                                                className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleFetchYouTube}
                                                                disabled={isFetchingTitle || !trackUrl}
                                                                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[9px] font-bold uppercase disabled:opacity-40 transition-all whitespace-nowrap"
                                                            >
                                                                {isFetchingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Auto'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-3 space-y-1">
                                                        <label className="text-[8px] font-bold text-gray-500 uppercase">Artiste</label>
                                                        <input
                                                            type="text"
                                                            value={trackArtist}
                                                            onChange={e => setTrackArtist(e.target.value)}
                                                            placeholder="Ex: David Guetta..."
                                                            className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3 space-y-1">
                                                        <label className="text-[8px] font-bold text-gray-500 uppercase">Titre</label>
                                                        <input
                                                            type="text"
                                                            value={trackTitle}
                                                            onChange={e => setTrackTitle(e.target.value)}
                                                            placeholder="Ex: Live @ Tomorrowland..."
                                                            className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex items-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={handleAddManualTrack}
                                                            disabled={!trackUrl}
                                                            className="w-full py-2 rounded-xl bg-neon-cyan text-black text-[10px] font-black uppercase disabled:opacity-40 hover:bg-white transition-all"
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
                                        className="flex-1 overflow-y-auto px-5 py-2 space-y-2"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                                <Music2 className="w-3.5 h-3.5 text-neon-cyan" />
                                                Pistes de l'émission ({selectedBlock.tracks?.length || 0})
                                            </span>
                                            {(selectedBlock.tracks?.length || 0) > 0 && (
                                                <span className="text-[9px] font-mono text-gray-500">
                                                    Durée cumulée : {formatDurationExact((selectedBlock.tracks || []).reduce((acc, t) => acc + (t.duration || 3600), 0))}
                                                </span>
                                            )}
                                        </div>

                                        {(!selectedBlock.tracks || selectedBlock.tracks.length === 0) ? (
                                            <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/5 text-center flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 text-gray-500">
                                                    <Play className="w-6 h-6" />
                                                </div>
                                                <p className="text-white font-bold text-xs">Cette émission est encore vide.</p>
                                                <p className="text-gray-400 text-[10px] mt-1 max-w-xs">
                                                    Glissez une des 240 vidéos depuis la bibliothèque TV à droite pour commencer la playlist !
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 pb-4">
                                                {selectedBlock.tracks.map((track, idx) => (
                                                    <div
                                                        key={track.id}
                                                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center gap-3 transition-all group"
                                                    >
                                                        {/* Numéro + Réordonner */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="text-[9px] font-mono text-gray-600 w-4 text-center">{idx + 1}</span>
                                                            <div className="flex flex-col gap-0.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveTrack(idx, 'up')}
                                                                    disabled={idx === 0}
                                                                    className="p-0.5 hover:bg-white/10 rounded text-gray-500 disabled:opacity-20 cursor-pointer"
                                                                    title="Monter"
                                                                >
                                                                    <ChevronUp className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveTrack(idx, 'down')}
                                                                    disabled={idx === (selectedBlock.tracks?.length || 0) - 1}
                                                                    className="p-0.5 hover:bg-white/10 rounded text-gray-500 disabled:opacity-20 cursor-pointer"
                                                                    title="Descendre"
                                                                >
                                                                    <ChevronDown className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Miniature YouTube */}
                                                        <img
                                                            src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                                                            alt=""
                                                            className="w-13 h-8 rounded-lg object-cover bg-black shrink-0 border border-white/10"
                                                        />

                                                        {/* Titre & Artiste */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded ${
                                                                    track.category === 'clip'
                                                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                                }`}>
                                                                    {track.category === 'clip' ? 'Clip' : 'Set'}
                                                                </span>
                                                                <h5 className="text-[11px] font-black text-white uppercase italic truncate">{track.artist}</h5>
                                                            </div>
                                                            <p className="text-[9px] text-gray-400 truncate">{track.title}</p>
                                                        </div>

                                                        {/* Durée & Actions */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[9px] font-mono text-gray-500">{formatDurationExact(track.duration || 3600)}</span>
                                                            <a
                                                                href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1 rounded bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
                                                                title="Voir sur YouTube"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTrack(track.id)}
                                                                className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Retirer de l'émission"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
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
                            <div className="w-96 shrink-0 border-l border-white/10 flex flex-col bg-[#0e0f17]/95">
                                {/* Header bibliothèque */}
                                <div className="p-3 border-b border-white/10 space-y-2.5 bg-black/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tv className="w-4 h-4 text-purple-400" />
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase italic tracking-tight flex items-center gap-1.5">
                                                    Bibliothèque TV
                                                    <span className="text-[9px] font-mono normal-case not-italic px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                        {totalTVVideos} vidéos
                                                    </span>
                                                </h4>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsTVLibOpen(false)}
                                            className="text-gray-500 hover:text-white p-1"
                                            title="Fermer le volet TV"
                                        >
                                            <PanelRightClose className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Indication Glisser-Déposer */}
                                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[9px] text-purple-200 flex items-center gap-2">
                                        <GripVertical className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                        <span>
                                            <strong>Glisser-déposer :</strong> attrapez une vidéo ci-dessous et déposez-la dans votre émission au centre !
                                        </span>
                                    </div>

                                    {/* Barre de recherche */}
                                    <div className="relative">
                                        <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            value={tvSearch}
                                            onChange={e => setTvSearch(e.target.value)}
                                            placeholder="Rechercher par DJ, titre..."
                                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
                                        />
                                        {tvSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setTvSearch('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
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
                                                className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${
                                                    tvFilter === f
                                                        ? f === 'all' ? 'bg-white text-black' : f === 'liveset' ? 'bg-cyan-500 text-black' : 'bg-purple-500 text-white'
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
                                            className="ml-auto px-2 py-1 rounded-lg bg-[#14141e] border border-white/15 text-white text-[8.5px] font-bold cursor-pointer max-w-[140px] truncate"
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
                                                        className="w-full py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Film className="w-3 h-3" />
                                                        Tout importer ({currentTB.videos.length} vidéos) vers « {selectedBlock.title} »
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Liste des vidéos TV (Draggables) */}
                                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                                    <div className="px-1 text-[9px] font-mono text-gray-500 mb-1 flex items-center justify-between">
                                        <span>{filteredTVVideos.length} vidéo{filteredTVVideos.length !== 1 ? 's' : ''} trouvée{filteredTVVideos.length !== 1 ? 's' : ''}</span>
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
                                                    className={`p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex items-center gap-2 group relative select-none ${
                                                        isBeingDragged
                                                            ? 'opacity-40 border-dashed border-neon-cyan'
                                                            : isAlreadyInSelected
                                                                ? 'bg-emerald-500/[0.05] border-emerald-500/20 hover:border-emerald-500/40'
                                                                : 'bg-black/40 border-white/5 hover:border-neon-cyan/50 hover:bg-white/[0.04]'
                                                    }`}
                                                >
                                                    {/* Poignée de drag */}
                                                    <div className="text-gray-600 group-hover:text-neon-cyan shrink-0 transition-colors">
                                                        <GripVertical className="w-3.5 h-3.5" />
                                                    </div>

                                                    {/* Miniature */}
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={`https://img.youtube.com/vi/${vid.youtubeId}/default.jpg`}
                                                            alt=""
                                                            className="w-13 h-8.5 rounded-lg object-cover bg-black border border-white/10"
                                                        />
                                                        <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono bg-black/80 px-1 py-0.2 rounded text-gray-300">
                                                            {formatDurationExact(vid.duration || 3600)}
                                                        </span>
                                                    </div>

                                                    {/* Titre & Bloc d'origine */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold text-white truncate leading-tight group-hover:text-neon-cyan transition-colors">
                                                            {vid.title}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded ${
                                                                vid.category === 'clip'
                                                                    ? 'bg-purple-500/20 text-purple-300'
                                                                    : 'bg-cyan-500/20 text-cyan-300'
                                                            }`}>
                                                                {vid.category === 'clip' ? 'Clip' : 'Set'}
                                                            </span>
                                                            {vid.blockTitle && (
                                                                <span className="text-[7.5px] text-gray-500 truncate">
                                                                    {vid.blockTitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Bouton Ajouter (+) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImportFromTV(vid, selectedBlockId)}
                                                        className={`shrink-0 p-1.5 rounded-lg transition-all cursor-pointer ${
                                                            isAlreadyInSelected
                                                                ? 'text-emerald-400 hover:bg-emerald-500/20'
                                                                : 'bg-white/5 hover:bg-neon-cyan hover:text-black text-gray-300'
                                                        }`}
                                                        title={isAlreadyInSelected ? "Déjà dans l'émission (cliquez pour ajouter à nouveau)" : "Ajouter à l'émission sélectionnée"}
                                                    >
                                                        {isAlreadyInSelected ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        ) : (
                                                            <Plus className="w-3.5 h-3.5" />
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
            </div>
        </AnimatePresence>
    );
}
