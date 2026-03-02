import { useState, useEffect, useRef } from 'react';
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
    const [isLoading, setIsLoading] = useState(false);
    const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedTracklist, setSelectedTracklist] = useState<TracklistContent | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [activeTab]);

    useEffect(() => {
        if (playingTrack && !playingTrack.embedUrl) {
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.src = playingTrack.preview || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
            }
        }
    }, [playingTrack]);

    useEffect(() => {
        if (audioRef.current && !playingTrack?.embedUrl) {
            if (isPlaying) audioRef.current.play().catch(() => { });
            else audioRef.current.pause();
        }
    }, [isPlaying]);

    const platforms = [
        { id: 'beatport', name: 'Beatport Top 10', icon: Music, color: '#39ff14' },
        { id: 'traxsource', name: 'Traxsource Top 10', icon: Disc, color: '#ffaa00' },
        { id: 'hardtunes', name: 'Hardtunes Top 10', icon: Zap, color: '#ff00ff' },
        { id: 'juno', name: 'Juno Download Top 10', icon: ListMusic, color: '#00f0ff' },
        { id: '1001tracklists', name: 'Most Viewed Tracklists', icon: TrendingUp, color: '#ff0033' },
    ];

    const getMockData = (platform: string): Track[] => {
        const samplePreview = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

        if (platform === 'beatport') {
            return [
                { id: 'bp-1', rank: 1, title: 'neck (Extended Mix)', artist: 'Mau P', label: 'Repopulate Mars', url: 'https://www.beatport.com/track/neck/18654321', duration: '5:42', preview: samplePreview, embedUrl: 'https://embed.beatport.com/player/?id=18654321&type=track' },
                { id: 'bp-2', rank: 2, title: 'Make My Day (Original Mix)', artist: 'ESSE (US)', label: 'SOLOTOKO', url: '#', duration: '6:12', preview: samplePreview },
                { id: 'bp-3', rank: 3, title: 'Loco Loco (Extended Mix)', artist: 'Reinier Zonneveld, GORDO (US)', label: 'Filth on Acid', url: '#', duration: '7:01', preview: samplePreview },
                { id: 'bp-4', rank: 4, title: 'Out of My Mind (Extended Mix)', artist: 'Joshwa', label: 'Insomniac Records', url: '#', duration: '5:23', preview: samplePreview },
                { id: 'bp-5', rank: 5, title: 'Good Time (Extended Mix)', artist: 'Trace (UZ)', label: 'Sink or Swim', url: '#', duration: '5:30', preview: samplePreview },
                { id: 'bp-6', rank: 6, title: 'Just Like That (Original Mix)', artist: 'SOSA (UK)', label: 'COCO', url: '#', duration: '6:04', preview: samplePreview },
                { id: 'bp-7', rank: 7, title: 'Swagger (Extended)', artist: 'HILLS (US), WELKER (BR)', label: 'HITS HARD', url: '#', duration: '5:15', preview: samplePreview },
                { id: 'bp-8', rank: 8, title: 'Jamaican (Bam Bam) (Extended Mix)', artist: 'Hugel, SOLTO (FR)', label: 'Sony Music', url: '#', duration: '4:52', preview: samplePreview },
                { id: 'bp-9', rank: 9, title: 'Never Alone (Extended Mix)', artist: 'Odd Mob, Lizzy Land', label: 'Tinted Records', url: '#', duration: '5:38', preview: samplePreview },
                { id: 'bp-10', rank: 10, title: 'Vision Blurred (Extended Mix)', artist: 'Kaskade, CID, Anabel Englund', label: 'Arkade', url: '#', duration: '6:21', preview: samplePreview },
            ];
        }
        if (platform === 'traxsource') {
            return [
                { id: 'ts-1', rank: 1, title: 'No Hesitating (Max Dean Remix)', artist: 'Joe Rolét', label: 'Solid Grooves', url: '#', duration: '6:30', embedUrl: 'https://embed.traxsource.com/player/track/9543128' },
                { id: 'ts-2', rank: 2, title: 'Positive (Extended Mix)', artist: 'Jamback', label: 'Piv', url: '#', duration: '5:55', embedUrl: 'https://embed.traxsource.com/player/track/9543130' },
                { id: 'ts-3', rank: 3, title: 'The Feeling', artist: 'Adam Port, Stryv', label: 'Keinemusik', url: '#', duration: '4:20', embedUrl: 'https://embed.traxsource.com/player/track/9543135' },
                { id: 'ts-4', rank: 4, title: 'Move', artist: 'Keinemusik', label: 'Keinemusik', url: '#', duration: '7:15', embedUrl: 'https://embed.traxsource.com/player/track/9543140' },
                { id: 'ts-5', rank: 5, title: 'Shiver', artist: 'John Summit', label: 'Experts Only', url: '#', duration: '5:45', embedUrl: 'https://embed.traxsource.com/player/track/9543145' },
                { id: 'ts-6', rank: 6, title: 'Honey', artist: 'Anyma', label: 'Afterlife', url: '#', duration: '6:02', embedUrl: 'https://embed.traxsource.com/player/track/9543150' },
                { id: 'ts-7', rank: 7, title: 'Dominos', artist: 'Vintage Culture', label: 'BOMA', url: '#', duration: '6:33', embedUrl: 'https://embed.traxsource.com/player/track/9543155' },
                { id: 'ts-8', rank: 8, title: 'Mwaki', artist: 'Zerb', label: 'Sthlm', url: '#', duration: '3:45', embedUrl: 'https://embed.traxsource.com/player/track/9543160' },
                { id: 'ts-9', rank: 9, title: 'Control', artist: 'Mochakk', label: 'CircoLoco', url: '#', duration: '6:18', embedUrl: 'https://embed.traxsource.com/player/track/9543165' },
                { id: 'ts-10', rank: 10, title: 'Beat Goes On', artist: 'Cloonee', label: 'Hellbent', url: '#', duration: '5:50', embedUrl: 'https://embed.traxsource.com/player/track/9543170' },
            ];
        }
        if (platform === 'hardtunes') {
            return [
                { id: 'ht-1', rank: 1, title: 'Bigger Than Hardcore', artist: 'Angerfist', label: 'Masters of Hardcore', url: '#', duration: '4:15', embedUrl: 'https://www.hardtunes.com/embed/track/angerfist-bigger-than-hardcore' },
                { id: 'ht-2', rank: 2, title: 'Darkside', artist: 'Sefa', label: 'Sefa Music', url: '#', duration: '3:58', preview: samplePreview },
                { id: 'ht-3', rank: 3, title: 'Warriors', artist: 'Miss K8', label: 'Masters of Hardcore', url: '#', duration: '4:05', preview: samplePreview },
                { id: 'ht-4', rank: 4, title: 'Legacy', artist: 'Mad Dog', label: 'Dogfight Records', url: '#', duration: '4:22', preview: samplePreview },
                { id: 'ht-5', rank: 5, title: 'Fallen Angel', artist: 'N-Vitral', label: 'Masters of Hardcore', url: '#', duration: '4:10', preview: samplePreview },
                { id: 'ht-6', rank: 6, title: 'Psycho', artist: 'Dr. Peacock', label: 'Peacock Records', url: '#', duration: '3:45', preview: samplePreview },
                { id: 'ht-7', rank: 7, title: 'Domination', artist: 'Deadly Guns', label: 'Blacklist', url: '#', duration: '4:30', preview: samplePreview },
                { id: 'ht-8', rank: 8, title: 'Rebirth', artist: 'D-Sturb', label: 'End of Line', url: '#', duration: '4:02', preview: samplePreview },
                { id: 'ht-9', rank: 9, title: 'Hyperdrive', artist: 'Sub Zero Project', label: 'Dirty Workz', url: '#', duration: '3:55', preview: samplePreview },
                { id: 'ht-10', rank: 10, title: 'The Power', artist: 'Sound Rush', label: 'Art of Creation', url: '#', duration: '4:08', preview: samplePreview },
            ];
        }
        if (platform === 'juno') {
            return [
                { id: 'jn-1', rank: 1, title: 'Control', artist: 'Mochakk', label: 'CircoLoco', url: '#', duration: '6:12', preview: samplePreview },
                { id: 'jn-2', rank: 2, title: 'Beat Goes On', artist: 'Cloonee', label: 'Hellbent', url: '#', duration: '5:48', preview: samplePreview },
                { id: 'jn-3', rank: 3, title: 'Mwaki', artist: 'Zerb', label: 'Sthlm', url: '#', duration: '3:30', preview: samplePreview },
                { id: 'jn-4', rank: 4, title: 'Shiver', artist: 'John Summit', label: 'Experts Only', url: '#', duration: '5:12', preview: samplePreview },
                { id: 'jn-5', rank: 5, title: 'Honey', artist: 'Anyma', label: 'Afterlife', url: '#', duration: '6:04', preview: samplePreview },
                { id: 'jn-6', rank: 6, title: 'Dominos', artist: 'Vintage Culture', label: 'BOMA', url: '#', duration: '6:25', preview: samplePreview },
                { id: 'jn-7', rank: 7, title: 'The Feeling', artist: 'Adam Port', label: 'Keinemusik', url: '#', duration: '4:18', preview: samplePreview },
                { id: 'jn-8', rank: 8, title: 'Positive', artist: 'Jamback', label: 'Piv', url: '#', duration: '6:01', preview: samplePreview },
                { id: 'jn-9', rank: 9, title: 'Make My Day', artist: 'ESSE (US)', label: 'SOLOTOKO', url: '#', duration: '5:52', preview: samplePreview },
                { id: 'jn-10', rank: 10, title: 'Just Like That', artist: 'SOSA (UK)', label: 'COCO', url: '#', duration: '5:45', preview: samplePreview },
            ];
        }
        if (platform === '1001tracklists') {
            return [
                {
                    id: '1001-trending-1', rank: 1, title: 'ARMIN VAN BUUREN @ AREA ONE, ASOT FESTIVAL', artist: 'ARMIN VAN BUUREN', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/armin-van-buuren-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    embedUrl: 'https://www.youtube.com/embed/5m3O73_zR_0',
                    tracks: [
                        { title: 'Always You (ASOT 2026 Elevation Anthem)', artist: 'Armin van Buuren', time: '00:00' },
                        { title: 'Mouth Go LaLa', artist: 'Armin van Buuren & Maddix', time: '04:30' },
                        { title: 'Don\'t Be Afraid', artist: 'Moonman & Ferry Corsten & Joris Voorn', time: '08:15' },
                        { title: 'Destiny', artist: 'Layton Giordani ft. Camden Cox', time: '12:45' },
                        { title: 'Computers Take Over The World', artist: 'Armin van Buuren', time: '16:10' },
                        { title: 'High On Emotion', artist: 'Maddix', time: '19:45' },
                        { title: 'Dopamine Machine', artist: 'Armin van Buuren & Lilly Palmer', time: '23:20' },
                        { title: 'Exploration of Space (Remix)', artist: 'Cosmic Gate', time: '28:15' },
                        { title: 'Blah Blah Blah', artist: 'Armin van Buuren', time: '32:40' }
                    ]
                },
                {
                    id: '1001-trending-2', rank: 2, title: 'FRED AGAIN.. & THOMAS BANGALTER @ USB002', artist: 'FRED AGAIN.., THOMAS BANGALTER', label: 'ALEXANDRA PALACE', url: 'https://www.1001tracklists.com/tracklist/1ybr6v2k/fred-again-thomas-bangalter-usb002-alexandra-palace-london-united-kingdom-2026-02-27.html',
                    embedUrl: 'https://www.youtube.com/embed/YF0RmSy8FmY',
                    tracks: [
                        { title: 'Turn On The Lights again..', artist: 'Fred again..', time: '00:00' },
                        { title: 'Music Sounds Better With You', artist: 'Stardust', time: '05:12' },
                        { title: 'Adored (Thomas Bangalter Remix)', artist: 'Fred again..', time: '09:45' },
                        { title: 'Human After All', artist: 'Daft Punk (2026 Edit)', time: '14:30' },
                        { title: 'Rumble', artist: 'Skrillex, Fred again.. & Flowdan', time: '18:15' },
                        { title: 'Strong', artist: 'Fred again.. & Romy', time: '22:40' },
                        { title: 'Delilah (pull me out of this)', artist: 'Fred again..', time: '26:50' },
                        { title: 'Leavemealone', artist: 'Fred again.. & Baby Keem', time: '31:15' }
                    ]
                },
                {
                    id: '1001-trending-3', rank: 3, title: 'ARMIN VAN BUUREN & OLIVER HELDENS & MADDIX @ AREA ONE', artist: 'ARMIN VAN BUUREN, OLIVER HELDENS, MADDIX', label: 'ASOT FESTIVAL', url: 'https://www.1001tracklists.com/tracklist/1z6k8vj1/armin-van-buuren-oliver-heldens-maddix-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    embedUrl: 'https://www.youtube.com/embed/5m3O73_zR_0',
                    tracks: [
                        { title: 'High On Emotion', artist: 'Maddix', time: '00:00' },
                        { title: 'Bucovina', artist: 'Oliver Heldens', time: '04:20' },
                        { title: 'Dopamine Machine', artist: 'Armin van Buuren & Lilly Palmer', time: '08:40' },
                        { title: 'Transmission', artist: 'Maddix & Olly James & Hannah Laing', time: '13:10' },
                        { title: 'Mouth Go LaLa', artist: 'Armin van Buuren & Maddix', time: '17:45' },
                        { title: 'Universal Nation (ID Remix)', artist: 'Push', time: '22:30' },
                        { title: 'Silence (ID Remix)', artist: 'Delerium ft. Sarah McLachlan', time: '28:15' },
                        { title: 'Rescue Me (Technikal Remix)', artist: 'Sam & Deano & Ben Stevens', time: '34:00' },
                        { title: 'It\'s That Time', artist: 'Marlon Hoffstadt', time: '40:15' },
                        { title: 'Elevation Anthem', artist: 'Armin van Buuren', time: '45:30' }
                    ]
                },
                {
                    id: '1001-trending-4', rank: 4, title: 'ARMIN VAN BUUREN @ 25 YEARS CELEBRATION SET', artist: 'ARMIN VAN BUUREN', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/armin-van-buuren-25-years-celebration-set-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-27.html',
                    tracks: [
                        { title: 'Communication (Classic Mix)', artist: 'Armin van Buuren', time: '00:00' },
                        { title: 'Shivers', artist: 'Armin van Buuren', time: '06:15' },
                        { title: 'Great Spirit', artist: 'Armin van Buuren vs. Vini Vici', time: '12:30' }
                    ]
                },
                {
                    id: '1001-trending-5', rank: 5, title: 'MEDUZA & DREYA V - AETERNA RADIO 011', artist: 'MEDUZA', label: 'AETERNA', url: 'https://www.1001tracklists.com/tracklist/1l5u2v8k/meduza-dreya-v-aeterna-radio-011-2026-03-01.html',
                    embedUrl: 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=%2Fmeduzamusic%2Faeterna-radio-011%2F',
                    tracks: [
                        { title: 'Addicted To Bass (Dom Dolla Remix)', artist: 'Puretone', time: '00:00' },
                        { title: 'Never Alone', artist: 'Odd Mob ft. Lizzy Land', time: '05:45' }
                    ]
                },
                {
                    id: '1001-trending-6', rank: 6, title: 'TIËSTO - PRISMATIC 009', artist: 'TIËSTO', label: 'MUSICAL FREEDOM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/tiesto-prismatic-009-2026-02-28.html',
                    tracks: [
                        { title: 'Beautiful Places', artist: 'Tiësto & Brieanna Grace', time: '00:00' },
                        { title: 'BOOM', artist: 'Tiësto', time: '04:12' }
                    ]
                },
                {
                    id: '1001-trending-7', rank: 7, title: 'RICHARD DURAND @ AREA TWO, ASOT FESTIVAL', artist: 'RICHARD DURAND', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/richard-durand-area-two-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Always You (Richard Durand Remix)', artist: 'Armin van Buuren', time: '00:00' }
                    ]
                },
                {
                    id: '1001-trending-8', rank: 8, title: 'COSMIC GATE @ AREA TWO, ASOT FESTIVAL', artist: 'COSMIC GATE', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/cosmic-gate-area-two-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Exploration of Space (2026 Edit)', artist: 'Cosmic Gate', time: '00:00' }
                    ]
                },
                {
                    id: '1001-trending-9', rank: 9, title: 'NIFRA @ AREA ONE, ASOT FESTIVAL', artist: 'NIFRA', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/nifra-area-one-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Resistance', artist: 'Nifra', time: '00:00' }
                    ]
                },
                {
                    id: '1001-trending-10', rank: 10, title: 'ANDREW RAYEL PRES. EXTASIA @ AREA TWO, ASOT FESTIVAL', artist: 'ANDREW RAYEL', label: 'AHOY ROTTERDAM', url: 'https://www.1001tracklists.com/tracklist/2v6n9uk1/andrew-rayel-pres.-extasia-area-two-a-state-of-trance-festival-ahoy-rotterdam-netherlands-2026-02-28.html',
                    tracks: [
                        { title: 'Extasia (Official Anthem)', artist: 'Andrew Rayel', time: '00:00' }
                    ]
                }
            ];
        }

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
        if (activeTab === '1001tracklists') {
            setSelectedTracklist({
                id: track.id,
                title: track.title,
                artist: track.artist,
                embedUrl: track.embedUrl,
                tracks: track.tracks || [
                    { title: 'Intro (Live Edit)', artist: track.artist, time: '00:00' },
                    { title: 'Electronic Anthem', artist: 'Dropsiders Favorite', time: '10:15' }
                ]
            });
        } else {
            // Toggle expanded player
            if (playingTrack?.id === track.id) {
                setPlayingTrack(null);
                if (isPlaying) {
                    setIsPlaying(false);
                    audioRef.current?.pause();
                }
            } else {
                setPlayingTrack(track);
                if (track.preview) {
                    if (audioRef.current) {
                        audioRef.current.src = track.preview;
                        audioRef.current.play();
                        setIsPlaying(true);
                    }
                }
            }
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
                            data-cursor-color={p.color}
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
                                        className="group flex flex-col gap-0 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-6 p-6">
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
                                                            <div className={`flex items-center gap-1 ${playingTrack?.id === track.id ? 'visible' : 'invisible group-hover:visible'}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${playingTrack?.id === track.id ? 'bg-neon-green' : 'bg-neon-red'} animate-ping`} />
                                                                <span className={`text-[9px] font-black tracking-[0.2em] ${playingTrack?.id === track.id ? 'text-neon-green' : 'text-neon-red'}`}>
                                                                    {playingTrack?.id === track.id ? 'PLAYING' : 'LISTEN'}
                                                                </span>
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
                                        </div>

                                        <AnimatePresence>
                                            {playingTrack?.id === track.id && activeTab !== '1001tracklists' && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-6 pb-6 overflow-hidden"
                                                >
                                                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl">
                                                        {track.embedUrl ? (
                                                            <iframe
                                                                src={track.embedUrl}
                                                                className="w-full h-[150px] border-none"
                                                                allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            />
                                                        ) : (
                                                            <div className="p-8 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                className="h-full bg-neon-red"
                                                                                initial={{ width: "0%" }}
                                                                                animate={{ width: isPlaying ? "100%" : "0%" }}
                                                                                transition={{ duration: 30, ease: "linear" }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <span className="ml-4 text-[10px] font-black text-gray-400">PREVIEW</span>
                                                                </div>
                                                                <div className="flex justify-center">
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
                                                                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                                                    >
                                                                        {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                                                                    </button>
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
                        DATA UPDATE EVERY 24H • DROPSIDERS NETWORK 2026
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

