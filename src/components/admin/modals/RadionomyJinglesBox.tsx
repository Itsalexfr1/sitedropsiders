import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Clock, Sparkles, Play, Pause, CheckCircle2, 
    Sliders, Radio, X, Upload, Music, FileAudio, Loader2, 
    Volume2, Link as LinkIcon, Radio as RadioIcon, Tag, Check
} from 'lucide-react';
import { extractYouTubeId, fetchYouTubeTitle } from './AdminTVModal';
import { uploadFile } from '../../../utils/uploadService';

export interface RadionomyItem {
    id: string;
    title: string;
    youtubeId?: string;
    audioUrl?: string; // support for uploaded WAV / MP3
    duration: number; // in seconds
    category: 'jingle' | 'pub' | 'promo' | 'chronique' | 'top_horaire' | 'generique' | 'interview';
    isCustom?: boolean;
    fileName?: string;
    expiresAt?: string; // Date limite de validité (YYYY-MM-DD)
}

export const DEFAULT_JINGLES_PUBS: RadionomyItem[] = [
    // --- TOP HORAIRE & GÉNÉRIQUE ---
    {
        id: 'rad_top_1',
        title: 'Dropsiders Radio • Top Horaire Officiel (00 min)',
        youtubeId: 'CsRTKXYEhOM',
        duration: 10,
        category: 'top_horaire'
    },
    {
        id: 'rad_gen_1',
        title: 'Générique Officiel • Dropsiders Festival On Air',
        youtubeId: 'k5yQBhDnrvM',
        duration: 18,
        category: 'generique'
    },

    // --- JINGLES OFFICIELS EN WAV ---
    {
        id: 'rad_jing_1',
        title: 'Dropsiders Radio Jingle 1',
        duration: 8,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/a0248d1e2762599b-Dropsiders_Radio_Jingle_1.wav'
    },
    {
        id: 'rad_jing_2',
        title: 'Dropsiders Radio Jingle 2',
        duration: 10,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/0e6e02a4ecb4c116-Dropsiders_Radio_Jingle_2.wav'
    },
    {
        id: 'rad_jing_3',
        title: 'Dropsiders Radio Jingle 3',
        duration: 12,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/5d1dc6fddb12e95a-Dropsiders_Radio_Jingle_3.wav'
    },
    {
        id: 'rad_jing_4',
        title: 'Dropsiders Radio Jingle 4',
        duration: 8,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/23486b8258010f84-Dropsiders_Radio_Jingle_4.wav'
    },
    {
        id: 'rad_jing_5',
        title: 'Dropsiders Radio Jingle 5',
        duration: 14,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/36e8b253e5fe15eb-Dropsiders_Radio_Jingle_5.wav'
    },
    {
        id: 'rad_jing_6',
        title: 'Dropsiders Radio Jingle 6',
        duration: 9,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/65e81d013a4e8ad2-Dropsiders_Radio_Jingle_6.wav'
    },
    {
        id: 'jingle_insta_tiktok_1',
        title: 'Dropsiders Radio Promo Insta & Tiktok',
        duration: 15,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/f82c7ae2fe21bbb9-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_2',
        title: 'Dropsiders Radio Promo Insta & Tiktok 2',
        duration: 30,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/e605951242685f4a-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_3',
        title: 'Dropsiders Radio Promo Insta & Tiktok 3',
        duration: 28,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/e8dc24ae6b842cc2-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON',
        duration: 22,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/eaf2622d5fcc9ade-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb2',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON 2',
        duration: 33,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/a3745c4e00b8e56d-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb3',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON 3',
        duration: 46,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/0a0f7de3fd0adef4-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb4',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON 4',
        duration: 44,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/893faf55d9ffd42d-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb5',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON 5',
        duration: 28,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/741653185baf2ae2-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb6',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON 6',
        duration: 26,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/032f69553727ee99-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb7',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON 7',
        duration: 32,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/48b2897e5ea50d51-Dropsiders_Radio_Promo_Insta__.wav'
    },
    {
        id: 'jingle_insta_tiktok_tb8',
        title: 'Dropsiders Radio Promo Insta & Tiktok TRES TRES BON 8',
        duration: 32,
        category: 'jingle',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/d0db2807d7beaede-Dropsiders_Radio_Promo_Insta__.wav'
    },

    // --- PROMOS, TEASERS & SPONSORS FESTIVALS ---
    {
        id: 'promo_tomorrowland_winter',
        title: 'Promo Tomorrowland Winter',
        duration: 66,
        category: 'promo',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/051220f3cbbe1c9d-Promo_Tomorrowland_Winter.wav'
    },
    {
        id: 'promo_escape_psycho_circus_1',
        title: 'Promo Escape Psycho Circus 2026 1',
        duration: 47,
        category: 'promo',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/773741c87cd62bf2-Promo_Escape_Psycho_Circus_202.wav'
    },
    {
        id: 'promo_escape_psycho_circus_2',
        title: 'Promo Escape Psycho Circus 2026 2',
        duration: 40,
        category: 'promo',
        audioUrl: 'https://dropsiders.fr/uploads/radio/jingles/1e441be4d3fb7225-Promo_Escape_Psycho_Circus_202.wav'
    },

    // --- PUBLICITÉS & SPONSORS PARTENAIRES ---
    {
        id: 'rad_pub_1',
        title: 'Publicité Dropsiders Voyages • Packs Festivals & Bus',
        youtubeId: 'pQdsHoG2yhw',
        duration: 30,
        category: 'pub'
    },
    {
        id: 'rad_pub_2',
        title: 'Spot Partenaire • Dropsiders Shop Officiel & Goodies',
        youtubeId: '61tiIdIrjUQ',
        duration: 25,
        category: 'pub'
    },
    {
        id: 'rad_promo_1',
        title: 'Promo Dropsiders TV & Live Stream 24/7',
        youtubeId: 'DuXXMZLfAkQ',
        duration: 20,
        category: 'promo'
    },

    // --- INTERVIEWS ---
    {
        id: 'rad_inter_1',
        title: 'Interview Exclusive • Martin Garrix en direct de l\'Amsterdam Dance Event',
        youtubeId: 'k5yQBhDnrvM',
        duration: 180,
        category: 'interview'
    },
    {
        id: 'rad_inter_2',
        title: 'Interview Flash • David Guetta & Morten racontent Future Rave',
        youtubeId: 'CsRTKXYEhOM',
        duration: 120,
        category: 'interview'
    }
];

