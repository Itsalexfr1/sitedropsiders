import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio, Play, Pause, Volume2, VolumeX, Clock, Sparkles,
    MessageSquare, Send, Calendar, History,
    User, MapPin, Disc3, Music2, Zap, Check, Search, X, Heart
} from 'lucide-react';
import {
    DEFAULT_RADIO_BLOCKS,
    STORAGE_RADIO_BLOCKS_KEY,
    getParisSeconds,
    formatDurationExact,
    getCurrentLiveRadioTrack,
    computeRadioDaySchedule,
    computeRadioHistory,
    type RadioScheduleBlock,
    type ComputedRadioScheduleItem,
    type RadioHistoryEntry
} from '../utils/radioSchedule';

const RADIO_HISTORY_KEY = 'dropsiders_radio_history';
const RADIO_MESSAGES_ENABLED_KEY = 'dropsiders_radio_messages_enabled';

function formatParisTime(date: Date = new Date()) {
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris'
    });
}

function formatParisDate(date: Date = new Date()) {
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'Europe/Paris'
    });
}

function useRadioState() {
    const [radioState, setRadioState] = useState<{
        isPlaying: boolean;
        isMuted: boolean;
        currentSet: ComputedRadioScheduleItem | null;
        uiOffset: number;
        isEnabled: boolean;
        listenersCount: number;
        volume: number;
    }>({
        isPlaying: false, isMuted: false, currentSet: null,
        uiOffset: 0, isEnabled: true, listenersCount: 0, volume: 80
    });

    useEffect(() => {
        const onState = (e: any) => {
            if (e?.detail) setRadioState(prev => ({ ...prev, ...e.detail }));
        };
        window.addEventListener('dropsiders_radio_state', onState);
        window.dispatchEvent(new CustomEvent('dropsiders_radio_query_state'));
        return () => window.removeEventListener('dropsiders_radio_state', onState);
    }, []);

    return radioState;
}

function AudioBars({ playing }: { playing: boolean }) {
    return (
        <div className="flex items-end gap-[2.5px] h-5 shrink-0">
            {[
                { anim: 'eq-bar-1', dur: '0.55s' },
                { anim: 'eq-bar-2', dur: '0.38s' },
                { anim: 'eq-bar-3', dur: '0.62s' },
                { anim: 'eq-bar-4', dur: '0.44s' },
            ].map((b, i) => (
                <span key={i} style={{
                    display: 'block', width: '3px',
                    height: playing ? '60%' : '20%',
                    borderRadius: '2px',
                    backgroundColor: playing ? 'rgb(0,255,255)' : 'rgba(255,255,255,0.2)',
                    animation: playing ? `${b.anim} ${b.dur} ease-in-out infinite alternate` : 'none',
                    transition: 'background-color 0.3s',
                }} />
            ))}
        </div>
    );
}

function TrackCard({
    item,
    isLive,
    offsetSec,
    isVoted,
    onVote,
    voteLoading
}: {
    item: ComputedRadioScheduleItem;
    isLive?: boolean;
    offsetSec?: number;
    isVoted?: boolean;
    onVote?: () => void;
    voteLoading?: boolean;
}) {
    const progress = offsetSec && item.durationSeconds
        ? Math.min(100, (offsetSec / item.durationSeconds) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-2xl border p-4 transition-all ${isLive
                ? 'bg-gradient-to-br from-cyan-950/60 via-[#0b0d18] to-[#07070f] border-cyan-500/50 shadow-[0_0_25px_rgba(0,255,255,0.12)]'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
            }`}
        >
            {isLive && (
                <>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-[8px] font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        EN DIRECT
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                </>
            )}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isLive
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                        : 'bg-white/5 border border-white/10 text-gray-400'
                    }`}>
                        {isLive
                            ? <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                            : <Music2 className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1 pr-4">
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isLive ? 'text-cyan-400' : 'text-gray-500'}`}>
                            {isLive ? '🎵 À L\'ANTENNE' : item.startTime}
                        </p>
                        <h4 className="text-base font-black text-white uppercase italic tracking-tight truncate leading-tight">{item.title || (item as any).event}</h4>
                        <p className="text-[12px] text-gray-300 font-bold uppercase tracking-wider truncate mt-0.5">{item.artist}</p>
                        {(item.blockTitle || item.blockHost) && (
                            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5 mt-1 truncate">
                                <span>📻 {item.blockTitle || 'DROPSIDERS RADIO'}</span>
                                {item.blockHost && (
                                    <span className="text-gray-400 font-normal">· avec <span className="text-white font-bold">{item.blockHost}</span></span>
                                )}
                            </p>
                        )}
                        {isLive && offsetSec !== undefined && (
                            <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-gray-500">
                                <Clock className="w-2.5 h-2.5 text-cyan-500" />
                                <span className="text-cyan-400 font-bold">{formatDurationExact(offsetSec)}</span>
                                <span>/</span>
                                <span>{item.durationFormatted}</span>
                            </div>
                        )}
                    </div>
                </div>

                {onVote && item.category !== 'jingle' && item.category !== 'promo' && item.category !== 'pub' && (
                    <button
                        type="button"
                        onClick={onVote}
                        disabled={voteLoading}
                        className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[10px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer active:scale-95 ${
                            isVoted
                                ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(255,0,85,0.3)]'
                                : 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border-white/10 hover:border-red-500/30'
                        }`}
                        title={isVoted ? 'Déjà voté pour le Top 5' : 'Voter pour ce morceau dans le Top 5'}
                    >
                        <Heart className={`w-3.5 h-3.5 ${isVoted ? 'fill-current text-red-400' : ''}`} />
                        <span className="hidden sm:inline">{isVoted ? 'Voté Top 5' : 'Voter Top 5'}</span>
                    </button>
                )}
            </div>
        </motion.div>
    );
}

