import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ChevronLeft, ChevronRight, Edit2, Loader2, Filter } from 'lucide-react';
import newsData from '../data/news.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getArticleLink } from '../utils/slugify';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { standardizeContent } from '../utils/standardizer';
import { Pagination } from '../components/ui/Pagination';
import { translateText } from '../utils/translate';
import { getAuthHeaders } from '../utils/auth';

type TabKey = 'all' | 'news' | 'musique' | 'focus';

const TABS: { key: TabKey; label: string; activeClass: string; inactiveClass: string }[] = [
    { key: 'all', label: 'Toutes', activeClass: 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]', inactiveClass: 'text-white/40 border-white/10 hover:border-white/30 hover:text-white' },
    { key: 'news', label: 'News', activeClass: 'bg-neon-red text-white shadow-[0_0_20px_rgba(255,17,17,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-red/40 hover:text-neon-red' },
    { key: 'musique', label: 'Musiques', activeClass: 'bg-neon-green text-white shadow-[0_0_20px_rgba(17,255,17,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-green/40 hover:text-neon-green' },
    { key: 'focus', label: 'Focus de la semaine', activeClass: 'bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-yellow-500/40 hover:text-yellow-500' },
];

export function News() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('all');

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
    }, []);
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);

    const handleEdit = async (item: any) => {
        setLoadingEditId(item.id);
        try {
            const res = await fetch(`/api/news/content?id=${item.id}`, { headers: getAuthHeaders() });
            let fullItem = { ...item };
            if (res.ok) {
                const data = await res.json();
                fullItem.content = data.content || '';
            }
            navigate(`/news/create?id=${item.id}`, { state: { isEditing: true, item: fullItem } });
        } catch (e) {
            console.error('Error fetching content:', e);
            navigate(`/news/create?id=${item.id}`, { state: { isEditing: true, item: item } });
        } finally {
            setLoadingEditId(null);
        }
    };
    const articlesPerPage = 8;

    const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
    const [translatedSummaries, setTranslatedSummaries] = useState<Record<number, string>>({});

    // All news/musique/focus articles (base pool)
    const baseNews = useMemo(() => {
        return (newsData as any[]).filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return cat.includes('news') || cat.includes('musique') || cat.includes('music') || item.isFocus;
        });
    }, []);

    // Filter based on current tab
    const filteredNews = useMemo(() => {
        if (activeTab === 'all') return baseNews;
        if (activeTab === 'news') return baseNews.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return (cat.includes('news') || cat === 'actualité' || cat === 'actualite') && !item.isFocus;
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
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/10 rounded-lg">
                        <svg className="w-6 h-6 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('news.badge')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase italic tracking-tighter">
                    ACTUALITÉ <span className="text-neon-red">NEWS</span>
                </h1>
                <p className="text-gray-400 max-w-2xl text-lg">
                    {t('news.subtitle')}
                </p>
            </motion.div>

            {/* ── Category Tabs ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10"
            >
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500 mr-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('galerie.filter_by')}</span>
                    </div>
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <motion.button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className={`relative px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all duration-300 border
                                    ${isActive
                                        ? `${tab.activeClass} border-transparent`
                                        : `bg-white/5 ${tab.inactiveClass}`
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

                <div className="min-h-[600px] w-full overflow-hidden">
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {currentArticles.length > 0 ? (
                                currentArticles.map((item: any) => (
                                    <motion.article
                                        key={item.id}
                                        onMouseEnter={playHoverSound}
                                        className="group bg-dark-bg border border-white/10 rounded-2xl overflow-hidden hover:border-neon-red/50 hover:shadow-[0_0_30px_rgba(255,17,17,0.3)] transition-all duration-300 relative"
                                    >
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleEdit(item);
                                                }}
                                                disabled={loadingEditId === item.id}
                                                className="absolute top-4 right-4 z-20 p-2 bg-black/60 backdrop-blur-md rounded-full border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all disabled:opacity-50 disabled:cursor-wait"
                                                title="Modifier"
                                            >
                                                {loadingEditId === item.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Edit2 className="w-3 h-3" />
                                                )}
                                            </button>
                                        )}
                                        <Link to={getArticleLink(item)}>
                                            <div className="h-64 overflow-hidden bg-black/40 flex items-center justify-center">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>
                                            <div className="p-6">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${item.isFocus
                                                        ? 'text-yellow-400 border-yellow-400/30'
                                                        : (item.category || '').toLowerCase() === 'musique'
                                                            ? 'text-neon-green border-neon-green/30'
                                                            : 'text-neon-red border-neon-red/30'
                                                        }`}>
                                                        {item.isFocus ? t('article_detail.focus').toUpperCase() : item.category}
                                                    </span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.date}</span>
                                                        <span className="text-[9px] text-neon-cyan font-black uppercase tracking-[0.2em] mt-0.5">{item.author || 'Alex'}</span>
                                                    </div>
                                                </div>
                                                <h2
                                                    className="text-xl font-bold text-white mb-3 group-hover:text-neon-red transition-colors"
                                                    dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                />
                                                <p
                                                    className="text-gray-400 text-sm line-clamp-3"
                                                    dangerouslySetInnerHTML={{ __html: standardizeContent(translatedSummaries[item.id] || item.summary) }}
                                                />

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
            {/* Newsletter Section */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-32 border-t border-white/5 pt-20"
            >
                <div className="bg-gradient-to-br from-neon-red/10 via-transparent to-neon-purple/10 border border-white/10 rounded-[40px] p-8 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full" />
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <Mail className="w-8 h-8 text-neon-red" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tight mb-4">
                            S'INSCRIRE À LA <span className="text-neon-red">NEWSLETTER</span>
                        </h2>
                        <p className="text-gray-400 mb-10 text-lg">
                            {t('article_detail.newsletter_subtitle')}
                        </p>
                        <NewsletterForm variant="compact" />
                    </div>
                </div>
            </motion.section>
        </div>
    );
}
