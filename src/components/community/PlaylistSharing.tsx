import { motion } from 'framer-motion';
import { Plus, Heart, MessageCircle } from 'lucide-react';

const MOCK_PLAYLISTS: any[] = [];

export function PlaylistSharing() {
    return (
        <div className="space-y-12">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter">Partage de Mixs</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Tes meilleures playlists Spotify & Soundcloud</p>
                </div>
                <button className="px-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-neon-cyan transition-all">
                    <Plus className="w-4 h-4" /> PARTAGER UN MIX
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {MOCK_PLAYLISTS.map((pl, idx) => (
                    <motion.div
                        key={pl.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 group hover:border-white/30 transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">{pl.type}</span>
                                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Posté par {pl.author}</span>
                                </div>
                                <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tight">{pl.title}</h3>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <Heart className="w-4 h-4 text-white/20 hover:text-neon-red transition-colors cursor-pointer" />
                                    <span className="text-[8px] font-bold text-white/20 mt-1">{pl.likes}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <MessageCircle className="w-4 h-4 text-white/20" />
                                    <span className="text-[8px] font-bold text-white/20 mt-1">{pl.comments}</span>
                                </div>
                            </div>
                        </div>

                        <div className="aspect-video rounded-2xl bg-black overflow-hidden border border-white/5">
                            <iframe
                                src={pl.embed}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                title={pl.title}
                                loading="lazy"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
