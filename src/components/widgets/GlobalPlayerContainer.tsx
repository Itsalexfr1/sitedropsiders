import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../../context/PlayerContext';
import { CustomMixPlayer } from './CustomMixPlayer';
import { Play, Pause, Maximize2, X, Music, Minimize2 } from 'lucide-react';

export function GlobalPlayerContainer() {
    const { activeTrack, closePlayer, isPlaying, togglePlay } = usePlayer();
    const [isMinimized, setIsMinimized] = useState(false);

    // Don't render anything if no track is active
    if (!activeTrack) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 md:px-8 md:pb-8 pointer-events-none">
            <div className="max-w-7xl mx-auto pointer-events-auto">

                {/* MINI PLAYER — shown only when minimized */}
                <AnimatePresence>
                    {isMinimized && (
                        <motion.div
                            key="mini-player"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 flex items-center justify-between gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
                        >
                            {/* Left: icon + info – click to expand */}
                            <div
                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                onClick={() => setIsMinimized(false)}
                            >
                                <div className="w-10 h-10 flex-shrink-0 bg-neon-purple/20 rounded-xl flex items-center justify-center relative overflow-hidden">
                                    <div className={`absolute inset-0 bg-neon-purple/30 transition-opacity ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
                                    <Music className="w-5 h-5 text-neon-purple relative z-10" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-black text-white uppercase italic tracking-tighter truncate leading-none hover:text-neon-cyan transition-colors">
                                        {activeTrack.title}
                                    </h4>
                                    <p className="text-[9px] text-neon-cyan font-black uppercase tracking-widest mt-0.5">
                                        {activeTrack.artist}
                                    </p>
                                </div>
                            </div>

                            {/* Right: playback controls */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={togglePlay}
                                    className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-neon-cyan hover:shadow-[0_0_16px_rgba(0,229,255,0.5)] rounded-full transition-all active:scale-95"
                                    title={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying
                                        ? <Pause className="w-4 h-4 fill-black" />
                                        : <Play className="w-4 h-4 fill-black ml-0.5" />
                                    }
                                </button>

                                <div className="h-8 w-px bg-white/10" />

                                <button
                                    onClick={() => setIsMinimized(false)}
                                    className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                                    title="Agrandir"
                                >
                                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                                </button>
                                <button
                                    onClick={closePlayer}
                                    className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all group"
                                    title="Fermer"
                                >
                                    <X className="w-3.5 h-3.5 text-white group-hover:text-red-500 transition-colors" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/*
                    FULL PLAYER — always in the DOM so audio keeps playing.
                    We use CSS to hide/show it instead of unmounting,
                    so the <audio> element inside never gets destroyed.
                */}
                <motion.div
                    key={activeTrack.id}
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`relative shadow-[0_-20px_60px_rgba(0,0,0,0.8)] rounded-[40px] transition-all duration-300 ${
                        isMinimized
                            ? 'opacity-0 pointer-events-none absolute bottom-0 left-0 right-0 -z-10'
                            : 'opacity-100'
                    }`}
                >
                    <CustomMixPlayer
                        track={activeTrack}
                        onClose={closePlayer}
                    />
                    {/* Minimize button overlaid on the player */}
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="absolute top-5 right-20 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all cursor-pointer z-50"
                        title="Minimiser"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                </motion.div>

            </div>
        </div>
    );
}
