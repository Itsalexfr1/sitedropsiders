import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Share2, Download, Maximize2, X } from 'lucide-react';
import { useState } from 'react';
import galerieData from '../data/galerie.json';
import { useLanguage } from '../context/LanguageContext';

export function AlbumDetail() {
    const { t } = useLanguage();
    const { id } = useParams();
    const album = galerieData.find(a => a.id === id);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    if (!album) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">{t('album_detail.not_found_title')}</h2>
                    <Link to="/galerie" className="text-neon-red hover:underline">{t('album_detail.back_to_galerie')}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Header / Hero Section for Album */}
            <div className="relative h-[40vh] w-full overflow-hidden">
                <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover opacity-50 blur-sm scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link
                            to="/galerie"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            {t('album_detail.back_to_galerie')}
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-neon-red/10 border border-neon-red/30 rounded-full text-neon-red text-xs font-bold tracking-widest uppercase">
                                        {album.category || t('album_detail.default_category')}
                                    </span>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        {album.date}
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter">
                                    {album.title}
                                </h1>
                            </div>

                            <div className="flex items-center gap-4">
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-white group">
                                    <Share2 className="w-5 h-5 group-hover:text-neon-red" />
                                </button>
                                <div className="px-6 py-3 bg-neon-red rounded-2xl font-bold text-white shadow-[0_0_20px_#ff0033] hover:scale-105 transition-all cursor-pointer">
                                    {t('album_detail.share_btn')}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Photo Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {album.images.map((img, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer bg-white/5 border border-white/5 hover:border-white/20 transition-all"
                            onClick={() => setSelectedPhoto(img)}
                        >
                            <img
                                src={img}
                                alt={`${album.title} - ${index}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex gap-3 scale-0 group-hover:scale-100 transition-transform duration-300">
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-neon-red transition-colors text-white">
                                        <Maximize2 className="w-5 h-5" />
                                    </div>
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors text-white">
                                        <Download className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Lightbox / Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <button
                            className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-neon-red transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={selectedPhoto}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
