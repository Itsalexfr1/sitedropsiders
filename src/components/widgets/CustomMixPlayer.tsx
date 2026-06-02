import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
    Share2, Disc, ExternalLink, X, Clock, Sparkles, 
    Download, Video, Layers, Instagram, Twitter 
} from 'lucide-react';

interface TrackItem {
    title: string;
    artist: string;
    time?: string;
}

interface MixTrack {
    id: string;
    title: string;
    artist: string;
    label?: string;
    event?: string;
    url: string;
    embedUrl?: string;
    tracks?: TrackItem[];
}

interface CustomMixPlayerProps {
    track: MixTrack;
    onClose: () => void;
}

// Custom hook to load external scripts dynamically
function useScript(src: string) {
    const [status, setStatus] = useState(src ? "loading" : "idle");

    useEffect(() => {
        if (!src) {
            setStatus("idle");
            return;
        }

        let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;

        if (!script) {
            script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.setAttribute("data-status", "loading");
            document.body.appendChild(script);

            const setAttributeStatus = (event: Event) => {
                script.setAttribute(
                    "data-status",
                    event.type === "load" ? "ready" : "error"
                );
            };

            script.addEventListener("load", setAttributeStatus);
            script.addEventListener("error", setAttributeStatus);
        } else {
            setStatus(script.getAttribute("data-status") || "ready");
        }

        const setStateStatus = (event: Event) => {
            setStatus(event.type === "load" ? "ready" : "error");
        };

        script.addEventListener("load", setStateStatus);
        script.addEventListener("error", setStateStatus);

        return () => {
            if (script) {
                script.removeEventListener("load", setStateStatus);
                script.removeEventListener("error", setStateStatus);
            }
        };
    }, [src]);

    return status;
}

// Convert timestamp (e.g., "05:30" or "01:20:10") to seconds
function parseTimeToSeconds(timeStr?: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
}

