import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../../context/PlayerContext';
import { CustomMixPlayer } from './CustomMixPlayer';
import { Play, Pause, Maximize2, X, Music, Minimize2, SkipForward, SkipBack } from 'lucide-react';

export function GlobalPlayerContainer() {
    const { 
        activeTrack, 
        closePlayer, 
        isPlaying, 
        togglePlay,
        currentTime,
        duration,
        seekTo
    } = usePlayer();
    const [isMinimized, setIsMinimized] = useState(true);

    // Auto-minimize (open mini-player) on new track/mix change
    useEffect(() => {
        if (activeTrack) {
            setIsMinimized(true);
        }
    }, [activeTrack?.id]);

    // Don't render anything if no track is active
    if (!activeTrack) return null;

    // Parse timestamp to seconds
    const parseTimeToSeconds = (timeStr?: string): number => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return 0;
    };

    // Format seconds
    const formatSeconds = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Track indexing for mini player
    let currentTrackIndexInMini = -1;
    if (activeTrack.tracks && activeTrack.tracks.length > 0) {
        for (let i = 0; i < activeTrack.tracks.length; i++) {
            const startSec = parseTimeToSeconds(activeTrack.tracks[i].time);
            const nextSec = i + 1 < activeTrack.tracks.length ? parseTimeToSeconds(activeTrack.tracks[i+1].time) : Infinity;

            if (currentTime >= startSec && currentTime < nextSec) {
                currentTrackIndexInMini = i;
                break;
            }
        }
    }

    const playPreviousTrackInMini = () => {
        if (!activeTrack.tracks || activeTrack.tracks.length === 0 || currentTrackIndexInMini <= 0) return;
        const targetTrack = activeTrack.tracks[currentTrackIndexInMini - 1];
        const targetSeconds = parseTimeToSeconds(targetTrack.time);
        seekTo(targetSeconds);
    };

    const playNextTrackInMini = () => {
        if (!activeTrack.tracks || activeTrack.tracks.length === 0 || currentTrackIndexInMini >= activeTrack.tracks.length - 1) return;
        const targetTrack = activeTrack.tracks[currentTrackIndexInMini + 1];
        const targetSeconds = parseTimeToSeconds(targetTrack.time);
        seekTo(targetSeconds);
    };

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
                            className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex flex-col gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
                        >
                            {/* Top Row: Info + Buttons */}
                            <div className="flex items-center justify-between gap-3">
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
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-[9px] text-neon-cyan font-black uppercase tracking-widest">
                                                {activeTrack.artist}
                                            </p>
                                            {currentTrackIndexInMini !== -1 && activeTrack.tracks && (
                                                <>
                                                    <span className="text-white/20 text-[9px] font-black">•</span>
                                                    <p className="text-[9px] text-white/50 font-bold uppercase truncate max-w-[120px] italic">
                                                        {activeTrack.tracks[currentTrackIndexInMini].title}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: playback controls */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {activeTrack.tracks && activeTrack.tracks.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playPreviousTrackInMini();
                                            }}
                                            disabled={currentTrackIndexInMini <= 0}
                                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-20 transition-all cursor-pointer"
                                            title="Piste précédente"
                                        >
                                            <SkipBack className="w-4 h-4" />
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePlay();
                                        }}
                                        className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-neon-cyan hover:shadow-[0_0_16px_rgba(0,229,255,0.5)] rounded-full transition-all active:scale-95 cursor-pointer"
                                        title={isPlaying ? 'Pause' : 'Play'}
                                    >
                                        {isPlaying
                                            ? <Pause className="w-4 h-4 fill-black" />
                                            : <Play className="w-4 h-4 fill-black ml-0.5" />
                                        }
                                    </button>

                                    {activeTrack.tracks && activeTrack.tracks.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playNextTrackInMini();
                                            }}
                                            disabled={currentTrackIndexInMini >= activeTrack.tracks.length - 1}
                                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-20 transition-all cursor-pointer"
                                            title="Piste suivante"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="h-8 w-px bg-white/10" />

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMinimized(false);
                                        }}
                                        className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
                                        title="Agrandir"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5 text-white" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closePlayer();
                                        }}
                                        className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all group cursor-pointer"
                                        title="Fermer"
                                    >
                                        <X className="w-3.5 h-3.5 text-white group-hover:text-red-500 transition-colors" />
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Row: Navigation / Timeline Seek Bar */}
                            <div className="flex items-center gap-3 px-1 mt-1 z-10" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-black text-white/40 font-mono tabular-nums">{formatSeconds(currentTime)}</span>
                                <div className="flex-1 relative group cursor-pointer py-2">
                                    <input 
                                        type="range"
                                        min={0}
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={(e) => {
                                            seekTo(parseFloat(e.target.value));
                                        }}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none accent-neon-purple [&::-webkit-slider-runnable-track]:bg-white/10 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-neon-purple [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                                    />
                                    <div 
                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-neon-purple to-neon-cyan rounded-lg pointer-events-none"
                                        style={{
                                            width: `${duration ? (currentTime / duration) * 100 : 0}%`
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-white/40 font-mono tabular-nums">{formatSeconds(duration)}</span>
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
                    animate={{ 
                        opacity: isMinimized ? 0 : 1, 
                        y: isMinimized ? 60 : 0 
                    }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`relative shadow-[0_-20px_60px_rgba(0,0,0,0.8)] rounded-[40px] transition-all duration-300 ${
                        isMinimized
                            ? 'pointer-events-none absolute bottom-0 left-0 right-0 -z-10 h-0 overflow-hidden'
                            : 'relative h-auto'
                    }`}
                >
                    <CustomMixPlayer
                        track={activeTrack}
                        onClose={closePlayer}
                        onMinimize={() => setIsMinimized(true)}
                    />
                </motion.div>

            </div>
        </div>
    );
}
