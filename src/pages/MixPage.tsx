import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, DownloadCloud, 
    Share2, Heart, Music, Disc, ExternalLink, ListMusic, 
    ChevronDown, ChevronUp, User, Check, Radio
} from 'lucide-react';
import { SEO } from '../components/utils/SEO';

interface TrackItem {
    id: string;
    artist: string;
    title: string;
    timestamp?: string;
}

interface MixData {
    id: string;
    title: string;
    genre?: string;
    description?: string;
    cover?: string;
    type?: 'Track' | 'Remix' | 'Edit' | 'Mix';
    allowDownload?: boolean;
    audioUrl?: string;
    duration?: string;
    uploadDate?: string;
    username?: string;
    handle?: string;
    avatar?: string;
    ownerEmail?: string;
    tracklist?: TrackItem[];
    likes?: number;
}

export function MixPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    const [mix, setMix] = useState<MixData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isTracklistOpen, setIsTracklistOpen] = useState(true);
    const [copiedLink, setCopiedLink] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const initialTimeSetRef = useRef(false);

    // Fetch Mix details (public endpoint)
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);

        fetch(`/api/mix/${encodeURIComponent(id)}`)
            .then(async (res) => {
                if (!res.ok) {
                    // Fallback to community mixes search
                    const comRes = await fetch('/api/community/mixes');
                    if (comRes.ok) {
                        const mixes = await comRes.json();
                        const found = mixes.find((m: any) => m.id === id);
                        if (found) return found;
                    }
                    throw new Error("Mix introuvable ou retiré.");
                }
                return res.json();
            })
            .then((data: MixData) => {
                setMix(data);
                setLikesCount(data.likes || 0);
            })
            .catch((err) => {
                console.error("Error loading mix:", err);
                setError("Ce mix n'existe pas ou a été supprimé.");
            })
            .finally(() => setLoading(false));
    }, [id]);

    // MediaSession API setup for background playback on mobile (iOS Safari / Android Chrome)
    useEffect(() => {
        if (!mix || !('mediaSession' in navigator)) return;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: mix.title,
                artist: mix.username || mix.handle || 'Dropsiders DJ',
                album: `Dropsiders ${mix.type || 'Mix'} Studio`,
                artwork: mix.cover ? [
                    { src: mix.cover, sizes: '512x512', type: 'image/png' },
                    { src: mix.cover, sizes: '256x256', type: 'image/png' },
                    { src: mix.cover, sizes: '128x128', type: 'image/png' }
                ] : [
                    { src: '/images/branding/logo-dropsiders.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                audioRef.current?.play().catch(() => {});
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                audioRef.current?.pause();
            });
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined && audioRef.current) {
                    audioRef.current.currentTime = details.seekTime;
                }
            });
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skipTime = details.seekOffset || 15;
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
                }
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skipTime = details.seekOffset || 15;
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + skipTime, audioRef.current.duration || 0);
                }
            });
        } catch (e) {
            console.warn("MediaSession registration failed", e);
        }
    }, [mix]);

    // Handle initial seek from URL param ?t=123
    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        const dur = audioRef.current.duration;
        if (isFinite(dur) && dur > 0) {
            setDuration(dur);
        }
        if (!initialTimeSetRef.current) {
            const tParam = searchParams.get('t');
            if (tParam) {
                const startTime = parseFloat(tParam);
                if (isFinite(startTime) && startTime > 0) {
                    audioRef.current.currentTime = startTime;
                    setCurrentTime(startTime);
                }
            }
            initialTimeSetRef.current = true;
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch((e) => console.warn("Playback prevented", e));
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const curr = audioRef.current.currentTime;
        setCurrentTime(curr);
        if ('mediaSession' in navigator && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: audioRef.current.duration,
                    playbackRate: audioRef.current.playbackRate,
                    position: curr
                });
            } catch (_) {}
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = target;
            setCurrentTime(target);
        }
    };

    const handleSkip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration || 0));
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const formatTime = (secs: number) => {
        if (isNaN(secs) || secs < 0) return '00:00';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const parseTimestampToSeconds = (ts?: string) => {
        if (!ts) return 0;
        const parts = ts.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
    };

    const jumpToTrack = (ts?: string) => {
        const sec = parseTimestampToSeconds(ts);
        if (audioRef.current) {
            audioRef.current.currentTime = sec;
            setCurrentTime(sec);
            if (!isPlaying) {
                audioRef.current.play().catch(() => {});
            }
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        const shareData = {
            title: mix ? `${mix.title} - Dropsiders` : 'Dropsiders Live Mix',
            text: mix ? `🎧 Écoute "${mix.title}" par ${mix.username || 'Dropsiders'} sur Dropsiders Studio !` : 'Écoute ce mix sur Dropsiders !',
            url: url
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.warn("Share cancelled or failed", err);
            }
        } else {
            await navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    const handleDownload = () => {
        if (!mix?.audioUrl) return;
        const a = document.createElement('a');
        a.href = mix.audioUrl;
        const ext = mix.audioUrl.split('.').pop()?.split('?')[0] || 'mp3';
        a.download = `${mix.title}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleLike = async () => {
        if (hasLiked || !mix) return;
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
        try {
            await fetch('/api/community/mixes/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: mix.id })
            });
        } catch (_) {}
    };

    const getBadgeStyle = (t?: string) => {
        switch (t) {
            case 'Track': return 'bg-neon-red/10 border-neon-red/30 text-neon-red shadow-[0_0_15px_rgba(255,0,0,0.2)]';
            case 'Edit': return 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]';
            case 'Mix': return 'bg-neon-green/10 border-neon-green/30 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]';
            default: return 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.2)]';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060609] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-2 border-white/10 border-t-neon-purple animate-spin" />
                    <Disc className="w-8 h-8 text-neon-purple absolute animate-pulse" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Chargement du studio...</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Dropsiders Live Player</p>
            </div>
        );
    }

    if (error || !mix) {
        return (
            <div className="min-h-screen bg-[#060609] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto text-red-400">
                    <Music className="w-10 h-10" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-wider">Mix Introuvable</h2>
                    <p className="text-xs text-gray-400 font-medium">{error || "Ce contenu n'est plus disponible ou a été déplacé."}</p>
                </div>
                <Link
                    to="/communaute"
                    className="px-8 py-4 bg-neon-purple/20 hover:bg-neon-purple border border-neon-purple/40 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                    Explorer la communauté
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060609] text-white selection:bg-neon-purple selection:text-white flex flex-col justify-between relative overflow-hidden pb-12 pt-28">
            <SEO
                title={`${mix.title} | Dropsiders Mix Studio`}
                description={`Écoute "${mix.title}" par ${mix.username || 'Dropsiders DJ'} sur la plateforme officielle Dropsiders.`}
                image={mix.cover || '/images/branding/meta-banner.png'}
            />

            {/* Hidden HTML5 Audio Element for Background / MediaSession Playback */}
            {mix.audioUrl && (
                <audio
                    ref={audioRef}
                    src={mix.audioUrl}
                    preload="auto"
                    playsInline={true}
                    onPlay={() => {
                        setIsPlaying(true);
                        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {/* Top Navigation Bar */}
            <header className="relative z-30 w-full max-w-xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl rounded-3xl mb-4">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center text-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.3)] group-hover:scale-105 transition-transform">
                        <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-sm font-display font-black text-white uppercase italic tracking-wider block leading-none">
                            DROPSIDERS
                        </span>
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mt-0.5">
                            MIX STUDIO
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 cursor-pointer"
                    >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Share2 className="w-3.5 h-3.5 text-neon-cyan" />}
                        <span className="hidden sm:inline">{copiedLink ? 'Lien copié' : 'Partager'}</span>
                    </button>

                    <Link
                        to="/communaute"
                        className="px-4 py-2 rounded-xl bg-neon-purple hover:bg-neon-purple/80 text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(188,19,254,0.4)] active:scale-95 flex items-center gap-1.5"
                    >
                        <span>Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </header>

            {/* Main Interactive Deck Center */}
            <main className="relative z-20 flex-1 max-w-xl mx-auto w-full px-6 py-4 flex flex-col items-center justify-center text-center">
                
                {/* Turntable / Rotating Vinyl */}
                <div className="relative w-[270px] h-[270px] sm:w-[320px] sm:h-[320px] my-2 flex items-center justify-center group">
                    {/* Background Pulsing Neon Glow */}
                    <div className={`absolute inset-0 rounded-full blur-[40px] transition-all duration-700 ${
                        isPlaying ? 'bg-neon-purple/25 scale-110' : 'bg-transparent scale-95'
                    }`} />

                    {/* Outer Steel / Vinyl Base Ring */}
                    <div className="absolute inset-0 rounded-full border-[8px] border-white/5 bg-[#0a0a10] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center justify-center">
                        {/* Grooves */}
                        <div className="absolute inset-[18px] rounded-full border border-white/5 bg-[#0e0e16]">
                            <div className="absolute inset-[25px] rounded-full border border-white/[0.03]">
                                <div className="absolute inset-[30px] rounded-full border border-white/[0.02]" />
                            </div>
                        </div>

                        {/* Interactive Rotating Vinyl Record */}
                        <motion.div
                            animate={isPlaying ? { rotate: 360 } : {}}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                            className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full bg-[#12121e] border-2 border-white/10 flex items-center justify-center relative cursor-pointer shadow-2xl overflow-hidden"
                            onClick={togglePlay}
                        >
                            {/* Inner Vinyl Grooves */}
                            <div className="absolute inset-6 rounded-full border border-white/5" />
                            <div className="absolute inset-12 rounded-full border border-white/[0.02]" />

                            {/* LED Neon Light Ring on Rim */}
                            <div className={`absolute inset-1 rounded-full border-2 border-dashed transition-opacity duration-500 ${
                                isPlaying ? 'border-neon-purple/60 opacity-100' : 'border-transparent opacity-0'
                            }`} />

                            {/* Center Vinyl Cover Art / DS Label */}
                            {mix.cover ? (
                                <div className="w-[95px] h-[95px] sm:w-[110px] sm:h-[110px] rounded-full overflow-hidden border-2 border-white/30 shadow-2xl relative flex items-center justify-center bg-black">
                                    <img 
                                        src={mix.cover} 
                                        alt={mix.title} 
                                        className="w-full h-full object-cover rounded-full select-none pointer-events-none" 
                                    />
                                    {/* Spindle center hole */}
                                    <div className="w-4 h-4 rounded-full bg-[#08080c] border border-white/50 absolute shadow-inner z-10" />
                                </div>
                            ) : (
                                <div className="w-[80px] h-[80px] sm:w-[95px] sm:h-[95px] rounded-full bg-neon-purple flex flex-col items-center justify-center text-center shadow-2xl border border-black/30 relative">
                                    <span className="text-white font-black text-sm uppercase tracking-wider italic leading-none">DS</span>
                                    <span className="text-white/50 text-[7px] font-black uppercase mt-1 leading-none">STUDIO</span>
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#08080c] border border-white/40 absolute shadow-inner" />
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Tone-Arm Needle Mechanism */}
                    <div 
                        className="absolute top-[-10px] right-2 sm:right-6 w-20 h-36 pointer-events-none origin-top-right transition-transform duration-700 z-20"
                        style={{
                            transform: isPlaying ? 'rotate(22deg)' : 'rotate(0deg)'
                        }}
                    >
                        <div className="w-2 h-24 bg-white/20 border-r border-white/10 rounded-full mx-auto shadow-md" />
                        <div className="w-5 h-8 bg-white/40 rounded-lg absolute bottom-2 left-8 border border-white/30 shadow-lg" />
                    </div>
                </div>

                {/* Track Metadata Header */}
                <div className="space-y-3 mt-4 max-w-md w-full">
                    <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${getBadgeStyle(mix.type)}`}>
                            {mix.type || 'Mix'}
                        </span>
                        {mix.genre && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-gray-300">
                                {mix.genre}
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase italic tracking-tight leading-tight">
                        {mix.title}
                    </h1>

                    {/* DJ Artist info */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                        {mix.avatar ? (
                            <img src={mix.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-white/20" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                                <User className="w-3.5 h-3.5" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase text-gray-300 tracking-wider">
                            {mix.username || mix.handle || 'Dropsider DJ'}
                        </span>
                    </div>

                    {mix.description && (
                        <p className="text-xs text-gray-400 font-medium italic pt-1 leading-relaxed max-w-sm mx-auto">
                            "{mix.description}"
                        </p>
                    )}
                </div>

                {/* Live Waveform Equalizer Display */}
                <div className="flex items-center justify-center gap-1.5 h-8 my-4 w-full max-w-xs">
                    {[12, 24, 16, 28, 20, 32, 14, 26, 18, 30, 22, 16, 28, 20, 14, 24].map((h, i) => (
                        <span
                            key={i}
                            className={`w-1.5 rounded-full transition-all duration-300 ${
                                isPlaying 
                                    ? 'bg-gradient-to-t from-neon-purple to-neon-cyan animate-pulse' 
                                    : 'bg-white/10'
                            }`}
                            style={{
                                height: isPlaying ? `${Math.max(6, (h * ((currentTime % 4) + 1)) % 32)}px` : '4px',
                                animationDelay: `${i * 0.08}s`
                            }}
                        />
                    ))}
                </div>

                {/* Seeker / Timeline Progress */}
                <div className="w-full max-w-md space-y-2">
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-cyan focus:outline-none"
                    />
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-wider">
                        <span className={isPlaying ? 'text-neon-cyan font-bold' : ''}>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Player Playback Controls */}
                <div className="flex items-center justify-center gap-6 mt-6">
                    <button
                        onClick={() => handleSkip(-15)}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                        title="Reculer de 15s"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>

                    <button
                        onClick={togglePlay}
                        className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all transform active:scale-90 shadow-2xl cursor-pointer ${
                            isPlaying
                                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                                : 'bg-neon-purple text-white shadow-[0_0_30px_rgba(188,19,254,0.6)] hover:scale-105'
                        }`}
                        title={isPlaying ? "Pause" : "Lecture"}
                    >
                        {isPlaying ? (
                            <Pause className="w-8 h-8 fill-current" />
                        ) : (
                            <Play className="w-8 h-8 fill-current ml-1" />
                        )}
                    </button>

                    <button
                        onClick={() => handleSkip(15)}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                        title="Avancer de 15s"
                    >
                        <RotateCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Secondary Actions (Download, Like, Mute) */}
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            hasLiked 
                                ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>{likesCount}</span>
                    </button>

                    {mix.allowDownload && mix.audioUrl && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                        >
                            <DownloadCloud className="w-4 h-4 text-neon-cyan" />
                            <span>Télécharger</span>
                        </button>
                    )}

                    <button
                        onClick={toggleMute}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                        title={isMuted ? "Activer le son" : "Couper le son"}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                </div>

                {/* Interactive Tracklist Section */}
                {mix.tracklist && mix.tracklist.length > 0 && (
                    <div className="w-full max-w-md mt-8 text-left bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                        <button
                            onClick={() => setIsTracklistOpen(!isTracklistOpen)}
                            className="w-full px-6 py-4 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <ListMusic className="w-4 h-4 text-neon-purple" />
                                <span className="text-xs font-black uppercase tracking-widest text-white">
                                    Tracklist ({mix.tracklist.length} titres)
                                </span>
                            </div>
                            {isTracklistOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>

                        <AnimatePresence>
                            {isTracklistOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="divide-y divide-white/5 max-h-60 overflow-y-auto custom-scrollbar"
                                >
                                    {mix.tracklist.map((trackItem, index) => {
                                        const trackSeconds = parseTimestampToSeconds(trackItem.timestamp);
                                        const isCurrent = currentTime >= trackSeconds && 
                                            (index === mix.tracklist!.length - 1 || currentTime < parseTimestampToSeconds(mix.tracklist![index + 1].timestamp));

                                        return (
                                            <div
                                                key={trackItem.id || index}
                                                onClick={() => jumpToTrack(trackItem.timestamp)}
                                                className={`px-6 py-3 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                                                    isCurrent 
                                                        ? 'bg-neon-purple/15 text-white' 
                                                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`text-[10px] font-black w-4 ${isCurrent ? 'text-neon-cyan' : 'text-gray-600'}`}>
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold uppercase truncate">{trackItem.title}</p>
                                                        <p className="text-[9px] text-gray-500 font-medium uppercase truncate">{trackItem.artist}</p>
                                                    </div>
                                                </div>

                                                {trackItem.timestamp && (
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                                                        isCurrent ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-gray-500'
                                                    }`}>
                                                        {trackItem.timestamp}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Bottom Community Banner */}
            <footer className="relative z-20 max-w-xl mx-auto w-full px-6 pt-4">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-neon-purple/20 via-black/60 to-neon-cyan/20 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <div>
                        <h4 className="text-sm font-display font-black text-white uppercase italic tracking-wider">
                            Rejoins la communauté Dropsiders
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            Vote pour tes tracks préférés & partage tes créations
                        </p>
                    </div>
                    <Link
                        to="/communaute"
                        className="px-6 py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-gray-200 transition-all shrink-0 shadow-lg active:scale-95"
                    >
                        Rejoindre
                    </Link>
                </div>
            </footer>
        </div>
    );
}
