import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Music, TrendingUp, Flame } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Track {
    title: string;
    votes: number;
}

export function TopTracksLeaderboard({ resolvedColor }: { resolvedColor?: string }) {
    const { t } = useLanguage();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const color = resolvedColor || '#ff1241';

    useEffect(() => {
        const fetchTopTracks = async () => {
            try {
                const res = await fetch('/api/music/top-tracks');
                if (res.ok) {
                    const data = await res.json();
                    setTracks(data);
                }
            } catch (err) {
                console.error('Failed to fetch top tracks', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopTracks();
        // Refresh every 30 seconds
        const interval = setInterval(fetchTopTracks, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 h-full shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div 
                className="absolute top-0 right-0 w-64 h-64 opacity-5 blur-[100px] pointer-events-none transition-all duration-1000 group-hover:opacity-10"
                style={{ backgroundColor: color }}
            />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div 
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-lg"
                        style={{ color: color }}
                    >
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter leading-tight">
                            TOP 10 <span style={{ color: color }}>TRACKS</span>
                        </h3>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Community Choice</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">LIVE</span>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
                        ))
                    ) : tracks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center">
                            <Music className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Aucun vote pour le moment</p>
                        </div>
                    ) : (
                        tracks.map((track, index) => (
                            <motion.div
                                key={track.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all group/item"
                            >
                                <div className="w-8 flex-shrink-0 text-center">
                                    <span className={`text-sm font-black italic ${index < 3 ? 'text-white' : 'text-gray-600'}`}>
                                        #{index + 1}
                                    </span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-white uppercase truncate group-hover/item:text-neon-cyan transition-colors">
                                        {track.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <TrendingUp className="w-3 h-3 text-gray-600" />
                                        <div className="h-1 bg-white/5 flex-1 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (track.votes / tracks[0].votes) * 100)}%` }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    <span className="text-[10px] font-black text-white">{track.votes}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest text-center">
                    Votes mis à jour en temps réel via les articles musique
                </p>
            </div>
        </div>
    );
}
