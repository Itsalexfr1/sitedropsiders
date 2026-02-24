import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import recapsData from '../data/recaps.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { getRecapLink } from '../utils/slugify';
import { standardizeContent } from '../utils/standardizer';
import { FlagIcon } from '../components/ui/FlagIcon';
import { Pagination } from '../components/ui/Pagination';
import { translateText } from '../utils/translate';
import { getAuthHeaders } from '../utils/auth';
import { Loader2 } from 'lucide-react';


export function Recap() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
    }, []);
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);

    const handleEdit = async (item: any) => {
        setLoadingEditId(item.id);
        try {
            const res = await fetch(`/api/recaps/content?id=${item.id}`, { headers: getAuthHeaders() });
            let fullItem = { ...item };
            if (res.ok) {
                const data = await res.json();
                fullItem.content = data.content || '';
            }
            navigate(`/recaps/create?id=${item.id}`, { state: { isEditing: true, item: fullItem } });
        } catch (e) {
            console.error('Error fetching content:', e);
            navigate(`/recaps/create?id=${item.id}`, { state: { isEditing: true, item: item } });
        } finally {
            setLoadingEditId(null);
        }
    };
    const articlesPerPage = 9; // 3 rows of 3 items per page

    const recaps = recapsData as any[];
    const totalPages = Math.ceil(recaps.length / articlesPerPage);

    const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});
    const [translatedSummaries, setTranslatedSummaries] = useState<Record<number, string>>({});

    useEffect(() => {
        if (language === 'en') {
            const startIndex = (currentPage - 1) * articlesPerPage;
            const currentArticles = recaps.slice(startIndex, startIndex + articlesPerPage);

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
    }, [language, currentPage, recaps]);

    const startIndex = (currentPage - 1) * articlesPerPage;
    const currentArticles = recaps.slice(startIndex, startIndex + articlesPerPage);

    const playHoverSound = useHoverSound();

    const handlePageChange = (newPage: number) => {
        setDirection(newPage > currentPage ? 1 : -1);
        setCurrentPage(newPage);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/10 rounded-lg">
                        <svg className="w-6 h-6 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('recaps.badge')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 uppercase tracking-tight">
                    {t('recaps.title')} <span className="text-neon-red">{t('recaps.title_span')}</span>
                </h1>
                <p className="text-gray-400 max-w-3xl text-lg leading-relaxed">
                    {t('recaps.subtitle')}
                </p>
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

                <div className="min-h-[600px] overflow-hidden">
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {currentArticles.length > 0 ? (
                                currentArticles.map((item: any) => (
                                    <motion.article
                                        key={item.id}
                                        whileHover={{ scale: 1.02 }}
                                        onMouseEnter={playHoverSound}
                                        className="group bg-dark-bg border border-white/10 rounded-2xl overflow-hidden hover:border-neon-red/50 transition-all duration-300 shadow-2xl hover:shadow-neon-red/20 relative"
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
                                        <Link to={getRecapLink(item)} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                            <div className="h-72 overflow-hidden bg-black/40 relative">
                                                <img
                                                    src={item.coverImage || item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent" />
                                                {item.festival && (
                                                    <div className="absolute top-4 left-4 px-3 py-1 bg-neon-red/90 backdrop-blur-sm rounded-full">
                                                        <span className="text-[10px] font-black tracking-widest text-white uppercase">{item.festival}</span>
                                                    </div>
                                                )}
                                                {item.location && (
                                                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center gap-2">
                                                        <span className="text-[10px] font-bold tracking-wider text-white uppercase">{item.location}</span>
                                                        <FlagIcon location={item.location} className="w-3.5 h-2.5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[10px] font-black tracking-widest text-neon-red border border-neon-red/30 px-3 py-1 rounded-full uppercase">{t('home.recap_badge')}</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                            {new Date(item.date).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span className="text-[9px] text-neon-cyan font-black uppercase tracking-[0.2em] mt-0.5">{item.author || 'Alex'}</span>
                                                    </div>
                                                </div>
                                                <h2
                                                    className="text-xl font-bold text-white mb-3 group-hover:text-neon-red transition-colors line-clamp-2"
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

