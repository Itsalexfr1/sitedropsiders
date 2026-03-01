import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Share2, Download, Maximize2, X, Edit2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import galerieData from '../data/galerie.json';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { Mail } from 'lucide-react';
import { extractIdFromSlug } from '../utils/slugify';
import { trackPageView } from '../utils/analytics';

export function AlbumDetail() {
    const { t } = useLanguage();
    const { id } = useParams();
    const albumId = extractIdFromSlug(id || '') || id;
    const album = galerieData.find(a => a.id === albumId);
    const navigate = useNavigate();

    useEffect(() => {
        if (album) {
            trackPageView(album.id.toString(), 'galerie');
        }
    }, [albumId, album]);
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
                    src={album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover opacity-50 blur-sm scale-110"
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
                                        <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                    </a>

                                    {/* Instagram */}
                                    <a
                                        href={shareLinks.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                        title="Partager sur Instagram"
                                    >
                                        <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                    </a>

                                    {/* X (Twitter) */}
                                    <a
                                        href={shareLinks.x}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                        title="Partager sur X"
                                    >
                                        <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" className="w-4 h-4 invert opacity-70 group-hover:opacity-100 transition-opacity" />
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
                                src={img}
                                alt={`${album.title} - ${index}`}
                                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 block"
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
            {/* Newsletter Section */}
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-20 border-t border-white/5">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden"
                >
                    <div className="relative z-10 max-w-xl mx-auto">
                        <Mail className="w-10 h-10 text-neon-red mx-auto mb-6" />
                        <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic mb-4" dangerouslySetInnerHTML={{ __html: t('article_detail.newsletter_title') }} />
                        <p className="text-gray-400 mb-8">
                            {t('article_detail.newsletter_subtitle')}
                        </p>
                        <NewsletterForm variant="compact" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
