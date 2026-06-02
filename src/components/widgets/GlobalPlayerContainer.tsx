import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../../context/PlayerContext';
import { CustomMixPlayer } from './CustomMixPlayer';
import { Play, Pause, Maximize2, X, Music, Minimize2, SkipForward, SkipBack, Sparkles } from 'lucide-react';
import { ExportSuccessModal } from '../ExportSuccessModal';

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
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [storyProgress, setStoryProgress] = useState(0);
    const [toastMessage, setToastMessage] = useState('');
    
    // ExportSuccessModal state
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportBlob, setExportBlob] = useState<Blob | null>(null);
    const [exportUrl, setExportUrl] = useState('');
    const [exportFilename, setExportFilename] = useState('');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4500);
    };

    const generateMiniStory = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeTrack) return;

        const shareUrl = `https://dropsiders.fr/profil?tab=mixes&play=${activeTrack.id}`;

        if (isGeneratingStory) return;
        setIsGeneratingStory(true);
        setStoryProgress(0);

        // ── Step 1: Copy link to clipboard immediately ──
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                showToast("Lien de partage copié dans le presse-papiers ! 🔗");
            }
        } catch (_) {}

        // Notify user about generation start
        showToast("Enregistrement de la Story (30s) en cours... Laissez jouer la musique 🎧");

        try {
            const CLIP_SEC = 30;
            const FPS = 30;
            const TOTAL_FRAMES = CLIP_SEC * FPS;

            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d')!;

            // ── Capture audio from the <audio> element in the DOM using a cached window context ──
            const audioEl = document.querySelector('audio') as HTMLAudioElement | null;
            let audioCtx: AudioContext | null = null;
            let analyser: AnalyserNode | null = null;
            const videoStream = canvas.captureStream(FPS);

            if (audioEl) {
                try {
                    const Win = window as any;
                    // Check if we need to initialize or recreate the AudioContext for this element
                    if (!Win.__dropsidersAudioCtx || Win.__dropsidersAudioEl !== audioEl) {
                        if (Win.__dropsidersAudioCtx) {
                            try { Win.__dropsidersAudioCtx.close(); } catch (_) {}
                        }

                        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                        audioCtx = new AudioContextClass();
                        const src = audioCtx.createMediaElementSource(audioEl);
                        const dest = audioCtx.createMediaStreamDestination();
                        analyser = audioCtx.createAnalyser();
                        analyser.fftSize = 64; // 32 frequency bins

                        src.connect(audioCtx.destination); // Keep outputting sound to speakers
                        src.connect(dest);
                        src.connect(analyser);

                        Win.__dropsidersAudioCtx = audioCtx;
                        Win.__dropsidersAudioSource = src;
                        Win.__dropsidersAudioDest = dest;
                        Win.__dropsidersAudioAnalyser = analyser;
                        Win.__dropsidersAudioEl = audioEl;
                    } else {
                        audioCtx = Win.__dropsidersAudioCtx;
                        analyser = Win.__dropsidersAudioAnalyser;
                    }

                    if (audioCtx && audioCtx.state === 'suspended') {
                        await audioCtx.resume();
                    }

                    const dest = Win.__dropsidersAudioDest;
                    if (dest) {
                        dest.stream.getAudioTracks().forEach((t: MediaStreamTrack) => videoStream.addTrack(t));
                    }
                } catch (err) {
                    console.error('Audio capture setup failed:', err);
                }
            }

            // ── Pick best mimeType: MP4 on iOS, WebM on desktop ──
            let mimeType = 'video/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp9,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

            const chunks: Blob[] = [];
            const recorder = new MediaRecorder(videoStream, mimeType ? { mimeType } : undefined);
            recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };

            recorder.onstop = async () => {
                const isMP4 = mimeType.startsWith('video/mp4');
                const blob = new Blob(chunks, { type: isMP4 ? 'video/mp4' : 'video/webm' });
                const ext = isMP4 ? 'mp4' : 'webm';
                const safeTitle = activeTrack.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
                const fileName = `Dropsiders_Story_${safeTitle}.${ext}`;
                const url = URL.createObjectURL(blob);

                setExportBlob(blob);
                setExportUrl(url);
                setExportFilename(fileName);
                setShowExportModal(true);

                setIsGeneratingStory(false);
                setStoryProgress(0);
            };

            // ── Animation state ──
            let frame = 0;
            let rotation = 0;
            const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
            let barHeights = new Array(32).fill(0).map(() => Math.random() * 50 + 20);

            const drawFrame = () => {
                if (frame >= TOTAL_FRAMES) { recorder.stop(); return; }
                rotation += 0.04;

                // Update frequency analyzer data
                if (analyser && dataArray) {
                    analyser.getByteFrequencyData(dataArray);
                }

                // ── Background ──
                const grad = ctx.createLinearGradient(0, 0, 0, 1920);
                grad.addColorStop(0, '#1a0035'); grad.addColorStop(0.5, '#0d0022'); grad.addColorStop(1, '#050505');
                ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920);

                // Grid
                ctx.strokeStyle = 'rgba(168,85,247,0.05)'; ctx.lineWidth = 1;
                for (let x = 0; x < 1080; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke(); }
                for (let y = 0; y < 1920; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); }

                // Glow orb
                const glow = ctx.createRadialGradient(540, 900, 0, 540, 900, 500);
                glow.addColorStop(0, 'rgba(168,85,247,0.28)'); glow.addColorStop(0.6, 'rgba(168,85,247,0.05)'); glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 1920);

                // ── TOP PLACEHOLDER FOR LINK STICKER ──
                ctx.save();
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 4;
                ctx.setLineDash([15, 10]); // dashed pattern
                ctx.lineDashOffset = -frame * 0.8; // marching ants animation effect
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 18;
                
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                    (ctx as any).roundRect(140, 70, 800, 110, 55);
                } else {
                    ctx.rect(140, 70, 800, 110);
                }
                ctx.stroke();
                ctx.restore();

                // Faint fill inside
                ctx.fillStyle = 'rgba(168, 85, 247, 0.04)';
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                    (ctx as any).roundRect(140, 70, 800, 110, 55);
                } else {
                    ctx.rect(140, 70, 800, 110);
                }
                ctx.fill();

                // Instruction text inside placeholder
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 26px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🔗   PLACE TON STICKER LIEN ICI   🔗', 540, 136);

                // ── HEADER ──
                ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 35;
                ctx.fillStyle = '#ffffff'; ctx.font = 'italic bold 90px Arial'; ctx.textAlign = 'center';
                ctx.fillText('DROPSIDERS', 540, 330); ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = 'bold 21px Arial';
                ctx.fillText('LIVE RECORD MIX', 540, 375);

                // ── ROTATING VINYL ──
                const cX = 540, cY = 900;
                ctx.save();
                ctx.translate(cX, cY); ctx.rotate(rotation); ctx.translate(-cX, -cY);
                // Outer disc
                ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 80;
                ctx.beginPath(); ctx.arc(cX, cY, 320, 0, Math.PI * 2); ctx.fillStyle = '#08000f'; ctx.fill();
                ctx.shadowBlur = 0;
                // Grooves
                ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 2;
                for (let r = 90; r < 300; r += 20) { ctx.beginPath(); ctx.arc(cX, cY, r, 0, Math.PI * 2); ctx.stroke(); }
                // Neon edge arcs
                ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 8;
                ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 32;
                ctx.beginPath(); ctx.arc(cX, cY, 312, 0.3, 1.9); ctx.stroke();
                ctx.beginPath(); ctx.arc(cX, cY, 312, 0.3 + Math.PI, 1.9 + Math.PI); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
                // Center label (static)
                const lg = ctx.createRadialGradient(cX, cY, 0, cX, cY, 95);
                lg.addColorStop(0, '#7c3aed'); lg.addColorStop(1, '#4c1d95');
                ctx.beginPath(); ctx.arc(cX, cY, 95, 0, Math.PI * 2); ctx.fillStyle = lg; ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'italic bold 52px Arial'; ctx.textAlign = 'center';
                ctx.fillText('DS', cX, cY + 19);

                // ── ANIMATED WAVEFORM (REACTIVE) ──
                const totalBars = 32, wsx = 120, wex = 960, wy = 1330;
                const wgap = (wex - wsx) / totalBars;
                ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 16;
                for (let i = 0; i < totalBars; i++) {
                    let barH = 20;
                    if (dataArray) {
                        const val = dataArray[i]; // 0-255
                        barH = (val / 255) * 160 + 15;
                    } else {
                        // fallback pseudo random wave
                        barHeights[i] += (Math.random() - 0.5) * 16;
                        barHeights[i] = Math.max(15, Math.min(150, barHeights[i]));
                        barH = barHeights[i];
                    }
                    ctx.fillRect(wsx + i * wgap, wy - barH / 2, 14, barH);
                }
                ctx.shadowBlur = 0;

                // ── PROGRESS BAR ──
                const prog = frame / TOTAL_FRAMES;
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                    (ctx as any).roundRect(120, 1380, 840, 6, 3);
                } else {
                    ctx.rect(120, 1380, 840, 6);
                }
                ctx.fill();

                ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 8;
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                    (ctx as any).roundRect(120, 1380, 840 * prog, 6, 3);
                } else {
                    ctx.rect(120, 1380, 840 * prog, 6);
                }
                ctx.fill();
                ctx.shadowBlur = 0;

                // ── METADATA CARD ──
                const mY = 1430;
                ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.strokeStyle = 'rgba(168,85,247,0.25)'; ctx.lineWidth = 2;
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                    (ctx as any).roundRect(60, mY, 960, 280, 44);
                } else {
                    ctx.rect(60, mY, 960, 280);
                }
                ctx.fill(); ctx.stroke();

                ctx.fillStyle = '#a855f7'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
                ctx.fillText('🎧 EN ÉCOUTE SUR DROPSIDERS', 540, mY + 48);
                const dispTitle = activeTrack.title.length > 22 ? activeTrack.title.substring(0, 20) + '…' : activeTrack.title;
                ctx.fillStyle = '#ffffff'; ctx.font = 'italic bold 56px Arial';
                ctx.fillText(dispTitle, 540, mY + 142);
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 28px Arial';
                ctx.fillText(`Par ${activeTrack.artist}`, 540, mY + 202);
                ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = 'bold 20px Arial';
                ctx.fillText('dropsiders.fr', 540, mY + 256);

                frame++;
                setStoryProgress(Math.round((frame / TOTAL_FRAMES) * 100));
                requestAnimationFrame(drawFrame);
            };

            recorder.start(200);
            drawFrame();

        } catch (err) {
            console.error('Story gen error', err);
            setIsGeneratingStory(false);
            setStoryProgress(0);
            showToast("Erreur lors de la génération de la Story.");
        }
    };

    // Auto-minimize (open mini-player) on new track/mix change
    useEffect(() => {
        if (activeTrack) {
            setIsMinimized(true);
        }
    }, [activeTrack?.id]);

    // Don't render anything if no track is active
    if (!activeTrack) return null;

    const shareUrl = `https://dropsiders.fr/profil?tab=mixes&play=${activeTrack.id}`;

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
        <>
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

                                        {/* Separator */}
                                        <div className="h-8 w-px bg-white/10" />

                                        {/* Story button — génère vidéo animée 30s MP4/WebM + audio + ouvre share sheet iOS */}
                                        <button
                                            onClick={generateMiniStory}
                                            disabled={isGeneratingStory}
                                            className="h-9 px-3 flex items-center gap-1.5 bg-gradient-to-r from-purple-900/60 to-fuchsia-900/60 hover:from-purple-800/80 hover:to-fuchsia-800/80 border border-fuchsia-500/30 hover:border-fuchsia-400/60 rounded-xl transition-all cursor-pointer disabled:opacity-50 group/story"
                                            title="Partager en Story Instagram (vidéo 30s animée)"
                                        >
                                            {isGeneratingStory
                                                ? <div className="w-3.5 h-3.5 border-2 border-fuchsia-400 border-t-transparent rounded-full animate-spin" />
                                                : <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 group-hover/story:text-white transition-colors" />
                                            }
                                            <span className="text-[9px] font-black uppercase tracking-wider text-fuchsia-300 group-hover/story:text-white transition-colors">
                                                {isGeneratingStory ? `${storyProgress}%` : 'Story'}
                                            </span>
                                        </button>

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

            {/* Direct Toast Alerts for story generation / copy status */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 bg-black/90 border border-neon-cyan/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center gap-3 text-neon-cyan text-xs font-black uppercase tracking-widest pointer-events-auto"
                    >
                        <Sparkles className="w-4 h-4 animate-spin-slow text-neon-cyan" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <ExportSuccessModal 
                isOpen={showExportModal && !!exportBlob} 
                onClose={() => {
                    if (exportUrl) URL.revokeObjectURL(exportUrl);
                    setExportBlob(null);
                    setExportUrl('');
                    setShowExportModal(false);
                }}
                readyBlob={exportBlob}
                readyUrl={exportUrl}
                filename={exportFilename}
                type="video"
                title="STORY PRÊTE !"
                subtitle="Partagez-la sur vos réseaux"
                shareUrl={shareUrl}
                shareText={`"${activeTrack.title}" par ${activeTrack.artist}\n🎧 Écoute sur dropsiders.fr`}
            />
        </>
    );
}
