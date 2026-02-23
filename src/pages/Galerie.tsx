import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Calendar, ArrowRight, Filter, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import galerieData from '../data/galerie.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getGalleryLink } from '../utils/slugify';

const ALBUMS_PER_PAGE = 8;

export function Galerie() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const playHoverSound = useHoverSound();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
    }, []);

    const CATEGORIES = [
        { id: 'ALL', label: t('galerie.filter_all') },
        { id: 'FESTIVALS', label: t('galerie.filter_festivals') },
        { id: 'CLUBS & EVENTS', label: t('galerie.filter_clubs') },
        { id: 'CONCERTS', label: t('galerie.filter_concerts') },
        { id: 'PORTRAITS', label: t('galerie.filter_portraits') },
        { id: 'OTHERS', label: t('galerie.filter_others') }
    ];

    const filteredAlbums = useMemo(() => {
        return activeCategory === 'ALL'
            ? galerieData
            : galerieData.filter(album => {
                const cat = (album.category || '').toUpperCase();
                // Special case for CLUBS & EVENTS to be more robust
                if (activeCategory === 'CLUBS & EVENTS') return cat.includes('CLUB');
                return cat === activeCategory;
            });
    }, [activeCategory]);

    const totalPages = Math.ceil(filteredAlbums.length / ALBUMS_PER_PAGE);

    // Reset page when category changes
    useMemo(() => {
        setCurrentPage(1);
    }, [activeCategory]);

    const startIndex = (currentPage - 1) * ALBUMS_PER_PAGE;
    const currentAlbums = filteredAlbums.slice(startIndex, startIndex + ALBUMS_PER_PAGE);

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

                <div className="overflow-hidden">
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            {currentAlbums.length > 0 ? (
                                currentAlbums.map((album) => (
                                    <motion.div
                                        key={album.id}
                                        whileHover={{ scale: 1.05 }}
                                        onMouseEnter={playHoverSound}
                                    >
                                        <div className="relative group">
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigate(`/galerie/create?id=${album.id}`, { state: { isEditing: true, item: album } });
                                                    }}
                                                    className="absolute top-4 right-4 z-20 p-2 bg-black/60 backdrop-blur-md rounded-full border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <Link
                                                to={getGalleryLink(album)}
                                                className="group relative block aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-neon-red transition-all duration-500 shadow-2xl"
                                            >
                                                {/* Album Cover */}
                                                <img
                                                    src={album.cover}
                                                    alt={album.title}
                                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-100 group-hover:opacity-40"
                                                />

                                                {/* Overlay Gradient (Repos) */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-500" />

                                                {/* Red Hover Overlay (Hover) */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-neon-red/90 via-neon-red/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                {/* Hover Media (Video/Image) */}
                                                {(album as any).hoverMedia && (
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                                        {((album as any).hoverMedia.toLowerCase().endsWith('.mp4') || (album as any).hoverMedia.toLowerCase().endsWith('.webm')) ? (
                                                            <video
                                                                src={(album as any).hoverMedia}
                                                                autoPlay
                                                                muted
                                                                loop
                                                                playsInline
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={(album as any).hoverMedia}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-neon-red/80 via-transparent to-transparent" />
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className="absolute inset-0 p-8 flex flex-col justify-end transform transition-all duration-500">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="px-2 py-0.5 bg-neon-red text-white text-[9px] font-black uppercase tracking-wider rounded">
                                                            {album.category}
                                                        </span>
                                                        <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">
                                                            {album.images.length}+ PHOTOS
                                                        </span>
                                                    </div>

                                                    <h3 className="text-xl font-display font-black text-white group-hover:text-white transition-colors duration-300 leading-tight uppercase italic tracking-tighter">
                                                        {album.title}
                                                    </h3>

                                                    <div className="mt-4 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-all duration-500">
                                                        <div className="flex items-center gap-2 text-white/80">
                                                            <Calendar className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{album.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-white font-black text-[10px] uppercase tracking-widest">
                                                            {t('galerie.view_album')} <ArrowRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                                    <p className="text-gray-400 font-display uppercase tracking-widest text-lg">{t('galerie.no_albums')}</p>
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
            {
                totalPages > 1 && (
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
                )
            }
        </div>
    );
}
