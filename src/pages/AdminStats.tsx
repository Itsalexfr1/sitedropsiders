import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, FileText, ArrowLeft, Activity, Globe, Plus, X, Newspaper, Mic, Calendar, Image, Mail } from 'lucide-react';
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
function PieChart({ data }: { data: { label: string; value: number; color: string; hex: string }[] }) {
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

        const midAngle = startAngle + (pct * 360) / 2;
        const lx = cx + (r + 20) * Math.cos(toRad(midAngle));
        const ly = cy + (r + 20) * Math.sin(toRad(midAngle));

        return { ...d, i, pct, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, lx, ly, midAngle };
    });

    return (
        <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
                <svg width="200" height="200" viewBox="0 0 200 200">
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
                    {/* Center hole */}
                    <circle cx="100" cy="100" r="45" fill="#0a0a0a" />
                    <text x="100" y="96" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{total}</text>
                    <text x="100" y="112" textAnchor="middle" fill="#666" fontSize="8">contenus</text>
                </svg>
            </div>
            <div className="flex flex-col gap-3 flex-1 w-full">
                {slices.map((s, i) => (
                    <motion.div
                        key={i}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-default ${hovered === i ? 'bg-white/10' : 'bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.hex }} />
                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{(s.pct * 100).toFixed(1)}%</span>
                            <span className="text-sm font-black text-white w-8 text-right">{s.value}</span>
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
            <div className="flex items-end justify-between gap-2 h-48 px-2">
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
                                    transition={{ duration: 0.8, delay: i * 0.03, ease: 'circOut' }}
                                    className="w-full rounded-t-lg bg-gradient-to-t from-neon-red/80 to-neon-red max-w-[32px] mx-auto group-hover:from-neon-red group-hover:to-neon-orange transition-colors"
                                    style={{ alignSelf: 'flex-end' }}
                                />
                            </div>
                            <span className="text-[8px] text-gray-600 font-bold uppercase text-center leading-tight">{d.label}</span>
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
    const [selectedDetail, setSelectedDetail] = useState<null | 'articles' | 'subscribers' | 'content'>(null);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');
    const [position, setPosition] = useState<{ coordinates: [number, number], zoom: number }>({ coordinates: [0, 20], zoom: 1 });
    const [visitPeriod, setVisitPeriod] = useState<'day' | 'month' | 'year'>('month');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const handleCountryClick = (countryName: string) => {
        if (selectedCountry === countryName) {
            setSelectedCountry(null);
            setPosition({ coordinates: [0, 20], zoom: 1 });
        } else {
            setSelectedCountry(countryName);
            if (COUNTRY_CENTERS[countryName]) {
                setPosition({ coordinates: COUNTRY_CENTERS[countryName].center, zoom: COUNTRY_CENTERS[countryName].zoom });
            } else {
                setPosition({ coordinates: [0, 20], zoom: 1 });
            }
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch server analytics
                const resAnalytics = await fetch('/api/analytics/stats');
                if (resAnalytics.ok) {
                    const data = await resAnalytics.json();
                    setServerStats(data);
                    if (data.onlineUsers !== undefined) {
                        setOnlineUsers(data.onlineUsers);
                    }
                }

                // Fetch content data
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
            if (!dateRange.start || !dateRange.end) return true;
            if (dateStr.length === 4) {
                const year = parseInt(dateStr);
                const startYear = new Date(dateRange.start).getFullYear();
                const endYear = new Date(dateRange.end).getFullYear();
                return year >= startYear && year <= endYear;
            }
            return dateStr >= dateRange.start && dateStr <= dateRange.end + 'T23:59';
        };

        const news = (newsData as any[]).filter(n => isDateInRange(n.date));
        const recaps = (recapsData as any[]).filter(r => isDateInRange(r.date));
        const agenda = (agendaData as any[]).filter(a => isDateInRange(a.date));
        const galerie = (galerieData as any[]).filter(g => isDateInRange(g.date));
        const subscribers = (subscribersData as any[]).filter(s => isDateInRange(s.date || ''));

        const newsCount = news.length;
        const interviewCount = news.filter(i => i.category === 'Interview').length;
        const actualNewsCount = newsCount - interviewCount;
        const recapCount = recaps.length;
        const agendaCount = agenda.length;
        const galerieCount = galerie.length;
        const subCount = subscribers.length;

        const totalContent = actualNewsCount + interviewCount + recapCount + agendaCount + galerieCount;

        // --- REAL SERVER STATS MERGE ---
        const totalVisitsCount = serverStats?.totalVisits || 0;

        // Map country codes to country names/colors
        const countryNameMap: Record<string, { name: string, name_fr: string, color: string }> = {
            'FR': { name: 'France', name_fr: 'France', color: 'bg-neon-red' },
            'BE': { name: 'Belgium', name_fr: 'Belgique', color: 'bg-white' },
            'CH': { name: 'Switzerland', name_fr: 'Suisse', color: 'bg-neon-purple' },
            'US': { name: 'United States of America', name_fr: 'États-Unis', color: 'bg-blue-500' },
            'GB': { name: 'United Kingdom', name_fr: 'Royaume-Uni', color: 'bg-blue-700' },
            'DE': { name: 'Germany', name_fr: 'Allemagne', color: 'bg-yellow-600' }
        };

        const apiCountries = serverStats?.countries || [];
        const countryStats = apiCountries.map((c: any) => ({
            code: c.code,
            name: countryNameMap[c.code]?.name || c.code,
            name_fr: countryNameMap[c.code]?.name_fr || c.code,
            visits: c.visits,
            percentage: totalVisitsCount > 0 ? Math.round((c.visits / totalVisitsCount) * 100) : 0,
            color: countryNameMap[c.code]?.color || 'bg-gray-500'
        })).sort((a: any, b: any) => b.visits - a.visits).slice(0, 5);

        // Fallback if no server data
        if (countryStats.length === 0) {
            countryStats.push({ code: 'FR', name: 'France', name_fr: 'France', visits: totalVisitsCount, percentage: 100, color: 'bg-neon-red' });
        }

        const allItems = [
            ...news.map(n => ({ ...n, type: n.category })),
            ...recaps.map(r => ({ ...r, type: 'Recap' })),
            ...agenda.map(a => ({ ...a, type: 'Agenda' })),
            ...galerie.map(g => ({ ...g, type: 'Galerie', image: g.cover }))
        ];

        // Map server top articles to actual item data
        const apiTop = serverStats?.topArticles || [];
        const topArticles = apiTop.map((apiItem: any) => {
            const item = allItems.find(i => String(i.id) === String(apiItem.id));
            if (!item) return null;
            return { ...item, views: apiItem.views };
        }).filter(Boolean).slice(0, 15);

        // Timeline data
        const timeline = serverStats?.timeline || [];
        const monthData = timeline.map((t: any) => ({
            label: (t?.date && typeof t.date === 'string') ? t.date.split('-').slice(2).join('') : '??', // Just the day
            value: t?.value || 0
        })).slice(-30);

        const dayData = Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: 0 })); // Placeholder for hourly

        return {
            content: { total: totalContent, news: actualNewsCount, interviews: interviewCount, recaps: recapCount, agenda: agendaCount, communaute: galerieCount },
            community: { subscribers: subCount, subscribersList: subscribers, totalVisits: totalVisitsCount.toLocaleString(), countries: countryStats, topArticles },
            visits: { day: dayData, month: monthData, year: [] }
        };
    }, [serverStats, dateRange]);

    const pieData = [
        { label: language === 'fr' ? 'Articles News' : 'News', value: stats.content.news, color: 'bg-neon-blue', hex: '#0066ff' },
        { label: language === 'fr' ? 'Interviews' : 'Interviews', value: stats.content.interviews, color: 'bg-neon-purple', hex: '#8b5cf6' },
        { label: language === 'fr' ? 'Récaps' : 'Recaps', value: stats.content.recaps, color: 'bg-neon-red', hex: '#ff0033' },
        { label: language === 'fr' ? 'Agenda' : 'Agenda', value: stats.content.agenda, color: 'bg-yellow-400', hex: '#facc15' },
        { label: language === 'fr' ? 'Communauté' : 'Community', value: stats.content.communaute, color: 'bg-neon-red', hex: '#ec4899' },
    ];

    const visitData = visitPeriod === 'day' ? stats.visits.day : visitPeriod === 'month' ? stats.visits.month : stats.visits.year;

    const cards = [
        {
            id: 'visits',
            title: language === 'fr' ? "Visites Totales" : "Total Visits",
            value: stats.community.totalVisits,
            icon: <Activity className="w-6 h-6 text-neon-red" />,
            trend: "0%", isUp: true, color: "red", clickable: 'articles'
        },
        {
            title: language === 'fr' ? "Utilisateurs en ligne" : "Users Online",
            value: onlineUsers,
            icon: <div className="relative"><Users className="w-6 h-6 text-green-500" /><span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span></div>,
            trend: "Live", isUp: true, color: "green"
        },
        {
            title: language === 'fr' ? "Contenus Publiés" : "Published Content",
            value: stats.content.total,
            icon: <FileText className="w-6 h-6 text-neon-blue" />,
            trend: "0%", isUp: true, color: "blue", clickable: 'content'
        },
        {
            title: language === 'fr' ? "Abonnés Newsletter" : "Newsletter Subs",
            value: stats.community.subscribers,
            icon: <Users className="w-6 h-6 text-white" />,
            trend: "0%", isUp: true, color: "white", clickable: 'subscribers'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-neon-red animate-pulse" />
                    <p className="text-gray-400 font-display font-black uppercase tracking-widest animate-pulse">Chargement du dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg py-32 px-12 relative overflow-x-hidden">

            {/* Modal Top Articles */}
            <AnimatePresence>
                {selectedDetail === 'articles' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDetail(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-white/5 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">{language === 'fr' ? "Contenus les " : "Most "}<span className="text-neon-red">{language === 'fr' ? "plus populaires" : "popular content"}</span></h2>
                                    <p className="text-gray-400 mt-1 uppercase tracking-[0.2em] text-[10px] font-black">Tracking Session Réel</p>
                                </div>
                                <button onClick={() => setSelectedDetail(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-400 group border border-white/10"><X className="w-6 h-6 group-hover:rotate-90 transition-transform" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                                {stats.community.topArticles.length > 0 ? stats.community.topArticles.map((item: any, idx: number) => {
                                    const itemPath = item.type === 'News' ? `/news/${item.id}` : item.type === 'Recap' ? `/recaps/${item.id}` : item.type === 'Agenda' ? `/agenda/${item.id}` : item.type === 'Galerie' ? `/galerie/${item.id}` : item.type === 'Interview' ? `/interviews/${item.id}` : `/${item.id}`;
                                    return (
                                        <Link key={`${item.type}-${item.id}`} to={itemPath}>
                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} className="flex items-center gap-6 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group cursor-pointer">
                                                <div className="text-2xl font-display font-black text-white/20 italic w-10 text-center group-hover:text-neon-red transition-colors">#{(idx + 1)}</div>
                                                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/10"><img src={item.image} className="w-full h-full object-cover" alt="" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-lg font-bold text-white truncate pr-4 group-hover:text-neon-red transition-colors">{item.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${item.type === 'News' ? 'bg-neon-blue' : item.type === 'Recap' ? 'bg-neon-red' : item.type === 'Agenda' ? 'bg-neon-yellow !text-black' : item.type === 'Galerie' ? 'bg-neon-red' : 'bg-neon-purple'}`}>{item.type}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-display font-black text-white group-hover:text-neon-red transition-colors duration-300">{item.views.toLocaleString()}</div>
                                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">VUES</div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    )
                                }) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                                        <Activity className="w-12 h-12 opacity-20" />
                                        <p className="font-black uppercase tracking-widest text-sm">Aucune donnée de tracking pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Abonnés */}
            <AnimatePresence>
                {selectedDetail === 'subscribers' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDetail(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                            <div className="p-8 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                                <div>
                                    <h2 className="text-2xl font-display font-black text-white uppercase italic">Abonnés <span className="text-neon-red">Newsletter</span></h2>
                                    <p className="text-gray-500 text-xs mt-1 font-bold uppercase tracking-widest">{stats.community.subscribers} membre{stats.community.subscribers > 1 ? 's' : ''} inscrit{stats.community.subscribers > 1 ? 's' : ''}</p>
                                </div>
                                <button onClick={() => setSelectedDetail(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 border border-white/10 group"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {stats.community.subscribersList.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600">
                                        <Mail className="w-10 h-10 mx-auto opacity-20 mb-3" />
                                        <p className="text-xs font-black uppercase tracking-widest">Aucun abonné pour le moment</p>
                                    </div>
                                ) : (
                                    stats.community.subscribersList.map((sub: any, idx: number) => (
                                        <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                                            className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                            <div className="w-9 h-9 rounded-full bg-neon-red/20 text-neon-red flex items-center justify-center font-black text-sm flex-shrink-0">
                                                {(sub.email || sub)[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-bold truncate">{sub.email || sub}</p>
                                                {sub.date && <p className="text-gray-600 text-[10px] mt-0.5">Inscrit le {new Date(sub.date).toLocaleDateString('fr-FR')}</p>}
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Contenus (Pie Chart) */}
            <AnimatePresence>
                {selectedDetail === 'content' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDetail(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-display font-black text-white uppercase italic">Répartition <span className="text-neon-blue">Contenus</span></h2>
                                    <p className="text-gray-500 text-xs mt-1 font-bold uppercase tracking-widest">Par thème · {stats.content.total} publications</p>
                                </div>
                                <button onClick={() => setSelectedDetail(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 border border-white/10 group"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
                            </div>
                            <div className="p-8">
                                <PieChart data={pieData} />
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    {[
                                        { icon: <Newspaper className="w-4 h-4" />, label: 'Articles', value: stats.content.news, color: '#0066ff' },
                                        { icon: <Mic className="w-4 h-4" />, label: 'Interviews', value: stats.content.interviews, color: '#8b5cf6' },
                                        { icon: <FileText className="w-4 h-4" />, label: 'Récaps', value: stats.content.recaps, color: '#ff0033' },
                                        { icon: <Calendar className="w-4 h-4" />, label: 'Agenda', value: stats.content.agenda, color: '#facc15' },
                                        { icon: <Image className="w-4 h-4" />, label: 'Communauté', value: stats.content.communaute, color: '#ec4899' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: item.color + '20', color: item.color }}>{item.icon}</div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</div>
                                                <div className="text-lg font-black text-white">{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="min-h-screen bg-dark-bg py-32">
                <div className="max-w-full mx-auto px-4 md:px-12">
                    <div className="flex items-center gap-6 mb-16">
                        <Link to="/admin" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-gray-400 group" title="Retour au tableau de bord">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Dashboard <span className="text-neon-red underline decoration-8 decoration-neon-red/10 underline-offset-8">Analytics</span>
                            </h1>
                            <p className="text-gray-400 mt-4 text-xs font-black uppercase tracking-[0.3em] font-display">
                                {language === 'fr' ? "Tracking Réel Temps Réel" : "Real Time Real Tracking"} • Dropsiders V2
                            </p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-neon-red" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Période d'analyse</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="bg-transparent text-white text-[10px] font-bold outline-none border-b border-white/10 focus:border-neon-red transition-all"
                                        />
                                        <span className="text-gray-600 text-[10px]">→</span>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="bg-transparent text-white text-[10px] font-bold outline-none border-b border-white/10 focus:border-neon-red transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setDateRange({
                                    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                                    end: new Date().toISOString().split('T')[0]
                                })}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest transition-all"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </div>

                    <div className="absolute top-8 p-4 right-8 z-50 flex gap-2">
                        <button onClick={() => setLanguage('fr')} aria-label="Switch to French" className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'fr' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            <FlagIcon location="France" className="w-4 h-3" /><span>FR</span>
                        </button>
                        <button onClick={() => setLanguage('en')} aria-label="Switch to English" className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            <FlagIcon location="USA" className="w-4 h-3" /><span>EN</span>
                        </button>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        {cards.map((card, idx) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => (card as any).clickable && setSelectedDetail((card as any).clickable)}
                                className={`bg-white/5 border border-white/10 rounded-[40px] p-10 relative overflow-hidden group shadow-2xl transition-all duration-500 ${(card as any).clickable ? 'cursor-pointer hover:border-neon-red/50 hover:bg-neon-red/5' : 'hover:border-white/20'}`}
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-neon-${card.color === 'white' ? 'white' : card.color}/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className={`p-5 bg-white/5 rounded-[22px] border border-white/10 group-hover:bg-white/10 transition-colors`}>{card.icon}</div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400">{card.trend}</div>
                                </div>
                                <div className="relative z-10">
                                    <div className="text-5xl font-display font-black text-white mb-2 group-hover:translate-x-2 transition-transform duration-500 origin-left tabular-nums tracking-tighter">{card.value}</div>
                                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        {card.title}
                                        {(card as any).clickable && <Plus className="w-3.5 h-3.5 text-neon-red animate-pulse" />}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Visits Bar Chart */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-[40px] p-10 mb-16 shadow-2xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h3 className="text-2xl font-display font-black text-white uppercase italic">{language === 'fr' ? "Visites" : "Visits"} <span className="text-neon-red">Timeline</span></h3>
                                <p className="text-gray-500 text-xs mt-1 font-bold uppercase tracking-widest">{language === 'fr' ? "Suivi des sessions en temps réel" : "Real-time session tracking"}</p>
                            </div>
                            <div className="flex gap-2 bg-white/5 border border-white/10 rounded-full p-1">
                                {(['day', 'month', 'year'] as const).map(p => (
                                    <button key={p} onClick={() => setVisitPeriod(p)} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${visitPeriod === p ? 'bg-neon-red text-white shadow-lg shadow-neon-red/30' : 'text-gray-500 hover:text-white'}`}>
                                        {p === 'day' ? (language === 'fr' ? 'Jour' : 'Day') : p === 'month' ? (language === 'fr' ? 'Mois' : 'Month') : (language === 'fr' ? 'Année' : 'Year')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <VisitsBarChart data={visitData} />
                        <div className="mt-4 flex items-center gap-2">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-red opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-neon-red"></span></span>
                            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{language === 'fr' ? "Données réelles issues du serveur Cloudflare KV." : "Real data powered by Cloudflare KV."}</span>
                        </div>
                    </motion.div>

                    {/* Content Pie + Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-12 shadow-2xl">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase italic">{language === 'fr' ? "Répartition du Contenu" : "Content Distribution"}</h3>
                                    <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">{language === 'fr' ? "Base de données réelle" : "Real database"}</p>
                                </div>
                                <button onClick={() => setSelectedDetail('content')} className="flex items-center gap-2 px-4 py-2 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue rounded-xl text-xs font-black uppercase hover:bg-neon-blue/20 transition-all">
                                    <BarChart3 className="w-4 h-4" /> Détail
                                </button>
                            </div>
                            <PieChart data={pieData} />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-12 relative overflow-hidden flex flex-col justify-between group">
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-neon-red/20 blur-[100px] group-hover:bg-neon-red/30 transition-colors duration-700" />
                            <div className="relative z-10">
                                <h3 className="text-3xl font-display font-black text-white uppercase italic mb-10 leading-tight">Insight<br /> <span className="text-neon-red">Performance</span></h3>
                                <div className="space-y-10">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">{language === 'fr' ? "Total des Données" : "Total Data Points"}</div>
                                        <div className="text-5xl font-display font-black text-white tracking-tighter">{stats.content.total}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">{language === 'fr' ? "Abonnés Newsletter" : "Newsletter Subs"}</div>
                                        <div className="text-5xl font-display font-black text-white tracking-tighter">{stats.community.subscribers}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative z-10 pt-16 mt-auto">
                                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-red opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-neon-red"></span></span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Tracking Live Activé</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* World Map Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
                        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-12 overflow-hidden relative shadow-2xl">
                            <div className="flex justify-between items-center mb-16 px-4">
                                <div>
                                    <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tight underline decoration-neon-red/10 decoration-8 underline-offset-4">Distribution <span className="text-neon-red">Live</span></h3>
                                    <p className="text-gray-400 text-xs font-black mt-3 uppercase tracking-widest">{language === 'fr' ? "Analyse d'audience par localisation" : "Audience analysis by location"}</p>
                                </div>
                                <Globe className="w-10 h-10 text-white/5 animate-spin-slow" />
                            </div>
                            <div className="relative aspect-[2.2/1] w-full max-w-5xl mx-auto opacity-100 group overflow-hidden">
                                <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full bg-white/5 rounded-3xl" width={800} height={400}>
                                    <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={(pos) => setPosition(pos)}>
                                        <Geographies geography={geoUrl}>
                                            {({ geographies }) => geographies.map((geo) => {
                                                const countryName = geo.properties.name;
                                                const hasData = !!CITIES_DATA[countryName];
                                                const isSelected = selectedCountry === countryName;
                                                return (
                                                    <Geography key={geo.rsmKey} geography={geo} onClick={() => { if (hasData) handleCountryClick(countryName); }}
                                                        style={{
                                                            default: { fill: isSelected ? "#FF3333" : hasData ? "rgba(255,51,51,0.3)" : "rgba(255,255,255,0.05)", stroke: "rgba(255,255,255,0.1)", strokeWidth: 0.5, outline: "none", cursor: hasData ? "pointer" : "default" },
                                                            hover: { fill: hasData ? "#FF3333" : "rgba(255,255,255,0.1)", stroke: "rgba(255,255,255,0.2)", strokeWidth: 0.5, outline: "none", cursor: hasData ? "pointer" : "default" },
                                                            pressed: { fill: "#FF3333", outline: "none" }
                                                        }} />
                                                );
                                            })}
                                        </Geographies>
                                        {selectedCountry && CITIES_DATA[selectedCountry] && CITIES_DATA[selectedCountry].map((city) => (
                                            <Marker key={city.name} coordinates={city.coordinates}>
                                                <circle r={3 / position.zoom} fill="#00f0ff" className="animate-pulse" />
                                                <circle r={8 / position.zoom} stroke="#00f0ff" fill="none" opacity={0.4} strokeWidth={1 / position.zoom} className="animate-ping" />
                                                <rect x={-20 / position.zoom} y={-16 / position.zoom} width={40 / position.zoom} height={12 / position.zoom} fill="black" opacity={0.8} rx={2 / position.zoom} />
                                                <text textAnchor="middle" y={-7 / position.zoom} style={{ fill: "#FFFFFF", fontSize: `${5 / position.zoom}px`, fontWeight: "bold", pointerEvents: "none" }}>{city.name} ({city.views})</text>
                                            </Marker>
                                        ))}
                                    </ZoomableGroup>
                                </ComposableMap>
                                <div className="absolute top-4 left-4 pointer-events-none">
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-tighter shadow-2xl flex flex-col gap-1">
                                        <div className="flex items-center gap-2 hidden md:flex"><span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-ping" />{language === 'fr' ? "CARTE INTERACTIVE" : "INTERACTIVE MAP"}</div>
                                        <span className="text-[7px] text-gray-400">{language === 'fr' ? "Cliquez sur les pays en surbrillance, molette pour zoomer" : "Click highlighted countries, scroll to zoom"}</span>
                                    </motion.div>
                                </div>
                            </div>
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>

                        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-12 shadow-2xl flex flex-col">
                            <h3 className="text-2xl font-display font-black text-white uppercase italic mb-10">{language === 'fr' ? "Top Marchés" : "Top Markets"}</h3>
                            <div className="space-y-8 flex-1">
                                {stats.community.countries.map((country: any, idx: number) => {
                                    const hasData = !!CITIES_DATA[country.name];
                                    const isSelected = selectedCountry === country.name;
                                    return (
                                        <motion.div key={country.code} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }} className="flex flex-col">
                                            <div onClick={() => handleCountryClick(country.name)} className={`group/entry flex items-center justify-between ${hasData ? 'cursor-pointer' : ''} ${isSelected ? 'bg-white/10 -mx-4 px-4 py-2 rounded-xl' : 'py-2'}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-8 rounded-xl ${country.color === 'bg-neon-red' ? 'bg-gradient-to-br from-neon-red to-neon-purple' : country.color} shadow-sm group-hover/entry:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden`}>
                                                        <FlagIcon location={country.name} className="w-full h-full" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white uppercase italic tracking-tight group-hover/entry:text-neon-red transition-colors">{language === 'fr' ? country.name_fr : country.name}</div>
                                                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{country.visits.toLocaleString()} VISITES</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-display font-black text-white">{country.percentage}%</div>
                                                    <div className="w-20 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden border border-white/10">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${country.percentage}%` }} transition={{ duration: 1.5, delay: 0.8 }} className={`h-full ${country.color === 'bg-white' ? 'bg-white/20' : country.color} rounded-full`} />
                                                    </div>
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {isSelected && hasData && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <div className="pt-4 pl-16 pr-4 pb-2 space-y-3 border-l-2 border-white/10 ml-6 mb-2">
                                                            {CITIES_DATA[country.name].map(city => (
                                                                <div key={city.name} className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-lg">
                                                                    <span className="text-xs text-white uppercase tracking-widest">{city.name}</span>
                                                                    <span className="text-xs font-black text-neon-red">{city.views.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <p className="text-[9px] text-gray-500 leading-relaxed font-black uppercase tracking-[0.2em]">
                                    {language === 'fr' ? "* Estimations géospatiales en temps réel propulsées par l'analyse des nœuds IP Dropsiders." : "* Real-Time Geospatial Estimations powered by Dropsiders IP node analysis."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
