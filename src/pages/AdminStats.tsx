import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, FileText, ArrowLeft, Activity, Globe, Plus, X, Newspaper, Mic, Calendar, Image, Mail, ExternalLink, Smartphone, Monitor, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { FlagIcon } from '../components/ui/FlagIcon';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_CENTERS: Record<string, { center: [number, number], zoom: number }> = {
    'France': { center: [2.2137, 46.2276], zoom: 5 },
    'Belgium': { center: [4.4699, 50.8503], zoom: 8 },
    'Switzerland': { center: [8.2275, 46.8182], zoom: 8 },
    'United States of America': { center: [-95.7129, 37.0902], zoom: 2.5 }
};

const CITIES_DATA: Record<string, { name: string, coordinates: [number, number], views: number }[]> = {
    'France': [
        { name: "Paris", coordinates: [2.3522, 48.8566], views: 1250 },
        { name: "Lyon", coordinates: [4.8357, 45.7640], views: 820 },
        { name: "Marseille", coordinates: [5.3698, 43.2965], views: 640 },
        { name: "Bordeaux", coordinates: [-0.5792, 44.8378], views: 420 },
        { name: "Lille", coordinates: [3.0573, 50.6292], views: 380 },
        { name: "Toulouse", coordinates: [1.4442, 43.6047], views: 310 },
        { name: "Nantes", coordinates: [-1.5536, 47.2184], views: 290 }
    ],
    'Belgium': [
        { name: "Bruxelles", coordinates: [4.3517, 50.8503], views: 420 },
        { name: "Anvers", coordinates: [4.4025, 51.2194], views: 180 },
        { name: "Liège", coordinates: [5.5797, 50.6326], views: 150 }
    ],
    'Switzerland': [
        { name: "Genève", coordinates: [6.1432, 46.2044], views: 310 },
        { name: "Zurich", coordinates: [8.5417, 47.3769], views: 240 },
        { name: "Lausanne", coordinates: [6.6323, 46.5197], views: 190 }
    ],
    'United States of America': [
        { name: "New York", coordinates: [-74.0060, 40.7128], views: 450 },
        { name: "Los Angeles", coordinates: [-118.2437, 34.0522], views: 320 },
        { name: "Miami", coordinates: [-80.1918, 25.7617], views: 210 },
        { name: "Chicago", coordinates: [-87.6298, 41.8781], views: 180 }
    ]
};

