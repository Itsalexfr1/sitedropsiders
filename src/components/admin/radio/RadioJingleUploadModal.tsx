import { useState, useRef } from 'react';
import {
    X,
    Upload,
    Volume2,
    Check,
    Loader2,
    Radio,
    Sparkles,
    FileAudio,
    Clock
} from 'lucide-react';
import { type RadioScheduleBlock, type RadioSpecialJingle } from '../../../utils/radioSchedule';
import { uploadFile } from '../../../utils/uploadService';
import { type RadionomyItem } from '../modals/RadionomyJinglesBox';

interface RadioJingleUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    blocks: RadioScheduleBlock[];
    defaultBlockId?: string | null;
    onSaveJingleForBlock: (blockId: string, jingle: RadioSpecialJingle, insertInTracks: boolean) => void;
    onSaveGeneralJingle: (item: RadionomyItem) => void;
    onShowToast: (msg: string, type?: 'success' | 'warn' | 'info') => void;
}

function getAudioFileDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        try {
            const url = URL.createObjectURL(file);
            const audio = new Audio(url);
            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(url);
                if (isFinite(audio.duration) && !isNaN(audio.duration)) {
                    resolve(Math.max(2, Math.round(audio.duration)));
                } else {
                    resolve(15);
                }
            });
            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                resolve(15);
            });
            setTimeout(() => resolve(15), 2500);
        } catch {
            resolve(15);
        }
    });
}