interface HistorySectionProps {
    radioBlocks: RadioScheduleBlock[];
    parisSec: number;
    onVote?: (title: string, media?: string) => void;
    votedTracks?: string[];
    voteLoading?: boolean;
}

function HistorySection({
    radioBlocks,
    parisSec,
    onVote,
    votedTracks = [],
    voteLoading = false
}: HistorySectionProps) {
    const [searchDay, setSearchDay] = useState('');
    const [searchTime, setSearchTime] = useState('');
    const [searchResult, setSearchResult] = useState<RadioHistoryEntry | null | 'none'>(null);
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
    const [visibleDaysCount, setVisibleDaysCount] = useState(7);

    // 1. Calcul dynamique de l'historique complet et fidèle sur 30 jours (1 mois)
    const computedHistory = useMemo(() => {
        try {
            return computeRadioHistory(radioBlocks, 30, parisSec);
        } catch {
            return [];
        }
    }, [radioBlocks, parisSec]);

    // 2. Nettoyage et récupération d'éventuels titres enregistrés en direct localement (exclut les promos/jingles)
    const [localHistory, setLocalHistory] = useState<RadioHistoryEntry[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(RADIO_HISTORY_KEY);
            if (raw) {
                const parsed: any[] = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // Nettoyer définitivement les jingles / promos résiduelles
                    const cleaned: RadioHistoryEntry[] = parsed.filter(e =>
                        e && e.title &&
                        e.artist !== 'DROPSIDERS RADIO' &&
                        !e.title.toLowerCase().includes('promo') &&
                        !e.title.toLowerCase().includes('jingle')
                    );
                    if (cleaned.length !== parsed.length) {
                        localStorage.setItem(RADIO_HISTORY_KEY, JSON.stringify(cleaned));
                    }
                    setLocalHistory(cleaned);
                }
            }
        } catch {}
    }, []);

    // 3. Fusion consolidée de l'historique
    const history = useMemo(() => {
        const map = new Map<string, RadioHistoryEntry>();

        // Ajouter l'historique officiel calculé
        computedHistory.forEach(item => {
            const key = `${item.day}_${item.startTime}_${item.title}`.toLowerCase();
            map.set(key, item);
        });

        // Compléter avec les entrées locales non dupliquées
        localHistory.forEach(item => {
            const key = `${item.day}_${item.startTime}_${item.title}`.toLowerCase();
            if (!map.has(key)) {
                map.set(key, item);
            }
        });

        return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
    }, [computedHistory, localHistory]);

    // Liste des jours disponibles (ordre chronologique décroissant)
    const availableDays = useMemo(() => {
        const seen = new Set<string>();
        return [...history]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(e => e.day)
            .filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });
    }, [history]);

    // Grouper par jour
    const grouped = useMemo(() => {
        const map = new Map<string, RadioHistoryEntry[]>();
        [...history].sort((a, b) => b.timestamp - a.timestamp).forEach(e => {
            if (!map.has(e.day)) map.set(e.day, []);
            map.get(e.day)!.push(e);
        });
        return map;
    }, [history]);

    // Convertir "HH:MM" ou "HHhMM" en minutes depuis minuit
    const timeToMinutes = (t: string) => {
        if (!t) return -1;
        const clean = t.replace('h', ':');
        const [h, m] = clean.split(':').map(Number);
        return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };

    // Recherche : trouver le titre qui était diffusé à l'heure demandée
    const handleSearch = () => {
        if (!searchDay || !searchTime) return;
        const dayEntries = history.filter(e => e.day.toLowerCase() === searchDay.toLowerCase());
        const targetMin = timeToMinutes(searchTime);

        // Chercher une entrée dont startTime <= searchTime <= endTime
        const match = dayEntries.find(e => {
            const start = timeToMinutes(e.startTime);
            const end = timeToMinutes(e.endTime);
            if (end < start) {
                return targetMin >= start || targetMin <= end;
            }
            return targetMin >= start && targetMin <= end;
        });

        // Si pas de match exact, chercher le titre le plus proche (avant)
        if (!match) {
            const closest = dayEntries
                .filter(e => timeToMinutes(e.startTime) <= targetMin)
                .sort((a, b) => timeToMinutes(b.startTime) - timeToMinutes(a.startTime))[0];
            setSearchResult(closest || 'none');
        } else {
            setSearchResult(match);
        }
    };

    const handleClearSearch = () => {
        setSearchDay('');
        setSearchTime('');
        setSearchResult(null);
    };

    const toggleExpandDay = (day: string) => {
        setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
    };

    const isSearchActive = searchResult !== null;

    if (history.length === 0) {
        return (
            <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <History className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Chargement de l'historique...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Barre de recherche par jour + heure ── */}
            <div className="rounded-2xl bg-gradient-to-br from-[#0d0d20] to-[#07070f] border border-purple-500/30 p-4 shadow-[0_0_20px_rgba(168,85,247,0.07)]">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                        <Search className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">C'était quoi ce titre ?</p>
                        <p className="text-[9px] font-mono text-gray-500">Sélectionne un jour et une heure pour retrouver le son diffusé</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Sélecteur de jour */}
                    <div className="flex-1">
                        <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1">Jour</label>
                        <select
                            value={searchDay}
                            onChange={e => { setSearchDay(e.target.value); setSearchResult(null); }}
                            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">-- Choisir un jour --</option>
                            {availableDays.map(day => (
                                <option key={day} value={day} className="capitalize">{day}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sélecteur d'heure */}
                    <div className="sm:w-36">
                        <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1">Heure</label>
                        <input
                            type="time"
                            value={searchTime}
                            onChange={e => { setSearchTime(e.target.value); setSearchResult(null); }}
                            className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/60 transition-colors cursor-pointer [color-scheme:dark]"
                        />
                    </div>

                    {/* Bouton recherche */}
                    <div className="sm:self-end flex gap-2">
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={!searchDay || !searchTime}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase italic tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] active:scale-95"
                        >
                            <Search className="w-3.5 h-3.5" />
                            Chercher
                        </button>
                        {isSearchActive && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                title="Effacer la recherche"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Résultat de la recherche */}
                <AnimatePresence>
                    {isSearchActive && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="overflow-hidden"
                        >
                            {searchResult === 'none' ? (
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                                    <p className="text-gray-500 text-[11px] font-mono">
                                        Aucun titre trouvé pour <span className="text-white font-bold capitalize">{searchDay}</span> à <span className="text-white font-bold">{searchTime}</span>
                                    </p>
                                    <p className="text-gray-600 text-[9px] mt-1">Vérifie l'heure sélectionnée.</p>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative p-4 rounded-xl bg-gradient-to-r from-purple-950/60 via-[#0b0d18] to-[#07070f] border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                >
                                    {/* Badge résultat */}
                                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/50 text-purple-300 text-[8px] font-black uppercase tracking-widest">
                                        Résultat trouvé
                                    </div>

                                    <p className="text-[9px] font-mono text-purple-400 mb-2 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        <span className="capitalize">{searchResult.day}</span>
                                        <span>·</span>
                                        <span className="font-bold text-purple-300">{searchResult.startTime}</span>
                                        <span>→</span>
                                        <span>{searchResult.endTime}</span>
                                        {searchResult.blockTitle && (
                                            <span className="ml-2 text-cyan-400 font-sans font-bold">📻 {searchResult.blockTitle}</span>
                                        )}
                                    </p>

                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                                                <Music2 className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-black text-white uppercase italic tracking-tight truncate">{searchResult.artist}</p>
                                                <p className="text-[11px] text-gray-300 truncate">{searchResult.title}</p>
                                            </div>
                                        </div>

                                        {onVote && (
                                            <button
                                                type="button"
                                                onClick={() => onVote(`${searchResult.artist} - ${searchResult.title}`, searchResult.youtubeId || searchResult.audioUrl)}
                                                disabled={voteLoading}
                                                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[10px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer ${
                                                    votedTracks.includes(`${searchResult.artist} - ${searchResult.title}`)
                                                        ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(255,0,85,0.3)]'
                                                        : 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border-white/10'
                                                }`}
                                                title={votedTracks.includes(`${searchResult.artist} - ${searchResult.title}`) ? 'Déjà voté pour le Top 5' : 'Voter pour ce morceau dans le Top 5'}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${votedTracks.includes(`${searchResult.artist} - ${searchResult.title}`) ? 'fill-current text-red-400' : ''}`} />
                                                <span className="hidden sm:inline">{votedTracks.includes(`${searchResult.artist} - ${searchResult.title}`) ? 'Voté Top 5' : 'Voter Top 5'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Note si pas exact */}
                                    {history.find(e =>
                                        e.id === searchResult.id &&
                                        !(timeToMinutes(e.startTime) <= timeToMinutes(searchTime) && timeToMinutes(e.endTime) >= timeToMinutes(searchTime))
                                    ) && (
                                        <p className="text-[8px] font-mono text-gray-500 mt-2">
                                            ℹ Morceau diffusé le plus proche de <strong>{searchTime}</strong>
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Historique complet par journée ── */}
            {Array.from(grouped.entries()).slice(0, visibleDaysCount).map(([day, entries]) => {
                const isExpanded = !!expandedDays[day];
                const displayedEntries = isExpanded ? entries : entries.slice(0, 30);

                return (
                    <div key={day} className="space-y-3">
                        <div className="flex items-center gap-2 pt-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-purple-300 capitalize">{day}</span>
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[9px] font-mono text-gray-500 uppercase">{entries.length} titres</span>
                        </div>

                        <div className="space-y-2">
                            {displayedEntries.map((entry, i) => {
                                const isHighlighted = !!(searchResult && searchResult !== 'none' && searchResult.id === entry.id);
                                const trackKey = `${entry.artist} - ${entry.title}`;
                                const isVoted = votedTracks.includes(trackKey);

                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: Math.min(0.2, i * 0.015) }}
                                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all group ${
                                            isHighlighted
                                                ? 'bg-gradient-to-r from-purple-950/60 to-[#07070f] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="shrink-0 text-center w-12">
                                                <p className={`text-[10px] font-mono font-bold ${isHighlighted ? 'text-purple-300' : 'text-cyan-400'}`}>{entry.startTime}</p>
                                                <p className="text-[8px] font-mono text-gray-600">{entry.endTime}</p>
                                            </div>
                                            <div className="w-px h-8 bg-white/10 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-[11px] font-black uppercase italic tracking-tight truncate ${isHighlighted ? 'text-white' : 'text-gray-200'}`}>{entry.artist}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{entry.title}</p>
                                                {entry.blockTitle && (
                                                    <p className="text-[8px] font-bold text-cyan-400/80 uppercase tracking-wider truncate mt-0.5">
                                                        📻 {entry.blockTitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {onVote && (
                                                <button
                                                    type="button"
                                                    onClick={() => onVote(trackKey, entry.youtubeId || entry.audioUrl)}
                                                    disabled={voteLoading}
                                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                                        isVoted
                                                            ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                                            : 'bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 border-white/10'
                                                    }`}
                                                    title={isVoted ? 'Déjà voté' : 'Voter pour ce titre dans le Top 5'}
                                                >
                                                    <Heart className={`w-3.5 h-3.5 ${isVoted ? 'fill-current text-red-400' : ''}`} />
                                                </button>
                                            )}
                                            {isHighlighted ? (
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping mr-1" />
                                            ) : (
                                                <Music2 className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors mr-1" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {entries.length > 30 && (
                                <button
                                    type="button"
                                    onClick={() => toggleExpandDay(day)}
                                    className="w-full py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-purple-300 hover:text-white transition-all cursor-pointer text-center"
                                >
                                    {isExpanded
                                        ? '▲ Réduire la liste'
                                        : `▼ Afficher tous les ${entries.length} titres de la journée (+${entries.length - 30})`}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Bouton pour charger d'autres jours de l'historique mensuel */}
            {Array.from(grouped.entries()).length > visibleDaysCount && (
                <div className="pt-3 pb-2 text-center">
                    <button
                        type="button"
                        onClick={() => setVisibleDaysCount(prev => Math.min(prev + 7, Array.from(grouped.entries()).length))}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-cyan-900/40 hover:from-purple-800/60 hover:to-cyan-800/60 border border-purple-500/40 hover:border-purple-400 text-white text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-95 flex items-center justify-center gap-2.5 mx-auto"
                    >
                        <Calendar className="w-4 h-4 text-purple-400" />
                        Charger les jours précédents (+7 jours jusqu'à 1 mois)
                    </button>
                </div>
            )}
        </div>
    );
}

function MessageForm({ currentTrackTitle }: { currentTrackTitle?: string }) {
    const [author, setAuthor] = useState('');
    const [location, setLocation] = useState('');
    const [message, setMessage] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!author.trim() || !message.trim()) return;
        setIsSending(true);

        const newDedication = {
            id: 'ded-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            author: author.trim(),
            location: location.trim() || undefined,
            message: message.trim(),
            timestamp: Date.now(),
            status: 'new'
        };

        try {
            const raw = localStorage.getItem('dropsiders_radio_dedications');
            const existing = raw ? JSON.parse(raw) : [];
            localStorage.setItem('dropsiders_radio_dedications', JSON.stringify([newDedication, ...existing]));
        } catch {}

        try {
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('dropsiders_radio_dedications');
                bc.postMessage({ type: 'new_dedication', dedication: newDedication });
                bc.close();
            }
        } catch {}

        window.dispatchEvent(new CustomEvent('dropsiders_radio_new_dedication', { detail: newDedication }));

        try {
            await fetch('/api/radio/dedications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newDedication, currentTrack: currentTrackTitle })
            }).catch(() => {});
        } catch {}

        setIsSending(false);
        setIsSent(true);
        setTimeout(() => {
            setIsSent(false);
            setAuthor(''); setMessage(''); setLocation('');
        }, 3000);
    };

    if (isSent) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                    <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-lg font-display font-black text-white uppercase italic">Message Envoyé !</h4>
                    <p className="text-xs font-mono text-emerald-300 mt-1">Transmis en direct à la régie de l'animateur</p>
                </div>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {currentTrackTitle && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-mono text-gray-300 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">À l'antenne : <strong className="text-white">{currentTrackTitle}</strong></span>
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Prénom / Pseudo *</label>
                    <div className="relative">
                        <User className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                        <input type="text" required value={author} onChange={e => setAuthor(e.target.value)}
                            placeholder="Ex: Thomas" maxLength={30}
                            className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 transition-colors" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Ville (optionnel)</label>
                    <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                            placeholder="Ex: Lyon, Paris..." maxLength={30}
                            className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 transition-colors" />
                    </div>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Votre Message / Dédicace *</label>
                    <span className="text-[9px] font-mono text-gray-500">{message.length}/180</span>
                </div>
                <textarea required value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Un shoutout pour vos amis, une réaction sur le set, ou un mot pour l'animateur..."
                    maxLength={180} rows={3}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 resize-none transition-colors" />
            </div>
            <button type="submit" disabled={!author.trim() || !message.trim() || isSending}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-black font-display font-black text-sm uppercase italic tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,255,255,0.25)] hover:shadow-[0_4px_30px_rgba(0,255,255,0.4)] active:scale-[0.98] disabled:cursor-not-allowed">
                <Send className="w-4 h-4 fill-current" />
                <span>{isSending ? 'Envoi...' : 'Envoyer en direct à l\'animateur'}</span>
            </button>
        </form>
    );
}

export function RadioPage() {
    const radioState = useRadioState();

    const [radioBlocks, setRadioBlocks] = useState<RadioScheduleBlock[]>(() => {
        try {
            const s = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
            if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
        } catch {}
        return DEFAULT_RADIO_BLOCKS;
    });

    useEffect(() => {
        const h = () => {
            try {
                const s = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
                if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) setRadioBlocks(p); }
            } catch {}
        };
        window.addEventListener('dropsiders_radio_blocks_updated', h);
        window.addEventListener('storage', h);
        return () => { window.removeEventListener('dropsiders_radio_blocks_updated', h); window.removeEventListener('storage', h); };
    }, []);

    const [parisSec, setParisSec] = useState(getParisSeconds);
    const [parisDate, setParisDate] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => { setParisSec(getParisSeconds()); setParisDate(new Date()); }, 1000);
        return () => clearInterval(id);
    }, []);

    const [messagesEnabled, setMessagesEnabled] = useState(() => {
        try {
            const local = localStorage.getItem(RADIO_MESSAGES_ENABLED_KEY);
            if (local !== null) return local === 'true';
            return false;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const onStorage = () => {
            try {
                const local = localStorage.getItem(RADIO_MESSAGES_ENABLED_KEY);
                if (local !== null) setMessagesEnabled(local === 'true');
            } catch {}
        };
        window.addEventListener('storage', onStorage);
        window.addEventListener('dropsiders_radio_messages_toggle', onStorage);
        fetch('/api/settings').then(r => r.ok ? r.json() : null).then(data => {
            if (data && typeof data.radio_messages_enabled === 'boolean') {
                setMessagesEnabled(data.radio_messages_enabled);
                try {
                    localStorage.setItem(RADIO_MESSAGES_ENABLED_KEY, data.radio_messages_enabled ? 'true' : 'false');
                } catch {}
            }
        }).catch(() => {});
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('dropsiders_radio_messages_toggle', onStorage);
        };
    }, []);

    const [activeTab, setActiveTab] = useState<'now' | 'history' | 'message'>('now');

    const schedule = useMemo(() => {
        try { return computeRadioDaySchedule(radioBlocks, parisSec); } catch { return []; }
    }, [radioBlocks, parisSec]);

    const liveInfo = useMemo(() => {
        try { return getCurrentLiveRadioTrack(radioBlocks, parisSec); } catch { return null; }
    }, [radioBlocks, parisSec]);

    const currentSet = radioState.currentSet || liveInfo?.item || null;
    const currentTrackTitle = currentSet ? `${currentSet.artist} - ${currentSet.title}` : undefined;

    // ─── LIKE / VOTE pour le Top 5 Tracks ─────────────────────────────────────
    const [votedTracks, setVotedTracks] = useState<string[]>(() => {
        try {
            const s = localStorage.getItem('music_voted_tracks');
            return s ? JSON.parse(s) : [];
        } catch {
            return [];
        }
    });
    const [voteLoading, setVoteLoading] = useState(false);
    const [voteToast, setVoteToast] = useState<string | null>(null);

    useEffect(() => {
        const syncVotes = () => {
            try {
                const s = localStorage.getItem('music_voted_tracks');
                if (s) setVotedTracks(JSON.parse(s));
            } catch {}
        };
        window.addEventListener('dropsiders_track_voted', syncVotes);
        return () => window.removeEventListener('dropsiders_track_voted', syncVotes);
    }, []);

    const handleVoteTrack = async (title: string, media?: string) => {
        if (!title || voteLoading) return;
        if (votedTracks.includes(title)) {
            setVoteToast('Déjà voté pour ce morceau !');
            setTimeout(() => setVoteToast(null), 3000);
            return;
        }
        setVoteLoading(true);
        try {
            const res = await fetch('/api/music/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trackTitle: title,
                    media,
                    playerType: 'radio'
                })
            });
            if (res.ok) {
                const next = [...votedTracks, title];
                setVotedTracks(next);
                try { localStorage.setItem('music_voted_tracks', JSON.stringify(next)); } catch {}
                window.dispatchEvent(new CustomEvent('dropsiders_track_voted', { detail: { track: title } }));
                setVoteToast('❤️ Vote pris en compte dans le Top 5 !');
                setTimeout(() => setVoteToast(null), 3000);
            }
        } catch {
            setVoteToast('Erreur lors du vote');
            setTimeout(() => setVoteToast(null), 3000);
        } finally {
            setVoteLoading(false);
        }
    };

    // Filtre : tracks visibles dans le programme (pas les jingles/promos/pubs/courts)
    const isTransientItem = (item: ComputedRadioScheduleItem) => (
        item.category === 'jingle' ||
        item.category === 'promo' ||
        item.category === 'pub' ||
        (item as any).isTopHoraire ||
        (item as any).isThemeJingle ||
        (item.durationSeconds ?? 9999) < 60 ||
        ((item.artist || '').toLowerCase().includes('dropsiders radio') && (item.title || '').toLowerCase().includes('promo'))
    );

    // Auto-save history when track changes (musique uniquement, aucun jingle/promo)
    useEffect(() => {
        if (!currentSet || isTransientItem(currentSet)) return;
        try {
            const raw = localStorage.getItem(RADIO_HISTORY_KEY);
            const existing: RadioHistoryEntry[] = raw ? JSON.parse(raw) : [];
            const cleaned = existing.filter(e =>
                e && e.title &&
                e.artist !== 'DROPSIDERS RADIO' &&
                !e.title.toLowerCase().includes('promo') &&
                !e.title.toLowerCase().includes('jingle')
            );
            if (cleaned[0]?.artist === currentSet.artist && cleaned[0]?.title === currentSet.title) return;
            const now = new Date();
            const endTime = new Date(now.getTime() + ((currentSet.durationSeconds || 180) - (liveInfo?.offsetSeconds || 0)) * 1000);
            const entry: RadioHistoryEntry = {
                id: 'hist-' + Date.now(),
                artist: currentSet.artist || 'Artiste inconnu',
                title: currentSet.title || currentSet.startTime,
                startTime: formatParisTime(now),
                endTime: formatParisTime(endTime),
                day: formatParisDate(now),
                timestamp: Date.now(),
                category: currentSet.category,
                durationFormatted: currentSet.durationFormatted,
                youtubeId: currentSet.youtubeId,
                audioUrl: currentSet.audioUrl,
                soundcloudUrl: currentSet.soundcloudUrl,
                blockTitle: currentSet.blockTitle,
                blockHost: currentSet.blockHost
            };
            localStorage.setItem(RADIO_HISTORY_KEY, JSON.stringify([entry, ...cleaned].slice(0, 100)));
        } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSet?.artist, currentSet?.title]);

    // Track "public" : on masque les jingles/promos dans la vue auditeur
    const publicCurrentSet = currentSet && !isTransientItem(currentSet) ? currentSet : null;

    const tabs = [
        { id: 'now' as const, label: 'En Direct', icon: <Zap className="w-3.5 h-3.5" /> },
        { id: 'history' as const, label: 'Historique', icon: <History className="w-3.5 h-3.5" /> },
        ...(messagesEnabled ? [{ id: 'message' as const, label: 'Message', icon: <MessageSquare className="w-3.5 h-3.5" /> }] : []),
    ];

    return (
        <div className="min-h-screen bg-[#05050a] relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-red-500/[0.04] rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 pb-40 pt-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                            <Radio className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">
                                DROPSIDERS <span className="text-cyan-400">RADIO</span>
                            </h1>
                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Web Radio Electro 24/7</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[9px] font-black uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                            LIVE
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                            {formatParisTime(parisDate)} · <span className="capitalize">{formatParisDate(parisDate)}</span>
                        </span>
                    </div>
                </motion.div>

                {/* Mini player */}
                {currentSet ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="mb-6 rounded-3xl bg-gradient-to-br from-[#0d0d1e] via-[#080810] to-[#05050a] border border-cyan-500/30 p-5 shadow-[0_0_40px_rgba(0,255,255,0.08)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/[0.08] rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
                        <div className="flex items-center gap-4 relative">
                            <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.15)]">
                                <Disc3 className={`w-8 h-8 text-cyan-400 ${radioState.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">EN CE MOMENT</span>
                                    <AudioBars playing={radioState.isPlaying} />
                                </div>
                                {publicCurrentSet ? (
                                    <>
                                        <div className="flex items-center justify-between gap-2">
                                            <h2 className="text-lg font-black text-white uppercase italic tracking-tight truncate leading-tight">{publicCurrentSet.title || (publicCurrentSet as any).event}</h2>
                                            <button
                                                type="button"
                                                onClick={() => handleVoteTrack(`${publicCurrentSet.artist} - ${publicCurrentSet.title}`, publicCurrentSet.youtubeId || publicCurrentSet.audioUrl)}
                                                disabled={voteLoading}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-display font-black uppercase italic tracking-wider transition-all cursor-pointer ${
                                                    votedTracks.includes(`${publicCurrentSet.artist} - ${publicCurrentSet.title}`)
                                                        ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(255,0,85,0.3)]'
                                                        : 'bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border-white/10'
                                                }`}
                                                title={votedTracks.includes(`${publicCurrentSet.artist} - ${publicCurrentSet.title}`) ? 'Déjà voté pour le Top 5' : 'Voter pour ce son dans le Top 5'}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${votedTracks.includes(`${publicCurrentSet.artist} - ${publicCurrentSet.title}`) ? 'fill-current text-red-400' : ''}`} />
                                                <span className="hidden sm:inline">{votedTracks.includes(`${publicCurrentSet.artist} - ${publicCurrentSet.title}`) ? 'Voté Top 5' : 'Voter Top 5'}</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-300 font-bold uppercase tracking-wider truncate mt-0.5">{publicCurrentSet.artist}</p>
                                        {(publicCurrentSet.blockTitle || publicCurrentSet.blockHost) && (
                                            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5 mt-1.5 truncate">
                                                <span>📻 {publicCurrentSet.blockTitle || 'DROPSIDERS RADIO'}</span>
                                                {publicCurrentSet.blockHost && (
                                                    <span className="text-gray-400 font-normal">· avec <span className="text-white font-bold">{publicCurrentSet.blockHost}</span></span>
                                                )}
                                            </p>
                                        )}
                                        {voteToast && (
                                            <p className="text-[10px] text-cyan-400 font-bold mt-1 animate-pulse">
                                                {voteToast}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-gray-500">
                                            <Clock className="w-2.5 h-2.5 text-cyan-500" />
                                            <span className="text-cyan-400 font-bold">{publicCurrentSet.startTime}</span>
                                            <span>·</span>
                                            <span>{publicCurrentSet.durationFormatted}</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm font-bold text-gray-400 italic mt-1">🎶 Jingle / Promo en cours...</p>
                                )}
                            </div>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_toggle'))}
                                className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 cursor-pointer ${radioState.isPlaying
                                    ? 'bg-cyan-400 shadow-[0_0_30px_rgba(0,255,255,0.5)] text-black'
                                    : 'bg-white text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,255,255,0.35)]'
                                }`}
                            >
                                {radioState.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                            </button>
                        </div>
                        <div className="mt-4">
                            <div className="w-full h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, ((liveInfo?.offsetSeconds || 0) / (currentSet.durationSeconds || 3600)) * 100)}%` }} />
                            </div>
                            <div className="flex justify-between mt-1 text-[8px] font-mono text-gray-600">
                                <span>{formatDurationExact(liveInfo?.offsetSeconds || 0)}</span>
                                <span>{currentSet.durationFormatted}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                            <button onClick={() => window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_mute'))} className="shrink-0 text-gray-400 hover:text-white transition-colors cursor-pointer">
                                {radioState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                            </button>
                            <input type="range" min="0" max="100" value={radioState.isMuted ? 0 : radioState.volume}
                                onChange={e => window.dispatchEvent(new CustomEvent('dropsiders_radio_cmd_volume', { detail: Number(e.target.value) }))}
                                className="flex-1 h-1.5 rounded-full appearance-none accent-cyan-400 bg-white/10 cursor-pointer" />
                            <span className="text-[9px] font-mono text-gray-500 w-8 text-right">{radioState.isMuted ? 0 : radioState.volume}%</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-3xl bg-white/[0.03] border border-white/10 p-8 text-center">
                        <Radio className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-bold">La radio est hors ligne</p>
                        <p className="text-gray-600 text-xs mt-1">Revenez plus tard</p>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex-1 justify-center cursor-pointer ${activeTab === tab.id
                                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,255,255,0.35)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}>
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'now' && (
                        <motion.div key="now" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                            {/* Seulement le track en cours — pas de jingles/promos, pas de suivants */}
                            {liveInfo?.item && !isTransientItem(liveInfo.item)
                                ? <TrackCard
                                    item={liveInfo.item}
                                    isLive
                                    offsetSec={liveInfo.offsetSeconds}
                                    isVoted={votedTracks.includes(`${liveInfo.item.artist} - ${liveInfo.item.title}`)}
                                    onVote={() => handleVoteTrack(`${liveInfo.item.artist} - ${liveInfo.item.title}`, liveInfo.item.youtubeId || liveInfo.item.audioUrl)}
                                    voteLoading={voteLoading}
                                  />
                                : publicCurrentSet
                                    ? <TrackCard
                                        item={publicCurrentSet}
                                        isLive
                                        offsetSec={liveInfo?.offsetSeconds}
                                        isVoted={votedTracks.includes(`${publicCurrentSet.artist} - ${publicCurrentSet.title}`)}
                                        onVote={() => handleVoteTrack(`${publicCurrentSet.artist} - ${publicCurrentSet.title}`, publicCurrentSet.youtubeId || publicCurrentSet.audioUrl)}
                                        voteLoading={voteLoading}
                                      />
                                    : (
                                        <div className="py-12 text-center">
                                            <Disc3 className="w-8 h-8 text-gray-600 mx-auto mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                                            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">🎶 Jingle en cours</p>
                                        </div>
                                    )
                            }
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <HistorySection
                                radioBlocks={radioBlocks}
                                parisSec={parisSec}
                                onVote={handleVoteTrack}
                                votedTracks={votedTracks}
                                voteLoading={voteLoading}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'message' && messagesEnabled && (
                        <motion.div key="message" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <div className="rounded-3xl bg-gradient-to-br from-[#0d0d1e] to-[#05050a] border border-purple-500/30 p-5 shadow-[0_0_30px_rgba(168,85,247,0.08)]">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight">Message à l'Animateur</h3>
                                        <p className="text-[10px] font-mono text-purple-300">Envoyez un mot en direct à la régie</p>
                                    </div>
                                </div>
                                <MessageForm currentTrackTitle={currentTrackTitle} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
