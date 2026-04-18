import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit2, Loader2, Filter, ArrowRight, Calendar, Film } from 'lucide-react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getArticleLink } from '../utils/slugify';
import { standardizeContent } from '../utils/standardizer';
import { Pagination } from '../components/ui/Pagination';
import { translateText } from '../utils/translate';
import { getAuthHeaders } from '../utils/auth';
import { SEO } from '../components/utils/SEO';
import { AdminEditBar } from '../components/admin/AdminEditBar';
import { resolveImageUrl } from '../utils/image';
import { getCategoryColor } from '../utils/theme';
import { Plus, FileText } from 'lucide-react';
import { fetchWithFallback } from '../utils/fetcher';

type TabKey = 'all' | 'news' | 'musique' | 'focus';

const DEFAULT_TABS: { key: TabKey; label: string; activeClass: string; inactiveClass: string }[] = [
    { key: 'all', label: 'Toutes', activeClass: 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]', inactiveClass: 'text-white/40 border-white/10 hover:border-white/30 hover:text-white' },
    { key: 'news', label: 'News', activeClass: 'bg-neon-red text-white shadow-[0_0_20px_rgba(255,17,17,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-red/40 hover:text-neon-red' },
    { key: 'musique', label: 'Musiques', activeClass: 'bg-neon-green text-white shadow-[0_0_20px_rgba(17,255,17,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-green/40 hover:text-neon-green' },
    { key: 'focus', label: 'Focus de la semaine', activeClass: 'bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-yellow-500/40 hover:text-yellow-500' },
];

