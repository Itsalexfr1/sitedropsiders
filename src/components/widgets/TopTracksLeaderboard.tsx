import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, TrendingUp, Heart, Search, X, Plus, Youtube, Trophy, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface Track {
    title: string;
    votes: number;
    media?: string;
    playerType?: string;
    isArticle?: boolean;
}

export function TopTracksLeaderboard({ resolvedColor }: { resolvedColor?: string }) {
    const { t } = useLanguage();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [openTrackTitle, setOpenTrackTitle] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [votedTracks, setVotedTracks] = useState<string[]>([]);
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);
    const color = resolvedColor || 'var(--color-neon-cyan)';
    const searchTimeout = useRef<any>(null);

    useEffect(() => {
        const savedVotes = localStorage.getItem('music_voted_tracks');
        if (savedVotes) setVotedTracks(JSON.parse(savedVotes));
    }, []);

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (!q.trim()) {
            setSearchResults([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                if (res.ok) {
                    setSearchResults(data);
                } else {
                    setSearchError(data.error || 'Erreur recherche');
                }
            } catch (err) {
                setSearchError('Échec de la recherche');
            } finally {
                setIsSearching(false);
            }
        }, 500);
    };

    const handleAddTrack = async (track: any) => {
        try {
            const res = await fetch('/api/music/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    trackTitle: track.title, // Corrected from trackId
                    media: track.id || track.media,
                    playerType: 'youtube'
                })
            });
            if (res.ok) {
                const updatedVotes = [...votedTracks, track.title];
                setVotedTracks(updatedVotes);
                localStorage.setItem('music_voted_tracks', JSON.stringify(updatedVotes));
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                
                // Re-fetch tracks to show the new one without refresh
                const refreshRes = await fetch('/api/music/top-tracks');
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    const filteredData = (Array.isArray(data) ? data : []).filter((item: any) => {
                        const t = (item.title || '').toUpperCase();
                        return !t.includes('SORTIES DE LA SEMAINE') && 
                               !t.includes('WEEKLY SELECTION') &&
                               !t.includes('DÉVOILE');
                    });
                    setTracks(filteredData.slice(0, 5));
                }
            }
        } catch (err) {
            console.error('Failed to add track', err);
        }
    };

    const handleVote = async (title: string, e: React.MouseEvent, media?: string, playerType: string = 'youtube') => {
        e.stopPropagation();
        if (votedTracks.includes(title)) return;

        try {
            const res = await fetch('/api/music/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    trackTitle: title, // Corrected from trackId
                    media: media, 
                    playerType: playerType 
                })
            });
            if (res.ok) {
                const updatedVotes = [...votedTracks, title];
                setVotedTracks(updatedVotes);
                localStorage.setItem('music_voted_tracks', JSON.stringify(updatedVotes));
                
                setTracks(prev => prev.map(t => 
                    t.title === title ? { ...t, votes: (t.votes || 0) + 1 } : t
                ).sort((a, b) => (b.votes || 0) - (a.votes || 0)));
            }
        } catch (err) {
            console.error('Failed to vote:', err);
        }
    };

    const isAdmin = localStorage.getItem('admin_auth') === 'true';

    const handleDelete = async (title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAdmin) return;
        if (!confirm(`Supprimer "${title}" du classement ?`)) return;

        try {
            const res = await fetch('/api/music/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, adminToken: localStorage.getItem('admin_token') })
            });

            if (res.ok) {
                setTracks(prev => prev.filter(t => t.title !== title));
            }
        } catch (err) {
            console.error('Failed to delete track:', err);
        }
    };

    useEffect(() => {
        const fetchTopTracks = async () => {
            try {
                const res = await fetch('/api/music/top-tracks');
                if (res.ok) {
                    const data = await res.json();
                    const filteredData = (Array.isArray(data) ? data : []).filter((item: any) => {
                        const t = (item.title || '').toUpperCase();
                        return !t.includes('SORTIES DE LA SEMAINE') && 
                               !t.includes('WEEKLY SELECTION') &&
                               !t.includes('DÉVOILE');
                    });
                    setTracks(filteredData.slice(0, 5));
                }
            } catch (err) {
                console.error('Failed to fetch top tracks', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopTracks();
        const interval = setInterval(fetchTopTracks, 30000);
        return () => clearInterval(interval);
    }, []);

    const renderPlayer = (media: string, playerType: string) => {
        if (playerType === 'youtube') {
            const isId = /^[A-Za-z0-9_-]{11}$/.test(media);
            const src = isId 
                ? `https://www.youtube.com/embed/${media}?autoplay=1` 
                : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(media)}&autoplay=1`;
            return (
                <div className="relative w-full h-[150px] sm:h-[180px] rounded-xl overflow-hidden bg-black shadow-lg border border-white/5">
                    <iframe
                        src={src}
                        className="absolute top-0 left-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }
        if (playerType === 'beatport' || media.includes('beatport')) {
            const src = media.startsWith('http')
                ? media
                : `https://embed.beatport.com/?id=${media.match(/\d+/)?.[0] || media}&type=track`;
            return (
                <iframe
                    src={src}
                    width="100%"
                    height="162"
                    frameBorder="0"
                    scrolling="no"
                    style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                />
            );
        }
        if (playerType === 'spotify') {
            return (
                <iframe
                    src={`https://open.spotify.com/embed/track/${media}`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="encrypted-media"
                    style={{ borderRadius: '12px' }}
                />
            );
        }
        return null;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-6 mt-[5%]">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    TOP 5 TRACKS
                </h3>
            </div>

            <div className="flex-1 bg-dark-bg/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 opacity-50" />
                
                <div className="flex items-center justify-between mb-8 relative z-10 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">VOTES LIVE</span>
                    </div>
                </div>

                <div className="space-y-3 relative z-10 overflow-y-auto no-scrollbar max-h-[calc(100%-140px)]">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
                            ))
                        ) : tracks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                <Music className="w-8 h-8 mb-4 opacity-50" />
                                <p className="text-[10px] uppercase font-black tracking-widest">Aucune track disponible.</p>
                            </div>
                        ) : (
                            tracks.map((track: any, index) => (
                                <motion.div
                                    key={track.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="flex flex-col gap-2"
                                >
                                    <div
                                        onClick={() => setOpenTrackTitle(openTrackTitle === track.title ? null : track.title)}
                                        className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-white/10 border border-white/5 rounded-2xl transition-all group/item ${openTrackTitle === track.title ? 'bg-white/10 border-white/20' : 'bg-white/5'}`}
                                    >
                                        <div className="w-8 flex-shrink-0 text-center">
                                            <span className={`text-sm font-black italic ${index < 3 ? 'text-white' : 'text-gray-600'}`}>
                                                #{index + 1}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-xs font-black uppercase truncate transition-colors ${openTrackTitle === track.title ? 'text-neon-cyan' : 'text-white group-hover/item:text-neon-cyan'}`}>
                                                {track.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <TrendingUp className="w-3 h-3 text-gray-600" />
                                                <div className="h-1 bg-white/5 flex-1 rounded-full overflow-hidden relative">
                                                    {track.isArticle && !track.votes ? (
                                                        <div className="absolute inset-0 bg-gray-500/20" />
                                                    ) : (
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{
                                                                width: tracks[0]?.votes > 0
                                                                    ? `${Math.min(100, ((track.votes || 0) / tracks[0].votes) * 100)}%`
                                                                    : '0%'
                                                            }}
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    )}
                                                </div>
                                                {track.isArticle && !track.votes && (
                                                    <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold whitespace-nowrap">News</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => handleDelete(track.title, e)}
                                                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                type="button"
                                                disabled={votedTracks.includes(track.title)}
                                                onClick={(e) => handleVote(track.title, e, track.media, track.playerType)}
                                                className={`relative z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95 group/btn ${votedTracks.includes(track.title) ? 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10' : 'bg-black/40 border-white/5 hover:bg-pink-500/20 hover:border-pink-500/40 text-white'}`}
                                            >
                                                <Heart className={`w-3 h-3 transition-transform ${votedTracks.includes(track.title) ? 'fill-neon-cyan' : 'text-pink-400 group-hover/btn:scale-125'}`} />
                                                <span className="text-[10px] font-black">{track.votes || 0}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {openTrackTitle === track.title && track.media && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden rounded-2xl border border-white/10 mb-2"
                                            >
                                                <div className="bg-black/60 p-2">
                                                    {renderPlayer(track.media, track.playerType || 'youtube')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/40 transition-all group"
                    >
                        <Youtube className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">Ajouter un titre (YouTube)</span>
                    </button>
                </div>
            </div>

            {/* Search Modal */}
            <AnimatePresence>
                {isSearchOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSearchOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                                        <Youtube className="w-8 h-8 text-red-500" />
                                        RECHERCHE YOUTUBE
                                    </h2>
                                    <button
                                        onClick={() => setIsSearchOpen(false)}
                                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>

                                <div className="relative mb-8">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Artiste, titre, remix..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-medium focus:border-white/20 focus:outline-none transition-all"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {searchError && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold uppercase tracking-wider">
                                            {searchError}
                                        </div>
                                    )}

                                    {searchResults.map((track) => (
                                        <div
                                            key={track.id}
                                            className="flex flex-col gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                                    <div className="relative w-16 h-12 rounded-lg overflow-hidden group-hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-shadow">
                                                        <img src={track.cover} alt="" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                            <Youtube className="w-4 h-4 text-white opacity-80" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddTrack(track)}
                                                    className="w-10 h-10 flex-shrink-0 rounded-xl bg-white/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                            
                                            {previewVideo === track.id ? (
                                                <div className="w-full aspect-video rounded-lg overflow-hidden bg-black mt-2">
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${track.media}?autoplay=1`}
                                                        className="w-full h-full"
                                                        allow="autoplay; encrypted-media"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewVideo(track.id);
                                                    }}
                                                    className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest text-left mt-1 w-max"
                                                >
                                                    Écouter un extrait
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {!isSearching && searchQuery && searchResults.length === 0 && !searchError && (
                                        <p className="text-center text-gray-500 text-[10px] font-black uppercase tracking-[2px] py-8">Aucun résultat trouvé</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