const STORAGE_RADIONOMY_KEY = 'dropsiders_radionomy_palette';

interface RadionomyJinglesBoxProps {
    isOpen: boolean;
    onClose: () => void;
    currentBlockTitle?: string;
    onInsertItem: (item: RadionomyItem) => void;
    onApplyRadionomyRule?: (rule: { jingleEveryN: number; pubEveryN: number }) => void;
    onOpenYouTubeSearch?: (category: 'jingle' | 'pub') => void;
    onSetAsTopHoraire?: (item: RadionomyItem) => void;
    onSetAsThemeJingle?: (item: RadionomyItem) => void;
    defaultTab?: 'all' | 'jingle' | 'top_horaire' | 'generique' | 'interview' | 'pub' | 'promo';
}

export function RadionomyJinglesBox({
    isOpen,
    onClose,
    currentBlockTitle,
    onInsertItem,
    onApplyRadionomyRule,
    onOpenYouTubeSearch,
    onSetAsTopHoraire,
    onSetAsThemeJingle,
    defaultTab = 'all'
}: RadionomyJinglesBoxProps) {
    const [items, setItems] = useState<RadionomyItem[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_RADIONOMY_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return DEFAULT_JINGLES_PUBS;
    });

    const [activeFilter, setActiveFilter] = useState<'all' | 'jingle' | 'top_horaire' | 'generique' | 'interview' | 'pub' | 'promo'>(defaultTab);
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [addSourceType, setAddSourceType] = useState<'upload' | 'youtube'>('upload');

    // Form state (YouTube single mode)
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newDuration, setNewDuration] = useState('12');
    const [newCategory, setNewCategory] = useState<'jingle' | 'top_horaire' | 'generique' | 'interview' | 'pub' | 'promo'>('jingle');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // Multi-file upload queue
    type FileQueueItem = {
        id: string;
        file: File;
        title: string;
        duration: number;
        status: 'pending' | 'uploading' | 'done' | 'error';
        progress: number;
        audioUrl?: string;
        error?: string;
    };
    const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
    const [isUploadingAll, setIsUploadingAll] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio Preview playback
    const [playingItemId, setPlayingItemId] = useState<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    // Rule Generator State
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [jingleFrequency, setJingleFrequency] = useState(2);
    const [pubFrequency, setPubFrequency] = useState(4);

    useEffect(() => {
        if (defaultTab) setActiveFilter(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_RADIONOMY_KEY, JSON.stringify(items));
        } catch {}
    }, [items]);

    // Arrêter la pré-écoute quand on ferme
    useEffect(() => {
        if (!isOpen && previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
            setPlayingItemId(null);
        }
    }, [isOpen]);

    const handleTogglePreview = (item: RadionomyItem) => {
        if (playingItemId === item.id) {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
            setPlayingItemId(null);
            return;
        }

        // Stopper le player existant
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }

        if (item.audioUrl) {
            const audio = new Audio(item.audioUrl);
            audio.volume = 0.85;
            audio.onended = () => setPlayingItemId(null);
            audio.onerror = () => setPlayingItemId(null);
            audio.play().catch(() => setPlayingItemId(null));
            previewAudioRef.current = audio;
            setPlayingItemId(item.id);
        } else if (item.youtubeId) {
            // Ouvrir YouTube ou notifier
            window.open(`https://www.youtube.com/watch?v=${item.youtubeId}`, '_blank');
        }
    };

    const VALID_AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];

    const getAudioDuration = (file: File): Promise<number> =>
        new Promise((resolve) => {
            const objUrl = URL.createObjectURL(file);
            const audio = new Audio(objUrl);
            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(objUrl);
                resolve(isFinite(audio.duration) && !isNaN(audio.duration) ? Math.max(1, Math.round(audio.duration)) : 12);
            });
            audio.addEventListener('error', () => { URL.revokeObjectURL(objUrl); resolve(12); });
        });

    const addFilesToQueue = async (files: FileList | File[]) => {
        const validFiles = Array.from(files).filter(f => {
            const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
            return VALID_AUDIO_EXTS.includes(ext) || f.type.startsWith('audio/');
        });
        if (validFiles.length === 0) return;

        const newItems = await Promise.all(validFiles.map(async (file) => {
            const duration = await getAudioDuration(file);
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
            return {
                id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                file,
                title: cleanName,
                duration,
                status: 'pending' as const,
                progress: 0,
            };
        }));
        setFileQueue(prev => [...prev, ...newItems]);
    };

    const handleUrlBlur = async () => {
        if (!newUrl.trim() || newTitle.trim()) return;
        setIsFetchingTitle(true);
        try {
            const t = await fetchYouTubeTitle(newUrl);
            if (t) setNewTitle(t);
        } catch {}
        setIsFetchingTitle(false);
    };

    // Upload tous les fichiers de la queue en parallèle
    const handleUploadAll = async (e: React.FormEvent) => {
        e.preventDefault();

        if (addSourceType === 'youtube') {
            // Mode YouTube (single)
            const ytid = extractYouTubeId(newUrl) || newUrl.trim();
            if (!ytid) { alert('Veuillez entrer une URL YouTube valide.'); return; }
            const dur = parseInt(newDuration, 10) || 12;
            const newItem: RadionomyItem = {
                id: `rad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                title: newTitle.trim() || `Jingle ${newCategory.toUpperCase()}`,
                youtubeId: ytid,
                duration: dur,
                category: newCategory,
                isCustom: true,
            };
            setItems(prev => [newItem, ...prev]);
            setNewTitle(''); setNewUrl(''); setNewDuration('12'); setShowAddDrawer(false);
            return;
        }

        if (fileQueue.length === 0) { alert('Ajoutez au moins un fichier audio.'); return; }

        setIsUploadingAll(true);

        // Upload tous en parallèle
        const uploadOne = async (qItem: FileQueueItem): Promise<RadionomyItem | null> => {
            setFileQueue(prev => prev.map(q => q.id === qItem.id ? { ...q, status: 'uploading', progress: 0 } : q));
            let audioUrl: string;
            try {
                audioUrl = await uploadFile(qItem.file, 'radio/jingles', (p) =>
                    setFileQueue(prev => prev.map(q => q.id === qItem.id ? { ...q, progress: p } : q))
                );
            } catch {
                try {
                    audioUrl = await new Promise<string>((res, rej) => {
                        const r = new FileReader();
                        r.onload = () => res(r.result as string);
                        r.onerror = rej;
                        r.readAsDataURL(qItem.file);
                    });
                } catch (err) {
                    setFileQueue(prev => prev.map(q => q.id === qItem.id ? { ...q, status: 'error', error: 'Échec upload' } : q));
                    return null;
                }
            }
            setFileQueue(prev => prev.map(q => q.id === qItem.id ? { ...q, status: 'done', progress: 100, audioUrl } : q));
            return {
                id: `rad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                title: qItem.title || qItem.file.name,
                audioUrl,
                duration: qItem.duration,
                category: newCategory,
                isCustom: true,
                fileName: qItem.file.name,
            };
        };

        const results = await Promise.all(fileQueue.map(uploadOne));
        const newItems = results.filter(Boolean) as RadionomyItem[];
        if (newItems.length > 0) setItems(prev => [...newItems, ...prev]);

        setIsUploadingAll(false);
        setFileQueue([]);
        setShowAddDrawer(false);
    };

    const handleDeleteItem = (id: string) => {
        if (playingItemId === id && previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
            setPlayingItemId(null);
        }
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const filteredItems = items.filter(item => {
        if (activeFilter === 'all') return true;
        return item.category === activeFilter;
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0a0a14]/98 border border-white/10 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[880px] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative font-sans"
                >
                    {/* Top radionomy signature bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-purple-500 to-amber-400" />

                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-purple-600/20 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                                <Radio className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                    Bac Radionomy <span className="text-neon-cyan">Jingles, TOP Horaire & Génériques</span>
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                    Upload direct MP3/WAV · Habillage antenne 24/7 {currentBlockTitle ? `· pour "${currentBlockTitle}"` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {onApplyRadionomyRule && (
                                <button
                                    onClick={() => setShowRuleModal(!showRuleModal)}
                                    className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md"
                                >
                                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="hidden sm:inline">Règle Horloge</span>
                                </button>
                            )}

                            {/* Restaurer les jingles par défaut */}
                            <button
                                type="button"
                                onClick={() => {
                                    const hasCustom = items.some(i => i.isCustom);
                                    const customItems = items.filter(i => i.isCustom);
                                    setItems([...DEFAULT_JINGLES_PUBS, ...customItems]);
                                }}
                                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-gray-400 hover:text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Restaurer les jingles par défaut (conserve vos uploads personnalisés)"
                            >
                                <span className="text-sm">↺</span>
                                <span className="hidden sm:inline">Restaurer défauts</span>
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Radionomy Clock Rule Configurator Banner */}
                    <AnimatePresence>
                        {showRuleModal && onApplyRadionomyRule && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/60 to-black/80 border-b border-purple-500/30 shrink-0 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-200">
                                            Règle d'Horloge Radionomy Automatique
                                        </h4>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        Alterne vos musiques avec vos jingles et spots publicitaires
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-300">🔔 Fréquence des Jingles :</span>
                                            <span className="font-black text-purple-400">Toutes les {jingleFrequency} musiques</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={1}
                                            max={5}
                                            value={jingleFrequency}
                                            onChange={(e) => setJingleFrequency(parseInt(e.target.value, 10))}
                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                                        />
                                    </div>

                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-300">📢 Fréquence des Pubs :</span>
                                            <span className="font-black text-amber-400">Toutes les {pubFrequency} musiques</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={2}
                                            max={8}
                                            value={pubFrequency}
                                            onChange={(e) => setPubFrequency(parseInt(e.target.value, 10))}
                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowRuleModal(false)}
                                        className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
                                    >
                                        Fermer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onApplyRadionomyRule({ jingleEveryN: jingleFrequency, pubEveryN: pubFrequency });
                                            setShowRuleModal(false);
                                        }}
                                        className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Appliquer l'Horloge à l'Émission</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Filter & Action Tabs */}
                    <div className="p-3.5 sm:p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/40 shrink-0">
                        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                            {[
                                { id: 'all', label: 'Tout voir' },
                                { id: 'jingle', label: '🔔 Jingles', count: items.filter(i => i.category === 'jingle').length },
                                { id: 'top_horaire', label: '⏰ TOP Horaire', count: items.filter(i => i.category === 'top_horaire').length },
                                { id: 'generique', label: '🎙️ Génériques', count: items.filter(i => i.category === 'generique').length },
                                { id: 'interview', label: '🎙️ Interviews', count: items.filter(i => i.category === 'interview').length },
                                { id: 'pub', label: '📢 Pubs', count: items.filter(i => i.category === 'pub').length },
                                { id: 'promo', label: '⚡ Promos', count: items.filter(i => i.category === 'promo').length },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveFilter(tab.id as any)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                        activeFilter === tab.id
                                            ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {onOpenYouTubeSearch && (
                                <button
                                    type="button"
                                    onClick={() => onOpenYouTubeSearch('jingle')}
                                    className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <span>🔍 Chercher sur YT</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setAddSourceType('upload');
                                    setShowAddDrawer(!showAddDrawer);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50 text-neon-cyan text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Uploader WAV / MP3</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setAddSourceType('youtube');
                                    setShowAddDrawer(!showAddDrawer);
                                }}
                                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span>Lien YouTube</span>
                            </button>
                        </div>
                    </div>

                    {/* Add Form Drawer (Upload WAV/MP3 ou Lien YouTube) */}
                    <AnimatePresence>
                        {showAddDrawer && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleUploadAll}
                                className="p-4 sm:p-5 bg-[#0f111a] border-b border-neon-cyan/30 shrink-0 space-y-4 shadow-xl"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setAddSourceType('upload')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                                addSourceType === 'upload'
                                                    ? 'bg-neon-cyan text-black shadow-md'
                                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            Upload Fichiers (MP3 / WAV)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAddSourceType('youtube')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase italic tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                                addSourceType === 'youtube'
                                                    ? 'bg-neon-cyan text-black shadow-md'
                                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            Lien YouTube / ID
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { setShowAddDrawer(false); setFileQueue([]); }}
                                        className="text-gray-400 hover:text-white cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {addSourceType === 'upload' ? (
                                    <div className="space-y-3">
                                        {/* Zone de drop multi-fichiers */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => { if (e.target.files) addFilesToQueue(e.target.files); e.target.value = ''; }}
                                        />

                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                            onDragLeave={() => setDragActive(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setDragActive(false);
                                                if (e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files);
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                                                dragActive
                                                    ? 'border-neon-cyan bg-neon-cyan/15 scale-[1.01]'
                                                    : fileQueue.length > 0
                                                        ? 'border-neon-cyan/40 bg-neon-cyan/5'
                                                        : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black uppercase text-white tracking-wide">
                                                    {fileQueue.length > 0 ? `+ Ajouter d'autres fichiers` : 'Cliquez ou glissez vos fichiers audio ici'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                    MP3, WAV, OGG, M4A &bull; <strong className="text-neon-cyan">Sélection multiple supportée</strong>
                                                </p>
                                            </div>
                                        </div>

                                        {/* File Queue List */}
                                        {fileQueue.length > 0 && (
                                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{fileQueue.length} fichier{fileQueue.length > 1 ? 's' : ''} sélectionné{fileQueue.length > 1 ? 's' : ''}</p>
                                                    <button type="button" onClick={() => setFileQueue([])} className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase cursor-pointer">Tout effacer</button>
                                                </div>
                                                {fileQueue.map((qItem) => (
                                                    <div key={qItem.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                                                        qItem.status === 'done' ? 'bg-emerald-950/30 border-emerald-500/30'
                                                        : qItem.status === 'error' ? 'bg-red-950/30 border-red-500/30'
                                                        : qItem.status === 'uploading' ? 'bg-neon-cyan/5 border-neon-cyan/30'
                                                        : 'bg-white/[0.03] border-white/10'
                                                    }`}>
                                                        {/* Icon */}
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                            qItem.status === 'done' ? 'bg-emerald-500/20 text-emerald-400'
                                                            : qItem.status === 'error' ? 'bg-red-500/20 text-red-400'
                                                            : qItem.status === 'uploading' ? 'bg-neon-cyan/20 text-neon-cyan'
                                                            : 'bg-white/5 text-gray-400'
                                                        }`}>
                                                            {qItem.status === 'uploading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                                             qItem.status === 'done' ? <Check className="w-3.5 h-3.5" /> :
                                                             qItem.status === 'error' ? <X className="w-3.5 h-3.5" /> :
                                                             <FileAudio className="w-3.5 h-3.5" />}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <input
                                                                type="text"
                                                                value={qItem.title}
                                                                onChange={(e) => setFileQueue(prev => prev.map(q => q.id === qItem.id ? { ...q, title: e.target.value } : q))}
                                                                disabled={qItem.status !== 'pending'}
                                                                className="w-full bg-transparent text-white text-[11px] font-bold truncate focus:outline-none focus:underline disabled:opacity-60"
                                                                placeholder="Titre du jingle..."
                                                            />
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-mono text-gray-500">{qItem.file.name}</span>
                                                                <span className="text-[9px] font-mono text-neon-cyan/70">{qItem.duration}s</span>
                                                                {qItem.status === 'error' && <span className="text-[9px] text-red-400">{qItem.error}</span>}
                                                            </div>
                                                            {qItem.status === 'uploading' && (
                                                                <div className="mt-1 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-neon-cyan transition-all duration-200" style={{ width: `${qItem.progress}%` }} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Remove */}
                                                        {qItem.status === 'pending' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFileQueue(prev => prev.filter(q => q.id !== qItem.id))}
                                                                className="p-1 text-gray-500 hover:text-red-400 shrink-0 cursor-pointer"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* YouTube URL */
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Lien YouTube ou ID</label>
                                            <input
                                                type="text"
                                                value={newUrl}
                                                onChange={(e) => setNewUrl(e.target.value)}
                                                onBlur={handleUrlBlur}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                                                required={addSourceType === 'youtube'}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Titre</label>
                                                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                                                    placeholder={isFetchingTitle ? 'Récupération...' : 'Titre du jingle'}
                                                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan" required />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Durée (s)</label>
                                                <input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan" min={1} max={600} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Catégorie (globale pour tous les fichiers) */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Catégorie {addSourceType === 'upload' && fileQueue.length > 1 ? '(appliquée à tous)' : ''}</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as any)}
                                        className="w-full bg-[#121422] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan"
                                    >
                                        <option value="jingle">🔔 Jingle / Sweeper</option>
                                        <option value="top_horaire">⏰ TOP Horaire (Début d'heure)</option>
                                        <option value="generique">🎙️ Générique d'émission</option>
                                        <option value="interview">🎙️ Interview / Chronique</option>
                                        <option value="pub">📢 Publicité / Sponsor</option>
                                        <option value="promo">⚡ Promo / Teaser</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddDrawer(false); setFileQueue([]); }}
                                        className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUploadingAll || (addSourceType === 'upload' && fileQueue.length === 0)}
                                        className="px-5 py-2.5 rounded-xl bg-neon-cyan text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 cursor-pointer"
                                    >
                                        {isUploadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        <span>
                                            {isUploadingAll ? 'Upload en cours...'
                                                : addSourceType === 'upload' && fileQueue.length > 1
                                                    ? `Uploader ${fileQueue.length} fichiers`
                                                    : 'Sauvegarder dans le Bac'}
                                        </span>
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Cartouchier Items Grid */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {filteredItems.map((item) => {
                                const isTopHoraire = item.category === 'top_horaire';
                                const isGenerique = item.category === 'generique';
                                const isJingle = item.category === 'jingle';
                                const isPub = item.category === 'pub';
                                const isPlayingThis = playingItemId === item.id;

                                const badgeColor = isTopHoraire
                                    ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40'
                                    : isGenerique
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                        : isJingle 
                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                                            : isPub 
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                : 'bg-red-500/20 text-red-300 border-red-500/30';

                                const categoryLabel = isTopHoraire
                                    ? '⏰ TOP Horaire'
                                    : isGenerique
                                        ? '🎙️ Générique'
                                        : isJingle
                                            ? '🔔 Jingle'
                                            : isPub
                                                ? '📢 Publicité'
                                                : '⚡ Promo';

                                return (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group relative ${
                                            isPlayingThis
                                                ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                                                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                                                    {categoryLabel}
                                                </span>

                                                <div className="flex items-center gap-1.5">
                                                    {item.audioUrl ? (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-mono font-bold">
                                                            🎵 MP3/WAV
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-mono font-bold">
                                                            📺 YT
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-mono text-gray-300 font-bold bg-white/5 px-1.5 py-0.5 rounded">
                                                        {item.duration}s
                                                    </span>
                                                </div>
                                            </div>

                                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-neon-cyan transition-colors">
                                                {item.title}
                                            </h4>

                                            {item.fileName && (
                                                <p className="text-[9px] text-gray-400 font-mono mt-1 truncate">
                                                    📁 {item.fileName}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions bar */}
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                {/* Play / Preview button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePreview(item)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                                                        isPlayingThis
                                                            ? 'bg-neon-cyan text-black shadow-md'
                                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                                    }`}
                                                    title={item.audioUrl ? "Écouter l'extrait audio" : "Voir sur YouTube"}
                                                >
                                                    {isPlayingThis ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                    <span>{isPlayingThis ? 'Stop' : 'Écouter'}</span>
                                                </button>

                                                {/* Quick Config as TOP Horaire */}
                                                {onSetAsTopHoraire && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onSetAsTopHoraire(item)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                                        title="Définir ce jingle comme TOP Horaire officiel"
                                                    >
                                                        Top Horaire
                                                    </button>
                                                )}

                                                {/* Quick Config as Theme Jingle */}
                                                {onSetAsThemeJingle && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onSetAsThemeJingle(item)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                                        title="Définir comme générique d'ouverture"
                                                    >
                                                        Générique
                                                    </button>
                                                )}

                                                {/* Bouton Supprimer — visible sur tous les items au hover */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-all ml-auto cursor-pointer opacity-0 group-hover:opacity-100"
                                                    title="Supprimer ce jingle du bac"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Insérer dans l'émission */}
                                            <button
                                                type="button"
                                                onClick={() => onInsertItem(item)}
                                                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-neon-cyan hover:text-black text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Insérer dans l'Émission</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
