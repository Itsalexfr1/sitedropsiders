import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Clock } from 'lucide-react';

export function ClipsPage() {
    const [clips, setClips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClips = async () => {
            try {
                const res = await fetch('/api/clips');
                if (res.ok) {
                    const data = await res.json();
                    setClips(data);
                } else {
                    // Fallback to localStorage if API fails
                    const savedClips = JSON.parse(localStorage.getItem('user_clips') || '[]');
                    setClips(savedClips);
                }
            } catch (e) {
                const savedClips = JSON.parse(localStorage.getItem('user_clips') || '[]');
                setClips(savedClips);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClips();
    }, []);

    return (
        <div className="min-h-screen bg-dark-bg pt-20">
            <div className="max-w-[1400px] mx-auto px-4 md:px-12 xl:px-16 2xl:px-24 py-12 border-b border-white/10 mb-8 mt-12">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white uppercase italic tracking-tighter mb-4">
                    Clips <span className="text-neon-purple">& VOD</span>
                </h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm max-w-2xl">
                    Retrouvez vos meilleurs extraits des Lives Takeover
                </p>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-12 xl:px-16 2xl:px-24 pb-12">
                {isLoading ? (
                    <div className="text-center py-32 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Chargement des clips...</p>
                    </div>
                ) : clips.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center justify-center space-y-4 bg-white/[0.02] border border-white/5 rounded-[3rem]">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-neon-purple blur-2xl opacity-10" />
                            <Video className="w-16 h-16 text-white/10 relative z-10" />
                        </div>
                        <h3 className="text-xl font-black text-white/50 uppercase tracking-widest mt-4">Aucun Clip pour le moment</h3>
                        <p className="text-sm text-gray-500 max-w-sm px-6 font-bold uppercase tracking-widest">Lancez une capture pendant le live pour générer votre premier clip vidéo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {clips.map((clip, index) => (
                            <motion.div
                                key={clip.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group overflow-hidden bg-white/[0.02] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-white/20 transition-all"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-2xl text-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.1)]">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/70 font-mono tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" /> {clip.duration}
                                        </span>
                                    </div>
                                    <h4 className="text-white font-black uppercase text-lg italic tracking-tighter mb-2 line-clamp-1">{clip.title}</h4>
                                    <div className="flex items-center gap-4 mb-8">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> {clip.date}
                                        </p>
                                        <p className="text-[10px] text-neon-purple font-black uppercase tracking-widest">
                                            @{clip.creator || 'ANONYME'}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <a href={clip.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-neon-purple rounded-2xl text-[10px] font-black uppercase text-white hover:opacity-90 transition-all shadow-[0_0_20px_rgba(188,19,254,0.3)]">
                                            <Video className="w-4 h-4" /> Voir le Clip
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
