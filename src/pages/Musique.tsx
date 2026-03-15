import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Disc, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

import { EqualizerLoader } from '../components/ui/EqualizerLoader';

interface Track {
    id: string;
    rank: number;
    title: string;
    artist: string;
    label: string;
    url: string;
    preview?: string;
    embedUrl?: string;
    tracks?: Array<{ title: string; artist: string; time?: string }>;
}

interface UpcomingTrack {
    id: string;
    title: string;
    artist: string;
    label: string;
    releaseDate: string;
    image: string;
    url: string;
}

interface TracklistContent {
    id: string;
    title: string;
    artist: string;
    event: string;
    date: string;
    tracks: Array<{ title: string; artist: string; time?: string }>;
    embedUrl?: string;
}



export function Musique() {
    const [activeTab, setActiveTab] = useState('beatport');
    const [chartsData, setChartsData] = useState<Record<string, Track[]>>({});
    const [upcomingData, setUpcomingData] = useState<UpcomingTrack[]>([]);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [allTracklists, setAllTracklists] = useState<TracklistContent[]>([]);

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/musique/charts')
            .then(res => res.json())
            .then(data => {
                const { lastUpdate, upcoming, ...charts } = data;
                setChartsData(charts);
                setUpcomingData(upcoming || []);
                setLastUpdate(lastUpdate);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Charts fetch error", err);
                setIsLoading(false);
            });

        fetch('/api/tracklists')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAllTracklists(data.map((t: any) => ({
                        ...t,
                        id: t.id,
                        title: t.title,
                        artist: t.artist,
                        event: t.event || 'Live Stream',
                        date: t.date || new Date().toISOString(),
                        tracks: t.tracks,
                        embedUrl: t.embedUrl
                    })));
                }
            })
            .catch(err => console.error("Tracklists fetch error", err));
    }, []);



    const platforms = [
        { id: 'beatport', name: 'Beatport', color: '#39ff14', icon: Music },
        { id: 'traxsource', name: 'Traxsource', color: '#ffaa00', icon: Disc },
        { id: 'tracklists', name: 'Live Sets', color: '#b026ff', icon: Music },
    ];

    const currentData = activeTab === 'tracklists' 
        ? allTracklists.map((t, i) => ({ ...t, rank: i + 1 } as unknown as Track))
        : chartsData[activeTab] || [];

    return (
        <div className="min-h-screen bg-[#020202] text-white">

            
            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img 
                        src="/music_hero_background_1773611643174.png" 
                        alt="Hero" 
                        className="w-full h-full object-cover scale-105 blur-[2px] opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent" />
                </div>
                
                <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8]">
                            DROPSIDERS<br />
                            <span className="text-neon-cyan">WORLD CHARTS</span>
                        </h1>
                    </motion.div>
                </div>
            </div>

            {/* Platform & Tabs Navigation */}
            <div className="sticky top-0 z-[100] bg-[#020202]/80 backdrop-blur-2xl border-b border-white/5 py-6">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
                        {platforms.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActiveTab(p.id)}
                                className={`px-6 md:px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${
                                    activeTab === p.id ? 'text-black' : 'text-white/40 hover:text-white'
                                }`}
                            >
                                {activeTab === p.id && (
                                    <motion.div 
                                        layoutId="tab-bg"
                                        className="absolute inset-0 bg-white"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{p.name}</span>
                            </button>
                        ))}
                    </div>
                    
                    {lastUpdate && (
                        <div className="hidden md:flex items-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-neon-green/20 border border-neon-green animate-pulse" />
                            UPDATED: {new Date(parseInt(lastUpdate)).toLocaleDateString('fr-FR')}
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-20">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-40 gap-8"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-neon-cyan/20 blur-3xl rounded-full" />
                                <EqualizerLoader count={16} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.6em] animate-pulse text-neon-cyan">
                                Syncing with {activeTab.toUpperCase()}...
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-32"
                        >
                            {/* Modern List Layout */}
                            <div className="grid grid-cols-1 gap-4">
                                {currentData.length === 0 ? (
                                    <div className="text-center py-20 border border-dashed border-white/10 rounded-[40px] text-white/20 font-black uppercase tracking-widest">
                                        No data available for this section
                                    </div>
                                ) : (
                                    currentData.map((track, i) => (
                                        <motion.div
                                            key={track.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`group relative overflow-hidden rounded-[32px] border transition-all duration-500 ${
                                                selectedTrack?.id === track.id
                                                ? 'bg-white border-white scale-[1.02] shadow-[0_30px_60px_rgba(255,255,255,0.1)]'
                                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            <div 
                                                className="flex flex-col md:flex-row items-center cursor-pointer px-6 md:px-10 py-6 md:py-8"
                                                onClick={() => {
                                                    if (selectedTrack?.id === track.id) setSelectedTrack(null);
                                                    else setSelectedTrack(track);
                                                }}
                                            >
                                                {/* Rank/Number */}
                                                <div className={`text-4xl md:text-6xl font-black italic tracking-tighter mr-8 w-16 text-center ${
                                                    selectedTrack?.id === track.id ? 'text-black' : 'text-white/10'
                                                }`}>
                                                    {(i + 1).toString().padStart(2, '0')}
                                                </div>

                                                {/* Meta Info */}
                                                <div className="flex-1 min-w-0 text-center md:text-left">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                                                        <h3 className={`text-xl md:text-3xl font-black uppercase italic tracking-tight truncate leading-none ${
                                                            selectedTrack?.id === track.id ? 'text-black' : 'text-white'
                                                        }`}>
                                                            {track.title}
                                                        </h3>
                                                        {activeTab === 'tracklists' && (
                                                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${
                                                                selectedTrack?.id === track.id ? 'bg-black text-white' : 'bg-neon-purple/20 text-neon-purple border border-neon-purple/20'
                                                            }`}>
                                                                Live Set
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs md:text-sm font-black uppercase tracking-[0.3em] ${
                                                        selectedTrack?.id === track.id ? 'text-black/60' : 'text-neon-cyan'
                                                    }`}>
                                                        {track.artist}
                                                    </p>
                                                </div>

                                                {/* Label / Event */}
                                                <div className="hidden lg:block w-48 px-8">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] block truncate ${
                                                        selectedTrack?.id === track.id ? 'text-black/40' : 'text-white/20'
                                                    }`}>
                                                        {track.label || (track as any).event}
                                                    </span>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex items-center gap-4 mt-6 md:mt-0">
                                                    <button className={`p-4 rounded-2xl border transition-all ${
                                                        selectedTrack?.id === track.id 
                                                        ? 'bg-black text-white border-black' 
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                                    }`}>
                                                        {selectedTrack?.id === track.id ? (
                                                            <ChevronUp className="w-5 h-5" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                    
                                                    {track.url && track.url !== '#' && (
                                                        <a 
                                                            href={track.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className={`p-4 rounded-2xl border transition-all ${
                                                                selectedTrack?.id === track.id 
                                                                ? 'bg-black/5 border-black/10 hover:bg-black text-white hover:border-black' 
                                                                : 'bg-white/5 border-white/10 hover:bg-white hover:text-black hover:border-white'
                                                            }`}
                                                        >
                                                            <ExternalLink className="w-5 h-5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expandable Player / Tracklist */}
                                            <AnimatePresence>
                                                {selectedTrack?.id === track.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden border-t border-black/5"
                                                    >
                                                        {track.tracks ? (
                                                            /* Live Tracklist View */
                                                            <div className="bg-black/5 p-6 md:p-8 space-y-8">
                                                                <div className="grid md:grid-cols-2 gap-8">
                                                                    <div className="space-y-6">
                                                                        <div className="space-y-1">
                                                                            <h4 className="text-black text-2xl font-black italic uppercase tracking-tighter leading-none">Complete Tracklist</h4>
                                                                            <p className="text-black/40 text-[8px] font-black uppercase tracking-widest italic">Live Broadcast</p>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-0.5">
                                                                            {track.tracks.map((t, idx) => (
                                                                                <div key={idx} className="flex items-center gap-4 py-2 border-b border-black/5 group/t-item">
                                                                                    <span className="text-[10px] font-black text-black/20 w-6">{idx + 1}</span>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-[11px] font-black text-black uppercase tracking-tight truncate group-hover/t-item:text-neon-purple transition-colors">
                                                                                            {t.title}
                                                                                        </p>
                                                                                        <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest">{t.artist}</p>
                                                                                    </div>
                                                                                    {t.time && <span className="text-[8px] font-black text-black/40 tabular-nums">{t.time}</span>}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-6">
                                                                        {track.embedUrl ? (
                                                                            <div className="rounded-xl overflow-hidden border border-black/10 bg-black shadow-lg">
                                                                                <iframe 
                                                                                    width="100%" 
                                                                                    height={track.id.startsWith('ts-') ? "210" : "170"} 
                                                                                    src={track.embedUrl?.includes('?') ? `${track.embedUrl}&autoplay=0` : `${track.embedUrl}?autoplay=0`} 
                                                                                    frameBorder="0"
                                                                                    scrolling="no"
                                                                                    className="grayscale brightness-110 overflow-hidden"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="aspect-video rounded-2xl bg-black flex flex-col items-center justify-center p-8 text-center text-white space-y-2">
                                                                                <Disc className="w-8 h-8 animate-spin-slow opacity-20" />
                                                                                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">No preview available</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Standard Player View */
                                                            <div className="bg-black/5 p-4 md:p-6 lg:p-8">
                                                                <div className="max-w-4xl mx-auto">
                                                                    {track.embedUrl ? (
                                                                        <div className="rounded-xl overflow-hidden border border-black/10 bg-white shadow-xl">
                                                                            <iframe 
                                                                                width="100%" 
                                                                                height={track.id.startsWith('ts-') ? "210" : "170"} 
                                                                                src={track.embedUrl?.includes('?') ? `${track.embedUrl}&autoplay=0` : `${track.embedUrl}?autoplay=0`} 
                                                                                frameBorder="0"
                                                                                scrolling="no"
                                                                                className="block w-full overflow-hidden"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="py-12 flex flex-col items-center justify-center text-black/20 space-y-4">
                                                                            <Disc className="w-12 h-12 animate-spin-slow opacity-20" />
                                                                            <p className="text-[10px] font-black uppercase tracking-widest italic">No preview available from provider</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Upcoming Section - Redesigned */}
                            {upcomingData.length > 0 && (
                                <div className="space-y-16">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] text-white">
                                            THE FUTURE <br />
                                            <span className="text-neon-cyan opacity-50">OF DROPSIDERS</span>
                                        </h2>
                                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-white/30">Upcoming Releases • Global Distribution</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {upcomingData.map((release, i) => (
                                            <motion.a
                                                key={release.id}
                                                href={release.url}
                                                target="_blank"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group space-y-6"
                                            >
                                                <div className="aspect-square rounded-[32px] overflow-hidden bg-white/5 border border-white/10 relative shadow-2xl transition-all duration-700 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)] group-hover:border-white/20">
                                                    <img 
                                                        src={release.image} 
                                                        alt={release.title} 
                                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#020202] via-transparent to-transparent opacity-60" />
                                                    
                                                    {/* Release Date Overlay */}
                                                    <div className="absolute top-8 left-8 p-4 bg-white text-black rounded-3xl shadow-2xl flex flex-col items-center min-w-[70px]">
                                                        <span className="text-xl font-black leading-none">{new Date(release.releaseDate).getDate()}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-40">{new Date(release.releaseDate).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="px-4 space-y-2">
                                                    <h4 className="text-xl font-black italic uppercase tracking-tighter leading-tight group-hover:text-neon-cyan transition-colors">{release.title}</h4>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">{release.artist}</p>
                                                </div>
                                            </motion.a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Premium Footer Info */}
            <footer className="border-t border-white/5 py-40 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-12">
                    <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 grayscale opacity-20 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                        {platforms.filter(p => p.id !== 'tracklists').map(p => (
                            <div key={p.id} className="flex flex-col items-center gap-4">
                                <img src={`/images/logos/${p.id}.png`} alt={p.name} className="h-10 w-auto object-contain" />
                                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Official Data Partner</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em] max-w-2xl mx-auto leading-loose">
                        Dropsiders network charts are curated from global sales and streaming data. <br />
                        Verified broadcast tracklists are extracted directly from our live studio recording systems.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Musique;


