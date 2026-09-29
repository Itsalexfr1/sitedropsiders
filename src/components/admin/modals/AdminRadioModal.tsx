import { useState, useEffect, useMemo, useRef } from 'react';
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
    Pause,
    Tv,
    Clock,
    Film,
    GripVertical,
    Sparkles,
    PanelRightClose,
    PanelRightOpen,
    AlertTriangle,
    Shuffle,
    ArrowUpFromLine,
    Maximize2,
    Minimize2,
    Sliders,
    Upload,
    FileAudio,
    Volume2
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';
import { RadionomyJinglesBox, DEFAULT_JINGLES_PUBS, type RadionomyItem } from './RadionomyJinglesBox';
import { YouTubeSearchModal } from './YouTubeSearchModal';
import { apiFetch, getAuthHeaders } from '../../../utils/auth';
import { uploadFile } from '../../../utils/uploadService';
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
    WEEKDAYS,
    WEEKEND_DAYS,
    formatRadioTimeSlot,
    formatDurationExact,
    isRadioBlockActiveOnDay,
    isRadioBlockActiveNow,
    sortRadioBlocksByBroadcastOrder,
    getActiveRadioBlock,
    type RadioScheduleBlock,
    type RadioTrackItem,
    type RadioThemeJingle,
    type RadioTopHoraireConfig,
    type RadioTrackCategory,
    getRadioCategoryMeta
} from '../../../utils/radioSchedule';
import { parseArtistAndEvent } from '../../../utils/tvSchedule';
import { RadioRundownTimeline } from '../radio/RadioRundownTimeline';
import { RadioOnAirMonitor } from '../radio/RadioOnAirMonitor';
import { RadioAutomationsPanel } from '../radio/RadioAutomationsPanel';
import { RadioMediaPoolPanel } from '../radio/RadioMediaPoolPanel';

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
    blockColor?: string;
    blockEmoji?: string;
}

// Bloc TV avec ses vidéos
export interface TVBlock {
    id: string;
    title: string;
    color?: string;
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

    // ─── Bibliothèque TV (240 vidéos toujours prêtes) ──────────────────────────
    const [tvBlocks, setTvBlocks] = useState<TVBlock[]>(getInitialTVBlocks);
    const [isTVLibOpen, setIsTVLibOpen] = useState(false);
    const [isEmissionsSidebarOpen, setIsEmissionsSidebarOpen] = useState(true);
    const [tvSearch, setTvSearch] = useState('');
    const [tvFilter, setTvFilter] = useState<'all' | 'liveset' | 'clip'>('all');
    const [tvSelectedBlockId, setTvSelectedBlockId] = useState<string>('all');
    const [tvHideUsed, setTvHideUsed] = useState(false);

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

    // ─── Audit doublons ───────────────────────────────────────────────────────
    const [radioDuplicates, setRadioDuplicates] = useState<DuplicateEntry[]>([]);
    const [showDuplicateAudit, setShowDuplicateAudit] = useState(false);

    const handleOpenDuplicateAudit = () => {
        const dupes = detectRadioDuplicates(blocks);
        setRadioDuplicates(dupes);
        if (dupes.length === 0) {
            showToast('✓ Aucun doublon détecté dans votre grille radio !', 'info');
        } else {
            setShowDuplicateAudit(true);
        }
    };

    // ─── Modal "Envoyer vers TV" ──────────────────────────────────────────────
    const [sendToTVTrack, setSendToTVTrack] = useState<RadioTrackItem | null>(null);
    const [sendToTVBlockId, setSendToTVBlockId] = useState<string>('');

    // ─── Formulaire nouvelle piste manuelle (rétractable) ─────────────────────
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [trackUrl, setTrackUrl] = useState('');
    const [trackTitle, setTrackTitle] = useState('');
    const [trackArtist, setTrackArtist] = useState('');
    const [trackCategory, setTrackCategory] = useState<'liveset' | 'clip'>('liveset');
    const [trackDuration, setTrackDuration] = useState('60');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // ─── Modal Édition d'un clip / set dans l'émission ────────────────────────
    const [editingTrack, setEditingTrack] = useState<{
        trackId: string;
        artist: string;
        title: string;
        category: 'liveset' | 'clip';
        durationMinutes: number;
        youtubeId: string;
    } | null>(null);
    const [isFetchingEditTitle, setIsFetchingEditTitle] = useState(false);

    // ─── TOP Horaire (Début d'heure) ──────────────────────────────────────────
    const [topHoraireConfig, setTopHoraireConfig] = useState<RadioTopHoraireConfig>(getTopHoraireConfig);
    const [isTopHoraireModalOpen, setIsTopHoraireModalOpen] = useState(false);

