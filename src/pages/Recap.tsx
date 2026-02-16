import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import newsData from '../data/news.json';
import { useHoverSound } from '../hooks/useHoverSound';

export function Recap() {
    const [currentPage, setCurrentPage] = useState(1);
    const articlesPerPage = 8;

    const recaps = (newsData as any[]).filter((item: any) => item.category === 'Recap');
    const totalPages = Math.ceil(recaps.length / articlesPerPage);

    const startIndex = (currentPage - 1) * articlesPerPage;
    const currentArticles = recaps.slice(startIndex, startIndex + articlesPerPage);

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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">Couvertures</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    RÉCAPS <span className="text-neon-red">EVENTS</span>
                </h1>
                <p className="text-gray-400 max-w-2xl text-lg">
                    Plongez dans nos couvertures détaillées des plus grands festivals et événements autour du globe.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[600px]">
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
                                className="group bg-dark-bg border border-white/10 rounded-2xl overflow-hidden hover:border-neon-red/50 transition-colors duration-300 shadow-2xl"
                            >
                                <Link to={`/recap/${item.id}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                    <div className="h-64 overflow-hidden bg-black/40 relative">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-60" />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black tracking-widest text-neon-red border border-neon-red/30 px-3 py-1 rounded-full uppercase">RECAP</span>
                                            <span className="text-xs text-gray-500 font-medium">{item.date}</span>
                                        </div>
                                        <h2 className="text-xl font-display font-bold text-white mb-3 group-hover:text-neon-red transition-colors leading-tight uppercase italic line-clamp-2">
                                            {item.title}
                                        </h2>
                                        <p className="text-gray-400 text-sm line-clamp-3">
                                            {item.summary || "Découvrez notre compte-rendu complet de cet événement incontournable..."}
                                        </p>
                                    </div>
                                </Link>
                            </motion.article>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                            <p className="text-gray-400 font-display uppercase tracking-widest text-lg">Aucun récap pour le moment</p>
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
        </div>
    );
}
