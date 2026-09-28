import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, X, Play, Loader2, Sparkles, Plus, Clock, ExternalLink,
    Music2, Bell, Megaphone, Zap, Mic, Film
} from 'lucide-react';
import { searchYouTubeVideos, type YouTubeSearchResult } from '../../../utils/youtubeSearch';

export type MediaCategory = 'music' | 'liveset' | 'clip' | 'jingle' | 'pub' | 'promo' | 'chronique';

interface YouTubeSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'radio' | 'tv';
    blockTitle?: string;
    onAddVideo: (video: {
        youtubeId: string;
        title: string;
        duration: number;
        category: MediaCategory;
        channel?: string;
        thumbnail?: string;
    }) => void;
}

const PRESET_QUERIES = [
    { label: '🔥 Festival Sets', q: 'Tomorrowland 2026 live set' },
    { label: '🎵 Hits & Clips', q: 'Electro festival music video official' },
    { label: '🔔 Jingles Radio', q: 'Radio jingle sound effect drop' },
    { label: '📢 Pubs & Teasers', q: 'Festival official teaser trailer' },
    { label: '⚡ Ultra Miami', q: 'Ultra Music Festival Miami live set' },
    { label: '🎪 Defqon.1', q: 'Defqon.1 2026 official set' },
    { label: '🎧 Tech House', q: 'Tech House club set live 2026' },
];

export function YouTubeSearchModal({
    isOpen,
    onClose,
    mode,
    blockTitle,
    onAddVideo
}: YouTubeSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<YouTubeSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
    const [defaultCategory, setDefaultCategory] = useState<MediaCategory>(mode === 'radio' ? 'liveset' : 'liveset');

    const handleSearch = async (overrideQuery?: string) => {
        const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
        if (!q) return;
        setLoading(true);
        setHasSearched(true);
        try {
            const data = await searchYouTubeVideos(q);
            setResults(data);
        } catch (e) {
            console.error('YouTube search error:', e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = (item: YouTubeSearchResult, categoryOverride?: MediaCategory) => {
        const cat = categoryOverride || defaultCategory;
        onAddVideo({
            youtubeId: item.youtubeId,
            title: item.title,
            duration: item.duration,
            category: cat,
            channel: item.channel,
            thumbnail: item.thumbnail
        });
    };

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
                    className="bg-[#090a10]/98 border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[850px] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative"
                >
                    {/* Top neon glow line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple" />

                    {/* Modal Header */}
                    <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <Search className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-display font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                    Recherche YouTube <span className="text-neon-cyan">Directe</span>
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                    {mode === 'radio' ? 'Ajouter à la Radio' : 'Ajouter à la TV'} {blockTitle ? `• Émission : ${blockTitle}` : ''}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Bar + Preset Chips */}
                    <div className="p-4 sm:p-6 border-b border-white/10 space-y-3 bg-[#0c0d16]/60 shrink-0">
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch();
                            }}
                            className="flex gap-2"
                        >
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Rechercher un set, un clip, un jingle, une pub ou un artiste sur YouTube..."
                                    className="w-full bg-white/5 border border-white/15 focus:border-neon-cyan rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all"
                                    autoFocus
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="px-5 sm:px-6 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Search className="w-4 h-4 text-black" />}
                                <span className="hidden sm:inline">Chercher</span>
                            </button>
                        </form>

                        {/* Preset Suggestion Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider shrink-0">Idées :</span>
                            {PRESET_QUERIES.map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setQuery(p.q);
                                        handleSearch(p.q);
                                    }}
                                    className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-300 hover:text-white transition-all whitespace-nowrap cursor-pointer shrink-0"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Category Selector for Next Addition */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type par défaut :</span>
                                <div className="flex gap-1">
                                    {[
                                        { id: 'liveset', label: '🎵 Musique/Set', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                                        { id: 'jingle', label: '🔔 Jingle', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                                        { id: 'pub', label: '📢 Pub', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                                        { id: 'promo', label: '⚡ Promo', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                                        { id: 'chronique', label: '🎙️ Chronique', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setDefaultCategory(cat.id as any)}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                                defaultCategory === cat.id 
                                                    ? `${cat.color} font-black shadow-md` 
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {results.length > 0 && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {results.length} résultats
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Inline Video Preview Box (if previewing) */}
                    {previewVideoId && (
                        <div className="p-3 bg-black/90 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <iframe
                                    src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
                                    className="w-40 h-24 rounded-xl border border-white/10"
                                    allow="autoplay"
                                    title="Preview"
                                />
                                <div>
                                    <p className="text-xs font-black text-white uppercase italic">Aperçu en direct</p>
                                    <p className="text-[9px] text-gray-400 font-mono">ID: {previewVideoId}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewVideoId(null)}
                                className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-black uppercase text-gray-300 hover:text-white"
                            >
                                Fermer l'aperçu
                            </button>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3">
                                <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                                    Recherche sur YouTube en cours...
                                </p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-neon-cyan/40 transition-all flex gap-3 group"
                                    >
                                        {/* Thumbnail with duration badge */}
                                        <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 bg-black border border-white/10">
                                            <img
                                                src={item.thumbnail}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                loading="lazy"
                                            />
                                            {item.durationText && (
                                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 font-mono text-[9px] font-black text-white">
                                                    {item.durationText}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setPreviewVideoId(item.youtubeId)}
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white hover:text-neon-cyan"
                                                title="Aperçu rapide"
                                            >
                                                <Play className="w-6 h-6 fill-current" />
                                            </button>
                                        </div>

                                        {/* Meta + 1-Click Action Buttons */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-neon-cyan transition-colors">
                                                    {item.title}
                                                </h4>
                                                {item.channel && (
                                                    <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                                                        {item.channel}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Add Button with Dropdown / Quick additions */}
                                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdd(item)}
                                                    className="flex-1 py-1.5 px-3 rounded-xl bg-neon-cyan text-black hover:bg-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Ajouter ({defaultCategory})</span>
                                                </button>

                                                {/* Quick Jingle / Pub add shortcuts */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdd(item, 'jingle')}
                                                    className="p-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 text-[9px] font-black transition-all cursor-pointer"
                                                    title="Ajouter comme Jingle"
                                                >
                                                    <Bell className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdd(item, 'pub')}
                                                    className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 text-[9px] font-black transition-all cursor-pointer"
                                                    title="Ajouter comme Pub / Sponsor"
                                                >
                                                    <Megaphone className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : hasSearched ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-2 text-gray-500">
                                <Search className="w-8 h-8 opacity-40" />
                                <p className="text-xs font-black uppercase tracking-widest">
                                    Aucune vidéo trouvée pour "{query}"
                                </p>
                                <p className="text-[10px] text-gray-600">
                                    Essayez avec un autre titre, nom d'artiste ou jingle
                                </p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3 text-gray-500">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-300">
                                        Recherchez n'importe quel contenu YouTube
                                    </p>
                                    <p className="text-[10px] text-gray-500 max-w-sm">
                                        Livesets, clips, intros, jingles sonores, spots publicitaires, chroniques.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
