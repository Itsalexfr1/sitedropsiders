import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import newsData from '../data/news.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { getArticleLink } from '../utils/slugify';

export function Interviews() {
    const { t, language } = useLanguage();
    const [currentPage, setCurrentPage] = useState(1);
    const articlesPerPage = 8;

    const allInterviews = (newsData as any[])
        .filter((item: any) => item.category === 'Interview' || item.category === 'Interviews')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPages = Math.ceil(allInterviews.length / articlesPerPage);
    const indexOfLastArticle = currentPage * articlesPerPage;
    const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
    const currentArticles = allInterviews.slice(indexOfFirstArticle, indexOfLastArticle);

    const playHoverSound = useHoverSound();

    const paginate = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-16"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/10 rounded-lg">
                        <svg className="w-6 h-6 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('interviews.badge')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    {t('interviews.title')} <span className="text-neon-red">{t('interviews.title_span')}</span>
                </h1>
            </motion.div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 min-h-[600px]">
                <AnimatePresence mode="wait">
                    {currentArticles.length > 0 ? (
                        currentArticles.map((item: any, index: number) => (
                            <motion.article
                                key={`${item.id}-${currentPage}`}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="group bg-dark-bg border border-white/10 rounded-2xl overflow-hidden hover:border-neon-red/50 transition-colors duration-300 shadow-2xl flex flex-col"
                            >
                                <Link to={getArticleLink(item)} className="flex-1 flex flex-col">
                                    <div className="relative aspect-[16/9] overflow-hidden">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-60" />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-neon-red text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(255,0,51,0.5)]">
                                                {t('home.interview_badge')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-neon-red" />
                                                {formatDate(item.date)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-neon-red" />
                                                {item.author}
                                            </div>
                                        </div>

                                        <h2 className="text-xl font-display font-black text-white mb-4 group-hover:text-neon-red transition-colors duration-300 line-clamp-2 uppercase italic tracking-tight leading-tight">
                                            {item.title}
                                        </h2>

                                        <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                                            {item.summary}
                                        </p>

                                        <div className="mt-auto flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest group-hover:text-neon-red transition-colors">
                                            {t('interviews.read_more')}
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
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
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-20 flex justify-center items-center gap-4">
                    <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        onMouseEnter={playHoverSound}
                        className="p-4 rounded-2xl border border-white/10 bg-dark-bg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-neon-red/50 transition-all group shadow-xl"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                            <button
                                key={number}
                                onClick={() => paginate(number)}
                                onMouseEnter={playHoverSound}
                                className={`w-12 h-12 rounded-2xl font-display font-black transition-all shadow-xl ${currentPage === number
                                    ? 'bg-neon-red text-white shadow-[0_0_20px_rgba(255,0,51,0.4)]'
                                    : 'bg-dark-bg border border-white/10 text-gray-500 hover:border-neon-red/50 hover:text-white'
                                    }`}
                            >
                                {number}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        onMouseEnter={playHoverSound}
                        className="p-4 rounded-2xl border border-white/10 bg-dark-bg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-neon-red/50 transition-all group shadow-xl"
                    >
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
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
                            {t('article_detail.newsletter_title')}
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
