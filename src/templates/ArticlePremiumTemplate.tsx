import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, Play, Camera, Share2, Check, MapPin, X } from 'lucide-react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { standardizeContent as standardizeText } from '../utils/standardizer';
import { translateText, translateHTML } from '../utils/translate';
import '../styles/article-premium.css';

interface ArticlePremiumTemplateProps {
    article: any;
    content: string;
    type: 'news' | 'recap';
    relatedArticles?: any[];
}

const ArticlePremiumTemplate: React.FC<ArticlePremiumTemplateProps> = ({ article, content, type, relatedArticles = [] }) => {
    const { t, language } = useLanguage();
    const playHoverSound = useHoverSound();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Translation Stubs
    const [translatedTitle, setTranslatedTitle] = useState<string>('');
    const [translatedBody, setTranslatedBody] = useState<string>('');

    // Handle Translations
    useEffect(() => {
        if (article && language === 'en') {
            translateText(article.title, 'en').then(setTranslatedTitle);
            translateHTML(content, 'en').then(setTranslatedBody);
        } else {
            setTranslatedTitle(article.title);
            setTranslatedBody('');
        }
    }, [article, content, language]);

    const handleShare = async () => {
        const url = window.location.href;
        const shareData = {
            title: translatedTitle || article.title,
            text: `Découvrez cet article sur Dropsiders : ${translatedTitle || article.title}`,
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

    // Clean HTML Content (Remove existing Headers, Metadata to standardize structure)
    const cleanHTML = (html: string) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const selectorsToRemove = [
            '.jw-social-share',
            '.jw-news-page__meta',
            '.jw-news-page-pagination',
            '.jw-block-footer-content',
            'footer',
            '.jw-comment-module',
            '.jw-widget-newsletter',
            'iframe', // Videos handled separately
            '.jw-news-comments',
            '#jw-comments'
        ];

        selectorsToRemove.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Remove H1s as we render our own premium H1
        const h1s = doc.querySelectorAll('h1');
        h1s.forEach(h1 => h1.remove());

        // Remove Images if they are just duplicates of gallery/cover (optional, but safer to strip and re-render if needed)
        // But for body content, we might want to keep illustrative images... 
        // Anyma article has images inside content. 
        // User wants "Lock structural modifications... allowing only text and image content changes".
        // So we keep images in body.

        // Remove empty links
        doc.querySelectorAll('a:empty').forEach(link => link.remove());

        // Process Content
        let finalHtml = doc.body.innerHTML;

        // Clean Emojis and Artefacts
        finalHtml = finalHtml.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{1F170}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '');
        finalHtml = finalHtml
            .replace(/&nbsp;/g, ' ')
            .replace(/<p>\s*<\/p>/gi, '')
            .replace(/Propulsé par Webador/gi, '')
            .replace(/Modifier cette page/gi, '')
            .replace(/ÔåÆ/g, '→')
            .replace(/┬▓/g, '²')
            .replace(/├é/g, 'Â')
            .replace(/├ä/g, 'Ä')
            .replace(/ÔÇô/g, '–');

        // Apply Premium Standardizer (Keywords, Links)
        finalHtml = standardizeText(finalHtml);

        return finalHtml;
    };

    const displayContent = language === 'en' && translatedBody ? translatedBody : cleanHTML(content);
    const displayTitle = language === 'en' && translatedTitle ? translatedTitle : article.title;
    const backLink = type === 'recap' ? '/recaps' : '/news';
    const backText = type === 'recap' ? t('recap_detail.back_to_recaps') : t('article_detail.back_to_news');

    return (
        <div className="article-premium-wrapper min-h-screen pb-20">
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

            {/* --- HEADER STRIP (Anyma Style) --- */}
            <div className="jw-strip jw-strip--default jw-strip--style-color jw-strip--primary jw-strip--color-default jw-strip--padding-start">
                <div className="jw-strip__content-container">
                    {/* Navigation Back */}
                    <Link
                        to={backLink}
                        className="absolute top-8 left-8 flex items-center gap-2 text-white/60 hover:text-neon-red transition-colors group uppercase font-bold text-xs tracking-widest"
                        onMouseEnter={playHoverSound}
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {backText}
                    </Link>

                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/80 font-bold text-xs transition-all hover:border-neon-red/50 hover:text-white group"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copié !</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="w-3 h-3 group-hover:text-neon-red transition-colors" />
                                <span>Partager</span>
                            </>
                        )}
                    </button>

                    <div className="jw-strip__content jw-responsive pt-20">
                        <h1
                            className="jw-heading-130 heading__no-margin jw-news-page__heading-without-margin js-editor-open-settings"
                            dangerouslySetInnerHTML={{ __html: standardizeText(displayTitle) }}
                        />

                        <div className="jw-news-page__meta js-editor-open-settings">
                            {/* Badges */}
                            <span className="meta-badge">{article.category || (type === 'recap' ? 'Recap' : 'News')}</span>

                            {type === 'recap' && article.festival && (
                                <span className="meta-badge">{article.festival}</span>
                            )}

                            {/* Date */}
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-neon-red" />
                                {new Date(article.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>

                            {/* Location (for Recaps) */}
                            {type === 'recap' && article.location && (
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-neon-red" />
                                    {article.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT CONTAINER --- */}
            <div className="news-page-content-container">
                <div className="jw-block-element">

                    {/* Hero Image (if available) - Rendered as first image block */}
                    {article.image && (
                        <div className="jw-element-image jw-element-content jw-element-image-is-center pb-12">
                            <motion.img
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                src={article.image}
                                alt={article.title}
                                className="jw-element-image__image"
                            />
                        </div>
                    )}

                    {/* Content Body */}
                    <div
                        className="article-body-premium"
                        dangerouslySetInnerHTML={{ __html: displayContent }}
                    />

                    {/* --- EXTRA SECTIONS --- */}

                    {/* Video */}
                    {article.youtubeId && (
                        <div className="mt-16 mb-16">
                            <h3 className="text-2xl font-display font-black text-white mb-8 uppercase italic flex items-center justify-center gap-3">
                                <Play className="w-6 h-6 text-neon-red" />
                                {t('article_detail.video_title')}
                            </h3>
                            <div className="video-wrapper">
                                <iframe
                                    src={`https://www.youtube.com/embed/${article.youtubeId}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Gallery */}
                    {(article.images && article.images.length > 1) && (
                        <div className="mt-20">
                            <h3 className="text-3xl text-center mb-8 flex items-center justify-center gap-3">
                                <Camera className="w-8 h-8 text-neon-red" />
                                {t('article_detail.gallery_title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {article.images.map((img: string, idx: number) => (
                                    <div key={idx} className="cursor-pointer overflow-hidden rounded-xl shadow-lg border border-white/5 hover:border-neon-red/50 transition-all" onClick={() => setSelectedImage(img)}>
                                        <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- FOOTER / NEWSLETTER --- */}
            <div className="max-w-4xl mx-auto px-6 mt-20 border-t border-white/10 pt-16">
                {/* Newsletter */}
                <div className="bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/5 blur-[80px] rounded-full pointer-events-none" />
                    <h3 className="text-2xl font-display font-black uppercase mb-4">{t('article_detail.newsletter_title')}</h3>
                    <p className="text-gray-400 mb-8 max-w-lg mx-auto">{t('article_detail.newsletter_subtitle')}</p>
                    <NewsletterForm variant="compact" />
                </div>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                    <div className="mt-20">
                        <h3 className="text-xl font-display uppercase text-center mb-8 text-white/50">{t('article_detail.related_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedArticles.map(rel => (
                                <Link key={rel.id} to={type === 'recap' ? `/recaps/${rel.slug}` : `/news/${rel.slug}`} className="group block">
                                    <div className="aspect-video rounded-lg overflow-hidden mb-4 border border-white/10">
                                        <img src={rel.image} alt={rel.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    </div>
                                    <h4 className="text-sm font-bold uppercase transition-colors group-hover:text-neon-red">{rel.title}</h4>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticlePremiumTemplate;
