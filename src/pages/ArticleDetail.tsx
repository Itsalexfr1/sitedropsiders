import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, Play, Camera, X, Share2, Check } from 'lucide-react';
import newsData from '../data/news.json';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { extractIdFromSlug, getArticleLink } from '../utils/slugify';
import { translateText, translateHTML } from '../utils/translate';
import { getNewsContent } from '../utils/contentLoader';
import { standardizeContent } from '../utils/standardizer';
import ArticlePremiumTemplate from '../templates/ArticlePremiumTemplate';


export function ArticleDetail() {
    const { t, language } = useLanguage();
    const { id } = useParams();
    const playHoverSound = useHoverSound();
    const articleId = extractIdFromSlug(id || '');
    const article = newsData.find(item => item.id === articleId);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [translatedTitle, setTranslatedTitle] = useState<string>('');
    const [translatedContent, setTranslatedContent] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (article && language === 'en') {
            // Translate title
            translateText(article.title, 'en').then(setTranslatedTitle);
            // Translate content (preserving HTML)
            translateHTML((article as any).content || (article as any).summary || '', 'en').then(setTranslatedContent);
        } else if (article) {
            setTranslatedTitle(article.title);
            setTranslatedContent('');
        }
    }, [article, language]);

    const handleShare = async () => {
        const url = window.location.href;
        const shareData = {
            title: translatedTitle || article?.title || 'Dropsiders News',
            text: `Découvrez cet article sur Dropsiders : ${translatedTitle || article?.title}`,
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

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-bg">
                <div className="text-center px-4">
                    <h2 className="text-4xl font-display font-black text-white mb-8 tracking-tighter uppercase">{t('article_detail.not_found_title')}</h2>
                    <Link to="/" className="text-neon-red hover:text-white transition-colors font-black uppercase tracking-[0.3em] text-xs">
                        {t('article_detail.not_found_btn')}
                    </Link>
                </div>
            </div>
        );
    }

    const isInterview = article.category === 'Interview' || article.category === 'Interviews';
    const relatedArticles = newsData
        .filter(item => item.id !== article.id && item.category === article.category)
        .slice(0, 3);


    // Récupérer le contenu complet depuis les fichiers séparés
    const fullContent = article ? getNewsContent(article.id) : '';
    let rawContent = fullContent || (article as any).content || (article as any).summary || '';

    // Nettoyage robuste via DOMParser (identique à RecapDetail)
    const cleanHTML = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const selectorsToRemove = [
            '.jw-social-share',
            '.jw-news-page__meta',
            '.jw-news-page-pagination',
            '.jw-block-footer-content',
            'footer',
            '.jw-comment-module',
            '.jw-widget-newsletter',
            'iframe', // Vidéos gérées séparément
            '.jw-news-comments',
            '#jw-comments'
        ];

        selectorsToRemove.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Nettoyage spécifique images
        const images = doc.querySelectorAll('img, picture');
        images.forEach(img => img.remove());

        // Nettoyage H1 doublons
        const h1s = doc.querySelectorAll('h1');
        h1s.forEach(h1 => h1.remove());

        // Nettoyage style inline
        const centeredElements = doc.querySelectorAll('[style*="text-align: center"]');
        centeredElements.forEach(el => el.classList.add('text-center'));

        // Transformation des liens vides
        const emptyLinks = doc.querySelectorAll('a:empty');
        emptyLinks.forEach(link => link.remove());

        // Nettoyage texte spécifique résiduel
        let finalHtml = doc.body.innerHTML;

        // 1. Suppression des Emojis (Regex robuste)
        finalHtml = finalHtml.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{1F170}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '');

        // 2. Nettoyage des artefacts Webador et espaces
        finalHtml = finalHtml
            .replace(/&nbsp;/g, ' ')
            .replace(/<p>\s*<\/p>/gi, '')
            .replace(/Propulsé par Webador/gi, '')
            .replace(/Modifier cette page/gi, '')
            .replace(/Parts d'en Bossa/gi, "Playa d'en Bossa") // Correction commune
            .replace(/Æ/g, 'AE')
            .replace(/æ/g, 'ae')
            .replace(/ÔåÆ/g, '→') // Correction encodage flèches
            .replace(/┬▓/g, '²') // Correction encodage m²
            .replace(/├é/g, 'Â') // Correction encodage noms
            .replace(/├ä/g, 'Ä')
            .replace(/ÔÇô/g, '–');

        // Support Interviews
        if (isInterview) {
            finalHtml = finalHtml.replace(/<strong>(.*?)<\/strong>/g, '<span class="interview-q">$1</span>');
        }

        // Si le contenu n'a pas de balises P (cas des résumés simples), on l'enveloppe
        // pour que la lettrine puisse s'appliquer via le CSS (p:first-of-type)
        if (!finalHtml.includes('<p') && finalHtml.trim()) {
            finalHtml = `<p>${finalHtml}</p>`;
        }

        // Standardisation automatique (Premium tags)
        finalHtml = standardizeContent(finalHtml);

        return finalHtml;
    };

    const cleanedContent = cleanHTML(rawContent);

    // --- PREMIUM TEMPLATE (Anyma Style) ---
    if (article.category === 'News') {
        return (
            <ArticlePremiumTemplate
                article={article}
                content={cleanedContent}
                type="news"
                relatedArticles={relatedArticles}
            />
        );
    }

    const backLink = isInterview ? '/interviews' : '/news';
    const backText = isInterview ? t('article_detail.back_to_interviews') : t('article_detail.back_to_news');

    return (
        <div className="bg-dark-bg min-h-screen">
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

            {/* Hero Section */}
            <div className="relative h-[70vh] overflow-hidden">
                <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />

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
                                    to={backLink}
                                    className="inline-flex items-center gap-2 text-white/80 hover:text-neon-red transition-colors group"
                                    onMouseEnter={playHoverSound}
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-bold uppercase tracking-wider text-sm">{backText}</span>
                                </Link>

                                {/* Bouton Partager (Ajouté) */}
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
                                <span className="px-4 py-2 bg-neon-red rounded-full text-white font-black text-sm uppercase tracking-wider">
                                    {article.category}
                                </span>
                                <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {t('article_detail.read_time')}
                                </span>
                                <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-neon-red" />
                                    {new Date(article.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                {(article as any).images && (article as any).images.length > 1 && (
                                    <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-sm flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-neon-pink" />
                                        {(article as any).images.length} {t('galerie.photos_suffix')}
                                    </span>
                                )}
                            </div>

                            <h1
                                className="text-5xl md:text-7xl font-display font-black text-white mb-4 uppercase italic tracking-tighter leading-none drop-shadow-2xl"
                                dangerouslySetInnerHTML={{ __html: standardizeContent(translatedTitle || article.title) }}
                            />

                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 2. COLONNE ÉDITORIALE */}
            <main className="relative z-30 pb-32 -mt-10">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-dark-card border border-white/5 rounded-[2rem] p-8 md:p-12 lg:p-20 shadow-2xl backdrop-blur-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                            {/* CONTENU PRINCIPAL */}
                            <div className="lg:col-span-8">
                                {/* CORPS DE L'ARTICLE */}
                                <article
                                    className="article-body-premium w-full"
                                    dangerouslySetInnerHTML={{ __html: language === 'en' && translatedContent ? translatedContent : cleanedContent }}
                                />

                                {/* SECTION VIDÉO */}
                                {article.youtubeId && (
                                    <section className="mt-20 pt-20 border-t border-white/5">
                                        <h3 className="text-2xl font-display font-black text-white mb-10 tracking-tighter uppercase italic flex items-center gap-3">
                                            <Play className="w-8 h-8 text-neon-red" />
                                            {t('article_detail.video_title')}
                                        </h3>
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-3xl shadow-neon-red/5 animate-glow">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${article.youtubeId}?autoplay=0&rel=0&controls=1`}
                                                title={article.title}
                                                className="absolute top-0 left-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </section>
                                )}

                                {/* SECTION GALLERY / IMAGES */}
                                {!isInterview && (article as any).images && (article as any).images.length > 1 && (
                                    <section className="mt-20 pt-20 border-t border-white/5">
                                        <div className="relative mb-12 text-center">
                                            <h3 className="text-3xl font-display font-black text-white tracking-tighter uppercase italic flex items-center justify-center gap-3">
                                                <Camera className="w-8 h-8 text-neon-red" />
                                                {t('article_detail.gallery_title')}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {(article as any).images.map((img: string, idx: number) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    whileInView={{ opacity: 1, scale: 1 }}
                                                    viewport={{ once: true }}
                                                    onClick={() => setSelectedImage(img)}
                                                    className="aspect-square rounded-3xl overflow-hidden border border-white/10 relative group shadow-2xl cursor-zoom-in"
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`${t('common.gallery_alt')} ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-neon-red/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Retour Home */}
                                <div className="mt-24 pt-16 border-t border-white/5 flex justify-center">
                                    <Link
                                        to="/"
                                        className="group flex flex-col items-center gap-4 py-4"
                                        onMouseEnter={playHoverSound}
                                    >
                                        <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-300">
                                            <ArrowLeft className="w-6 h-6 text-white group-hover:text-black" />
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-gray-500 group-hover:text-white uppercase transition-colors">{t('article_detail.back_to_home')}</span>
                                    </Link>
                                </div>
                            </div>

                            {/* SIDEBAR - À LIRE AUSSI & NEWSLETTER */}
                            <aside className="lg:col-span-4 space-y-12">
                                <div className="sticky top-32 space-y-12">
                                    {/* À lire aussi */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-base font-display font-black text-white uppercase tracking-tighter mb-8 italic">{t('article_detail.related_title')}</h3>
                                        <div className="space-y-6">
                                            {relatedArticles.map(rel => (
                                                <Link key={rel.id} to={getArticleLink(rel)}
                                                    className="group block space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0"
                                                    onMouseEnter={playHoverSound}
                                                >
                                                    <div className="aspect-video rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/5">
                                                        <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black text-neon-red tracking-widest uppercase">{rel.category}</span>
                                                        <h4 className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors leading-snug uppercase tracking-tight line-clamp-2">
                                                            {rel.title}
                                                        </h4>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Newsletter Widget */}
                                    <div className="bg-gradient-to-br from-neon-red/10 to-neon-purple/10 border border-neon-red/20 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden">
                                        {/* Decorative glow */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-neon-red/20 blur-3xl rounded-full" />

                                        <div className="relative z-10 space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-neon-red/20 rounded-full flex items-center justify-center border border-neon-red/30">
                                                <svg className="w-8 h-8 text-neon-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
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

                                            <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-4">
                                                {t('article_detail.newsletter_count')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