export function RadioJingleUploadModal({
    isOpen,
    onClose,
    blocks,
    defaultBlockId,
    onSaveJingleForBlock,
    onSaveGeneralJingle,
    onShowToast
}: RadioJingleUploadModalProps) {
    const [selectedTarget, setSelectedTarget] = useState<string>(defaultBlockId || 'general');
    const [jingleTitle, setJingleTitle] = useState('');
    const [jingleAudioUrl, setJingleAudioUrl] = useState('');
    const [jingleYoutubeId, setJingleYoutubeId] = useState('');
    const [jingleDuration, setJingleDuration] = useState('15');
    const [jingleType, setJingleType] = useState<'liner' | 'intro' | 'outro'>('liner');
    const [insertDirectlyInPlaylist, setInsertDirectlyInPlaylist] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [batchStatus, setBatchStatus] = useState<{ current: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (files.length === 1) {
            const file = files[0];
            try {
                setIsUploading(true);
                setUploadProgress(10);
                const dur = await getAudioFileDuration(file);
                setJingleDuration(String(dur));

                let finalUrl = '';
                try {
                    const res = await uploadFile(file, 'radio_jingles', (p) => setUploadProgress(p));
                    if (res) finalUrl = res;
                } catch {
                    finalUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                }

                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
                setJingleAudioUrl(finalUrl);
                if (!jingleTitle.trim()) {
                    setJingleTitle(cleanName);
                }
                onShowToast('✓ Fichier audio chargé !');
            } catch (err) {
                console.error(err);
                onShowToast('Erreur chargement audio', 'warn');
            } finally {
                setIsUploading(false);
                setUploadProgress(0);
                if (e.target) e.target.value = '';
            }
        } else {
            // MULTI-UPLOAD DE JINGLES
            try {
                setIsUploading(true);
                setBatchStatus({ current: 0, total: files.length });

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    setBatchStatus({ current: i + 1, total: files.length });
                    const dur = await getAudioFileDuration(file);
                    let finalUrl = '';
                    try {
                        const res = await uploadFile(file, 'radio_jingles', (p) => setUploadProgress(p));
                        if (res) finalUrl = res;
                    } catch {
                        finalUrl = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.readAsDataURL(file);
                        });
                    }

                    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
                    if (selectedTarget === 'general') {
                        const newItem: RadionomyItem = {
                            id: `gen_jingle_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                            title: cleanName,
                            category: 'jingle',
                            duration: dur,
                            audioUrl: finalUrl,
                            isCustom: true
                        };
                        onSaveGeneralJingle(newItem);
                    } else {
                        const specialJingle: RadioSpecialJingle = {
                            id: `special_${selectedTarget}_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                            title: cleanName,
                            audioUrl: finalUrl,
                            duration: dur,
                            enabled: true
                        };
                        onSaveJingleForBlock(selectedTarget, specialJingle, insertDirectlyInPlaylist);
                    }
                }

                const targetName = selectedTarget === 'general'
                    ? 'Jingles Généraux'
                    : blocks.find(b => b.id === selectedTarget)?.title || 'l\'émission';
                onShowToast(`✓ ${files.length} jingles ajoutés avec succès à ${targetName} !`, 'success');
                onClose();
            } catch (err) {
                console.error(err);
                onShowToast('Erreur lors du multi-upload', 'warn');
            } finally {
                setIsUploading(false);
                setBatchStatus(null);
                setUploadProgress(0);
                if (e.target) e.target.value = '';
            }
        }
    };

    const handleSave = () => {
        if (!jingleTitle.trim()) {
            onShowToast('Veuillez entrer un titre pour ce jingle', 'warn');
            return;
        }
        if (!jingleAudioUrl && !jingleYoutubeId) {
            onShowToast('Veuillez uploader un fichier audio MP3/WAV ou entrer un lien', 'warn');
            return;
        }

        const dur = Math.max(3, parseInt(jingleDuration, 10) || 15);

        if (selectedTarget === 'general') {
            // JINGLE GÉNÉRAL (Antenne Dropsiders globale)
            const newItem: RadionomyItem = {
                id: `gen_jingle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                title: jingleTitle.trim(),
                category: 'jingle',
                duration: dur,
                audioUrl: jingleAudioUrl || undefined,
                youtubeId: jingleYoutubeId || undefined,
                isCustom: true
            };
            onSaveGeneralJingle(newItem);
            onShowToast(`✓ « ${newItem.title} » ajouté aux Jingles Généraux !`);
        } else {
            // JINGLE SPÉCIAL POUR UNE ÉMISSION
            const targetBlock = blocks.find(b => b.id === selectedTarget);
            const specialJingle: RadioSpecialJingle = {
                id: `special_${selectedTarget}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                title: jingleTitle.trim(),
                audioUrl: jingleAudioUrl || undefined,
                youtubeId: jingleYoutubeId || undefined,
                duration: dur,
                enabled: true
            };
            onSaveJingleForBlock(selectedTarget, specialJingle, insertDirectlyInPlaylist);
            onShowToast(`✓ Jingle enregistré pour l'émission « ${targetBlock?.title || 'sélectionnée'} » !`);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="w-full max-w-xl rounded-3xl bg-[#0e1017] border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                            <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider">
                                UPLOADER UN NOUVEAU JINGLE RADIO
                            </h3>
                            <p className="text-[11px] text-gray-400">
                                Choisissez l'émission cible ou attribuez-le à l'antenne générale
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-xl hover:bg-white/5 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Corps du formulaire */}
                <div className="p-6 space-y-4">
                    {/* 1. LE MENU DÉROULANT DE CHOIX D'ÉMISSION (Demandé spécifiquement par l'utilisateur) */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/[0.03] border border-cyan-500/30">
                        <label className="text-xs font-display font-black text-neon-cyan uppercase italic tracking-wider flex items-center gap-2">
                            <Radio className="w-4 h-4 text-neon-cyan" />
                            Destination du Jingle (Menu Déroulant) *
                        </label>
                        <select
                            value={selectedTarget}
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-display font-bold text-xs focus:outline-none focus:border-neon-cyan cursor-pointer"
                        >
                            <option value="general" className="bg-[#121422] text-amber-300 font-bold">
                                🌐 Jingle Général (Tous les programmes / Antenne globale)
                            </option>
                            <optgroup label="── Jingle Spécial pour une émission ──">
                                {blocks.map((b) => (
                                    <option key={b.id} value={b.id} className="bg-[#121422] text-white">
                                        📻 Émission : {b.emoji} {b.title} ({b.timeSlot || 'Créneau'})
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {selectedTarget === 'general'
                                ? 'Ce jingle sera disponible dans le bac général et pourra être utilisé sur toute la grille.'
                                : `Ce jingle sera rattaché spécifiquement à l'émission sélectionnée et apparaîtra dans sa liste.`}
                        </p>
                    </div>

                    {/* 2. Titre du jingle */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Titre du Jingle *
                        </label>
                        <input
                            type="text"
                            value={jingleTitle}
                            onChange={(e) => setJingleTitle(e.target.value)}
                            placeholder="Ex: Sweeper Techno Bunker #1, Voix Drop..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                    </div>

                    {/* 3. Zone d'Upload Fichier MP3 / WAV */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Fichier Audio (MP3 / WAV)
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-2xl p-5 text-center cursor-pointer bg-white/[0.01] hover:bg-amber-500/[0.03] transition-all group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg,.mp3,.wav,.ogg"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                                    <span className="text-xs text-amber-300 font-mono">
                                        {batchStatus
                                            ? `Upload des fichiers (${batchStatus.current} / ${batchStatus.total})...`
                                            : `Upload en cours... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}`}
                                    </span>
                                </div>
                            ) : jingleAudioUrl ? (
                                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                                    <FileAudio className="w-5 h-5 text-emerald-400" />
                                    <span>Fichier audio prêt ! (Cliquer pour changer ou sélectionner plusieurs fichiers)</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5">
                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
                                    <span className="text-xs font-bold text-gray-300">
                                        Glissez vos fichiers ou cliquez pour sélectionner (un ou plusieurs)
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                        Supporte l'upload multiple en 1 clic : MP3, WAV, OGG
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Durée & Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Durée (secondes)
                            </label>
                            <input
                                type="number"
                                min={2}
                                max={180}
                                value={jingleDuration}
                                onChange={(e) => setJingleDuration(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono text-center focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Type d'habillage
                            </label>
                            <select
                                value={jingleType}
                                onChange={(e) => setJingleType(e.target.value as any)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                            >
                                <option value="liner">🔔 Jingle / Sweeper</option>
                                <option value="intro">🎙️ Générique Intro</option>
                                <option value="outro">🏁 Outro / Fin</option>
                            </select>
                        </div>
                    </div>

                    {/* 5. Option : Insérer directement dans les morceaux de l'émission */}
                    {selectedTarget !== 'general' && (
                        <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-all">
                            <input
                                type="checkbox"
                                checked={insertDirectlyInPlaylist}
                                onChange={(e) => setInsertDirectlyInPlaylist(e.target.checked)}
                                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                            />
                            <div className="text-xs">
                                <span className="font-display font-black text-white uppercase italic">
                                    Insérer directement dans la liste des morceaux
                                </span>
                                <p className="text-[10px] text-gray-400">
                                    Le jingle apparaîtra visible dans l'ordre de passage des morceaux de cette émission.
                                </p>
                            </div>
                        </label>
                    )}
                </div>

                {/* Footer boutons */}
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-black/40">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer"
                    >
                        Annuler
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isUploading}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                    >
                        <Check className="w-4 h-4" />
                        <span>Enregistrer le Jingle</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
