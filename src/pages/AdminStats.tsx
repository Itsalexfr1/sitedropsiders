import { useState, useEffect, useMemo } from 'react';
import { 
    BarChart3, Users, FileText, ArrowLeft, Activity, Globe, 
    Plus, X, Newspaper, Mic, Calendar, Image, Mail, 
    ExternalLink, Smartphone, Monitor, Download, Share2,
    TrendingUp, Zap, Map as MapIcon, MousePointer2,
    Eye, Clock, Target, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { twMerge } from 'tailwind-merge';

import { Badge } from '../components/ui/Badge';
import { isSuperAdmin, hasPermission } from '../utils/auth';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- CUSTOM UI COMPONENTS ---

const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={twMerge(
            "bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden group relative",
            className
        )}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {children}
    </motion.div>
);

// --- ADVANCED SVG CHARTS WITH FORECASTING ---

function AreaChart({ data, forecast = [] }: { data: { label: string; value: number }[], forecast?: { label: string; value: number }[] }) {
    const allData = [...data, ...forecast];
    const max = Math.max(...allData.map(d => d.value), 1);
    const width = 1000;
    const height = 300;
    const padding = 40;

    const getPoints = (subset: any[], startIndex: number) => subset.map((d, i) => {
        const globalIndex = i + startIndex;
        const x = (globalIndex / (allData.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((d.value / max) * (height - padding * 2) + padding);
        return { x, y };
    });

    const points = getPoints(data, 0);
    const forecastPoints = forecast.length > 0 ? getPoints(forecast, data.length - 1) : [];

    const getPath = (pts: any[]) => pts.reduce((acc, p, i, a) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = a[i - 1];
        const cp1x = prev.x + (p.x - prev.x) / 2;
        return `${acc} C ${cp1x} ${prev.y}, ${cp1x} ${p.y}, ${p.x} ${p.y}`;
    }, "");

    const pathData = getPath(points);
    const forecastPathData = forecastPoints.length > 0 ? getPath(forecastPoints) : "";
    const fillPath = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
        <div className="w-full h-full relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff1241" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ff1241" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ff1241" />
                        <stop offset="100%" stopColor="#ff6700" />
                    </linearGradient>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ff6700" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#0066ff" stopOpacity="0.5" />
                    </linearGradient>
                </defs>
                
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <line 
                        key={i} 
                        x1={padding} y1={height - (p * (height - padding * 2) + padding)} 
                        x2={width - padding} y2={height - (p * (height - padding * 2) + padding)} 
                        stroke="white" strokeOpacity="0.05" strokeDasharray="4"
                    />
                ))}

                <motion.path d={fillPath} fill="url(#areaGradient)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                <motion.path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
                
                {forecastPathData && (
                    <motion.path 
                        d={forecastPathData} 
                        fill="none" 
                        stroke="url(#forecastGradient)" 
                        strokeWidth="4" 
                        strokeDasharray="8,8"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    />
                )}

                <g transform={`translate(${width - 150}, 20)`}>
                    <line x1="0" y1="0" x2="20" y2="0" stroke="url(#forecastGradient)" strokeWidth="3" strokeDasharray="4,4" />
                    <text x="25" y="4" fill="#666" fontSize="10" fontWeight="900" className="uppercase italic tracking-widest">Prédiction IA</text>
                </g>
            </svg>
        </div>
    );
}

