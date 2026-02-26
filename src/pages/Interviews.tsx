import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ChevronLeft, ChevronRight, Edit2, Loader2, Filter, Calendar } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import newsData from '../data/news.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { getArticleLink } from '../utils/slugify';
import { Pagination } from '../components/ui/Pagination';
import { translateText } from '../utils/translate';
import { standardizeContent } from '../utils/standardizer';

type TabKey = 'all' | 'written' | 'video' | 'fast-quizz' | 'playlist' | 'drop-talk';

const TABS: { key: TabKey; label: string; activeClass: string; inactiveClass: string }[] = [
    { key: 'all', label: 'Toutes', activeClass: 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]', inactiveClass: 'text-white/40 border-white/10 hover:border-white/30 hover:text-white' },
    { key: 'written', label: 'Écrites', activeClass: 'bg-neon-purple text-white shadow-[0_0_20px_rgba(189,0,255,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-purple/40 hover:text-neon-purple' },
    { key: 'video', label: 'Interviews', activeClass: 'bg-neon-blue text-white shadow-[0_0_20px_rgba(0,100,255,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-blue/40 hover:text-neon-blue' },
    { key: 'fast-quizz', label: 'Fast Quizz', activeClass: 'bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-cyan/40 hover:text-neon-cyan' },
    { key: 'playlist', label: 'La Playlist', activeClass: 'bg-neon-pink text-white shadow-[0_0_20px_rgba(255,0,153,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-pink/40 hover:text-neon-pink' },
    { key: 'drop-talk', label: 'Drop & Talk', activeClass: 'bg-neon-yellow text-black shadow-[0_0_20px_rgba(255,204,0,0.4)]', inactiveClass: 'text-white/40 border-white/10 hover:border-neon-yellow/40 hover:text-neon-yellow' },
];

