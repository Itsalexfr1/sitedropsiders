import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Disc, ExternalLink, ListMusic, TrendingUp, Zap, Play, Pause, X, ChevronRight, Share2, Heart } from 'lucide-react';
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
}

interface TracklistContent {
    id: string;
    title: string;
    artist: string;
    tracks: { title: string; artist: string; time?: string }[];
}

const TRACKLIST_MOCK: Record<string, TracklistContent> = {
    '1001-1': {
        id: '1001-1',
        title: 'ALESSA.A @ TOMORROWLAND 2026',
        artist: 'ALESSA.A',
        tracks: [
            { title: 'Innerbloom', artist: 'RÜFÜS DU SOL', time: '00:00' },
            { title: 'The Feeling', artist: 'Adam Port & Stryv', time: '04:20' },
            { title: 'Neck (Extended Mix)', artist: 'Mau P', time: '08:15' },
            { title: 'Loco Loco', artist: 'Reinier Zonneveld', time: '12:30' },
            { title: 'Move', artist: 'Anyma', time: '15:45' }
        ]
    }
};

export function Musique() {
    const [activeTab, setActiveTab] = useState('beatport');
    const [isLoading, setIsLoading] = useState(false);
    const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedTracklist, setSelectedTracklist] = useState<TracklistContent | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [activeTab]);

    useEffect(() => {
        if (playingTrack) setIsPlaying(true);
        else setIsPlaying(false);
    }, [playingTrack]);

    const platforms = [
        { id: 'beatport', name: 'Beatport Top 10', icon: Music, color: '#39ff14' },
        { id: 'traxsource', name: 'Traxsource Top 10', icon: Disc, color: '#ffaa00' },
        { id: 'hardtunes', name: 'Hardtunes Top 10', icon: Zap, color: '#ff00ff' },
        { id: 'juno', name: 'Juno Download Top 10', icon: ListMusic, color: '#00f0ff' },
        { id: '1001tracklists', name: '1001Tracklists', icon: TrendingUp, color: '#ff0033' },
    ];

    const getMockData = (platform: string): Track[] => {
        if (platform === 'beatport') {
            return [
                { id: 'bp-1', rank: 1, title: 'neck (Extended Mix)', artist: 'Mau P', label: 'Repopulate Mars', url: 'https://www.beatport.com/track/neck/18654321', duration: '5:42' },
                { id: 'bp-2', rank: 2, title: 'Make My Day (Original Mix)', artist: 'ESSE (US)', label: 'SOLOTOKO', url: '#', duration: '6:12' },
                { id: 'bp-3', rank: 3, title: 'Loco Loco (Extended Mix)', artist: 'Reinier Zonneveld, GORDO (US)', label: 'Filth on Acid', url: '#', duration: '7:01' },
                { id: 'bp-4', rank: 4, title: 'Out of My Mind (Extended Mix)', artist: 'Joshwa', label: 'Insomniac Records', url: '#', duration: '5:23' },
                { id: 'bp-5', rank: 5, title: 'Good Time (Extended Mix)', artist: 'Trace (UZ)', label: 'Sink or Swim', url: '#', duration: '5:30' },
                { id: 'bp-6', rank: 6, title: 'Just Like That (Original Mix)', artist: 'SOSA (UK)', label: 'COCO', url: '#', duration: '6:04' },
                { id: 'bp-7', rank: 7, title: 'Swagger (Extended)', artist: 'HILLS (US), WELKER (BR)', label: 'HITS HARD', url: '#', duration: '5:15' },
                { id: 'bp-8', rank: 8, title: 'Jamaican (Bam Bam) (Extended Mix)', artist: 'Hugel, SOLTO (FR)', label: 'Sony Music', url: '#', duration: '4:52' },
                { id: 'bp-9', rank: 9, title: 'Never Alone (Extended Mix)', artist: 'Odd Mob, Lizzy Land', label: 'Tinted Records', url: '#', duration: '5:38' },
                { id: 'bp-10', rank: 10, title: 'Vision Blurred (Extended Mix)', artist: 'Kaskade, CID, Anabel Englund', label: 'Arkade', url: '#', duration: '6:21' },
            ];
        }
        if (platform === 'traxsource') {
            return [
                { id: 'ts-1', rank: 1, title: 'No Hesitating (Max Dean Remix)', artist: 'Joe Rolét', label: 'Solid Grooves', url: '#', duration: '6:30' },
                { id: 'ts-2', rank: 2, title: 'Positive (Extended Mix)', artist: 'Jamback', label: 'Piv', url: '#', duration: '5:55' },
                { id: 'ts-3', rank: 3, title: 'The Feeling', artist: 'Adam Port, Stryv', label: 'Keinemusik', url: '#', duration: '4:20' },
                { id: 'ts-4', rank: 4, title: 'Move', artist: 'Keinemusik', label: 'Keinemusik', url: '#', duration: '7:15' },
                { id: 'ts-5', rank: 5, title: 'Shiver', artist: 'John Summit', label: 'Experts Only', url: '#', duration: '5:45' },
                { id: 'ts-6', rank: 6, title: 'Honey', artist: 'Anyma', label: 'Afterlife', url: '#', duration: '6:02' },
                { id: 'ts-7', rank: 7, title: 'Dominos', artist: 'Vintage Culture', label: 'BOMA', url: '#', duration: '6:33' },
                { id: 'ts-8', rank: 8, title: 'Mwaki', artist: 'Zerb', label: 'Sthlm', url: '#', duration: '3:45' },
                { id: 'ts-9', rank: 9, title: 'Control', artist: 'Mochakk', label: 'CircoLoco', url: '#', duration: '6:18' },
                { id: 'ts-10', rank: 10, title: 'Beat Goes On', artist: 'Cloonee', label: 'Hellbent', url: '#', duration: '5:50' },
            ];
        }
        if (platform === 'hardtunes') {
            return [
                { id: 'ht-1', rank: 1, title: 'Bigger Than Hardcore', artist: 'Angerfist', label: 'Masters of Hardcore', url: '#', duration: '4:15' },
                { id: 'ht-2', rank: 2, title: 'Darkside', artist: 'Sefa', label: 'Sefa Music', url: '#', duration: '3:58' },
                { id: 'ht-3', rank: 3, title: 'Warriors', artist: 'Miss K8', label: 'Masters of Hardcore', url: '#', duration: '4:05' },
                { id: 'ht-4', rank: 4, title: 'Legacy', artist: 'Mad Dog', label: 'Dogfight Records', url: '#', duration: '4:22' },
                { id: 'ht-5', rank: 5, title: 'Fallen Angel', artist: 'N-Vitral', label: 'Masters of Hardcore', url: '#', duration: '4:10' },
                { id: 'ht-6', rank: 6, title: 'Psycho', artist: 'Dr. Peacock', label: 'Peacock Records', url: '#', duration: '3:45' },
                { id: 'ht-7', rank: 7, title: 'Domination', artist: 'Deadly Guns', label: 'Blacklist', url: '#', duration: '4:30' },
                { id: 'ht-8', rank: 8, title: 'Rebirth', artist: 'D-Sturb', label: 'End of Line', url: '#', duration: '4:02' },
                { id: 'ht-9', rank: 9, title: 'Hyperdrive', artist: 'Sub Zero Project', label: 'Dirty Workz', url: '#', duration: '3:55' },
                { id: 'ht-10', rank: 10, title: 'The Power', artist: 'Sound Rush', label: 'Art of Creation', url: '#', duration: '4:08' },
            ];
        }
        if (platform === '1001tracklists') {
            return [
                { id: '1001-1', rank: 1, title: 'ALESSA.A @ TOMORROWLAND 2026', artist: 'ALESSA.A', label: 'MAINSTAGE', url: '#' },
                { id: '1001-2', rank: 2, title: 'DAVID GUETTA @ ULTRA MIAMI 2026', artist: 'DAVID GUETTA', label: 'MAIN STAGE', url: '#' },
                { id: '1001-3', rank: 3, title: 'FISHER @ COACHELLA 2026', artist: 'FISHER', label: 'OUTDOOR STAGE', url: '#' },
                { id: '1001-4', rank: 4, title: 'ANYMA @ SPHERE LAS VEGAS', artist: 'ANYMA', label: 'AFTERLIFE', url: '#' },
                { id: '1001-5', rank: 5, title: 'CHARLOTTE DE WITTE @ AWAKENINGS', artist: 'CHARLOTTE DE WITTE', label: 'KNTXT', url: '#' },
                { id: '1001-6', rank: 6, title: 'VINTAGE CULTURE @ HI IBIZA', artist: 'VINTAGE CULTURE', label: 'THEATRE', url: '#' },
                { id: '1001-7', rank: 7, title: 'FRED AGAIN.. @ READING 2026', artist: 'FRED AGAIN..', label: 'MAIN STAGE', url: '#' },
                { id: '1001-8', rank: 8, title: 'MAU P @ SPACE MIAMI', artist: 'MAU P', label: 'TERRACE', url: '#' },
                { id: '1001-9', rank: 9, title: 'DOM DOLLA @ PARLOUX', artist: 'DOM DOLLA', label: 'CLUB', url: '#' },
                { id: '1001-10', rank: 10, title: 'CARL COX @ RESISTANCE', artist: 'CARL COX', label: 'MEGASTRUCTURE', url: '#' },
            ];
        }
        return Array.from({ length: 10 }, (_, i) => ({
            id: `${platform}-${i}`,
            rank: i + 1,
            title: i === 0 ? 'What You Want' : `Electronic Anthem #${i + 1}`,
            artist: i === 0 ? 'Justice, Angèle' : `Producer ${i + 1}`,
            label: `Record Label ${i + 1}`,
            url: '#'
        }));
    };

    const handleTrackClick = (track: Track) => {
        if (activeTab === '1001tracklists') {
            setSelectedTracklist(TRACKLIST_MOCK[track.id] || {
                id: track.id,
                title: track.title,
                artist: track.artist,
                tracks: [
                    { title: 'Intro (Live Edit)', artist: track.artist, time: '00:00' },
                    { title: 'New ID (Original Mix)', artist: 'Unknown', time: '05:40' },
                    { title: 'Electronic Anthem', artist: 'Dropsiders Favorite', time: '10:15' }
                ]
            });
        } else {
            setPlayingTrack(track);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-12 xl:px-16 2xl:px-24 bg-[#050505]">
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
                        TRACKS <span className="text-neon-red">STUDIO</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-xs md:text-sm font-black uppercase tracking-[0.3em]">
                        LES CHARTS LES PLUS INFLUENTS DE LA PLANÈTE
                    </p>
                </div>

                {/* Platform Selector */}
                <div className="flex flex-wrap justify-center gap-3">
                    {platforms.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setActiveTab(p.id)}
                            className={`group relative flex items-center gap-3 px-8 py-5 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${activeTab === p.id
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
                            <p.icon className={`w-5 h-5 relative z-10 ${activeTab === p.id ? 'animate-pulse' : ''}`} />
                            <span className="font-black text-[10px] uppercase tracking-widest relative z-10">{p.name}</span>
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
                                className="grid lg:grid-cols-1 gap-3"
                            >
                                {getMockData(activeTab).map((track, i) => (
                                    <motion.div
                                        key={track.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                                    >
                                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                            <div className="absolute inset-0 bg-white/5 rounded-2xl rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                                            <span className="relative text-2xl font-black italic text-white/10 group-hover:text-neon-red transition-colors">
                                                {track.rank}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => handleTrackClick(track)}
                                                className="block hover:underline text-left group/title"
                                            >
                                                <h3 className="text-lg font-black text-white uppercase italic tracking-tight truncate group-hover:text-neon-red transition-colors flex items-center gap-3">
                                                    {track.title}
                                                    {activeTab !== '1001tracklists' && (
                                                        <div className="invisible group-hover:visible flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-red animate-ping" />
                                                            <span className="text-[9px] font-black tracking-[0.2em] text-neon-red">LISTEN</span>
                                                        </div>
                                                    )}
                                                </h3>
                                            </button>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">
                                                    {track.artist}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {track.label}
                                                </span>
                                            </div>
                                        </div>

                                        <a
                                            href={track.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-neon-red hover:border-neon-red hover:text-white transition-all group/btn"
                                        >
                                            <ExternalLink className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        </a>
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
                        DATA UPDATE EVERY 24H • DROPSIDERS NETWORK 2026
                    </p>
                </div>
            </motion.div>

            {/* Audio Mini-Player Floating */}
            <AnimatePresence>
                {playingTrack && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] z-[200]"
                    >
                        <div className="relative bg-black border-2 border-white/10 rounded-3xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden group">
                            {/* Player BG Glow */}
                            <div className="absolute inset-0 bg-neon-red/5" />

                            <div className="relative flex items-center gap-6">
                                <div className="w-20 h-20 bg-neon-red rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(255,17,17,0.3)] animate-spin-slow">
                                    <Disc className="w-10 h-10 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-black text-neon-red uppercase tracking-widest animate-pulse">
                                            Now Previewing • Top Chart
                                        </span>
                                        <button onClick={() => setPlayingTrack(null)} className="text-gray-500 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-black text-white uppercase italic tracking-tight truncate">
                                        {playingTrack.title}
                                    </h4>
                                    <p className="text-[11px] font-black text-neon-cyan uppercase tracking-[0.2em] mb-4">
                                        {playingTrack.artist}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-neon-red"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "65%" }}
                                                transition={{ duration: 30, repeat: Infinity }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[8px] font-bold text-gray-500">
                                            <span>01:45</span>
                                            <span>{playingTrack.duration || '05:30'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="p-4 bg-white text-black rounded-2xl shadow-xl"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-6 h-6 fill-black" />
                                        ) : (
                                            <Play className="w-6 h-6 fill-black" />
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                    href="https://www.1001tracklists.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-neon-red text-[10px] font-black uppercase tracking-widest hover:underline"
                                >
                                    Full Set Info <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Musique;

