import { useMemo } from 'react';
import {
    Play,
    Pause,
    ChevronUp,
    ChevronDown,
    Trash2,
    Pencil,
    ExternalLink,
    FileAudio,
    Plus,
    Search,
    Clock,
    Sparkles,
    Radio,
    Sliders,
    Layers
} from 'lucide-react';
import {
    formatDurationExact,
    getRadioCategoryMeta,
    type RadioScheduleBlock,
    type RadioTrackItem,
    type RadioTopHoraireConfig,
    type RadioTrackCategory
} from '../../../utils/radioSchedule';

interface RadioRundownTimelineProps {
    block: RadioScheduleBlock;
    topHoraireConfig: RadioTopHoraireConfig;
    playingAudioId: string | null;
    onToggleAudioPreview: (id: string, url: string) => void;
    onMoveTrack: (index: number, direction: 'up' | 'down') => void;
    onDeleteTrack: (index: number) => void;
    onEditTrack: (track: RadioTrackItem, index: number) => void;
    onQuickAdd: (category: RadioTrackCategory) => void;
    onOpenYouTubeSearch: () => void;
    onOpenMediaPool: () => void;
    onOpenEditBlock: () => void;
}

export interface RundownItem {
    id: string;
    itemType: 'top_horaire' | 'generique' | 'track';
    category: string;
    categoryMeta: ReturnType<typeof getRadioCategoryMeta>;
    title: string;
    artist?: string;
    durationSeconds: number;
    formattedDuration: string;
    startTimeFormatted: string;
    endTimeFormatted: string;
    audioUrl?: string;
    youtubeId?: string;
    trackIndex?: number;
    originalTrack?: RadioTrackItem;
}