export function Interviews() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
    }, []);

    const handleEdit = async (item: any) => {
        setLoadingEditId(item.id);
        try {
            const res = await fetch(`/api/news/content?id=${item.id}`, { headers: getAuthHeaders() });
            let fullItem = { ...item };
            if (res.ok) {
                const data = await res.json();
                fullItem.content = data.content || '';
            }
            navigate(`/news/create?type=Interview&id=${item.id}`, { state: { isEditing: true, item: fullItem } });
        } catch (e) {
            console.error('Error fetching content:', e);
            navigate(`/news/create?type=Interview&id=${item.id}`, { state: { isEditing: true, item: item } });
        } finally {
            setLoadingEditId(null);
        }
    };

    const articlesPerPage = 8;

    const allInterviews = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const base = (newsData as any[])
            .filter((item: any) => {
                if ((item.date || '').substring(0, 10) > today) return false;
                const cat = (item.category || '').toLowerCase();
                return cat.includes('interview');
            });

        if (activeTab === 'all') return base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return base.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            const title = (item.title || '').toLowerCase();

            switch (activeTab) {
                case 'written':
                    return cat === 'interview' || cat === 'interviews';
                case 'video':
                    return cat.includes('interview video');
                case 'fast-quizz':
                    return cat.includes('fast quizz') || title.includes('fast quizz');
                case 'playlist':
                    return cat.includes('la playlist') || cat.includes('playlist') || title.includes('la playlist');
                case 'drop-talk':
                    return cat.includes('drop & talk') || title.includes('drop & talk');
                default:
                    return true;
            }
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activeTab]);

    const totalPages = Math.ceil(allInterviews.length / articlesPerPage);

    const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
    const [translatedSummaries, setTranslatedSummaries] = useState<Record<number, string>>({});

    useEffect(() => {
        const startIndex = (currentPage - 1) * articlesPerPage;
        const currentArticles = allInterviews.slice(startIndex, startIndex + articlesPerPage);

        if (language === 'en') {
            Promise.all(
                currentArticles.map((item: any) =>
                    translateText(item.title, 'en').then(translated => ({ id: item.id, title: translated }))
                )
            ).then(results => {
                const titleMap: Record<number, string> = {}; // Reset map for current page
                results.forEach((res: any) => {
                    titleMap[res.id] = res.title;
                });
                setTranslatedTitles(prev => ({ ...prev, ...titleMap })); // Merge with previous translations
            });

            Promise.all(
                currentArticles.map((item: any) =>
                    translateText(item.summary, 'en').then(translated => ({ id: item.id, summary: translated }))
                )
            ).then(results => {
                const summaryMap: Record<number, string> = {}; // Reset map for current page
                results.forEach((res: any) => {
                    summaryMap[res.id] = res.summary;
                });
                setTranslatedSummaries(prev => ({ ...prev, ...summaryMap })); // Merge with previous translations
            });
        } else {
            // Clear translations if language is not English
            setTranslatedTitles({});
            setTranslatedSummaries({});
        }
    }, [language, currentPage, allInterviews, articlesPerPage]);

    const indexOfLastArticle = currentPage * articlesPerPage;
    const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
    const currentArticles = allInterviews.slice(indexOfFirstArticle, indexOfLastArticle);

    const playHoverSound = useHoverSound();

    const paginate = (pageNumber: number) => {
        setDirection(pageNumber > currentPage ? 1 : -1);
        setCurrentPage(pageNumber);
    };

    const handleTabChange = (key: TabKey) => {
        setDirection(0);
        setActiveTab(key);
        setCurrentPage(1);
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

    const getThemeDetails = (item: any) => {
        const cat = (item.category || '').toLowerCase();
        const title = (item.title || '').toLowerCase();

        if (cat.includes('fast quizz') || title.includes('fast quizz')) {
            return { label: 'Fast Quizz', color: 'text-neon-cyan border-neon-cyan/30' };
        }
        if (cat.includes('la playlist') || cat.includes('playlist') || title.includes('la playlist')) {
            return { label: 'La Playlist', color: 'text-neon-pink border-neon-pink/30' };
        }
        if (cat.includes('drop & talk') || title.includes('drop & talk')) {
            return { label: 'Drop & Talk', color: 'text-neon-yellow border-neon-yellow/30' };
        }
        if (cat.includes('interview video')) {
            return { label: 'Interview', color: 'text-neon-blue border-neon-blue/30' };
        }
        return { label: 'Écrite', color: 'text-neon-purple border-neon-purple/30' };
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/10 rounded-lg">
                        <Mail className="w-6 h-6 text-neon-red" />
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('nav.interviews')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase italic tracking-tighter">
                    {t('interviews.title')}<span className="text-neon-red">{t('interviews.title_span')}</span>
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
                                className={`relative px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all duration-300 border ${isActive
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

            {/* Grid Section */}
            <div className="relative">
                {/* Left Arrow */}
                <AnimatePresence>
                    {currentPage > 1 && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={() => paginate(currentPage - 1)}
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
                                        className="group bg-dark-bg border border-white/10 rounded-2xl overflow-hidden hover:border-neon-red/50 hover:shadow-[0_0_30px_rgba(255,17,17,0.3)] transition-all duration-300 relative flex flex-col"
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
                                        <Link to={getArticleLink(item)} className="flex-1 flex flex-col">
                                            <div className="h-64 overflow-hidden bg-black/40 flex items-center justify-center">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            </div>

                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className={`text-[10px] font-black tracking-widest border px-3 py-1 rounded-full uppercase ${getThemeDetails(item).color}`}>
                                                        {getThemeDetails(item).label}
                                                    </span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.date}</span>
                                                        <span className="text-[9px] text-neon-cyan font-black uppercase tracking-[0.2em] mt-0.5">{item.author || 'Alex'}</span>
                                                    </div>
                                                </div>

                                                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-neon-red transition-colors line-clamp-3"
                                                    dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                />

                                                {(() => {
                                                    const rawSummary = translatedSummaries[item.id] || item.summary || '';
                                                    const cleanSummary = rawSummary.replace(/SUIVEZ\s+[^.]*?(website|instagram|tiktok|youtube|facebook|spotify|soundcloud|beatport|x\b)[^.]*/gi, '').trim();
                                                    const displaySummary = cleanSummary && !cleanSummary.startsWith("TITRE DE L'ARTICLE") ? cleanSummary : '';
                                                    return displaySummary ? (
                                                        <p className="text-gray-400 text-sm line-clamp-3"
                                                            dangerouslySetInnerHTML={{ __html: standardizeContent(displaySummary) }}
                                                        />
                                                    ) : null;
                                                })()}
                                            </div>
                                        </Link>
                                    </motion.article>
                                ))
                            ) : (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center border border-white/5 rounded-[40px] bg-white/[0.02] backdrop-blur-3xl">
                                    <div className="w-20 h-20 rounded-full bg-neon-red/10 flex items-center justify-center mb-6">
                                        <Calendar className="w-10 h-10 text-neon-red opacity-50" />
                                    </div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase italic mb-2">{t('interviews.no_interviews')}</h3>
                                    <p className="text-gray-500 font-medium">{t('interviews.no_interviews_subtitle')}</p>
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
                            onClick={() => paginate(currentPage + 1)}
                            className="absolute -right-16 top-1/2 -translate-y-1/2 p-4 text-white/30 hover:text-neon-red transition-colors duration-300 hidden xl:block z-20"
                        >
                            <ChevronRight className="w-16 h-16" strokeWidth={1} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={paginate}
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
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tight mb-4" dangerouslySetInnerHTML={{ __html: t('recap.newsletter_title') }} />
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
