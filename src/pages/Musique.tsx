import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Disc, ExternalLink, ChevronDown, ChevronUp, Filter, Loader2, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/utils/SEO';
import { resolveImageUrl } from '../utils/image';
import { CustomMixPlayer } from '../components/widgets/CustomMixPlayer';

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
    url?: string;
}

export function Musique() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('beatport');
    const [chartsData, setChartsData] = useState<Record<string, Track[]>>({});
    const [upcomingData, setUpcomingData] = useState<UpcomingTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [allTracklists, setAllTracklists] = useState<TracklistContent[]>([]);
    const [activeMix, setActiveMix] = useState<TracklistContent | null>(null);
    const mixPlayerRef = useRef<HTMLDivElement>(null);

    // ── Handle Magic Share Link params from URL ──────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const playId = params.get('play');
        if (playId && allTracklists.length > 0) {
            const found = allTracklists.find(tl => tl.id === playId);
            if (found) {
                setActiveTab('tracklists');
                setActiveMix(found);
                // Smooth scroll to the player after a short delay
                setTimeout(() => {
                    mixPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 600);
            }
        }
    }, [allTracklists]);

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/musique/charts')
            .then(res => res.json())
            .then(data => {
                const { upcoming, ...charts } = data;
                setChartsData(charts);
                setUpcomingData(upcoming || []);
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
                    setAllTracklists(data.map((tl: any) => ({
                        ...tl,
                        id: tl.id,
                        title: tl.title,
                        artist: tl.artist,
                        event: tl.event || 'Live Stream',
                        date: tl.date || new Date().toISOString(),
                        tracks: tl.tracks,
                        embedUrl: tl.embedUrl,
                        url: tl.url || '#',
                    })));
                }
            })
            .catch(err => console.error("Tracklists fetch error", err));
    }, []);

    const platforms = [
        { id: 'beatport', label: 'Beatport', name: 'Beatport', activeClass: 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]', inactiveClass: 'text-white/40 border-white/10 hover:border-white/30 hover:text-white' },
        { id: 'traxsource', label: 'Traxsource', name: 'Traxsource', activeClass: 'bg-[#ffaa00] text-white shadow-[0_0_20px_rgba(255,170,0,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-[#ffaa00]/40 hover:text-[#ffaa00]' },
        { id: 'tracklists', label: 'Live Sets', name: 'Live Sets', activeClass: 'bg-neon-purple text-white shadow-[0_0_20px_rgba(176,38,255,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-purple/40 hover:text-neon-purple' },
    ];

    const currentData = activeTab === 'tracklists'
        ? allTracklists.map((tl, i) => ({ ...tl, rank: i + 1 } as unknown as Track))
        : chartsData[activeTab] || [];

    return (
        <div className="min-h-screen bg-dark-bg text-white relative">
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse transition-all duration-1000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/5 animate-pulse [animation-delay:2s] transition-all duration-1000" />
                {/* Extra purple glow when Live Sets tab is active */}
                <div className={`absolute top-[30%] right-[5%] w-[40%] h-[40%] rounded-full blur-[120px] bg-neon-purple/8 transition-all duration-1000 ${activeTab === 'tracklists' ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            <SEO
                title={t('musique.world_charts')}
                description={t('musique.subtitle')}
            />

            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 pt-24 pb-12 sm:pt-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center sm:text-left"
                >
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                        <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20 shadow-[0_0_15px_rgba(255,0,51,0.1)]">
                            <Music className="w-5 h-5 text-neon-red" />
                        </div>
                        <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">{t('musique.world_charts')}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
                        {t('musique.title')}<span className="text-neon-red">{t('musique.title_span')}</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-base md:text-lg font-medium leading-relaxed">
                        {t('musique.subtitle')}
                    </p>
                </motion.div>

                {/* Platform Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                    <div className="flex items-center gap-4 min-w-max pb-2">
                        <div className="flex items-center gap-2 text-gray-500 mr-2 flex-shrink-0">
                            <Filter className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('galerie.filter_by')}</span>
                        </div>
                        {platforms.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        if (tab.id !== 'tracklists') setActiveMix(null);
                                    }}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    className={`relative px-7 py-3 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] transition-all duration-300 border flex-shrink-0
                                    ${isActive
                                        ? `${tab.activeClass} border-transparent`
                                        : `bg-white/[0.03] ${tab.inactiveClass}`
                                    }`}
                                >
                                    {tab.label}
                                    {/* Live Sets badge */}
                                    {tab.id === 'tracklists' && allTracklists.length > 0 && (
                                        <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[7px] font-black flex items-center justify-center ${isActive ? 'bg-white text-neon-purple' : 'bg-neon-purple text-white'}`}>
                                            {allTracklists.length}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                <div className="relative">
                    <div className="min-h-[600px] w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-20"
                            >
                                {/* ── LIVE SETS TAB ── Full Custom DJ Player Experience */}
                                {activeTab === 'tracklists' ? (
                                    <div className="space-y-8">
                                        {/* Active Mix Player — shown when user clicks a mix row */}
                                        <AnimatePresence>
                                            {activeMix && (
                                                <motion.div
                                                    ref={mixPlayerRef}
                                                    key={`player-${activeMix.id}`}
                                                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                    className="mb-10"
                                                >
                                                    {/* Purple ambient glow behind player */}
                                                    <div className="relative">
                                                        <div className="absolute -inset-6 bg-neon-purple/5 rounded-[56px] blur-xl pointer-events-none" />
                                                        <CustomMixPlayer
                                                            track={{
                                                                id: activeMix.id,
                                                                title: activeMix.title,
                                                                artist: activeMix.artist,
                                                                label: activeMix.event,
                                                                url: activeMix.url || '#',
                                                                embedUrl: activeMix.embedUrl,
                                                                tracks: activeMix.tracks,
                                                            }}
                                                            onClose={() => setActiveMix(null)}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Mix List */}
                                        <div className="space-y-4">
                                            {/* Section header */}
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-neon-purple/10 rounded-xl border border-neon-purple/20">
                                                        <Zap className="w-4 h-4 text-neon-purple" />
                                                    </div>
                                                    <div>
                                                        <span className="text-neon-purple font-black uppercase text-[9px] tracking-[0.3em] block">DROPSIDERS EXCLUSIVE</span>
                                                        <h2 className="text-white text-xl font-black uppercase italic tracking-tighter leading-none">Live Sets & Mixes</h2>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                    {allTracklists.length} Mix{allTracklists.length !== 1 ? 'es' : ''}
                                                </span>
                                            </div>

                                            {isLoading ? (
                                                <div className="py-40 flex flex-col items-center justify-center gap-4">
                                                    <Loader2 className="w-12 h-12 text-neon-purple animate-spin" />
                                                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Chargement des mixes...</p>
                                                </div>
                                            ) : allTracklists.length === 0 ? (
                                                <div className="text-center py-20 border border-dashed border-white/10 rounded-[40px] text-white/20 font-black uppercase tracking-widest">
                                                    Aucun mix disponible pour l'instant
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {allTracklists.map((mix, i) => {
                                                        const isActive = activeMix?.id === mix.id;
                                                        return (
                                                            <motion.div
                                                                key={mix.id}
                                                                id={`track-${mix.id}`}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: i * 0.05 }}
                                                                onClick={() => {
                                                                    if (isActive) {
                                                                        setActiveMix(null);
                                                                    } else {
                                                                        setActiveMix(mix);
                                                                        setTimeout(() => {
                                                                            mixPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                        }, 100);
                                                                    }
                                                                }}
                                                                className={`group relative overflow-hidden rounded-[28px] border transition-all duration-500 cursor-pointer ${
                                                                    isActive
                                                                    ? 'bg-neon-purple/10 border-neon-purple/40 shadow-[0_0_40px_rgba(176,38,255,0.15)]'
                                                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                                                                }`}
                                                            >
                                                                {/* Neon glow bar on left when active */}
                                                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl transition-all duration-500 ${isActive ? 'bg-neon-purple shadow-[0_0_12px_rgba(176,38,255,0.8)]' : 'bg-transparent'}`} />

                                                                <div className="flex flex-col md:flex-row items-center px-6 md:px-10 py-6 md:py-8 gap-4 md:gap-0">
                                                                    {/* Rank Number */}
                                                                    <div className={`text-4xl md:text-6xl font-black italic tracking-tighter mr-8 w-16 text-center transition-all duration-300 ${
                                                                        isActive ? 'text-neon-purple' : 'text-white/10 group-hover:text-white/20'
                                                                    }`}>
                                                                        {(i + 1).toString().padStart(2, '0')}
                                                                    </div>

                                                                    {/* Meta Info */}
                                                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                                                                            <h3 className={`text-xl md:text-3xl font-black uppercase italic tracking-tight truncate leading-none transition-colors duration-300 ${
                                                                                isActive ? 'text-neon-purple' : 'text-white'
                                                                            }`}>
                                                                                {mix.title}
                                                                            </h3>
                                                                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${
                                                                                isActive ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' : 'bg-neon-purple/10 text-neon-purple/60 border border-neon-purple/10'
                                                                            }`}>
                                                                                Live Set
                                                                            </div>
                                                                        </div>
                                                                        <p className={`text-xs md:text-sm font-black uppercase tracking-[0.3em] transition-colors ${
                                                                            isActive ? 'text-neon-cyan' : 'text-white/40 group-hover:text-white/60'
                                                                        }`}>
                                                                            {mix.artist}
                                                                        </p>
                                                                    </div>

                                                                    {/* Event / Date Info */}
                                                                    <div className="hidden lg:flex flex-col items-end gap-1 px-8 min-w-[160px]">
                                                                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] truncate transition-colors ${isActive ? 'text-white/60' : 'text-white/20'}`}>
                                                                            {mix.event}
                                                                        </span>
                                                                        <span className="text-[9px] font-bold text-white/15 uppercase tracking-widest">
                                                                            {mix.tracks ? `${mix.tracks.length} pistes` : 'Set complet'}
                                                                        </span>
                                                                    </div>

                                                                    {/* Controls */}
                                                                    <div className="flex items-center gap-4">
                                                                        <button
                                                                            className={`px-6 py-3 rounded-2xl border transition-all font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 ${
                                                                                isActive
                                                                                ? 'bg-neon-purple text-white border-neon-purple shadow-[0_0_20px_rgba(176,38,255,0.3)]'
                                                                                : 'bg-white/5 border-white/10 hover:bg-neon-purple/10 hover:border-neon-purple/30 text-white'
                                                                            }`}
                                                                        >
                                                                            {isActive ? (
                                                                                <>
                                                                                    <ChevronUp className="w-4 h-4" />
                                                                                    <span className="hidden sm:inline">Fermer</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <ChevronDown className="w-4 h-4" />
                                                                                    <span className="hidden sm:inline">Ouvrir</span>
                                                                                </>
                                                                            )}
                                                                        </button>

                                                                        {mix.url && mix.url !== '#' && (
                                                                            <a
                                                                                href={mix.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={e => e.stopPropagation()}
                                                                                className="p-3 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/40 hover:text-white transition-all"
                                                                            >
                                                                                <ExternalLink className="w-4 h-4" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* ── BEATPORT / TRAXSOURCE TABS ── Standard Chart View */
                                    <div className="grid grid-cols-1 gap-4">
                                        {isLoading ? (
                                            <div className="col-span-full py-40 flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-12 h-12 text-neon-red animate-spin" />
                                                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">{t('common.loading_charts')}</p>
                                            </div>
                                        ) : currentData.length === 0 ? (
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
                                                            </div>
                                                            <p className={`text-xs md:text-sm font-black uppercase tracking-[0.3em] ${
                                                                selectedTrack?.id === track.id ? 'text-black/60' : 'text-neon-cyan'
                                                            }`}>
                                                                {track.artist}
                                                            </p>
                                                        </div>

                                                        {/* Label */}
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

                                                    {/* Expandable Standard iFrame Player */}
                                                    <AnimatePresence>
                                                        {selectedTrack?.id === track.id && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden border-t border-black/5"
                                                            >
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
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Upcoming Section */}
                                {upcomingData.length > 0 && activeTab !== 'tracklists' && (
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
                                                            src={resolveImageUrl(release.image)}
                                                            alt={release.title}
                                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop';
                                                            }}
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
                        </AnimatePresence>
                    </div>
                </div>
            </div>

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
