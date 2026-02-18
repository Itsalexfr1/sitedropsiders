import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, Play, Camera, Share2, Check, MapPin, X, Mail } from 'lucide-react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { standardizeContent as standardizeText } from '../utils/standardizer';
import { translateText, translateHTML } from '../utils/translate';
import { getArticleLink, getRecapLink } from '../utils/slugify';
import MDEditor from '@uiw/react-md-editor';
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
        const shareData: any = {
            title: translatedTitle || article.title,
            text: `Découvrez cet article sur Dropsiders : ${translatedTitle || article.title}`,
            url: url
        };

        try {
            if (article.image) {
                try {
                    const response = await fetch(article.image);
                    const blob = await response.blob();
                    const file = new File([blob], 'article.jpg', { type: blob.type });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        shareData.files = [file];
                    }
                } catch (e) {
                    console.warn("Sharing image failed", e);
                }
            }

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

    const isInterview = article.category === 'Interview' || article.category === 'Interviews';

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

        // Support Interviews (Bold questions)
        if (isInterview) {
            finalHtml = finalHtml.replace(/<strong>(.*?)<\/strong>/g, '<span class="interview-q">$1</span>');
        }

        return finalHtml;
    };

    const displayContent = language === 'en' && translatedBody ? translatedBody : cleanHTML(content);
    const displayTitle = language === 'en' && translatedTitle ? translatedTitle : article.title;
    const backLink = type === 'recap' ? '/recaps' : (isInterview ? '/interviews' : '/news');
    const backText = type === 'recap'
        ? t('recap_detail.back_to_recaps')
        : (isInterview ? t('article_detail.back_to_interviews') : t('article_detail.back_to_news'));

    // Calculate reading time
    const readingTime = Math.ceil(displayContent.split(/\s+/).length / 200);

    return (
        <div className="article-premium-wrapper">
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

            {/* --- HERO HEADER (Interview Style) --- */}
            <div className="relative h-[70vh] flex items-end justify-center overflow-hidden">
                {/* Background Image */}
                {article.image && (
                    <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 z-0"
                    >
                        <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-dark-bg/40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-90" />
                    </motion.div>
                )}

                {/* Content Overlay */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
                    <div className="flex justify-between items-end mb-8">
                        {/* Navigation Back */}
                        <Link
                            to={backLink}
                            className="flex items-center gap-2 text-white/80 hover:text-neon-red transition-colors group uppercase font-bold text-xs tracking-widest"
                            onMouseEnter={playHoverSound}
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {backText}
                        </Link>

                        {/* Sharing Actions */}
                        <div className="flex items-center gap-3">
                            {/* Twitter / X Share */}
                            <button
                                onClick={() => {
                                    const url = window.location.href;
                                    const text = `${translatedTitle || article.title} via @dropsiders`;
                                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                                }}
                                className="p-2 bg-white/10 hover:bg-[#1DA1F2]/20 backdrop-blur-md rounded-full border border-white/20 text-white transition-all hover:border-[#1DA1F2]/50 group"
                                title="Partager sur X"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current group-hover:text-[#1DA1F2] transition-colors">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </button>

                            {/* Main Share Button */}
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white font-bold text-xs transition-all hover:border-neon-red/50 group"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3 h-3 text-green-400" />
                                        <span className="text-green-400">Lien copié !</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-3 h-3 group-hover:text-neon-red transition-colors" />
                                        <span>Partager</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>

                    <div className="space-y-6">
                        {/* Meta Badges */}
                        <div className="flex flex-wrap gap-3">
                            <span className="px-4 py-2 bg-neon-red rounded-full text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-neon-red/20">
                                {article.category || (type === 'recap' ? 'Recap' : 'News')}
                            </span>
                            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-xs flex items-center gap-2 uppercase tracking-widest">
                                <Clock className="w-4 h-4 text-neon-red" />
                                {readingTime} MIN READ
                            </span>
                            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-xs flex items-center gap-2 uppercase tracking-widest">
                                {new Date(article.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            {type === 'recap' && article.location && (
                                <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-bold text-xs flex items-center gap-2 uppercase tracking-widest">
                                    <MapPin className="w-4 h-4 text-neon-red" />
                                    {article.location}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1
                            className="text-5xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl"
                            dangerouslySetInnerHTML={{ __html: standardizeText(displayTitle) }}
                        />
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT CONTAINER (8/4 GRID) --- */}
            <main className="relative z-20 pb-16 -mt-10">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="bg-dark-card border border-white/5 rounded-[2rem] p-8 md:p-12 lg:p-16 shadow-2xl backdrop-blur-md">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                            {/* LEFT COLUMN: Main Content (8 spans) */}
                            <div className="lg:col-span-8">
                                <div className="article-body-premium w-full">
                                    <MDEditor.Markdown
                                        source={displayContent}
                                        style={{ backgroundColor: 'transparent', color: 'inherit' }}
                                    />
                                </div>

                                {/* Video Section */}
                                {article.youtubeId && (
                                    <div className="mt-20 pt-20 border-t border-white/5">
                                        <h3 className="text-2xl font-display font-black text-white mb-10 uppercase italic flex items-center gap-3">
                                            <Play className="w-6 h-6 text-neon-red" />
                                            {t('article_detail.video_title')}
                                        </h3>
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-3xl shadow-neon-red/5">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${article.youtubeId}`}
                                                className="absolute top-0 left-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Gallery */}
                                {(article.images && article.images.length > 1) && (
                                    <div className="mt-20 pt-20 border-t border-white/5">
                                        <h3 className="text-2xl font-display font-black text-white mb-10 flex items-center gap-3 uppercase italic">
                                            <Camera className="w-8 h-8 text-neon-red" />
                                            {t('article_detail.gallery_title')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {article.images.map((img: string, idx: number) => (
                                                <div key={idx} className="aspect-video cursor-pointer overflow-hidden rounded-3xl border border-white/10 group shadow-2xl relative" onClick={() => setSelectedImage(img)}>
                                                    <div className="absolute inset-0 bg-black">
                                                        <img src={img} alt="" className="w-full h-full object-cover opacity-30 blur-md scale-110" />
                                                    </div>
                                                    <img src={img} alt="" className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Back Link Center */}
                                <div className="mt-16 pt-8 border-t border-white/5 flex justify-center">
                                    <Link
                                        to="/"
                                        className="group flex flex-col items-center gap-4 py-4"
                                        onMouseEnter={playHoverSound}
                                    >
                                        <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white transition-all duration-300">
                                            <ArrowLeft className="w-6 h-6 text-white group-hover:text-black" />
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-gray-500 group-hover:text-white uppercase transition-colors">{t('article_detail.back_to_home')}</span>
                                    </Link>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Sidebar (4 spans, Sticky) */}
                            <aside className="lg:col-span-4 space-y-12">
                                <div className="sticky top-32 space-y-12">
                                    {/* Related Articles */}
                                    {relatedArticles.length > 0 && (
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                            <h3 className="text-base font-display font-black text-white uppercase tracking-tighter mb-8 italic">
                                                {isInterview ? t('article_detail.other_interviews') : t('article_detail.related_title')}
                                            </h3>
                                            <div className="space-y-6">
                                                {relatedArticles.map(rel => (
                                                    <Link
                                                        key={rel.id}
                                                        to={type === 'recap' ? getRecapLink(rel) : getArticleLink(rel)}
                                                        className="group block space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0"
                                                        onMouseEnter={playHoverSound}
                                                    >
                                                        <div className="aspect-square rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/5">
                                                            <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <span className="text-[9px] font-black text-neon-red tracking-widest uppercase">
                                                                {rel.category || (type === 'recap' ? 'Recap' : 'News')}
                                                            </span>
                                                            <h4 className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors leading-snug uppercase tracking-tight line-clamp-2">
                                                                {rel.title}
                                                            </h4>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Newsletter Widget (Interview Style) */}
                                    <div className="bg-gradient-to-br from-neon-red/10 to-neon-purple/10 border border-neon-red/20 rounded-2xl p-8 text-center space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-neon-red/20 blur-3xl rounded-full" />
                                        <div className="relative z-10 space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-neon-red/20 rounded-full flex items-center justify-center border border-neon-red/30">
                                                <Mail className="w-8 h-8 text-neon-red" />
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
                </div >
            </main >
        </div >
    );
};

export default ArticlePremiumTemplate;