    // ─── Audio Preview Player (WAV / MP3) ─────────────────────────────────────
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
        themeJingleEnabled: false,
        themeJingleTitle: '',
        themeJingleAudioUrl: '',
        themeJingleYoutubeId: '',
        themeJingleDuration: 15,
    });

    // ─── Sauvegarde ───────────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // ─── Mode Plein Écran & Radionomy & Recherche YouTube ─────────────────────
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRadionomyOpen, setIsRadionomyOpen] = useState(false);
    const [isYouTubeSearchOpen, setIsYouTubeSearchOpen] = useState(false);

    // ─── Studio Tabs & Médiathèque Unifiée ─────────────────────────────────────
    const [activeStudioTab, setActiveStudioTab] = useState<'rundown' | 'on_air' | 'media_pool' | 'automations'>('rundown');

    const [mediaPoolItems, setMediaPoolItems] = useState<RadionomyItem[]>(() => {
        try {
            const saved = localStorage.getItem('dropsiders_radionomy_palette');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_JINGLES_PUBS;
    });

    const handleSaveMediaPoolItem = (newItem: RadionomyItem) => {
        setMediaPoolItems(prev => {
            const updated = [newItem, ...prev.filter(i => i.id !== newItem.id)];
            try { localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(updated)); } catch {}
            return updated;
        });
        showToast(`✓ « ${newItem.title} » ajouté à la médiathèque !`);
    };

    const handleDeleteMediaPoolItem = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Supprimer cet élément ?',
            message: 'Êtes-vous sûr de vouloir supprimer cet élément de la médiathèque ?',
            type: 'danger',
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            onConfirm: () => {
                setMediaPoolItems(prev => {
                    const updated = prev.filter(i => i.id !== id);
                    try { localStorage.setItem('dropsiders_radionomy_palette', JSON.stringify(updated)); } catch {}
                    return updated;
                });
                showToast('Élément supprimé de la médiathèque');
            }
        });
    };

    // ─── Chargement depuis l'API ──────────────────────────────────────────────
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
        fetchSettings().then(() => {
            // Audit doublons après chargement
            setBlocks(prev => {
                const dups = detectRadioDuplicates(prev);
                if (dups.length > 0) {
                    setRadioDuplicates(dups);
                    setShowDuplicateAudit(true);
                }
                return prev;
            });
        });
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

    // ─── Résolution doublon radio ─────────────────────────────────────────────
    const handleResolveRadioDuplicate = (youtubeId: string, keepBlockId: string, removeFromBlockIds: string[]) => {
        setBlocks(prev => prev.map(b => {
            if (!removeFromBlockIds.includes(b.id)) return b;
            return { ...b, tracks: (b.tracks || []).filter(t => t.youtubeId !== youtubeId) };
        }));
        setRadioDuplicates(prev => prev.filter(d => d.youtubeId !== youtubeId));
        showToast(`✅ Doublon résolu : set conservé dans l'émission choisie`);
    };

    // ─── Envoyer un track Radio vers un bloc TV ───────────────────────────────
    const handleSendTrackToTV = (track: RadioTrackItem, targetTVBlockId: string) => {
        const targetTV = tvBlocks.find(b => b.id === targetTVBlockId);
        if (!targetTV) return;

        const alreadyIn = targetTV.videos.some(v => v.youtubeId === track.youtubeId);
        if (alreadyIn) {
            showToast(`⚠️ Ce set est déjà dans le bloc TV « ${targetTV.title} »`, 'warn');
            return;
        }

        const newVid: TVVideoItem = {
            id: `tv_from_radio_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            title: `${track.artist} - ${track.title}`,
            youtubeId: track.youtubeId ?? '',
            duration: track.duration || 3600,
            category: (track.category === 'liveset' || track.category === 'clip') ? track.category : 'liveset',
            blockTitle: targetTV.title,
            blockColor: targetTV.color || '#00f0ff',
            blockEmoji: targetTV.emoji || '📺',
        };

        setTvBlocks(prev => prev.map(b =>
            b.id === targetTVBlockId
                ? { ...b, videos: [...b.videos, newVid] }
                : b
        ));

        showToast(`📺 Ajouté au bloc TV « ${targetTV.title} » !`);
        setSendToTVTrack(null);

        // Sauvegarde immédiate des tv_blocks mis à jour
        setTvBlocks(prev => {
            const updated = prev.map(b =>
                b.id === targetTVBlockId ? { ...b, videos: [...b.videos, newVid] } : b
            );
            apiFetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ tv_blocks: updated }),
            }).catch(e => console.error('Erreur sync TV blocks:', e));
            return updated;
        });
    };

    // Notification toast Dropsiders
    const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // ─── Actions émissions ────────────────────────────────────────────────────
    const openNewBlockForm = () => {
        setEditingBlockId(null); // CRUCIAL: null = Création d'une NOUVELLE émission
        setEditBlockForm({
            title: `ÉMISSION ${blocks.length + 1}`,
            emoji: PRESET_EMOJIS[blocks.length % PRESET_EMOJIS.length],
            color: PRESET_COLORS[blocks.length % PRESET_COLORS.length].hex,
            startHour: (blocks.length * 4) % 24,
            endHour: ((blocks.length * 4) + 4) % 24 || 24,
            days: ALL_DAYS,
            randomize: true,
            themeJingleEnabled: false,
            themeJingleTitle: '',
            themeJingleAudioUrl: '',
            themeJingleYoutubeId: '',
            themeJingleDuration: 15,
        });
        setIsEditingBlock(true);
    };

    const openEditBlockForm = (block: RadioScheduleBlock) => {
        setEditingBlockId(block.id); // CRUCIAL: ID de l'émission à modifier
        setSelectedBlockId(block.id);
        setEditBlockForm({
            title: block.title,
            emoji: block.emoji,
            color: block.color,
            startHour: block.startHour,
            endHour: block.endHour,
            days: block.days || ALL_DAYS,
            randomize: block.randomize,
            themeJingleEnabled: block.themeJingle?.enabled ?? false,
            themeJingleTitle: block.themeJingle?.title || '',
            themeJingleAudioUrl: block.themeJingle?.audioUrl || '',
            themeJingleYoutubeId: block.themeJingle?.youtubeId || '',
            themeJingleDuration: block.themeJingle?.duration || 15,
        });
        setIsEditingBlock(true);
    };

    const handleSaveBlock = () => {
        if (!editBlockForm.title.trim()) {
            showToast('Donnez un nom à votre émission', 'warn');
            return;
        }

        const themeJingle: RadioThemeJingle | undefined = editBlockForm.themeJingleEnabled ? {
            enabled: true,
            title: editBlockForm.themeJingleTitle.trim() || `Générique • ${editBlockForm.title.trim().toUpperCase()}`,
            audioUrl: editBlockForm.themeJingleAudioUrl || undefined,
            youtubeId: editBlockForm.themeJingleYoutubeId || undefined,
            duration: editBlockForm.themeJingleDuration || 15,
        } : undefined;

        if (editingBlockId) {
            // MODE MODIFICATION d'une émission existante
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
                    timeSlot: formatRadioTimeSlot(editBlockForm.startHour, editBlockForm.endHour),
                    themeJingle
                };
            });
            const sorted = sortRadioBlocksByBroadcastOrder(updated, false);
            setBlocks(sorted);
            setSelectedBlockId(editingBlockId);
            showToast(`Émission « ${editBlockForm.title} » mise à jour`);
        } else {
            // MODE CRÉATION d'une NOUVELLE émission distincte
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
                themeJingle
            };
            const sorted = sortRadioBlocksByBroadcastOrder([...blocks, newBlock], false);
            setBlocks(sorted);
            setSelectedBlockId(newId);
            showToast(`Émission « ${newBlock.title} » créée avec succès !`);
        }
        setIsEditingBlock(false);
        setEditingBlockId(null);
    };

    // ─── Actions TOP Horaire & Générique d'émission ───────────────────────────
    const handleSetAsTopHoraire = (item: RadionomyItem) => {
        const updated: RadioTopHoraireConfig = {
            enabled: true,
            title: item.title,
            audioUrl: item.audioUrl,
            youtubeId: item.youtubeId,
            duration: item.duration || 10,
        };
        setTopHoraireConfig(updated);
        localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(updated));
        apiFetch('/api/settings/update', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ radio_top_horaire: updated })
        }).catch(e => console.error('Erreur sauvegarde TOP Horaire:', e));
        showToast(`🔔 TOP Horaire défini : « ${item.title} » (${updated.duration}s)`);
    };

    const handleSetAsThemeJingle = (item: RadionomyItem) => {
        if (!selectedBlockId) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        const theme: RadioThemeJingle = {
            enabled: true,
            title: item.title,
            audioUrl: item.audioUrl,
            youtubeId: item.youtubeId,
            duration: item.duration || 15,
        };
        setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, themeJingle: theme } : b));
        showToast(`🎙️ Générique d'émission défini pour « ${selectedBlock?.title} » !`);
    };

    const handleSaveTopHoraire = (updated: RadioTopHoraireConfig) => {
        setTopHoraireConfig(updated);
        localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(updated));
        apiFetch('/api/settings/update', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ radio_top_horaire: updated })
        }).catch(e => console.error('Erreur sauvegarde TOP Horaire:', e));
        setIsTopHoraireModalOpen(false);
        showToast(updated.enabled ? `🔔 TOP Horaire activé (${updated.duration}s)` : 'TOP Horaire désactivé');
    };

    // Remettre à zéro toute la grille radio
    const handleResetGrid = () => {
        setConfirmModal({
            isOpen: true,
            title: "RÉINITIALISER LA GRILLE RADIO",
            message: "Voulez-vous vraiment remettre la grille radio à zéro (supprimer toutes les émissions) ? Vous pourrez ensuite recréer vos propres émissions de A à Z.",
            type: "danger",
            confirmText: "TOUT EFFACER (0 ÉMISSION)",
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
                    showToast('Grille radio remise à zéro (0 émission)', 'success');
                } catch (e) {
                    console.error('Erreur reset grille:', e);
                }
            }
        });
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

    // Sauvegarder les modifications d'une piste
    const handleSaveTrackEdit = () => {
        if (!editingTrack || !selectedBlock) return;
        if (!editingTrack.title.trim()) {
            showToast('Le titre ne peut pas être vide', 'warn');
            return;
        }

        const cleanYt = extractYouTubeId(editingTrack.youtubeId) || editingTrack.youtubeId.trim();
        const durSec = Math.max(30, (editingTrack.durationMinutes || 60) * 60);

        // Vérification doublon cross-émissions pour le nouvel ID YouTube
        if (cleanYt && cleanYt !== editingTrack.youtubeId) {
            const otherBlock = blocks.find(b =>
                b.id !== selectedBlock.id &&
                b.tracks?.some(t => t.youtubeId === cleanYt)
            );
            if (otherBlock) {
                showToast(`🚫 Cet ID YouTube est déjà dans « ${otherBlock.title} »`, 'warn');
                return;
            }
        }

        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlock.id) return b;
            return {
                ...b,
                tracks: (b.tracks || []).map(t => {
                    if (t.id !== editingTrack.trackId) return t;
                    return {
                        ...t,
                        artist: editingTrack.artist.trim() || 'Artiste',
                        title: editingTrack.title.trim() || 'Titre',
                        category: editingTrack.category,
                        duration: durSec,
                        youtubeId: cleanYt || t.youtubeId,
                    };
                })
            };
        }));

        showToast(`Piste « ${editingTrack.artist} - ${editingTrack.title} » modifiée !`);
        setEditingTrack(null);
    };

    const handleFetchEditYouTube = async () => {
        if (!editingTrack) return;
        const ytid = extractYouTubeId(editingTrack.youtubeId) || editingTrack.youtubeId.trim();
        if (!ytid) { showToast('Lien YouTube non valide', 'warn'); return; }
        setIsFetchingEditTitle(true);
        try {
            const fetched = await fetchYouTubeTitle(ytid);
            if (fetched) {
                const { artist, event } = parseArtistAndEvent(fetched);
                setEditingTrack(t => t ? {
                    ...t,
                    youtubeId: ytid,
                    artist: artist || t.artist,
                    title: event || fetched,
                } : null);
            }
        } catch (e) {
            console.error('Erreur titre auto:', e);
        } finally {
            setIsFetchingEditTitle(false);
        }
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

        // Vérifie si déjà dans CETTE émission
        const alreadyInTarget = target.tracks?.some(t => t.youtubeId === vid.youtubeId);
        if (alreadyInTarget) {
            showToast(`⚠️ Ce set est déjà dans « ${target.title} »`, 'warn');
            return;
        }

        // Vérifie si déjà utilisé dans UNE AUTRE émission
        const otherBlock = blocks.find(b => b.id !== blockId && b.tracks?.some(t => t.youtubeId === vid.youtubeId));
        if (otherBlock) {
            showToast(`🚫 Ce set est déjà dans « ${otherBlock.title} » — retirez-le d'abord`, 'warn');
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
        // Exclure les vidéos déjà utilisées dans N'IMPORTE QUELLE émission
        const allUsedIds = new Set(blocks.flatMap(b => (b.tracks || []).map(t => t.youtubeId)));
        const skipped = tvBlock.videos.filter(v => allUsedIds.has(v.youtubeId)).length;
        const toAdd: RadioTrackItem[] = tvBlock.videos
            .filter(v => !allUsedIds.has(v.youtubeId))
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
            showToast('Toutes les vidéos de ce bloc sont déjà dans une émission', 'info');
            return;
        }

        setBlocks(prev => prev.map(b =>
            b.id === selectedBlock.id
                ? { ...b, tracks: [...(b.tracks || []), ...toAdd] }
                : b
        ));
        const skipMsg = skipped > 0 ? ` (${skipped} déjà utilisé${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''})` : '';
        showToast(`🎉 ${toAdd.length} vidéos importées dans « ${selectedBlock.title} »${skipMsg} !`);
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

        // Vérification doublon cross-émissions
        const otherBlock = blocks.find(b => b.id !== selectedBlock.id && b.tracks?.some(t => t.youtubeId === ytid));
        if (otherBlock) {
            showToast(`🚫 Ce set est déjà dans « ${otherBlock.title} » — retirez-le d'abord`, 'warn');
            return;
        }
        const alreadyInCurrent = selectedBlock.tracks?.some(t => t.youtubeId === ytid);
        if (alreadyInCurrent) {
            showToast(`⚠️ Ce set est déjà dans « ${selectedBlock.title} »`, 'warn');
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

    // ─── Radionomy : Insertion d'un jingle / pub / élément ─────────────────────
    const handleInsertRadionomyItem = (item: RadionomyItem) => {
        if (!selectedBlockId) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        const { artist, event } = parseArtistAndEvent(item.title);
        const mappedCategory: RadioTrackCategory =
            item.category === 'jingle' ? 'jingle'
            : item.category === 'interview' ? 'interview'
            : item.category === 'pub' ? 'pub'
            : item.category === 'promo' ? 'promo'
            : item.category === 'top_horaire' ? 'top_horaire'
            : 'clip';

        const newTrack: RadioTrackItem = {
            id: `rad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            artist: artist || (item.category === 'jingle' ? 'DROPSIDERS' : item.category === 'top_horaire' ? 'TOP HORAIRE' : item.category === 'generique' ? 'GÉNÉRIQUE' : item.category === 'interview' ? 'INTERVIEW' : item.category === 'pub' ? 'SPONSOR' : 'DROPSIDERS RADIO'),
            title: event || item.title,
            youtubeId: item.youtubeId,
            audioUrl: item.audioUrl,
            category: mappedCategory,
            duration: item.duration || 15,
            addedAt: Date.now()
        };
        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlockId) return b;
            return {
                ...b,
                tracks: [...(b.tracks || []), newTrack]
            };
        }));
        showToast(`✓ ${item.category === 'jingle' ? 'Jingle' : item.category === 'top_horaire' ? 'TOP Horaire' : item.category === 'generique' ? 'Générique' : 'Élément'} « ${item.title} » ajouté à l'émission !`);
    };

    // ─── Radionomy : Règle Horloge (Jingle tous les N titres / Pubs) ───────────
    const handleApplyRadionomyRule = ({ jingleEveryN, pubEveryN }: { jingleEveryN: number; pubEveryN: number }) => {
        if (!selectedBlockId) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        const palette: RadionomyItem[] = (mediaPoolItems && mediaPoolItems.length > 0) ? mediaPoolItems : DEFAULT_JINGLES_PUBS;
        const jingles = palette.filter(p => p.category === 'jingle');
        const pubs = palette.filter(p => p.category === 'pub');

        const effectiveJingles = jingles.length > 0 ? jingles : DEFAULT_JINGLES_PUBS.filter(p => p.category === 'jingle');
        const effectivePubs = pubs.length > 0 ? pubs : DEFAULT_JINGLES_PUBS.filter(p => p.category === 'pub');

        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlockId) return b;
            // Ne garder que les vraies pistes de musique pour réinsérer proprement
            const pureTracks = (b.tracks || []).filter(t => !['jingle', 'pub', 'promo', 'top_horaire'].includes(t.category || '') && !t.id.startsWith('rad_'));
            if (pureTracks.length === 0) return b;

            const newTracks: RadioTrackItem[] = [];
            let jingleIdx = 0;
            let pubIdx = 0;

            pureTracks.forEach((track, index) => {
                newTracks.push({
                    ...track,
                    category: track.category || 'set'
                });
                const pos = index + 1;
                if (pubEveryN > 0 && pos % pubEveryN === 0 && effectivePubs.length > 0) {
                    const pub = effectivePubs[pubIdx % effectivePubs.length];
                    pubIdx++;
                    newTracks.push({
                        id: `rad_pub_${Date.now()}_${pos}`,
                        artist: 'SPONSOR',
                        title: pub.title,
                        youtubeId: pub.youtubeId,
                        audioUrl: pub.audioUrl,
                        category: 'pub',
                        duration: pub.duration || 30,
                        addedAt: Date.now()
                    });
                }
                if (jingleEveryN > 0 && pos % jingleEveryN === 0 && effectiveJingles.length > 0) {
                    const jing = effectiveJingles[jingleIdx % effectiveJingles.length];
                    jingleIdx++;
                    newTracks.push({
                        id: `rad_jing_${Date.now()}_${pos}`,
                        artist: 'DROPSIDERS JINGLE',
                        title: jing.title,
                        youtubeId: jing.youtubeId,
                        audioUrl: jing.audioUrl,
                        category: 'jingle',
                        duration: jing.duration || 15,
                        addedAt: Date.now()
                    });
                }
            });

            return { ...b, tracks: newTracks };
        }));
        showToast('✓ Règle Horloge Radionomy appliquée avec succès !');
    };

    // ─── Injection Automatique d'Habillage Radio (Jingles + Pubs + Interviews) ───
    const handleAutoInjectHabillage = (target: 'current' | 'all' = 'current') => {
        const palette: RadionomyItem[] = (mediaPoolItems && mediaPoolItems.length > 0) ? mediaPoolItems : DEFAULT_JINGLES_PUBS;
        const jingles = palette.filter(p => p.category === 'jingle');
        const pubs = palette.filter(p => p.category === 'pub');
        const interviews = palette.filter(p => p.category === 'interview');

        const effectiveJingles = jingles.length > 0 ? jingles : DEFAULT_JINGLES_PUBS.filter(p => p.category === 'jingle');
        const effectivePubs = pubs.length > 0 ? pubs : DEFAULT_JINGLES_PUBS.filter(p => p.category === 'pub');
        const effectiveInterviews = interviews.length > 0 ? interviews : DEFAULT_JINGLES_PUBS.filter(p => p.category === 'interview');

        let injectedJinglesCount = 0;
        let injectedPubsCount = 0;

        setBlocks(prev => prev.map(b => {
            if (target === 'current' && b.id !== selectedBlockId) return b;

            // Extraire uniquement les sets de musique
            const pureTracks = (b.tracks || []).filter(t => !['jingle', 'pub', 'promo', 'top_horaire'].includes(t.category || '') && !t.id.startsWith('rad_') && !t.id.startsWith('sched_'));
            if (pureTracks.length === 0) return b;

            const newTracks: RadioTrackItem[] = [];
            let jIdx = 0;
            let pIdx = 0;

            pureTracks.forEach((track, index) => {
                newTracks.push({
                    ...track,
                    category: track.category || 'set'
                });

                // 1 Jingle après chaque set
                if (effectiveJingles.length > 0) {
                    const jItem = effectiveJingles[jIdx % effectiveJingles.length];
                    jIdx++;
                    injectedJinglesCount++;
                    newTracks.push({
                        id: `rad_jing_${Date.now()}_${b.id}_${index}`,
                        artist: 'DROPSIDERS JINGLE',
                        title: jItem.title,
                        youtubeId: jItem.youtubeId,
                        audioUrl: jItem.audioUrl,
                        duration: jItem.duration || 15,
                        category: 'jingle',
                        addedAt: Date.now()
                    });
                }

                // 1 Pub toutes les 2 sets
                if ((index + 1) % 2 === 0 && effectivePubs.length > 0) {
                    const pItem = effectivePubs[pIdx % effectivePubs.length];
                    pIdx++;
                    injectedPubsCount++;
                    newTracks.push({
                        id: `rad_pub_${Date.now()}_${b.id}_${index}`,
                        artist: 'SPONSOR',
                        title: pItem.title,
                        youtubeId: pItem.youtubeId,
                        audioUrl: pItem.audioUrl,
                        duration: pItem.duration || 30,
                        category: 'pub',
                        addedAt: Date.now()
                    });
                }

                // 1 Interview de la semaine (au 2ème set)
                if (index === 1 && effectiveInterviews.length > 0) {
                    const interItem = effectiveInterviews[0];
                    newTracks.push({
                        id: `rad_inter_${Date.now()}_${b.id}_${index}`,
                        artist: 'INTERVIEW',
                        title: interItem.title,
                        youtubeId: interItem.youtubeId,
                        audioUrl: interItem.audioUrl,
                        duration: interItem.duration || 180,
                        category: 'interview',
                        addedAt: Date.now()
                    });
                }
            });

            return { ...b, tracks: newTracks };
        }));

        showToast(target === 'current'
            ? `✓ Habillage radio injecté : ${injectedJinglesCount} jingles & ${injectedPubsCount} pubs !`
            : `✓ Habillage radio injecté sur toute la grille (${injectedJinglesCount} jingles & ${injectedPubsCount} pubs) !`
        );
    };

    // ─── Recherche YouTube directe : Ajout d'une vidéo ─────────────────────────
    const handleYouTubeAddVideo = (video: {
        youtubeId: string;
        title: string;
        duration: number;
        category: any;
    }) => {
        if (!selectedBlockId) {
            showToast('Sélectionnez d\'abord une émission', 'warn');
            return;
        }
        const { artist, event } = parseArtistAndEvent(video.title);
        const newTrack: RadioTrackItem = {
            id: `yt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            artist: artist || 'Artiste',
            title: event || video.title,
            youtubeId: video.youtubeId,
            category: (video.category === 'clip' || video.category === 'jingle' || video.category === 'pub') ? 'clip' : 'liveset',
            duration: video.duration || 3600,
            addedAt: Date.now()
        };
        setBlocks(prev => prev.map(b => {
            if (b.id !== selectedBlockId) return b;
            return {
                ...b,
                tracks: [...(b.tracks || []), newTrack]
            };
        }));
        showToast(`✓ « ${newTrack.artist} - ${newTrack.title} » ajouté depuis YouTube !`);
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
                    radio_top_horaire: topHoraireConfig
                }),
            });
            if (res.ok) {
                window.dispatchEvent(new Event('dropsiders_radio_blocks_updated'));
                setSaveSuccess(true);
                showToast('Programmation radio enregistrée avec succès !');
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                console.error('Erreur API sauvegarde radio status:', res.status);
                showToast('Erreur lors de la sauvegarde sur le serveur', 'warn');
            }
        } catch (e) {
            console.error('Erreur sauvegarde radio:', e);
            showToast('Erreur sauvegarde. Données gardées en local.', 'warn');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Map youtubeId -> infos émission (titre, couleur, emoji) ─────────────
    const allUsedIdToBlock = useMemo(() => {
        const map = new Map<string, { id: string; title: string; color: string; emoji: string }>();
        blocks.forEach(b => {
            (b.tracks || []).forEach(t => {
                if (t.youtubeId) {
                    map.set(t.youtubeId, {
                        id: b.id,
                        title: b.title,
                        color: b.color || '#00f0ff',
                        emoji: b.emoji || '📻'
                    });
                }
            });
        });
        return map;
    }, [blocks]);

    // ─── Vidéos TV filtrées pour la bibliothèque ──────────────────────────────
    const filteredTVVideos = useMemo(() => {
        const q = tvSearch.toLowerCase().trim();
        const result: TVVideoItem[] = [];

        tvBlocks.forEach(b => {
            if (tvSelectedBlockId !== 'all' && b.id !== tvSelectedBlockId) return;
            b.videos.forEach(v => {
                if (tvFilter !== 'all' && v.category !== tvFilter) return;
                if (tvHideUsed && allUsedIdToBlock.has(v.youtubeId)) return;
                if (q) {
                    const matchTitle = v.title.toLowerCase().includes(q);
                    const matchYt = v.youtubeId.toLowerCase().includes(q);
                    if (!matchTitle && !matchYt) return;
                }
                result.push({
                    ...v,
                    blockTitle: b.title,
                    blockColor: b.color || '#00f0ff',
                    blockEmoji: b.emoji || '📺'
                });
            });
        });

        return result;
    }, [tvBlocks, tvSearch, tvFilter, tvSelectedBlockId, tvHideUsed, allUsedIdToBlock]);

    const totalTracks = useMemo(() => blocks.reduce((acc, b) => acc + (b.tracks?.length || 0), 0), [blocks]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className={`fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-xl ${
                    isFullscreen ? 'p-0' : 'p-2 md:p-4'
                }`}
                onClick={e => { if (e.target === e.currentTarget && !isFullscreen) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className={`bg-[#07080c]/98 backdrop-blur-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col font-sans transition-all duration-200 ${
                        isFullscreen
                            ? 'w-screen h-screen max-w-none rounded-none border-none'
                            : 'rounded-3xl w-[99vw] max-w-[1540px] h-[95vh]'
                    }`}
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

                    {/* ── HEADER DROPSIDERS BROADCAST STUDIO ───────────────── */}
                    <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-white/10 shrink-0 bg-black/50 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-purple-600/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                                <Radio className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-display font-black text-white uppercase italic tracking-tighter leading-tight flex items-center gap-2">
                                    DROPSIDERS <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-purple-400 to-neon-red">RADIO STUDIO</span>
                                    <span className="text-[10px] font-mono normal-case not-italic text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                        {blocks.length} créneau{blocks.length !== 1 ? 'x' : ''} · {totalTracks} titre{totalTracks !== 1 ? 's' : ''}
                                    </span>
                                </h2>
                                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>Master Control Room</span>
                                    <span className="text-white/20">|</span>
                                    <span className="text-neon-cyan font-bold">{topHoraireConfig.enabled ? `Top Horaire ON (${topHoraireConfig.duration}s)` : 'Top Horaire OFF'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Navigation des 4 Espaces de Travail Studio */}
                        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveStudioTab('rundown')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                    activeStudioTab === 'rundown'
                                        ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Conducteur & Grille</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveStudioTab('on_air')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                    activeStudioTab === 'on_air'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Radio className="w-3.5 h-3.5" />
                                <span>Régie ON AIR</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveStudioTab('media_pool')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                    activeStudioTab === 'media_pool'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Médiathèque & Bac ({mediaPoolItems.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveStudioTab('automations')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                    activeStudioTab === 'automations'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Automations & Horloge</span>
                            </button>
                        </div>

                        {/* Actions à droite */}
                        <div className="flex items-center gap-2">
                            {activeStudioTab === 'rundown' && (
                                <button
                                    type="button"
                                    onClick={() => setIsTVLibOpen(!isTVLibOpen)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                                        isTVLibOpen
                                            ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Tv className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="hidden md:inline">Bibliothèque TV ({totalTVVideos})</span>
                                    {isTVLibOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={onToggleRadio}
                                className={`px-3 py-2 rounded-xl text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                                    isRadioActive
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${isRadioActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                                {isRadioActive ? 'ON AIR' : 'HORS LIGNE'}
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-4 py-2 rounded-xl text-[11px] font-display font-black uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                    saveSuccess
                                        ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                        : 'bg-neon-cyan text-black hover:bg-white shadow-[0_0_25px_rgba(0,240,255,0.4)]'
                                }`}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                <span className="hidden sm:inline">{isSaving ? 'Enregistrement...' : saveSuccess ? 'Sauvegardé !' : 'Sauvegarder'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className={`p-2 border rounded-xl transition-all cursor-pointer ${
                                    isFullscreen
                                        ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-white'
                                }`}
                                title={isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"}
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>

                    {/* ── CORPS DU STUDIO SELON L'ONGLET SÉLECTIONNÉ ── */}
                    {activeStudioTab === 'on_air' && (
                        <RadioOnAirMonitor
                            blocks={blocks}
                            topHoraireConfig={topHoraireConfig}
                            isRadioActive={isRadioActive}
                            onToggleRadio={onToggleRadio}
                            onGoToRundown={() => setActiveStudioTab('rundown')}
                            onGoToMediaPool={() => setActiveStudioTab('media_pool')}
                        />
                    )}

                    {activeStudioTab === 'media_pool' && (
                        <RadioMediaPoolPanel
                            items={mediaPoolItems}
                            activeBlockTitle={selectedBlock?.title}
                            onInsertItemToActiveBlock={handleInsertRadionomyItem}
                            onSetAsTopHoraire={(item) => {
                                const updated = { ...topHoraireConfig, audioUrl: item.audioUrl, duration: item.duration || 10 };
                                setTopHoraireConfig(updated);
                                localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(updated));
                                showToast(`✓ « ${item.title} » défini comme Top Horaire officiel !`);
                            }}
                            onSetAsThemeJingle={(item) => {
                                if (selectedBlockId) {
                                    setBlocks(prev => prev.map(b => b.id === selectedBlockId ? {
                                        ...b,
                                        themeJingle: {
                                            enabled: true,
                                            title: item.title,
                                            audioUrl: item.audioUrl,
                                            youtubeId: item.youtubeId,
                                            duration: item.duration || 15
                                        }
                                    } : b));
                                    showToast(`✓ « ${item.title} » défini comme générique d'émission !`);
                                } else {
                                    showToast('Sélectionnez d\'abord une émission dans le conducteur', 'warn');
                                }
                            }}
                            onDeleteItem={handleDeleteMediaPoolItem}
                            onAddNewItem={handleSaveMediaPoolItem}
                            playingAudioId={playingAudioId}
                            onToggleAudioPreview={handleToggleAudioPreview}
                        />
                    )}

                    {activeStudioTab === 'automations' && (
                        <RadioAutomationsPanel
                            topHoraireConfig={topHoraireConfig}
                            onUpdateTopHoraire={(c) => {
                                setTopHoraireConfig(c);
                                localStorage.setItem(STORAGE_RADIO_TOP_HORAIRE_KEY, JSON.stringify(c));
                                showToast('✓ Réglages Top Horaire enregistrés !');
                            }}
                            blocks={blocks}
                            selectedBlockId={selectedBlockId}
                            onApplyRadionomyRule={(pubEveryN, jingleEveryN) => handleApplyRadionomyRule({ pubEveryN, jingleEveryN })}
                            onResetGrid={handleResetGrid}
                            onOpenDuplicateAudit={handleOpenDuplicateAudit}
                            playingAudioId={playingAudioId}
                            onToggleAudioPreview={handleToggleAudioPreview}
                        />
                    )}

                    {/* ── ONGLET CONDUCTEUR & GRILLE 24/7 (3 COLONNES) ────── */}
                    {activeStudioTab === 'rundown' && (
                        <div className="flex flex-1 overflow-hidden min-h-0">

                        {/* ═════════════════════════════════════════════════════
                            COLONNE 1 : ÉMISSIONS RADIO (Gauche - Collapsible)
                        ═════════════════════════════════════════════════════ */}
                        <div className={`shrink-0 border-r border-white/10 flex flex-col bg-black/30 transition-all duration-200 ${
                            isEmissionsSidebarOpen ? 'w-64' : 'w-10'
                        }`}>
                            <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.01] gap-1.5">
                                {isEmissionsSidebarOpen && (
                                    <span className="text-[10px] font-display font-black uppercase italic tracking-wider text-gray-300 flex items-center gap-1.5 flex-1 truncate">
                                        <Calendar className="w-3.5 h-3.5 text-neon-cyan shrink-0" />
                                        Émissions ({blocks.length})
                                    </span>
                                )}
                                <div className="flex items-center gap-1 ml-auto">
                                    {isEmissionsSidebarOpen && blocks.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleResetGrid}
                                            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-neon-red border border-red-500/30 text-[8.5px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer"
                                            title="Remettre la grille à zéro"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                    {isEmissionsSidebarOpen && (
                                        <button
                                            type="button"
                                            onClick={openNewBlockForm}
                                            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan text-neon-cyan hover:text-black border border-neon-cyan/40 text-[9px] font-display font-black uppercase italic tracking-wider transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] cursor-pointer"
                                            title="Créer une émission"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsEmissionsSidebarOpen(!isEmissionsSidebarOpen)}
                                        className="p-1 rounded-lg text-gray-500 hover:text-neon-cyan hover:bg-white/10 transition-all cursor-pointer shrink-0"
                                        title={isEmissionsSidebarOpen ? "Masquer la liste" : "Afficher les émissions"}
                                    >
                                        {isEmissionsSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Mini dots when collapsed */}
                            {!isEmissionsSidebarOpen && blocks.length > 0 && (
                                <div className="flex-1 overflow-y-auto py-2.5 flex flex-col items-center gap-1.5">
                                    {blocks.map(b => {
                                        const isSelected = b.id === selectedBlockId;
                                        const isLive = isRadioBlockActiveNow(b);
                                        return (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => { setSelectedBlockId(b.id); setIsEditingBlock(false); setIsEmissionsSidebarOpen(true); }}
                                                title={`${b.emoji} ${b.title} · ${b.timeSlot || ''}`}
                                                className={`w-7 h-7 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer border-2 ${
                                                    isSelected
                                                        ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                                        : 'border-transparent hover:border-white/30 hover:scale-105'
                                                } ${isLive ? 'animate-pulse' : ''}`}
                                                style={{ backgroundColor: `${b.color}22` }}
                                            >
                                                <span>{b.emoji}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className={`flex-1 overflow-y-auto p-2.5 space-y-2 ${
                                !isEmissionsSidebarOpen ? 'hidden' : ''
                            }`}>
                                {blocks.length === 0 && !isEditingBlock && (
                                    <div className="p-6 text-center text-gray-500">
                                        <Radio className="w-10 h-10 mx-auto mb-2 text-gray-600 opacity-40" />
                                        <p className="font-display font-black uppercase italic text-xs text-gray-300">Aucune émission</p>
                                        <p className="text-[10px] mt-1 text-gray-500">Cliquez sur + pour créer votre premier créneau radio.</p>
                                    </div>
                                )}


                                {blocks.map(b => {
                                    const isSelected = b.id === selectedBlockId;
                                    const isLive = isRadioBlockActiveNow(b);
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
                                                <div className="flex items-center gap-1.5">
                                                    {b.themeJingle?.enabled && (
                                                        <span className="text-[8px] font-mono font-bold text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-500/30" title={`Générique : ${b.themeJingle.title}`}>
                                                            🎙️ {b.themeJingle.duration}s
                                                        </span>
                                                    )}
                                                    <span className="text-[8.5px] font-mono font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-md border border-neon-cyan/20">
                                                        {b.tracks?.length || 0} piste{(b.tracks?.length || 0) !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
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

                            {isEmissionsSidebarOpen && (
                                <div className="p-3 border-t border-white/10 text-center bg-black/40">
                                    <p className="text-[8.5px] font-mono text-gray-500 uppercase tracking-wider">
                                        💡 Glissez-déposez ici
                                    </p>
                                </div>
                            )}
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

                                    {/* ── GÉNÉRIQUE D'OUVERTURE DE L'ÉMISSION ── */}
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                                                    <Radio className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-display font-black text-white uppercase italic tracking-wider block">
                                                        Générique d'Ouverture de l'Émission
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-sans">
                                                        Jingle ou thème sonore diffusé automatiquement au début de chaque émission
                                                    </span>
                                                </div>
                                            </div>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editBlockForm.themeJingleEnabled}
                                                    onChange={e => setEditBlockForm(f => ({ ...f, themeJingleEnabled: e.target.checked }))}
                                                    className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
                                                />
                                                <span className="text-[10px] font-display font-black uppercase italic text-purple-300">
                                                    {editBlockForm.themeJingleEnabled ? 'Actif' : 'Désactivé'}
                                                </span>
                                            </label>
                                        </div>

                                        {editBlockForm.themeJingleEnabled && (
                                            <div className="pt-2 border-t border-white/5 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                    <div className="md:col-span-6 space-y-1">
                                                        <label className="text-[9px] font-mono text-gray-400 uppercase">Titre du Générique</label>
                                                        <input
                                                            type="text"
                                                            value={editBlockForm.themeJingleTitle}
                                                            onChange={e => setEditBlockForm(f => ({ ...f, themeJingleTitle: e.target.value }))}
                                                            placeholder={`Ex: Générique Intro ${editBlockForm.title || "Émission"}`}
                                                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-3 space-y-1">
                                                        <label className="text-[9px] font-mono text-gray-400 uppercase">Durée (secondes)</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={300}
                                                            value={editBlockForm.themeJingleDuration}
                                                            onChange={e => setEditBlockForm(f => ({ ...f, themeJingleDuration: parseInt(e.target.value, 10) || 15 }))}
                                                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs text-center font-mono focus:outline-none focus:border-purple-400"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-3 flex gap-2">
                                                        {editBlockForm.themeJingleAudioUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleAudioPreview('theme_form_preview', editBlockForm.themeJingleAudioUrl!)}
                                                                className={`flex-1 py-2 rounded-xl text-[10px] font-display font-black uppercase italic tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                                    playingAudioId === 'theme_form_preview'
                                                                        ? 'bg-neon-cyan text-black'
                                                                        : 'bg-purple-600/30 text-purple-200 hover:bg-purple-600/40'
                                                                }`}
                                                            >
                                                                {playingAudioId === 'theme_form_preview' ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                                <span>{playingAudioId === 'theme_form_preview' ? 'Stop' : 'Écouter'}</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => setIsRadionomyOpen(true)}
                                                            className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-display font-black uppercase italic tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                                                        >
                                                            <Sliders className="w-3 h-3 text-purple-400" />
                                                            <span>Bac Jingles</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Upload direct d'un MP3/WAV pour ce générique */}
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                                                    <FileAudio className="w-4 h-4 text-purple-400 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-gray-300 font-bold truncate">
                                                            {editBlockForm.themeJingleAudioUrl 
                                                                ? "Fichier audio MP3/WAV configuré ✓" 
                                                                : editBlockForm.themeJingleYoutubeId 
                                                                    ? `Lien YouTube ID: ${editBlockForm.themeJingleYoutubeId}` 
                                                                    : "Uploadez un fichier WAV/MP3 ou choisissez un jingle du bac"}
                                                        </p>
                                                    </div>
                                                    <label className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                                                        <Upload className="w-3 h-3" />
                                                        <span>Uploader WAV/MP3</span>
                                                        <input
                                                            type="file"
                                                            accept="audio/*,.mp3,.wav,.ogg,.m4a"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                showToast(`Upload de ${file.name}...`, 'info');
                                                                try {
                                                                    const objUrl = URL.createObjectURL(file);
                                                                    const audio = new Audio(objUrl);
                                                                    audio.addEventListener('loadedmetadata', () => {
                                                                        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                                                                            setEditBlockForm(f => ({ ...f, themeJingleDuration: Math.round(audio.duration) }));
                                                                        }
                                                                    });
                                                                    let uploadedUrl: string;
                                                                    try {
                                                                        uploadedUrl = await uploadFile(file, 'radio/jingles');
                                                                    } catch {
                                                                        uploadedUrl = await new Promise<string>((res, rej) => {
                                                                            const r = new FileReader();
                                                                            r.onload = () => res(r.result as string);
                                                                            r.onerror = rej;
                                                                            r.readAsDataURL(file);
                                                                        });
                                                                    }
                                                                    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
                                                                    setEditBlockForm(f => ({
                                                                        ...f,
                                                                        themeJingleTitle: f.themeJingleTitle || cleanName,
                                                                        themeJingleAudioUrl: uploadedUrl,
                                                                        themeJingleYoutubeId: ''
                                                                    }));
                                                                    showToast(`✓ Fichier audio chargé pour le générique !`);
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    showToast('Erreur chargement audio', 'warn');
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        )}
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

                            {/* ── ÉMISSION SÉLECTIONNÉE DROPSIDERS (CONDUCTEUR D'ANTENNE AVEC BADGES) ── */}
                            {selectedBlock && !isEditingBlock && (
                                <RadioRundownTimeline
                                    block={selectedBlock}
                                    topHoraireConfig={topHoraireConfig}
                                    playingAudioId={playingAudioId}
                                    onToggleAudioPreview={handleToggleAudioPreview}
                                    onMoveTrack={(idx, dir) => handleMoveTrack(idx, dir)}
                                    onDeleteTrack={(idx) => {
                                        const t = selectedBlock.tracks[idx];
                                        if (t) handleDeleteTrack(t.id, `${t.artist || ''} - ${t.title}`);
                                    }}
                                    onEditTrack={(track) => setEditingTrack({
                                        trackId: track.id,
                                        artist: track.artist || '',
                                        title: track.title,
                                        category: track.category === 'clip' ? 'clip' : 'liveset',
                                        durationMinutes: Math.round((track.duration || 3600) / 60),
                                        youtubeId: track.youtubeId || ''
                                    })}
                                    onQuickAdd={(cat) => {
                                        if (cat === 'set') {
                                            setShowManualAdd(true);
                                            setTrackCategory('liveset');
                                        } else if (['jingle', 'interview', 'pub', 'promo'].includes(cat)) {
                                            setActiveStudioTab('media_pool');
                                        }
                                    }}
                                    onOpenYouTubeSearch={() => setIsYouTubeSearchOpen(true)}
                                    onOpenMediaPool={() => setActiveStudioTab('media_pool')}
                                    onOpenEditBlock={() => openEditBlockForm(selectedBlock)}
                                    mediaPoolItems={mediaPoolItems}
                                    onInsertMediaItem={handleInsertRadionomyItem}
                                    onAutoInjectHabillage={() => handleAutoInjectHabillage('current')}
                                />
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

                                    {/* Filtre masquer/montrer les sets déjà utilisés */}
                                    <button
                                        type="button"
                                        onClick={() => setTvHideUsed(v => !v)}
                                        className={`w-full py-1.5 rounded-xl text-[9px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                            tvHideUsed
                                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                                        }`}
                                    >
                                        <AlertTriangle className="w-3 h-3" />
                                        {tvHideUsed
                                            ? `Masquer utilisés (${allUsedIdToBlock.size})`
                                            : `Masquer les ${allUsedIdToBlock.size} déjà assignés`
                                        }
                                    </button>

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
                                            {tvHideUsed ? 'Toutes les vidéos sont déjà assignées à une émission.' : 'Aucune vidéo ne correspond à votre recherche.'}
                                        </div>
                                    ) : (
                                        filteredTVVideos.map(vid => {
                                            const isAlreadyInSelected = selectedBlock?.tracks?.some(t => t.youtubeId === vid.youtubeId);
                                            // Émission qui utilise cette vidéo (toutes émissions confondues)
                                            const usedInBlock = allUsedIdToBlock.get(vid.youtubeId) ?? null;
                                            const isUsedInAnyBlock = usedInBlock !== null;
                                            const usedInBlockName = usedInBlock?.title ?? '';
                                            const isBeingDragged = draggingVideo?.id === vid.id;

                                            return (
                                                <div
                                                    key={vid.id}
                                                    draggable={!isUsedInAnyBlock}
                                                    onDragStart={(e) => {
                                                        if (isUsedInAnyBlock) { e.preventDefault(); return; }
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
                                                    title={isUsedInAnyBlock ? `Déjà assigné à « ${usedInBlockName} »` : undefined}
                                                    className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 group relative select-none ${
                                                        isBeingDragged
                                                            ? 'opacity-40 border-dashed border-neon-cyan cursor-grab active:cursor-grabbing'
                                                            : isUsedInAnyBlock
                                                                ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/5'
                                                                : isAlreadyInSelected
                                                                    ? 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing'
                                                                    : 'bg-black/40 border-white/5 hover:border-neon-cyan/50 hover:bg-white/[0.04] cursor-grab active:cursor-grabbing'
                                                    }`}
                                                >
                                                    {/* Poignée de drag */}
                                                    <div className={`shrink-0 transition-colors ${isUsedInAnyBlock ? 'text-gray-700' : 'text-gray-600 group-hover:text-neon-cyan'}`}>
                                                        <GripVertical className="w-4 h-4" />
                                                    </div>

                                                    {/* Miniature */}
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={`https://img.youtube.com/vi/${vid.youtubeId}/default.jpg`}
                                                            alt=""
                                                            className={`w-13 h-8.5 rounded-xl object-cover bg-black border border-white/10 ${isUsedInAnyBlock ? 'grayscale' : ''}`}
                                                        />
                                                        <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono bg-black/85 px-1 rounded text-gray-300">
                                                            {formatDurationExact(vid.duration || 3600)}
                                                        </span>
                                                    </div>

                                                    {/* Titre & Bloc d'origine */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-[10.5px] font-display font-black italic uppercase truncate leading-tight transition-colors ${
                                                            isUsedInAnyBlock ? 'text-gray-600' : 'text-white group-hover:text-neon-cyan'
                                                        }`}>
                                                            {vid.title}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <span className={`text-[7px] font-display font-black uppercase italic px-1.5 py-0.2 rounded ${
                                                                vid.category === 'clip'
                                                                    ? 'bg-purple-500/20 text-purple-300'
                                                                    : 'bg-cyan-500/20 text-cyan-300'
                                                            }`}>
                                                                {vid.category === 'clip' ? 'CLIP' : 'SET'}
                                                            </span>
                                                            {/* Badge émission d'assignation ou bloc TV d'origine avec COULEUR */}
                                                            {isUsedInAnyBlock && usedInBlock ? (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[7px] font-display font-black uppercase italic px-1.5 py-0.5 rounded border truncate max-w-[125px] shadow-sm"
                                                                    style={{
                                                                        backgroundColor: `${usedInBlock.color}20`,
                                                                        borderColor: `${usedInBlock.color}50`,
                                                                        color: usedInBlock.color,
                                                                    }}
                                                                    title={`Déjà assigné à l'émission « ${usedInBlock.title} »`}
                                                                >
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_5px_currentColor]"
                                                                        style={{ backgroundColor: usedInBlock.color }}
                                                                    />
                                                                    <span className="truncate">✓ {usedInBlock.emoji} {usedInBlock.title}</span>
                                                                </span>
                                                            ) : vid.blockTitle ? (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[7px] font-display font-black uppercase italic px-1.5 py-0.5 rounded border truncate max-w-[125px]"
                                                                    style={vid.blockColor ? {
                                                                        backgroundColor: `${vid.blockColor}15`,
                                                                        borderColor: `${vid.blockColor}35`,
                                                                        color: vid.blockColor,
                                                                    } : {
                                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                                        borderColor: 'rgba(255,255,255,0.1)',
                                                                        color: '#9ca3af'
                                                                    }}
                                                                    title={`Bloc TV source : ${vid.blockTitle}`}
                                                                >
                                                                    {vid.blockColor && (
                                                                        <span
                                                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                            style={{ backgroundColor: vid.blockColor }}
                                                                        />
                                                                    )}
                                                                    <span className="truncate">{vid.blockEmoji || '📺'} {vid.blockTitle}</span>
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    {/* Bouton Ajouter (+) — désactivé si déjà utilisé */}
                                                    <button
                                                        type="button"
                                                        disabled={isUsedInAnyBlock}
                                                        onClick={() => !isUsedInAnyBlock && handleImportFromTV(vid, selectedBlockId)}
                                                        className={`shrink-0 p-1.5 rounded-xl transition-all ${
                                                            isUsedInAnyBlock
                                                                ? 'cursor-not-allowed text-gray-700'
                                                                : isAlreadyInSelected
                                                                    ? 'cursor-pointer text-emerald-400 hover:bg-emerald-500/20'
                                                                    : 'cursor-pointer bg-white/5 hover:bg-neon-cyan hover:text-black text-gray-300'
                                                        }`}
                                                        title={isUsedInAnyBlock ? `Déjà dans « ${usedInBlockName} »` : isAlreadyInSelected ? "Déjà dans cette émission" : "Ajouter à l'émission sélectionnée"}
                                                    >
                                                        {isUsedInAnyBlock ? (
                                                            <AlertTriangle className="w-4 h-4 text-amber-500/50" />
                                                        ) : isAlreadyInSelected ? (
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
                )}
                </motion.div>

                {/* ── MODALE ÉDITION D'UNE PISTE (Dropsiders Style) ── */}
                <AnimatePresence>
                    {editingTrack && (
                        <div
                            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                            onClick={e => { if (e.target === e.currentTarget) setEditingTrack(null); }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-[#0b0c14] border border-neon-cyan/40 rounded-3xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(0,240,255,0.2)] space-y-5 relative"
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                    <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-neon-cyan" />
                                        Modifier le clip / set
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setEditingTrack(null)}
                                        className="text-gray-400 hover:text-white p-1 cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Miniature */}
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                                    <img
                                        src={`https://img.youtube.com/vi/${editingTrack.youtubeId}/default.jpg`}
                                        alt=""
                                        className="w-16 h-10 rounded-xl object-cover bg-black border border-white/10 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-display font-black text-white uppercase italic truncate">
                                            {editingTrack.artist || 'Artiste'} - {editingTrack.title || 'Titre'}
                                        </p>
                                        <p className="text-[9px] font-mono text-gray-500">ID: {editingTrack.youtubeId}</p>
                                    </div>
                                </div>

                                {/* Formulaire */}
                                <div className="space-y-3.5">
                                    <div>
                                        <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block mb-1">
                                            Artiste / DJ
                                        </label>
                                        <input
                                            type="text"
                                            value={editingTrack.artist}
                                            onChange={e => setEditingTrack(t => t ? { ...t, artist: e.target.value } : null)}
                                            placeholder="Ex: Martin Garrix..."
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-neon-cyan"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block mb-1">
                                            Titre / Événement
                                        </label>
                                        <input
                                            type="text"
                                            value={editingTrack.title}
                                            onChange={e => setEditingTrack(t => t ? { ...t, title: e.target.value } : null)}
                                            placeholder="Ex: Live @ Tomorrowland 2026..."
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-neon-cyan"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block mb-1">
                                                Type
                                            </label>
                                            <select
                                                value={editingTrack.category}
                                                onChange={e => {
                                                    const cat = e.target.value as 'liveset' | 'clip';
                                                    setEditingTrack(t => t ? {
                                                        ...t,
                                                        category: cat,
                                                        durationMinutes: cat === 'clip' && t.durationMinutes > 15 ? 4 : t.durationMinutes
                                                    } : null);
                                                }}
                                                className="w-full px-3 py-2.5 rounded-xl bg-[#14141e] border border-white/15 text-white text-xs font-display font-black uppercase italic cursor-pointer"
                                            >
                                                <option value="liveset">Liveset / DJ Set</option>
                                                <option value="clip">Clip Vidéo</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block mb-1">
                                                Durée (minutes)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={600}
                                                value={editingTrack.durationMinutes}
                                                onChange={e => setEditingTrack(t => t ? { ...t, durationMinutes: parseInt(e.target.value) || 1 } : null)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono font-bold focus:outline-none focus:border-neon-cyan"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-display font-black text-gray-400 uppercase italic tracking-wider block mb-1">
                                            Lien YouTube / ID
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editingTrack.youtubeId}
                                                onChange={e => setEditingTrack(t => t ? { ...t, youtubeId: e.target.value } : null)}
                                                placeholder="https://youtube.com/watch?v=... ou ID"
                                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-neon-cyan"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleFetchEditYouTube}
                                                disabled={isFetchingEditTitle || !editingTrack.youtubeId}
                                                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[9px] font-display font-black uppercase italic disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap"
                                            >
                                                {isFetchingEditTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Auto Titre'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveTrackEdit}
                                        className="flex-1 py-3 rounded-2xl bg-neon-cyan text-black font-display font-black text-xs uppercase italic tracking-wider hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Check className="w-4 h-4" />
                                        Enregistrer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingTrack(null)}
                                        className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-display font-black text-xs uppercase italic transition-all cursor-pointer"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

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

                {/* ── AUDIT DOUBLONS RADIO ── */}
                <DuplicateAuditModal
                    isOpen={showDuplicateAudit && radioDuplicates.length > 0}
                    mode="radio"
                    duplicates={radioDuplicates}
                    onResolve={handleResolveRadioDuplicate}
                    onClose={() => setShowDuplicateAudit(false)}
                />

                {/* ── MODAL ENVOYER VERS TV ── */}
                {sendToTVTrack && (
                    <div
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                        onClick={e => { if (e.target === e.currentTarget) setSendToTVTrack(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-[#0b0c14] border border-amber-500/40 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5 relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-t-3xl" />
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                    <ArrowUpFromLine className="w-4 h-4 text-amber-400" />
                                    Envoyer vers la TV
                                </h3>
                                <button type="button" onClick={() => setSendToTVTrack(null)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Track info */}
                            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
                                <img
                                    src={`https://img.youtube.com/vi/${sendToTVTrack.youtubeId}/default.jpg`}
                                    alt=""
                                    className="w-16 h-11 rounded-xl object-cover bg-black border border-white/10 shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-display font-black text-white italic uppercase truncate">{sendToTVTrack.artist}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{sendToTVTrack.title}</p>
                                </div>
                            </div>

                            {/* Choose TV block */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Dans quel bloc TV ?</label>
                                <select
                                    value={sendToTVBlockId}
                                    onChange={e => setSendToTVBlockId(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                    <option value="">-- Choisir un bloc TV --</option>
                                    {tvBlocks.map(tb => (
                                        <option key={tb.id} value={tb.id}>{tb.emoji} {tb.title} ({tb.videos.length} vidéos)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSendToTVTrack(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-display font-black uppercase italic hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    disabled={!sendToTVBlockId}
                                    onClick={() => handleSendTrackToTV(sendToTVTrack!, sendToTVBlockId)}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-display font-black uppercase italic transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                                >
                                    <ArrowUpFromLine className="w-3.5 h-3.5" />
                                    Envoyer vers TV
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* ── MODAL TOP HORAIRE ─────────────────────────────────────── */}
                {isTopHoraireModalOpen && (
                    <div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={e => { if (e.target === e.currentTarget) setIsTopHoraireModalOpen(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 20 }}
                            className="bg-[#0b0c16] border border-neon-cyan/30 rounded-3xl p-6 w-full max-w-lg shadow-[0_0_60px_rgba(0,240,255,0.2)] space-y-5 relative overflow-hidden"
                        >
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-blue-400 to-neon-cyan rounded-t-3xl" />

                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-neon-cyan" />
                                    </div>
                                    TOP Horaire
                                    <span className="text-[9px] font-mono normal-case not-italic text-gray-400">· Jingle à chaque début d'heure</span>
                                </h3>
                                <button type="button" onClick={() => setIsTopHoraireModalOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Toggle ON/OFF */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                                <div>
                                    <p className="text-sm font-display font-black text-white uppercase italic">Activer le TOP Horaire</p>
                                    <p className="text-[10px] text-gray-400 font-sans mt-0.5">Le jingle s'active automatiquement à chaque :00 min.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTopHoraireConfig(c => ({ ...c, enabled: !c.enabled }))}
                                    className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                                        topHoraireConfig.enabled ? 'bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'bg-white/15'
                                    }`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                                        topHoraireConfig.enabled ? 'left-6' : 'left-0.5'
                                    }`} />
                                </button>
                            </div>

                            {topHoraireConfig.enabled && (
                                <div className="space-y-4">
                                    {/* Titre */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-mono uppercase tracking-widest text-gray-400">Nom du jingle TOP Horaire</label>
                                        <input
                                            type="text"
                                            value={topHoraireConfig.title}
                                            onChange={e => setTopHoraireConfig(c => ({ ...c, title: e.target.value }))}
                                            placeholder="Ex : TOP Horaire Dropsiders..."
                                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan transition-colors"
                                        />
                                    </div>

                                    {/* Durée */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-mono uppercase tracking-widest text-gray-400">Durée du jingle (secondes)</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={3}
                                                max={120}
                                                value={topHoraireConfig.duration}
                                                onChange={e => setTopHoraireConfig(c => ({ ...c, duration: Number(e.target.value) }))}
                                                className="flex-1 accent-neon-cyan"
                                            />
                                            <span className="text-neon-cyan font-mono font-bold text-sm w-12 text-right">{topHoraireConfig.duration}s</span>
                                        </div>
                                    </div>

                                    {/* Upload WAV/MP3 */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-mono uppercase tracking-widest text-gray-400">Fichier Audio (WAV / MP3)</label>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                                            <FileAudio className="w-4 h-4 text-neon-cyan shrink-0" />
                                            <p className="text-[10px] text-gray-300 flex-1 truncate">
                                                {topHoraireConfig.audioUrl
                                                    ? (topHoraireConfig.title || 'Fichier audio configuré ✓')
                                                    : 'Aucun fichier chargé'}
                                            </p>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {topHoraireConfig.audioUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAudioPreview('top_horaire_preview', topHoraireConfig.audioUrl!)}
                                                        className={`p-1.5 rounded-xl text-[9px] flex items-center gap-1 transition-all cursor-pointer ${
                                                            playingAudioId === 'top_horaire_preview'
                                                                ? 'bg-neon-cyan text-black'
                                                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                        }`}
                                                    >
                                                        {playingAudioId === 'top_horaire_preview' ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                                <label className="px-3 py-1.5 rounded-xl bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/40 text-neon-cyan text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5">
                                                    <Upload className="w-3 h-3" />
                                                    Uploader
                                                    <input
                                                        type="file"
                                                        accept="audio/*,.mp3,.wav,.ogg,.m4a"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            showToast(`Upload de ${file.name}...`, 'info');
                                                            try {
                                                                // Auto-read duration
                                                                const objUrl = URL.createObjectURL(file);
                                                                const audio = new Audio(objUrl);
                                                                audio.addEventListener('loadedmetadata', () => {
                                                                    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                                                                        setTopHoraireConfig(c => ({ ...c, duration: Math.round(audio.duration) }));
                                                                    }
                                                                    URL.revokeObjectURL(objUrl);
                                                                });
                                                                let uploadedUrl: string;
                                                                try {
                                                                    uploadedUrl = await uploadFile(file, 'radio/top-horaire');
                                                                } catch {
                                                                    uploadedUrl = await new Promise<string>((res, rej) => {
                                                                        const r = new FileReader();
                                                                        r.onload = () => res(r.result as string);
                                                                        r.onerror = rej;
                                                                        r.readAsDataURL(file);
                                                                    });
                                                                }
                                                                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
                                                                setTopHoraireConfig(c => ({
                                                                    ...c,
                                                                    title: c.title || cleanName,
                                                                    audioUrl: uploadedUrl
                                                                }));
                                                                showToast('✓ Jingle TOP Horaire uploadé !');
                                                            } catch (err) {
                                                                console.error(err);
                                                                showToast('Erreur chargement audio', 'warn');
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info box */}
                                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/25 flex items-start gap-2.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-[9.5px] text-amber-200/80 font-sans leading-relaxed">
                                            Le jingle TOP Horaire est joué <strong>automatiquement</strong> à chaque début d'heure (HH:00:00). Il s'intercale avant les pistes de l'émission active.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Boutons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsTopHoraireModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-display font-black uppercase italic hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveTopHoraire(topHoraireConfig)}
                                    className="flex-1 py-2.5 rounded-xl bg-neon-cyan hover:bg-white text-black text-[10px] font-display font-black uppercase italic transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Sauvegarder
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* ── RADIONOMY JINGLES & PUBS MANAGER ─────────────────────── */}
                <RadionomyJinglesBox
                    isOpen={isRadionomyOpen}
                    onClose={() => setIsRadionomyOpen(false)}
                    currentBlockTitle={selectedBlock?.title}
                    onInsertItem={handleInsertRadionomyItem}
                    onApplyRadionomyRule={handleApplyRadionomyRule}
                    onSetAsTopHoraire={handleSetAsTopHoraire}
                    onSetAsThemeJingle={handleSetAsThemeJingle}
                    onOpenYouTubeSearch={() => {
                        setIsRadionomyOpen(false);
                        setIsYouTubeSearchOpen(true);
                    }}
                />

                {/* ── RECHERCHE YOUTUBE DIRECTE ─────────────────────────────── */}
                <YouTubeSearchModal
                    isOpen={isYouTubeSearchOpen}
                    onClose={() => setIsYouTubeSearchOpen(false)}
                    mode="radio"
                    blockTitle={selectedBlock?.title}
                    onAddVideo={handleYouTubeAddVideo}
                />
            </div>
        </AnimatePresence>
    );
}
