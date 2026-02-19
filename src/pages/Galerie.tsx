import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, Calendar, ArrowRight, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import galerieData from '../data/galerie.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getGalleryLink } from '../utils/slugify';

const ALBUMS_PER_PAGE = 8;

export function Galerie() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const playHoverSound = useHoverSound();

    const CATEGORIES = [
        { id: 'ALL', label: t('galerie.filter_all') },
        { id: 'FESTIVALS', label: t('galerie.filter_festivals') },
        { id: 'CLUBS & EVENTS', label: t('galerie.filter_clubs') },
        { id: 'CONCERTS', label: t('galerie.filter_concerts') },
        { id: 'OTHERS', label: t('galerie.filter_others') }
    ];

    const filteredAlbums = useMemo(() => {
        return activeCategory === 'ALL'
            ? galerieData
            : galerieData.filter(album => album.category?.toUpperCase() === activeCategory);
    }, [activeCategory]);

    const totalPages = Math.ceil(filteredAlbums.length / ALBUMS_PER_PAGE);

    // Reset page when category changes
    useMemo(() => {
        setCurrentPage(1);
    }, [activeCategory]);

    const startIndex = (currentPage - 1) * ALBUMS_PER_PAGE;
    const currentAlbums = filteredAlbums.slice(startIndex, startIndex + ALBUMS_PER_PAGE);

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
                        <Camera className="w-6 h-6 text-neon-red" />
                    </div>
                    <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('galerie.badge')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                    {t('galerie.title')} <span className="text-neon-red">{t('galerie.title_span')}</span>
                </h1>
            </motion.div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
                <div className="flex items-center gap-2 text-gray-400 mr-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">{t('galerie.filter_by')}</span>
                </div>
                {CATEGORIES.map((cat) => (
                    <motion.button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        whileHover={{ scale: 1.05 }}
                        onMouseEnter={playHoverSound}
                        className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-300 border ${activeCategory === cat.id
                            ? 'bg-neon-red border-neon-red text-white shadow-[0_0_15px_rgba(255,0,51,0.5)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                            }`}
                    >
                        {cat.label}
                    </motion.button>
                ))}
            </div>

            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[800px]"
            >
                <AnimatePresence mode='popLayout' initial={false}>
                    {currentAlbums.length > 0 ? (
                        currentAlbums.map((album, index) => (
                            <motion.div
                                key={`${album.id}-${currentPage}`}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Link
                                    to={getGalleryLink(album)}
                                    className="group relative block aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-neon-red/50 transition-all duration-500 shadow-2xl"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        onMouseEnter={playHoverSound}
                                        className="w-full h-full"
                                    >
                                        {/* Album Cover */}
                                        <img
                                            src={album.cover}
                                            alt={album.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                        />

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

                                        {/* Content */}
                                        <div className="absolute inset-x-0 bottom-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-0.5 bg-neon-red/20 border border-neon-red/30 rounded text-[10px] font-bold text-neon-red uppercase tracking-wider">
                                                    {album.category}
                                                </span>
                                                <span className="text-xs font-bold text-white/60 tracking-widest uppercase">
                                                    {album.images.length}+ {t('galerie.photos_suffix')}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-neon-red transition-colors duration-300 leading-tight">
                                                {album.title}
                                            </h3>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">{album.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-neon-red font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                    {t('galerie.view_album')} <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                            <p className="text-gray-400 font-display uppercase tracking-widest text-lg">{t('galerie.no_albums')}</p>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>

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
