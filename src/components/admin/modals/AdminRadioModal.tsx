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
    RotateCcw, 
    CheckCircle2, 
    Music2, 
    Search, 
    Check, 
    Clock,
    Tv,
    Layers,
    Save,
    Loader2,
    Sparkles,
    Calendar,
    ArrowUpDown,
    Shuffle,
    Play,
    ListPlus
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';
import { apiFetch } from '../../../utils/auth';
import { 
    DEFAULT_RADIO_BLOCKS, 
    STORAGE_RADIO_BLOCKS_KEY, 
    DAYS_OF_WEEK, 
    ALL_DAYS, 
    WEEKDAYS, 
    WEEKEND_DAYS, 
    formatRadioBlockDays, 
    formatRadioTimeSlot, 
    formatDurationExact, 
    isRadioBlockActiveOnDay, 
    sortRadioBlocksByBroadcastOrder, 
    getActiveRadioBlock, 
    getParisSeconds, 
    getParisDayOfWeek,
    type RadioScheduleBlock, 
    type RadioTrackItem 
} from '../../../utils/radioSchedule';
import { DEFAULT_TV_BLOCKS, parseArtistAndEvent } from '../../../utils/tvSchedule';

export const STORAGE_RADIO_TRACKS_KEY = 'dropsiders_radio_tracks';

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

interface AdminRadioModalProps {
    isOpen: boolean;
    onClose: () => void;
    isRadioActive: boolean;
    onToggleRadio: () => void;
}

