import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Disc, ExternalLink, ListMusic, Play, Pause, X, ChevronRight, Share2, Heart } from 'lucide-react';
import { EqualizerLoader } from '../components/ui/EqualizerLoader';
import { GlitchTransition } from '../components/ui/GlitchTransition';

interface Track {
    id: string;
    rank: number;
    title: string;
    artist: string;
    label: string;
    url: string;
    preview?: string;
    duration?: string;
    embedUrl?: string;
    tracks?: { title: string; artist: string; time?: string }[];
}

interface TracklistContent {
    id: string;
    title: string;
    artist: string;
    tracks: { title: string; artist: string; time?: string }[];
    embedUrl?: string;
}



export function Musique() {
    const [activeTab, setActiveTab] = useState('beatport');
    const [chartsData, setChartsData] = useState<Record<string, Track[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedTracklist, setSelectedTracklist] = useState<TracklistContent | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/musique/charts')
            .then(res => res.json())
            .then(data => {
                setChartsData(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Charts fetch error", err);
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [activeTab]);

    useEffect(() => {
        if (selectedTrack && !selectedTrack.embedUrl) {
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = selectedTrack.preview || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
            }
        }
    }, [selectedTrack]);

    useEffect(() => {
        if (audioRef.current && !selectedTrack?.embedUrl) {
            if (isPlaying) audioRef.current.play().catch(() => { });
            else audioRef.current.pause();
        }
    }, [isPlaying, selectedTrack]);

    const platforms = [
        { id: 'beatport', name: 'Beatport Top 10', icon: Music, color: '#39ff14' },
        { id: 'traxsource', name: 'Traxsource Top 10', icon: Disc, color: '#ffaa00' },
        { id: 'juno', name: 'Juno Download Top 10', icon: ListMusic, color: '#00f0ff' },
    ];

    const getMockData = (platform: string): Track[] => {
        if (chartsData[platform]) return chartsData[platform];

        // Final fallback if data is totally missing
        const samplePreview = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        return Array.from({ length: 10 }, (_, i) => ({
            id: `${platform}-${i}`,
            rank: i + 1,
            title: `Track #${i + 1}`,
            artist: `Producer ${i + 1}`,
            label: `Record Label`,
            url: '#',
            preview: samplePreview
        }));
    };

    const handleTrackClick = (track: Track) => {
        if (selectedTrack?.id === track.id) {
            if (isPlaying) {
                setIsPlaying(false);
                if (!track.embedUrl) audioRef.current?.pause();
            } else {
                setIsPlaying(true);
                if (!track.embedUrl) audioRef.current?.play();
            }
        } else {
            setSelectedTrack(track);
            setIsPlaying(true);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-12 xl:px-16 2xl:px-24 bg-[#050505]">
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12 relative"
            >
                <GlitchTransition trigger={activeTab} />

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <EqualizerLoader count={8} className="scale-75 opacity-50" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
                        DROPSIDERS CHARTS
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-xs md:text-sm font-black uppercase tracking-[0.3em]">
                        LES CHARTS LES PLUS INFLUENTS DE LA PLANÈTE
                    </p>
                </div>

                {/* Platform Selector */}
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                    {platforms.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setActiveTab(p.id)}
                            data-cursor-color={p.color}
                            className={`group relative flex items-center gap-1 md:gap-3 px-2 md:px-8 py-1.5 md:py-5 rounded-lg md:rounded-2xl border-2 transition-all duration-500 overflow-hidden ${activeTab === p.id
                                ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                                : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {activeTab === p.id && (
                                <motion.div
                                    layoutId="music-tab-glow"
                                    className="absolute inset-0 opacity-20"
                                    style={{ backgroundColor: p.color }}
                                />
                            )}
                            <p.icon className={`w-3 h-3 md:w-5 md:h-5 relative z-10 ${activeTab === p.id ? 'animate-pulse' : ''}`} />
                            <span className="font-black text-[6px] md:text-[10px] uppercase tracking-widest relative z-10">{p.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content List */}
                <div className="relative min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                            >
                                <EqualizerLoader count={12} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-cyan animate-pulse">
                                    SYNCHRONISATION...
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid lg:grid-cols-1 gap-3 px-[10%] md:px-0"
                            >
                                {getMockData(activeTab).map((track, i) => (
                                    <motion.div
                                        key={track.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex flex-col gap-0 rounded-xl md:rounded-3xl bg-white/[0.02] border border-white/5 md:hover:bg-white/[0.05] md:hover:border-white/10 transition-all duration-300"
                                    >
                                        <div
                                            className="flex flex-row items-center cursor-pointer group/track"
                                            onClick={() => handleTrackClick(track)}
                                        >
                                            <div className="flex items-center gap-2 md:gap-6 p-1 md:p-6 flex-1">
                                                <div
                                                    className={`w-6 h-6 md:w-12 md:h-12 rounded-md md:rounded-lg flex items-center justify-center font-black transition-all duration-300 relative text-[10px] md:text-base ${selectedTrack?.id === track.id
                                                        ? 'bg-neon-red text-white'
                                                        : 'bg-white/5 text-gray-500 md:group-hover/track:bg-neon-red/20 md:group-hover/track:text-neon-red'
                                                        }`}
                                                >
                                                    <span>{track.rank}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xs md:text-lg font-black text-white uppercase italic tracking-tight truncate md:group-hover/track:text-neon-red transition-colors flex items-center gap-1.5 md:gap-3">
                                                        {track.title}
                                                        <div className={`flex items-center gap-1 ${selectedTrack?.id === track.id ? 'flex' : 'hidden md:flex md:invisible md:group-hover/track:visible'}`}>
                                                            <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${selectedTrack?.id === track.id && isPlaying ? 'bg-neon-green ml-0.5 animate-pulse' : 'bg-neon-red'}`} />
                                                            <span className={`text-[6px] md:text-[9px] font-black tracking-[0.1em] ${selectedTrack?.id === track.id && isPlaying ? 'text-neon-green' : 'text-neon-red'}`}>
                                                                {selectedTrack?.id === track.id && isPlaying ? 'PLAY' : 'LISTEN'}
                                                            </span>
                                                        </div>
                                                    </h3>
                                                    <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1">
                                                        <span className="text-[8px] md:text-[10px] font-black text-neon-cyan uppercase tracking-widest">
                                                            {track.artist}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                                                            {track.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <a
                                                    href={track.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 md:p-4 bg-white/5 rounded-md md:rounded-2xl border border-white/10 md:hover:bg-neon-red md:hover:border-neon-red md:hover:text-white transition-all group/btn"
                                                >
                                                    <ExternalLink className="w-3 h-3 md:w-5 md:h-5 md:group-hover/btn:scale-110 transition-transform" />
                                                </a>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {selectedTrack?.id === track.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-3 md:px-6 pb-3 md:pb-6 overflow-hidden"
                                                >
                                                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-xl w-full mx-auto">
                                                        {track.embedUrl ? (
                                                            <iframe
                                                                key={track.id}
                                                                src={track.embedUrl}
                                                                className={`w-full ${activeTab === 'juno' ? 'h-[60px] md:h-[180px]' : activeTab === 'beatport' ? 'h-[80px] md:h-[162px]' : activeTab === 'traxsource' ? 'h-[120px] md:h-[240px]' : 'h-[80px] md:h-[180px]'} border-none overflow-hidden`}
                                                                scrolling="no"
                                                                allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            />
                                                        ) : (
                                                            <div className="p-8 md:p-12 space-y-8 bg-gradient-to-br from-black/90 via-black/60 to-black/90 relative overflow-hidden group/premium-player">
                                                                {/* Animated background glow */}
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover/premium-player:bg-neon-red/20 transition-all duration-1000" />

                                                                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                                                    {/* Play/Pause Main Control */}
                                                                    <div className="relative">
                                                                        <div className={`absolute inset-0 bg-neon-red/20 blur-2xl rounded-full transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
                                                                        <button
                                                                            onClick={() => {
                                                                                if (isPlaying) {
                                                                                    audioRef.current?.pause();
                                                                                    setIsPlaying(false);
                                                                                } else {
                                                                                    audioRef.current?.play();
                                                                                    setIsPlaying(true);
                                                                                }
                                                                            }}
                                                                            className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-neon-red hover:border-neon-red hover:scale-110 transition-all duration-500 group/play-btn shadow-[0_0_50px_rgba(0,0,0,0.5)] active:scale-95"
                                                                        >
                                                                            {isPlaying ? (
                                                                                <Pause className="w-10 h-10 text-white fill-white" />
                                                                            ) : (
                                                                                <Play className="w-10 h-10 text-white ml-1 fill-white" />
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex-1 w-full space-y-6">
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="px-2 py-0.5 bg-neon-red/10 border border-neon-red/20 rounded text-[9px] font-black text-neon-red tracking-widest uppercase">Premium Player</span>
                                                                                <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase opacity-50">• High Quality Previews</span>
                                                                            </div>
                                                                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1 leading-none">{track.title}</h4>
                                                                            <p className="text-neon-cyan font-black text-xs uppercase tracking-[0.3em]">{track.artist}</p>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-neon-green animate-pulse' : 'bg-gray-600'}`} />
                                                                                    <span className="text-[9px] font-black text-gray-500 tracking-[0.2em] uppercase">
                                                                                        {isPlaying ? 'Streaming Live' : 'Paused'}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-[10px] font-black text-neon-red tracking-widest">HQ 320KBPS</span>
                                                                            </div>

                                                                            {/* Visualizer Mock */}
                                                                            <div className="h-12 flex items-end gap-1 px-2">
                                                                                {Array.from({ length: 40 }).map((_, i) => (
                                                                                    <motion.div
                                                                                        key={i}
                                                                                        className="flex-1 bg-gradient-to-t from-neon-red/40 to-neon-red rounded-t-sm"
                                                                                        animate={{
                                                                                            height: isPlaying ? [
                                                                                                Math.random() * 100 + "%",
                                                                                                Math.random() * 100 + "%",
                                                                                                Math.random() * 100 + "%"
                                                                                            ] : "10%"
                                                                                        }}
                                                                                        transition={{
                                                                                            duration: 0.5,
                                                                                            repeat: Infinity,
                                                                                            delay: i * 0.02,
                                                                                            ease: "easeInOut"
                                                                                        }}
                                                                                    />
                                                                                ))}
                                                                            </div>

                                                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                                                <motion.div
                                                                                    className="h-full bg-gradient-to-r from-neon-red to-neon-cyan shadow-[0_0_15px_rgba(255,18,65,0.6)]"
                                                                                    initial={{ width: "0%" }}
                                                                                    animate={{ width: isPlaying ? "100%" : "0%" }}
                                                                                    transition={{ duration: 30, ease: "linear" }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-4 pt-2">
                                                                            <a
                                                                                href={track.url}
                                                                                target="_blank"
                                                                                className="px-8 py-3.5 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all duration-300 shadow-xl flex items-center gap-3 active:scale-95"
                                                                            >
                                                                                Buy Full Track <ExternalLink className="w-3.5 h-3.5" />
                                                                            </a>
                                                                            <button className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                                                                <Heart className="w-4 h-4 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tracking Footer */}
                <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                        {platforms.map(p => (
                            <div key={p.id} className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-30 hover:opacity-100">
                                <p.icon className="w-4 h-4" />
                                <span className="text-[8px] font-black uppercase tracking-widest">{p.id}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">
                        DATA UPDATE EVERY 3 DAYS • DROPSIDERS NETWORK 2026
                    </p>
                </div>
            </motion.div>



            {/* Tracklist Stylish Pop-up */}
            <AnimatePresence>
                {selectedTracklist && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTracklist(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)]"
                        >
                            {/* Header Image/Background */}
                            <div className="h-48 bg-gradient-to-br from-neon-red/20 to-neon-cyan/20 relative p-12 flex flex-col justify-end">
                                <button
                                    onClick={() => setSelectedTracklist(null)}
                                    className="absolute top-8 right-8 p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-neon-red rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                                            Tracklist
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Verified Source</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black italic text-white uppercase italic tracking-tighter leading-none">
                                        {selectedTracklist.title}
                                    </h2>
                                </div>
                            </div>

                            {/* Tracks Area */}
                            <div className="p-8 md:p-12 h-[450px] overflow-y-auto custom-scrollbar">
                                {selectedTracklist.embedUrl && (
                                    <div className="mb-8 rounded-3xl overflow-hidden border border-white/10 bg-black">
                                        <iframe width="100%" height="120" src={selectedTracklist.embedUrl} frameBorder="0"></iframe>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {selectedTracklist.tracks.map((t, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + idx * 0.05 }}
                                            className="flex items-center gap-6 group/item"
                                        >
                                            <span className="text-xs font-black text-white/10 w-8">{idx + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-sm font-black text-white uppercase tracking-wider group-hover/item:text-neon-cyan transition-colors">
                                                    {t.title}
                                                </h5>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {t.artist}
                                                </p>
                                            </div>
                                            {t.time && <span className="text-[10px] font-bold text-white/20 whitespace-nowrap">{t.time}</span>}
                                            <button className="p-2 text-white/5 group-hover/item:text-white transition-colors">
                                                <Play className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase transition-all">
                                        <Heart className="w-3 h-3" /> Like
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase transition-all">
                                        <Share2 className="w-3 h-3" /> Share
                                    </button>
                                </div>
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="flex items-center gap-2 text-neon-red text-[10px] font-black uppercase tracking-widest hover:underline"
                                >
                                    Full Set Info <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="mt-12 py-8 border-t border-white/5 text-center">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
                    Les classements sont mis à jour tous les 3 jours via Beatport, Traxsource et Juno
                </p>
            </div>
        </div>
    );
}

export default Musique;

