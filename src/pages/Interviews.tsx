import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ChevronLeft, ChevronRight, Edit2, Loader2, Filter, Calendar } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getArticleLink } from '../utils/slugify';
import { Pagination } from '../components/ui/Pagination';
import { translateText } from '../utils/translate';
import { standardizeContent } from '../utils/standardizer';
import { SEO } from '../components/utils/SEO';
import { resolveImageUrl } from '../utils/image';
import { fetchWithFallback } from '../utils/fetcher';

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
    const [newsData, setNewsData] = useState<any[]>([]); // Initialized to empty, fetcher will provide fallback if needed
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);

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
    }, []);

    const handleEdit = async (item: any) => {
        setLoadingEditId(item.id);
        try {
            const res = await fetch(`/api/news/content?id=${item.id}`, { headers: getAuthHeaders() });
            const fullItem = { ...item };
            if (res.ok) {
                const data = await res.json();
                fullItem.content = data.content || '';
            }
            navigate(`/news/create?type=Interview&id=${item.id}`, { state: { isEditing: true, item: fullItem } });
        } catch (e: any) {
            console.error('Error fetching content:', e);
            navigate(`/news/create?type=Interview&id=${item.id}`, { state: { isEditing: true, item: item } });
        } finally {
            setLoadingEditId(null);
        }
    };

    const articlesPerPage = 8;

    const allInterviews = useMemo(() => {
        const dataArray = Array.isArray(newsData) ? newsData : (newsData && typeof newsData === 'object' && (newsData as any).news ? (newsData as any).news : []);
        const base = (dataArray as any[])
            .filter((item: any) => {
                if (!item) return false;
                const cat = (item.category || '').toLowerCase();
                const title = (item.title || '').toLowerCase();
                // Inclure tout ce qui ressemble à une interview ou qui appartient aux sous-catégories
                return cat.includes('interview') || 
                       cat.includes('fast quizz') || title.includes('fast quizz') ||
                       cat.includes('playlist') || title.includes('playlist') ||
                       cat.includes('drop & talk') || title.includes('drop-talk') || title.includes('drop & talk') || cat.includes('drop-talk');
            });

        if (activeTab === 'all') return base.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

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
        }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }, [activeTab, newsData]);

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
        <>
            <SEO
                title="Interviews Artistes"
                description="Découvrez nos interviews exclusives avec les plus grands DJs et organisateurs de festivals EDM, Techno et House."
            />
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
                                    data-cursor-color={
                                        tab.key === 'written' ? 'neon-purple' :
                                            tab.key === 'video' ? 'neon-blue' :
                                                tab.key === 'fast-quizz' ? 'neon-cyan' :
                                                    tab.key === 'playlist' ? 'neon-pink' :
                                                        tab.key === 'drop-talk' ? 'neon-yellow' : 'neon-red'
                                    }
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
                                className="flex overflow-x-auto pb-8 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 no-scrollbar snap-x snap-mandatory"
                            >
                                {currentArticles.length > 0 ? (
                                    currentArticles.map((item: any) => (
                                        <motion.article
                                            key={item.id}
                                            onMouseEnter={playHoverSound}
                                            className="group relative rounded-[2rem] overflow-hidden transition-all duration-500 w-[85vw] flex-shrink-0 snap-center aspect-square md:aspect-auto md:w-auto md:flex-shrink-1 md:bg-dark-card md:border md:border-white/5 md:rounded-3xl hover:border-neon-purple/50 hover:shadow-[0_0_40px_rgba(189,0,255,0.2)] md:flex md:flex-col"
                                        >
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(item); }}
                                                    disabled={loadingEditId === item.id}
                                                    className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all disabled:opacity-50 disabled:cursor-wait"
                                                    title="Modifier"
                                                >
                                                    {loadingEditId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                            <Link to={getArticleLink(item)} className="absolute inset-0 md:static block w-full h-full">
                                                {/* Mobile: full-cover card */}
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
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border backdrop-blur-md ${getThemeDetails(item).color} bg-black/40`}>
                                                                {getThemeDetails(item).label}
                                                            </span>
                                                            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">{item.date}</span>
                                                        </div>
                                                        <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic uppercase leading-tight tracking-tight line-clamp-4 drop-shadow-lg"
                                                            dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Desktop: standard card */}
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
                                                    </div>
                                                    <div className="p-6 flex flex-col flex-1 relative z-10">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className={`text-[9px] font-black tracking-widest border px-2 py-1 rounded-full uppercase ${getThemeDetails(item).color}`}>
                                                                {getThemeDetails(item).label}
                                                            </span>
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{item.date}</span>
                                                        </div>
                                                        <h2 className="text-xl font-display font-black text-white mb-3 group-hover:text-neon-purple transition-colors line-clamp-2 uppercase italic leading-tight h-12"
                                                            dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                        />
                                                        <p className="text-gray-400 text-sm line-clamp-3"
                                                            dangerouslySetInnerHTML={{ __html: standardizeContent(translatedSummaries[item.id] || item.summary) }}
                                                        />
                                                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                                                            <span className="text-[9px] text-neon-cyan font-black uppercase tracking-[0.2em]">{item.author || 'Alex'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.article>
                                    ))
                                ) : (
                                    <div className="col-span-full py-32 flex flex-col items-center justify-center border border-white/5 rounded-[40px] bg-white/[0.02] backdrop-blur-3xl">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="w-12 h-12 text-neon-red animate-spin mb-4" />
                                                <p className="text-white/60 font-medium">Chargement des interviews...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 rounded-full bg-neon-red/10 flex items-center justify-center mb-6">
                                                    <Calendar className="w-10 h-10 text-neon-red opacity-50" />
                                                </div>
                                                <h3 className="text-2xl font-display font-black text-white uppercase italic mb-2">{t('interviews.no_interviews')}</h3>
                                                <p className="text-gray-500 font-medium">{t('interviews.no_interviews_subtitle')}</p>
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
            </div>
        </>
    );
}
