import { useState, useRef, useEffect } from 'react';
import {
    Upload,
    Play,
    Pause,
    Trash2,
    Check,
    Loader2,
    FileAudio,
    Sparkles,
    Search,
    ExternalLink,
    Clock,
    Plus,
    X
} from 'lucide-react';
import { type RadionomyItem } from '../modals/RadionomyJinglesBox';
import { uploadFile } from '../../../utils/uploadService';
import { getRadioCategoryMeta } from '../../../utils/radioSchedule';

interface RadioMediaPoolPanelProps {
    items: RadionomyItem[];
    onInsertItemToActiveBlock: (item: RadionomyItem) => void;
    onSetAsTopHoraire: (item: RadionomyItem) => void;
    onSetAsThemeJingle: (item: RadionomyItem) => void;
    onDeleteItem: (id: string) => void;
    onAddNewItem: (item: RadionomyItem) => void;
    activeBlockTitle?: string;
    playingAudioId: string | null;
    onToggleAudioPreview: (id: string, url: string) => void;
}

type MediaFilter = 'all' | 'jingle' | 'top_horaire' | 'generique' | 'interview' | 'pub' | 'promo';

export function RadioMediaPoolPanel({
    items,
    onInsertItemToActiveBlock,
    onSetAsTopHoraire,
    onSetAsThemeJingle,
    onDeleteItem,
    onAddNewItem,
    activeBlockTitle,
    playingAudioId,
    onToggleAudioPreview
}: RadioMediaPoolPanelProps) {
    const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadDrawer, setShowUploadDrawer] = useState(false);
    const [uploadCategory, setUploadCategory] = useState<'jingle' | 'top_horaire' | 'generique' | 'interview' | 'pub' | 'promo'>('jingle');

    // Multi-upload queue
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
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setShowUploadDrawer(true);
    };

    const handleUploadAll = async () => {
        if (fileQueue.length === 0 || isUploadingAll) return;
        setIsUploadingAll(true);

        const uploadPromises = fileQueue.map(async (queueItem) => {
            setFileQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'uploading', progress: 30 } : q));
            try {
                const uploadedUrl = await uploadFile(queueItem.file, 'radio/jingles');
                if (!uploadedUrl) throw new Error('Échec upload Supabase');

                const newItem: RadionomyItem = {
                    id: `rad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    title: queueItem.title,
                    audioUrl: uploadedUrl,
                    duration: queueItem.duration,
                    category: uploadCategory,
                    isCustom: true,
                    fileName: queueItem.file.name
                };

                onAddNewItem(newItem);

                setFileQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'done', progress: 100, audioUrl: uploadedUrl } : q));
            } catch (err: any) {
                setFileQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'error', error: err?.message || 'Erreur' } : q));
            }
        });

        await Promise.all(uploadPromises);
        setIsUploadingAll(false);
    };

    // Filtrage des éléments
    const filteredItems = items.filter(item => {
        if (activeFilter !== 'all' && item.category !== activeFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return item.title.toLowerCase().includes(q);
        }
        return true;
    });

    const categoryCounts: Record<MediaFilter, number> = {
        all: items.length,
        jingle: items.filter(i => i.category === 'jingle').length,
        top_horaire: items.filter(i => i.category === 'top_horaire').length,
        generique: items.filter(i => i.category === 'generique').length,
        interview: items.filter(i => i.category === 'interview').length,
        pub: items.filter(i => i.category === 'pub').length,
        promo: items.filter(i => i.category === 'promo').length,
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ── BANDEAU HAUT MÉDIATHÈQUE ── */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-black/60 border border-purple-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                        📁 MÉDIATHÈQUE & JINGLES RADIO ({items.length})
                    </h3>
                    <p className="text-xs text-gray-300 font-sans mt-0.5">
                        Stockez, organisez et insérez vos jingles, interviews, génériques et spots publicitaires.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-neon-cyan text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Uploader MP3 / WAV</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files) addFilesToQueue(e.target.files);
                            e.target.value = '';
                        }}
                    />
                </div>
            </div>

            {/* ── ZONE DE DROP GLISSER-DÉPOSER / UPLOAD TIROIR ── */}
            {showUploadDrawer && (
                <div className="p-5 rounded-3xl bg-[#0e101a] border border-neon-cyan/40 shadow-[0_0_30px_rgba(0,240,255,0.15)] space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-black uppercase italic text-neon-cyan flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            File d'upload ({fileQueue.length} fichier{fileQueue.length > 1 ? 's' : ''})
                        </span>
                        <button
                            type="button"
                            onClick={() => { setShowUploadDrawer(false); setFileQueue([]); }}
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Sélection de la catégorie pour le lot */}
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                        <label className="text-xs font-display font-black text-gray-300 uppercase italic">
                            Catégorie appliquée au lot :
                        </label>
                        <select
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value as any)}
                            className="bg-[#141624] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-neon-cyan"
                        >
                            <option value="jingle">🔔 Jingle / Sweeper</option>
                            <option value="top_horaire">⏰ TOP Horaire (Début d'heure)</option>
                            <option value="generique">🎙️ Générique d'émission</option>
                            <option value="interview">🎙️ Interview / Chronique</option>
                            <option value="pub">📢 Publicité / Sponsor</option>
                            <option value="promo">⚡ Promo / Teaser</option>
                        </select>
                    </div>

                    {/* Liste des fichiers dans la file */}
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {fileQueue.map((item) => (
                            <div key={item.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <FileAudio className="w-4 h-4 text-neon-cyan shrink-0" />
                                    <span className="text-white font-mono truncate">{item.title}</span>
                                    <span className="text-gray-400 font-mono text-[10px]">({item.duration}s)</span>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    {item.status === 'uploading' && <span className="text-neon-cyan flex items-center gap-1 font-mono text-[10px]"><Loader2 className="w-3 h-3 animate-spin" /> Upload...</span>}
                                    {item.status === 'done' && <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]"><Check className="w-3 h-3" /> Fait</span>}
                                    {item.status === 'error' && <span className="text-red-400 font-mono text-[10px]">{item.error || 'Erreur'}</span>}
                                    {item.status === 'pending' && <span className="text-gray-500 font-mono text-[10px]">En attente</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => { setShowUploadDrawer(false); setFileQueue([]); }}
                            className="px-4 py-2 rounded-xl bg-white/5 text-xs text-gray-400 hover:text-white"
                        >
                            Fermer
                        </button>
                        <button
                            type="button"
                            onClick={handleUploadAll}
                            disabled={isUploadingAll || fileQueue.length === 0}
                            className="px-5 py-2 rounded-xl bg-neon-cyan text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                        >
                            {isUploadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span>{isUploadingAll ? 'Envoi en cours...' : `Lancer l'upload (${fileQueue.length})`}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── BARRE DE FILTRES ET RECHERCHE ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                    {[
                        { id: 'all', label: 'Tout voir' },
                        { id: 'jingle', label: '🔔 Jingles' },
                        { id: 'top_horaire', label: '⏰ TOP Horaires' },
                        { id: 'generique', label: '🎙️ Génériques' },
                        { id: 'interview', label: '🎙️ Interviews' },
                        { id: 'pub', label: '📢 Pubs' },
                        { id: 'promo', label: '⚡ Promos' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveFilter(tab.id as MediaFilter)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                activeFilter === tab.id
                                    ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.label} ({categoryCounts[tab.id as MediaFilter]})
                        </button>
                    ))}
                </div>

                {/* Recherche */}
                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par titre..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-cyan"
                    />
                </div>
            </div>

            {/* ── GRILLE DES ÉLÉMENTS DE LA MÉDIATHÈQUE ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredItems.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-500">
                        <FileAudio className="w-12 h-12 mx-auto mb-2 opacity-30 text-gray-400" />
                        <p className="font-display font-black text-sm uppercase italic text-gray-400">Aucun fichier dans cette catégorie</p>
                        <p className="text-xs text-gray-500 mt-1">Glissez un fichier audio MP3 ou WAV pour l'ajouter.</p>
                    </div>
                ) : (
                    filteredItems.map((item) => {
                        const meta = getRadioCategoryMeta(item.category);
                        const isPlaying = playingAudioId === `pool_${item.id}`;

                        return (
                            <div
                                key={item.id}
                                className="p-3.5 rounded-2xl bg-[#0c0d16]/80 hover:bg-[#121422] border border-white/10 hover:border-neon-cyan/40 transition-all flex flex-col justify-between space-y-3 group shadow-sm"
                                style={{ borderLeftColor: meta.color, borderLeftWidth: 4 }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className={`text-[8px] font-display font-black uppercase italic px-2 py-0.5 rounded-md border ${meta.bg} ${meta.text} ${meta.border} flex items-center gap-1`}>
                                        <span>{meta.emoji}</span>
                                        <span>{meta.label}</span>
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {item.audioUrl && (
                                            <button
                                                type="button"
                                                onClick={() => onToggleAudioPreview(`pool_${item.id}`, item.audioUrl!)}
                                                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                                    isPlaying
                                                        ? 'bg-neon-cyan text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                                                        : 'bg-white/5 hover:bg-neon-cyan/20 text-gray-400 hover:text-neon-cyan'
                                                }`}
                                                title={isPlaying ? 'Pause' : 'Écouter'}
                                            >
                                                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onDeleteItem(item.id)}
                                            className="p-1.5 rounded-xl text-gray-500 hover:text-neon-red hover:bg-red-500/10 transition-all cursor-pointer"
                                            title="Supprimer définitivement"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-display font-black text-white uppercase italic truncate">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-gray-400">
                                        <span>⏱️ {item.duration}s</span>
                                        <span>·</span>
                                        <span>{item.audioUrl ? '🎵 MP3/WAV' : '▶ YouTube'}</span>
                                    </div>
                                </div>

                                {/* Actions rapides */}
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onInsertItemToActiveBlock(item)}
                                        className="flex-1 py-1.5 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan text-neon-cyan hover:text-black font-display font-black text-[9px] uppercase italic tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        title={`Insérer dans ${activeBlockTitle || "l'émission active"}`}
                                    >
                                        <Plus className="w-3 h-3" />
                                        <span>Insérer dans l'émission</span>
                                    </button>

                                    {item.category === 'top_horaire' && (
                                        <button
                                            type="button"
                                            onClick={() => onSetAsTopHoraire(item)}
                                            className="px-2 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[8.5px] font-mono border border-cyan-500/30 cursor-pointer"
                                            title="Définir comme Top Horaire officiel"
                                        >
                                            Top Officiel
                                        </button>
                                    )}

                                    {item.category === 'generique' && (
                                        <button
                                            type="button"
                                            onClick={() => onSetAsThemeJingle(item)}
                                            className="px-2 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[8.5px] font-mono border border-purple-500/30 cursor-pointer"
                                            title="Définir comme générique d'ouverture de l'émission"
                                        >
                                            Générique
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
