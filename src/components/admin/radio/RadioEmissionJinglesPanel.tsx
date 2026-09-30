import { useState, useRef } from 'react';
import {
    Volume2,
    Play,
    Pause,
    Plus,
    Trash2,
    Upload,
    Sparkles,
    Check,
    Radio
} from 'lucide-react';
import {
    type RadioScheduleBlock,
    type RadioSpecialJingle,
    type RadioThemeJingle,
    type RadioTrackItem,
    formatDurationExact
} from '../../../utils/radioSchedule';
import { uploadFile } from '../../../utils/uploadService';

interface RadioEmissionJinglesPanelProps {
    block: RadioScheduleBlock;
    onUpdateBlock: (updated: RadioScheduleBlock) => void;
    playingAudioId: string | null;
    onToggleAudioPreview: (id: string, url: string) => void;
    onShowToast: (msg: string, type?: 'success' | 'warn' | 'info') => void;
}

export function RadioEmissionJinglesPanel({
    block,
    onUpdateBlock,
    playingAudioId,
    onToggleAudioPreview,
    onShowToast
}: RadioEmissionJinglesPanelProps) {
    // ── Formulaire d'ajout d'un nouveau jingle spécifique ──
    const [jingleTitle, setJingleTitle] = useState('');
    const [jingleAudioUrl, setJingleAudioUrl] = useState('');
    const [jingleYoutubeId, setJingleYoutubeId] = useState('');
    const [jingleDuration, setJingleDuration] = useState('15');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── État local pour le générique ──
    const themeJingle = block.themeJingle || {
        enabled: false,
        title: `Générique • ${block.title}`,
        duration: 15
    };

    const specialJingles = block.specialJingles || [];

    // Sauvegarde du générique d'intro
    const handleUpdateTheme = (changes: Partial<RadioThemeJingle>) => {
        const updatedTheme: RadioThemeJingle = {
            ...themeJingle,
            ...changes
        };
        onUpdateBlock({
            ...block,
            themeJingle: updatedTheme
        });
        onShowToast('✓ Générique d\'émission mis à jour !');
    };

    // Upload d'un fichier audio pour le générique
    const handleUploadThemeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            let uploadedUrl = '';
            try {
                const res = await uploadFile(file);
                if (res?.url) uploadedUrl = res.url;
            } catch {
                uploadedUrl = await new Promise((resolve) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result as string);
                    r.readAsDataURL(file);
                });
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
            handleUpdateTheme({
                title: themeJingle.title || `Générique • ${cleanName}`,
                audioUrl: uploadedUrl,
                enabled: true
            });
            onShowToast('✓ Fichier audio du générique enregistré !');
        } catch (err) {
            console.error(err);
            onShowToast('Erreur lors du chargement audio', 'warn');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    // Upload d'un fichier audio pour un nouveau jingle spécial
    const handleUploadSpecialFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            let uploadedUrl = '';
            try {
                const res = await uploadFile(file);
                if (res?.url) uploadedUrl = res.url;
            } catch {
                uploadedUrl = await new Promise((resolve) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result as string);
                    r.readAsDataURL(file);
                });
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
            setJingleAudioUrl(uploadedUrl);
            if (!jingleTitle.trim()) {
                setJingleTitle(cleanName);
            }
            onShowToast('✓ Audio importé ! Renseignez le titre et validez');
        } catch (err) {
            console.error(err);
            onShowToast('Erreur chargement audio', 'warn');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    // Ajout d'un jingle spécifique
    const handleAddSpecialJingle = () => {
        if (!jingleTitle.trim()) {
            onShowToast('Veuillez saisir un titre pour le jingle', 'warn');
            return;
        }
        if (!jingleAudioUrl && !jingleYoutubeId) {
            onShowToast('Veuillez uploader un audio ou renseigner un lien YouTube', 'warn');
            return;
        }

        const newJingle: RadioSpecialJingle = {
            id: `special_jingle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: jingleTitle.trim(),
            audioUrl: jingleAudioUrl || undefined,
            youtubeId: jingleYoutubeId || undefined,
            duration: Math.max(3, parseInt(jingleDuration) || 15),
            enabled: true
        };

        const updatedList = [...specialJingles, newJingle];
        onUpdateBlock({
            ...block,
            specialJingles: updatedList
        });

        setJingleTitle('');
        setJingleAudioUrl('');
        setJingleYoutubeId('');
        setJingleDuration('15');
        onShowToast(`✓ Jingle « ${newJingle.title} » ajouté à l'émission !`);
    };

    // Suppression d'un jingle spécifique
    const handleDeleteSpecialJingle = (id: string) => {
        const updated = specialJingles.filter(j => j.id !== id);
        onUpdateBlock({
            ...block,
            specialJingles: updated
        });
        onShowToast('Jingle retiré de l\'émission');
    };

    // Insérer ponctuellement un jingle spécial dans la liste des morceaux
    const handleInsertJingleToTracks = (jingle: RadioSpecialJingle) => {
        const newTrack: RadioTrackItem = {
            id: `track_jingle_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            title: jingle.title,
            artist: `${block.title} Jingle`,
            audioUrl: jingle.audioUrl,
            youtubeId: jingle.youtubeId,
            duration: jingle.duration,
            category: 'jingle'
        };

        const updatedTracks = [...(block.tracks || []), newTrack];
        onUpdateBlock({
            ...block,
            tracks: updatedTracks
        });
        onShowToast(`✓ Jingle inséré dans la programmation de l'émission !`);
    };

    // Injection automatique des jingles tous les X morceaux
    const handleAutoInjectJingles = (frequency: number) => {
        if (specialJingles.length === 0) {
            onShowToast('Ajoutez d\'abord au moins un jingle spécial ci-dessous', 'warn');
            return;
        }
        const currentTracks = (block.tracks || []).filter(t => t.category !== 'jingle');
        if (currentTracks.length < 2) {
            onShowToast('Il vous faut au moins 2 morceaux dans l\'émission pour injecter des jingles', 'warn');
            return;
        }

        const newTracks: RadioTrackItem[] = [];
        let jingleIdx = 0;

        currentTracks.forEach((track, index) => {
            newTracks.push(track);
            // Insère un jingle après chaque groupe de `frequency` morceaux (sauf le tout dernier)
            if ((index + 1) % frequency === 0 && index < currentTracks.length - 1) {
                const j = specialJingles[jingleIdx % specialJingles.length];
                newTracks.push({
                    id: `auto_jingle_${Date.now()}_${index}`,
                    title: j.title,
                    artist: `${block.title} Jingle`,
                    audioUrl: j.audioUrl,
                    youtubeId: j.youtubeId,
                    duration: j.duration,
                    category: 'jingle'
                });
                jingleIdx++;
            }
        });

        onUpdateBlock({
            ...block,
            tracks: newTracks,
            jingleFrequency: frequency
        });
        onShowToast(`✓ Jingles injectés automatiquement tous les ${frequency} morceaux !`);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* ── SECTION 1 : GÉNÉRIQUE / JINGLE D'OUVERTURE ── */}
            <div className="p-5 rounded-3xl bg-white/[0.03] border border-purple-500/20 shadow-lg relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Radio className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                🎙️ Générique d'Intro de l'émission
                                {themeJingle.enabled && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono normal-case">
                                        Actif au démarrage
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-gray-400">
                                Se lance automatiquement à l'ouverture du créneau horaire de l'émission
                            </p>
                        </div>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                        <input
                            type="checkbox"
                            checked={themeJingle.enabled}
                            onChange={(e) => handleUpdateTheme({ enabled: e.target.checked })}
                            className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {themeJingle.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                    </label>
                </div>

                {themeJingle.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                        <div className="md:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Titre du Générique</label>
                            <input
                                type="text"
                                value={themeJingle.title || ''}
                                onChange={(e) => handleUpdateTheme({ title: e.target.value })}
                                placeholder="Ex: Intro Officielle Techno Bunker"
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div className="md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Durée (secondes)</label>
                            <input
                                type="number"
                                min={5}
                                max={120}
                                value={themeJingle.duration || 15}
                                onChange={(e) => handleUpdateTheme({ duration: parseInt(e.target.value) || 15 })}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono text-center focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div className="md:col-span-3 flex items-end gap-2">
                            {themeJingle.audioUrl && (
                                <button
                                    type="button"
                                    onClick={() => onToggleAudioPreview(`theme_${block.id}`, themeJingle.audioUrl!)}
                                    className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                        playingAudioId === `theme_${block.id}`
                                            ? 'bg-purple-500 text-black border-purple-400'
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                                    }`}
                                >
                                    {playingAudioId === `theme_${block.id}` ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    <span>{playingAudioId === `theme_${block.id}` ? 'Stop' : 'Écouter'}</span>
                                </button>
                            )}

                            <label className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all">
                                <Upload className="w-3.5 h-3.5 text-purple-400" />
                                <span>{themeJingle.audioUrl ? 'Remplacer MP3' : 'Upload MP3'}</span>
                                <input
                                    type="file"
                                    accept="audio/mp3,audio/wav,audio/mpeg"
                                    className="hidden"
                                    onChange={handleUploadThemeFile}
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* ── SECTION 2 : JINGLES SPÉCIFIQUES DE L'ÉMISSION (PACK SHOW) ── */}
            <div className="p-5 rounded-3xl bg-white/[0.03] border border-amber-500/20 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                🔔 Jingles Spéciaux & Liners de l'émission ({specialJingles.length})
                            </h3>
                            <p className="text-xs text-gray-400">
                                Jingles personnalisés dédiés exclusivement à « {block.title} » (voix d'antenne, sweepers, drops)
                            </p>
                        </div>
                    </div>

                    {/* Injection automatique */}
                    {specialJingles.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                            <span className="text-[10px] font-bold text-gray-400 px-2 uppercase">Injection auto :</span>
                            {[2, 3, 4].map(freq => (
                                <button
                                    key={freq}
                                    type="button"
                                    onClick={() => handleAutoInjectJingles(freq)}
                                    className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer"
                                    title={`Insérer un jingle de cette émission tous les ${freq} morceaux`}
                                >
                                    Tous les {freq} titres
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Formulaire d'ajout rapide d'un jingle spécial */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <span className="text-[10px] font-display font-black text-amber-400 uppercase tracking-wider block">
                        + Ajouter un jingle spécial à cette émission
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                        <div className="md:col-span-5">
                            <input
                                type="text"
                                value={jingleTitle}
                                onChange={(e) => setJingleTitle(e.target.value)}
                                placeholder="Nom du jingle (ex: Sweeper Techno Bunker, Voix DJ...)"
                                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        <div className="md:col-span-3 flex items-center gap-2">
                            <label className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all">
                                <Upload className="w-3.5 h-3.5 text-amber-400" />
                                <span className="truncate">{jingleAudioUrl ? 'Audio chargé ✓' : 'Fichier MP3/WAV'}</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="audio/mp3,audio/wav,audio/mpeg"
                                    className="hidden"
                                    onChange={handleUploadSpecialFile}
                                />
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <input
                                type="number"
                                min={3}
                                max={90}
                                value={jingleDuration}
                                onChange={(e) => setJingleDuration(e.target.value)}
                                placeholder="Durée (s)"
                                title="Durée en secondes"
                                className="w-full px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono text-center focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={handleAddSpecialJingle}
                                disabled={isUploading}
                                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Ajouter</span>
                            </button>
                        </div>
                    </div>

                    {/* Saisie alternative lien YouTube ou audio URL direct */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
                        <span>Ou lien YouTube / URL :</span>
                        <input
                            type="text"
                            value={jingleAudioUrl || jingleYoutubeId}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.includes('youtube.com') || val.includes('youtu.be')) {
                                    setJingleYoutubeId(val);
                                } else {
                                    setJingleAudioUrl(val);
                                }
                            }}
                            placeholder="https://..."
                            className="flex-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] font-mono focus:outline-none"
                        />
                    </div>
                </div>

                {/* Liste des jingles spécifiques de l'émission */}
                {specialJingles.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                        <Volume2 className="w-8 h-8 mx-auto mb-2 text-gray-600 opacity-50" />
                        <p className="text-xs font-bold text-gray-400 uppercase">Aucun jingle spécial pour cette émission</p>
                        <p className="text-[11px] text-gray-600 mt-1">
                            Uploadez vos MP3 ci-dessus pour personnaliser l'ambiance sonore de ce créneau radio.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {specialJingles.map((jingle, idx) => {
                            const isPlaying = playingAudioId === jingle.id;
                            return (
                                <div
                                    key={jingle.id || idx}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/40 transition-all group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* Play button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (jingle.audioUrl) {
                                                    onToggleAudioPreview(jingle.id, jingle.audioUrl);
                                                } else {
                                                    onShowToast('Pas d\'aperçu audio direct pour ce jingle', 'info');
                                                }
                                            }}
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer shrink-0 ${
                                                isPlaying
                                                    ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                                    : 'bg-white/10 text-white hover:bg-amber-500/20 hover:text-amber-300'
                                            }`}
                                        >
                                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                        </button>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-display font-black text-white uppercase italic tracking-tight truncate">
                                                {jingle.title}
                                            </p>
                                            <span className="text-[10px] font-mono text-amber-400">
                                                🔔 {formatDurationExact(jingle.duration)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleInsertJingleToTracks(jingle)}
                                            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                                            title="Insérer ce jingle dans la liste des morceaux de l'émission"
                                        >
                                            <Plus className="w-3 h-3 text-amber-400" />
                                            <span className="hidden sm:inline">Insérer</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSpecialJingle(jingle.id)}
                                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                                            title="Supprimer ce jingle"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