function formatSecToClock(secondsFromMidnight: number): string {
    const norm = ((secondsFromMidnight % 86400) + 86400) % 86400;
    const h = Math.floor(norm / 3600);
    const m = Math.floor((norm % 3600) / 60);
    const s = Math.floor(norm % 60);
    return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RadioRundownTimeline({
    block,
    topHoraireConfig,
    playingAudioId,
    onToggleAudioPreview,
    onMoveTrack,
    onDeleteTrack,
    onEditTrack,
    onQuickAdd,
    onOpenYouTubeSearch,
    onOpenMediaPool,
    onOpenEditBlock
}: RadioRundownTimelineProps) {
    const startHour = block.startHour ?? 0;
    const endHour = block.endHour === 0 ? 24 : (block.endHour ?? 24);
    let blockDurationHours = endHour - startHour;
    if (blockDurationHours <= 0) blockDurationHours += 24;
    const blockDurationSec = blockDurationHours * 3600;

    // Calcul de la chronologie complète du conducteur (Rundown)
    const rundownItems = useMemo<RundownItem[]>(() => {
        const items: RundownItem[] = [];
        let cursor = startHour * 3600;

        // 1. TOP HORAIRE (Début d'heure obligatoire)
        if (topHoraireConfig.enabled && topHoraireConfig.duration > 0) {
            const dur = topHoraireConfig.duration;
            const startStr = formatSecToClock(cursor);
            const endStr = formatSecToClock(cursor + dur);
            items.push({
                id: `top_${block.id}`,
                itemType: 'top_horaire',
                category: 'top_horaire',
                categoryMeta: getRadioCategoryMeta('top_horaire', false, true),
                title: topHoraireConfig.title || 'Dropsiders Radio • Top Horaire Officiel',
                artist: 'DROPSIDERS RADIO',
                durationSeconds: dur,
                formattedDuration: formatDurationExact(dur),
                startTimeFormatted: startStr,
                endTimeFormatted: endStr,
                audioUrl: topHoraireConfig.audioUrl,
                youtubeId: topHoraireConfig.youtubeId
            });
            cursor += dur;
        }

        // 2. GÉNÉRIQUE D'ÉMISSION (Jingle d'ouverture si configuré)
        if (block.themeJingle?.enabled && block.themeJingle.duration > 0) {
            const dur = block.themeJingle.duration;
            const startStr = formatSecToClock(cursor);
            const endStr = formatSecToClock(cursor + dur);
            items.push({
                id: `theme_${block.id}`,
                itemType: 'generique',
                category: 'generique',
                categoryMeta: getRadioCategoryMeta('generique', true, false),
                title: block.themeJingle.title || `Générique • ${block.title}`,
                artist: 'DROPSIDERS RADIO',
                durationSeconds: dur,
                formattedDuration: formatDurationExact(dur),
                startTimeFormatted: startStr,
                endTimeFormatted: endStr,
                audioUrl: block.themeJingle.audioUrl,
                youtubeId: block.themeJingle.youtubeId
            });
            cursor += dur;
        }

        // 3. PISTES DE L'ÉMISSION (Sets, Interviews, Jingles, Pubs, Clips)
        (block.tracks || []).forEach((t, idx) => {
            const dur = t.duration && t.duration > 0 ? t.duration : 3600;
            const startStr = formatSecToClock(cursor);
            const endStr = formatSecToClock(cursor + dur);
            const meta = getRadioCategoryMeta(t.category);

            items.push({
                id: t.id || `track_${idx}`,
                itemType: 'track',
                category: t.category || 'set',
                categoryMeta: meta,
                title: t.title,
                artist: t.artist || 'Artiste',
                durationSeconds: dur,
                formattedDuration: formatDurationExact(dur),
                startTimeFormatted: startStr,
                endTimeFormatted: endStr,
                audioUrl: t.audioUrl,
                youtubeId: t.youtubeId,
                trackIndex: idx,
                originalTrack: t
            });
            cursor += dur;
        });

        return items;
    }, [block, topHoraireConfig, startHour]);

    // Durée totale programmée dans le conducteur
    const totalProgrammedSec = rundownItems.reduce((acc, i) => acc + i.durationSeconds, 0);
    const fillPercent = Math.min(100, Math.round((totalProgrammedSec / blockDurationSec) * 100));
    const isOverFilled = totalProgrammedSec > blockDurationSec;

    // Décompte par type pour le résumé rapide
    const countByType = useMemo(() => {
        return {
            sets: rundownItems.filter(i => ['set', 'liveset'].includes(i.category) && i.itemType === 'track').length,
            jingles: rundownItems.filter(i => i.category === 'jingle').length,
            interviews: rundownItems.filter(i => i.category === 'interview').length,
            pubs: rundownItems.filter(i => ['pub', 'promo'].includes(i.category)).length,
        };
    }, [rundownItems]);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* ── BANDEAU HAUT DE L'ÉMISSION ── */}
            <div
                className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white/[0.02]"
                style={{ borderLeftColor: block.color, borderLeftWidth: 5 }}
            >
                <div className="flex items-center gap-3.5">
                    <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{block.emoji}</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-display font-black text-white uppercase italic tracking-tight leading-tight">
                                {block.title}
                            </h3>
                            <button
                                type="button"
                                onClick={onOpenEditBlock}
                                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                title="Modifier les paramètres de l'émission"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                🕒 {block.timeSlot || `${String(startHour).padStart(2, '0')}h00 - ${String(endHour).padStart(2, '0')}h00`}
                            </span>
                            <span className="text-white/20">·</span>
                            <span className="text-[10px] font-mono text-gray-400">
                                Créneau : <strong className="text-white">{blockDurationHours}h00</strong> ({formatDurationExact(blockDurationSec)})
                            </span>
                            <span className="text-white/20">·</span>
                            <span className="text-[10px] font-mono text-gray-400">
                                Programmé : <strong className={isOverFilled ? 'text-amber-400' : 'text-neon-cyan'}>{formatDurationExact(totalProgrammedSec)}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Badges de comptage par type */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-display font-black uppercase italic px-2 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                        🎧 {countByType.sets} Set{countByType.sets !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[9px] font-display font-black uppercase italic px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                        🔔 {countByType.jingles} Jingle{countByType.jingles !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[9px] font-display font-black uppercase italic px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                        🎙️ {countByType.interviews} Interview{countByType.interviews !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[9px] font-display font-black uppercase italic px-2 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 flex items-center gap-1">
                        📢 {countByType.pubs} Pub{countByType.pubs !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* ── BARRE HORLOGE VISUELLE 60 MINUTES (CHRONO-TIMELINE) ── */}
            <div className="px-6 py-3 border-b border-white/10 bg-black/40 shrink-0">
                <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 font-bold text-gray-300">
                        <Clock className="w-3 h-3 text-neon-cyan" />
                        Timeline d'antenne · Remplissage {fillPercent}%
                    </span>
                    <span>
                        {formatDurationExact(totalProgrammedSec)} / {formatDurationExact(blockDurationSec)}
                        {isOverFilled && <span className="text-amber-400 ml-1.5">(bouclera automatiquement)</span>}
                    </span>
                </div>

                {/* Barre proportionnelle segmentée */}
                <div className="w-full h-4 rounded-xl bg-white/5 border border-white/10 p-0.5 flex overflow-hidden gap-[1px]">
                    {rundownItems.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-gray-500">
                            Aucun élément programmé
                        </div>
                    ) : (
                        rundownItems.map((item, idx) => {
                            const widthPercent = Math.max(1, (item.durationSeconds / Math.max(totalProgrammedSec, blockDurationSec)) * 100);
                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        width: `${widthPercent}%`,
                                        backgroundColor: item.categoryMeta.color
                                    }}
                                    className="h-full rounded-sm opacity-85 hover:opacity-100 hover:scale-y-110 transition-all cursor-pointer relative group"
                                    title={`${item.categoryMeta.emoji} [${item.categoryMeta.label}] ${item.title} (${item.formattedDuration}) à ${item.startTimeFormatted}`}
                                >
                                    {/* Tooltip au survol */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                                        <div className="bg-[#0b0d14] text-white text-[9px] font-mono px-2 py-1 rounded-md border border-white/20 shadow-xl">
                                            <span className="font-bold">{item.categoryMeta.emoji} {item.startTimeFormatted}</span> : {item.title.slice(0, 30)} ({item.formattedDuration})
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── BARRE D'AJOUT RAPIDE DIRECT DANS LE CONDUCTEUR ── */}
            <div className="px-6 py-2.5 border-b border-white/10 bg-white/[0.015] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <span className="text-[10px] font-display font-black uppercase italic tracking-wider text-gray-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-neon-cyan" />
                    Insérer dans le conducteur :
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* + Set / Musique */}
                    <button
                        type="button"
                        onClick={() => onQuickAdd('set')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Ajouter un DJ set ou morceau"
                    >
                        <span>🎧 + Set / Mix</span>
                    </button>

                    {/* + Jingle */}
                    <button
                        type="button"
                        onClick={() => onQuickAdd('jingle')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Insérer un jingle ou drop vocal"
                    >
                        <span>🔔 + Jingle</span>
                    </button>

                    {/* + Interview */}
                    <button
                        type="button"
                        onClick={() => onQuickAdd('interview')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Insérer une interview ou chronique"
                    >
                        <span>🎙️ + Interview</span>
                    </button>

                    {/* + Pub */}
                    <button
                        type="button"
                        onClick={() => onQuickAdd('pub')}
                        className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Insérer un spot publicitaire ou promo"
                    >
                        <span>📢 + Pub</span>
                    </button>

                    <div className="h-4 w-px bg-white/10 hidden sm:block" />

                    {/* Recherche YouTube */}
                    <button
                        type="button"
                        onClick={onOpenYouTubeSearch}
                        className="px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Search className="w-3 h-3 text-red-400" />
                        <span>Recherche YouTube</span>
                    </button>

                    {/* Ouvrir la Médiathèque */}
                    <button
                        type="button"
                        onClick={onOpenMediaPool}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span>Médiathèque</span>
                    </button>
                </div>
            </div>

            {/* ── TABLEAU DU CONDUCTEUR D'ANTENNE (CHRONOLOGIQUE) ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider pb-1 px-3 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <span className="w-16">Horaire</span>
                        <span className="w-28">Type</span>
                        <span>Élément / Titre</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <span>Durée</span>
                        <span className="w-24 text-right">Actions</span>
                    </div>
                </div>

                {rundownItems.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white/[0.01] border border-white/5 text-center flex flex-col items-center justify-center">
                        <Radio className="w-12 h-12 text-gray-600 mb-3" />
                        <p className="text-white font-display font-black text-sm uppercase italic">Conducteur vide pour cette émission</p>
                        <p className="text-gray-400 text-xs mt-1 max-w-sm font-sans">
                            Utilisez les boutons ci-dessus pour insérer des sets, jingles, interviews ou spots publicitaires.
                        </p>
                    </div>
                ) : (
                    rundownItems.map((item) => {
                        const isSystemItem = item.itemType === 'top_horaire' || item.itemType === 'generique';
                        const isTrack = item.itemType === 'track';
                        const trackIdx = item.trackIndex ?? 0;
                        const isPlaying = playingAudioId === `rd_${item.id}`;

                        return (
                            <div
                                key={item.id}
                                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                                    isSystemItem
                                        ? 'bg-white/[0.02] border-white/10 hover:border-white/20'
                                        : 'bg-[#0d0e16]/80 hover:bg-[#131522] border-white/5 hover:border-neon-cyan/30 shadow-sm'
                                }`}
                                style={{ borderLeftColor: item.categoryMeta.color, borderLeftWidth: 4 }}
                            >
                                {/* Gauche : Horaire + Badge Type + Titre */}
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    {/* Horodatage de diffusion */}
                                    <div className="w-16 shrink-0 font-mono text-xs font-bold text-gray-300">
                                        {item.startTimeFormatted}
                                    </div>

                                    {/* Badge Catégorie */}
                                    <div className="w-28 shrink-0">
                                        <span className={`inline-flex items-center gap-1 text-[8px] font-display font-black uppercase italic px-2 py-0.5 rounded-md border ${item.categoryMeta.bg} ${item.categoryMeta.text} ${item.categoryMeta.border}`}>
                                            <span>{item.categoryMeta.emoji}</span>
                                            <span>{item.categoryMeta.label}</span>
                                        </span>
                                    </div>

                                    {/* Miniature ou Icône */}
                                    <div className="relative shrink-0 hidden sm:block">
                                        {item.audioUrl ? (
                                            <div className="w-12 h-8 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
                                                <FileAudio className="w-4 h-4" />
                                            </div>
                                        ) : item.youtubeId ? (
                                            <img
                                                src={`https://img.youtube.com/vi/${item.youtubeId}/default.jpg`}
                                                alt=""
                                                className="w-12 h-8 rounded-lg object-cover bg-black border border-white/10"
                                            />
                                        ) : (
                                            <div className="w-12 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                                                <span>{item.categoryMeta.emoji}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Titre & Artiste */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-display font-black text-white uppercase italic truncate">
                                                {item.artist && item.artist !== 'Artiste' ? `${item.artist} · ` : ''}{item.title}
                                            </h4>
                                        </div>
                                        <p className="text-[9px] font-mono text-gray-500 truncate">
                                            Fin à {item.endTimeFormatted} {item.audioUrl ? '· Fichier audio' : item.youtubeId ? '· YouTube' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Droite : Durée + Boutons d'action */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Durée formatée */}
                                    <span className="text-[10px] font-mono font-bold text-gray-300 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                        {item.formattedDuration}
                                    </span>

                                    {/* Écoute preview */}
                                    {item.audioUrl ? (
                                        <button
                                            type="button"
                                            onClick={() => onToggleAudioPreview(`rd_${item.id}`, item.audioUrl!)}
                                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                                isPlaying
                                                    ? 'bg-neon-cyan text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                                                    : 'bg-white/5 hover:bg-neon-cyan/20 text-gray-400 hover:text-neon-cyan'
                                            }`}
                                            title={isPlaying ? 'Pause' : 'Écouter'}
                                        >
                                            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                        </button>
                                    ) : item.youtubeId ? (
                                        <a
                                            href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-colors"
                                            title="Ouvrir sur YouTube"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    ) : null}

                                    {/* Réordonner et supprimer pour les pistes manuelles */}
                                    {isTrack && item.originalTrack && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onMoveTrack(trackIdx, 'up')}
                                                disabled={trackIdx === 0}
                                                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                                title="Monter dans le conducteur"
                                            >
                                                <ChevronUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onMoveTrack(trackIdx, 'down')}
                                                disabled={trackIdx === (block.tracks?.length || 0) - 1}
                                                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                                                title="Descendre dans le conducteur"
                                            >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onEditTrack(item.originalTrack!, trackIdx)}
                                                className="p-1 rounded-lg text-gray-500 hover:text-neon-cyan hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                title="Modifier la piste"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteTrack(trackIdx)}
                                                className="p-1 rounded-lg text-gray-500 hover:text-neon-red hover:bg-neon-red/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                title="Supprimer du conducteur"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Action système (modifier émission ou top horaire) */}
                                    {isSystemItem && (
                                        <span className="text-[8.5px] font-mono text-gray-500 italic pr-2">
                                            Automatique
                                        </span>
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
