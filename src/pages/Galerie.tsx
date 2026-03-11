import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Calendar, ArrowRight, Filter, ChevronLeft, ChevronRight, Edit2, Video, Play, Star } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import galerieData from '../data/galerie.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { getGalleryLink } from '../utils/slugify';
import { MediaInteractions } from '../components/shared/MediaInteractions';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { QuizSection } from '../components/community/QuizSection';
import { AvisSection } from '../components/community/AvisSection';
import { GuideSection } from '../components/community/GuideSection';
import { CovoitSection } from '../components/community/CovoitSection';
import { AlertsSection } from '../components/community/AlertsSection';
import { MemoryWall } from '../components/community/MemoryWall';
import { SEO } from '../components/utils/SEO';

const ALBUMS_PER_PAGE = 8;

export function Galerie() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'WALL' | 'PHOTOS' | 'QUIZZ' | 'AVIS' | 'GUIDE' | 'COVOIT' | 'ALERTS'>('WALL');
    const [activeSegment, setActiveSegment] = useState<'COMMUNITY' | 'CLIPS'>('COMMUNITY');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const playHoverSound = useHoverSound();
    const [isAdmin, setIsAdmin] = useState(false);
    const [clips, setClips] = useState<any[]>([]);
    const [isLoadingClips, setIsLoadingClips] = useState(false);
    const [selectedClip, setSelectedClip] = useState<any>(null);

    useEffect(() => {
        if (activeSegment === 'CLIPS') {
            setIsLoadingClips(true);
            fetch('/api/clips')
                .then(res => res.json())
                .then(data => {
                    setClips(data);
                    setIsLoadingClips(false);
                })
                .catch(() => setIsLoadingClips(false));
        }
    }, [activeSegment]);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true' || localStorage.getItem('modo_auth') === 'true');
    }, []);

    const CATEGORIES = [
        { id: 'ALL', label: t('communaute.filter_all') },
        { id: 'FESTIVALS', label: t('communaute.filter_festivals') },
        { id: 'CLUBS & EVENTS', label: t('communaute.filter_clubs') },
        { id: 'CONCERTS', label: t('communaute.filter_concerts') },
        { id: 'PORTRAITS', label: t('communaute.filter_portraits') },
        { id: 'OTHERS', label: t('communaute.filter_others') }
    ];

    const filteredAlbums = useMemo(() => {
        const baseData = galerieData.filter(album => (album as any).isCommunity || (album.category || '').toLowerCase().includes('communauté'));

        if (activeCategory === 'ALL') return baseData;

        return baseData.filter(album => {
            const cat = (album.category || '').toUpperCase();
            if (activeCategory === 'CLUBS & EVENTS') return cat.includes('CLUB');
            return cat === activeCategory;
        });
    }, [activeCategory]);

    const totalPages = Math.ceil(filteredAlbums.length / ALBUMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, activeSegment]);

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
        <>
            <SEO
                title="Galerie & Souvenirs"
                description="Replongez dans l'ambiance des plus grands festivals avec nos galeries photos et vidéos exclusives. Les meilleurs moments, capturés pour vous."
            />
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-neon-red/10 rounded-lg">
                                <Camera className="w-6 h-6 text-neon-red" />
                            </div>
                            <span className="text-neon-red font-bold tracking-widest text-sm uppercase">{t('communaute.badge')}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-2 uppercase italic tracking-tighter">
                            LA <span className="text-neon-red">COMMUNAUTÉ</span>
                        </h1>
                        <p className="text-gray-500 max-w-xl text-sm font-medium uppercase tracking-wider">
                            Les meilleurs souvenirs des festivals, par vous et pour vous.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/communaute/partager')}
                        className="group flex items-center gap-4 px-8 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,17,17,0.3)] transition-all"
                    >
                        Partager mes photos
                        <div className="p-2 bg-neon-red rounded-lg group-hover:rotate-12 transition-transform">
                            <Camera className="w-4 h-4 text-white" />
                        </div>
                    </motion.button>
                </motion.div>

                <CommunityTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {activeTab === 'WALL' && <MemoryWall galerieData={galerieData} />}
                {activeTab === 'PHOTOS' && (
                    <>
                        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit mb-8">
                            <button
                                onClick={() => setActiveSegment('COMMUNITY')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSegment === 'COMMUNITY' ? 'bg-white text-black shadow-lg font-black' : 'text-gray-500 hover:text-white font-bold'}`}
                            >
                                Vos Photos de Festivals
                            </button>
                            <button
                                onClick={() => setActiveSegment('CLIPS')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSegment === 'CLIPS' ? 'bg-white text-black shadow-lg font-black' : 'text-gray-500 hover:text-white font-bold'}`}
                            >
                                {t('communaute.clips_tab')}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mb-12">
                            <div className="flex items-center gap-2 text-gray-500 mr-2">
                                <Filter className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('communaute.filter_by')}</span>
                            </div>
                            {CATEGORIES.map((cat) => (
                                <motion.button
                                    key={cat.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveCategory(cat.id)}
                                    onMouseEnter={playHoverSound}
                                    className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 border uppercase ${activeCategory === cat.id
                                        ? 'bg-neon-red border-transparent text-white shadow-[0_0_20px_rgba(255,17,17,0.4)]'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:border-neon-red/40 hover:text-white'
                                        }`}
                                >
                                    {cat.label}
                                </motion.button>
                            ))}
                        </div>

                        <div className="relative">
                            <AnimatePresence>
                                {(currentPage > 1 && activeSegment !== 'CLIPS') && (
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
                                        key={activeSegment === 'CLIPS' ? 'clips' : currentPage}
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        className={activeSegment === 'CLIPS' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"}
                                    >
                                        {activeSegment === 'CLIPS' ? (
                                            clips.length > 0 ? (
                                                clips
                                                    .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
                                                    .map((clip) => (
                                                        <motion.div
                                                            key={clip.id}
                                                            className={`group relative bg-[#0a0a0a] border rounded-3xl overflow-hidden hover:border-neon-red/50 transition-all duration-500 shadow-2xl ${clip.isFeatured ? 'border-neon-red/30 ring-1 ring-neon-red/20' : 'border-white/5'}`}
                                                        >
                                                            {clip.isFeatured && (
                                                                <div className="absolute top-4 left-4 z-20 bg-neon-red text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,0,51,0.4)] animate-pulse">
                                                                    <Star className="w-3 h-3 fill-white" />
                                                                    À LA UNE
                                                                </div>
                                                            )}
                                                            <div
                                                                className="aspect-video relative overflow-hidden bg-black cursor-pointer"
                                                                onClick={() => setSelectedClip(clip)}
                                                            >
                                                                <video
                                                                    src={clip.url}
                                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                                                                    onMouseOver={e => {
                                                                        if (window.innerWidth > 768) e.currentTarget.play();
                                                                    }}
                                                                    onMouseOut={e => {
                                                                        if (window.innerWidth > 768) {
                                                                            e.currentTarget.pause();
                                                                            e.currentTarget.currentTime = 0;
                                                                        }
                                                                    }}
                                                                    muted
                                                                    loop
                                                                    playsInline
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                                    <span className="text-[10px] font-black text-white">{clip.duration}</span>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                    <div className="w-16 h-16 rounded-full bg-neon-red flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                                                                        <Play className="w-8 h-8 text-white fill-current" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="p-6">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="w-8 h-8 rounded-full bg-neon-red/10 flex items-center justify-center border border-neon-red/20">
                                                                        <Video className="w-4 h-4 text-neon-red" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-sm font-black text-white uppercase italic tracking-wider line-clamp-1">{clip.title}</h3>
                                                                        <p className="text-[10px] font-bold text-neon-red uppercase tracking-widest mt-0.5">@{clip.creator}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{clip.date}</span>
                                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{clip.timestamp}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setSelectedClip(clip)}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                                                                    >
                                                                        <Play className="w-3 h-3" /> VOIR
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                            ) : isLoadingClips ? (
                                                <div className="col-span-full py-32 flex flex-col items-center justify-center">
                                                    <div className="w-12 h-12 border-4 border-neon-red border-t-transparent rounded-full animate-spin mb-4" />
                                                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('communaute.loading_clips')}</p>
                                                </div>
                                            ) : (
                                                <div className="col-span-full py-32 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                                                    <Video className="w-16 h-16 text-gray-700 mb-6" />
                                                    <p className="text-gray-400 font-display uppercase tracking-widest text-lg">{t('communaute.no_clips')}</p>
                                                </div>
                                            )
                                        ) : currentAlbums.length > 0 ? (
                                            currentAlbums.map((album) => (
                                                <motion.div
                                                    key={album.id}
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
                                                            className="group relative block aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-neon-red hover:shadow-[0_0_35px_rgba(255,17,17,0.4)] transition-all duration-500 shadow-2xl"
                                                        >
                                                            <img
                                                                src={album.cover}
                                                                alt={album.title}
                                                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-100 group-hover:opacity-40"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-neon-red/90 via-neon-red/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                            {(album as any).hoverMedia && (
                                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none hidden md:block">
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
                                                            <div className="absolute inset-0 p-8 flex flex-col justify-end transform transition-all duration-500">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="px-2 py-0.5 bg-neon-red text-white text-[9px] font-black uppercase tracking-wider rounded">
                                                                        {album.category}
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">
                                                                        {album.images.length}+ {t('communaute.photos_suffix').toUpperCase()}
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
                                                                        {t('communaute.view_album')} <ArrowRight className="w-4 h-4" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-20 flex flex-col items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                                                <p className="text-gray-400 font-display uppercase tracking-widest text-lg">{t('communaute.no_albums')}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <AnimatePresence>
                                {(currentPage < totalPages && activeSegment !== 'CLIPS') && (
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

                        {activeSegment !== 'CLIPS' && totalPages > 1 && (
                            <div className="mt-16 flex justify-center items-center gap-4">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-3 rounded-xl border border-white/10 bg-white/5 disabled:opacity-30 hover:bg-neon-red transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                </button>
                                <div className="flex gap-2">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => handlePageChange(i + 1)}
                                            className={`w-12 h-12 rounded-xl border font-black transition-all ${currentPage === i + 1 ? 'bg-neon-red border-neon-red text-white' : 'border-white/10 bg-white/5 text-gray-400'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-3 rounded-xl border border-white/10 bg-white/5 disabled:opacity-30 hover:bg-neon-red transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'QUIZZ' && <QuizSection />}
                {activeTab === 'AVIS' && <AvisSection />}
                {activeTab === 'GUIDE' && <GuideSection />}
                {activeTab === 'COVOIT' && <CovoitSection />}
                {activeTab === 'ALERTS' && <AlertsSection />}

                <AnimatePresence>
                    {selectedClip && (
                        <MediaInteractions
                            type="clip"
                            id={selectedClip.url}
                            videoUrl={selectedClip.url}
                            onClose={() => setSelectedClip(null)}
                            isAdmin={isAdmin}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