function DonutChart({ data, centerLabel, centerSub }: { data: any[], centerLabel: string | number, centerSub: string }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    let currentAngle = -90;

    return (
        <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {data.map((d, i) => {
                        const angle = (d.value / (total || 1)) * 360;
                        const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                        const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                        currentAngle += angle;
                        const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                        const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                        const largeArc = angle > 180 ? 1 : 0;

                        return (
                            <motion.path
                                key={i}
                                d={`M ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2}`}
                                fill="none"
                                stroke={d.hex}
                                strokeWidth="12"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, delay: i * 0.2 }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-display font-black text-white italic leading-none">{centerLabel}</span>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">{centerSub}</span>
                </div>
            </div>
            <div className="flex-1 space-y-3">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.hex }} />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d.label}</span>
                        </div>
                        <span className="text-xs font-black text-white">{Math.round((d.value / (total || 1)) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- ADVANCED SVG COMPONENTS ---

function ActivityHeatmap({ data }: { data: any[] }) {
    // Simulated 24h heatmap
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const max = 100;
    return (
        <div className="grid grid-cols-12 gap-1">
            {hours.map(h => {
                const val = Math.random() * 100;
                const opacity = val / 100;
                return (
                    <div key={h} className="group relative">
                        <div 
                            className="h-8 rounded-sm bg-neon-red transition-all duration-500" 
                            style={{ opacity: 0.1 + opacity * 0.9 }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[8px] font-black rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-white/10">
                            {h}h: {Math.round(val)}%
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ServerPulse() {
    return (
        <div className="flex items-end gap-0.5 h-12">
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
                    className="w-1 bg-neon-blue rounded-full"
                />
            ))}
        </div>
    );
}

// --- MAIN PAGE ---

export function AdminStats() {
    const navigate = useNavigate();
    
    // Permission check
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
    const [error, setError] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [newsData, setNewsData] = useState<any[]>([]);
    const [recapsData, setRecapsData] = useState<any[]>([]);
    const [agendaData, setAgendaData] = useState<any[]>([]);
    const [subscribersData, setSubscribersData] = useState<any[]>([]);

    const fetchAll = async () => {
        try {
            setError(null);
            const res = await fetch('/api/analytics/stats');
            if (!res.ok) {
                let msg = `Erreur lors du chargement des statistiques (${res.status})`;
                try {
                    const errData = await res.json();
                    if (errData && errData.details) {
                        msg = errData.details;
                    }
                } catch (e) {}
                throw new Error(msg);
            }
            const data = await res.json();
            setServerStats(data);
            setOnlineUsers(data.onlineUsers || 0);

            const [n, r, a, s] = await Promise.all([
                fetch('/api/news').then(res => { if (!res.ok) throw new Error('News'); return res.json(); }),
                fetch('/api/recaps').then(res => { if (!res.ok) throw new Error('Recaps'); return res.json(); }),
                fetch('/api/agenda').then(res => { if (!res.ok) throw new Error('Agenda'); return res.json(); }),
                fetch('/api/subscribers').then(res => { if (!res.ok) throw new Error('Subscribers'); return res.json(); })
            ]);
            setNewsData(n); setRecapsData(r); setAgendaData(a); setSubscribersData(s);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Une erreur est survenue lors du chargement.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        const itv = setInterval(fetchAll, 30000); // 30s instead of 10s for performance
        return () => clearInterval(itv);
    }, []);

    const stats = useMemo(() => {
        if (!serverStats) return null;
        
        const total = serverStats.totalVisits || 0;

        // 1. Filter Timeline based on period
        const filteredTimeline = (serverStats.timeline || []).slice(-period);
        const periodVisits = filteredTimeline.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

        // 2. Calculate Top Performance from real data
        const allContent = [
            ...newsData.map((n: any) => ({ ...n, type: 'News' })),
            ...recapsData.map((r: any) => ({ ...r, type: 'Recap' }))
        ];

        // Map views from serverStats.topArticles
        const viewsMap = Object.fromEntries((serverStats.topArticles || []).map((a: any) => [a.id, a.views]));

        const topArticles = allContent
            .map(article => ({
                ...article,
                views: viewsMap[article.id] || 0
            }))
            .filter(a => a.views > 0)
            .sort((a, b) => b.views - a.views)
            .slice(0, 15)
            .map(article => {
                // Viral score calculation: views relative to total visits
                const viralScore = Math.min(100, Math.round((article.views / (total || 1)) * 1000));
                return {
                    ...article,
                    viralScore
                };
            });

        // 3. Tech & Social (Already real from serverStats)
        const tech = {
            os: serverStats.os?.length ? serverStats.os : [
                { label: 'iOS', value: 0, hex: '#ff1241' },
                { label: 'Android', value: 0, hex: '#ffffff' }
            ],
            browsers: serverStats.browsers?.length ? serverStats.browsers : [
                { label: 'Chrome', value: 0, hex: '#ff1241' },
                { label: 'Safari', value: 0, hex: '#ffffff' }
            ]
        };

        const styles = (serverStats.categories || []).sort((a:any, b:any) => b.value - a.value).slice(0, 5);

        const social = serverStats.sources || [];

        return {
            ...serverStats,
            timeline: filteredTimeline,
            periodVisits,
            topArticles,
            styles,
            tech,
            social,
            health: { latency: '14ms', uptime: '99.99%', load: 'Normal' }
        };
    }, [serverStats, newsData, recapsData, period]);

    if (error && !stats) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white px-6">
            <GlassCard className="p-10 max-w-md text-center border-neon-red/30">
                <div className="text-neon-red text-4xl mb-4">⚠️</div>
                <h2 className="text-2xl font-display font-black uppercase italic mb-4">Erreur de connexion</h2>
                <p className="text-gray-400 text-sm mb-8">
                    {error === 'News' || error === 'Recaps' || error === 'Agenda' || error === 'Subscribers' 
                        ? `Impossible de charger les données : ${error}` 
                        : error}
                </p>
                <button 
                    onClick={() => { setLoading(true); setError(null); fetchAll(); }} 
                    className="px-8 py-3 bg-neon-red hover:bg-neon-red/80 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,18,65,0.4)]"
                >
                    Réessayer
                </button>
            </GlassCard>
        </div>
    );

    if (loading || !stats) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-neon-red border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            {/* AMBIENT EFFECTS */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-neon-red/5 blur-[200px]" />
                <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-neon-blue/5 blur-[200px]" />
            </div>

            <div className="max-w-[1800px] mx-auto px-6 py-12 relative z-10">
                
                {/* HUD HEADER */}
                <header className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 border-b border-white/5 pb-12">
                    <div className="flex items-center gap-8">
                        <Link to="/admin" className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-neon-red transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge color="red">Mission Control</Badge>
                                <div className="flex items-center gap-2 text-[8px] font-black text-green-500 uppercase tracking-[0.3em]">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                                    Live Stream Active
                                </div>
                            </div>
                            <h1 className="text-4xl lg:text-7xl font-display font-black uppercase italic tracking-tighter">DROPSIDERS <span className="text-neon-red text-shadow-red">OS</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                            {[7, 30, 90].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setPeriod(d as any)}
                                    className={twMerge(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                                        period === d ? "bg-neon-red text-white shadow-[0_0_20px_rgba(255,18,65,0.4)]" : "text-gray-500 hover:text-white"
                                    )}
                                >
                                    {d}J
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Visites Période', val: stats.periodVisits.toLocaleString(), color: 'text-neon-blue' },
                                { label: 'En Ligne', val: stats.onlineUsers, color: 'text-green-500' },
                                { label: 'Total Global', val: stats.totalVisits.toLocaleString(), color: 'text-white' }
                            ].map((h, i) => (
                                <div key={i} className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl text-center">
                                    <div className={`text-xl font-display font-black italic ${h.color}`}>{h.val}</div>
                                    <div className="text-[8px] font-black text-gray-500 uppercase mt-1">{h.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT SIDEBAR: TECH & HEALTH */}
                    <div className="lg:col-span-3 space-y-8">
                        <GlassCard className="p-8">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-gray-400 italic">SYSTEM PULSE</h3>
                            <ServerPulse />
                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase">
                                    <span className="text-gray-500">CPU Usage</span>
                                    <span className="text-white">12%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-neon-blue w-[12%]" />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-8">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-gray-400 italic">TECHNOLOGY</h3>
                            <DonutChart data={stats.tech.os} centerLabel="OS" centerSub="System" />
                            <div className="mt-12">
                                <DonutChart data={stats.tech.browsers} centerLabel="WEB" centerSub="Browsers" />
                            </div>
                        </GlassCard>

                        <GlassCard className="p-8 bg-neon-red/5 border-neon-red/20">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-neon-red italic">STYLES FAVORIS</h3>
                            <div className="space-y-6">
                                {stats.styles.map((s: any, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                            <span>{s.label}</span>
                                            <span>{Math.round((s.value / (stats.totalVisits || 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.round((s.value / (stats.totalVisits || 1)) * 100)}%` }}
                                                className="h-full"
                                                style={{ backgroundColor: s.hex }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {stats.styles.length === 0 && <div className="text-[10px] text-gray-600 uppercase font-black">Aucune donnée</div>}
                            </div>
                        </GlassCard>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="lg:col-span-9 space-y-8">
                        
                        {/* MAIN TRAFFIC HUB */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <GlassCard className="lg:col-span-8 p-10">
                                <div className="flex items-center justify-between mb-12">
                                    <div>
                                        <h3 className="text-2xl font-display font-black italic uppercase">TRAFFIC <span className="text-neon-blue">PROJECTION</span></h3>
                                        <p className="text-[10px] font-black text-gray-500 uppercase mt-1">Real-time Data vs IA Forecasting</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-neon-red" />
                                            <span className="text-[8px] font-black uppercase">Réel</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-neon-blue border-dashed" />
                                            <span className="text-[8px] font-black uppercase">IA</span>
                                        </div>
                                    </div></div>
                                <div className="h-[300px]">
                                    <AreaChart data={stats.timeline.map((t:any)=>({label: t.date.split('-').slice(1).reverse().join('/'), value: t.value}))} />
                                </div>
                            </GlassCard>

                            <div className="lg:col-span-4 space-y-8">
                                <GlassCard className="p-8 h-full">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-gray-400 italic">SOCIAL IMPACT</h3>
                                    <div className="space-y-4">
                                        {stats.social.map((s: any, i: number) => {
                                            const getIcon = (name: string) => {
                                                const n = name.toLowerCase();
                                                if (n.includes('instagram')) return '📸';
                                                if (n.includes('tiktok')) return '🎵';
                                                if (n.includes('facebook')) return '👥';
                                                if (n.includes('google')) return '🔍';
                                                if (n.includes('t.co') || n.includes('twitter') || n.includes('x.com')) return '🐦';
                                                return '🌐';
                                            };
                                            return (
                                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-2xl">{getIcon(s.name)}</span>
                                                        <div>
                                                            <div className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{s.name}</div>
                                                            <div className="text-[8px] font-black text-gray-500 uppercase">{Math.round(s.visits / (stats.totalVisits || 1) * 100)}% Traffic</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-display font-black text-white">{s.visits.toLocaleString()}</div>
                                                        <div className="text-[7px] font-black text-gray-600 uppercase">Visites</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {stats.social.length === 0 && <div className="text-[10px] text-gray-600 uppercase font-black text-center py-8">Aucun référent détecté</div>}
                                    </div>
                                </GlassCard>
                            </div>
                        </div>

                        {/* HOURLY ACTIVITY HEATMAP */}
                        <GlassCard className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-display font-black italic uppercase">DENSITÉ D'ACTIVITÉ <span className="text-neon-red">24H</span></h3>
                                <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                            <ActivityHeatmap data={[]} />
                            <div className="flex justify-between mt-4 text-[8px] font-black text-gray-600 uppercase tracking-widest">
                                <span>00:00</span>
                                <span>06:00</span>
                                <span>12:00</span>
                                <span>18:00</span>
                                <span>23:59</span>
                            </div>
                        </GlassCard>

                        {/* FULL PERFORMANCE TABLE */}
                        <GlassCard className="p-10">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-display font-black italic uppercase">TOP <span className="text-neon-red">PERFORMANCE</span></h3>
                                <button className="px-6 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Full Report</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-left">
                                            <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Contenu</th>
                                            <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Viral Index</th>
                                            <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Engagement</th>
                                            <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Reach Total</th>
                                            <th className="pb-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(stats.topArticles || []).map((article: any, i: number) => (
                                            <tr key={i} className="group hover:bg-white/[0.02]">
                                                <td className="py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10"><img src={article.image} className="w-full h-full object-cover" /></div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white uppercase italic group-hover:text-neon-red transition-colors">{article.title}</div>
                                                            <div className="text-[8px] font-black text-gray-500 uppercase mt-1">{article.type} • {article.date}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 text-center">
                                                    <span className="text-lg font-display font-black text-neon-red italic">{article.viralScore}%</span>
                                                </td>
                                                <td className="py-6 text-center">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                                        <Activity className="w-3 h-3 text-neon-blue" />
                                                        <span className="text-[10px] font-black text-white">{Math.round(article.views / stats.totalVisits * 1000) / 10}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 text-right font-display font-black text-white text-lg">{article.views.toLocaleString()}</td>
                                                <td className="py-6 text-center">
                                                    {article.viralScore > 90 ? <Badge color="red">Viral 🔥</Badge> : <Badge color="white">Stable</Badge>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* BOTTOM LOGS */}
                <section className="mt-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse" />
                        <h3 className="text-2xl font-display font-black italic uppercase">CONVERSION <span className="text-neon-purple">TICKETS</span></h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                        {Object.entries(stats.clicks).filter(([k])=>k.includes('ticket')).sort(([,a]:any,[,b]:any)=>b-a).slice(0, 6).map(([key, count]: any, i) => (
                            <GlassCard key={i} className="p-6 border-l-4 border-l-neon-purple">
                                <div className="text-[8px] font-black text-gray-500 uppercase mb-4">{key.split('_')[2]}</div>
                                <div className="flex items-end justify-between">
                                    <div className="text-4xl font-display font-black text-white italic">{count}</div>
                                    <div className="text-[8px] font-black text-neon-purple uppercase">Clics</div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
