import { useState } from 'react';
import {
    Play,
    Pause,
    ChevronUp,
    ChevronDown,
    Trash2,
    Pencil,
    Plus,
    Tv,
    Clock,
    Music,
    Film,
    Sparkles,
    Shuffle,
    ExternalLink,
    Loader2
} from 'lucide-react';
import {
    type RadioTrackItem,
    type RadioTrackCategory,
    formatDurationExact,
    getRadioCategoryMeta
} from '../../../utils/radioSchedule';
import { extractYouTubeId, fetchYouTubeTitle } from '../modals/AdminTVModal';

interface RadioEmissionTracksPanelProps {
    tracks: RadioTrackItem[];
    emissionTitle: string;
    emissionColor: string;
    randomize: boolean;
    onToggleRandomize: () => void;
    onAddTrack: (track: RadioTrackItem) => void;
    onMoveTrack: (index: number, direction: 'up' | 'down') => void;
    onDeleteTrack: (index: number) => void;
    onEditTrack: (track: RadioTrackItem, index: number) => void;
    onSendToTV?: (track: RadioTrackItem) => void;
    playingAudioId: string | null;
    onToggleAudioPreview: (id: string, url: string) => void;
    onOpenTVLibrary: () => void;
    onShowToast: (msg: string, type?: 'success' | 'warn' | 'info') => void;
}

