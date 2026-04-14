import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit2, Loader2, Filter, Video, ArrowRight, Calendar } from 'lucide-react';
import recapsData from '../data/recaps.json';
import galerieData from '../data/galerie.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getRecapLink, getGalleryLink } from '../utils/slugify';
import { standardizeContent } from '../utils/standardizer';
import { FlagIcon } from '../components/ui/FlagIcon';
import { Pagination } from '../components/ui/Pagination';
import { translateText } from '../utils/translate';
import { getAuthHeaders } from '../utils/auth';
import { resolveImageUrl } from '../utils/image';

type TabKey = 'all' | 'reportage';

const TABS: { key: TabKey; label: string; activeClass: string; inactiveClass: string }[] = [
    { key: 'all', label: 'Toutes', activeClass: 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]', inactiveClass: 'text-white/40 border-white/10 hover:border-white/30 hover:text-white' },
];


export function Recap() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
    }, []);
    const [mainMode, setMainMode] = useState<'WRITTEN' | 'PHOTOS'>('WRITTEN');
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);

    const handleEdit = async (item: any) => {
        setLoadingEditId(item.id);
        try {
            const res = await fetch(`/api/recaps/content?id=${item.id}`, { headers: getAuthHeaders() });
            const fullItem = { ...item };
            if (res.ok) {
                const data = await res.json();
                fullItem.content = data.content || '';
            }
            navigate(`/recaps/create?id=${item.id}`, { state: { isEditing: true, item: fullItem } });
        } catch (e: any) {
            console.error('Error fetching content:', e);
            navigate(`/recaps/create?id=${item.id}`, { state: { isEditing: true, item: item } });
        } finally {
            setLoadingEditId(null);
        }
    };
    const articlesPerPage = 8; // 2 rows of 4 items per page

    const recapsByYear = useMemo(() => {
        let filtered: any[] = [];
        
        if (mainMode === 'WRITTEN') {
            const base = (recapsData as any[])
                .filter(item => item) // Suppression du filtre 'today' pour tout afficher
                .map(item => {
                    let title = item.title || "";
                    if (!title.toLowerCase().startsWith('récap') && !title.toLowerCase().startsWith('recap')) {
                        title = `Récap : ${title}`;
                    }
                    return { ...item, title: title.toUpperCase() };
                })
                .sort((a, b) => {
                    const yearA = Number(a.year) || new Date(a.date).getFullYear();
                    const yearB = Number(b.year) || new Date(b.date).getFullYear();
                    if (yearB !== yearA) return yearB - yearA;
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
                });
            filtered = activeTab === 'all' ? base : base.filter(item => item.type === activeTab);
        } else {
            // Photos (Official only)
            const base = (galerieData as any[])
                .filter(item => !item.isCommunity && !(item.category || '').toLowerCase().includes('communauté'))
                .map(item => {
                    let title = item.title || "";
                    if (!title.toLowerCase().startsWith('récap') && !title.toLowerCase().startsWith('recap')) {
                        title = `Récap : ${title}`;
                    }
                    return { ...item, title: title.toUpperCase() };
                })
                .sort((a, b) => {
                    const yearA = Number(a.year) || new Date(a.date).getFullYear();
                    const yearB = Number(b.year) || new Date(b.date).getFullYear();
                    if (yearB !== yearA) return yearB - yearA;
                    // Sort by date inside year? galerie dates are often just "2024" or full ISO.
                    // If it's just a year string, sorting might be less precise.
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                });
            filtered = base;
        }

        // Group by year
        const groups: Record<number, any[]> = {};
        filtered.forEach(item => {
            const y = Number(item.year) || new Date(item.date).getFullYear();
            if (!groups[y]) groups[y] = [];
            groups[y].push(item);
        });

        // Convert to sorted array of objects [{year: 2024, items: [...]}, ...]
        return Object.keys(groups)
            .map(y => Number(y))
            .sort((a, b) => b - a)
            .map(y => ({
                year: y,
                items: groups[y]
            }));
    }, [activeTab, mainMode]);

    const totalArticles = useMemo(() => recapsByYear.reduce((acc, group) => acc + group.items.length, 0), [recapsByYear]);
    const totalPages = Math.ceil(totalArticles / articlesPerPage);

    // Flat list for pagination logic
    const flatRecaps = useMemo(() => recapsByYear.flatMap(group => group.items), [recapsByYear]);

    const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
    const [translatedSummaries, setTranslatedSummaries] = useState<Record<number, string>>({});

    useEffect(() => {
        if (language === 'en') {
            const startIndex = (currentPage - 1) * articlesPerPage;
            const currentArticles = flatRecaps.slice(startIndex, startIndex + articlesPerPage);

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
    }, [language, currentPage, flatRecaps]);

    const startIndex = (currentPage - 1) * articlesPerPage;
    const currentArticles = flatRecaps.slice(startIndex, startIndex + articlesPerPage);

    // Re-group currentArticles by year for display
    const displayedGroups = useMemo(() => {
        const groups: Record<number, any[]> = {};
        currentArticles.forEach(item => {
            const y = Number(item.year) || new Date(item.date).getFullYear();
            if (!groups[y]) groups[y] = [];
            groups[y].push(item);
        });
        return Object.keys(groups)
            .map(y => Number(y))
            .sort((a, b) => b - a)
            .map(y => ({
                year: y,
                items: groups[y]
            }));
    }, [currentArticles]);

    const playHoverSound = useHoverSound();

    const handlePageChange = (newPage: number) => {
        setDirection(newPage > currentPage ? 1 : -1);
        setCurrentPage(newPage);
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

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/10 rounded-lg">
                        <Video className="w-6 h-6 text-neon-red" />
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('nav.recaps')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase italic tracking-tighter">
                    {t('recaps.title')}<span className="text-neon-red">{t('recaps.title_span')}</span>
                </h1>
                <p className="text-gray-400 max-w-2xl text-lg">
                    {t('news.subtitle')}
                </p>
            </motion.div>
            {/* ── Main Category Switcher ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit mb-8"
            >
                <button
                    onClick={() => { setMainMode('WRITTEN'); setCurrentPage(1); }}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mainMode === 'WRITTEN' ? 'bg-white text-black shadow-lg font-black' : 'text-gray-500 hover:text-white font-bold'}`}
                >
                    Nos Récaps Écrits
                </button>
                <button
                    onClick={() => { setMainMode('PHOTOS'); setCurrentPage(1); }}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${mainMode === 'PHOTOS' ? 'bg-white text-black shadow-lg font-black' : 'text-gray-500 hover:text-white font-bold'}`}
                >
                    Nos Récaps Photos
                </button>
            </motion.div>

            {/* ── Category Tabs ── */}
            <AnimatePresence>
                {mainMode === 'WRITTEN' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-10 overflow-hidden"
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
                                        data-cursor-color="neon-red"
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        className={`relative px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] transition-all duration-300 border
                                            ${isActive
                                                ? `bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] border-transparent`
                                                : `bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white`
                                            }`}
                                    >
                                        {tab.label}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            key={currentPage}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="space-y-16 w-full"
                        >
                            {displayedGroups.length > 0 ? (
                                displayedGroups.map((group) => (
                                    <div key={group.year} className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-3xl font-display font-black text-white italic tracking-tighter shrink-0">{group.year}</h2>
                                            <div className="h-px bg-white/10 flex-1" />
                                        </div>
                                        <div className="flex overflow-x-auto pb-8 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 no-scrollbar snap-x snap-mandatory">
                                            {group.items.map((item: any) => (
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
                                                                if (mainMode === 'WRITTEN') handleEdit(item);
                                                                else navigate(`/galerie/create?id=${item.id}`, { state: { isEditing: true, item } });
                                                            }}
                                                            disabled={loadingEditId === item.id}
                                                            className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all disabled:opacity-50 disabled:cursor-wait"
                                                            title="Modifier"
                                                        >
                                                            {loadingEditId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    {mainMode === 'WRITTEN' ? (
                                                        <Link to={getRecapLink(item)} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="absolute inset-0 md:static block w-full h-full">
                                                            {/* Mobile: full-cover card */}
                                                            <div className="absolute inset-0 md:hidden">
                                                                <img src={resolveImageUrl(item.coverImage || item.image)} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                                                                <div className="absolute inset-0 p-6 flex flex-col justify-end text-left z-10">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        {item.festival && <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-neon-red/80 text-white backdrop-blur-md">{item.festival}</span>}
                                                                        {item.location && <span className="text-[10px] font-bold px-2 py-1 rounded-xl bg-white/10 text-white border border-white/20">{item.location}</span>}
                                                                    </div>
                                                                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic uppercase leading-tight tracking-tight line-clamp-4 drop-shadow-lg"
                                                                        dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {/* Desktop: standard card */}
                                                            <div className="hidden md:flex flex-col h-full overflow-hidden">
                                                                <div className="h-64 overflow-hidden bg-black/40 flex items-center justify-center relative">
                                                                    <img src={resolveImageUrl(item.coverImage || item.image)} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent" />
                                                                    {item.festival && <div className="absolute top-4 left-4 px-3 py-1 bg-neon-red/90 backdrop-blur-sm rounded-full"><span className="text-[10px] font-black tracking-widest text-white uppercase">{item.festival}</span></div>}
                                                                    {item.location && <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center gap-2"><span className="text-[10px] font-bold tracking-wider text-white uppercase">{item.location}</span><FlagIcon location={item.location} className="w-3.5 h-2.5" /></div>}
                                                                </div>
                                                                <div className="p-6 flex flex-col flex-1">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-[10px] font-black tracking-widest text-neon-red border border-neon-red/30 px-3 py-1 rounded-full uppercase">{t('home.recap_badge')}</span>
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
                                                                            <span className="text-[9px] text-neon-cyan font-black uppercase tracking-[0.2em] mt-0.5">{item.author || 'Alex'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <h2 className="text-xl font-bold text-white mb-3 group-hover:text-neon-red transition-colors line-clamp-2"
                                                                        dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitles[item.id] || item.title) }}
                                                                    />
                                                                    <p className="text-gray-400 text-sm line-clamp-3"
                                                                        dangerouslySetInnerHTML={{ __html: standardizeContent(translatedSummaries[item.id] || item.summary) }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <Link to={getGalleryLink(item)} className="block h-full group">
                                                            <div className="relative aspect-square overflow-hidden bg-white/5">
                                                                <img
                                                                    src={resolveImageUrl(item.cover)}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                                                
                                                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <span className="px-2 py-0.5 bg-neon-red text-white text-[9px] font-black uppercase tracking-wider rounded">
                                                                            {item.category}
                                                                        </span>
                                                                        <span className="text-[8px] font-black text-white/60 tracking-widest uppercase">
                                                                            {item.images.length}+ PHOTOS
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-lg font-display font-black text-white italic leading-tight uppercase tracking-tighter group-hover:text-neon-red transition-colors">
                                                                        {item.title}
                                                                    </h3>
                                                                    <div className="mt-4 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2 text-white/60">
                                                                            <Calendar className="w-3 h-3" />
                                                                            <span className="text-[9px] font-bold uppercase tracking-widest">{item.date}</span>
                                                                        </div>
                                                                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    )}
                                                </motion.article>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-32 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                                    <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-400 font-display uppercase tracking-widest text-lg mb-2">{t('recaps.no_recaps')}</p>
                                    <p className="text-gray-600 text-sm">{t('recaps.no_recaps_subtitle')}</p>
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
    );
}
