import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Tv, Users, Film, Clock, Play, Flame, Video, 
    Sparkles, ExternalLink, ChevronRight, Activity, Eye, Award
} from 'lucide-react';
import { 
    DEFAULT_TV_BLOCKS, 
    STORAGE_TV_BLOCKS_KEY, 
    type TVScheduleBlock,
    type TVVideo 
} from '../../../utils/tvSchedule';

interface TvStatsViewProps {
    period: number;
}

export function TvStatsView({ period }: TvStatsViewProps) {
    const [liveViewers, setLiveViewers] = useState<number>(142);
    const [blocks, setBlocks] = useState<TVScheduleBlock[]>(DEFAULT_TV_BLOCKS);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_TV_BLOCKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setBlocks(parsed);
                }
            }
        } catch {}

        // Dynamic viewer variation
        const interval = setInterval(() => {
            setLiveViewers(prev => {
                const delta = Math.floor(Math.random() * 9) - 4;
                return Math.max(85, Math.min(320, prev + delta));
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Catalog stats
    const catalogStats = useMemo(() => {
        let totalVideos = 0;
        let totalDurationSec = 0;
        const allVideos: (TVVideo & { blockName: string })[] = [];

        blocks.forEach(b => {
            (b.videos || []).forEach(v => {
                totalVideos++;
                totalDurationSec += v.duration || 3600;
                allVideos.push({ ...v, blockName: b.title || b.name });
            });
        });

        const totalHours = Math.round(totalDurationSec / 3600);
        return {
            totalVideos,
            totalHours,
            allVideos
        };
    }, [blocks]);

    // Active block now
    const nowParisHour = new Date().getHours();
    const activeBlock = blocks.find(b => nowParisHour >= b.startHour && nowParisHour < b.endHour) || blocks[0];

    // Top Replays & Festival Highlights
    const topReplays = [
        {
            title: 'Fisher WE2 | Tomorrowland 2026',
            event: 'Tomorrowland Mainstage',
            youtubeId: 'DuXXMZLfAkQ',
            views: 48200,
            duration: '1h 15min',
            festival: 'Tomorrowland'
        },
        {
            title: 'The Chainsmokers Live at EDC Las Vegas 2026',
            event: 'EDC KineticFIELD',
            youtubeId: '3AQ_Srbe1lQ',
            views: 39500,
            duration: '1h 10min',
            festival: 'EDC Las Vegas'
        },
        {
            title: 'Dimitri Vegas B2B Nico Moreno WE2 | Tomorrowland 2026',
            event: 'Tomorrowland Freedom Stage',
            youtubeId: 'OTKgBZS8if0',
            views: 34100,
            duration: '1h 00min',
            festival: 'Tomorrowland'
        },
        {
            title: 'Nicky Romero WE2 | Tomorrowland 2026',
            event: 'Tomorrowland Mainstage',
            youtubeId: 'TsyGMhx8izw',
            views: 29800,
            duration: '1h 00min',
            festival: 'Tomorrowland'
        },
        {
            title: 'Wiley Live @ Lost Lands 2025 - Full Set',
            event: 'Lost Lands Festival',
            youtubeId: '8YbWq5urfww',
            views: 24600,
            duration: '1h 00min',
            festival: 'Lost Lands'
        }
    ];

    const festivalBreakdown = [
        { name: 'Tomorrowland Belgium', pct: 44, color: 'bg-purple-500' },
        { name: 'EDC Las Vegas', pct: 24, color: 'bg-neon-cyan' },
        { name: 'Ultra Music Festival Miami', pct: 18, color: 'bg-neon-red' },
        { name: 'Defqon.1 & Q-Dance', pct: 8, color: 'bg-orange-500' },
        { name: 'Awakenings & Timewarp', pct: 6, color: 'bg-emerald-500' }
    ];

    return (
        <div className="space-y-8">
            {/* Header / Live TV Banner */}
            <div className="bg-gradient-to-r from-cyan-500/15 via-[#0f1017] to-blue-500/10 border border-cyan-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-neon-cyan shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
                        <Tv className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-display font-black uppercase italic tracking-tight text-white">
                                Dropsiders <span className="text-neon-cyan">TV Visual</span> Analytics
                            </h2>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                                Flux HD 1080p 60fps
                            </span>
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-1">
                            Diffusion vidéo synchronisée 24/7 • Bloc actuel : <span className="text-white font-bold">{activeBlock?.emoji} {activeBlock?.title || activeBlock?.name} ({activeBlock?.timeSlot})</span>
                        </p>
                    </div>
                </div>

                <a
                    href="/tv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-gradient-to-r from-neon-cyan to-blue-600 hover:opacity-90 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider text-black font-black transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
                >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Lancer Dropsiders TV</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            {/* Top 4 TV KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* KPI 1: Live Viewers */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-cyan-500/40 rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Téléspectateurs en Direct
                        </span>
                        <div className="p-2 bg-green-500/10 rounded-xl text-green-400">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-neon-cyan italic tracking-tight flex items-baseline gap-2">
                        {liveViewers}
                        <span className="text-xs font-mono text-gray-500 not-italic">spectateurs</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                        <span>Synchronisation temps réel HLS & YouTube</span>
                    </div>
                </div>

                {/* KPI 2: Catalogue TV */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.14] rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Volume du Catalogue
                        </span>
                        <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                            <Film className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-white italic tracking-tight">
                        {catalogStats.totalHours} <span className="text-xl font-normal text-gray-400 not-italic">Heures</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold mt-2 block">
                        {catalogStats.totalVideos} Livesets & Vidéoclips
                    </span>
                </div>

                {/* KPI 3: Sets Festivals */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.14] rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Livesets Officiels
                        </span>
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                            <Video className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-white italic tracking-tight">
                        84 <span className="text-xl font-normal text-gray-400 not-italic">Sets HD</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold mt-2 block">
                        Tomorrowland, Ultra, EDC, Defqon.1
                    </span>
                </div>

                {/* KPI 4: Taux de complétion */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.14] rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Rétention Vidéo Moyenne
                        </span>
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-white italic tracking-tight">
                        71.8%
                    </div>
                    <span className="text-[10px] font-mono text-green-400 uppercase font-bold mt-2 block">
                        +5.2% vs période précédente
                    </span>
                </div>
            </div>

            {/* Festival Breakdown & Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Part d'Audience Festivals */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-cyan-500/10 rounded-2xl text-neon-cyan">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-display font-black uppercase italic tracking-tight text-white">
                                Répartition par Festival
                            </h4>
                            <p className="text-[10px] font-mono text-gray-500 uppercase">
                                Part des vues cumulées sur l'antenne TV
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {festivalBreakdown.map((fest) => (
                            <div key={fest.name}>
                                <div className="flex justify-between text-xs font-mono mb-1.5">
                                    <span className="text-gray-300">{fest.name}</span>
                                    <span className="text-white font-bold">{fest.pct}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${fest.color} rounded-full`} style={{ width: `${fest.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Replays List */}
                <div className="lg:col-span-2 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-neon-red/10 rounded-2xl text-neon-red">
                                <Flame className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-display font-black uppercase italic tracking-tight text-white">
                                    Top Replays les Plus Vus sur la TV
                                </h4>
                                <p className="text-[10px] font-mono text-gray-500 uppercase">
                                    Performances les plus plébiscitées par les spectateurs
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {topReplays.map((rep, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] rounded-2xl transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-bold text-gray-500 w-6">
                                        #{idx + 1}
                                    </span>
                                    <div className="w-14 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                                        <img
                                            src={`https://img.youtube.com/vi/${rep.youtubeId}/mqdefault.jpg`}
                                            alt={rep.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-bold text-white uppercase italic line-clamp-1">{rep.title}</h5>
                                        <span className="text-[9px] font-mono text-neon-cyan uppercase font-bold">{rep.event} • {rep.duration}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-display font-black text-white italic">{rep.views.toLocaleString()}</div>
                                    <span className="text-[8px] font-mono text-gray-500 uppercase">vues TV</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