export function RadioEmissionTracksPanel({
    tracks,
    emissionTitle,
    emissionColor,
    randomize,
    onToggleRandomize,
    onAddTrack,
    onMoveTrack,
    onDeleteTrack,
    onEditTrack,
    onSendToTV,
    playingAudioId,
    onToggleAudioPreview,
    onOpenTVLibrary,
    onShowToast
}: RadioEmissionTracksPanelProps) {
    const [trackUrl, setTrackUrl] = useState('');
    const [trackTitle, setTrackTitle] = useState('');
    const [trackArtist, setTrackArtist] = useState('');
    const [trackCategory, setTrackCategory] = useState<RadioTrackCategory>('liveset');
    const [trackDurationMinutes, setTrackDurationMinutes] = useState('4');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);

    // Auto-détection YouTube
    const handleUrlChange = async (url: string) => {
        setTrackUrl(url);
        const ytId = extractYouTubeId(url);
        if (ytId && !trackTitle) {
            setIsFetchingTitle(true);
            try {
                const fetched = await fetchYouTubeTitle(ytId);
                if (fetched) {
                    setTrackTitle(fetched);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsFetchingTitle(false);
            }
        }
    };

    const handleCreateTrack = () => {
        if (!trackTitle.trim()) {
            onShowToast('Veuillez saisir un titre pour le morceau', 'warn');
            return;
        }

        const ytId = extractYouTubeId(trackUrl);
        const isAudioUrl = trackUrl.startsWith('http') && !ytId;

        const durSec = Math.max(10, (parseInt(trackDurationMinutes) || 4) * 60);

        const newTrack: RadioTrackItem = {
            id: `radio_track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: trackTitle.trim(),
            artist: trackArtist.trim() || undefined,
            youtubeId: ytId || undefined,
            audioUrl: isAudioUrl ? trackUrl.trim() : undefined,
            duration: durSec,
            category: trackCategory
        };

        onAddTrack(newTrack);
        setTrackUrl('');
        setTrackTitle('');
        setTrackArtist('');
        setTrackDurationMinutes('4');
        onShowToast(`✓ « ${newTrack.title} » ajouté à l'émission !`);
    };

    // Calcul de la durée totale
    const sanitizeTrackDur = (t: RadioTrackItem) => {
        let d = t.duration || 3600;
        if ((t.category === 'clip' || t.category === 'promo') && d >= 3600) d = t.category === 'promo' ? 60 : 210;
        if (t.category === 'jingle' && d > 120) d = 15;
        return d;
    };
    const totalDurationSeconds = tracks.reduce((acc, t) => acc + sanitizeTrackDur(t), 0);
    const totalHours = Math.floor(totalDurationSeconds / 3600);
    const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60);

    return (
        <div className="space-y-5 p-4 md:p-6">
            {/* ── BARRE D'ACTION ET STATS ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-display font-black text-white uppercase italic tracking-wider">
                        Programmation ({tracks.length} morceau{tracks.length > 1 ? 'x' : ''})
                    </span>
                    <span className="text-[11px] font-mono text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 px-2 py-0.5 rounded-lg">
                        ⏱️ {totalHours}h{String(totalMinutes).padStart(2, '0')} au total
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleRandomize}
                        className={`px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                            randomize
                                ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                        title={randomize ? "Ordre aléatoire actif" : "Ordre chronologique fixe actif"}
                    >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>{randomize ? 'Aléatoire (Shuffle On)' : 'Ordre Fixe'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenTVLibrary}
                        className="px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                        title="Ouvrir la bibliothèque des 240 vidéos TV pour piocher des sets"
                    >
                        <Tv className="w-3.5 h-3.5 text-purple-400" />
                        <span>Piocher depuis la TV</span>
                    </button>
                </div>
            </div>

            {/* ── FORMULAIRE D'AJOUT RAPIDE ── */}
            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
                <span className="text-[10px] font-display font-black text-neon-cyan uppercase tracking-wider block">
                    + Ajouter un morceau / set à l'émission
                </span>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    {/* URL */}
                    <div className="md:col-span-4 relative">
                        <input
                            type="text"
                            value={trackUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="Lien ou ID YouTube / URL Audio..."
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-neon-cyan font-mono"
                        />
                        {isFetchingTitle && (
                            <div className="absolute right-3 top-2.5">
                                <Loader2 className="w-3.5 h-3.5 text-neon-cyan animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Titre */}
                    <div className="md:col-span-3">
                        <input
                            type="text"
                            value={trackTitle}
                            onChange={(e) => setTrackTitle(e.target.value)}
                            placeholder="Titre du morceau ou du set"
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
                        />
                    </div>

                    {/* Artiste */}
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={trackArtist}
                            onChange={(e) => setTrackArtist(e.target.value)}
                            placeholder="Artiste / DJ"
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
                        />
                    </div>

                    {/* Catégorie */}
                    <div className="md:col-span-1">
                        <select
                            value={trackCategory}
                            onChange={(e) => setTrackCategory(e.target.value as RadioTrackCategory)}
                            className="w-full px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-cyan"
                        >
                            <option value="liveset">🎧 Set</option>
                            <option value="clip">🎬 Clip</option>
                            <option value="interview">🎙️ Interv.</option>
                            <option value="jingle">🔔 Jingle</option>
                        </select>
                    </div>

                    {/* Durée */}
                    <div className="md:col-span-1">
                        <input
                            type="number"
                            min={1}
                            max={600}
                            value={trackDurationMinutes}
                            onChange={(e) => setTrackDurationMinutes(e.target.value)}
                            placeholder="Min"
                            title="Durée en minutes"
                            className="w-full px-2 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono text-center focus:outline-none focus:border-neon-cyan"
                        />
                    </div>

                    {/* Bouton Ajouter */}
                    <div className="md:col-span-1">
                        <button
                            type="button"
                            onClick={handleCreateTrack}
                            className="w-full py-2 rounded-xl bg-neon-cyan hover:bg-white text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── LISTE DES MORCEAUX ── */}
            {tracks.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <Music className="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-40" />
                    <h4 className="text-sm font-display font-black uppercase italic text-gray-300">
                        Aucun morceau dans « {emissionTitle} »
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Ajoutez votre premier set ou clip ci-dessus, ou piochez directement dans les 240 vidéos de la TV.
                    </p>
                    <button
                        type="button"
                        onClick={onOpenTVLibrary}
                        className="mt-4 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 text-xs font-display font-black uppercase italic tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all"
                    >
                        <Tv className="w-3.5 h-3.5" />
                        Ouvrir la Bibliothèque TV
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {tracks.map((track, idx) => {
                        const isPlaying = playingAudioId === track.id;
                        const meta = getRadioCategoryMeta(track.category);
                        const dur = sanitizeTrackDur(track);

                        return (
                            <div
                                key={track.id || idx}
                                className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 transition-all group"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Numéro */}
                                    <span className="w-6 text-center text-xs font-mono text-gray-500 font-bold shrink-0">
                                        #{idx + 1}
                                    </span>

                                    {/* Thumbnail ou Preview Audio */}
                                    {track.youtubeId ? (
                                        <div className="w-12 h-8 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10 relative">
                                            <img
                                                src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (track.audioUrl) {
                                                    onToggleAudioPreview(track.id, track.audioUrl);
                                                }
                                            }}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs transition-all cursor-pointer ${
                                                isPlaying
                                                    ? 'bg-neon-cyan text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                                                    : 'bg-white/5 text-gray-300 hover:bg-white/15'
                                            }`}
                                        >
                                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                        </button>
                                    )}

                                    {/* Infos titre & artiste */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-display font-black text-white uppercase italic tracking-tight truncate">
                                                {track.title}
                                            </p>
                                            <span
                                                className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border shrink-0"
                                                style={{
                                                    color: meta.color,
                                                    borderColor: `${meta.color}40`,
                                                    backgroundColor: `${meta.color}15`
                                                }}
                                            >
                                                {meta.emoji} {meta.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                            {track.artist && <span>{track.artist}</span>}
                                            <span>•</span>
                                            <span className="font-mono text-gray-400">{formatDurationExact(dur)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    {/* Monter */}
                                    <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => onMoveTrack(idx, 'up')}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                                        title="Monter dans la liste"
                                    >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Descendre */}
                                    <button
                                        type="button"
                                        disabled={idx === tracks.length - 1}
                                        onClick={() => onMoveTrack(idx, 'down')}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                                        title="Descendre dans la liste"
                                    >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Envoyer vers TV */}
                                    {onSendToTV && (
                                        <button
                                            type="button"
                                            onClick={() => onSendToTV(track)}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
                                            title="Envoyer ce morceau vers un bloc TV"
                                        >
                                            <Tv className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {/* Éditer */}
                                    <button
                                        type="button"
                                        onClick={() => onEditTrack(track, idx)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-neon-cyan hover:bg-white/5 transition-all cursor-pointer"
                                        title="Modifier ce morceau"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Supprimer */}
                                    <button
                                        type="button"
                                        onClick={() => onDeleteTrack(idx)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                        title="Supprimer de l'émission"
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
    );
}