// Format seconds to digital clock time (e.g., "05:30")
function formatSeconds(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function CustomMixPlayer({ track, onClose }: CustomMixPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [toastMessage, setToastMessage] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [storyTheme, setStoryTheme] = useState<'sunset' | 'acid' | 'void'>('sunset');
    const [copiedLink, setCopiedLink] = useState(false);

    // Refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const scWidgetRef = useRef<any>(null);
    const ytPlayerRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const visualizerIntervalRef = useRef<any>(null);
    const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(16).fill(5));

    // Load SoundCloud & YouTube scripts
    const isSoundCloud = !!track.embedUrl?.includes('soundcloud.com');
    const isYouTube = !!(track.embedUrl?.includes('youtube.com') || track.embedUrl?.includes('youtu.be'));
    const isHTML5 = !isSoundCloud && !isYouTube;
    
    const scStatus = useScript(isSoundCloud ? 'https://w.soundcloud.com/player/api.js' : '');
    const ytStatus = useScript(isYouTube ? 'https://www.youtube.com/iframe_api' : '');

    // Initialize HTML5 Audio Controller
    useEffect(() => {
        if (isHTML5 && track.url) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            const audio = new Audio(track.url);
            audioRef.current = audio;
            audio.volume = volume / 100;
            audio.muted = isMuted;

            const handlePlay = () => setIsPlaying(true);
            const handlePause = () => setIsPlaying(false);
            const handleEnded = () => setIsPlaying(false);
            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
            };
            const handleDurationChange = () => {
                setDuration(audio.duration || 0);
            };

            audio.addEventListener('play', handlePlay);
            audio.addEventListener('pause', handlePause);
            audio.addEventListener('ended', handleEnded);
            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('durationchange', handleDurationChange);

            if (isPlaying) {
                audio.play().catch(() => setIsPlaying(false));
            }

            return () => {
                audio.removeEventListener('play', handlePlay);
                audio.removeEventListener('pause', handlePause);
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('durationchange', handleDurationChange);
                audio.pause();
                audio.src = "";
                audioRef.current = null;
            };
        }
    }, [isHTML5, track.url]);


    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    // Initialize API controllers once scripts are ready
    useEffect(() => {
        let scTimer: any;
        
        if (isSoundCloud && scStatus === 'ready' && iframeRef.current) {
            const SC = (window as any).SC;
            if (SC && SC.Widget) {
                try {
                    const widget = SC.Widget(iframeRef.current);
                    scWidgetRef.current = widget;

                    widget.bind(SC.Widget.Events.READY, () => {
                        widget.getDuration((d: number) => setDuration(d / 1000));
                        widget.setVolume(isMuted ? 0 : volume);
                    });

                    widget.bind(SC.Widget.Events.PLAY, () => setIsPlaying(true));
                    widget.bind(SC.Widget.Events.PAUSE, () => setIsPlaying(false));
                    widget.bind(SC.Widget.Events.FINISH, () => setIsPlaying(false));

                    widget.bind(SC.Widget.Events.PLAY_PROGRESS, (progress: any) => {
                        setCurrentTime(progress.currentPosition / 1000);
                        if (progress.relativePosition === 0) return;
                        widget.getDuration((d: number) => setDuration(d / 1000));
                    });
                } catch (e) {
                    console.error("SC widget bindings error", e);
                }
            }
        }

        // Clean up on unmount or track change
        return () => {
            if (scTimer) clearTimeout(scTimer);
            if (scWidgetRef.current && (window as any).SC) {
                try {
                    const SC = (window as any).SC;
                    scWidgetRef.current.unbind(SC.Widget.Events.PLAY);
                    scWidgetRef.current.unbind(SC.Widget.Events.PAUSE);
                    scWidgetRef.current.unbind(SC.Widget.Events.PLAY_PROGRESS);
                    scWidgetRef.current.unbind(SC.Widget.Events.FINISH);
                } catch (e) {}
            }
        };
    }, [isSoundCloud, scStatus, track.embedUrl]);

    // Handle YouTube Iframe Player
    const iframeId = `yt-iframe-${track.id}`;
    useEffect(() => {
        let ytTimer: any;
        
        if (isYouTube && ytStatus === 'ready' && iframeRef.current) {
            // Check if YT is defined
            const initYTPlayer = () => {
                if (!(window as any).YT || !(window as any).YT.Player) {
                    ytTimer = setTimeout(initYTPlayer, 200);
                    return;
                }
                
                try {
                    ytPlayerRef.current = new (window as any).YT.Player(iframeId, {
                        events: {
                            onReady: (event: any) => {
                                setDuration(event.target.getDuration() || 0);
                                event.target.setVolume(isMuted ? 0 : volume);
                            },
                            onStateChange: (event: any) => {
                                const YT = (window as any).YT;
                                if (event.data === YT.PlayerState.PLAYING) {
                                    setIsPlaying(true);
                                } else if (event.data === YT.PlayerState.PAUSED) {
                                    setIsPlaying(false);
                                } else if (event.data === YT.PlayerState.ENDED) {
                                    setIsPlaying(false);
                                }
                            }
                        }
                    });

                    // Set up interval to track YT current time
                    const checkTimeInterval = setInterval(() => {
                        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime && isPlaying) {
                            setCurrentTime(ytPlayerRef.current.getCurrentTime());
                            setDuration(ytPlayerRef.current.getDuration() || 0);
                        }
                    }, 500);

                    return () => clearInterval(checkTimeInterval);
                } catch (e) {
                    console.error("YT Player binding error", e);
                }
            };
            
            initYTPlayer();
        }

        return () => {
            if (ytTimer) clearTimeout(ytTimer);
        };
    }, [isYouTube, ytStatus, iframeId, isPlaying, track.embedUrl]);

    // Auto-check which track is playing based on timestamps
    useEffect(() => {
        if (!track.tracks || track.tracks.length === 0) return;

        let detectedIndex = -1;
        for (let i = 0; i < track.tracks.length; i++) {
            const startSec = parseTimeToSeconds(track.tracks[i].time);
            const nextSec = i + 1 < track.tracks.length ? parseTimeToSeconds(track.tracks[i+1].time) : Infinity;

            if (currentTime >= startSec && currentTime < nextSec) {
                detectedIndex = i;
                break;
            }
        }
        
        if (detectedIndex !== currentTrackIndex) {
            setCurrentTrackIndex(detectedIndex);
        }
    }, [currentTime, track.tracks, currentTrackIndex]);

    // Check if timestamp parameters are passed in URL on load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tParam = params.get('t');
        if (tParam) {
            const initialSeconds = parseInt(tParam, 10);
            if (!isNaN(initialSeconds) && initialSeconds > 0) {
                // Seek player once initialized
                setTimeout(() => {
                    handleSeekToSeconds(initialSeconds);
                    showToast(`Lecture démarrée à ${formatSeconds(initialSeconds)} ! 🚀`);
                }, 1800);
            }
        }
    }, []);

    // Visualizer simulation interval
    useEffect(() => {
        if (isPlaying) {
            visualizerIntervalRef.current = setInterval(() => {
                setVisualizerBars(prev => prev.map(() => Math.floor(Math.random() * 32) + 4));
            }, 100);
        } else {
            if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
            // Settle down smoothly
            setVisualizerBars(new Array(16).fill(4));
        }

        return () => {
            if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
        };
    }, [isPlaying]);

    // Control triggers
    const togglePlay = () => {
        if (isSoundCloud && scWidgetRef.current) {
            scWidgetRef.current.toggle();
        } else if (isYouTube && ytPlayerRef.current) {
            if (isPlaying) {
                ytPlayerRef.current.pauseVideo();
            } else {
                ytPlayerRef.current.playVideo();
            }
        } else if (isHTML5 && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(() => setIsPlaying(false));
            }
        } else {
            // Fallback simulated toggle if APIs are blocked or loading
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeekToSeconds = (seconds: number) => {
        setCurrentTime(seconds);
        if (isSoundCloud && scWidgetRef.current) {
            scWidgetRef.current.seekTo(seconds * 1000);
        } else if (isYouTube && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(seconds, true);
        } else if (isHTML5 && audioRef.current) {
            audioRef.current.currentTime = seconds;
        }
    };

    const handleVolumeChange = (newVal: number) => {
        setVolume(newVal);
        setIsMuted(newVal === 0);
        if (isSoundCloud && scWidgetRef.current) {
            scWidgetRef.current.setVolume(newVal);
        } else if (isYouTube && ytPlayerRef.current) {
            ytPlayerRef.current.setVolume(newVal);
        } else if (isHTML5 && audioRef.current) {
            audioRef.current.volume = newVal / 100;
            audioRef.current.muted = newVal === 0;
        }
    };

    const toggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        const targetVolume = nextMuted ? 0 : volume;
        if (isSoundCloud && scWidgetRef.current) {
            scWidgetRef.current.setVolume(targetVolume);
        } else if (isYouTube && ytPlayerRef.current) {
            if (nextMuted) ytPlayerRef.current.mute();
            else {
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.setVolume(volume);
            }
        } else if (isHTML5 && audioRef.current) {
            audioRef.current.muted = nextMuted;
        }
    };


    const playPreviousTrack = () => {
        if (!track.tracks || track.tracks.length === 0 || currentTrackIndex <= 0) return;
        const targetTrack = track.tracks[currentTrackIndex - 1];
        const targetSeconds = parseTimeToSeconds(targetTrack.time);
        handleSeekToSeconds(targetSeconds);
    };

    const playNextTrack = () => {
        if (!track.tracks || track.tracks.length === 0 || currentTrackIndex >= track.tracks.length - 1) return;
        const targetTrack = track.tracks[currentTrackIndex + 1];
        const targetSeconds = parseTimeToSeconds(targetTrack.time);
        handleSeekToSeconds(targetSeconds);
    };

    // Generating Snippet Logic
    const [selectedSnippet, setSelectedSnippet] = useState<{ trackName: string; artist: string; timeStr: string; seconds: number } | null>(null);

    const generateRandomSnippet = () => {
        if (!track.tracks || track.tracks.length === 0) {
            // If no tracklist, select a random second based on duration
            const maxSeconds = duration > 60 ? duration - 30 : 60;
            const randomSec = Math.floor(Math.random() * maxSeconds);
            setSelectedSnippet({
                trackName: track.title,
                artist: track.artist,
                timeStr: formatSeconds(randomSec),
                seconds: randomSec
            });
            return;
        }

        // Pick a random track from the tracklist
        const randomIndex = Math.floor(Math.random() * track.tracks.length);
        const selected = track.tracks[randomIndex];
        const seconds = parseTimeToSeconds(selected.time);

        setSelectedSnippet({
            trackName: selected.title,
            artist: selected.artist,
            timeStr: selected.time || "00:00",
            seconds: seconds
        });
    };

    useEffect(() => {
        if (showShareModal) {
            generateRandomSnippet();
        }
    }, [showShareModal]);

    // Copy magic link to clipboard
    const getShareUrl = () => {
        const seconds = selectedSnippet ? selectedSnippet.seconds : 0;
        return `${window.location.origin}${window.location.pathname}?play=${track.id}&t=${seconds}`;
    };

    const copyShareLink = () => {
        const url = getShareUrl();
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        showToast("Lien d'extrait copié ! Prêt à être inséré en sticker Story ! 🔗🔥");
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const shareOnTwitter = () => {
        const snippetInfo = selectedSnippet ? `"${selectedSnippet.trackName}"` : "un extrait de folie";
        const text = encodeURIComponent(`J'écoute le mix "${track.title}" de ${track.artist} sur Dropsiders ! 🎧🔥 Écoute cet extrait à ${selectedSnippet?.timeStr} (${snippetInfo}) :`);
        const url = encodeURIComponent(getShareUrl());
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };

    // Generate Vertical 9:16 Instagram Video Story Card
    const generateInstagramStoryVideo = async () => {
        if (!selectedSnippet) return;
        setIsGeneratingVideo(true);
        setVideoProgress(5);

        try {
            // Setup canvas
            const canvas = document.createElement('canvas');
            canvas.width = 720;
            canvas.height = 1280;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context");

            // Animation values
            let rotation = 0;
            let barOffsets = new Array(24).fill(0).map(() => Math.random() * 50);

            // Record media stream from canvas
            const stream = canvas.captureStream(30); // 30 FPS
            
            // Check compatible video mime types
            let mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = '';
            }

            const chunks: Blob[] = [];
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const videoUrl = URL.createObjectURL(blob);
                
                // Download
                const a = document.createElement('a');
                a.href = videoUrl;
                a.download = `Dropsiders_Snippet_${track.title.replace(/\s+/g, '_')}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setIsGeneratingVideo(false);
                copyShareLink(); // Automatically copy magic link
                showToast("Story Card Téléchargée ! Lien magique copié dans le presse-papiers ! 🎥✨");
            };

            // Start recording
            recorder.start();

            // Set up animation frames (5 seconds = 150 frames)
            let currentFrame = 0;
            const totalFrames = 150;

            const drawFrame = () => {
                if (currentFrame >= totalFrames) {
                    recorder.stop();
                    return;
                }

                // 1. Draw gradient background
                const grad = ctx.createLinearGradient(0, 0, 0, 1280);
                if (storyTheme === 'sunset') {
                    grad.addColorStop(0, '#ff0055');
                    grad.addColorStop(0.5, '#7a00ff');
                    grad.addColorStop(1, '#050515');
                } else if (storyTheme === 'acid') {
                    grad.addColorStop(0, '#39ff14');
                    grad.addColorStop(0.5, '#00e5ff');
                    grad.addColorStop(1, '#050515');
                } else {
                    grad.addColorStop(0, '#150030');
                    grad.addColorStop(0.5, '#0c001c');
                    grad.addColorStop(1, '#020205');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 720, 1280);

                // Grid background effect
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.lineWidth = 1;
                for (let x = 0; x < 720; x += 40) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, 1280);
                    ctx.stroke();
                }
                for (let y = 0; y < 1280; y += 40) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(720, y);
                    ctx.stroke();
                }

                // 2. Draw dropsiders logo glow / title header
                ctx.shadowColor = 'rgba(255, 0, 85, 0.5)';
                ctx.shadowBlur = 20;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'black italic 42px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('DROPSIDERS', 360, 150);
                
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = 'bold uppercase tracking-[0.4em] 16px sans-serif';
                ctx.fillText('LIVE RECORD MIX', 360, 190);

                // 3. Draw Vinyl Deck (Rotating)
                rotation += 0.05;
                const cX = 360;
                const cY = 560;
                
                // Vinyl outer shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                ctx.shadowBlur = 40;
                ctx.beginPath();
                ctx.arc(cX, cY, 235, 0, Math.PI * 2);
                ctx.fillStyle = '#050505';
                ctx.fill();
                ctx.shadowBlur = 0;

                // Grooves
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.lineWidth = 2;
                for (let r = 80; r < 220; r += 15) {
                    ctx.beginPath();
                    ctx.arc(cX, cY, r, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Neon vinyl edge indicator
                ctx.strokeStyle = storyTheme === 'acid' ? '#39ff14' : '#ff0055';
                ctx.lineWidth = 4;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(cX, cY, 230, rotation, rotation + 1.2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(cX, cY, 230, rotation + Math.PI, rotation + Math.PI + 1.2);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Central sticker (static)
                ctx.beginPath();
                ctx.arc(cX, cY, 70, 0, Math.PI * 2);
                ctx.fillStyle = '#ff0033';
                ctx.fill();

                // Logo inside central sticker (rotated)
                ctx.save();
                ctx.translate(cX, cY);
                ctx.rotate(-rotation);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'black italic 24px "Outfit", sans-serif';
                ctx.fillText('DS', 0, 8);
                ctx.restore();

                // 4. Draw wave visualizer under vinyl
                const totalBars = 24;
                const startX = 140;
                const endX = 580;
                const waveY = 880;
                const gap = (endX - startX) / totalBars;
                
                ctx.fillStyle = storyTheme === 'void' ? '#a855f7' : storyTheme === 'acid' ? '#00e5ff' : '#ffffff';
                ctx.shadowColor = ctx.fillStyle as string;
                for (let i = 0; i < totalBars; i++) {
                    // Bouncing simulation
                    barOffsets[i] += (Math.random() - 0.5) * 20;
                    barOffsets[i] = Math.max(5, Math.min(120, barOffsets[i]));
                    const barHeight = barOffsets[i];
                    
                    ctx.shadowBlur = 10;
                    ctx.fillRect(startX + i * gap, waveY - barHeight / 2, 8, barHeight);
                }
                ctx.shadowBlur = 0;

                // 5. Draw Metadata block (Glassmorphic look)
                const metadataY = 960;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(80, metadataY, 560, 210, 32);
                ctx.fill();
                ctx.stroke();

                // Now Playing label
                ctx.fillStyle = storyTheme === 'acid' ? '#39ff14' : '#ff0055';
                ctx.font = 'black uppercase tracking-[0.2em] 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🎵 NOW SHARING SNIPPET', 360, metadataY + 40);

                // Mix name
                ctx.fillStyle = '#ffffff';
                ctx.font = 'black uppercase italic tracking-tighter 28px "Outfit", sans-serif';
                ctx.fillText(track.title.substring(0, 24), 360, metadataY + 85);

                // Selected Track Details
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = 'bold uppercase tracking-wide 15px sans-serif';
                ctx.fillText(`Piste : ${selectedSnippet.trackName.substring(0, 32)}`, 360, metadataY + 128);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = 'bold tracking-[0.25em] 11px sans-serif';
                ctx.fillText(`EXTRAIT À L'ÉCOUTE À ${selectedSnippet.timeStr}`, 360, metadataY + 165);

                // Footer instructions
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = 'bold uppercase tracking-[0.3em] 10px sans-serif';
                ctx.fillText('dropsiders.fr • tap sticker to listen', 360, 1220);

                // Progress update
                currentFrame++;
                setVideoProgress(Math.floor((currentFrame / totalFrames) * 100));
                
                requestAnimationFrame(drawFrame);
            };

            // Start animation loop
            drawFrame();

        } catch (e) {
            console.error("Video creation error", e);
            showToast("Impossible d'exporter la vidéo sur votre navigateur.");
            setIsGeneratingVideo(false);
        }
    };

    const hasTracklist = !!(track.tracks && track.tracks.length > 0);

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
            <div className={hasTracklist ? "grid grid-cols-1 lg:grid-cols-12" : "w-full"}>
                
                {/* TRACKLIST COLUMN (LEFT - 5 cols) */}
                {hasTracklist && (
                    <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 h-[400px] lg:h-[620px]">
                        <div className="space-y-6 overflow-hidden flex flex-col flex-1">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-neon-cyan font-black uppercase text-[9px] tracking-[0.3em]">MIX TRACKLIST</span>
                                    <h4 className="text-white text-2xl font-black italic uppercase tracking-tighter leading-none mt-1">Complete Set</h4>
                                </div>
                                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5 text-[8px] font-black text-white/50 uppercase tracking-widest">
                                    <Clock className="w-3 h-3 text-neon-cyan" />
                                    {track.tracks ? `${track.tracks.length} PISTES` : "1 PISTE"}
                                </div>
                            </div>

                            {/* List container */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-0.5 custom-scrollbar">
                                {track.tracks && track.tracks.length > 0 ? (
                                    track.tracks.map((t, idx) => {
                                        const isCurrent = idx === currentTrackIndex;
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => {
                                                    const secs = parseTimeToSeconds(t.time);
                                                    handleSeekToSeconds(secs);
                                                    showToast(`Saut à : ${t.title} (${t.time})`);
                                                }}
                                                className={`flex items-center gap-4 py-3 px-4 rounded-2xl cursor-pointer border transition-all group ${
                                                    isCurrent 
                                                    ? 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(0,229,255,0.05)]' 
                                                    : 'bg-transparent border-transparent hover:bg-white/[0.02] text-white/60 hover:text-white hover:border-white/5'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-black w-6 text-center ${isCurrent ? 'text-neon-cyan' : 'text-white/20'}`}>
                                                    {(idx + 1).toString().padStart(2, '0')}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black uppercase tracking-tight truncate">
                                                        {t.title}
                                                    </p>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{t.artist}</p>
                                                </div>
                                                {t.time && (
                                                    <span className={`text-[9px] font-black tabular-nums border px-2 py-0.5 rounded-lg ${
                                                        isCurrent ? 'bg-neon-cyan/10 border-neon-cyan/20' : 'bg-white/5 border-white/5 group-hover:border-white/10'
                                                    }`}>
                                                        {t.time}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 text-white/25">
                                        <Disc className="w-10 h-10 animate-spin-slow opacity-20 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Index non répertorié</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* DIGITAL DJ DECK / PLAYING INTERFACE (RIGHT - 7 cols or full width) */}
                <div className={hasTracklist ? "lg:col-span-7 p-6 md:p-8 flex flex-col justify-between items-center bg-gradient-to-br from-white/[0.01] to-white/[0.03] relative min-h-[500px] lg:h-[620px]" : "p-6 md:p-8 flex flex-col justify-between items-center bg-gradient-to-br from-white/[0.01] to-white/[0.03] relative min-h-[480px] w-full"}>

                    
                    {/* Tiny Iframe (visually adapted as a screen console) */}
                    <div className="absolute top-4 right-4 z-40 opacity-20 hover:opacity-100 transition-opacity duration-300">
                        {track.embedUrl ? (
                            <div className="w-[140px] h-[34px] rounded-lg overflow-hidden border border-white/10 bg-black scale-75 origin-top-right">
                                {isSoundCloud ? (
                                    <iframe 
                                        ref={iframeRef}
                                        width="100%" 
                                        height="34" 
                                        src={track.embedUrl}
                                        frameBorder="0"
                                        scrolling="no"
                                    />
                                ) : (
                                    <iframe 
                                        ref={iframeRef}
                                        id={iframeId}
                                        width="100%" 
                                        height="34" 
                                        src={`${track.embedUrl}${track.embedUrl.includes('?') ? '&' : '?'}enablejsapi=1`}
                                        frameBorder="0"
                                        allow="autoplay"
                                    />
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Header console displays */}
                    <div className="w-full flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <span className="text-neon-purple font-black uppercase text-[9px] tracking-[0.3em]">DROPSIDERS DECK PLATINUM</span>
                            <h3 className="text-white text-3xl font-display font-black uppercase italic tracking-tighter leading-none">{track.title}</h3>
                            <p className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.4em]">{track.artist}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-neon-red/10 border border-white/10 hover:border-neon-red/20 rounded-2xl text-white/50 hover:text-neon-red transition-all cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Central Spinning Vinyl/CD Deck */}
                    <div className="relative w-[220px] h-[220px] md:w-[260px] md:h-[260px] flex items-center justify-center my-4 group">
                        
                        {/* Spinning visual glow behind deck */}
                        <div className={`absolute inset-0 rounded-full blur-[30px] opacity-10 transition-all duration-1000 ${
                            isPlaying ? 'bg-neon-purple scale-110' : 'bg-transparent scale-95'
                        }`} />

                        {/* Outer steel ring */}
                        <div className="absolute inset-0 rounded-full border-[6px] border-white/5 bg-[#08080c] shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-center justify-center">
                            
                            {/* Vinyl surface grooves */}
                            <div className="absolute inset-[15px] rounded-full border border-white/5 bg-[#0c0c12]">
                                <div className="absolute inset-[20px] rounded-full border border-white/[0.03]">
                                    <div className="absolute inset-[25px] rounded-full border border-white/[0.03]" />
                                </div>
                            </div>

                            {/* Rotating Vinyl Record */}
                            <motion.div 
                                animate={isPlaying ? { rotate: 360 } : {}}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className="w-[180px] h-[180px] md:w-[210px] md:h-[210px] rounded-full bg-[#12121b] border-2 border-white/10 flex items-center justify-center relative cursor-pointer"
                                onClick={togglePlay}
                            >
                                {/* Grooves on rotation vinyl */}
                                <div className="absolute inset-4 rounded-full border border-white/5">
                                    <div className="absolute inset-6 rounded-full border border-white/[0.02]" />
                                </div>

                                {/* LED active light ring on vinyl edge */}
                                <div className={`absolute inset-1 rounded-full border-2 border-dashed transition-opacity duration-500 ${
                                    isPlaying ? 'border-neon-purple/50 opacity-100' : 'border-transparent opacity-0'
                                }`} />

                                {/* Vinyl center label */}
                                <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] rounded-full bg-neon-purple flex flex-col items-center justify-center text-center shadow-lg border border-black/20">
                                    <span className="text-white font-black text-[9px] uppercase tracking-wider italic leading-none">DS</span>
                                    <span className="text-white/40 text-[5px] font-black uppercase mt-1 leading-none">DECK</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Tone arm mechanism mock (Vinyl player needle) */}
                        <div className="absolute top-[-10px] right-2 md:right-8 w-16 h-28 pointer-events-none origin-top-right transition-transform duration-700"
                            style={{
                                transform: isPlaying ? 'rotate(18deg)' : 'rotate(0deg)'
                            }}
                        >
                            {/* Tone arm lines */}
                            <div className="w-1.5 h-20 bg-white/20 border-r border-white/10 rounded-full mx-auto" />
                            <div className="w-4 h-6 bg-white/40 rounded-lg absolute bottom-2 left-6 border border-white/20" />
                        </div>
                    </div>

                    {/* NOW PLAYING TRACK DISPLAY LED BANNER */}
                    <div className="w-full bg-black/60 border border-white/5 rounded-2xl py-3 px-6 text-center shadow-inner overflow-hidden relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                        </div>
                        
                        <div className="w-full flex justify-center">
                            {currentTrackIndex !== -1 && track.tracks && track.tracks.length > 0 ? (
                                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-neon-cyan flex items-center gap-2 animate-pulse">
                                    <Sparkles className="w-3 h-3 text-neon-cyan" />
                                    <span>EN LECTURE : {track.tracks[currentTrackIndex].title} — {track.tracks[currentTrackIndex].artist}</span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
                                    {isPlaying ? 'DECK ACTIF • LECTURE EN COURS' : 'DECK EN ATTENTE • PLAY TO LOAD'}
                                </span>
                            )}
                        </div>
                    </div>


                    {/* FREQUENCY SPECTRUM WAVEFORM VISUALIZER */}
                    <div className="w-full h-10 flex items-end justify-center gap-1.5 my-3">
                        {visualizerBars.map((h, i) => (
                            <motion.div 
                                key={i}
                                animate={{ height: h }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className={`w-2 rounded-t-lg ${
                                    i % 2 === 0 ? 'bg-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-neon-cyan shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                                }`}
                                style={{ height: '4px' }}
                            />
                        ))}
                    </div>

                    {/* DIGITAL TIMELINE CONTROLLER */}
                    <div className="w-full space-y-2">
                        {/* Interactive glow progress bar slider */}
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-white/40 font-mono tabular-nums">{formatSeconds(currentTime)}</span>
                            
                            <div className="flex-1 relative group cursor-pointer py-2">
                                <input 
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={(e) => handleSeekToSeconds(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none accent-neon-purple [&::-webkit-slider-runnable-track]:bg-white/10 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-neon-purple [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.8)]"
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
                    </div>

                    {/* DJ CONSOLE BUTTON CONTROLS */}
                    <div className="w-full flex items-center justify-between mt-4">
                        {/* Audio track skipping */}
                        <div className="flex items-center gap-3">
                            {hasTracklist && (
                                <button 
                                    onClick={playPreviousTrack}
                                    disabled={currentTrackIndex <= 0}
                                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
                                >
                                    <SkipBack className="w-4 h-4" />
                                </button>
                            )}
                            
                            {/* Giant Primary Play Button */}
                            <button 
                                onClick={togglePlay}
                                className={`p-5 rounded-3xl text-black hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                    isPlaying 
                                    ? 'bg-neon-cyan shadow-[0_0_20px_rgba(0,229,255,0.4)]' 
                                    : 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                }`}
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
                            </button>

                            {hasTracklist && (
                                <button 
                                    onClick={playNextTrack}
                                    disabled={currentTrackIndex >= (track.tracks ? track.tracks.length - 1 : 0)}
                                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
                                >
                                    <SkipForward className="w-4 h-4" />
                                </button>
                            )}
                        </div>


                        {/* Mute slider / Volume control dial */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={toggleMute}
                                className="p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-white transition-all cursor-pointer"
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 text-neon-red" /> : <Volume2 className="w-4 h-4 text-white" />}
                            </button>
                            <input 
                                type="range" 
                                min={0}
                                max={100}
                                value={isMuted ? 0 : volume}
                                onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            />
                        </div>

                        {/* Premium Sharing Suite Button */}
                        <button 
                            onClick={() => setShowShareModal(true)}
                            className="px-6 py-4 bg-neon-purple hover:bg-[#a855f7]/80 text-white font-black text-[10px] rounded-2xl uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2 cursor-pointer"
                        >
                            <Share2 className="w-4 h-4" />
                            PARTAGER MIX
                        </button>
                    </div>
                </div>
            </div>

            {/* Direct Toast Alerts Inside DJ Console */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 bg-black/90 border border-neon-cyan/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center gap-3 text-neon-cyan text-xs font-black uppercase tracking-widest"
                    >
                        <Sparkles className="w-4 h-4 animate-spin-slow text-neon-cyan" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INSTAGRAM & SOCIAL SHARING DRAWER MODAL */}
            <AnimatePresence>
                {showShareModal && selectedSnippet && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        {/* Overlay backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-black/90 border border-white/10 rounded-[40px] max-w-4xl w-full p-6 md:p-10 relative z-10 shadow-[0_40px_80px_rgba(0,0,0,0.7)] overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            {/* Close button */}
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-6 right-6 p-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-white/50 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Header details */}
                            <div className="mb-8 text-center sm:text-left">
                                <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple border border-neon-purple/20 rounded-full text-[9px] font-black uppercase tracking-widest inline-block">
                                    INSTANT SHARING DRAWER
                                </span>
                                <h3 className="text-white text-3xl font-display font-black uppercase italic tracking-tighter mt-3">
                                    Partager l'extrait du mix
                                </h3>
                                <p className="text-gray-400 text-sm mt-1 font-medium">
                                    Sélectionnez un thème et générez une vidéo animée personnalisée pour vos Stories Instagram et TikTok.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* INTERACTIVE STORY CARD VIEW PORT (LEFT) */}
                                <div className="space-y-6 flex flex-col items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Aperçu de la Story Card (9:16)</span>
                                    
                                    {/* Glassmorphic simulated preview card */}
                                    <div 
                                        className={`w-[260px] h-[460px] rounded-[36px] border border-white/15 p-5 relative overflow-hidden flex flex-col justify-between items-center bg-gradient-to-b shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${
                                            storyTheme === 'sunset' 
                                            ? 'from-[#ff0055] via-[#7a00ff] to-[#050515]' 
                                            : storyTheme === 'acid' 
                                            ? 'from-[#39ff14] via-[#00e5ff] to-[#050515]' 
                                            : 'from-[#150030] via-[#0c001c] to-[#020205]'
                                        }`}
                                    >
                                        {/* Grid grid background effect */}
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                                        {/* Header */}
                                        <div className="text-center relative z-10 mt-4">
                                            <span className="text-white font-black italic text-xl tracking-tighter leading-none block">DROPSIDERS</span>
                                            <span className="text-white/40 text-[7px] font-bold uppercase tracking-[0.4em] block mt-1">LIVE RECORD MIX</span>
                                        </div>

                                        {/* Spinning Vinyl Record center */}
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                                            className="w-[150px] h-[150px] rounded-full bg-[#050505] border-4 border-[#12121b] relative flex items-center justify-center shadow-2xl"
                                        >
                                            {/* Vinyl edges neon indicator */}
                                            <div className={`absolute inset-0 rounded-full border border-dashed ${
                                                storyTheme === 'acid' ? 'border-[#39ff14]/40' : 'border-[#ff0055]/40'
                                            }`} />
                                            {/* Central sticker */}
                                            <div className="w-[44px] h-[44px] rounded-full bg-[#ff0033] flex items-center justify-center">
                                                <span className="text-white font-black text-[7px] leading-none">DS</span>
                                            </div>
                                        </motion.div>

                                        {/* Simulated pulsing visualizer wave */}
                                        <div className="flex gap-1 h-6 items-end">
                                            {[...Array(12)].map((_, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    animate={{ height: [6, Math.floor(Math.random() * 20) + 4, 6] }}
                                                    transition={{ repeat: Infinity, duration: 0.8 + idx * 0.05, ease: "easeInOut" }}
                                                    className={`w-1 rounded-t ${
                                                        storyTheme === 'void' ? 'bg-[#a855f7]' : storyTheme === 'acid' ? 'bg-[#00e5ff]' : 'bg-white'
                                                    }`}
                                                    style={{ height: '6px' }}
                                                />
                                            ))}
                                        </div>

                                        {/* Track Info Card */}
                                        <div className="w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-4 text-center space-y-1 relative z-10 mb-2">
                                            <span className={`text-[8px] font-black uppercase tracking-wider block ${
                                                storyTheme === 'acid' ? 'text-[#39ff14]' : 'text-[#ff0055]'
                                            }`}>
                                                🎵 EXTRAIT DROPSIDERS
                                            </span>
                                            <h5 className="text-white font-black text-sm uppercase italic tracking-tight truncate">
                                                {track.title}
                                            </h5>
                                            <p className="text-white/80 font-bold text-[9px] uppercase tracking-wide truncate">
                                                Piste : {selectedSnippet.trackName}
                                            </p>
                                            <p className="text-white/40 font-bold text-[8px] uppercase tracking-widest">
                                                Démarre à {selectedSnippet.timeStr}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Color Theme Selector buttons */}
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setStoryTheme('sunset')}
                                            className={`px-4 py-2 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                                storyTheme === 'sunset' 
                                                ? 'bg-white text-black border-white' 
                                                : 'bg-white/5 text-white/50 border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            Sunset Cyber
                                        </button>
                                        <button 
                                            onClick={() => setStoryTheme('acid')}
                                            className={`px-4 py-2 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                                storyTheme === 'acid' 
                                                ? 'bg-white text-black border-white' 
                                                : 'bg-white/5 text-white/50 border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            Acid Neon
                                        </button>
                                        <button 
                                            onClick={() => setStoryTheme('void')}
                                            className={`px-4 py-2 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                                storyTheme === 'void' 
                                                ? 'bg-white text-black border-white' 
                                                : 'bg-white/5 text-white/50 border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            Midnight Void
                                        </button>
                                    </div>
                                </div>

                                {/* GENERATOR CONTROLS (RIGHT) */}
                                <div className="space-y-6 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        
                                        {/* Snippet summary block */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                            <span className="text-neon-cyan font-black uppercase text-[8px] tracking-[0.3em]">EXTRAIT CHOISI AU HASARD</span>
                                            
                                            <div className="space-y-1">
                                                <h4 className="text-white text-xl font-black uppercase tracking-tight leading-tight">
                                                    {selectedSnippet.trackName}
                                                </h4>
                                                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{selectedSnippet.artist}</p>
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-neon-cyan" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                        MINUTE D'EXTRAIT : {selectedSnippet.timeStr}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={generateRandomSnippet}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] font-black text-white uppercase tracking-widest transition-all cursor-pointer"
                                                >
                                                    Piste différente 🎲
                                                </button>
                                            </div>
                                        </div>

                                        {/* Instructions list */}
                                        <div className="space-y-3 px-4">
                                            <div className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    Choisissez votre **thème visuel** et tirez une **piste au hasard** pour varier vos partages.
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    Générez le **clip vidéo de Story**. Le lien magique est **automatiquement copié** dans votre presse-papiers !
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    Sur Instagram, uploadez le clip et collez le lien dans le **sticker "Lien"** ! Tes potes écouteront l'extrait dès leur arrivée.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Share Buttons */}
                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        
                                        {/* Direct Story Card Generator download */}
                                        <button 
                                            onClick={generateInstagramStoryVideo}
                                            disabled={isGeneratingVideo}
                                            className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-cyan hover:brightness-110 text-white font-black text-xs rounded-2xl uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-98 shadow-[0_0_35px_rgba(0,229,255,0.2)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            {isGeneratingVideo ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>GÉNÉRATION DU CLIP STORY ({videoProgress}%) ...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Video className="w-4 h-4 animate-pulse" />
                                                    <span>Télécharger Story Card Vidéo 9:16</span>
                                                </>
                                            )}
                                        </button>

                                        {/* Copy / Twitter secondary share layout */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={copyShareLink}
                                                className={`py-4 border rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                                                    copiedLink 
                                                    ? 'bg-neon-cyan text-black border-neon-cyan' 
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                                }`}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                {copiedLink ? "Lien Copié ! 🔗" : "Copier le Lien Magique"}
                                            </button>

                                            <button 
                                                onClick={shareOnTwitter}
                                                className="py-4 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <Twitter className="w-3.5 h-3.5" />
                                                Twitter / X
                                            </button>
                                        </div>

                                        <p className="text-[9px] text-white/20 uppercase font-black tracking-widest text-center mt-2">
                                            Dropsiders Magic Link Technology © 2026
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CustomMixPlayer;
