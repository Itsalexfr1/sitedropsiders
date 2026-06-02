import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayer } from '../../context/PlayerContext';
import { CustomMixPlayer } from './CustomMixPlayer';
import { Play, Pause, Maximize2, X, Music } from 'lucide-react';

export function GlobalPlayerContainer() {
    const { activeTrack, closePlayer } = usePlayer();
    const [isMinimized, setIsMinimized] = useState(false);

    if (!activeTrack) return null;

    return (
        <AnimatePresence>
            <motion.div
                key={activeTrack.id + (isMinimized ? '-min' : '-max')}
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 md:px-8 md:pb-8 pointer-events-none"
            >
                <div className="max-w-7xl mx-auto pointer-events-auto shadow-[0_-20px_60px_rgba(0,0,0,0.8)] rounded-[40px]">
                    {isMinimized ? (
                        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                                    <Music className="w-6 h-6 text-neon-purple" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase italic tracking-tighter truncate max-w-[150px] md:max-w-xs">{activeTrack.title}</h4>
                                    <p className="text-[10px] text-neon-cyan font-black uppercase tracking-widest">{activeTrack.artist}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMinimized(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                </button>
                                <button onClick={closePlayer} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all">
                                    <X className="w-4 h-4 text-white hover:text-red-500" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <CustomMixPlayer
                                track={activeTrack}
                                onClose={closePlayer}
                            />
                            <button 
                                onClick={() => setIsMinimized(true)}
                                className="absolute top-6 right-20 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all cursor-pointer z-50"
                                title="Minimiser le lecteur"
                            >
                                <Maximize2 className="w-4 h-4" /> {/* Or use Minimize2 if imported */}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
