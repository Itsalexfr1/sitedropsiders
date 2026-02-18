import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Camera, Play, X, Share2, Check } from 'lucide-react';
import recapsData from '../data/recaps.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { extractIdFromSlug, getRecapLink } from '../utils/slugify';
import { translateText, translateHTML } from '../utils/translate';
import { getRecapContent } from '../utils/contentLoader';

export function RecapDetail() {
    const { t, language } = useLanguage();
    const { id } = useParams();
    const playHoverSound = useHoverSound();
    const recapId = extractIdFromSlug(id || '');
    const recap = (recapsData as any[]).find((item: any) => item.id === recapId);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [translatedTitle, setTranslatedTitle] = useState<string>('');
    const [translatedContent, setTranslatedContent] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (recap && language === 'en') {
            // Translate title
            translateText(recap.title, 'en').then(setTranslatedTitle);
            // Translate content (preserving HTML)
            translateHTML(recap.content || '', 'en').then(setTranslatedContent);
        } else if (recap) {
            setTranslatedTitle(recap.title);
            setTranslatedContent('');
        }
    }, [recap, language]);

    const handleShare = async () => {
        const url = window.location.href;
        const shareData = {
            title: translatedTitle || recap?.title || 'Dropsiders Recap',
            text: `Découvrez ce récap sur Dropsiders : ${translatedTitle || recap?.title}`,
            url: url
        };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    if (!recap) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center py-20">
                    <h1 className="text-4xl font-display font-black text-white mb-4">{t('recap_detail.not_found_title')}</h1>
                    <Link
                        to="/recaps"
                        className="text-neon-red hover:underline font-bold"
                        onMouseEnter={playHoverSound}
                    >
                        {t('recap_detail.not_found_btn')}
                    </Link>
                </div>
            </div>
        );
    }

    const relatedRecaps = (recapsData as any[])
        .filter((item: any) => item.id !== recap.id)
        .slice(0, 3);


    // Récupérer le contenu complet depuis les fichiers séparés
    const fullContent = recap ? getRecapContent(recap.id) : '';
    let rawContent = fullContent || (recap as any).content || '';

    // Nettoyage robuste via DOMParser pour supprimer les éléments indésirables (boutons partage, pubs, etc.)
    const cleanHTML = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Sélecteurs des éléments à supprimer
        const selectorsToRemove = [
            '.jw-social-share', // Boutons de partage Webador
            '.jw-news-page__meta', // Métadonnées
            '.jw-news-page-pagination', // Pagination
            '.jw-block-footer-content', // Footer
            'footer', // Footer standard
            '.jw-comment-module', // Commentaires
            '.jw-widget-newsletter', // Widget Newsletter ancien
            'iframe' // On supprime les iframes (vidéos gérées à part)
        ];

        selectorsToRemove.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Nettoyage spécifique des images (car gérées dans la galerie)
        const images = doc.querySelectorAll('img, picture');
        images.forEach(img => img.remove());

        // Nettoyage des titres H1 doublons (car affiché dans le Hero)
        const h1s = doc.querySelectorAll('h1');
        h1s.forEach(h1 => h1.remove());

        // Nettoyage du style inline gênant
        const centeredElements = doc.querySelectorAll('[style*="text-align: center"]');
        centeredElements.forEach(el => el.classList.add('text-center'));

        // Transformation des liens vides ou inutiles
        const emptyLinks = doc.querySelectorAll('a:empty');
        emptyLinks.forEach(link => link.remove());

        // Retourne le HTML nettoyé
        return doc.body.innerHTML;
    };

    const cleanedContent = cleanHTML(rawContent);

    return (
        <div className="min-h-screen">
            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <motion.button
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-10 h-10" />
                        </motion.button>

                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={selectedImage}
                            alt="Lightbox"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-neon-red/20"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section avec Image de Couverture */}
            <div className="relative h-[70vh] overflow-hidden">
                <img
                    src={recap.coverImage || recap.image}
                    alt={recap.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/70 to-transparent" />

                {/* Contenu Hero */}
                <div className="absolute inset-0 flex items-end">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex justify-between items-end mb-6">
                                <Link
                                    to="/recap"
                                    className="inline-flex items-center gap-2 text-white/80 hover:text-neon-red transition-colors group"
                                    onMouseEnter={playHoverSound}
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-bold uppercase tracking-wider text-sm">{t('recap_detail.back_to_recaps')}</span>
                                </Link>

                                {/* Bouton Partager (NOUVEAU) */}
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white font-bold text-sm transition-all hover:border-neon-red/50 group"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-green-400">Lien copié !</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-4 h-4 group-hover:text-neon-red transition-colors" />
                                            <span>Partager</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3 mb-6">
                                {recap.festival && (
                                    <span className="px-4 py-2 bg-neon-red rounded-full text-white font-black text-sm uppercase tracking-wider">
                                        {recap.festival}
                                    </span>
                                )}
                                {recap.location && (
                                    <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {recap.location}
                                    </span>
                                )}
                                <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(recap.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-4 uppercase italic tracking-tighter leading-none">
                                {translatedTitle || recap.title}
                            </h1>

                            {recap.images && recap.images.length > 0 && (
                                <div className="flex items-center gap-4 text-white/80">
                                    <div className="flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-neon-red" />
                                        <span className="font-bold text-lg">{recap.images.length} {t('galerie.photos_suffix')}</span>
                                    </div>
                                    {recap.youtubeId && (
                                        <div className="flex items-center gap-2">
                                            <Play className="w-5 h-5 text-neon-red" />
                                            <span className="font-bold text-lg">{t('recap_detail.video_available')}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Layout Principal avec Sidebar */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Colonne de gauche : Contenu */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* Vidéo YouTube si disponible */}
                        {recap.youtubeId && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="w-full"
                            >
                                <h2 className="text-3xl font-display font-black text-white mb-6 uppercase italic flex items-center gap-3">
                                    <Play className="w-8 h-8 text-neon-red" />
                                    {t('recap_detail.video_title')}
                                </h2>
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/5" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${recap.youtubeId}`}
                                        className="absolute top-0 left-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Contenu Texte */}
                        {recap.content && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div
                                    className="article-body-premium prose prose-invert max-w-none shadow-2xl shadow-white/5 p-8 md:p-12 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
                                    dangerouslySetInnerHTML={{ __html: language === 'en' && translatedContent ? translatedContent : cleanedContent }}
                                />
                            </motion.div>
                        )}

                        {/* Galerie Photos */}
                        {recap.images && recap.images.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="relative mb-12">
                                    <h2 className="text-4xl font-display font-black text-white uppercase italic flex items-center gap-4">
                                        <span className="bg-neon-red p-2 rounded-lg">
                                            <Camera className="w-8 h-8 text-white" />
                                        </span>
                                        {t('article_detail.gallery_title')}
                                        <span className="text-neon-red ml-2">[{recap.images.length}]</span>
                                    </h2>
                                    <div className="absolute -bottom-4 left-0 w-24 h-1 bg-neon-red" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {recap.images.map((image: string, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 + index * 0.05 }}
                                            whileHover={{ y: -5 }}
                                            onClick={() => setSelectedImage(image)}
                                            className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 hover:border-neon-red/50 transition-all duration-500 cursor-zoom-in shadow-xl hover:shadow-neon-red/20 bg-dark-card"
                                        >
                                            <img
                                                src={image}
                                                alt={`${recap.title} - ${t('common.photo')} ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <p className="text-white font-black uppercase italic tracking-wider text-sm">{t('recap_detail.gallery_expand')}</p>
                                                    <p className="text-white/60 text-xs mt-1">{t('common.photo')} {index + 1}</p>
                                                </div>
                                            </div>

                                            {/* Overlay Glassmorphism au hover */}
                                            <div className="absolute inset-0 border-2 border-neon-red opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Colonne de droite : Sidebar (Sticky) */}
                    <aside className="lg:col-span-4 space-y-12">
                        <div className="sticky top-32 space-y-12">
                            {/* Widget "À lire aussi" */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-base font-display font-black text-white uppercase tracking-tighter mb-8 italic flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-neon-red rounded-full" />
                                    {t('recap_detail.related_title')}
                                </h3>
                                <div className="space-y-6">
                                    {relatedRecaps.map((rel: any) => (
                                        <Link
                                            key={rel.id}
                                            to={getRecapLink(rel)}
                                            className="group block space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0"
                                            onClick={() => window.scrollTo(0, 0)}
                                        >
                                            <div className="aspect-video rounded-xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 border border-white/5">
                                                <img
                                                    src={rel.image}
                                                    alt={rel.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black text-neon-red tracking-widest uppercase">
                                                    {rel.festival || 'RÉCAP'}
                                                </span>
                                                <h4 className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors leading-snug uppercase tracking-tight line-clamp-2 italic font-display">
                                                    {rel.title}
                                                </h4>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5">
                                    <Link
                                        to="/recap"
                                        className="text-xs font-black text-white/40 hover:text-neon-red uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        {t('recap_detail.view_all_recaps')}
                                        <ArrowLeft className="w-3 h-3 rotate-180" />
                                    </Link>
                                </div>
                            </div>

                            {/* Newsletter Widget (Premium style) */}
                            <div className="bg-gradient-to-br from-neon-red/10 to-neon-purple/10 border border-neon-red/20 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-neon-red/20 blur-3xl rounded-full" />

                                <div className="relative z-10 space-y-4">
                                    <div className="w-14 h-14 mx-auto bg-neon-red/20 rounded-full flex items-center justify-center border border-neon-red/30">
                                        <Play className="w-6 h-6 text-neon-red rotate-90" />
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-lg font-display font-black text-white uppercase italic tracking-tight">{t('article_detail.newsletter_title')}</h4>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide leading-relaxed">
                                            {t('article_detail.newsletter_subtitle')}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <NewsletterForm variant="compact" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
