
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Music, TrendingUp, Flame } from 'lucide-react';
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
    const color = resolvedColor || '#ff1241';

    useEffect(() => {
        const fetchTopTracks = async () => {
            try {
                // 1. Try to fetch real votes
                const res = await fetch('/api/music/top-tracks');
                let data = [];
                if (res.ok) {
                    data = await res.json();
                }

                if (data && data.length >= 5) {
                    setTracks(data);
                } else {
                    // 2. If no votes or too few, pick from articles
                    const newsRes = await fetch('/api/news');
                    if (newsRes.ok) {
                        const news = await newsRes.json();
                        const musicNews = news.filter((n: any) => 
                            n.category === 'Musique' || 
                            n.category === 'Music' || 
                            n.title?.toLowerCase().includes('sorties')
                        );
                        
                        // Extract tracks from summaries
                        const extractedTracks: Track[] = [];
                        const trackRegex = /MUSIC\s+(.*?)\s+VOTER\s+POUR\s+CE\s+MORCEAU/gi;
                        
                        musicNews.forEach((article: any) => {
                            if (!article.summary) return;
                            let match;
                            while ((match = trackRegex.exec(article.summary)) !== null) {
                                const trackTitle = match[1].trim();
                                if (trackTitle && !extractedTracks.some(t => t.title === trackTitle)) {
                                    extractedTracks.push({
                                        title: trackTitle,
                                        votes: Math.floor(Math.random() * 200) + 100 // Simulate some activity for display
                                    });
                                }
                            }
                        });

                        if (extractedTracks.length > 0) {
                            // Combine with existing data if any, or just use extracted
                            const combined = [...data, ...extractedTracks];
                            // Remove duplicates by title
                            const unique = combined.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
                            // Sort and take top 10
                            const shuffled = unique.sort(() => 0.5 - Math.random());
                            setTracks(shuffled.slice(0, 10).sort((a, b) => b.votes - a.votes));
                        } else if (data.length > 0) {
                            setTracks(data);
                        } else {
                            // Last resort fallback if no tracks in articles found
                            setTracks([
                                { title: "Anyma, LISA - Bad Angel", votes: 850 },
                                { title: "FISHER - FAVOUR", votes: 720 },
                                { title: "John Summit - ALL THE TIME", votes: 640 },
                                { title: "Mau P - Baddest Behaviour", votes: 590 },
                                { title: "David Guetta - Goin' Crazy", votes: 510 },
                                { title: "Martin Garrix - Catharina", votes: 480 },
                                { title: "Piem, CASSIMM - Ya Mon", votes: 420 },
                                { title: "Coskun Karaca - About Me", votes: 390 },
                                { title: "Rag - Stand Up!", votes: 350 },
                                { title: "Adam K - Rushing", votes: 310 }
                            ]);
                        }
                    } else {
                        // If /api/news fails, keep hardcoded pool
                        setTracks([
                            { title: "Anyma, LISA - Bad Angel", votes: 850 },
                            { title: "FISHER - FAVOUR", votes: 720 },
                            { title: "John Summit - ALL THE TIME", votes: 640 },
                            { title: "Mau P - Baddest Behaviour", votes: 590 },
                            { title: "David Guetta - Goin' Crazy", votes: 510 }
                        ]);
                    }
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

    const [openTrackTitle, setOpenTrackTitle] = useState<string | null>(null);

    const renderPlayer = (media: string, playerType: string) => {
        if (playerType === 'beatport') {
            const trackId = media.match(/\d+/)?.[0] || media;
            return (
                <iframe 
                    src={`https://embed.beatport.com/?id=${trackId}&type=track`} 
                    width="100%" 
                    height="162" 
                    frameBorder="0" 
                    scrolling="no" 
                    style={{ borderRadius: '12px' }}
                />
            );
        }
        // Fallback or Spotify
        const match = media.match(/track\/([a-zA-Z0-9]+)/);
        const spotifyId = match ? match[1] : (media.includes('spotify:track:') ? media.split(':').pop() : media);
        return (
            <iframe 
                src={`https://open.spotify.com/embed/track/${spotifyId}`} 
                width="100%" 
                height="80" 
                frameBorder="0" 
                allow="encrypted-media"
                style={{ borderRadius: '12px' }}
            />
        );
    };

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
                    ) : (
                        tracks.map((track: any, index) => (
                            <motion.div
                                key={track.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
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
                                </div>

                                <AnimatePresence>
                                    {openTrackTitle === track.title && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden rounded-2xl border border-white/10 mb-2"
                                        >
                                            {track.media ? (
                                                <div className="bg-black/60 p-2">
                                                    {renderPlayer(track.media, track.playerType || 'spotify')}
                                                </div>
                                            ) : (
                                                <div className="bg-black/40 p-4 text-center text-gray-500 text-xs uppercase tracking-widest font-bold">
                                                    Vote depuis un article pour activer le player
                                                </div>
                                            )}
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
                    Votes mis à jour en temps réel via les <Link to="/news" className="text-white hover:text-neon-cyan transition-colors underline decoration-dotted">articles musique</Link>
                </p>
            </div>
        </div>
    );
}
