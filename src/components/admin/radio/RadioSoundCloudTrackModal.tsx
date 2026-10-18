import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ExternalLink,
    Check,
    Music2,
    Clock,
    Loader2,
    Radio,
    Play,
    FolderPlus,
    Sparkles,
    Image as ImageIcon
} from 'lucide-react';
import { type RadioScheduleBlock, type RadioTrackItem, type RadioTrackCategory, formatDurationExact, cleanRadioTrackMetadata } from '../../../utils/radioSchedule';
import { SoundCloudIcon } from '../modals/AdminSoundCloudPlaylistModal';

interface RadioSoundCloudTrackModalProps {
    isOpen: boolean;
    onClose: () => void;
    blocks: RadioScheduleBlock[];
    defaultBlockId?: string | null;
    onAddTrackToBlock: (blockId: string, track: RadioTrackItem) => void;
    onShowToast: (msg: string, type?: 'success' | 'warn' | 'info') => void;
}

export function RadioSoundCloudTrackModal({
    isOpen,
    onClose,
    blocks,
    defaultBlockId,
    onAddTrackToBlock,
    onShowToast
}: RadioSoundCloudTrackModalProps) {
    const [selectedBlockId, setSelectedBlockId] = useState<string>(defaultBlockId || (blocks[0]?.id ?? ''));
    const [trackUrl, setTrackUrl] = useState('');
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [durationMin, setDurationMin] = useState('3');
    const [durationSec, setDurationSec] = useState('30');
    const [category, setCategory] = useState<RadioTrackCategory>('clip');
    const [coverUrl, setCoverUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedBlockId(defaultBlockId || (blocks[0]?.id ?? ''));
            setTrackUrl('');
            setTitle('');
            setArtist('');
            setDurationMin('3');
            setDurationSec('30');
            setCategory('clip');
            setCoverUrl('');
            setPreviewHtml(null);
            setIsFetching(false);
        }
    }, [isOpen, defaultBlockId, blocks]);

    if (!isOpen) return null;

    const handleFetchSoundCloudInfo = async (urlToFetch: string) => {
        const trimmed = urlToFetch.trim();
        if (!trimmed || !trimmed.includes('soundcloud.com')) return;

        setIsFetching(true);
        try {
            const endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trimmed)}`;
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                const { title: cleanTitle, artist: cleanArtist } = cleanRadioTrackMetadata(data.title || '', data.author_name || '');
                setTitle(cleanTitle);
                setArtist(cleanArtist);
                if (data.thumbnail_url) {
                    // Try to get higher quality artwork if available (replace -large with -t500x500)
                    const hdCover = data.thumbnail_url.replace('-large.', '-t500x500.');
                    setCoverUrl(hdCover);
                }
                if (data.html) {
                    setPreviewHtml(data.html);
                }

                onShowToast('✓ Informations SoundCloud récupérées !', 'success');
            } else {
                onShowToast("Lien analysé mais métadonnées oEmbed non retournées. Vous pouvez remplir manuellement.", 'info');
            }
        } catch (e) {
            console.warn('Erreur SoundCloud oEmbed :', e);
            onShowToast("Impossible de joindre l'API SoundCloud oEmbed.", 'warn');
        } finally {
            setIsFetching(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTrackUrl(val);
        if (val.includes('soundcloud.com/')) {
            handleFetchSoundCloudInfo(val);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBlockId) {
            onShowToast('Veuillez sélectionner une émission cible', 'warn');
            return;
        }

        const trimmedUrl = trackUrl.trim();
        if (!trimmedUrl) {
            onShowToast('Veuillez renseigner le lien SoundCloud du morceau', 'warn');
            return;
        }

        if (!trimmedUrl.includes('soundcloud.com')) {
            onShowToast('Le lien doit être un lien valide soundcloud.com', 'warn');
            return;
        }

        if (trimmedUrl.includes('/sets/')) {
            onShowToast('Ce lien ressemble à une Playlist. Utilisez plutôt le menu "Playlist SoundCloud" pour les albums ou playlists.', 'info');
        }

        const mins = parseInt(durationMin, 10) || 0;
        const secs = parseInt(durationSec, 10) || 0;
        const totalDuration = Math.max(10, mins * 60 + secs);

        const newTrack: RadioTrackItem = {
            id: `track_sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: title.trim() || 'Morceau SoundCloud',
            artist: artist.trim() || undefined,
            duration: totalDuration,
            category: category,
            soundcloudUrl: trimmedUrl,
            coverUrl: coverUrl.trim() || undefined,
            addedAt: Date.now()
        };

        onAddTrackToBlock(selectedBlockId, newTrack);
        const targetBlock = blocks.find(b => b.id === selectedBlockId);
        onShowToast(`✓ « ${newTrack.title} » ajouté à « ${targetBlock?.title || 'l’émission'} » !`, 'success');
        onClose();
    };

    const targetBlock = blocks.find(b => b.id === selectedBlockId);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-xl bg-[#0e1017] border border-orange-500/40 rounded-3xl shadow-[0_0_60px_rgba(255,85,0,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#20100d] via-[#291410] to-[#20100d] flex items-center justify-between relative shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(255,85,0,0.4)]">
                                <SoundCloudIcon className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-display font-black text-white tracking-wide uppercase italic">
                                        Morceau SoundCloud
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                        Lien Simple
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Ajoutez une piste SoundCloud individuelle à l'émission sans toucher au reste
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

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                        {/* 1. Choix émission */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-display font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                                <FolderPlus className="w-4 h-4 text-orange-400" />
                                <span>Émission radio cible</span>
                            </label>
                            <select
                                value={selectedBlockId}
                                onChange={(e) => setSelectedBlockId(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-medium text-white focus:border-orange-500 outline-none transition-all cursor-pointer"
                            >
                                {blocks.map((b) => (
                                    <option key={b.id} value={b.id} className="bg-[#0e1017] text-white">
                                        {b.emoji || '📻'} {b.title} ({b.startHour}h-{b.endHour}h) • {(b.tracks || []).length} morceaux
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. URL SoundCloud */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-display font-black uppercase tracking-wider text-gray-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <SoundCloudIcon className="w-3.5 h-3.5 text-orange-400" />
                                    <span>Lien du morceau SoundCloud</span>
                                </span>
                                {isFetching && (
                                    <span className="text-[11px] text-orange-400 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Analyse en cours...
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={trackUrl}
                                    onChange={handleUrlChange}
                                    placeholder="https://soundcloud.com/artiste/titre-du-morceau"
                                    className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:border-orange-500 outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => handleFetchSoundCloudInfo(trackUrl)}
                                    disabled={isFetching || !trackUrl.includes('soundcloud.com')}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Analyser
                                </button>
                            </div>
                        </div>

                        {/* 3. Métadonnées auto-remplies / éditables */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Artiste
                                </label>
                                <input
                                    type="text"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    placeholder="Ex: Martin Garrix"
                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-orange-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Titre du morceau
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Animals"
                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-orange-500 outline-none font-bold"
                                    required
                                />
                            </div>
                        </div>

                        {/* 4. Durée & Catégorie */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-orange-400" />
                                    <span>Durée estimée</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 flex-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="300"
                                            value={durationMin}
                                            onChange={(e) => setDurationMin(e.target.value)}
                                            className="w-12 bg-transparent text-xs text-white text-center font-bold outline-none"
                                        />
                                        <span className="text-[11px] text-gray-500">min</span>
                                    </div>
                                    <span className="text-gray-500">:</span>
                                    <div className="flex items-center gap-1 bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 flex-1">
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={durationSec}
                                            onChange={(e) => setDurationSec(e.target.value)}
                                            className="w-12 bg-transparent text-xs text-white text-center font-bold outline-none"
                                        />
                                        <span className="text-[11px] text-gray-500">sec</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Type de contenu
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as RadioTrackCategory)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none cursor-pointer"
                                >
                                    <option value="clip">Morceau standard (Clip ~3min)</option>
                                    <option value="set">Liveset / DJ Set complet</option>
                                </select>
                            </div>
                        </div>

                        {/* 5. Pochette / Thumbnail */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-orange-400" />
                                <span>Pochette HD (URL image)</span>
                            </label>
                            <div className="flex items-center gap-2.5">
                                {coverUrl ? (
                                    <img
                                        src={coverUrl}
                                        alt="Cover"
                                        className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-gray-600">
                                        <Music2 className="w-4 h-4" />
                                    </div>
                                )}
                                <input
                                    type="url"
                                    value={coverUrl}
                                    onChange={(e) => setCoverUrl(e.target.value)}
                                    placeholder="https://... (URL pochette)"
                                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-orange-500 outline-none truncate"
                                />
                            </div>
                        </div>

                        {/* 6. Aperçu du player si oEmbed disponible */}
                        {previewHtml && (
                            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                    <Play className="w-3 h-3" />
                                    Aperçu lecteur SoundCloud
                                </span>
                                <div 
                                    className="rounded-xl overflow-hidden max-h-24 opacity-90"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            </div>
                        )}
                    </form>

                    {/* Footer */}
                    <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                        >
                            Annuler
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!trackUrl.trim() || !title.trim()}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(255,85,0,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SoundCloudIcon className="w-4 h-4 text-black" />
                            <span>Ajouter ce morceau SoundCloud</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
