import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Upload,
    Music2,
    FileAudio,
    Check,
    Loader2,
    Trash2,
    Clock,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    ListMusic,
    FolderPlus
} from 'lucide-react';
import { type RadioScheduleBlock, type RadioTrackItem, type RadioTrackCategory, formatDurationExact } from '../../../utils/radioSchedule';
import { uploadFile } from '../../../utils/uploadService';

interface SelectedAudioItem {
    id: string;
    file: File;
    filename: string;
    artist: string;
    title: string;
    duration: number; // in seconds
    category: RadioTrackCategory;
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    errorMsg?: string;
    uploadedUrl?: string;
}

interface RadioBatchMp3UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    blocks: RadioScheduleBlock[];
    defaultBlockId?: string | null;
    onAddTracksToBlock: (blockId: string, tracks: RadioTrackItem[], interleave?: boolean) => void;
    onShowToast: (msg: string, type?: 'success' | 'warn' | 'info') => void;
}

function getAudioFileDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        try {
            const url = URL.createObjectURL(file);
            const audio = new Audio(url);
            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(url);
                if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
                    resolve(Math.round(audio.duration));
                } else {
                    resolve(210);
                }
            });
            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                resolve(210);
            });
            setTimeout(() => {
                try { URL.revokeObjectURL(url); } catch {}
                resolve(210);
            }, 3000);
        } catch {
            resolve(210);
        }
    });
}

function parseAudioFilename(filename: string): { artist: string; title: string } {
    const clean = filename.replace(/\.[a-zA-Z0-9]+$/, '').trim();
    if (clean.includes(' - ')) {
        const parts = clean.split(' - ');
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(' - ').trim()
        };
    }
    if (clean.includes(' — ')) {
        const parts = clean.split(' — ');
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(' — ').trim()
        };
    }
    return {
        artist: 'Artiste Inconnu',
        title: clean
    };
}