// --- SVG Pie Chart Component ---
function PieChart({ data, centerLabel, centerSub }: { data: { label: string; value: number; color: string; hex: string }[], centerLabel: string | number, centerSub: string }) {
    const [hovered, setHovered] = useState<number | null>(null);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className="text-gray-600 text-center py-8 text-xs uppercase">Aucune donnée</div>;

    let cumAngle = -90;
    const slices = data.map((d, i) => {
        const pct = d.value / total;
        const startAngle = cumAngle;
        cumAngle += pct * 360;
        const endAngle = cumAngle;

        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const r = 80;
        const cx = 100; const cy = 100;

        const x1 = cx + r * Math.cos(toRad(startAngle));
        const y1 = cy + r * Math.sin(toRad(startAngle));
        const x2 = cx + r * Math.cos(toRad(endAngle));
        const y2 = cy + r * Math.sin(toRad(endAngle));
        const largeArc = pct > 0.5 ? 1 : 0;

        return { ...d, i, pct, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
    });

    return (
        <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
                <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    {slices.map((s, i) => (
                        <motion.path
                            key={i}
                            d={s.path}
                            fill={s.hex}
                            opacity={hovered === null || hovered === i ? 1 : 0.4}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: hovered === i ? 1.05 : 1 }}
                            style={{ transformOrigin: '100px 100px', cursor: 'pointer' }}
                            transition={{ duration: 0.2 }}
                        />
                    ))}
                    <circle cx="100" cy="100" r="45" fill="#0a0a0a" />
                    <text x="100" y="96" textAnchor="middle" fill="white" fontSize="14" fontWeight="black" className="font-display italic uppercase tracking-tighter">{centerLabel}</text>
                    <text x="100" y="112" textAnchor="middle" fill="#666" fontSize="8" fontWeight="black" className="uppercase tracking-widest">{centerSub}</text>
                </svg>
            </div>
            <div className="flex flex-col gap-2 flex-1 w-full">
                {slices.slice(0, 5).map((s, i) => (
                    <motion.div
                        key={i}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all cursor-default ${hovered === i ? 'bg-white/10' : 'bg-white/5 border border-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.hex }} />
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest truncate max-w-[120px]">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 font-bold">{(s.pct * 100).toFixed(0)}%</span>
                            <span className="text-xs font-black text-white w-8 text-right">{s.value}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// --- Bar Chart Component for Visits ---
function VisitsBarChart({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="w-full">
            <div className="flex items-end justify-between gap-1 h-40 px-2">
                {data.map((d, i) => {
                    const h = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0);
                    return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                            <div className="relative flex items-end w-full justify-center" style={{ height: '100%' }}>
                                {d.value > 0 && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10">
                                        {d.value.toLocaleString()}
                                    </div>
                                )}
                                <motion.div
                                    initial={{ height: '0%' }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.02, ease: 'circOut' }}
                                    className="w-full rounded-t-sm bg-gradient-to-t from-neon-red/40 to-neon-red group-hover:from-neon-red group-hover:to-neon-orange transition-colors"
                                    style={{ alignSelf: 'flex-end' }}
                                />
                            </div>
                            <span className="text-[7px] text-gray-600 font-black uppercase text-center leading-tight mt-1 group-hover:text-gray-400 transition-colors">{d.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function AdminStats() {
    const [newsData, setNewsData] = useState<any[]>([]);
    const [recapsData, setRecapsData] = useState<any[]>([]);
    const [agendaData, setAgendaData] = useState<any[]>([]);
    const [galerieData, setGalerieData] = useState<any[]>([]);
    const [subscribersData, setSubscribersData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverStats, setServerStats] = useState<any>(null);
    const [selectedDetail, setSelectedDetail] = useState<null | 'articles' | 'subscribers' | 'content' | 'clicks'>(null);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');
    const [position, setPosition] = useState<{ coordinates: [number, number], zoom: number }>({ coordinates: [0, 20], zoom: 1 });
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const handleExportPDF = () => {
        window.print();
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const resAnalytics = await fetch('/api/analytics/stats');
                if (resAnalytics.ok) {
                    const data = await resAnalytics.json();
                    setServerStats(data);
                    if (data.onlineUsers !== undefined) setOnlineUsers(data.onlineUsers);
                }

                const [news, recaps, agenda, galerie, subscribers] = await Promise.all([
                    fetch('/api/news').then(r => r.ok ? r.json() : []),
                    fetch('/api/recaps').then(r => r.ok ? r.json() : []),
                    fetch('/api/agenda').then(r => r.ok ? r.json() : []),
                    fetch('/api/galerie').then(r => r.ok ? r.json() : []),
                    fetch('/api/subscribers').then(r => r.ok ? r.json() : [])
                ]);

                setNewsData(news);
                setRecapsData(recaps);
                setAgendaData(agenda);
                setGalerieData(galerie);
                setSubscribersData(subscribers);

            } catch (e) {
                console.error("Failed to fetch data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
        const interval = setInterval(fetchAllData, 30000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const isDateInRange = (dateStr: string) => {
            if (!dateStr) return false;
            return dateStr >= dateRange.start && dateStr <= dateRange.end + 'T23:59';
        };

        const news = (newsData as any[]).filter(n => isDateInRange(n.date));
        const recaps = (recapsData as any[]).filter(r => isDateInRange(r.date));
        const agenda = (agendaData as any[]).filter(a => isDateInRange(a.date));
        const galerie = (galerieData as any[]).filter(g => isDateInRange(g.date));
        const subscribers = (subscribersData as any[]).filter(s => isDateInRange(s.date || ''));

        const totalVisitsCount = serverStats?.totalVisits || 0;
        const devices = serverStats?.devices || { mobile: 0, desktop: 0 };
        const sources = serverStats?.sources || [];
        const clicks = serverStats?.clicks || {};

        const countryStats = (serverStats?.countries || []).map((c: any) => ({
            code: c.code,
            name: c.code,
            visits: c.visits,
            percentage: totalVisitsCount > 0 ? Math.round((c.visits / totalVisitsCount) * 100) : 0,
        })).sort((a: any, b: any) => b.visits - a.visits).slice(0, 5);

        const allItems = [
            ...news.map(n => ({ ...n, type: n.category })),
            ...recaps.map(r => ({ ...r, type: 'Recap' })),
            ...agenda.map(a => ({ ...a, type: 'Agenda' })),
            ...galerie.map(g => ({ ...g, type: 'Galerie', image: g.cover }))
        ];

        const topArticles = (serverStats?.topArticles || []).map((apiItem: any) => {
            const item = allItems.find(i => String(i.id) === String(apiItem.id));
            if (!item) return null;
            return { ...item, views: apiItem.views };
        }).filter(Boolean);

        const timeline = serverStats?.timeline || [];
        const chartData = timeline.map((t: any) => ({
            label: t?.date?.split('-').slice(2).join('') || '??',
            value: t?.value || 0
        })).slice(-30);

        return {
            content: { news: news.length, recaps: recaps.length, agenda: agenda.length, galerie: galerie.length, total: allItems.length },
            community: { subscribers: subscribers.length, totalVisits: totalVisitsCount, countries: countryStats, topArticles, devices, sources, clicks },
            visits: chartData
        };
    }, [serverStats, dateRange]);

    const pieData = [
        { label: 'News', value: stats.content.news, color: 'bg-neon-blue', hex: '#0066ff' },
        { label: 'Récaps', value: stats.content.recaps, color: 'bg-neon-red', hex: '#ff0033' },
        { label: 'Agenda', value: stats.content.agenda, color: 'bg-yellow-400', hex: '#facc15' },
        { label: 'Galerie', value: stats.content.galerie, color: 'bg-pink-500', hex: '#ec4899' },
    ];

    const sourceData = stats.community.sources.map((s: any) => ({
        label: s.name,
        value: s.visits,
        color: 'bg-white',
        hex: `hsl(${Math.random() * 360}, 70%, 60%)`
    }));

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <Activity className="w-12 h-12 text-neon-red animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-4 md:px-12 relative overflow-x-hidden print:p-0 print:bg-white print:text-black">
            
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; color: black !important; }
                    .card { border: 1px solid #ddd !important; box-shadow: none !important; background: white !important; color: black !important; }
                    h1, h2, h3 { color: black !important; }
                    .text-gray-400, .text-gray-500 { color: #666 !important; }
                }
                .print-only { display: none; }
            `}</style>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16 no-print">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-gray-400 group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Site <span className="text-neon-red">Analytics</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">Dropsiders Intelligence • Live Protocol</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex gap-1">
                            <button onClick={() => setLanguage('fr')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${language === 'fr' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>FR</button>
                            <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${language === 'en' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>EN</button>
                        </div>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-4 bg-white text-black rounded-2xl font-black uppercase italic tracking-widest text-xs hover:bg-neon-red hover:text-white transition-all shadow-xl shadow-white/5">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                    </div>
                </div>

                <div className="print-only mb-10 text-center">
                    <h1 className="text-4xl font-black uppercase italic">Dropsiders Analytics Report</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest mt-2">Généré le {new Date().toLocaleDateString('fr-FR')} • {dateRange.start} au {dateRange.end}</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12">
                    {[
                        { title: 'Visites', value: stats.community.totalVisits.toLocaleString(), icon: <Activity className="w-5 h-5 text-neon-red" />, color: 'red' },
                        { title: 'Live', value: onlineUsers, icon: <div className="relative"><Users className="w-5 h-5 text-green-500" /><span className="absolute -top-1 -right-1 flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span></span></div>, color: 'green' },
                        { title: 'Contenus', value: stats.content.total, icon: <FileText className="w-5 h-5 text-neon-blue" />, color: 'blue' },
                        { title: 'Abonnés', value: stats.community.subscribers, icon: <Mail className="w-5 h-5 text-white" />, color: 'white' }
                    ].map((card, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 card">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">{card.icon}</div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.title}</span>
                            </div>
                            <div className="text-3xl md:text-5xl font-display font-black text-white italic tabular-nums">{card.value}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    {/* Visits Timeline */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-10 card">
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <h3 className="text-2xl font-display font-black text-white uppercase italic">Traffic <span className="text-neon-red">Timeline</span></h3>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">30 Derniers Jours</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] font-black text-white">{dateRange.start} → {dateRange.end}</span>
                            </div>
                        </div>
                        <VisitsBarChart data={stats.visits} />
                    </motion.div>

                    {/* Sources Pie */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-10 card">
                        <h3 className="text-2xl font-display font-black text-white uppercase italic mb-10">Traffic <span className="text-neon-blue">Sources</span></h3>
                        <PieChart data={sourceData.length > 0 ? sourceData : [{ label: 'Direct', value: 1, color: 'bg-white', hex: '#ffffff' }]} centerLabel={sourceData.length} centerSub="sources" />
                    </motion.div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    {/* Device & Engagement */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Device Stats */}
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 card h-full">
                            <h3 className="text-xl font-display font-black text-white uppercase italic mb-8">Devices <span className="text-neon-purple">Usage</span></h3>
                            <div className="space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><Smartphone className="w-6 h-6 text-neon-blue" /></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile</span>
                                            <span className="text-lg font-black text-white">{Math.round((stats.community.devices.mobile / (stats.community.devices.mobile + stats.community.devices.desktop || 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.community.devices.mobile / (stats.community.devices.mobile + stats.community.devices.desktop || 1)) * 100}%` }} className="h-full bg-neon-blue" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><Monitor className="w-6 h-6 text-white" /></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desktop</span>
                                            <span className="text-lg font-black text-white">{Math.round((stats.community.devices.desktop / (stats.community.devices.mobile + stats.community.devices.desktop || 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.community.devices.desktop / (stats.community.devices.mobile + stats.community.devices.desktop || 1)) * 100}%` }} className="h-full bg-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conversion Rate Placeholder */}
                        <div className="bg-gradient-to-br from-neon-red/10 to-neon-purple/10 border border-white/10 rounded-[40px] p-8 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Click Through Rate</h3>
                                <div className="text-4xl font-display font-black text-white italic">
                                    {stats.community.totalVisits > 0 ? (Object.values(stats.community.clicks || {}).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) / stats.community.totalVisits * 100).toFixed(1) : 0}%
                                </div>
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-4">Calculé sur les clics de billetterie</p>
                            </div>
                            <Share2 className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                        </div>
                    </div>

                    {/* Top Content Table */}
                    <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-10 card h-full">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-display font-black text-white uppercase italic">Popular <span className="text-neon-red">Content</span></h3>
                            <button onClick={() => setSelectedDetail('articles')} className="text-[10px] font-black text-neon-red uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="space-y-4">
                            {stats.community.topArticles.slice(0, 5).map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                    <div className="text-lg font-display font-black text-white/20 italic w-6">#{idx + 1}</div>
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"><img src={item.image} className="w-full h-full object-cover" /></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{item.type}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-display font-black text-white">{item.views.toLocaleString()}</div>
                                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">VIEWS</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Interaction & Conversion Leaderboard */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[40px] p-10 card mb-20 no-print">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-display font-black text-white uppercase italic">Engagement <span className="text-neon-blue">Leaderboard</span></h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Actions & Clics Prioritaires</p>
                        </div>
                        <div className="p-3 bg-neon-blue/10 rounded-xl border border-neon-blue/20"><ExternalLink className="w-5 h-5 text-neon-blue" /></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(stats.community.clicks).length > 0 ? (
                            Object.entries(stats.community.clicks)
                                .sort(([,a]:any, [,b]:any) => b - a)
                                .slice(0, 9)
                                .map(([key, count]: any, idx) => {
                                    const [category, action, label] = key.split('_');
                                    return (
                                        <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="px-2 py-0.5 bg-neon-red/10 text-neon-red text-[8px] font-black uppercase tracking-widest rounded-md">{category}</span>
                                                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{action}</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-white mb-4 line-clamp-2">{label || 'Action Directe'}</h4>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div className="text-3xl font-display font-black text-white">{count}</div>
                                                <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">CLICS</div>
                                            </div>
                                        </div>
                                    );
                                })
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-600 border-2 border-dashed border-white/5 rounded-3xl">
                                <Activity className="w-8 h-8 mx-auto opacity-20 mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Aucune donnée de clic pour le moment</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Modals placeholders */}
            <AnimatePresence>
                {selectedDetail === 'articles' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 no-print">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDetail(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-[40px] p-8 md:p-12 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">Full Content <span className="text-neon-red">Ranking</span></h2>
                                <button onClick={() => setSelectedDetail(null)} className="p-3 bg-white/5 rounded-2xl"><X className="w-6 h-6 text-gray-400" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                                {stats.community.topArticles.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-2xl font-display font-black text-white/20 italic w-8">#{idx + 1}</div>
                                        <div className="w-16 h-16 rounded-xl overflow-hidden"><img src={item.image} className="w-full h-full object-cover" /></div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold">{item.title}</h4>
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.type}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-display font-black text-white">{item.views.toLocaleString()}</div>
                                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">VIEWS</div>
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
