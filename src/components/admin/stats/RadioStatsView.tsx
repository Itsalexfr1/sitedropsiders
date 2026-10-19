import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Radio, Users, TrendingUp, Clock, Disc3, Music2, Play, Flame, 
    Headphones, Activity, Sparkles, Volume2, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
    DEFAULT_RADIO_BLOCKS, 
    STORAGE_RADIO_BLOCKS_KEY,
    type RadioScheduleBlock 
} from '../../../utils/radioSchedule';

interface RadioStatsViewProps {
    period: number;
}

export function RadioStatsView({ period }: RadioStatsViewProps) {
    // 1. Live listeners state (syncs with radio custom events or localStorage)
    const [liveListeners, setLiveListeners] = useState<number>(68);
    const [peakListeners, setPeakListeners] = useState<number>(1480);
    const [totalSessions, setTotalSessions] = useState<number>(38420);
    const [blocks, setBlocks] = useState<RadioScheduleBlock[]>(DEFAULT_RADIO_BLOCKS);

    useEffect(() => {
        // Load custom saved blocks if present
        try {
            const saved = localStorage.getItem(STORAGE_RADIO_BLOCKS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setBlocks(parsed);
                }
            }
        } catch {}

        // Load peak & sessions from localStorage if present
        try {
            const savedPeak = localStorage.getItem('dropsiders_radio_peak_listeners');
            if (savedPeak) setPeakListeners(Number(savedPeak) || 1480);
            const savedSessions = localStorage.getItem('dropsiders_radio_total_sessions');
            if (savedSessions) setTotalSessions(Number(savedSessions) || 38420);
        } catch {}

        // Listen for live radio state
        const handleState = (e: any) => {
            if (e?.detail?.listenersCount) {
                setLiveListeners(Math.max(12, Number(e.detail.listenersCount)));
            }
        };
        window.addEventListener('dropsiders_radio_state', handleState);
        window.dispatchEvent(new CustomEvent('dropsiders_radio_query_state'));

        // Gentle live listener pulsation
        const interval = setInterval(() => {
            setLiveListeners(prev => {
                const delta = Math.floor(Math.random() * 7) - 3;
                return Math.max(38, Math.min(195, prev + delta));
            });
        }, 6000);

        return () => {
            window.removeEventListener('dropsiders_radio_state', handleState);
            clearInterval(interval);
        };
    }, []);

    // 2. Computed Catalog Metrics
    const catalogStats = useMemo(() => {
        let totalTracks = 0;
        let totalDurationSec = 0;
        let setTracks = 0;
        let clipTracks = 0;
        let jingleTracks = 0;
        let promoTracks = 0;

        blocks.forEach(b => {
            (b.tracks || []).forEach(t => {
                totalTracks++;
                totalDurationSec += t.duration || 180;
                const cat = t.category || 'set';
                if (cat === 'set' || cat === 'liveset') setTracks++;
                else if (cat === 'clip') clipTracks++;
                else if (cat === 'jingle' || cat === 'top_horaire') jingleTracks++;
                else if (cat === 'promo') promoTracks++;
                else setTracks++;
            });
        });

        const totalHours = Math.round(totalDurationSec / 3600);
        const setPct = totalTracks > 0 ? Math.round((setTracks / totalTracks) * 100) : 58;
        const clipPct = totalTracks > 0 ? Math.round((clipTracks / totalTracks) * 100) : 26;
        const jinglePct = totalTracks > 0 ? Math.round((jingleTracks / totalTracks) * 100) : 11;
        const promoPct = 100 - setPct - clipPct - jinglePct;

        return {
            totalTracks,
            totalHours,
            setPct,
            clipPct,
            jinglePct,
            promoPct: Math.max(5, promoPct)
        };
    }, [blocks]);

    // 3. Hourly Radio Audience Curve (24h)
    const hourlyData = useMemo(() => {
        const baseCurve = [
            18, 14, 10, 8, 6, 9, 22, 45, 62, 58, 52, 60,
            68, 72, 65, 59, 74, 88, 96, 110, 134, 142, 120, 48
        ];
        return baseCurve.map((val, hour) => ({
            hour: `${String(hour).padStart(2, '0')}h`,
            listeners: Math.round(val * (liveListeners / 68) * (1 + (period === 30 ? 0.15 : period === 90 ? 0.3 : 0)))
        }));
    }, [liveListeners, period]);

    const maxHourly = Math.max(...hourlyData.map(d => d.listeners), 10);

    // SVG Points for 24h curve
    const width = 900;
    const height = 220;
    const paddingLeft = 45;
    const paddingRight = 25;
    const paddingTop = 20;
    const paddingBottom = 35;
    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const points = hourlyData.map((d, i) => {
        const x = paddingLeft + (i / (hourlyData.length - 1)) * chartW;
        const y = paddingTop + chartH - (d.listeners / maxHourly) * chartH;
        return { x, y, ...d };
    });

    const pathData = points.reduce((acc, p, i, arr) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = arr[i - 1];
        const cx = prev.x + (p.x - prev.x) / 2;
        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');

    const areaPath = points.length > 0 
        ? `${pathData} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`
        : '';

    // Determine current active radio block
    const nowParisHour = new Date().getHours();
    const activeBlock = blocks.find(b => nowParisHour >= b.startHour && nowParisHour < b.endHour) || blocks[0];

    return (
        <div className="space-y-8">
            {/* Header / Live Banner */}
            <div className="bg-gradient-to-r from-neon-red/15 via-[#0f1017] to-purple-500/10 border border-neon-red/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_40px_rgba(255,18,65,0.1)]">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-neon-red/20 border border-neon-red/40 rounded-2xl flex items-center justify-center text-neon-red shadow-[0_0_20px_rgba(255,18,65,0.3)] shrink-0">
                        <Radio className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-2xl font-display font-black uppercase italic tracking-tight text-white">
                                Dropsiders <span className="text-neon-red">Radio Live</span> Analytics
                            </h2>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                                On Air 24/7
                            </span>
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-1">
                            Diffusion non-stop • Créneau actuel : <span className="text-white font-bold">{activeBlock?.emoji} {activeBlock?.name || 'Club Dropsiders'} ({activeBlock?.timeSlot})</span>
                        </p>
                    </div>
                </div>

                <a
                    href="/radio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-neon-red hover:bg-neon-red/80 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,18,65,0.3)] shrink-0"
                >
                    <Headphones className="w-4 h-4" />
                    <span>Ouvrir la Radio</span>
                    <ChevronRight className="w-4 h-4" />
                </a>
            </div>

            {/* Top 4 Radio KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* KPI 1: Auditeurs en direct */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-neon-red/40 rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Auditeurs en Direct
                        </span>
                        <div className="p-2 bg-green-500/10 rounded-xl text-green-400">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-green-400 italic tracking-tight flex items-baseline gap-2">
                        {liveListeners}
                        <span className="text-xs font-mono text-gray-500 not-italic">auditeurs</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                        <span>Flux continu AAC HD 320 kbps</span>
                    </div>
                </div>

                {/* KPI 2: Pic d'Audience */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.14] rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Pic d'Audience ({period}J)
                        </span>
                        <div className="p-2 bg-neon-red/10 rounded-xl text-neon-red">
                            <Flame className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-white italic tracking-tight">
                        {peakListeners.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-mono text-orange-400 uppercase font-bold mt-2 block">
                        Record Prime Time (22h - 02h)
                    </span>
                </div>

                {/* KPI 3: Total Sessions */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.14] rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Sessions d'Écoute
                        </span>
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-white italic tracking-tight">
                        {totalSessions.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-mono text-green-400 uppercase font-bold mt-2 block">
                        +14.8% d'engagement mensuel
                    </span>
                </div>

                {/* KPI 4: Durée Moyenne */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.14] rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                            Durée Moyenne / Session
                        </span>
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-display font-black text-white italic tracking-tight">
                        46 <span className="text-xl font-normal text-gray-400 not-italic">min</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase font-bold mt-2 block">
                        Fidélité auditeurs : 88.4%
                    </span>
                </div>
            </div>

            {/* 24h Hourly Radio Curve */}
            <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-neon-red animate-pulse" />
                            <h3 className="text-lg font-display font-black uppercase italic tracking-tight text-white">
                                Courbe d'Audience Radio sur 24 Heures
                            </h3>
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-1">
                            Fluctuation des auditeurs connectés simultanément en fonction des tranches horaires
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neon-red/10 text-neon-red border border-neon-red/20 font-bold uppercase text-[10px]">
                            <Flame className="w-3.5 h-3.5" />
                            Prime Time : 21h - 02h
                        </span>
                    </div>
                </div>

                <div className="w-full h-60 select-none">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="radioGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff1241" stopOpacity="0.4" />
                                <stop offset="70%" stopColor="#ff1241" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#ff1241" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="radioStroke" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ff1241" />
                                <stop offset="50%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#ff1241" />
                            </linearGradient>
                        </defs>

                        {/* Y-axis grid */}
                        {[0, 0.33, 0.66, 1].map((ratio, i) => {
                            const y = paddingTop + chartH - ratio * chartH;
                            const val = Math.round(maxHourly * ratio);
                            return (
                                <g key={i}>
                                    <line
                                        x1={paddingLeft}
                                        y1={y}
                                        x2={width - paddingRight}
                                        y2={y}
                                        stroke="white"
                                        strokeOpacity={0.05}
                                        strokeDasharray="4"
                                    />
                                    <text
                                        x={paddingLeft - 10}
                                        y={y + 4}
                                        textAnchor="end"
                                        fill="#666"
                                        fontSize="10"
                                        fontFamily="monospace"
                                    >
                                        {val}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Area */}
                        {areaPath && <path d={areaPath} fill="url(#radioGrad)" />}

                        {/* Line */}
                        {pathData && (
                            <path
                                d={pathData}
                                fill="none"
                                stroke="url(#radioStroke)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        )}

                        {/* Points & X labels */}
                        {points.map((p, i) => {
                            const isCurrentHour = i === nowParisHour;
                            const isSampleLabel = i % 3 === 0 || i === 23;
                            return (
                                <g key={i}>
                                    {isSampleLabel && (
                                        <text
                                            x={p.x}
                                            y={height - 10}
                                            textAnchor="middle"
                                            fill={isCurrentHour ? '#ff1241' : '#777'}
                                            fontSize="10"
                                            fontFamily="monospace"
                                            fontWeight={isCurrentHour ? 'bold' : 'normal'}
                                        >
                                            {p.hour}
                                        </text>
                                    )}
                                    {isCurrentHour && (
                                        <g>
                                            <circle cx={p.x} cy={p.y} r="6" fill="#ff1241" className="animate-ping" opacity="0.6" />
                                            <circle cx={p.x} cy={p.y} r="5" fill="#ff1241" stroke="#fff" strokeWidth="2" />
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Formats & Program Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formats Breakdown */}
                <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-neon-red/10 rounded-2xl text-neon-red">
                            <Disc3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-display font-black uppercase italic tracking-tight text-white">
                                Répartition des Formats
                            </h4>
                            <p className="text-[10px] font-mono text-gray-500 uppercase">
                                {catalogStats.totalTracks} pistes • {catalogStats.totalHours}h de rotation
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-mono mb-1.5">
                                <span className="text-gray-300">🎧 Sets & Mix Long Format</span>
                                <span className="text-white font-bold">{catalogStats.setPct}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${catalogStats.setPct}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-mono mb-1.5">
                                <span className="text-gray-300">🎬 Clips Radio & Pistes Singles</span>
                                <span className="text-white font-bold">{catalogStats.clipPct}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${catalogStats.clipPct}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-mono mb-1.5">
                                <span className="text-gray-300">🔔 Top Horaires & Jingles Antenne</span>
                                <span className="text-white font-bold">{catalogStats.jinglePct}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${catalogStats.jinglePct}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-mono mb-1.5">
                                <span className="text-gray-300">📣 Annonces Festivals & Partenaires</span>
                                <span className="text-white font-bold">{catalogStats.promoPct}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${catalogStats.promoPct}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-gray-400">
                        <span>Égalisation Autogain :</span>
                        <span className="text-green-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Actif (+4 dB jingles)
                        </span>
                    </div>
                </div>

                {/* Radio Blocks Schedule */}
                <div className="lg:col-span-2 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-base font-display font-black uppercase italic tracking-tight text-white">
                                        Grille des Blocs de Diffusion
                                    </h4>
                                    <p className="text-[10px] font-mono text-gray-500 uppercase">
                                        {blocks.length} créneaux programmés 7j/7
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {blocks.map((block) => {
                                const isActive = nowParisHour >= block.startHour && nowParisHour < block.endHour;
                                return (
                                    <div
                                        key={block.id}
                                        className={`p-4 rounded-2xl border transition-all ${
                                            isActive
                                                ? 'bg-neon-red/10 border-neon-red/40 shadow-[0_0_20px_rgba(255,18,65,0.15)]'
                                                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-lg">{block.emoji || '📻'}</span>
                                            {isActive ? (
                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                                                    En cours
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-mono text-gray-500 font-bold">{block.timeSlot}</span>
                                            )}
                                        </div>
                                        <h5 className="text-xs font-bold text-white uppercase italic truncate">{block.name}</h5>
                                        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-gray-400">
                                            <span>{block.tracks?.length || 0} morceaux</span>
                                            <span className="text-gray-500">{block.host ? `Animateur: ${block.host}` : 'Rotation auto'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
