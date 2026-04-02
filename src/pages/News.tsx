import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit2, Loader2, Filter, ArrowRight } from 'lucide-react';
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
import { Plus, FileText } from 'lucide-react';

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
    const [newsData, setNewsData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [tabs, setTabs] = useState(DEFAULT_TABS);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
        
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    setNewsData(await res.json());
                }
            } catch (e) {
                console.error('Error fetching news:', e);
            }
        };
        fetchNews();

        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.news_tabs) {
                        setTabs(prev => prev.map(tab => ({
                            ...tab,
                            label: data.news_tabs[tab.key] || tab.label
                        })));
                    }
                }
            } catch (e) {
                console.error('Error fetching settings:', e);
            }
        };
        fetchSettings();
    }, []);
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
            // Fetch content in background to populate browser cache
            fetch(`/api/news/content?id=${id}`);
        } catch (e) {
            // Ignore prefetch errors
        }
    };

    const articlesPerPage = 8;

    const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
    const [translatedSummaries, setTranslatedSummaries] = useState<Record<number, string>>({});

    // All news/musique/focus articles (base pool)
    const baseNews = useMemo(() => {
        // Safe check for newsData being an array
        if (!Array.isArray(newsData)) return [];

        return newsData
            .filter((item: any) => {
                if (!item) return false;
                // Removed the restrictive 'today' filter to ensure all published news are visible
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

    // Filter based on current tab
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

    // Reset page when tab changes
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

    return (
        <>
            <SEO
                title="Actualités Festivals"
                description="Toute l'actualité des festivals EDM, Techno et House. News, sorties et exclusivités."
            />
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 pt-24 pb-12 sm:pt-12">
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
                                                {/* Mobile Variant */}
                                                <div className="absolute inset-0 md:hidden">
                                                        <img
                                                            src={resolveImageUrl(item.image || item.cover)}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                                            }}
                                                        />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                                                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-left z-10">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border backdrop-blur-md ${item.isFocus
                                                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                                                : (item.category || '').toLowerCase() === 'musique'
                                                                    ? 'bg-neon-green/20 text-neon-green border-neon-green/30'
                                                                    : 'bg-neon-red/20 text-neon-red border-neon-red/30'
                                                                }`}>
                                                                {item.isFocus ? t('article_detail.focus').toUpperCase() : item.category}
                                                            </span>
                                                            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">{item.date}</span>
                                                        </div>
                                                        <h2
                                                            className="text-2xl sm:text-3xl font-display font-black text-white italic uppercase leading-tight tracking-tight line-clamp-4 shadow-black drop-shadow-lg"
                                                            dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                        />
                                                    </div>
                                                </div>

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
                                                                : (item.category || '').toLowerCase() === 'musique'
                                                                    ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                                                                    : 'bg-neon-red/10 text-neon-red border-neon-red/20'
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
                                        <span className={`text-4xl`}>
                                            {activeTab === 'focus' ? '⭐' : activeTab === 'musique' ? '🎵' : '📰'}
                                        </span>
                                        <p className="text-gray-400 font-display uppercase tracking-widest text-lg">
                                            {activeTab === 'all' ? t('news.no_news') : `Aucun article dans cette catégorie`}
                                        </p>
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
