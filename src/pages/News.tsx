import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import newsData from '../data/news.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getArticleLink } from '../utils/slugify';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { standardizeContent } from '../utils/standardizer';


export function News() {
    const { t } = useLanguage();
    const [currentPage, setCurrentPage] = useState(1);
    const articlesPerPage = 8;

    const filteredNews = (newsData as any[]).filter((item: any) => item.category === 'News');
    const totalPages = Math.ceil(filteredNews.length / articlesPerPage);

    const startIndex = (currentPage - 1) * articlesPerPage;
    const currentArticles = filteredNews.slice(startIndex, startIndex + articlesPerPage);

    const playHoverSound = useHoverSound();

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('news.badge')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    {t('news.title')}
                </h1>
                <p className="text-gray-400 max-w-2xl text-lg">
                    {t('news.subtitle')}
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
                <AnimatePresence mode="wait">
                    {currentArticles.length > 0 ? (
                        currentArticles.map((item: any, index: number) => (
                            <motion.article
                                key={`${item.id}-${currentPage}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-dark-bg border border-white/10 rounded-2xl overflow-hidden hover:border-neon-red/50 transition-colors duration-300"
                            >
                                <Link to={getArticleLink(item)}>
                                    <div className="h-72 overflow-hidden bg-black/40 flex items-center justify-center">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-bold text-neon-red border border-neon-red/30 px-2 py-1 rounded-full">{item.category}</span>
                                            <span className="text-xs text-gray-500">{item.date}</span>
                                        </div>
                                        <h2
                                            className="text-xl font-bold text-white mb-3 group-hover:text-neon-red transition-colors"
                                            dangerouslySetInnerHTML={{ __html: standardizeContent(item.title) }}
                                        />
                                        <p
                                            className="text-gray-400 text-sm line-clamp-3"
                                            dangerouslySetInnerHTML={{ __html: standardizeContent(item.summary) }}
                                        />

                                    </div>
                                </Link>
                            </motion.article>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                            <p className="text-gray-400 font-display uppercase tracking-widest text-lg">{t('news.no_news')}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        onMouseEnter={playHoverSound}
                        className="p-3 rounded-xl border border-white/10 bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-red hover:border-neon-red transition-all duration-300 group"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex gap-2">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                onMouseEnter={playHoverSound}
                                className={`w-12 h-12 rounded-xl border font-black transition-all duration-300 ${currentPage === i + 1
                                    ? 'bg-neon-red border-neon-red text-white shadow-[0_0_20px_rgba(255,0,51,0.4)]'
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-neon-red/50 hover:text-white'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        onMouseEnter={playHoverSound}
                        className="p-3 rounded-xl border border-white/10 bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-red hover:border-neon-red transition-all duration-300 group"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
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
