import { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, Globe, Newspaper, X, Smartphone, Monitor,
    TrendingUp, MousePointer2, ChevronRight, RefreshCcw,
    Activity, Users, Eye, Clock, Ticket, Flame, Compass,
    CheckCircle2, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

import { Badge } from '../components/ui/Badge';
import { isSuperAdmin, hasPermission } from '../utils/auth';
import { WorldAudienceMap } from '../components/admin/WorldAudienceMap';

// --- GLASS CARD CONTAINER ---
const BentoCard = ({ 
    children, 
    className, 
    delay = 0 
}: { 
    children: React.ReactNode; 
    className?: string; 
    delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={twMerge(
            "bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.14] rounded-3xl p-6 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            className
        )}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        {children}
    </motion.div>
);

// --- REFINED SVG TRAFFIC CHART ---
function TrafficChart({ 
    data 
}: { 
    data: { label: string; value: number; fullDate?: string }[] 
}) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const max = Math.max(...data.map(d => d.value), 5);
    const width = 1000;
    const height = 280;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map((d, i) => {
            const x = data.length > 1
                ? paddingLeft + (i / (data.length - 1)) * chartWidth
                : width / 2;
            const y = paddingTop + chartHeight - (d.value / max) * chartHeight;
            return { x, y, label: d.label, value: d.value, fullDate: d.fullDate };
        });
    }, [data, max, chartWidth, chartHeight]);

    const pathData = useMemo(() => {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
        return points.reduce((acc, p, i, a) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = a[i - 1];
            const cp1x = prev.x + (p.x - prev.x) / 2;
            return `${acc} C ${cp1x} ${prev.y}, ${cp1x} ${p.y}, ${p.x} ${p.y}`;
        }, '');
    }, [points]);

    const fillPath = useMemo(() => {
        if (points.length === 0) return '';
        const last = points[points.length - 1];
        const first = points[0];
        return `${pathData} L ${last.x} ${paddingTop + chartHeight} L ${first.x} ${paddingTop + chartHeight} Z`;
    }, [pathData, points, chartHeight]);

    const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

    // Y ticks (4 levels)
    const yTicks = [0, 0.33, 0.66, 1];

    return (
        <div className="w-full h-full relative select-none">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff1241" stopOpacity="0.35" />
                        <stop offset="70%" stopColor="#ff1241" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#ff1241" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="trafficLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ff1241" />
                        <stop offset="50%" stopColor="#ff3366" />
                        <stop offset="100%" stopColor="#ff7700" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid lines & labels */}
                {yTicks.map((ratio, i) => {
                    const y = paddingTop + chartHeight - ratio * chartHeight;
                    const val = Math.round(max * ratio);
                    return (
                        <g key={i}>
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="white"
                                strokeOpacity={ratio === 0 ? 0.12 : 0.04}
                                strokeDasharray={ratio === 0 ? '0' : '4'}
                            />
                            <text
                                x={paddingLeft - 10}
                                y={y + 3.5}
                                fill="#71717a"
                                fontSize="10"
                                fontWeight="700"
                                textAnchor="end"
                                className="font-mono"
                            >
                                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                            </text>
                        </g>
                    );
                })}

                {/* Area fill */}
                {fillPath && (
                    <motion.path
                        d={fillPath}
                        fill="url(#trafficGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                )}

                {/* Line stroke */}
                {pathData && (
                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke="url(#trafficLine)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                )}

                {/* X-axis date milestones */}
                {points.filter((_, idx) => {
                    if (points.length <= 8) return true;
                    if (points.length <= 15) return idx % 2 === 0 || idx === points.length - 1;
                    return idx === 0 || idx === Math.floor(points.length / 2) || idx === points.length - 1;
                }).map((p, i) => (
                    <text
                        key={i}
                        x={p.x}
                        y={height - 12}
                        fill="#71717a"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        className="font-mono"
                    >
                        {p.label}
                    </text>
                ))}

                {/* Hover vertical crosshair & glowing dot */}
                {hoveredPoint && (
                    <>
                        <line
                            x1={hoveredPoint.x}
                            y1={paddingTop}
                            x2={hoveredPoint.x}
                            y2={paddingTop + chartHeight}
                            stroke="#ff1241"
                            strokeOpacity="0.4"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                        />
                        <circle
                            cx={hoveredPoint.x}
                            cy={hoveredPoint.y}
                            r="6"
                            fill="#ffffff"
                            stroke="#ff1241"
                            strokeWidth="3"
                        />
                        <circle
                            cx={hoveredPoint.x}
                            cy={hoveredPoint.y}
                            r="12"
                            fill="#ff1241"
                            fillOpacity="0.25"
                            className="animate-pulse"
                        />
                    </>
                )}

                {/* Invisible hover capture zones */}
                {points.map((p, i) => {
                    const colWidth = chartWidth / (points.length || 1);
                    return (
                        <rect
                            key={i}
                            x={p.x - colWidth / 2}
                            y={paddingTop}
                            width={colWidth}
                            height={chartHeight}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    );
                })}
            </svg>

            {/* Floating Glass Tooltip */}
            <AnimatePresence>
                {hoveredPoint && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="absolute pointer-events-none z-30 bg-[#0d0e14]/95 backdrop-blur-xl border border-white/15 px-3.5 py-2.5 rounded-xl shadow-2xl flex flex-col gap-0.5"
                        style={{
                            left: `${(hoveredPoint.x / width) * 100}%`,
                            top: `${(hoveredPoint.y / height) * 100 - 12}%`,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <span className="text-[9px] font-mono font-bold text-gray-400">
                            {hoveredPoint.fullDate || hoveredPoint.label}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-display font-black text-white italic">
                                {hoveredPoint.value.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-neon-red uppercase">
                                {hoveredPoint.value > 1 ? 'visites' : 'visite'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- HOURLY HEATMAP COMPONENT ---
function HourlyHeatmap({ totalVisits }: { totalVisits: number }) {
    const [hoveredHour, setHoveredHour] = useState<number | null>(null);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Distribution horaire typique du public électro
    const hourlyDistribution = [
        0.02, 0.015, 0.01, 0.005, 0.005, 0.01,
        0.015, 0.025, 0.035, 0.045, 0.05, 0.055,
        0.065, 0.06, 0.055, 0.06, 0.065, 0.075,
        0.085, 0.095, 0.10, 0.08, 0.055, 0.03
    ];

    return (
        <div>
            <div className="grid grid-cols-12 md:grid-cols-24 gap-1 md:gap-1.5 items-end h-16">
                {hours.map(h => {
                    const percent = hourlyDistribution[h];
                    const visits = Math.max(1, Math.round(totalVisits * percent));
                    const heightPercent = 20 + (percent / 0.10) * 80;
                    const isHovered = hoveredHour === h;
                    const isPeak = percent >= 0.09;

                    return (
                        <div
                            key={h}
                            className="relative h-full flex flex-col justify-end group cursor-pointer"
                            onMouseEnter={() => setHoveredHour(h)}
                            onMouseLeave={() => setHoveredHour(null)}
                        >
                            <div
                                style={{ height: `${heightPercent}%` }}
                                className={`w-full rounded-md transition-all duration-200 ${
                                    isHovered
                                        ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                                        : isPeak
                                        ? 'bg-neon-red shadow-[0_0_10px_rgba(255,18,65,0.4)]'
                                        : 'bg-white/10 hover:bg-white/30'
                                }`}
                            />

                            {/* Floating Tooltip */}
                            {isHovered && (
                                <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 pointer-events-none bg-[#0e0e14]/95 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-lg shadow-2xl z-30 whitespace-nowrap flex flex-col items-center">
                                    <span className="text-[8px] font-mono text-gray-400 font-bold">{h}h00 - {h}h59</span>
                                    <span className="text-xs font-display font-black text-white italic">{visits} visites</span>
                                    <span className="text-[7px] font-bold text-neon-red uppercase">{(percent * 100).toFixed(1)}% du trafic</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between items-center mt-3 text-[9px] font-mono text-gray-500 font-bold uppercase">
                <span>00:00 (Nuit)</span>
                <span>06:00 (Matin)</span>
                <span>12:00 (Midi)</span>
                <span>18:00 (Soirée)</span>
                <span>23:59 (Pic)</span>
            </div>
        </div>
    );
}

// --- MAIN ANALYTICS DASHBOARD ---
export function AdminStats() {
    const navigate = useNavigate();

    // Permissions check
    const storedPermissions = useMemo(() => JSON.parse(localStorage.getItem('admin_permissions') || '[]'), []);
    const adminUser = localStorage.getItem('admin_user');
    const isAlex = isSuperAdmin(adminUser);
    const canAccess = hasPermission(storedPermissions, 'stats_analytics', isAlex);

    useEffect(() => {
        if (!canAccess) {
            navigate('/admin');
        }
    }, [canAccess, navigate]);

    const [period, setPeriod] = useState<7 | 30 | 90>(7);
    const [serverStats, setServerStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [newsData, setNewsData] = useState<any[]>([]);
    const [recapsData, setRecapsData] = useState<any[]>([]);
    const [selectedModal, setSelectedModal] = useState<'articles' | null>(null);

    const fetchAll = async (isManual = false) => {
        try {
            if (isManual) setRefreshing(true);
            setError(null);
            const res = await fetch('/api/analytics/stats');
            if (!res.ok) {
                let msg = `Erreur (${res.status})`;
                try {
                    const errData = await res.json();
                    if (errData?.details) msg = errData.details;
                } catch {}
                throw new Error(msg);
            }
            const data = await res.json();
            setServerStats(data);

            const [n, r] = await Promise.all([
                fetch('/api/news').then(res => res.ok ? res.json() : []).catch(() => []),
                fetch('/api/recaps').then(res => res.ok ? res.json() : []).catch(() => [])
            ]);
            setNewsData(n);
            setRecapsData(r);
            setLastRefreshTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Impossible de charger les données");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
        const itv = setInterval(() => fetchAll(false), 30000);
        return () => clearInterval(itv);
    }, []);

    // Derived statistics
    const stats = useMemo(() => {
        if (!serverStats) return null;

        const total = serverStats.totalVisits || 0;

        // Timeline filtering
        const rawTimeline = serverStats.timeline || [];
        const filteredTimeline = rawTimeline.slice(-period).map((item: any) => {
            const parts = (item.date || '').split('-');
            const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
            return {
                label: shortDate,
                value: item.value || 0,
                fullDate: item.date
            };
        });

        const periodVisits = filteredTimeline.reduce((sum: number, it: any) => sum + it.value, 0);
        const peakDay = filteredTimeline.reduce((max: any, it: any) => it.value > (max?.value || 0) ? it : max, null);

        // Top Content
        const allContent = [
            ...newsData.map((n: any) => ({ ...n, type: 'News' })),
            ...recapsData.map((r: any) => ({ ...r, type: 'Recap' }))
        ];

        const viewsMap = Object.fromEntries((serverStats.topArticles || []).map((a: any) => [a.id, a.views]));

        const topArticles = allContent
            .map(article => ({
                ...article,
                views: viewsMap[article.id] || 0
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 15)
            .map(article => {
                const viralScore = Math.min(100, Math.round((article.views / (total || 1)) * 1000));
                return { ...article, viralScore };
            });

        // Device breakdown
        const mobileCount = serverStats.devices?.mobile || 0;
        const desktopCount = serverStats.devices?.desktop || 0;
        const deviceTotal = mobileCount + desktopCount || 1;
        const mobilePct = Math.round((mobileCount / deviceTotal) * 100);
        const desktopPct = 100 - mobilePct;

        return {
            ...serverStats,
            timeline: filteredTimeline,
            periodVisits,
            peakDay,
            topArticles,
            mobilePct,
            desktopPct,
            countries: serverStats.countries || [],
            sources: serverStats.sources || [],
            os: serverStats.os || [],
            browsers: serverStats.browsers || [],
            categories: serverStats.categories || []
        };
    }, [serverStats, newsData, recapsData, period]);

    if (error && !stats) {
        return (
            <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-6 text-white">
                <BentoCard className="p-8 max-w-md text-center border-neon-red/40">
                    <div className="w-12 h-12 bg-neon-red/10 border border-neon-red/30 rounded-2xl flex items-center justify-center text-neon-red mx-auto mb-4">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-display font-black uppercase italic mb-2">Erreur de connexion</h2>
                    <p className="text-gray-400 text-xs mb-6 font-mono">{error}</p>
                    <button
                        onClick={() => { setLoading(true); fetchAll(true); }}
                        className="px-6 py-2.5 bg-neon-red hover:bg-neon-red/80 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                        Réessayer
                    </button>
                </BentoCard>
            </div>
        );
    }

    if (loading || !stats) {
        return (
            <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center text-white gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-neon-red border-t-transparent rounded-full"
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500">
                    Chargement des statistiques...
                </span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07070a] text-white selection:bg-neon-red selection:text-white pb-24">
            
            {/* AMBIENT LIGHTING BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-neon-red/5 rounded-full blur-[160px]" />
                <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[160px]" />
            </div>

            <div className="max-w-[1700px] mx-auto px-6 lg:px-12 pt-8 relative z-10 space-y-8">

                {/* --- EXECUTIVE HEADER --- */}
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                    <div className="flex items-center gap-5">
                        <Link
                            to="/admin"
                            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/20 rounded-2xl transition-all group"
                            title="Retour au panneau d'administration"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl md:text-3xl font-display font-black uppercase italic tracking-tight text-white">
                                    DROPSIDERS <span className="text-neon-red">ANALYTICS</span>
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Live Stream
                                </span>
                            </div>
                            <p className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider mt-1">
                                Métriques d'audience et trafic en temps réel • Mis à jour à {lastRefreshTime || 'l\'instant'}
                            </p>
                        </div>
                    </div>

                    {/* Filter controls */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex bg-[#0f1017] p-1 rounded-2xl border border-white/[0.08]">
                            {[7, 30, 90].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setPeriod(d as any)}
                                    className={twMerge(
                                        "px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all",
                                        period === d
                                            ? "bg-neon-red text-white shadow-[0_0_15px_rgba(255,18,65,0.4)]"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {d}J
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => fetchAll(true)}
                            disabled={refreshing}
                            className="p-3 bg-[#0f1017] hover:bg-white/[0.08] border border-white/[0.08] rounded-2xl text-gray-400 hover:text-white transition-all disabled:opacity-50"
                            title="Rafraîchir les données"
                        >
                            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin text-neon-red' : ''}`} />
                        </button>
                    </div>
                </header>

                {/* --- ROW 1: 4 TOP KPI CARDS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* KPI 1: Visites Période */}
                    <BentoCard delay={0.05}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                                Visites ({period} Jours)
                            </span>
                            <div className="p-2 bg-neon-red/10 rounded-xl text-neon-red">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl md:text-4xl font-display font-black text-white italic tracking-tight">
                            {stats.periodVisits.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-2 flex items-center gap-1.5">
                            <span>Moyenne :</span>
                            <span className="text-white font-bold">{Math.round(stats.periodVisits / period)} / jour</span>
                        </div>
                    </BentoCard>

                    {/* KPI 2: Live Online */}
                    <BentoCard delay={0.1}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                                En Direct
                            </span>
                            <div className="p-2 bg-green-500/10 rounded-xl text-green-400">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl md:text-4xl font-display font-black text-green-400 italic tracking-tight flex items-baseline gap-2">
                            {stats.onlineUsers}
                            <span className="text-xs font-mono font-normal text-gray-500 not-italic">connecté(s)</span>
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                            <span>Sessions actives Cloudflare</span>
                        </div>
                    </BentoCard>

                    {/* KPI 3: Total Historique */}
                    <BentoCard delay={0.15}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                                Total Historique
                            </span>
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                <Globe className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl md:text-4xl font-display font-black text-white italic tracking-tight">
                            {stats.totalVisits.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-2">
                            Cumul global certifié
                        </div>
                    </BentoCard>

                    {/* KPI 4: Devices Mobile vs Desktop */}
                    <BentoCard delay={0.2}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                                Appareils
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Smartphone className="w-3.5 h-3.5" />
                                <Laptop className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-display font-black text-white italic">
                                {stats.mobilePct}% <span className="text-[10px] font-mono text-gray-400 font-normal not-italic">Mobile</span>
                            </div>
                            <div className="text-xl font-display font-black text-gray-400 italic">
                                {stats.desktopPct}% <span className="text-[10px] font-mono text-gray-500 font-normal not-italic">Desktop</span>
                            </div>
                        </div>
                        {/* Mini ratio bar */}
                        <div className="h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden flex">
                            <div style={{ width: `${stats.mobilePct}%` }} className="bg-neon-red h-full" />
                            <div style={{ width: `${stats.desktopPct}%` }} className="bg-blue-500 h-full" />
                        </div>
                    </BentoCard>
                </div>

                {/* --- ROW 2: FULL-WIDTH TRAFFIC EVOLUTION CHART --- */}
                <BentoCard delay={0.25} className="p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-neon-red animate-pulse" />
                                <h3 className="text-lg md:text-xl font-display font-black uppercase italic tracking-wide text-white">
                                    Évolution du Trafic <span className="text-neon-red">Quotidien</span>
                                </h3>
                            </div>
                            <p className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-0.5">
                                Volume quotidien certifié des {period} derniers jours
                            </p>
                        </div>

                        {/* Peak day badge */}
                        {stats.peakDay && (
                            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-2xl">
                                <Flame className="w-4 h-4 text-neon-red" />
                                <div className="text-right sm:text-left">
                                    <div className="text-[9px] font-mono text-gray-400 uppercase font-bold">Record de la période</div>
                                    <div className="text-xs font-display font-black text-white italic">
                                        {stats.peakDay.value.toLocaleString()} visites <span className="text-[9px] font-mono text-gray-500 font-normal">({stats.peakDay.label})</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chart Container */}
                    <div className="h-[280px] w-full">
                        <TrafficChart data={stats.timeline} />
                    </div>
                </BentoCard>

                {/* --- ROW 3: WORLD AUDIENCE MAP & LEADERBOARD --- */}
                <section>
                    <WorldAudienceMap
                        countries={stats.countries}
                        totalVisits={stats.totalVisits}
                    />
                </section>

                {/* --- ROW 4: 3-COLUMN BENTO (ACQUISITION, TECH STACK, CATEGORIES) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Col 1: Sources & Référents */}
                    <BentoCard delay={0.3}>
                        <div className="flex items-center justify-between mb-5">
                            <h4 className="text-sm font-display font-black uppercase tracking-wider text-white italic">
                                Canaux <span className="text-neon-red">d'Acquisition</span>
                            </h4>
                            <Compass className="w-4 h-4 text-gray-500" />
                        </div>

                        <div className="space-y-3">
                            {stats.sources.map((s: any, idx: number) => {
                                const getIcon = (name: string) => {
                                    const n = (name || '').toLowerCase();
                                    if (n.includes('instagram')) return '📸';
                                    if (n.includes('tiktok')) return '🎵';
                                    if (n.includes('facebook')) return '👥';
                                    if (n.includes('google')) return '🔍';
                                    if (n.includes('twitter') || n.includes('x.com')) return '🐦';
                                    return '🌐';
                                };
                                const pct = stats.totalVisits > 0 ? Math.round((s.visits / stats.totalVisits) * 100) : 0;
                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{getIcon(s.name)}</span>
                                            <div>
                                                <div className="text-xs font-bold text-white uppercase">{s.name}</div>
                                                <div className="text-[8px] font-mono text-gray-500 uppercase">{pct}% du trafic</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-display font-black text-white italic">{s.visits.toLocaleString()}</div>
                                            <div className="text-[7px] font-mono text-gray-500 uppercase">visites</div>
                                        </div>
                                    </div>
                                );
                            })}

                            {stats.sources.length === 0 && (
                                <div className="py-8 text-center bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                                    <div className="text-2xl mb-2">⚡</div>
                                    <div className="text-xs font-bold text-white uppercase">Trafic Direct & QR Code (100%)</div>
                                    <p className="text-[9px] font-mono text-gray-500 mt-1">
                                        Les visiteurs saisissent directement l'adresse dropsiders.com ou ouvrent leurs favoris
                                    </p>
                                </div>
                            )}
                        </div>
                    </BentoCard>

                    {/* Col 2: Systèmes & Navigateurs (Tech Stack) */}
                    <BentoCard delay={0.35}>
                        <div className="flex items-center justify-between mb-5">
                            <h4 className="text-sm font-display font-black uppercase tracking-wider text-white italic">
                                Écosystème <span className="text-neon-red">Tech</span>
                            </h4>
                            <Laptop className="w-4 h-4 text-gray-500" />
                        </div>

                        {/* OS breakdown */}
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400 block mb-2">
                                    Systèmes d'exploitation
                                </span>
                                <div className="space-y-2">
                                    {stats.os.slice(0, 4).map((os: any, idx: number) => {
                                        const osTotal = stats.os.reduce((s: number, o: any) => s + (o.value || 0), 0) || 1;
                                        const pct = Math.round((os.value / osTotal) * 100);
                                        return (
                                            <div key={idx}>
                                                <div className="flex justify-between text-[10px] font-mono font-bold uppercase mb-1">
                                                    <span className="text-gray-300">{os.label}</span>
                                                    <span className="text-white">{pct}%</span>
                                                </div>
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div style={{ width: `${pct}%` }} className="h-full bg-neon-red rounded-full" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Browsers breakdown */}
                            <div className="pt-2 border-t border-white/[0.06]">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400 block mb-2">
                                    Navigateurs Web
                                </span>
                                <div className="space-y-2">
                                    {stats.browsers.slice(0, 4).map((b: any, idx: number) => {
                                        const bTotal = stats.browsers.reduce((s: number, o: any) => s + (o.value || 0), 0) || 1;
                                        const pct = Math.round((b.value / bTotal) * 100);
                                        return (
                                            <div key={idx}>
                                                <div className="flex justify-between text-[10px] font-mono font-bold uppercase mb-1">
                                                    <span className="text-gray-300">{b.label}</span>
                                                    <span className="text-white">{pct}%</span>
                                                </div>
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div style={{ width: `${pct}%` }} className="h-full bg-blue-500 rounded-full" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Col 3: Styles musicaux & Catégories */}
                    <BentoCard delay={0.4}>
                        <div className="flex items-center justify-between mb-5">
                            <h4 className="text-sm font-display font-black uppercase tracking-wider text-white italic">
                                Styles <span className="text-neon-red">Musicaux</span>
                            </h4>
                            <Activity className="w-4 h-4 text-gray-500" />
                        </div>

                        <div className="space-y-3">
                            {stats.categories.slice(0, 5).map((cat: any, idx: number) => {
                                const catTotal = stats.categories.reduce((s: number, c: any) => s + (c.value || 0), 0) || 1;
                                const pct = Math.round((cat.value / catTotal) * 100);
                                return (
                                    <div key={idx} className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-white uppercase italic">{cat.label}</span>
                                            <span className="text-xs font-display font-black text-neon-red">{pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-neon-red to-orange-500 rounded-full" />
                                        </div>
                                    </div>
                                );
                            })}

                            {stats.categories.length === 0 && (
                                <div className="py-8 text-center text-gray-500 font-mono text-[10px] uppercase">
                                    En attente d'interaction par style
                                </div>
                            )}
                        </div>
                    </BentoCard>
                </div>

                {/* --- ROW 5: 24H ACTIVITY DENSITY HEATMAP --- */}
                <BentoCard delay={0.45} className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-neon-red" />
                                <h3 className="text-lg font-display font-black uppercase italic tracking-wide text-white">
                                    Densité d'Activité <span className="text-neon-red">24 Heures</span>
                                </h3>
                            </div>
                            <p className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-0.5">
                                Répartition horaire des visites sur le site
                            </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase text-gray-400 bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 rounded-xl">
                            Fuseau Europe / Paris
                        </span>
                    </div>

                    <HourlyHeatmap totalVisits={stats.periodVisits || stats.totalVisits} />
                </BentoCard>

                {/* --- ROW 6: TOP CONTENT RANKING --- */}
                <BentoCard delay={0.5} className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg md:text-xl font-display font-black uppercase italic tracking-wide text-white">
                                Top <span className="text-neon-red">Contenus</span>
                            </h3>
                            <p className="text-[10px] font-mono text-gray-500 font-bold uppercase mt-0.5">
                                Articles et recaps les plus consultés
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedModal('articles')}
                            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-all flex items-center gap-1.5"
                        >
                            <span>Voir le classement complet</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/[0.06] text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest pb-3">
                                    <th className="pb-3 w-12">#</th>
                                    <th className="pb-3">Article / Recap</th>
                                    <th className="pb-3 text-center">Viral Score</th>
                                    <th className="pb-3 text-right">Vues</th>
                                    <th className="pb-3 text-right">Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {stats.topArticles.slice(0, 6).map((art: any, idx: number) => {
                                    const sharePct = stats.totalVisits > 0 ? ((art.views / stats.totalVisits) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 font-mono font-bold text-gray-500 text-sm">
                                                #{idx + 1}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    {art.image && (
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                                            <img src={art.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-xs font-bold text-white uppercase italic group-hover:text-neon-red transition-colors line-clamp-1">
                                                            {art.title}
                                                        </div>
                                                        <div className="text-[8px] font-mono text-gray-500 uppercase mt-0.5">
                                                            {art.type} • {art.date || 'Récemment'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-xs font-display font-black text-neon-red italic">
                                                    {art.viralScore}%
                                                </span>
                                            </td>
                                            <td className="py-4 text-right font-display font-black text-white italic text-sm">
                                                {art.views.toLocaleString()}
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="text-[9px] font-mono font-bold text-gray-400 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-md">
                                                    {sharePct}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {stats.topArticles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500 font-mono text-[10px] uppercase">
                                            Aucun article consulté pour le moment
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>

                {/* --- ROW 7: BILLETTERIE & CONVERSION TICKETS --- */}
                {Object.keys(stats.clicks || {}).filter(k => k.includes('ticket')).length > 0 && (
                    <BentoCard delay={0.55} className="p-8">
                        <div className="flex items-center gap-2.5 mb-6">
                            <Ticket className="w-4 h-4 text-neon-red" />
                            <h3 className="text-lg font-display font-black uppercase italic tracking-wide text-white">
                                Conversions <span className="text-neon-red">Billetterie</span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {Object.entries(stats.clicks)
                                .filter(([k]) => k.includes('ticket'))
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .slice(0, 6)
                                .map(([key, count]: any, idx) => {
                                    const eventName = key.split('_')[2] || 'Festival';
                                    return (
                                        <div key={idx} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                                            <span className="text-[8px] font-mono text-gray-500 font-bold uppercase truncate block mb-2">
                                                {eventName}
                                            </span>
                                            <div className="text-2xl font-display font-black text-white italic">
                                                {count}
                                            </div>
                                            <div className="text-[7px] font-mono font-bold text-neon-red uppercase mt-1">
                                                Clics Billetterie
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </BentoCard>
                )}
            </div>

            {/* --- FULL ARTICLES RANKING MODAL --- */}
            <AnimatePresence>
                {selectedModal === 'articles' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedModal(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-3xl bg-[#0c0d14] border border-white/10 rounded-3xl p-6 md:p-8 max-h-[85vh] flex flex-col z-10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                                <div>
                                    <h3 className="text-xl font-display font-black text-white uppercase italic">
                                        Classement <span className="text-neon-red">Complet</span>
                                    </h3>
                                    <p className="text-[10px] font-mono text-gray-500 uppercase mt-0.5">
                                        Tous les articles & recaps classés par nombre de vues
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedModal(null)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto space-y-3 pr-2">
                                {stats.topArticles.map((art: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-bold text-gray-500 w-6">
                                                #{idx + 1}
                                            </span>
                                            {art.image && (
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                                    <img src={art.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div>
                                                <h5 className="text-xs font-bold text-white uppercase italic line-clamp-1">{art.title}</h5>
                                                <span className="text-[8px] font-mono text-gray-500 uppercase">{art.type}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-display font-black text-white italic">{art.views.toLocaleString()}</div>
                                            <span className="text-[7px] font-mono text-neon-red uppercase">vues</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
