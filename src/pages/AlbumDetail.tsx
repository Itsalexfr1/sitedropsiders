import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Share2, Download, Maximize2, Check, Edit2, Facebook, Instagram, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import galerieData from '../data/galerie.json';
import { useLanguage } from '../context/LanguageContext';
import { extractIdFromSlug } from '../utils/slugify';
import { trackPageView } from '../utils/analytics';
import { MediaInteractions } from '../components/shared/MediaInteractions';
import { resolveImageUrl } from '../utils/image';

export function AlbumDetail() {
    const { t } = useLanguage();
    const { id } = useParams();
    const album = galerieData.find(a => String(a.id) === String(id)) || 
                  galerieData.find(a => String(a.id) === String(extractIdFromSlug(id || '')));
    const navigate = useNavigate();

    useEffect(() => {
        if (album) {
            trackPageView(album.id.toString(), 'galerie');
        }
    }, [id, album]);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
    }, []);

    const handleEdit = () => {
        if (!album) return;
        navigate(`/galerie/create?id=${album.id}`, { state: { isEditing: true, item: album } });
    };

    const shareText = `Découvrez cet album sur Dropsiders : ${album?.title}`;
    const shareUrl = window.location.href;

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        x: `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        instagram: `https://www.instagram.com/dropsiders/`
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: album?.title || 'Communauté Dropsiders',
                    text: shareText,
                    url: shareUrl
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err: any) {
            console.error('Error sharing:', err);
        }
    };

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
                    src={resolveImageUrl(album.cover)}
                    alt={album.title}
                    className="w-full h-full object-cover opacity-50 blur-sm scale-110"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 pb-12">
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
                                {isAdmin && (
                                    <button
                                        onClick={handleEdit}
                                        className="p-3 bg-neon-cyan/10 hover:bg-neon-cyan/20 rounded-2xl border border-neon-cyan/50 transition-all text-neon-cyan group flex items-center gap-2"
                                    >
                                        <Edit2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="hidden md:inline font-bold ml-2">MODIFIER</span>
                                    </button>
                                )}
                                {/* Social Share Group */}
                                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
                                    {/* Facebook */}
                                    <a
                                        href={shareLinks.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                        title="Partager sur Facebook"
                                    >
                                        <Facebook className="w-4 h-4 text-white hover:text-blue-500 transition-colors" />
                                    </a>

                                    {/* Instagram */}
                                    <a
                                        href={shareLinks.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                        title="Partager sur Instagram"
                                    >
                                        <Instagram className="w-4 h-4 text-white hover:text-pink-500 transition-colors" />
                                    </a>

                                    {/* X (Twitter) */}
                                    <a
                                        href={shareLinks.x}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                        title="Partager sur X"
                                    >
                                        <X className="w-4 h-4 text-white hover:text-gray-400 transition-colors" />
                                    </a>

                                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                                    {/* Main Share / Copy Button */}
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl text-white font-bold text-[10px] transition-all group"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                                <span className="text-green-400">COPIÉ</span>
                                            </>
                                        ) : (
                                            <>
                                                <Share2 className="w-3.5 h-3.5 group-hover:text-neon-red transition-colors" />
                                                <span>PARTAGER</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Photo Grid */}
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {album.images.map((img, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer bg-black/20 border border-white/5 hover:border-white/20 transition-all"
                            onClick={() => setSelectedPhoto(img)}
                        >
                            <img
                                src={resolveImageUrl(img)}
                                alt={`${album.title} - ${index}`}
                                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 block"
                                loading="lazy"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                }}
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
                    <MediaInteractions
                        type="photo"
                        id={selectedPhoto}
                        onClose={() => setSelectedPhoto(null)}
                        isAdmin={isAdmin}
                    />
                )}
            </AnimatePresence>

        </div>
    );
}