export function News() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as TabKey;
    const [newsData, setNewsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [tabs, setTabs] = useState(DEFAULT_TABS);
    const [agendaData, setAgendaData] = useState<any[]>([]);
    const [recapsData, setRecapsData] = useState<any[]>([]);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');

        const fetchNews = async () => {
            try {
                const data = await fetchWithFallback('/api/news', { headers: getAuthHeaders() });
                if (data) {
                    setNewsData(data);
                }
            } catch (e) {
                console.error('Error fetching news:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();

        const fetchSettings = async () => {
            try {
                const data = await fetchWithFallback('/api/settings', { headers: getAuthHeaders() });
                if (data && data.news_tabs) {
                    setTabs(prev => prev.map(tab => ({
                        ...tab,
                        label: data.news_tabs[tab.key] || tab.label
                    })));
                }
            } catch (e) {
                console.error('Error fetching settings:', e);
            }
        };
        fetchSettings();

        const fetchAgenda = async () => {
            try {
                const data = await fetchWithFallback('/api/agenda', { headers: getAuthHeaders() });
                if (data) {
                    const now = new Date();
                    const upcoming = (Array.isArray(data) ? data : [])
                        .filter((e: any) => e.startDate && new Date(e.startDate) >= now)
                        .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .slice(0, 3);
                    setAgendaData(upcoming);
                }
            } catch (e) { /* silent */ }
        };
        fetchAgenda();

        const fetchRecaps = async () => {
            try {
                const data = await fetchWithFallback('/api/recaps', { headers: getAuthHeaders() });
                if (data) {
                    setRecapsData((Array.isArray(data) ? data : []).slice(0, 3));
                }
            } catch (e) { /* silent */ }
        };
        fetchRecaps();

        if (tabParam && ['all', 'news', 'musique', 'focus'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);

    const handleEdit = async (item: any) => {
        setLoadingEditId(item.id);
        try {
            const res = await fetch(`/api/news/content?id=${item.id}`, { headers: getAuthHeaders() });
            const fullItem = { ...item };
            if (res.ok) {
                const data = await res.json();
                fullItem.content = data.content || '';
            }
            const isItemInterview = item.category === 'Interview' || item.category === 'Interviews' || item.category === 'Interview Video';
            const editUrl = isItemInterview ? `/news/create?type=Interview&id=${item.id}` : `/news/create?id=${item.id}`;
            navigate(editUrl, { state: { isEditing: true, item: fullItem } });
        } catch (e: any) {
            console.error('Error fetching content:', e);
            const isItemInterview = item.category === 'Interview' || item.category === 'Interviews' || item.category === 'Interview Video';
            const editUrl = isItemInterview ? `/news/create?type=Interview&id=${item.id}` : `/news/create?id=${item.id}`;
            navigate(editUrl, { state: { isEditing: true, item: item } });
        } finally {
            setLoadingEditId(null);
        }
    };

    const handlePrefetch = (id: number | string) => {
        try {
            fetch(`/api/news/content?id=${id}`);
        } catch (e) { }
    };

    const articlesPerPage = 8;

    const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
    const [translatedSummaries, setTranslatedSummaries] = useState<Record<number, string>>({});

    const baseNews = useMemo(() => {
        if (!Array.isArray(newsData)) return [];
        return newsData
            .filter((item: any) => {
                if (!item) return false;
                const cat = (item.category || '').toLowerCase();
                return cat.includes('news') ||
                    cat.includes('musique') ||
                    cat.includes('music') ||
                    cat.includes('actu') ||
                    cat.includes('festival') ||
                    cat.includes('artist') ||
                    item.isFocus;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
            });
    }, [newsData]);

    const filteredNews = useMemo(() => {
        if (activeTab === 'all') return baseNews;
        if (activeTab === 'news') return baseNews.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return (cat.includes('news') || cat.includes('actu') || cat.includes('festival')) && !item.isFocus;
        });
        if (activeTab === 'musique') return baseNews.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return cat.includes('musique') || cat.includes('music');
        });
        if (activeTab === 'focus') return baseNews.filter((item: any) => item.isFocus);
        return baseNews;
    }, [activeTab, baseNews]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        if (language === 'en') {
            const startIndex = (currentPage - 1) * articlesPerPage;
            const currentArticles = filteredNews.slice(startIndex, startIndex + articlesPerPage);

            Promise.all(
                currentArticles.map((item: any) =>
                    translateText(item.title, 'en').then(translated => ({ id: item.id, title: translated }))
                )
            ).then(results => {
                const titleMap: Record<number, string> = { ...translatedTitles };
                results.forEach((res: any) => {
                    titleMap[res.id] = res.title;
                });
                setTranslatedTitles(titleMap);
            });

            Promise.all(
                currentArticles.map((item: any) =>
                    translateText(item.summary, 'en').then(translated => ({ id: item.id, summary: translated }))
                )
            ).then(results => {
                const summaryMap: Record<number, string> = { ...translatedSummaries };
                results.forEach((res: any) => {
                    summaryMap[res.id] = res.summary;
                });
                setTranslatedSummaries(summaryMap);
            });
        }
    }, [language, currentPage, filteredNews]);

    const totalPages = Math.ceil(filteredNews.length / articlesPerPage);
    const startIndex = (currentPage - 1) * articlesPerPage;
    const currentArticles = filteredNews.slice(startIndex, startIndex + articlesPerPage);

    const playHoverSound = useHoverSound();

    const handlePageChange = (newPage: number) => {
        setDirection(newPage > currentPage ? 1 : -1);
        setCurrentPage(newPage);
    };

    const handleTabChange = (tab: TabKey) => {
        setDirection(0);
        setActiveTab(tab);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    // Hero news: first featured or most recent article
    const heroArticle = useMemo(() => {
        const featured = baseNews.find((a: any) => a.isFocus || a.isFeatured);
        return featured || baseNews[0];
    }, [baseNews]);

    // Other news for mobile scroll: all except hero
    const otherNews = useMemo(() => {
        if (!heroArticle) return baseNews.slice(0, 12);
        return baseNews.filter((a: any) => a.id !== heroArticle.id).slice(0, 12);
    }, [baseNews, heroArticle]);

    return (
        <>
            <SEO
                title="Actualités Festivals"
                description="Toute l'actualité des festivals EDM, Techno et House. News, sorties et exclusivités."
            />

            {/* ══════════════════════════════════════════
                MOBILE LAYOUT (hidden on md+)
            ══════════════════════════════════════════ */}
            <div className="md:hidden min-h-screen pb-28">

                {/* Logo */}
                <div className="flex justify-center pt-16 pb-4 px-4">
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img
                            src="/Logo.png"
                            alt="DROPSIDERS"
                            className="h-10 w-auto object-contain"
                        />
                    </Link>
                </div>

                {/* ── Section : NEWS À LA UNE ── */}
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2.5 h-2.5 bg-neon-red rounded-full shadow-[0_0_10px_rgba(255,0,51,0.8)] animate-pulse" />
                        <span className="text-sm font-display font-black text-white uppercase tracking-widest">
                            À la une
                        </span>
                    </div>

                    {heroArticle ? (
                        <Link to={getArticleLink(heroArticle)} onMouseEnter={() => handlePrefetch(heroArticle.id)} className="block relative rounded-3xl overflow-hidden aspect-[16/9] group">
                            <img
                                src={resolveImageUrl(heroArticle.image || heroArticle.cover)}
                                alt={heroArticle.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-active:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
                            {isAdmin && (
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(heroArticle); }}
                                    disabled={loadingEditId === heroArticle.id}
                                    className="absolute top-3 right-3 z-20 p-2 bg-black/60 backdrop-blur-md rounded-xl border border-neon-cyan/50 text-neon-cyan disabled:opacity-50"
                                >
                                    {loadingEditId === heroArticle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                                </button>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border backdrop-blur-md mb-2 inline-block ${heroArticle.isFocus 
                                    ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' 
                                    : (heroArticle.category || '').toLowerCase().includes('musique')
                                        ? 'bg-neon-green/20 text-neon-green border-neon-green/30'
                                        : (heroArticle.category || '').toLowerCase().includes('recap')
                                            ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30'
                                            : (heroArticle.category || '').toLowerCase().includes('interview')
                                                ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
                                                : 'bg-neon-red/20 text-neon-red border-neon-red/30'}`}>
                                    {heroArticle.isFocus ? '⭐ FOCUS' : heroArticle.category}
                                </span>
                                <h2
                                    className="text-sm font-display font-black text-white italic uppercase leading-tight tracking-tight line-clamp-3 group-active:text-neon-red transition-colors duration-200"
                                    dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[heroArticle.id] || heroArticle.title) }}
                                />
                                <span className="text-white/50 text-[10px] font-bold mt-1 block">{heroArticle.date?.split('T')[0]}</span>
                            </div>
                        </Link>
                    ) : (
                        <div className="rounded-3xl bg-white/5 border border-white/10 aspect-[16/9] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                        </div>
                    )}
                </div>

                {/* ── Section : AUTRES NEWS (scroll horizontal) ── */}
                <div className="mb-6">
                    <div className="flex items-center justify-between px-4 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 bg-white/40 rounded-full" />
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">
                                Autres News
                            </span>
                        </div>
                        <Link to="/news" className="text-[9px] font-black text-neon-red uppercase tracking-widest flex items-center gap-1">
                            Voir tout <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 snap-x snap-mandatory">
                        {otherNews.length > 0 ? otherNews.map((item: any) => (
                            <Link
                                key={item.id}
                                to={getArticleLink(item)}
                                onMouseEnter={() => handlePrefetch(item.id)}
                                className="relative flex-shrink-0 w-[55vw] snap-center rounded-2xl overflow-hidden aspect-[3/4] group"
                            >
                                <img
                                    src={resolveImageUrl(item.image || item.cover)}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                                {isAdmin && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(item); }}
                                        disabled={loadingEditId === item.id}
                                        className="absolute top-2 right-2 z-20 p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-neon-cyan/50 text-neon-cyan disabled:opacity-50"
                                    >
                                        {loadingEditId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit2 className="w-3 h-3" />}
                                    </button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border backdrop-blur-md mb-1.5 inline-block ${
                                        (item.category || '').toLowerCase().includes('musique') ? 'bg-neon-green/20 text-neon-green border-neon-green/30' : 
                                        (item.category || '').toLowerCase().includes('recap') ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30' : 
                                        (item.category || '').toLowerCase().includes('interview') ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' : 
                                        'bg-neon-red/20 text-neon-red border-neon-red/30'
                                    }`}>
                                        {item.category}
                                    </span>
                                    <h3
                                        className="text-xs font-display font-black text-white italic uppercase leading-tight line-clamp-3 group-active:text-neon-red transition-colors duration-200"
                                        dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                    />
                                </div>
                            </Link>
                        )) : (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-[55vw] snap-center rounded-2xl bg-white/5 border border-white/10 aspect-[3/4] animate-pulse" />
                            ))
                        )}
                    </div>
                </div>

                {/* ── Section : AGENDA ── */}
                <div className="px-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neon-green" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-[0.3em]">
                                Agenda
                            </span>
                        </div>
                        <Link to="/agenda" className="text-[9px] font-black text-neon-green uppercase tracking-widest flex items-center gap-1">
                            Voir tout <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {agendaData.length > 0 ? agendaData.map((event: any) => (
                            <Link key={event.id} to="/agenda" className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 active:bg-white/10 transition-colors">
                                {event.image ? (
                                    <img src={resolveImageUrl(event.image)} alt={event.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5 text-neon-green" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-black uppercase truncate">{event.name || event.title}</p>
                                    <p className="text-gray-500 text-[10px] font-bold">{event.startDate?.split('T')[0]} {event.location ? `• ${event.location}` : ''}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                            </Link>
                        )) : (
                            <Link to="/agenda" className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-neon-green/5 border border-neon-green/15 active:bg-neon-green/10 transition-colors">
                                <Calendar className="w-5 h-5 text-neon-green" />
                                <span className="text-neon-green text-sm font-black uppercase tracking-wider">Voir l'agenda complet</span>
                                <ArrowRight className="w-4 h-4 text-neon-green" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── Section : RECAPS ── */}
                <div className="px-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Film className="w-4 h-4 text-neon-purple" />
                            <span className="text-[10px] font-black text-neon-purple uppercase tracking-[0.3em]">
                                Recaps
                            </span>
                        </div>
                        <Link to="/recaps" className="text-[9px] font-black text-neon-purple uppercase tracking-widest flex items-center gap-1">
                            Voir tout <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex overflow-x-auto no-scrollbar gap-3 snap-x snap-mandatory">
                        {recapsData.length > 0 ? recapsData.map((recap: any) => (
                            <Link
                                key={recap.id}
                                to={`/recaps/${recap.id}`}
                                className="relative flex-shrink-0 w-[55vw] snap-center rounded-2xl overflow-hidden aspect-video group"
                            >
                                <img
                                    src={resolveImageUrl(recap.image || recap.cover)}
                                    alt={recap.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-xs font-black uppercase line-clamp-2 italic">{recap.title}</p>
                                </div>
                            </Link>
                        )) : (
                            <Link to="/recaps" className="flex-shrink-0 w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 active:bg-purple-500/10 transition-colors">
                                <Film className="w-5 h-5 text-neon-purple" />
                                <span className="text-neon-purple text-sm font-black uppercase tracking-wider">Voir les récaps</span>
                                <ArrowRight className="w-4 h-4 text-neon-purple" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                DESKTOP LAYOUT (hidden on mobile) — INCHANGÉ
            ══════════════════════════════════════════ */}
            <div className="hidden md:block w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 pt-24 pb-12 sm:pt-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center sm:text-left"
                >
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                        <div className="p-2 bg-neon-red/10 rounded-xl border border-neon-red/20 shadow-[0_0_15px_rgba(255,0,51,0.1)]">
                            <svg className="w-5 h-5 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">{t('news.badge')}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
                        {t('news.title')}<span className="text-neon-red">{t('news.title_span')}</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-base md:text-lg font-medium leading-relaxed">
                        {t('news.subtitle')}
                    </p>
                </motion.div>

                {/* ── Category Tabs ── */}
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
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <motion.button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key)}
                                    data-cursor-color={tab.key === 'musique' ? 'neon-green' : tab.key === 'focus' ? 'neon-yellow' : 'neon-red'}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    className={`relative px-7 py-3 rounded-2xl font-black uppercase tracking-[0.1em] text-[10px] transition-all duration-300 border flex-shrink-0
                                    ${isActive
                                            ? `${tab.activeClass} border-transparent`
                                            : `bg-white/[0.03] ${tab.inactiveClass}`
                                        }`}
                                >
                                    {tab.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                <div className="relative">
                    {/* Left Arrow */}
                    <AnimatePresence>
                        {currentPage > 1 && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="absolute -left-16 top-1/2 -translate-y-1/2 p-4 text-white/30 hover:text-neon-red transition-colors duration-300 hidden xl:block z-20"
                            >
                                <ChevronLeft className="w-16 h-16" strokeWidth={1} />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div className="min-h-[600px] w-full">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={`${activeTab}-${currentPage}`}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="flex overflow-x-auto pb-8 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 no-scrollbar snap-x snap-mandatory"
                            >
                                {currentArticles.length > 0 ? (
                                    currentArticles.map((item: any) => (
                                        <motion.article
                                            key={item.id}
                                            onMouseEnter={playHoverSound}
                                            className="group relative rounded-[2rem] overflow-hidden transition-all duration-500 w-[85vw] flex-shrink-0 snap-center aspect-square md:aspect-auto md:w-auto md:flex-shrink-1 md:bg-dark-card md:border md:border-white/5 md:rounded-3xl hover:border-neon-red/50 hover:shadow-[0_0_40px_rgba(255,0,51,0.2)] md:flex md:flex-col"
                                        >
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleEdit(item);
                                                    }}
                                                    disabled={loadingEditId === item.id}
                                                    className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all disabled:opacity-50 disabled:cursor-wait"
                                                    title="Modifier"
                                                >
                                                    {loadingEditId === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Edit2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                            <Link
                                                to={getArticleLink(item)}
                                                className="absolute inset-0 md:static block w-full h-full"
                                                onMouseEnter={() => handlePrefetch(item.id)}
                                            >
                                                {/* Desktop Variant */}
                                                <div className="hidden md:flex flex-col h-full overflow-hidden">
                                                    <div className="h-64 overflow-hidden bg-black/40 relative">
                                                        <img
                                                            src={resolveImageUrl(item.image || item.cover)}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="p-6 flex flex-col flex-1 relative z-10">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm ${item.isFocus
                                                                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                                : `bg-${getCategoryColor(item.category)}/10 text-${getCategoryColor(item.category)} border-${getCategoryColor(item.category)}/20`
                                                                }`}>
                                                                {item.isFocus ? t('article_detail.focus').toUpperCase() : item.category}
                                                            </span>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">{item.date}</span>
                                                            </div>
                                                        </div>
                                                        <h2
                                                            className="text-xl font-display font-black text-white mb-4 group-hover:text-neon-red transition-colors line-clamp-2 uppercase italic leading-tight tracking-tight h-12"
                                                            dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                        />
                                                        <p
                                                            className="text-gray-400 text-sm line-clamp-3 font-medium leading-relaxed"
                                                            dangerouslySetInnerHTML={{ __html: standardizeContent(translatedSummaries[item.id] || item.summary) }}
                                                        />
                                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                                                            <span className="text-[9px] text-neon-cyan font-black uppercase tracking-[0.2em]">{item.author || 'Alex'}</span>
                                                            <span className="text-white/20 group-hover:text-neon-red transition-colors"><ArrowRight className="w-4 h-4" /></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.article>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md gap-4">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="w-12 h-12 text-neon-red animate-spin mb-4" />
                                                <p className="text-white/60 font-medium">Chargement des actualités...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <span className={`text-4xl`}>
                                                    {activeTab === 'focus' ? '⭐' : activeTab === 'musique' ? '🎵' : '📰'}
                                                </span>
                                                <p className="text-gray-400 font-display uppercase tracking-widest text-lg">
                                                    {activeTab === 'all' ? t('news.no_news') : `Aucun article dans cette catégorie`}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right Arrow */}
                    <AnimatePresence>
                        {currentPage < totalPages && (
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="absolute -right-16 top-1/2 -translate-y-1/2 p-4 text-white/30 hover:text-neon-red transition-colors duration-300 hidden xl:block z-20"
                            >
                                <ChevronRight className="w-16 h-16" strokeWidth={1} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            <AdminEditBar
                pageName="News & Articles"
                pageActions={[
                    { label: 'Publier un article', icon: <Plus className="w-3.5 h-3.5" />, to: '/news/create', permission: 'news' },
                    { label: 'Gérer les news', icon: <FileText className="w-3.5 h-3.5" />, to: '/admin/manage?tab=News', permission: 'news' },
                ]}
            />
        </>
    );
}
