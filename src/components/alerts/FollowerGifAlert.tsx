import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';

export const FOLLOWER_GIF_PRESETS = [
    {
        id: 'crowd',
        name: '🎪 Festival Crowd',
        url: 'https://media.giphy.com/media/l41JGlwa1xYhkVczW/giphy.gif',
    },
    {
        id: 'lasers',
        name: '⚡ DJ & Lasers',
        url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    },
    {
        id: 'fireworks',
        name: '🎆 Mainstage Pyro',
        url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    },
    {
        id: 'rave',
        name: '🕺 Rave Party',
        url: 'https://media.giphy.com/media/DhstvI3CH03DO/giphy.gif',
    },
];

export const DEFAULT_FOLLOWER_GIF = FOLLOWER_GIF_PRESETS[0].url;

export function playAlertChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;
        
        // Synth Chime festival (arpège C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            
            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.22, now + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.55);
        });
    } catch {}
}

export interface FollowerGifAlertProps {
    pseudo: string;
    gifUrl?: string;
    durationMs?: number;
    playSound?: boolean;
    size?: 'compact' | 'normal' | 'stream';
    onClose?: () => void;
}

export const FollowerGifAlert: React.FC<FollowerGifAlertProps> = ({
    pseudo,
    gifUrl = DEFAULT_FOLLOWER_GIF,
    durationMs = 5500,
    playSound = true,
    size = 'normal',
    onClose,
}) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (playSound) {
            playAlertChime();
        }

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                onClose?.();
            }
        }, 30);

        return () => clearInterval(interval);
    }, [durationMs, playSound, onClose]);

    const isCompact = size === 'compact';
    const isStream = size === 'stream';

    return (
        <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className={`relative select-none pointer-events-auto ${
                isStream
                    ? 'w-[420px]'
                    : isCompact
                        ? 'w-full max-w-[290px]'
                        : 'w-full max-w-[340px]'
            }`}
        >
            {/* Glowing neon background shadow */}
            <div
                className="absolute -inset-1 rounded-3xl blur-xl opacity-75 animate-pulse transition-all pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(0,240,255,0.6) 0%, rgba(255,0,51,0.5) 70%, transparent 100%)'
                }}
            />

            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-black/95 via-zinc-950/95 to-black/95 border-2 border-cyan-400/70 shadow-[0_0_35px_rgba(0,240,255,0.35)] backdrop-blur-xl">
                {/* GIF Header / Media Area */}
                <div className={`relative w-full ${isCompact ? 'h-32' : isStream ? 'h-52' : 'h-40'} bg-black overflow-hidden`}>
                    <img
                        src={gifUrl || DEFAULT_FOLLOWER_GIF}
                        alt="Nouveau Follower"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to default preset if custom URL breaks
                            (e.target as HTMLImageElement).src = DEFAULT_FOLLOWER_GIF;
                        }}
                    />

                    {/* Gradient Overlay for seamless transition into card body */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

                    {/* Badge "NOUVEAU FOLLOWER" Floating on top */}
                    <div className="absolute top-2.5 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/90 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.8)] border border-white/30">
                        <Heart className="w-3.5 h-3.5 fill-white text-white animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-black">
                            NOUVEAU FOLLOWER
                        </span>
                    </div>

                    {/* Small Live/Sparkle badge */}
                    <div className="absolute top-2.5 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                        <Sparkles className="w-3 h-3 text-neon-red animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">
                            DROPSIDERS
                        </span>
                    </div>
                </div>

                {/* Content Body */}
                <div className={`p-4 text-center ${isCompact ? 'space-y-1' : 'space-y-1.5'}`}>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">🎉</span>
                        <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                            BIENVENUE DANS LA TEAM !
                        </h4>
                        <span className="text-sm">🔥</span>
                    </div>

                    {/* Pseudo in Giant Orbitron / Highlight */}
                    <div className="py-0.5">
                        <span className="text-lg md:text-xl font-display font-black uppercase italic tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]">
                            {pseudo}
                        </span>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        vient de suivre la chaîne Dropsiders
                    </p>
                </div>

                {/* Bottom Countdown Progress Bar */}
                <div className="w-full h-1 bg-white/10 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 via-neon-red to-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

