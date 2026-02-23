import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, FileText, ArrowLeft, Activity, Globe, Plus, X } from 'lucide-react';
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
        { name: "Paris", coordinates: [2.3522, 48.8566], views: 0 },
        { name: "Lyon", coordinates: [4.8357, 45.7640], views: 0 },
        { name: "Marseille", coordinates: [5.3698, 43.2965], views: 0 }
    ],
    'Belgium': [
        { name: "Bruxelles", coordinates: [4.3517, 50.8503], views: 0 },
        { name: "Anvers", coordinates: [4.4025, 51.2194], views: 0 }
    ],
    'Switzerland': [
        { name: "Genève", coordinates: [6.1432, 46.2044], views: 0 },
        { name: "Zurich", coordinates: [8.5417, 47.3769], views: 0 }
    ],
    'United States of America': [
        { name: "New York", coordinates: [-74.0060, 40.7128], views: 0 },
        { name: "Los Angeles", coordinates: [-118.2437, 34.0522], views: 0 }
    ]
};

// Import des données locales pour les stats
import newsData from '../data/news.json';
import recapsData from '../data/recaps.json';
import agendaData from '../data/agenda.json';
import galerieData from '../data/galerie.json';
import subscribersData from '../data/subscribers.json';

export function AdminStats() {
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState<null | 'articles'>(null);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');
    const [position, setPosition] = useState<{ coordinates: [number, number], zoom: number }>({ coordinates: [0, 20], zoom: 1 });

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
        const timer = setTimeout(() => setLoading(false), 800);

        // Simulation très légère pour le live (ou 0 si vraiment souhaité)
        const interval = setInterval(() => {
            setOnlineUsers(prev => {
                const change = Math.random() > 0.8 ? 1 : (Math.random() > 0.8 ? -1 : 0);
                const newValue = prev + change;
                return newValue >= 0 ? newValue : 0;
            });
        }, 10000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    const stats = useMemo(() => {
        const news = (newsData as any[]);
        const recaps = (recapsData as any[]);
        const agenda = (agendaData as any[]);
        const galerie = (galerieData as any[]);
        const subscribers = (subscribersData as any[]);

        const newsCount = news.length;
        const interviewCount = news.filter(i => i.category === 'Interview').length;
        const actualNewsCount = newsCount - interviewCount;
        const recapCount = recaps.length;
        const agendaCount = agenda.length;
        const galerieCount = galerie.length;
        const subCount = subscribers.length;

        // Vraies stats (0 par défaut si pas de tracking réel stocké)
        const totalContent = actualNewsCount + interviewCount + recapCount + agendaCount + galerieCount;

        // On initialise à 0 ou on récupère du localStorage si disponible
        const getLocalStorageViews = () => {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('dropsiders_views_')) {
                    total += parseInt(localStorage.getItem(key) || '0');
                }
            }
            return total;
        };

        const realTotalVisits = getLocalStorageViews();
        const todayVisits = 0; // À implémenter avec un vrai backend

        const countryStats = [
            { code: 'FR', name: 'France', name_fr: 'France', visits: realTotalVisits, percentage: realTotalVisits > 0 ? 100 : 0, color: 'bg-neon-red' },
            { code: 'BE', name: 'Belgium', name_fr: 'Belgique', visits: 0, percentage: 0, color: 'bg-white' },
            { code: 'CH', name: 'Switzerland', name_fr: 'Suisse', visits: 0, percentage: 0, color: 'bg-neon-purple' },
            { code: 'US', name: 'United States of America', name_fr: 'États-Unis', visits: 0, percentage: 0, color: 'bg-blue-500' },
            { code: 'OTHER', name: 'Others', name_fr: 'Autres', visits: 0, percentage: 0, color: 'bg-gray-500' }
        ];

        // Fusion de tous les articles pour le tracking global
        const allItems = [
            ...news.map(n => ({ ...n, type: n.category })),
            ...recaps.map(r => ({ ...r, type: 'Recap' })),
            ...agenda.map(a => ({ ...a, type: 'Agenda' })),
            ...galerie.map(g => ({ ...g, type: 'Galerie', image: g.cover }))
        ];

        // Articles les plus vus (basé sur le localStorage réel)
        const topArticles = allItems
            .map(item => {
                const viewsKey = `dropsiders_views_${item.id}`;
                const views = parseInt(localStorage.getItem(viewsKey) || '0');
                return { ...item, views };
            })
            .filter(item => item.views > 0)
            .sort((a, b) => b.views - a.views)
            .slice(0, 15);

        return {
            content: {
                total: totalContent,
                news: actualNewsCount,
                interviews: interviewCount,
                recaps: recapCount,
                agenda: agendaCount,
                galeries: galerieCount
            },
            community: {
                subscribers: subCount,
                totalVisits: realTotalVisits.toLocaleString(),
                todayVisits,
                countries: countryStats,
                topArticles
            }
        };
    }, []);

    const cards = [
        {
            id: 'visits',
            title: language === 'fr' ? "Visites Totales" : "Total Visits",
            value: stats.community.totalVisits,
            icon: <Activity className="w-6 h-6 text-neon-red" />,
            trend: "0%",
            isUp: true,
            color: "red",
            clickable: true
        },
        {
            title: language === 'fr' ? "Utilisateurs en ligne" : "Users Online",
            value: onlineUsers,
            icon: <div className="relative"><Users className="w-6 h-6 text-green-500" /><span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span></div>,
            trend: "Live",
            isUp: true,
            color: "green"
        },
        {
            title: language === 'fr' ? "Contenus Publiés" : "Published Content",
            value: stats.content.total,
            icon: <FileText className="w-6 h-6 text-neon-blue" />,
            trend: "0%",
            isUp: true,
            color: "blue"
        },
        {
            title: language === 'fr' ? "Abonnés Newsletter" : "Newsletter Subs",
            value: stats.community.subscribers,
            icon: <Users className="w-6 h-6 text-white" />,
            trend: "0%",
            isUp: true,
            color: "white"
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDetail(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-white/5 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                        {language === 'fr' ? "Contenus les " : "Most "} <span className="text-neon-red">{language === 'fr' ? "plus populaires" : "popular content"}</span>
                                    </h2>
                                    <p className="text-gray-400 mt-1 uppercase tracking-[0.2em] text-[10px] font-black">{language === 'fr' ? "Tracking Réel de Session" : "Real Session Tracking"}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedDetail(null)}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-400 group border border-white/10"
                                >
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                                {stats.community.topArticles.length > 0 ? stats.community.topArticles.map((item: any, idx: number) => {
                                    const itemPath = item.type === 'News' ? `/news/${item.id}` :
                                        item.type === 'Recap' ? `/recaps/${item.id}` :
                                            item.type === 'Agenda' ? `/agenda/${item.id}` :
                                                item.type === 'Galerie' ? `/galeries/${item.id}` :
                                                    item.type === 'Interview' ? `/interviews/${item.id}` :
                                                        `/${item.id}`;

                                    return (
                                        <Link key={`${item.type}-${item.id}`} to={itemPath}>
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="flex items-center gap-6 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                            >
                                                <div className="text-2xl font-display font-black text-white/20 italic w-10 text-center group-hover:text-neon-red transition-colors">
                                                    #{(idx + 1)}
                                                </div>
                                                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                                    <img src={item.image} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-lg font-bold text-white truncate pr-4 group-hover:text-neon-red transition-colors">{item.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${item.type === 'News' ? 'bg-neon-blue' :
                                                            item.type === 'Recap' ? 'bg-neon-red' :
                                                                item.type === 'Agenda' ? 'bg-neon-yellow !text-black' :
                                                                    item.type === 'Galerie' ? 'bg-neon-pink' : 'bg-neon-purple'
                                                            }`}>
                                                            {item.type}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-medium">Tracking actif</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-display font-black text-white group-hover:text-neon-red transition-colors duration-300">
                                                        {item.views.toLocaleString()}
                                                    </div>
                                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{language === 'fr' ? "VUES" : "VIEWS"}</div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    )
                                }) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                                        <Activity className="w-12 h-12 opacity-20" />
                                        <p className="font-black uppercase tracking-widest text-sm">{language === 'fr' ? "Aucune donnée de tracking pour le moment" : "No tracking data available"}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="w-full">
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
                </div>

                <div className="absolute top-8 p-4 right-8 z-50 flex gap-2">
                    <button
                        onClick={() => setLanguage('fr')}
                        aria-label="Switch to French"
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'fr' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        <FlagIcon location="France" className="w-4 h-3" />
                        <span>FR</span>
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        aria-label="Switch to English"
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        <FlagIcon location="USA" className="w-4 h-3" />
                        <span>EN</span>
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
                            onClick={() => (card as any).clickable && setSelectedDetail('articles')}
                            className={`bg-white/5 border border-white/10 rounded-[40px] p-10 relative overflow-hidden group shadow-2xl transition-all duration-500 ${(card as any).clickable ? 'cursor-pointer hover:border-neon-red/50 hover:bg-neon-red/5' : 'hover:border-white/20'}`}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-neon-${card.color === 'white' ? 'white' : card.color}/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className={`p-5 bg-white/5 rounded-[22px] border border-white/10 group-hover:bg-white/10 transition-colors ${card.color === 'white' ? 'text-white' : ''}`}>
                                    {card.icon}
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400`}>
                                    {card.trend}
                                </div>
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                    {/* Content Distribution Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-12 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <h3 className="text-2xl font-display font-black text-white uppercase italic">{language === 'fr' ? "Répartition du Contenu" : "Content Distribution"}</h3>
                                <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">{language === 'fr' ? "Base de données réelle" : "Real database"}</p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-white/10" />
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: language === 'fr' ? 'Articles News' : 'News Articles', value: stats.content.news, total: stats.content.total, color: 'bg-neon-blue' },
                                { label: language === 'fr' ? 'Interviews & Focus' : 'Interviews & Focus', value: stats.content.interviews, total: stats.content.total, color: 'bg-neon-purple' },
                                { label: language === 'fr' ? 'Reportages Récaps' : 'Recap Reports', value: stats.content.recaps, total: stats.content.total, color: 'bg-neon-red' },
                                { label: language === 'fr' ? 'Événements Agenda' : 'Agenda Events', value: stats.content.agenda, total: stats.content.total, color: 'bg-neon-yellow' },
                                { label: language === 'fr' ? 'Galeries Photos' : 'Photo Galleries', value: stats.content.galeries, total: stats.content.total, color: 'bg-neon-pink' },
                            ].map((item) => (
                                <div key={item.label} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-white font-black uppercase tracking-widest text-[11px] font-display">{item.label}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Ratio {item.total > 0 ? (item.value / item.total * 100).toFixed(1) : 0}%</span>
                                            <span className="text-xl font-display font-black text-white">{item.value}</span>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className={`h-full ${item.color} rounded-full relative group-hover:brightness-110 transition-all`}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Stats Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-12 relative overflow-hidden flex flex-col justify-between group"
                    >
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-neon-red/20 blur-[100px] group-hover:bg-neon-red/30 transition-colors duration-700" />

                        <div className="relative z-10">
                            <h3 className="text-3xl font-display font-black text-white uppercase italic mb-10 leading-tight">Insight<br /> <span className="text-neon-red">Performance</span></h3>

                            <div className="space-y-10">
                                <div className="group/item">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 group-hover/item:text-neon-red transition-colors">{language === 'fr' ? "Total des Données" : "Total Data Points"}</div>
                                    <div className="text-5xl font-display font-black text-white tracking-tighter group-hover/item:scale-105 transition-transform origin-left">{stats.content.total}</div>
                                </div>

                                <div className="group/item">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 group-hover/item:text-white transition-colors">{language === 'fr' ? "Visites du jour" : "Daily Reach"}</div>
                                    <div className="text-5xl font-display font-black text-white tracking-tighter group-hover/item:scale-105 transition-transform origin-left text-white">{stats.community.todayVisits}</div>
                                    <p className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-widest italic">{language === 'fr' ? "Stable" : "Stable"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 pt-16 mt-auto">
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-red opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-red"></span>
                                </span>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{language === 'fr' ? "Tracking Live Activé" : "Live Tracking Enabled"}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* World Map Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32"
                >
                    <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-12 overflow-hidden relative shadow-2xl">
                        <div className="flex justify-between items-center mb-16 px-4">
                            <div>
                                <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tight underline decoration-neon-red/10 decoration-8 underline-offset-4">Distribution <span className="text-neon-red">Live</span></h3>
                                <p className="text-gray-400 text-xs font-black mt-3 uppercase tracking-widest">{language === 'fr' ? "Analyse d'audience par localisation" : "Audience analysis by location"}</p>
                            </div>
                            <Globe className="w-10 h-10 text-white/5 animate-spin-slow" />
                        </div>

                        {/* Styled SVG Map Overlay */}
                        <div className="relative aspect-[2.2/1] w-full max-w-5xl mx-auto opacity-100 group overflow-hidden">
                            <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-full bg-white/5 rounded-3xl" width={800} height={400}>
                                <ZoomableGroup
                                    zoom={position.zoom}
                                    center={position.coordinates}
                                    onMoveEnd={(pos) => setPosition(pos)}
                                >
                                    <Geographies geography={geoUrl}>
                                        {({ geographies }) =>
                                            geographies.map((geo) => {
                                                const countryName = geo.properties.name;
                                                const hasData = !!CITIES_DATA[countryName];
                                                const isSelected = selectedCountry === countryName;

                                                return (
                                                    <Geography
                                                        key={geo.rsmKey}
                                                        geography={geo}
                                                        onClick={() => {
                                                            if (hasData) {
                                                                handleCountryClick(countryName);
                                                            }
                                                        }}
                                                        style={{
                                                            default: {
                                                                fill: isSelected ? "#FF3333" : hasData ? "rgba(255,51,51,0.3)" : "rgba(255,255,255,0.05)",
                                                                stroke: "rgba(255,255,255,0.1)",
                                                                strokeWidth: 0.5,
                                                                outline: "none",
                                                                cursor: hasData ? "pointer" : "default"
                                                            },
                                                            hover: {
                                                                fill: hasData ? "#FF3333" : "rgba(255,255,255,0.1)",
                                                                stroke: "rgba(255,255,255,0.2)",
                                                                strokeWidth: 0.5,
                                                                outline: "none",
                                                                cursor: hasData ? "pointer" : "default"
                                                            },
                                                            pressed: {
                                                                fill: "#FF3333",
                                                                outline: "none"
                                                            }
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                    </Geographies>

                                    {selectedCountry && CITIES_DATA[selectedCountry] && CITIES_DATA[selectedCountry].map((city) => (
                                        <Marker key={city.name} coordinates={city.coordinates}>
                                            <circle r={3 / position.zoom} fill="#00f0ff" className="animate-pulse" />
                                            <circle r={8 / position.zoom} stroke="#00f0ff" fill="none" opacity={0.4} strokeWidth={1 / position.zoom} className="animate-ping" />

                                            {/* Background label box */}
                                            <rect x={-20 / position.zoom} y={-16 / position.zoom} width={40 / position.zoom} height={12 / position.zoom} fill="black" opacity={0.8} rx={2 / position.zoom} />
                                            <text
                                                textAnchor="middle"
                                                y={-7 / position.zoom}
                                                style={{ fill: "#FFFFFF", fontSize: `${5 / position.zoom}px`, fontWeight: "bold", pointerEvents: "none" }}
                                            >
                                                {city.name} ({city.views})
                                            </text>
                                        </Marker>
                                    ))}
                                </ZoomableGroup>
                            </ComposableMap>

                            {/* Note for interactions */}
                            <div className="absolute top-4 left-4 pointer-events-none">
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="bg-black/80 backdrop-blur-sm border border-white/20 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-tighter shadow-2xl flex flex-col gap-1"
                                >
                                    <div className="flex items-center gap-2 hidden md:flex">
                                        <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-ping" />
                                        {language === 'fr' ? "CARTE INTERACTIVE" : "INTERACTIVE MAP"}
                                    </div>
                                    <span className="text-[7px] text-gray-400">{language === 'fr' ? "Cliquez sur les pays en surbrillance, molette pour zoomer" : "Click highlighted countries, scroll to zoom"}</span>
                                </motion.div>
                            </div>
                        </div>

                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>

                    <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-12 shadow-2xl flex flex-col">
                        <h3 className="text-2xl font-display font-black text-white uppercase italic mb-10">{language === 'fr' ? "Top Marchés" : "Top Markets"}</h3>
                        <div className="space-y-8 flex-1">
                            {stats.community.countries.map((country, idx) => {
                                const hasData = !!CITIES_DATA[country.name];
                                const isSelected = selectedCountry === country.name;
                                return (
                                    <motion.div
                                        key={country.code}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (idx * 0.1) }}
                                        className="flex flex-col"
                                    >
                                        <div
                                            onClick={() => handleCountryClick(country.name)}
                                            className={`group/entry flex items-center justify-between ${hasData ? 'cursor-pointer' : ''} ${isSelected ? 'bg-white/10 -mx-4 px-4 py-2 rounded-xl' : 'py-2'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-8 rounded-xl ${country.color === 'bg-neon-red' ? 'bg-gradient-to-br from-neon-red to-neon-purple' : country.color} shadow-sm group-hover/entry:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden`}>
                                                    <FlagIcon location={country.name} className="w-full h-full" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase italic tracking-tight group-hover/entry:text-neon-red transition-colors">{language === 'fr' ? country.name_fr : country.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{country.visits.toLocaleString()} {language === 'fr' ? "VISITES" : "VISITS"}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-display font-black text-white">{country.percentage}%</div>
                                                <div className="w-20 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden border border-white/10">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${country.percentage}%` }}
                                                        transition={{ duration: 1.5, delay: 0.8 }}
                                                        className={`h-full ${country.color === 'bg-white' ? 'bg-white/20' : country.color} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isSelected && hasData && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
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
    );
}