export function RadioBatchMp3UploadModal({
    isOpen,
    onClose,
    blocks,
    defaultBlockId,
    onAddTracksToBlock,
    onShowToast
}: RadioBatchMp3UploadModalProps) {
    const [selectedBlockId, setSelectedBlockId] = useState<string>(defaultBlockId || (blocks[0]?.id ?? ''));
    const [audioItems, setAudioItems] = useState<SelectedAudioItem[]>([]);
    const [isUploadingAll, setIsUploadingAll] = useState(false);
    const [interleaveWithHabillage, setInterleaveWithHabillage] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedBlockId(defaultBlockId || (blocks[0]?.id ?? ''));
            setAudioItems([]);
            setIsUploadingAll(false);
        }
    }, [isOpen, defaultBlockId, blocks]);

    if (!isOpen) return null;

    const handleFilesAdded = async (files: FileList | File[]) => {
        const fileArr = Array.from(files).filter(f => 
            f.type.startsWith('audio/') || 
            /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(f.name)
        );

        if (fileArr.length === 0) {
            onShowToast('Aucun fichier audio valide sélectionné (.mp3, .wav, .m4a, etc.)', 'warn');
            return;
        }

        const newItems: SelectedAudioItem[] = [];

        for (let i = 0; i < fileArr.length; i++) {
            const file = fileArr[i];
            const parsed = parseAudioFilename(file.name);
            const duration = await getAudioFileDuration(file);
            const isSet = duration >= 900; // >= 15 min = set

            newItems.push({
                id: `batch_item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                file,
                filename: file.name,
                artist: parsed.artist,
                title: parsed.title,
                duration,
                category: isSet ? 'set' : 'clip',
                status: 'idle',
                progress: 0
            });
        }

        setAudioItems(prev => [...prev, ...newItems]);
        onShowToast(`✓ ${newItems.length} fichier(s) audio ajouté(s) à la liste !`, 'success');
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesAdded(e.target.files);
            e.target.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesAdded(e.dataTransfer.files);
        }
    };

    const handleRemoveItem = (id: string) => {
        setAudioItems(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdateItem = (id: string, updates: Partial<SelectedAudioItem>) => {
        setAudioItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const handleStartUpload = async () => {
        if (!selectedBlockId) {
            onShowToast('Veuillez sélectionner une émission cible', 'warn');
            return;
        }

        const pendingItems = audioItems.filter(item => item.status === 'idle' || item.status === 'error');
        if (pendingItems.length === 0) {
            onShowToast('Tous les morceaux sont déjà uploadés !', 'info');
            return;
        }

        setIsUploadingAll(true);
        const uploadedTracks: RadioTrackItem[] = [];
        let successCount = 0;

        for (let i = 0; i < pendingItems.length; i++) {
            const item = pendingItems[i];
            
            // Met à jour l'item en cours d'upload
            setAudioItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'uploading', progress: 10 } : it));

            try {
                const uploadedUrl = await uploadFile(item.file, 'radio_tracks', (p) => {
                    setAudioItems(prev => prev.map(it => it.id === item.id ? { ...it, progress: p } : it));
                });

                if (uploadedUrl) {
                    setAudioItems(prev => prev.map(it => it.id === item.id ? {
                        ...it,
                        status: 'success',
                        progress: 100,
                        uploadedUrl
                    } : it));

                    const radioTrack: RadioTrackItem = {
                        id: `track_mp3_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                        title: item.title.trim() || item.filename,
                        artist: item.artist.trim() || undefined,
                        audioUrl: uploadedUrl,
                        duration: item.duration || 210,
                        category: item.category || 'clip',
                        addedAt: Date.now()
                    };

                    uploadedTracks.push(radioTrack);
                    successCount++;
                } else {
                    throw new Error("L'URL du fichier uploadé est manquante.");
                }
            } catch (err: any) {
                console.error("Erreur d'upload MP3 :", err);
                setAudioItems(prev => prev.map(it => it.id === item.id ? {
                    ...it,
                    status: 'error',
                    progress: 0,
                    errorMsg: err?.message || 'Échec upload'
                } : it));
            }
        }

        setIsUploadingAll(false);

        if (uploadedTracks.length > 0) {
            onAddTracksToBlock(selectedBlockId, uploadedTracks, interleaveWithHabillage);
            const targetBlock = blocks.find(b => b.id === selectedBlockId);
            onShowToast(`🎉 ${successCount} MP3 ajouté(s) à l'émission « ${targetBlock?.title || 'Radio'} » !`, 'success');
            
            // Si tout a réussi, fermer après un court délai
            if (successCount === pendingItems.length) {
                setTimeout(() => {
                    onClose();
                }, 1200);
            }
        } else {
            onShowToast("Aucun fichier n'a pu être uploadé avec succès.", 'warn');
        }
    };

    const targetBlock = blocks.find(b => b.id === selectedBlockId);
    const totalDurationSeconds = audioItems.reduce((acc, it) => acc + (it.duration || 0), 0);
    const completedCount = audioItems.filter(it => it.status === 'success').length;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-3xl bg-[#0b0e17] border border-emerald-500/40 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#0d1e18] via-[#0f241c] to-[#0d1e18] flex items-center justify-between relative shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                <Upload className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-display font-black text-white tracking-wide uppercase italic">
                                        Upload Multiple MP3
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Lot audio
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Importez plusieurs morceaux MP3 simultanément et associez-les à une émission
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer border border-white/5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content Scrollable */}
                    <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                        {/* 1. Sélection émission cible */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-display font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                                    <FolderPlus className="w-4 h-4 text-emerald-400" />
                                    <span>Émission radio cible</span>
                                </label>
                                {targetBlock && (
                                    <span className="text-[11px] text-gray-400">
                                        {(targetBlock.tracks || []).length} morceaux actuels
                                    </span>
                                )}
                            </div>
                            <select
                                value={selectedBlockId}
                                onChange={(e) => setSelectedBlockId(e.target.value)}
                                disabled={isUploadingAll}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-medium text-white focus:border-emerald-500 outline-none transition-all cursor-pointer"
                            >
                                {blocks.map((b) => (
                                    <option key={b.id} value={b.id} className="bg-[#0b0e17] text-white">
                                        {b.emoji || '📻'} {b.title} ({b.startHour}h-{b.endHour}h)
                                    </option>
                                ))}
                            </select>

                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={interleaveWithHabillage}
                                    onChange={(e) => setInterleaveWithHabillage(e.target.checked)}
                                    className="w-4 h-4 rounded accent-emerald-500"
                                />
                                <span>Entrelacer automatiquement les nouveaux MP3 avec les jingles & promos du bloc</span>
                            </label>
                        </div>

                        {/* 2. Drag & Drop Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                                isDragOver 
                                    ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.01]' 
                                    : 'border-white/15 bg-black/30 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/flac,audio/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                                <FileAudio className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-display font-bold text-white mb-1">
                                Cliquez ou glissez vos fichiers MP3 / WAV ici
                            </p>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">
                                Vous pouvez sélectionner plusieurs dizaines de morceaux d'un coup. Les durées et les noms d'artistes sont détectés automatiquement !
                            </p>
                        </div>

                        {/* 3. Liste des fichiers préparés */}
                        {audioItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-gray-300 px-1">
                                    <div className="flex items-center gap-2 font-display font-black uppercase tracking-wider text-emerald-400">
                                        <ListMusic className="w-4 h-4" />
                                        <span>Fichiers prêts ({audioItems.length})</span>
                                        <span className="text-gray-500 font-normal">
                                            • Durée totale : {formatDurationExact(totalDurationSeconds)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAudioItems([])}
                                        disabled={isUploadingAll}
                                        className="text-[11px] text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                    >
                                        Tout vider
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                    {audioItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                                        >
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0 w-full">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                    {item.status === 'uploading' ? (
                                                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                                                    ) : item.status === 'success' ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    ) : item.status === 'error' ? (
                                                        <AlertCircle className="w-4 h-4 text-red-400" />
                                                    ) : (
                                                        <Music2 className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.artist}
                                                        onChange={(e) => handleUpdateItem(item.id, { artist: e.target.value })}
                                                        disabled={isUploadingAll || item.status === 'success'}
                                                        placeholder="Artiste"
                                                        className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:border-emerald-500 outline-none truncate"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.title}
                                                        onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                                                        disabled={isUploadingAll || item.status === 'success'}
                                                        placeholder="Titre du morceau"
                                                        className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:border-emerald-500 outline-none truncate font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                                <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gray-500" />
                                                    {formatDurationExact(item.duration)}
                                                </span>

                                                <select
                                                    value={item.category}
                                                    onChange={(e) => handleUpdateItem(item.id, { category: e.target.value as RadioTrackCategory })}
                                                    disabled={isUploadingAll || item.status === 'success'}
                                                    className="px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] text-gray-300 outline-none"
                                                >
                                                    <option value="clip">Morceau (Clip)</option>
                                                    <option value="set">Liveset / Mix</option>
                                                </select>

                                                {item.status === 'uploading' && (
                                                    <span className="text-[10px] font-mono font-bold text-emerald-400 min-w-8 text-right">
                                                        {item.progress}%
                                                    </span>
                                                )}

                                                {item.status !== 'success' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        disabled={isUploadingAll}
                                                        className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 shrink-0">
                        <div className="text-xs text-gray-400">
                            {completedCount > 0 && (
                                <span className="text-emerald-400 font-bold">
                                    ✓ {completedCount}/{audioItems.length} uploadé(s)
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isUploadingAll}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                            >
                                Fermer
                            </button>

                            <button
                                type="button"
                                onClick={handleStartUpload}
                                disabled={isUploadingAll || audioItems.length === 0}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploadingAll ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                                        <span>Envoi en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 text-black" />
                                        <span>Uploader {audioItems.length > 0 ? `(${audioItems.length}) MP3` : 'les MP3'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
