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
    Shuffle, 
    RotateCcw, 
    CheckCircle2, 
    Music2, 
    Search, 
    Check, 
    Clock,
    Tv,
    Import,
    Library,
    ListPlus
} from 'lucide-react';
import { extractYouTubeId } from './AdminTVModal';
import { DEFAULT_TV_BLOCKS, formatDurationExact, parseArtistAndEvent } from '../../../utils/tvSchedule';

export const STORAGE_RADIO_TRACKS_KEY = 'dropsiders_radio_tracks';

export interface RadioTrack {
    id: string;
    title: string;
    artist: string;
    youtubeId: string;
    duration: number; // en secondes
    category: 'liveset' | 'clip';
    addedAt?: number;
}

// Extraction de pistes par défaut à partir des blocs TV pour préremplir si vide
export function getDefaultRadioTracks(): RadioTrack[] {
    const tracks: RadioTrack[] = [];
    DEFAULT_TV_BLOCKS.forEach((block) => {
        (block.videos || []).forEach((vid) => {
            if (!tracks.some(t => t.youtubeId === vid.youtubeId)) {
                const { artist } = parseArtistAndEvent(vid.title);
                const isClip = block.id === 'bloc_1' || vid.category === 'clip' || /clip|official video/i.test(vid.title);
                tracks.push({
                    id: `radio_${vid.youtubeId}_${Math.random().toString(36).substring(2, 7)}`,
                    title: vid.title,
                    artist: artist || 'Artiste',
                    youtubeId: vid.youtubeId,
                    duration: vid.duration || (isClip ? 240 : 3600),
                    category: isClip ? 'clip' : 'liveset',
                    addedAt: Date.now()
                });
            }
        });
    });
    return tracks;
}

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
    const [tracks, setTracks] = useState<RadioTrack[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_RADIO_TRACKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return getDefaultRadioTracks();
    });

    // Formulaire d'ajout
    const [newUrl, setNewUrl] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newArtist, setNewArtist] = useState('');
    const [newCategory, setNewCategory] = useState<'liveset' | 'clip'>('liveset');
    const [newDurationMin, setNewDurationMin] = useState<string>('60');

    // Filtres & Recherche
    const [activeTab, setActiveTab] = useState<'all' | 'liveset' | 'clip'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Onglet principal (Rotation | Bibliothèque TV)
    const [mainTab, setMainTab] = useState<'rotation' | 'library'>('rotation');
    const [libSearchQuery, setLibSearchQuery] = useState('');
    const [libFilter, setLibFilter] = useState<'all' | 'liveset' | 'clip'>('all');

    // Édition inline
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingArtist, setEditingArtist] = useState('');

    // Feedback message
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Synchronisation avec le localStorage au montage
    useEffect(() => {
        if (!isOpen) return;
        try {
            const saved = localStorage.getItem(STORAGE_RADIO_TRACKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setTracks(parsed);
                    return;
                }
            }
            // Pré-initialisation si non existant
            const defaults = getDefaultRadioTracks();
            setTracks(defaults);
            localStorage.setItem(STORAGE_RADIO_TRACKS_KEY, JSON.stringify(defaults));
        } catch {}
    }, [isOpen]);

    // Sauvegarde et notification des changements
    const saveTracks = (newTracks: RadioTrack[], message?: string) => {
        setTracks(newTracks);
        try {
            localStorage.setItem(STORAGE_RADIO_TRACKS_KEY, JSON.stringify(newTracks));
            window.dispatchEvent(new CustomEvent('dropsiders_radio_tracks_updated'));
        } catch {}

        if (message) {
            setSaveMessage(message);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    // Auto-détection de titre / artiste quand on colle une URL
    const handleUrlChange = (val: string) => {
        setNewUrl(val);
        const ytid = extractYouTubeId(val);
        if (ytid && !newTitle) {
            // Tente de trouver si la vidéo existe déjà dans les blocs par défaut pour préremplir
            for (const b of DEFAULT_TV_BLOCKS) {
                const found = (b.videos || []).find(v => v.youtubeId === ytid);
                if (found) {
                    setNewTitle(found.title);
                    const { artist } = parseArtistAndEvent(found.title);
                    setNewArtist(artist);
                    if (found.category === 'clip' || /clip/i.test(found.title)) {
                        setNewCategory('clip');
                        setNewDurationMin('4');
                    } else {
                        setNewCategory('liveset');
                        setNewDurationMin('60');
                    }
                    break;
                }
            }
        }
    };

    // Ajustement de durée par défaut au changement de catégorie
    const handleCategoryChange = (cat: 'liveset' | 'clip') => {
        setNewCategory(cat);
        if (cat === 'clip' && newDurationMin === '60') {
            setNewDurationMin('4');
        } else if (cat === 'liveset' && newDurationMin === '4') {
            setNewDurationMin('60');
        }
    };

    // Ajout d'une vidéo
    const handleAddTrack = (e: React.FormEvent) => {
        e.preventDefault();
        const ytid = extractYouTubeId(newUrl);
        if (!ytid) {
            alert('Veuillez renseigner une URL ou un ID YouTube valide.');
            return;
        }

        const title = newTitle.trim() || `Set ${newCategory === 'clip' ? 'Clip' : 'Live'} - YouTube ${ytid}`;
        const artist = newArtist.trim() || parseArtistAndEvent(title).artist || 'Artiste';
        const durationSec = Math.max(30, (parseInt(newDurationMin, 10) || (newCategory === 'clip' ? 4 : 60)) * 60);

        const newTrack: RadioTrack = {
            id: `radio_${ytid}_${Date.now()}`,
            title,
            artist,
            youtubeId: ytid,
            duration: durationSec,
            category: newCategory,
            addedAt: Date.now()
        };

        const updated = [newTrack, ...tracks];
        saveTracks(updated, `Ajouté avec succès : ${title}`);

        // Reset formulaire
        setNewUrl('');
        setNewTitle('');
        setNewArtist('');
    };

    // Suppression
    const handleDeleteTrack = (id: string) => {
        const updated = tracks.filter(t => t.id !== id);
        saveTracks(updated, 'Élément retiré de la radio.');
    };

    // Déplacement
    const handleMove = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= tracks.length) return;
        const copy = [...tracks];
        const temp = copy[index];
        copy[index] = copy[targetIndex];
        copy[targetIndex] = temp;
        saveTracks(copy);
    };

    // Mélanger / Shuffle
    const handleShuffle = () => {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        saveTracks(shuffled, 'Rotation mélangée avec succès !');
    };

    // Réinitialiser depuis TV
    const handleResetFromTV = () => {
        if (window.confirm('Voulez-vous synchroniser et restaurer tous les sets et clips depuis Dropsiders TV ?')) {
            const defaults = getDefaultRadioTracks();
            saveTracks(defaults, 'Rotation synchronisée depuis Dropsiders TV !');
        }
    };

    // Démarrage édition
    const startEditing = (track: RadioTrack) => {
        setEditingId(track.id);
        setEditingTitle(track.title);
        setEditingArtist(track.artist);
    };

    // Sauvegarde édition inline
    const saveEditing = (id: string) => {
        const updated = tracks.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    title: editingTitle.trim() || t.title,
                    artist: editingArtist.trim() || t.artist
                };
            }
            return t;
        });
        saveTracks(updated, 'Titre et artiste mis à jour.');
        setEditingId(null);
    };

    // Basculer la catégorie d'un élément existant
    const toggleTrackCategory = (id: string) => {
        const updated = tracks.map(t => {
            if (t.id === id) {
                const nextCat: 'liveset' | 'clip' = t.category === 'liveset' ? 'clip' : 'liveset';
                return {
                    ...t,
                    category: nextCat,
                    duration: nextCat === 'clip' ? 240 : 3600
                };
            }
            return t;
        });
        saveTracks(updated, 'Catégorie modifiée.');
    };

    // Statistiques
    const stats = useMemo(() => {
        const livesets = tracks.filter(t => t.category === 'liveset');
        const clips = tracks.filter(t => t.category === 'clip');
        const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
        return {
            total: tracks.length,
            livesetsCount: livesets.length,
            clipsCount: clips.length,
            totalDurationStr: formatDurationExact(totalDuration)
        };
    }, [tracks]);

    // Filtrage
    const filteredTracks = useMemo(() => {
        return tracks.filter(t => {
            if (activeTab !== 'all' && t.category !== activeTab) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.youtubeId.toLowerCase().includes(q);
            }
            return true;
        });
    }, [tracks, activeTab, searchQuery]);

    // Bibliothèque TV — toutes les vidéos disponibles dans DEFAULT_TV_BLOCKS
    const tvLibrary = useMemo(() => {
        const items: Array<{ block: string; blockColor: string; blockEmoji: string; track: RadioTrack }> = [];
        DEFAULT_TV_BLOCKS.forEach(block => {
            (block.videos || []).forEach(vid => {
                if (!vid.youtubeId) return;
                const { artist } = parseArtistAndEvent(vid.title);
                const isClip = block.id === 'bloc_1' || vid.category === 'clip' || /clip|official video/i.test(vid.title);
                const track: RadioTrack = {
                    id: `lib_${vid.youtubeId}`,
                    title: vid.title,
                    artist: artist || 'Artiste',
                    youtubeId: vid.youtubeId,
                    duration: vid.duration || (isClip ? 240 : 3600),
                    category: isClip ? 'clip' : 'liveset',
                    addedAt: Date.now()
                };
                items.push({
                    block: block.title,
                    blockColor: block.color || '#00ffff',
                    blockEmoji: block.emoji || '🎪',
                    track
                });
            });
        });
        return items;
    }, []);

    const filteredLibrary = useMemo(() => {
        return tvLibrary.filter(item => {
            if (libFilter !== 'all' && item.track.category !== libFilter) return false;
            if (libSearchQuery.trim()) {
                const q = libSearchQuery.toLowerCase();
                return item.track.title.toLowerCase().includes(q)
                    || item.track.artist.toLowerCase().includes(q)
                    || item.block.toLowerCase().includes(q);
            }
            return true;
        });
    }, [tvLibrary, libFilter, libSearchQuery]);

    const isInRotation = (youtubeId: string) => tracks.some(t => t.youtubeId === youtubeId);

    const handleImportFromLibrary = (item: typeof tvLibrary[0]) => {
        if (isInRotation(item.track.youtubeId)) {
            // Retirer de la rotation si déjà présent
            const updated = tracks.filter(t => t.youtubeId !== item.track.youtubeId);
            saveTracks(updated, `Retiré de la rotation : ${item.track.title}`);
        } else {
            const newTrack: RadioTrack = {
                ...item.track,
                id: `radio_${item.track.youtubeId}_${Date.now()}`,
                addedAt: Date.now()
            };
            saveTracks([newTrack, ...tracks], `Ajouté à la rotation : ${item.track.title}`);
        }
    };

    const handleImportBlock = (blockTitle: string) => {
        const blockItems = filteredLibrary.filter(i => i.block === blockTitle && !isInRotation(i.track.youtubeId));
        if (blockItems.length === 0) return;
        const newTracks = blockItems.map(item => ({
            ...item.track,
            id: `radio_${item.track.youtubeId}_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
            addedAt: Date.now()
        }));
        saveTracks([...newTracks, ...tracks], `${newTracks.length} vidéos importées depuis "${blockTitle}"`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-xl pointer-events-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-[#0a0a0a] border border-neon-cyan/20 rounded-[2.5rem] w-full max-w-5xl shadow-[0_0_60px_rgba(0,255,255,0.12)] relative overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Top neon accent line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-cyan" />

                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-neon-cyan/15 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                                <Radio className="w-7 h-7 animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tight">
                                        DROPSIDERS <span className="text-neon-cyan">RADIO</span>
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 border border-white/15 text-white/70">
                                        Gestion Sets & Clips
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-medium mt-1">
                                    Gérez la rotation des Livesets et des Clips musicaux diffusés en continu 24/7 sur la radio.
                                </p>
                            </div>
                        </div>

                        {/* Status Toggle & Close */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl">
                                <span className={`w-2.5 h-2.5 rounded-full ${isRadioActive ? 'bg-neon-cyan animate-pulse shadow-[0_0_8px_#00ffff]' : 'bg-gray-600'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isRadioActive ? 'text-neon-cyan' : 'text-gray-400'}`}>
                                    {isRadioActive ? 'EN LIGNE' : 'PRIVÉE'}
                                </span>
                                <button
                                    type="button"
                                    onClick={onToggleRadio}
                                    className={`ml-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        isRadioActive
                                            ? 'bg-neon-cyan text-black hover:bg-white'
                                            : 'bg-white/10 text-white hover:bg-neon-cyan hover:text-black'
                                    }`}
                                >
                                    {isRadioActive ? 'Désactiver' : 'Activer'}
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-lg cursor-pointer"
                                title="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Stats & Toast message */}
                    <div className="px-6 md:px-8 py-3 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                        <div className="flex items-center gap-4 text-[11px] font-bold">
                            <span className="text-white/60">
                                Total : <strong className="text-white">{stats.total}</strong> titres
                            </span>
                            <span className="text-neon-cyan flex items-center gap-1">
                                <span>🎪</span>
                                <span>{stats.livesetsCount} Livesets</span>
                            </span>
                            <span className="text-neon-purple flex items-center gap-1">
                                <span>🎬</span>
                                <span>{stats.clipsCount} Clips</span>
                            </span>
                            <span className="text-white/40 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Rotation ~ {stats.totalDurationStr}</span>
                            </span>
                        </div>

                        {saveMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{saveMessage}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">

                        {/* Onglets principaux */}
                        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                            <button
                                type="button"
                                onClick={() => setMainTab('rotation')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    mainTab === 'rotation'
                                        ? 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <Radio className="w-3.5 h-3.5" />
                                <span>Ma Rotation ({tracks.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMainTab('library')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    mainTab === 'library'
                                        ? 'bg-neon-red text-white shadow-[0_0_20px_rgba(255,18,65,0.3)]'
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <Tv className="w-3.5 h-3.5" />
                                <span>Bibliothèque TV ({tvLibrary.length})</span>
                            </button>
                        </div>

                        {mainTab === 'rotation' ? (
                            <div className="space-y-6">
                        {/* Formulaire d'ajout rapide */}
                        <form onSubmit={handleAddTrack} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                                    <Plus className="w-4 h-4" />
                                    Ajouter un Set ou un Clip à la Radio
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCategoryChange('liveset')}
                                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                                            newCategory === 'liveset'
                                                ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                                : 'bg-white/5 text-white/60 hover:text-white'
                                        }`}
                                    >
                                        <span>🎪</span>
                                        <span>Liveset (DJ Set)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCategoryChange('clip')}
                                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                                            newCategory === 'clip'
                                                ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                                : 'bg-white/5 text-white/60 hover:text-white'
                                        }`}
                                    >
                                        <span>🎬</span>
                                        <span>Clip Officiel</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-5">
                                    <input
                                        type="text"
                                        placeholder="Lien YouTube ou ID (ex: https://youtube.com/watch?v=...)"
                                        value={newUrl}
                                        onChange={(e) => handleUrlChange(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black/60 border border-white/15 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan transition-colors"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <input
                                        type="text"
                                        placeholder="Titre du set ou du clip"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black/60 border border-white/15 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan transition-colors"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Artiste / DJ"
                                        value={newArtist}
                                        onChange={(e) => setNewArtist(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black/60 border border-white/15 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan transition-colors"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <button
                                        type="submit"
                                        className="w-full h-full py-2.5 bg-neon-cyan hover:bg-white text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
                                        title="Ajouter à la rotation"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Barre d'outils, Filtres & Recherche */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Tabs */}
                            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('all')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                                        activeTab === 'all'
                                            ? 'bg-white text-black shadow'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    Tous ({tracks.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('liveset')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                        activeTab === 'liveset'
                                            ? 'bg-neon-cyan text-black shadow'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    <span>🎪</span>
                                    <span>Livesets ({stats.livesetsCount})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('clip')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                        activeTab === 'clip'
                                            ? 'bg-neon-purple text-white shadow'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    <span>🎬</span>
                                    <span>Clips ({stats.clipsCount})</span>
                                </button>
                            </div>

                            {/* Actions & Recherche */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un set ou clip..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleShuffle}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-neon-cyan transition-all cursor-pointer shrink-0"
                                    title="Mélanger l'ordre de passage"
                                >
                                    <Shuffle className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResetFromTV}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-neon-purple transition-all cursor-pointer shrink-0"
                                    title="Réinitialiser / Synchroniser depuis Dropsiders TV"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Liste des Pistes */}
                        <div className="space-y-2">
                            {filteredTracks.length === 0 ? (
                                <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <Music2 className="w-8 h-8 mx-auto text-white/20 mb-2" />
                                    <p className="text-sm font-bold text-white/40">Aucun titre correspondant trouvé.</p>
                                    <p className="text-xs text-white/20 mt-1">Ajoutez un nouveau lien YouTube ci-dessus ou réinitialisez la recherche.</p>
                                </div>
                            ) : (
                                filteredTracks.map((track) => {
                                    const isEditing = editingId === track.id;
                                    const originalIndex = tracks.findIndex(t => t.id === track.id);

                                    return (
                                        <div
                                            key={track.id}
                                            className="p-2.5 px-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 transition-colors group"
                                        >
                                            {/* Index & Miniature */}
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className="text-xs font-black text-white/30 w-5 text-center shrink-0">
                                                    {originalIndex + 1}
                                                </span>

                                                <div className="relative w-16 h-10 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`}
                                                        alt={track.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e: any) => {
                                                            e.currentTarget.src = `https://img.youtube.com/vi/${track.youtubeId}/hqdefault.jpg`;
                                                        }}
                                                    />
                                                    {track.duration > 0 && (
                                                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8px] font-black text-white">
                                                            {formatDurationExact(track.duration)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Titre & Artiste */}
                                                <div className="min-w-0 flex-1">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={editingTitle}
                                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                                className="flex-1 px-2.5 py-1 rounded-xl bg-white/10 border border-white/30 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                                placeholder="Titre"
                                                                autoFocus
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editingArtist}
                                                                onChange={(e) => setEditingArtist(e.target.value)}
                                                                className="w-36 px-2.5 py-1 rounded-xl bg-white/10 border border-white/30 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                                                placeholder="Artiste"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => saveEditing(track.id)}
                                                                className="p-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingId(null)}
                                                                className="p-1 rounded-lg bg-white/10 text-white/40 hover:text-white"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-bold text-white truncate group-hover:text-white transition-colors" title={track.title}>
                                                                    {track.title}
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleTrackCategory(track.id)}
                                                                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 transition-all cursor-pointer ${
                                                                        track.category === 'clip'
                                                                            ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/40 hover:bg-neon-purple hover:text-white'
                                                                            : 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40 hover:bg-neon-cyan hover:text-black'
                                                                    }`}
                                                                    title="Cliquer pour basculer Liveset / Clip"
                                                                >
                                                                    {track.category === 'clip' ? '🎬 Clip' : '🎪 Liveset'}
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-[10px] text-white/40 mt-0.5">
                                                                <span className="text-white/60 font-medium">Par : {track.artist}</span>
                                                                <span className="font-mono text-[9px]">ID: {track.youtubeId}</span>
                                                                <a
                                                                    href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="hover:text-white flex items-center gap-0.5 transition-colors"
                                                                    title="Écouter sur YouTube"
                                                                >
                                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                                    Écouter
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(track)}
                                                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-neon-cyan transition-all"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMove(originalIndex, -1)}
                                                    disabled={originalIndex === 0}
                                                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
                                                    title="Monter"
                                                >
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMove(originalIndex, 1)}
                                                    disabled={originalIndex === tracks.length - 1}
                                                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-20 transition-all"
                                                    title="Descendre"
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTrack(track.id)}
                                                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all ml-1"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                            </div>
                        ) : (
                            // ── Bibliothèque TV ──────────────────────────────────────────
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher dans la bibliothèque TV..."
                                            value={libSearchQuery}
                                            onChange={e => setLibSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                                        {(['all', 'liveset', 'clip'] as const).map(f => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setLibFilter(f)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                                                    libFilter === f ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                                                }`}
                                            >
                                                {f === 'all' ? 'Tous' : f === 'liveset' ? '🎪 Sets' : '🎬 Clips'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-[10px] text-white/40 font-medium">
                                    Cliquez sur une vidéo pour l'ajouter ou la retirer de votre rotation radio. Les vidéos déjà dans la rotation sont surlignées en cyan.
                                </p>

                                {/* Groupé par bloc TV */}
                                {(() => {
                                    const blocks = [...new Set(filteredLibrary.map(i => i.block))];
                                    if (blocks.length === 0) return (
                                        <div className="p-8 text-center text-white/30 text-xs">Aucune vidéo trouvée.</div>
                                    );
                                    return blocks.map(blockTitle => {
                                        const blockItems = filteredLibrary.filter(i => i.block === blockTitle);
                                        const blockColor = blockItems[0]?.blockColor || '#00ffff';
                                        const blockEmoji = blockItems[0]?.blockEmoji || '🎪';
                                        const notImported = blockItems.filter(i => !isInRotation(i.track.youtubeId));
                                        return (
                                            <div key={blockTitle} className="space-y-2">
                                                <div className="flex items-center justify-between py-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{blockEmoji}</span>
                                                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: blockColor }}>{blockTitle}</span>
                                                        <span className="text-[10px] text-white/30 font-mono">{blockItems.length} vidéos</span>
                                                    </div>
                                                    {notImported.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImportBlock(blockTitle)}
                                                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-neon-cyan/20 border border-white/10 hover:border-neon-cyan/40 text-white/60 hover:text-neon-cyan text-[10px] font-black uppercase transition-all cursor-pointer"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Tout importer ({notImported.length})
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-1.5">
                                                    {blockItems.map(item => {
                                                        const inRotation = isInRotation(item.track.youtubeId);
                                                        return (
                                                            <button
                                                                key={item.track.youtubeId}
                                                                type="button"
                                                                onClick={() => handleImportFromLibrary(item)}
                                                                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer text-left group ${
                                                                    inRotation
                                                                        ? 'bg-neon-cyan/10 border-neon-cyan/40 hover:bg-red-500/10 hover:border-red-500/40'
                                                                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                                                                }`}
                                                            >
                                                                <div className="relative w-14 h-9 rounded-lg overflow-hidden bg-black/60 shrink-0">
                                                                    <img
                                                                        src={`https://img.youtube.com/vi/${item.track.youtubeId}/mqdefault.jpg`}
                                                                        alt={item.track.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-white truncate">{item.track.title}</p>
                                                                    <p className="text-[10px] text-white/40">{item.track.artist} · {formatDurationExact(item.track.duration)}</p>
                                                                </div>
                                                                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                                                                    inRotation
                                                                        ? 'bg-neon-cyan text-black group-hover:bg-red-500 group-hover:text-white'
                                                                        : 'bg-white/10 text-white/40 group-hover:bg-neon-cyan group-hover:text-black'
                                                                }`}>
                                                                    {inRotation ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 px-6 md:px-8 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs shrink-0">
                        <span className="text-white/40 text-[11px]">
                            Les modifications sont enregistrées et synchronisées en temps réel sur Dropsiders Radio.
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                            Fermer
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
