import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Heart, Play, Loader2, Music } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

interface Mix {
    id: string;
    title: string;
    username: string;
    genre?: string;
    type?: string; // 'Mix' | 'Track' | 'Remix' | 'Edit'
    audioUrl?: string;
    url?: string;
    embedUrl?: string;
    likes: number;
    tracklist?: any[];
    ownerEmail?: string;
    userEmail?: string;
}

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
    mix: {
        bg: 'bg-neon-green/10',
        text: 'text-neon-green',
        border: 'border-neon-green/20'
    },
    track: {
        bg: 'bg-neon-red/10',
        text: 'text-neon-red',
        border: 'border-neon-red/20'
    },
    remix: {
        bg: 'bg-neon-purple/10',
        text: 'text-neon-purple',
        border: 'border-neon-purple/20'
    },
    edit: {
        bg: 'bg-neon-cyan/10',
        text: 'text-neon-cyan',
        border: 'border-neon-cyan/20'
    }
};

export function CommunityMixesLeaderboard() {
    const { playTrack } = usePlayer();
    const [mixes, setMixes] = useState<Mix[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'mix' | 'track' | 'remix' | 'edit'>('all');
    const [likedMixes, setLikedMixes] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('dropsiders_mix_likes') || '[]'));
        } catch {
            return new Set();
        }
    });

    const fetchMixes = async () => {
        try {
            const res = await fetch('/api/community/mixes');
            if (res.ok) {
                const data = await res.json();
                setMixes(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch mixes', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMixes();
        const interval = setInterval(fetchMixes, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLikeMix = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (likedMixes.has(id)) return;

        const updated = new Set(likedMixes).add(id);
        setLikedMixes(updated);
        localStorage.setItem('dropsiders_mix_likes', JSON.stringify([...updated]));

        // Optimistically update
        setMixes(prev => prev.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m));

        try {
            await fetch('/api/community/mixes/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch (err) {
            console.error('Failed to submit like', err);
        }
    };

    const handlePlayMix = (mix: Mix) => {
        playTrack({
            id: mix.id,
            title: mix.title,
            artist: mix.username || 'Dropsider',
            label: mix.genre || mix.type,
            url: mix.audioUrl || mix.url || '',
            embedUrl: mix.embedUrl && !mix.audioUrl ? mix.embedUrl : undefined,
            tracks: mix.tracklist || [],
            ownerEmail: mix.ownerEmail || mix.userEmail
        });
    };

    // Filter & Sort
    const filteredMixes = mixes
        .filter((mix) => {
            if (activeFilter === 'all') return true;
            const mixType = (mix.type || 'Mix').toLowerCase();
            return mixType === activeFilter;
        })
        // Sort by likes descending
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        // Take top 10
        .slice(0, 10);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-[5%]">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-neon-purple animate-pulse" />
                    TOP 10 MIXES & PRODS
                </h3>

                {/* Sub-tabs / Filters */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit gap-1 text-[8px] font-black uppercase tracking-widest z-20">
                    {['all', 'mix', 'track', 'remix', 'edit'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat as any)}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                activeFilter === cat 
                                    ? 'bg-white text-black font-black' 
                                    : 'text-gray-400 hover:text-white font-medium'
                            }`}
                        >
                            {cat === 'all' ? 'Tous' : cat + 's'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 bg-dark-bg/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-neon-cyan/5 opacity-50" />
                
                <div className="flex items-center justify-between mb-8 relative z-10 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse shadow-[0_0_8px_var(--color-neon-purple)]" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">VOTES COMMUNAUTÉ</span>
                    </div>
                </div>

                <div className="space-y-3 relative z-10 overflow-y-auto no-scrollbar max-h-[460px]">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
                            ))
                        ) : filteredMixes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 py-16">
                                <Music className="w-8 h-8 mb-4 opacity-50 text-neon-purple animate-bounce" />
                                <p className="text-[10px] uppercase font-black tracking-widest">Aucun mix disponible dans cette catégorie.</p>
                            </div>
                        ) : (
                            filteredMixes.map((mix, index) => {
                                const mType = (mix.type || 'Mix').toLowerCase();
                                const badgeStyle = typeStyles[mType] || typeStyles.mix;
                                return (
                                    <motion.div
                                        key={mix.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="flex flex-col gap-2"
                                    >
                                        <div
                                            onClick={() => handlePlayMix(mix)}
                                            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/10 border border-white/5 bg-white/5 rounded-2xl transition-all group/item hover:border-white/10"
                                        >
                                            {/* Position Rank */}
                                            <div className="w-8 flex-shrink-0 text-center">
                                                <span className={`text-sm font-black italic ${index < 3 ? 'text-neon-purple' : 'text-gray-600'}`}>
                                                    #{index + 1}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-black uppercase truncate text-white group-hover/item:text-neon-purple transition-colors">
                                                    {mix.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                                                        Par {mix.username || 'Dropsider'}
                                                    </span>
                                                    <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                                                        {mix.type || 'Mix'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleLikeMix(e, mix.id)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95 group/btn ${
                                                        likedMixes.has(mix.id) 
                                                            ? 'text-pink-500 border-pink-500/20 bg-pink-500/10' 
                                                            : 'bg-black/40 border-white/5 hover:bg-pink-500/20 hover:border-pink-500/40 text-white'
                                                    }`}
                                                >
                                                    <Heart className={`w-3 h-3 transition-transform ${likedMixes.has(mix.id) ? 'fill-current text-pink-500' : 'text-pink-400 group-hover/btn:scale-125'}`} />
                                                    <span className="text-[10px] font-black">{mix.likes || 0}</span>
                                                </button>

                                                <button
                                                    onClick={() => handlePlayMix(mix)}
                                                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neon-purple hover:text-white transition-all shadow-lg active:scale-90"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
