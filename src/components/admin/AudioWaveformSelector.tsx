import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack } from 'lucide-react';

interface AudioWaveformSelectorProps {
    audioUrl: string;
    startTime: number;
    duration?: number; // snippet duration in seconds, default 30
    onChange: (startTime: number) => void;
}

export function AudioWaveformSelector({ audioUrl, startTime, duration = 30, onChange }: AudioWaveformSelectorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animFrameRef = useRef<number>(0);

    const [waveformData, setWaveformData] = useState<number[]>([]);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Decode audio and extract waveform data
    useEffect(() => {
        if (!audioUrl) return;
        setIsLoading(true);

        const audioContext = new AudioContext();

        fetch(audioUrl)
            .then(res => res.arrayBuffer())
            .then(buffer => audioContext.decodeAudioData(buffer))
            .then(decodedData => {
                setAudioDuration(decodedData.duration);

                // Extract waveform peaks
                const rawData = decodedData.getChannelData(0);
                const samples = 200; // Number of bars
                const blockSize = Math.floor(rawData.length / samples);
                const peaks: number[] = [];

                for (let i = 0; i < samples; i++) {
                    let sum = 0;
                    for (let j = 0; j < blockSize; j++) {
                        sum += Math.abs(rawData[i * blockSize + j]);
                    }
                    peaks.push(sum / blockSize);
                }

                // Normalize peaks
                const maxPeak = Math.max(...peaks);
                const normalized = peaks.map(p => p / maxPeak);
                setWaveformData(normalized);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error decoding audio:', err);
                setIsLoading(false);
            });

        return () => { audioContext.close(); };
    }, [audioUrl]);

    // Create/update audio element for preview
    useEffect(() => {
        if (!audioUrl) return;
        const audio = new Audio(audioUrl);
        audio.preload = 'metadata';
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
            if (!audioDuration) setAudioDuration(audio.duration);
        });

        return () => {
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
    }, [audioUrl]);

    // Playback position animation
    useEffect(() => {
        const animate = () => {
            if (audioRef.current && isPlaying) {
                setCurrentTime(audioRef.current.currentTime);
                // Stop at end of snippet
                if (audioRef.current.currentTime >= startTime + duration) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                }
            }
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isPlaying, startTime, duration]);

    // Draw waveform
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || waveformData.length === 0 || audioDuration === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const barWidth = width / waveformData.length;
        const gap = 1;

        ctx.clearRect(0, 0, width, height);

        // Selection range
        const selStart = (startTime / audioDuration) * width;
        const selEnd = ((startTime + duration) / audioDuration) * width;

        // Draw selection background
        ctx.fillStyle = 'rgba(255, 18, 65, 0.08)';
        ctx.fillRect(selStart, 0, selEnd - selStart, height);

        // Draw each bar
        waveformData.forEach((peak, i) => {
            const x = i * barWidth;
            const barH = Math.max(2, peak * (height * 0.8));
            const y = (height - barH) / 2;

            const inSelection = x >= selStart && x <= selEnd;
            const isAtPlayhead = audioDuration > 0 && Math.abs(x - (currentTime / audioDuration) * width) < barWidth * 2;

            if (isAtPlayhead && isPlaying) {
                ctx.fillStyle = '#ffffff';
            } else if (inSelection) {
                ctx.fillStyle = 'rgba(255, 18, 65, 0.85)';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            }

            ctx.beginPath();
            ctx.roundRect(x + gap / 2, y, Math.max(1, barWidth - gap), barH, 1);
            ctx.fill();
        });

        // Draw selection edges
        ctx.fillStyle = '#ff1241';
        ctx.fillRect(selStart, 0, 2, height);
        ctx.fillRect(selEnd - 2, 0, 2, height);

        // Arrow indicators on edges
        ctx.fillStyle = '#ff1241';
        // Left handle
        ctx.beginPath();
        ctx.roundRect(selStart - 4, height / 2 - 16, 10, 32, 4);
        ctx.fill();
        // Right handle
        ctx.beginPath();
        ctx.roundRect(selEnd - 6, height / 2 - 16, 10, 32, 4);
        ctx.fill();

        // Playhead
        if (isPlaying && currentTime >= startTime && currentTime <= startTime + duration) {
            const playX = (currentTime / audioDuration) * width;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(playX - 1, 0, 2, height);
        }

    }, [waveformData, audioDuration, startTime, duration, currentTime, isPlaying]);

    // Handle click/drag on waveform to set start time
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (!containerRef.current || audioDuration === 0) return;
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        const newStart = Math.max(0, Math.min(ratio * audioDuration - duration / 2, audioDuration - duration));
        onChange(Math.round(newStart));
    }, [audioDuration, duration, onChange]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging || !containerRef.current || audioDuration === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        const newStart = Math.max(0, Math.min(ratio * audioDuration - duration / 2, audioDuration - duration));
        onChange(Math.round(newStart));
    }, [isDragging, audioDuration, duration, onChange]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Preview playback
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.currentTime = startTime;
            audioRef.current.play().catch(e => console.error('Playback error:', e));
            setIsPlaying(true);
        }
    };

    const resetPlayback = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = startTime;
        setCurrentTime(startTime);
        if (isPlaying) {
            audioRef.current.play();
        }
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!audioUrl) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-[9px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse" />
                    Sélection de l'extrait ({duration}s)
                </label>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    {formatTime(startTime)} → {formatTime(startTime + duration)}
                </span>
            </div>

            <div
                ref={containerRef}
                className="relative bg-black/60 border border-white/10 rounded-2xl overflow-hidden cursor-crosshair group"
                style={{ height: 100 }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
                        <span className="ml-3 text-[9px] font-black text-gray-500 uppercase tracking-widest">Analyse audio...</span>
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{ touchAction: 'none' }}
                    />
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 bg-neon-red/20 border border-neon-red/30 rounded-xl flex items-center justify-center text-neon-red hover:bg-neon-red hover:text-white transition-all"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                    type="button"
                    onClick={resetPlayback}
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                    <SkipBack className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                        Durée totale : {formatTime(audioDuration)}
                    </span>
                    <div className="h-3 w-px bg-white/10" />
                    <span className="text-[8px] font-black text-neon-red uppercase tracking-widest whitespace-nowrap">
                        Extrait : {formatTime(startTime)} – {formatTime(Math.min(startTime + duration, audioDuration))}
                    </span>
                </div>
            </div>

            {/* Fine tuning */}
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min={0}
                    max={Math.max(0, audioDuration - duration)}
                    value={startTime}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-red [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-red [&::-webkit-slider-thumb]:shadow-[0_0_10px_#ff1241] [&::-webkit-slider-thumb]:cursor-grab"
                />
            </div>
        </div>
    );
}
