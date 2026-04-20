
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, TrendingUp, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface Track {
    title: string;
    votes: number;
    media?: string;
    playerType?: string;
}

export function TopTracksLeaderboard({ resolvedColor }: { resolvedColor?: string }) {
    const { t } = useLanguage();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [openTrackTitle, setOpenTrackTitle] = useState<string | null>(null);
    const color = resolvedColor || '#ff1241';

    const handleVote = async (title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch('/api/music/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, action: 'up' })
            });
            if (res.ok) {
                // Update local state for immediate feedback
                setTracks(prev => prev.map(t => 
                    t.title === title ? { ...t, votes: (t.votes || 0) + 1 } : t
                ).sort((a, b) => (b.votes || 0) - (a.votes || 0)));
            }
        } catch (err) {
            console.error('Failed to vote:', err);
        }
    };

    useEffect(() => {
        const fetchTopTracks = async () => {
            try {
                const res = await fetch('/api/music/top-tracks');
                if (res.ok) {
                    const data = await res.json();

                    // Garder uniquement les tracks avec un lien Beatport embed
                    const beatportTracks: Track[] = Array.isArray(data)
                        ? data.filter((t: any) => t.title && t.media && t.media.includes('beatport'))
                        : [];

                    // Tri stable : on ne change l'ordre QUE si le nombre de votes est différent.
                    // Cela permet de garder l'ordre exact du "Mixer" tant que les votes sont à 0.
                    const sorted = [...beatportTracks].sort((a, b) => {
                        const vA = a.votes || 0;
                        const vB = b.votes || 0;
                        if (vB !== vA) return vB - vA;
                        return 0; // Garde l'ordre original de l'API (Mixer)
                    });

                    const final = sorted.slice(0, 20);
                    setTracks(final);
                    if (!openTrackTitle && final[0]?.title) setOpenTrackTitle(final[0].title);
                }
            } catch (err) {
                console.error('Failed to fetch top tracks', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopTracks();
        // Rafraîchissement automatique toutes les 30 secondes
        const interval = setInterval(fetchTopTracks, 30000);
        return () => clearInterval(interval);
    }, []);

    const renderPlayer = (media: string, playerType: string) => {
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
                    style={{ borderRadius: '12px' }}
                />
            );
        }
        return null;
    };

    // État vide : aucune track Beatport disponible
    if (!loading && tracks.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <div className="w-full flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        <span
                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                        />
                        TOP 20 TRACKS
                    </h3>
                </div>
                <div className="flex-1 bg-dark-bg/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center justify-center gap-4">
                    <Music className="w-12 h-12 text-gray-700" />
                    <p className="text-gray-600 font-black uppercase tracking-widest text-[10px] text-center leading-loose">
                        Aucun morceau Beatport disponible.<br />
                        Effectuez un <span className="text-white">Reset &amp; Mixer</span> depuis le Dashboard.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    TOP 20 TRACKS
                </h3>
            </div>

            <div className="flex-1 bg-dark-bg/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 h-full shadow-2xl relative overflow-hidden group">
                {/* Background Glow */}
                <div
                    className="absolute top-0 right-0 w-64 h-64 opacity-5 blur-[100px] pointer-events-none transition-all duration-1000 group-hover:opacity-10"
                    style={{ backgroundColor: color }}
                />

                <div className="flex items-center justify-between mb-8 relative z-10 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">VOTES LIVE</span>
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">COMMUNITY CHOICE</span>
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
                            ))
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
                                                <div className="h-1 bg-white/5 flex-1 rounded-full overflow-hidden">
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
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={(e) => handleVote(track.title, e)}
                                            className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 hover:bg-pink-500/20 hover:border-pink-500/40 transition-colors group/btn"
                                        >
                                            <Heart className="w-3 h-3 text-pink-400 group-hover/btn:scale-125 transition-transform" />
                                            <span className="text-[10px] font-black text-white">{track.votes || 0}</span>
                                        </button>
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
                                                    {renderPlayer(track.media, track.playerType || 'beatport')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest text-center">
                        Votes mis à jour en temps réel via les{' '}
                        <Link to="/news?tab=musique" className="text-white hover:text-neon-cyan transition-colors underline decoration-dotted">
                            articles musique
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