export function AdminRadioModal({
    isOpen,
    onClose,
    isRadioActive,
    onToggleRadio
}: AdminRadioModalProps) {
    // ─── État des blocs / émissions radio ─────────────────────────────────────
    const [blocks, setBlocks] = useState<RadioScheduleBlock[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return sortRadioBlocksByBroadcastOrder(parsed, true);
                }
            }
        } catch {}
        return sortRadioBlocksByBroadcastOrder(DEFAULT_RADIO_BLOCKS, true);
    });

    const [selectedBlockId, setSelectedBlockId] = useState<string>('radio_bloc_1');
    const [filterDay, setFilterDay] = useState<'all' | number>('all');
    const [showAllBlocksOverview, setShowAllBlocksOverview] = useState(false);

    // Formulaire d'ajout dans le bloc sélectionné
    const [trackUrl, setTrackUrl] = useState('');
    const [trackTitle, setTrackTitle] = useState('');
    const [trackArtist, setTrackArtist] = useState('');
    const [trackCategory, setTrackCategory] = useState<'liveset' | 'clip'>('liveset');
    const [trackDurationMin, setTrackDurationMin] = useState<string>('60');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // Onglets principaux
    const [mainTab, setMainTab] = useState<'blocks' | 'library' | 'rotation'>('blocks');

    // Recherche et filtre dans la bibliothèque TV
    const [libSearchQuery, setLibSearchQuery] = useState('');
    const [libFilter, setLibFilter] = useState<'all' | 'liveset' | 'clip'>('all');

    // Recherche dans la rotation globale
    const [rotSearchQuery, setRotSearchQuery] = useState('');
    const [rotFilter, setRotFilter] = useState<'all' | 'liveset' | 'clip'>('all');

    // Sauvegarde & Chargement
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Chargement initial depuis l'API /api/settings
    useEffect(() => {
        if (!isOpen) return;
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data?.radio_blocks) && data.radio_blocks.length > 0) {
                        setBlocks(sortRadioBlocksByBroadcastOrder(data.radio_blocks, true));
                    }
                }
            } catch (e) {
                console.error("Erreur chargement radio settings:", e);
            }
        };
        fetchSettings();
    }, [isOpen]);

    // Bloc actif actuellement
    const selectedBlock = useMemo(() => {
        return blocks.find(b => b.id === selectedBlockId) || blocks[0] || null;
    }, [blocks, selectedBlockId]);

    // Bloc en direct à l'instant présent
    const liveBlockNow = useMemo(() => {
        return getActiveRadioBlock(blocks);
    }, [blocks]);

    // Blocs filtrés selon le jour sélectionné
    const filteredBlocks = useMemo(() => {
        if (filterDay === 'all') return blocks;
        return blocks.filter(b => isRadioBlockActiveOnDay(b, filterDay));
    }, [blocks, filterDay]);

    // Nombre total de morceaux dans la radio
    const totalTracksCount = useMemo(() => {
        return blocks.reduce((acc, b) => acc + (b.tracks?.length || 0), 0);
    }, [blocks]);

    // ─── Actions sur les Blocs ───────────────────────────────────────────────
    const handleAddBlock = () => {
        const count = blocks.length + 1;
        const newBlockId = `radio_bloc_${Date.now()}`;
        const newBlock: RadioScheduleBlock = {
            id: newBlockId,
            name: `Émission ${count}`,
            title: `Nouvelle Émission ${count}`,
            timeSlot: '00h - 04h',
            startHour: 0,
            endHour: 4,
            color: PRESET_COLORS[(count - 1) % PRESET_COLORS.length].hex,
            emoji: PRESET_EMOJIS[(count - 1) % PRESET_EMOJIS.length],
            randomize: true,
            days: [1, 2, 3, 4, 5, 6, 0],
            tracks: []
        };
        const updated = sortRadioBlocksByBroadcastOrder([...blocks, newBlock], true);
        setBlocks(updated);
        setSelectedBlockId(newBlockId);
    };

    const handleDeleteBlock = (blockId: string) => {
        if (blocks.length <= 1) {
            alert('Il doit rester au moins une émission dans la grille radio.');
            return;
        }
        if (confirm('Voulez-vous vraiment supprimer cette émission et ses morceaux ?')) {
            const updated = blocks.filter(b => b.id !== blockId);
            setBlocks(sortRadioBlocksByBroadcastOrder(updated, true));
            if (selectedBlockId === blockId) {
                setSelectedBlockId(updated[0]?.id || '');
            }
        }
    };

    const handleUpdateBlockMeta = (blockId: string, updates: Partial<RadioScheduleBlock>) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const updated = { ...b, ...updates };
            if (updates.startHour !== undefined || updates.endHour !== undefined) {
                updated.timeSlot = formatRadioTimeSlot(updated.startHour, updated.endHour);
            }
            return updated;
        }));
    };

    const handleToggleBlockDay = (blockId: string, dayValue: number) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const currentDays = b.days && b.days.length > 0 ? b.days : [1, 2, 3, 4, 5, 6, 0];
            const hasDay = currentDays.includes(dayValue);
            let nextDays: number[];
            if (hasDay) {
                nextDays = currentDays.filter(d => d !== dayValue);
                if (nextDays.length === 0) {
                    alert("L'émission doit être diffusée au moins un jour.");
                    return b;
                }
            } else {
                nextDays = [...currentDays, dayValue];
            }
            return { ...b, days: nextDays };
        }));
    };

    const handleSetBlockDaysPreset = (blockId: string, preset: 'all' | 'weekdays' | 'weekend') => {
        let days: number[];
        if (preset === 'all') days = ALL_DAYS;
        else if (preset === 'weekdays') days = WEEKDAYS;
        else days = WEEKEND_DAYS;
        handleUpdateBlockMeta(blockId, { days });
    };

    const handleSortBlocks = () => {
        setBlocks(prev => sortRadioBlocksByBroadcastOrder(prev, true));
    };

    // ─── Actions sur les Pistes du Bloc sélectionné ───────────────────────────
    const handleFetchYouTube = async () => {
        const ytid = extractYouTubeId(trackUrl);
        if (!ytid) {
            alert('Lien YouTube non valide');
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
            console.error('Erreur récupération titre:', e);
        } finally {
            setIsFetchingTitle(false);
        }
    };

    const handleAddTrack = () => {
        const ytid = extractYouTubeId(trackUrl);
        if (!ytid) {
            alert('Veuillez renseigner un lien YouTube valide.');
            return;
        }
        if (!selectedBlock) {
            alert('Sélectionnez d’abord une émission.');
            return;
        }

        const durSec = Math.max(30, (parseInt(trackDurationMin, 10) || 60) * 60);
        const newTrack: RadioTrackItem = {
            id: `rt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            title: trackTitle.trim() || `Set / Piste Radio (${selectedBlock.title})`,
            artist: trackArtist.trim() || 'Artiste',
            youtubeId: ytid,
            duration: durSec,
            category: trackCategory,
            addedAt: Date.now()
        };

        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlock.id) return b;
            return {
                ...b,
                tracks: [...(b.tracks || []), newTrack]
            };
        }));

        setTrackUrl('');
        setTrackTitle('');
        setTrackArtist('');
        setTrackDurationMin(trackCategory === 'clip' ? '4' : '60');
    };

    const handleDeleteTrack = (blockId: string, trackId: string) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            return {
                ...b,
                tracks: (b.tracks || []).filter(t => t.id !== trackId)
            };
        }));
    };

    const handleMoveTrack = (blockId: string, index: number, direction: 'up' | 'down') => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const list = [...(b.tracks || [])];
            const targetIdx = direction === 'up' ? index - 1 : index + 1;
            if (targetIdx < 0 || targetIdx >= list.length) return b;
            const temp = list[index];
            list[index] = list[targetIdx];
            list[targetIdx] = temp;
            return { ...b, tracks: list };
        }));
    };

    // ─── Import depuis Bibliothèque TV ────────────────────────────────────────
    const isVideoInSelectedBlock = (ytid: string) => {
        if (!selectedBlock) return false;
        return (selectedBlock.tracks || []).some(t => t.youtubeId === ytid);
    };

    const handleImportVideoFromTV = (video: any, targetBlockId?: string) => {
        const bId = targetBlockId || selectedBlockId;
        const target = blocks.find(b => b.id === bId);
        if (!target) return;

        if (target.tracks?.some(t => t.youtubeId === video.youtubeId)) {
            alert('Ce morceau est déjà présent dans cette émission.');
            return;
        }

        const { artist } = parseArtistAndEvent(video.title);
        const newTrack: RadioTrackItem = {
            id: `rt_tv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            title: video.title,
            artist: artist || 'Artiste',
            youtubeId: video.youtubeId,
            duration: video.duration || (video.category === 'clip' ? 240 : 3600),
            category: video.category === 'clip' ? 'clip' : 'liveset',
            addedAt: Date.now()
        };

        setBlocks(prev => prev.map(b => {
            if (b.id !== bId) return b;
            return {
                ...b,
                tracks: [...(b.tracks || []), newTrack]
            };
        }));
    };

    const handleImportAllFromTVBlock = (tvVideos: any[], targetBlockId?: string) => {
        const bId = targetBlockId || selectedBlockId;
        const target = blocks.find(b => b.id === bId);
        if (!target) return;

        const currentIds = new Set((target.tracks || []).map(t => t.youtubeId));
        const newTracks: RadioTrackItem[] = [];

        tvVideos.forEach(vid => {
            if (!currentIds.has(vid.youtubeId)) {
                const { artist } = parseArtistAndEvent(vid.title);
                newTracks.push({
                    id: `rt_tv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    title: vid.title,
                    artist: artist || 'Artiste',
                    youtubeId: vid.youtubeId,
                    duration: vid.duration || (vid.category === 'clip' ? 240 : 3600),
                    category: vid.category === 'clip' ? 'clip' : 'liveset',
                    addedAt: Date.now()
                });
                currentIds.add(vid.youtubeId);
            }
        });

        if (newTracks.length === 0) {
            alert('Toutes les vidéos de ce bloc TV sont déjà programmées dans cette émission.');
            return;
        }

        setBlocks(prev => prev.map(b => {
            if (b.id !== bId) return b;
            return {
                ...b,
                tracks: [...(b.tracks || []), ...newTracks]
            };
        }));
    };

    // ─── Sauvegarde globale ───────────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            // 1. Sauvegarder dans localStorage
            localStorage.setItem(STORAGE_RADIO_BLOCKS_KEY, JSON.stringify(blocks));

            // Rétrocompatibilité : extraire les pistes globales uniques pour customTracks
            const flatTracks = blocks.flatMap(b => b.tracks || []);
            localStorage.setItem(STORAGE_RADIO_TRACKS_KEY, JSON.stringify(flatTracks));

            // 2. Sauvegarder sur le serveur /api/settings
            await apiFetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    radio_blocks: blocks,
                    radio_tracks: flatTracks
                })
            });

            // 3. Diffuser les événements pour mise à jour immédiate
            window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
            window.dispatchEvent(new Event('dropsiders_radio_tracks_updated'));

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error('Erreur sauvegarde radio blocks:', e);
            alert('Erreur lors de la sauvegarde sur le serveur. Les données locales sont conservées.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetDefault = () => {
        if (confirm('Voulez-vous réinitialiser la grille radio avec les émissions et sets par défaut ?')) {
            const defaults = sortRadioBlocksByBroadcastOrder(DEFAULT_RADIO_BLOCKS, true);
            setBlocks(defaults);
            setSelectedBlockId(defaults[0].id);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[120] flex items-center justify-center p-1 sm:p-2 md:p-3 bg-black/85 backdrop-blur-md overflow-hidden"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    className="bg-[#0c0c10]/95 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[1.75rem] p-3 sm:p-4 md:p-5 w-[99vw] max-w-[1600px] h-[96vh] max-h-[96vh] shadow-2xl relative overflow-hidden flex flex-col z-10 font-sans"
                >
                    {/* Top Neon line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-purple-600 to-neon-red" />

                    {/* Modal Header */}
                    <div className="flex justify-between items-center mb-3 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shrink-0 shadow-[0_0_12px_rgba(0,255,255,0.2)]">
                                <Radio className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-display font-black text-white uppercase italic tracking-tighter leading-tight flex items-center gap-2">
                                    DROPSIDERS <span className="text-neon-cyan">RADIO 24/7</span>
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-normal normal-case">
                                        Gestionnaire d'émissions &amp; programmation
                                    </span>
                                </h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">
                                    Grille par jour &amp; créneaux horaires · Synchronisation globale serveur · Sets &amp; Clips
                                </p>
                            </div>
                        </div>

                        {/* Controls Header */}
                        <div className="flex items-center gap-2">
                            {/* Toggle Radio Active Button */}
                            <button
                                type="button"
                                onClick={onToggleRadio}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border transition-all shadow-md active:scale-95 ${
                                    isRadioActive
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
                                        : 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                                }`}
                                title="Activer ou désactiver la radio pour tous les visiteurs du site"
                            >
                                <span className={`w-2 h-2 rounded-full ${isRadioActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                                {isRadioActive ? 'RADIO ACTIVE EN LIGNE' : 'RADIO HORS LIGNE (CLIC = ACTIVER)'}
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                                    saveSuccess
                                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                        : 'bg-neon-cyan text-black hover:bg-white shadow-neon-cyan/25'
                                }`}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : saveSuccess ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                <span>{isSaving ? 'Sauvegarde...' : saveSuccess ? 'Enregistré !' : 'Sauvegarder'}</span>
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1.5 mb-3 p-1 rounded-xl bg-white/[0.03] border border-white/10 shrink-0 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setMainTab('blocks')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                                mainTab === 'blocks'
                                    ? 'bg-gradient-to-r from-neon-cyan/90 to-blue-600 text-black font-black shadow-md shadow-neon-cyan/20'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Grille Radio ({blocks.length} Émissions · {totalTracksCount} morceaux)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMainTab('library')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                                mainTab === 'library'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Bibliothèque TV ({DEFAULT_TV_BLOCKS.reduce((acc, b) => acc + (b.videos?.length || 0), 0)} vidéos)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMainTab('rotation')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                                mainTab === 'rotation'
                                    ? 'bg-neon-red text-white shadow-md shadow-neon-red/25'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Music2 className="w-3.5 h-3.5" />
                            <span>Toutes les Pistes ({totalTracksCount})</span>
                        </button>
                    </div>

                    {/* Contenu de la modale */}
                    <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-3">
                        {/* ========================================================= */}
                        {/* TAB: GRILLE RADIO PAR JOUR & CRÉNEAUX                     */}
                        {/* ========================================================= */}
                        {mainTab === 'blocks' && (
                            <div className="space-y-3">
                                {/* Filtre par jour de diffusion */}
                                <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-neon-cyan" />
                                            FILTRER PAR JOUR :
                                        </span>
                                        <div className="flex items-center gap-1 overflow-x-auto">
                                            <button
                                                type="button"
                                                onClick={() => setFilterDay('all')}
                                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                    filterDay === 'all'
                                                        ? 'bg-neon-cyan text-black shadow-sm shadow-neon-cyan/30'
                                                        : 'bg-white/5 hover:bg-white/10 text-white/60'
                                                }`}
                                            >
                                                Tous (7j/7)
                                            </button>
                                            {DAYS_OF_WEEK.map(d => (
                                                <button
                                                    key={d.value}
                                                    type="button"
                                                    onClick={() => setFilterDay(d.value)}
                                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                        filterDay === d.value
                                                            ? 'bg-neon-cyan text-black shadow-sm shadow-neon-cyan/30'
                                                            : 'bg-white/5 hover:bg-white/10 text-white/60'
                                                    }`}
                                                >
                                                    {d.short}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllBlocksOverview(prev => !prev)}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                showAllBlocksOverview
                                                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                                            }`}
                                        >
                                            <Layers className="w-3 h-3" />
                                            {showAllBlocksOverview ? 'Masquer le tableau' : 'Vue tableau'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSortBlocks}
                                            className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 flex items-center gap-1.5 transition-all cursor-pointer"
                                            title="Trier selon l'ordre 06h00 -> 06h00"
                                        >
                                            <ArrowUpDown className="w-3 h-3 text-neon-cyan" />
                                            Ordre auto
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleAddBlock}
                                            className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/40 text-neon-cyan flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            + Nouvelle émission
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleResetDefault}
                                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                            title="Réinitialiser la grille aux valeurs par défaut"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Tableau récapitulatif si activé */}
                                {showAllBlocksOverview && (
                                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                                        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5" />
                                                TABLEAU DE TOUTES LES ÉMISSIONS RADIO
                                            </span>
                                            <span className="text-[9px] text-gray-400">
                                                Éditez directement les titres, horaires et jours ci-dessous
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                            {blocks.map(b => {
                                                const isLive = liveBlockNow.id === b.id;
                                                return (
                                                    <div
                                                        key={b.id}
                                                        className={`p-2 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-all ${
                                                            b.id === selectedBlockId
                                                                ? 'bg-white/[0.07] border-white/30'
                                                                : 'bg-black/40 border-white/5 hover:border-white/15'
                                                        }`}
                                                        style={{ borderLeftColor: b.color, borderLeftWidth: 4 }}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <input
                                                                type="text"
                                                                value={b.emoji}
                                                                onChange={e => handleUpdateBlockMeta(b.id, { emoji: e.target.value })}
                                                                maxLength={4}
                                                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-center text-base focus:border-white/30 outline-none shrink-0"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={b.title}
                                                                onChange={e => handleUpdateBlockMeta(b.id, { title: e.target.value })}
                                                                className="flex-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-white/30"
                                                            />
                                                            {isLive && (
                                                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/20 text-neon-red border border-red-500/40 animate-pulse shrink-0">
                                                                    EN DIRECT
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Jours */}
                                                        <div className="flex items-center gap-0.5 shrink-0 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                                                            {DAYS_OF_WEEK.map(d => {
                                                                const active = isRadioBlockActiveOnDay(b, d.value);
                                                                return (
                                                                    <button
                                                                        key={d.value}
                                                                        type="button"
                                                                        onClick={() => handleToggleBlockDay(b.id, d.value)}
                                                                        className={`w-5 h-5 rounded text-[8px] font-black uppercase flex items-center justify-center transition-all cursor-pointer ${
                                                                            active
                                                                                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40'
                                                                                : 'text-white/20 hover:text-white/50'
                                                                        }`}
                                                                        title={d.label}
                                                                    >
                                                                        {d.short[0]}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Créneau & Nombre de pistes */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-300">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={23}
                                                                    value={b.startHour}
                                                                    onChange={e => handleUpdateBlockMeta(b.id, { startHour: parseInt(e.target.value, 10) || 0 })}
                                                                    className="w-10 px-1 py-0.5 rounded bg-white/5 border border-white/10 text-center font-mono text-xs"
                                                                />
                                                                <span>h -</span>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={24}
                                                                    value={b.endHour}
                                                                    onChange={e => handleUpdateBlockMeta(b.id, { endHour: parseInt(e.target.value, 10) || 24 })}
                                                                    className="w-10 px-1 py-0.5 rounded bg-white/5 border border-white/10 text-center font-mono text-xs"
                                                                />
                                                                <span>h</span>
                                                            </div>
                                                            <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                                                                {b.tracks?.length || 0} pistes
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedBlockId(b.id)}
                                                                className="px-2 py-1 rounded bg-neon-cyan/15 hover:bg-neon-cyan/25 text-neon-cyan text-[9px] font-black uppercase cursor-pointer"
                                                            >
                                                                Gérer
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Strip horizontal des Émissions */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                    {filteredBlocks.map(b => {
                                        const isSelected = b.id === selectedBlockId;
                                        const isLive = liveBlockNow.id === b.id;
                                        const durTotalSec = (b.tracks || []).reduce((acc, t) => acc + (t.duration || 3600), 0);

                                        return (
                                            <div
                                                key={b.id}
                                                onClick={() => setSelectedBlockId(b.id)}
                                                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                                                    isSelected
                                                        ? 'bg-white/[0.08] border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.15)] scale-[1.02]'
                                                        : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                                                }`}
                                                style={{ borderTopColor: b.color, borderTopWidth: 3 }}
                                            >
                                                <div className="flex items-start justify-between gap-1 mb-1">
                                                    <span className="text-xl">{b.emoji}</span>
                                                    <div className="flex items-center gap-1">
                                                        {isLive && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-neon-red border border-red-500/40 text-[7.5px] font-black uppercase animate-pulse">
                                                                DIRECT
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-mono font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                                                            {b.timeSlot}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate mb-1">
                                                    {b.title}
                                                </h4>

                                                <div className="text-[8px] font-bold text-gray-400 mb-2 truncate">
                                                    {formatRadioBlockDays(b.days)}
                                                </div>

                                                <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 pt-1.5 border-t border-white/5">
                                                    <span>{b.tracks?.length || 0} morceau{(b.tracks?.length || 0) > 1 ? 'x' : ''}</span>
                                                    <span>{formatDurationExact(durTotalSec)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── ÉDITEUR DU BLOC SÉLECTIONNÉ ── */}
                                {selectedBlock && (
                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-4">
                                        {/* Configuration de l'émission */}
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
                                            <div className="flex items-center gap-3">
                                                {/* Emoji picker */}
                                                <div className="relative group">
                                                    <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10 block cursor-pointer">
                                                        {selectedBlock.emoji}
                                                    </span>
                                                    <div className="absolute top-full left-0 mt-1 p-2 bg-[#121218] border border-white/20 rounded-xl grid grid-cols-7 gap-1 shadow-2xl z-30 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                                                        {PRESET_EMOJIS.map(em => (
                                                            <button
                                                                key={em}
                                                                type="button"
                                                                onClick={() => handleUpdateBlockMeta(selectedBlock.id, { emoji: em })}
                                                                className="text-lg p-1 hover:bg-white/10 rounded cursor-pointer"
                                                            >
                                                                {em}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Titre & Créneau */}
                                                <div className="space-y-1">
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.title}
                                                        onChange={e => handleUpdateBlockMeta(selectedBlock.id, { title: e.target.value })}
                                                        placeholder="Nom de l'émission"
                                                        className="px-3 py-1 rounded-xl bg-white/5 border border-white/15 text-white font-black text-sm uppercase italic tracking-tight focus:outline-none focus:border-neon-cyan"
                                                    />
                                                    <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase">
                                                        <span>Créneau :</span>
                                                        <div className="flex items-center gap-1 font-mono text-white">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={23}
                                                                value={selectedBlock.startHour}
                                                                onChange={e => handleUpdateBlockMeta(selectedBlock.id, { startHour: parseInt(e.target.value, 10) || 0 })}
                                                                className="w-10 px-1 py-0.5 rounded bg-white/10 border border-white/20 text-center text-xs"
                                                            />
                                                            <span>h ➔</span>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={24}
                                                                value={selectedBlock.endHour}
                                                                onChange={e => handleUpdateBlockMeta(selectedBlock.id, { endHour: parseInt(e.target.value, 10) || 24 })}
                                                                className="w-10 px-1 py-0.5 rounded bg-white/10 border border-white/20 text-center text-xs"
                                                            />
                                                            <span>h</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Jours de diffusion */}
                                            <div className="flex flex-col lg:items-end gap-1.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mr-1">
                                                        Jours de diffusion :
                                                    </span>
                                                    {DAYS_OF_WEEK.map(d => {
                                                        const active = isRadioBlockActiveOnDay(selectedBlock, d.value);
                                                        return (
                                                            <button
                                                                key={d.value}
                                                                type="button"
                                                                onClick={() => handleToggleBlockDay(selectedBlock.id, d.value)}
                                                                className={`w-6 h-6 rounded-lg text-[9px] font-black uppercase flex items-center justify-center transition-all cursor-pointer ${
                                                                    active
                                                                        ? 'bg-neon-cyan text-black shadow-sm font-black'
                                                                        : 'bg-white/5 text-gray-500 hover:text-white'
                                                                }`}
                                                                title={d.label}
                                                            >
                                                                {d.short[0]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase text-gray-400">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetBlockDaysPreset(selectedBlock.id, 'all')}
                                                        className="hover:text-neon-cyan transition-colors cursor-pointer"
                                                    >
                                                        [7j/7]
                                                    </button>
                                                    <span>•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetBlockDaysPreset(selectedBlock.id, 'weekdays')}
                                                        className="hover:text-neon-cyan transition-colors cursor-pointer"
                                                    >
                                                        [Semaine]
                                                    </button>
                                                    <span>•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetBlockDaysPreset(selectedBlock.id, 'weekend')}
                                                        className="hover:text-neon-cyan transition-colors cursor-pointer"
                                                    >
                                                        [Week-end]
                                                    </button>
                                                    <span>•</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteBlock(selectedBlock.id)}
                                                        className="text-red-400 hover:text-red-300 transition-colors ml-2 cursor-pointer"
                                                    >
                                                        Supprimer l'émission
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Formulaire d'ajout rapide dans ce bloc */}
                                        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan flex items-center gap-1.5">
                                                    <Plus className="w-3.5 h-3.5" />
                                                    AJOUTER UNE PISTE OU UN SET DANS « {selectedBlock.title} »
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setMainTab('library')}
                                                    className="text-[9px] font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Tv className="w-3 h-3" />
                                                    Choisir depuis la Bibliothèque TV ➔
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                                                {/* URL YouTube */}
                                                <div className="md:col-span-5 space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Lien YouTube ou ID
                                                    </label>
                                                    <div className="flex gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={trackUrl}
                                                            onChange={e => setTrackUrl(e.target.value)}
                                                            placeholder="https://www.youtube.com/watch?v=..."
                                                            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleFetchYouTube}
                                                            disabled={isFetchingTitle || !trackUrl}
                                                            className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase transition-all disabled:opacity-40 cursor-pointer"
                                                            title="Récupérer le titre automatiquement"
                                                        >
                                                            {isFetchingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Titre auto'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Artiste */}
                                                <div className="md:col-span-2 space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Artiste
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={trackArtist}
                                                        onChange={e => setTrackArtist(e.target.value)}
                                                        placeholder="Ex: Fisher"
                                                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                    />
                                                </div>

                                                {/* Titre */}
                                                <div className="md:col-span-3 space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Titre / Événement
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={trackTitle}
                                                        onChange={e => setTrackTitle(e.target.value)}
                                                        placeholder="Ex: Live @ Tomorrowland 2026"
                                                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                    />
                                                </div>

                                                {/* Catégorie & Bouton */}
                                                <div className="md:col-span-2 flex gap-1.5">
                                                    <select
                                                        value={trackCategory}
                                                        onChange={e => {
                                                            const cat = e.target.value as 'liveset' | 'clip';
                                                            setTrackCategory(cat);
                                                            setTrackDurationMin(cat === 'clip' ? '4' : '60');
                                                        }}
                                                        className="px-2 py-2 rounded-xl bg-[#14141e] border border-white/15 text-white text-[10px] font-bold cursor-pointer"
                                                    >
                                                        <option value="liveset">Liveset</option>
                                                        <option value="clip">Clip</option>
                                                    </select>

                                                    <button
                                                        type="button"
                                                        onClick={handleAddTrack}
                                                        disabled={!trackUrl}
                                                        className="flex-1 px-3 py-2 rounded-xl bg-neon-cyan text-black hover:bg-white text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                                                    >
                                                        Ajouter
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Liste des pistes de ce bloc */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                                <span>Pistes programmées dans cette émission ({selectedBlock.tracks?.length || 0})</span>
                                                <span className="font-mono">
                                                    Durée totale : {formatDurationExact((selectedBlock.tracks || []).reduce((acc, t) => acc + (t.duration || 3600), 0))}
                                                </span>
                                            </div>

                                            {(!selectedBlock.tracks || selectedBlock.tracks.length === 0) ? (
                                                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-gray-500 text-xs">
                                                    Aucune piste dans cette émission. Ajoutez un lien YouTube ci-dessus ou importez des vidéos depuis la Bibliothèque TV.
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                                                    {selectedBlock.tracks.map((track, idx) => (
                                                        <div
                                                            key={track.id}
                                                            className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-2.5 transition-all group"
                                                        >
                                                            {/* Numéro & Réorganisation */}
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className="text-[9px] font-mono text-gray-500 w-5 text-center">
                                                                    #{idx + 1}
                                                                </span>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveTrack(selectedBlock.id, idx, 'up')}
                                                                        disabled={idx === 0}
                                                                        className="p-0.5 hover:bg-white/10 rounded text-gray-400 disabled:opacity-20 cursor-pointer"
                                                                    >
                                                                        <ChevronUp className="w-3 h-3" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveTrack(selectedBlock.id, idx, 'down')}
                                                                        disabled={idx === (selectedBlock.tracks?.length || 0) - 1}
                                                                        className="p-0.5 hover:bg-white/10 rounded text-gray-400 disabled:opacity-20 cursor-pointer"
                                                                    >
                                                                        <ChevronDown className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Miniature */}
                                                            <img
                                                                src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                                                                alt=""
                                                                className="w-12 h-8 rounded-lg object-cover bg-black shrink-0 border border-white/10"
                                                            />

                                                            {/* Infos du morceau */}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase ${
                                                                        track.category === 'clip'
                                                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                                    }`}>
                                                                        {track.category === 'clip' ? 'CLIP' : 'LIVESET'}
                                                                    </span>
                                                                    <h5 className="text-[11px] font-black text-white uppercase italic tracking-tight truncate">
                                                                        {track.artist}
                                                                    </h5>
                                                                </div>
                                                                <p className="text-[9px] text-gray-400 truncate">
                                                                    {track.title}
                                                                </p>
                                                            </div>

                                                            {/* Durée & Actions */}
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[9px] font-mono text-gray-400">
                                                                    {formatDurationExact(track.duration || 3600)}
                                                                </span>

                                                                <a
                                                                    href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                                                    title="Ouvrir sur YouTube"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteTrack(selectedBlock.id, track.id)}
                                                                    className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
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
                        )}

                        {/* ========================================================= */}
                        {/* TAB: BIBLIOTHÈQUE TV (IMPORT RAPIDE)                      */}
                        {/* ========================================================= */}
                        {mainTab === 'library' && (
                            <div className="space-y-3">
                                {/* Barre de recherche et sélecteur de bloc cible */}
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="relative flex-1">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={libSearchQuery}
                                                onChange={e => setLibSearchQuery(e.target.value)}
                                                placeholder="Rechercher dans les vidéos TV..."
                                                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setLibFilter('all')}
                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer ${
                                                    libFilter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                Tous
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLibFilter('liveset')}
                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer ${
                                                    libFilter === 'liveset' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                Livesets
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLibFilter('clip')}
                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer ${
                                                    libFilter === 'clip' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                Clips
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sélecteur de bloc d'importation */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                                            Importer dans :
                                        </span>
                                        <select
                                            value={selectedBlockId}
                                            onChange={e => setSelectedBlockId(e.target.value)}
                                            className="px-3 py-1.5 rounded-xl bg-[#14141e] border border-white/20 text-white text-xs font-bold cursor-pointer"
                                        >
                                            {blocks.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.emoji} {b.title} ({b.timeSlot})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Liste des Blocs TV et vidéos associées */}
                                <div className="space-y-4">
                                    {DEFAULT_TV_BLOCKS.map(tvBlock => {
                                        const matchingVids = (tvBlock.videos || []).filter(v => {
                                            if (libFilter !== 'all' && (v.category || 'liveset') !== libFilter) return false;
                                            if (libSearchQuery) {
                                                const q = libSearchQuery.toLowerCase();
                                                return v.title.toLowerCase().includes(q) || v.youtubeId.toLowerCase().includes(q);
                                            }
                                            return true;
                                        });

                                        if (matchingVids.length === 0) return null;

                                        return (
                                            <div
                                                key={tvBlock.id}
                                                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5"
                                            >
                                                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{tvBlock.emoji}</span>
                                                        <h4 className="text-xs font-black text-white uppercase italic tracking-tight">
                                                            {tvBlock.title} ({tvBlock.timeSlot})
                                                        </h4>
                                                        <span className="text-[9px] font-mono text-gray-500">
                                                            {matchingVids.length} vidéo{matchingVids.length > 1 ? 's' : ''}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleImportAllFromTVBlock(matchingVids, selectedBlockId)}
                                                        className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 transition-all flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <ListPlus className="w-3 h-3" />
                                                        Tout importer dans « {selectedBlock?.title} »
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {matchingVids.map(vid => {
                                                        const inCurrent = isVideoInSelectedBlock(vid.youtubeId);
                                                        return (
                                                            <div
                                                                key={vid.id}
                                                                className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                                                                    inCurrent
                                                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                                                        : 'bg-black/40 border-white/5 hover:border-white/15'
                                                                }`}
                                                            >
                                                                <img
                                                                    src={`https://img.youtube.com/vi/${vid.youtubeId}/default.jpg`}
                                                                    alt=""
                                                                    className="w-12 h-8 rounded-lg object-cover bg-black shrink-0 border border-white/10"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-[10px] font-bold text-white truncate">
                                                                        {vid.title}
                                                                    </p>
                                                                    <span className="text-[8px] font-mono text-gray-400">
                                                                        {formatDurationExact(vid.duration || 3600)}
                                                                    </span>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleImportVideoFromTV(vid, selectedBlockId)}
                                                                    disabled={inCurrent}
                                                                    className={`px-2 py-1 rounded text-[8.5px] font-black uppercase transition-all shrink-0 cursor-pointer ${
                                                                        inCurrent
                                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                                                                            : 'bg-white/10 hover:bg-neon-cyan hover:text-black text-white'
                                                                    }`}
                                                                >
                                                                    {inCurrent ? (
                                                                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Ajouté</span>
                                                                    ) : (
                                                                        '+ Ajouter'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* TAB: TOUTES LES PISTES (ROTATION GLOBALE)                 */}
                        {/* ========================================================= */}
                        {mainTab === 'rotation' && (
                            <div className="space-y-3">
                                {/* Barre de recherche */}
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                                    <div className="relative flex-1">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={rotSearchQuery}
                                            onChange={e => setRotSearchQuery(e.target.value)}
                                            placeholder="Rechercher parmi tous les morceaux programmés..."
                                            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setRotFilter('all')}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer ${
                                                rotFilter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Tous
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRotFilter('liveset')}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer ${
                                                rotFilter === 'liveset' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Livesets
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRotFilter('clip')}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer ${
                                                rotFilter === 'clip' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Clips
                                        </button>
                                    </div>
                                </div>

                                {/* Liste groupée par émission */}
                                <div className="space-y-3">
                                    {blocks.map(block => {
                                        const tracks = (block.tracks || []).filter(t => {
                                            if (rotFilter !== 'all' && (t.category || 'liveset') !== rotFilter) return false;
                                            if (rotSearchQuery) {
                                                const q = rotSearchQuery.toLowerCase();
                                                return t.title.toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q);
                                            }
                                            return true;
                                        });

                                        if (tracks.length === 0) return null;

                                        return (
                                            <div
                                                key={block.id}
                                                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2"
                                            >
                                                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{block.emoji}</span>
                                                        <h4 className="text-xs font-black text-white uppercase italic tracking-tight">
                                                            {block.title} ({block.timeSlot})
                                                        </h4>
                                                        <span className="text-[8px] font-mono text-gray-400">
                                                            • {formatRadioBlockDays(block.days)}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-mono text-gray-400">
                                                        {tracks.length} morceau{tracks.length > 1 ? 'x' : ''}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    {tracks.map(t => (
                                                        <div
                                                            key={t.id}
                                                            className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2.5"
                                                        >
                                                            <img
                                                                src={`https://img.youtube.com/vi/${t.youtubeId}/default.jpg`}
                                                                alt=""
                                                                className="w-10 h-7 rounded object-cover bg-black shrink-0"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <h5 className="text-[10px] font-bold text-white truncate">
                                                                    {t.artist} — {t.title}
                                                                </h5>
                                                            </div>
                                                            <span className="text-[9px] font-mono text-gray-400">
                                                                {formatDurationExact(t.duration || 3600)}
                                                            </span>
                                                            <a
                                                                href={`https://www.youtube.com/watch?v=${t.youtubeId}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1 rounded text-gray-400 hover:text-white"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
