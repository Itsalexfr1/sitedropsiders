import React, { useState, useEffect, useRef } from 'react';
import { 
    Timer, 
    Play, 
    Pause, 
    RotateCcw, 
    Plus, 
    Bell, 
    BellOff, 
    AlertTriangle, 
    Maximize2, 
    Minimize2,
    Clock,
    Music2
} from 'lucide-react';

interface RadioSpeakerTimerProps {
    trackRemainingSeconds?: number;
    currentTrackTitle?: string;
    onTimerFinished?: () => void;
    compact?: boolean;
}

export function RadioSpeakerTimer({
    trackRemainingSeconds,
    currentTrackTitle,
    onTimerFinished,
    compact = false
}: RadioSpeakerTimerProps) {
    const [mode, setMode] = useState<'countdown' | 'chrono' | 'track_sync'>('countdown');
    const [targetSeconds, setTargetSeconds] = useState<number>(60);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(true);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // AudioContext beep synthétique à la fin
    const playBeep = () => {
        if (!soundAlertEnabled) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch {}
    };

    // Mode synchronisé sur le morceau
    useEffect(() => {
        if (mode === 'track_sync' && typeof trackRemainingSeconds === 'number') {
            setTimeLeft(trackRemainingSeconds);
        }
    }, [mode, trackRemainingSeconds]);

    // Boucle de décompte / chrono
    useEffect(() => {
        if (!isRunning || mode === 'track_sync') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (mode === 'chrono') {
                    return prev + 1;
                } else {
                    // countdown
                    if (prev <= 1) {
                        setIsRunning(false);
                        playBeep();
                        if (onTimerFinished) onTimerFinished();
                        return 0;
                    }
                    if (prev === 11) {
                        // Petit bip préventif à 10s
                        playBeep();
                    }
                    return prev - 1;
                }
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, mode, soundAlertEnabled]);

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);
    const handleReset = () => {
        setIsRunning(false);
        if (mode === 'countdown') {
            setTimeLeft(targetSeconds);
        } else if (mode === 'chrono') {
            setTimeLeft(0);
        } else if (mode === 'track_sync') {
            setTimeLeft(trackRemainingSeconds || 0);
        }
    };

    const handleSetDuration = (sec: number) => {
        setTargetSeconds(sec);
        setTimeLeft(sec);
        setIsRunning(false);
        setMode('countdown');
    };

    const handleAddSeconds = (sec: number) => {
        setTimeLeft(prev => prev + sec);
    };

    // Format mm:ss
    const formatTime = (totalSec: number) => {
        const mins = Math.floor(Math.max(0, totalSec) / 60);
        const secs = Math.max(0, totalSec) % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const isUrgent = mode !== 'chrono' && timeLeft <= 10 && timeLeft > 0;
    const isFinished = mode === 'countdown' && timeLeft === 0;

    // Pourcentage restant
    const progressPercent = mode === 'countdown' && targetSeconds > 0
        ? Math.min(100, Math.max(0, (timeLeft / targetSeconds) * 100))
        : mode === 'track_sync' && trackRemainingSeconds
        ? Math.min(100, Math.max(0, (timeLeft / 240) * 100))
        : 100;

    const content = (
        <div className={`relative rounded-3xl transition-all duration-300 border flex flex-col justify-between overflow-hidden shadow-2xl ${
            isUrgent 
                ? 'bg-gradient-to-br from-red-950/80 via-black to-red-950/60 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.4)] animate-pulse'
                : isFinished
                ? 'bg-gradient-to-br from-amber-950/80 via-black to-red-950/60 border-amber-500'
                : 'bg-[#0d101a]/95 border-white/10'
        } ${compact ? 'p-4' : 'p-6'}`}>
            
            {/* Lueur d'ambiance */}
            <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
                isUrgent ? 'bg-red-500/30' : 'bg-cyan-500/10'
            }`} />

            {/* En-tête */}
            <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border flex items-center justify-center ${
                        isUrgent 
                            ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                            : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    }`}>
                        <Timer className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-display font-black text-white uppercase italic tracking-tight flex items-center gap-1.5">
                            Minuteur Animateur
                            {isUrgent && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500 text-white font-black animate-bounce">
                                    OUTRO &lt; 10s
                                </span>
                            )}
                        </h4>
                        <p className="text-[9px] font-mono text-gray-400">
                            {mode === 'countdown' ? 'Compte à rebours parole' : mode === 'chrono' ? 'Temps d\'intervention' : 'Fin du morceau à l\'antenne'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Alerte sonore */}
                    <button
                        type="button"
                        onClick={() => setSoundAlertEnabled(!soundAlertEnabled)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            soundAlertEnabled 
                                ? 'bg-white/5 border-white/10 text-cyan-300' 
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                        title={soundAlertEnabled ? 'Bip sonore actif à la fin' : 'Bip sonore désactivé'}
                    >
                        {soundAlertEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Mode Plein Écran */}
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={isFullscreen ? 'Réduire' : 'Plein écran studio'}
                    >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Sélecteur de modes */}
            <div className="flex items-center gap-1 p-1 bg-black/60 rounded-xl border border-white/10 mb-4 relative z-10">
                <button
                    type="button"
                    onClick={() => { setMode('countdown'); setTimeLeft(targetSeconds); setIsRunning(false); }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        mode === 'countdown' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Compte à Rebours
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('chrono'); setTimeLeft(0); setIsRunning(false); }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        mode === 'chrono' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Chronomètre
                </button>
                {typeof trackRemainingSeconds === 'number' && (
                    <button
                        type="button"
                        onClick={() => { setMode('track_sync'); setTimeLeft(trackRemainingSeconds); setIsRunning(false); }}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            mode === 'track_sync' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                        title="Se cale sur la fin du morceau en cours"
                    >
                        <Music2 className="w-3 h-3" />
                        <span>Sync Titre</span>
                    </button>
                )}
            </div>

            {/* Affichage Géant du Décompte */}
            <div className="flex flex-col items-center justify-center py-4 relative z-10">
                <div className={`font-mono font-black tracking-widest transition-all ${
                    isFullscreen ? 'text-7xl sm:text-9xl' : compact ? 'text-4xl' : 'text-5xl sm:text-6xl'
                } ${
                    isUrgent ? 'text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]' : isFinished ? 'text-amber-400' : 'text-white'
                }`}>
                    {formatTime(timeLeft)}
                </div>

                {isUrgent && (
                    <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono font-bold mt-1 uppercase tracking-wider animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Fin d'intervention imminente
                    </div>
                )}

                {mode === 'track_sync' && currentTrackTitle && (
                    <div className="text-[10px] font-mono text-gray-400 mt-2 max-w-xs truncate text-center">
                        Titre : <span className="text-cyan-300 font-bold">{currentTrackTitle}</span>
                    </div>
                )}

                {/* Barre de progression fine */}
                {mode === 'countdown' && (
                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-4">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                isUrgent ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Presets rapides (en mode compte à rebours) */}
            {mode === 'countdown' && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 relative z-10">
                    {[15, 30, 45, 60, 120, 180].map(sec => (
                        <button
                            key={sec}
                            type="button"
                            onClick={() => handleSetDuration(sec)}
                            className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                                targetSeconds === sec && !isRunning
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white/5 hover:bg-white/15 border-white/10 text-gray-300'
                            }`}
                        >
                            {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                        </button>
                    ))}
                </div>
            )}

            {/* Boutons d'Action Master */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10 relative z-10">
                {mode !== 'track_sync' ? (
                    <>
                        {isRunning ? (
                            <button
                                type="button"
                                onClick={handlePause}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                            >
                                <Pause className="w-4 h-4 fill-current" />
                                <span>PAUSE</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStart}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>DÉMARRER</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleReset}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-gray-300 hover:text-white transition-all cursor-pointer"
                            title="Réinitialiser"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAddSeconds(15)}
                            className="py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Ajouter 15 secondes"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>15s</span>
                        </button>
                    </>
                ) : (
                    <div className="w-full text-center py-2 text-[10px] font-mono text-cyan-300">
                        ⚡ Synchronisé automatiquement sur l'antenne radio
                    </div>
                )}
            </div>
        </div>
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl p-6 sm:p-12 flex items-center justify-center animate-in fade-in duration-200">
                <div className="w-full max-w-2xl">
                    {content}
                </div>
            </div>
        );
    }

    return content;
}
