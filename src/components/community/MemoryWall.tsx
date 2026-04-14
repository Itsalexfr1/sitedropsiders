import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, Maximize2, Filter, Image as ImageIcon } from 'lucide-react';
import { MediaInteractions } from '../shared/MediaInteractions';
import { useLanguage } from '../../context/LanguageContext';
import { resolveImageUrl } from '../../utils/image';

interface MemoryWallProps {
    galerieData: any[];
}

interface Pin {
    id: string;
    url: string;
    title: string;
    year: string;
    category: string;
    isCommunity: boolean;
    albumId: string;
    type: 'image' | 'video';
}

export function MemoryWall({ galerieData }: MemoryWallProps) {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedMedia, setSelectedMedia] = useState<Pin | null>(null);

    // Extract all available years from data
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        galerieData.forEach(album => {
            if (album.date) {
                // Extract year if it's a full date or already a year
                const yearMatch = album.date.match(/\d{4}/);
                if (yearMatch) years.add(yearMatch[0]);
            }
        });
        return ['ALL', ...Array.from(years).sort((a, b) => b.localeCompare(a))];
    }, [galerieData]);

    // Generate pins (Community photos + Seed data from official albums)
    const allPins = useMemo(() => {
        const pins: Pin[] = [];

        galerieData.forEach(album => {
            const isCommunity = !!(album as any).isCommunity || (album.category || '').toLowerCase().includes('communauté');
            const yearMatch = album.date?.match(/\d{4}/);
            const year = yearMatch ? yearMatch[0] : 'Inconnu';

            if (isCommunity) {
                // For community albums, take all images as pins
                album.images.forEach((img: string, idx: number) => {
                    const isVideo = img.toLowerCase().endsWith('.mp4') || img.toLowerCase().endsWith('.webm');
                    pins.push({
                        id: `${album.id}-comm-${idx}`,
                        url: img,
                        title: album.title,
                        year,
                        category: album.category || 'Communauté',
                        isCommunity: true,
                        albumId: album.id,
                        type: isVideo ? 'video' : 'image'
                    });
                });
            } else {
                // For official albums, take 1-2 images as seed data
                const seedCount = Math.min(album.images.length, 2);
                for (let i = 0; i < seedCount; i++) {
                    const img = album.images[i];
                    const isVideo = img.toLowerCase().endsWith('.mp4') || img.toLowerCase().endsWith('.webm');
                    pins.push({
                        id: `${album.id}-seed-${i}`,
                        url: img,
                        title: album.title,
                        year,
                        category: album.category || 'Official',
                        isCommunity: false,
                        albumId: album.id,
                        type: isVideo ? 'video' : 'image'
                    });
                }
            }
        });

        // Shuffle pins for a dynamic look
        return pins.sort(() => Math.random() - 0.5);
    }, [galerieData]);

    const filteredPins = useMemo(() => {
        return allPins.filter(pin => {
            const matchesSearch = pin.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesYear = selectedYear === 'ALL' || pin.year === selectedYear;
            return matchesSearch && matchesYear;
        });
    }, [allPins, searchTerm, selectedYear]);

    return (
        <div className="space-y-12">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon-red transition-colors" />
                    <input
                        type="text"
                        placeholder={t('communaute.wall_search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-red/50 transition-all text-sm uppercase font-bold tracking-wider"
                    />
                </div>

                <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    <div className="flex items-center gap-2 text-gray-500 mr-2 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('common.date')}</span>
                    </div>
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 border uppercase flex-shrink-0 ${selectedYear === year
                                ? 'bg-neon-red border-transparent text-white shadow-[0_0_20px_rgba(255,17,17,0.4)]'
                                : 'bg-white/5 border-white/10 text-white/40 hover:border-neon-red/40 hover:text-white'
                                }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3D Wall Container */}
            <div className="relative min-h-[800px] py-12" style={{ perspective: '1200px' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredPins.map((pin, idx) => (
                            <motion.div
                                key={pin.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    rotateY: (idx % 3 - 1) * 10, // Alternating perspective tilt
                                    y: (idx % 2 === 0 ? 0 : 30) // Slight staggered effect
                                }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                whileHover={{
                                    scale: 1.1,
                                    rotateY: 0,
                                    rotateZ: (idx % 2 === 0 ? 2 : -2),
                                    zIndex: 50,
                                    transition: { duration: 0.3, ease: "easeOut" }
                                }}
                                onClick={() => setSelectedMedia(pin)}
                                className="group relative aspect-[3/4] cursor-pointer rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl hover:border-neon-red/50 transition-colors"
                            >
                                {pin.type === 'video' ? (
                                    <video
                                        src={resolveImageUrl(pin.url)}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        autoPlay={window.innerWidth > 768}
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={resolveImageUrl(pin.url)}
                                        alt={pin.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-700"
                                        loading="lazy"
                                    />
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-[9px] font-black text-neon-red uppercase tracking-widest mb-1">{pin.year}</p>
                                        <h3 className="text-xs font-black text-white uppercase italic tracking-tighter line-clamp-2">{pin.title}</h3>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-[8px] font-bold text-white/40 uppercase tracking-widest">
                                                <MapPin className="w-2 h-2" /> {pin.isCommunity ? t('nav.communaute') : 'Official'}
                                            </span>
                                            <div className="p-1.5 bg-neon-red rounded-lg shadow-lg">
                                                <Maximize2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {pin.isCommunity && (
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-neon-red/80 backdrop-blur-md rounded text-[7px] font-black text-white uppercase tracking-wider z-10">
                                        PINNED BY USER
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredPins.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-md"
                    >
                        <ImageIcon className="w-16 h-16 text-gray-700 mb-6" />
                        <p className="text-gray-400 font-display uppercase tracking-[0.2em] text-lg">{t('communaute.wall_empty')}</p>
                        <p className="text-gray-600 font-bold uppercase tracking-widest text-xs mt-2">{t('common.no_results')}</p>
                    </motion.div>
                )}
            </div>

            {/* Lightbox / Media View */}
            <AnimatePresence>
                {selectedMedia && (
                    <MediaInteractions
                        type={selectedMedia.type === 'video' ? 'clip' : 'photo'}
                        id={selectedMedia.url}
                        videoUrl={selectedMedia.type === 'video' ? resolveImageUrl(selectedMedia.url) : undefined}
                        imageUrl={selectedMedia.type === 'image' ? resolveImageUrl(selectedMedia.url) : undefined}
                        onClose={() => setSelectedMedia(null)}
                        isAdmin={false}
                    />
                )}
            </AnimatePresence>

            {/* Floating Action Button for Upload */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed bottom-12 right-12 z-50 group"
            >
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.location.href = '/communaute/partager'}
                    className="w-20 h-20 bg-neon-red rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,17,17,0.5)] border-2 border-white/20 relative"
                >
                    <ImageIcon className="w-8 h-8 text-white group-hover:hidden" />
                    <Filter className="w-8 h-8 text-white hidden group-hover:block transition-all" />
                    <span className="absolute -top-12 right-0 bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-black/10">
                        {t('communaute.quizz_submit_title')}
                    </span>
                </motion.button>
            </motion.div>
        </div>
    );
}
