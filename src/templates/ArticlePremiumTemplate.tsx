import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight, Play, Camera, Share2, Check, MapPin, X, Mail, Edit2 } from 'lucide-react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { standardizeContent as standardizeText } from '../utils/standardizer';
import { translateText, translateHTML } from '../utils/translate';
import { getArticleLink, getRecapLink } from '../utils/slugify';
import '../styles/article-premium.css';


interface ArticlePremiumTemplateProps {
    article: any;
    content: string;
    type: 'news' | 'recap';
    relatedArticles?: any[];
    previousArticle?: any;
    nextArticle?: any;
}

const ArticlePremiumTemplate: React.FC<ArticlePremiumTemplateProps> = ({ article, content, type, relatedArticles = [], previousArticle, nextArticle }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const playHoverSound = useHoverSound();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [team, setTeam] = useState<any[]>([]);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
        const fetchTeam = async () => {
            try {
                const res = await fetch('/api/team');
                if (res.ok) setTeam(await res.json());
            } catch (e) {
                console.error("Error fetching team:", e);
            }
        };
        fetchTeam();
    }, []);

    const getAuthorInsta = (authorName: string) => {
        if (!authorName) return null;
        const normalized = authorName.trim().toLowerCase();
        const member = team.find(m =>
            m.name.trim().toLowerCase() === normalized ||
            normalized.includes(m.name.trim().toLowerCase()) ||
            m.name.trim().toLowerCase().includes(normalized)
        );
        return member?.socials?.instagram && member.socials.instagram !== '#' ? member.socials.instagram : null;
    };

    const handleEdit = () => {
        const isInterview = article.category === 'Interview' || article.category === 'Interviews';
        const editPath = (type === 'recap' ? `/recaps/create?id=${article.id}` : (isInterview ? `/news/create?type=Interview&id=${article.id}` : `/news/create?id=${article.id}`));
        // Inclure le contenu complet dans l'objet item passé à l'éditeur
        const itemWithContent = { ...article, content: content };
        navigate(editPath, { state: { isEditing: true, item: itemWithContent } });
    };

    // Translation states
    const [translatedTitle, setTranslatedTitle] = useState<string>('');
    const [translatedBody, setTranslatedBody] = useState<string>('');
    const [translatedRelatedTitles, setTranslatedRelatedTitles] = useState<Record<number, string>>({});
    const [translatedPrevTitle, setTranslatedPrevTitle] = useState<string>('');
    const [translatedNextTitle, setTranslatedNextTitle] = useState<string>('');

    // Handle Translations
    useEffect(() => {
        if (language === 'en') {
            // Translate main article
            if (article) {
                translateText(article.title, 'en').then(setTranslatedTitle);
                translateHTML(content, 'en').then(setTranslatedBody);
            }

            // Translate related articles
            if (relatedArticles.length > 0) {
                Promise.all(
                    relatedArticles.map((rel: any) =>
                        translateText(rel.title, 'en').then(translated => ({ id: rel.id, title: translated }))
                    )
                ).then(results => {
                    const titleMap: Record<number, string> = {};
                    results.forEach((res: any) => {
                        titleMap[res.id] = res.title;
                    });
                    setTranslatedRelatedTitles(titleMap);
                });
            }

            // Translate navigation articles
            if (previousArticle) {
                translateText(previousArticle.title, 'en').then(setTranslatedPrevTitle);
            }
            if (nextArticle) {
                translateText(nextArticle.title, 'en').then(setTranslatedNextTitle);
            }

        } else {
            setTranslatedTitle(article?.title || '');
            setTranslatedBody('');
            setTranslatedRelatedTitles({});
            setTranslatedPrevTitle('');
            setTranslatedNextTitle('');
        }
    }, [article, content, language, relatedArticles, previousArticle, nextArticle]);

    const shareText = `Découvrez cet article sur Dropsiders : ${translatedTitle || article.title}`;
    const shareUrl = window.location.href;

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        x: `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: translatedTitle || article.title,
                    text: shareText,
                    url: shareUrl
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
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
            // 'iframe', // REMOVED - We want to allow iframes for YouTube widgets
            '.jw-news-comments',
            '#jw-comments'
        ];

        selectorsToRemove.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Specific iframe handling: only remove if they are NOT inside our premium wrappers
        // OR if they are from a trusted source (YouTube, Spotify, Beatport)
        doc.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.src || '';
            const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

            // On laisse les vidéos YouTube dans le contenu si l'utilisateur en a ajouté
            // Elles cohabiteront avec la vidéo principale de l'article.

            const isInsidePremium =
                iframe.closest('.youtube-player-wrapper') ||
                iframe.closest('.youtube-player-widget') ||
                iframe.closest('.music-top-item-premium') ||
                iframe.closest('.music-top-section');

            const isTrustedSource =
                isYouTube ||
                src.includes('spotify.com') ||
                src.includes('beatport.com');

            if (!isInsidePremium && isTrustedSource) {
                // It's a manual link we want to keep. 
                // Let's wrap it to make it look good and responsive
                const wrapper = doc.createElement('div');
                if (isYouTube) {
                    wrapper.className = 'youtube-player-widget w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 my-12';
                    iframe.classList.add('absolute', 'top-0', 'left-0', 'w-full', 'h-full');
                } else if (src.includes('spotify.com')) {
                    wrapper.className = 'spotify-player-widget w-full my-8 rounded-2xl overflow-hidden border border-white/10';
                    iframe.setAttribute('width', '100%');
                    iframe.setAttribute('height', '152');
                } else {
                    wrapper.className = 'media-player-widget w-full my-8 rounded-2xl overflow-hidden border border-white/10';
                }

                iframe.parentNode?.insertBefore(wrapper, iframe);
                wrapper.appendChild(iframe);
            } else if (!isInsidePremium) {
                iframe.remove();
            }
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

        // Clean "Publié le" date strings often found at the top of imported articles
        finalHtml = finalHtml.replace(/Publi[eé] le \d{1,2} (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4} à \d{2}:\d{2}/gi, '');

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
            .replace(/ÔÇô/g, '–')
            .replace(/Ã‚/g, '') // Remove weird ghost 'A'
            .replace(/Ã /g, 'à')
            .replace(/Ã©/g, 'é')
            .replace(/Ã¨/g, 'è')
            .replace(/Ãª/g, 'ê')
            .replace(/Ã§/g, 'ç');

        // Apply Premium Standardizer (Keywords, Links)
        finalHtml = standardizeText(finalHtml);

        // Support Interviews (Bold questions)
        if (isInterview) {
            finalHtml = finalHtml.replace(/<strong>(.*?)<\/strong>/g, '<span class="interview-q">$1</span>');
        }

        return finalHtml;
    };

    let displayContent = language === 'en' && translatedBody ? cleanHTML(translatedBody) : cleanHTML(content);
    const isMusic = article.category === 'Musique' || article.category === 'Music';

    // Support Top Lists for Music Category
    if (isMusic) {
        // Wrap numbers at start of tags (h2, h3, p) in a span for special styling
        // Matches "1.", "2.", "10:", etc. at the beginning of a section
        displayContent = displayContent.replace(/(<(h2|h3|p)[^>]*>)\s*(\d+[.:])\s*/gi, '$1<span class="music-number">$3</span> ');
    }

    // Lightbox for content images
    useEffect(() => {
        const contentArea = document.querySelector('.article-body-premium');
        if (!contentArea) return;

        const handleImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Only trigger if it's an image and not already inside a clickable element (though we want it even there)
            if (target.tagName === 'IMG') {
                const src = (target as HTMLImageElement).src;
                if (src) setSelectedImage(src);
            }
        };

        contentArea.addEventListener('click', handleImageClick as any);
        return () => contentArea.removeEventListener('click', handleImageClick as any);
    }, [displayContent]);

    const displayTitle = language === 'en' && translatedTitle ? translatedTitle : article.title;
    const backLink = type === 'recap' ? '/recaps' : (isInterview ? '/interviews' : '/news');
    const backText = type === 'recap'
        ? t('recap_detail.back_to_recaps')
        : (isInterview ? t('article_detail.back_to_interviews') : t('article_detail.back_to_news'));

    // Calculate reading time
    const readingTime = Math.ceil(displayContent.split(/\s+/).length / 200);


    return (
        <div className={`article-premium-wrapper ${type === 'recap' ? 'article-type-recap' : isInterview ? 'article-type-interview' : isMusic ? 'article-type-music' : 'article-type-news'}`}>
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
            <div className="relative h-[50vh] md:h-[70vh] flex items-end justify-center overflow-hidden">
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
                <div className="relative z-10 max-w-full mx-auto px-6 lg:px-12 xl:px-16 2xl:px-24 pb-16 w-full">
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

                        {/* Admin & Sharing Actions */}
                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-4 py-3 bg-neon-cyan/20 hover:bg-neon-cyan/30 backdrop-blur-md rounded-2xl border border-neon-cyan/50 text-neon-cyan font-bold text-[10px] transition-all group"
                                >
                                    <Edit2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    <span>MODIFIER</span>
                                </button>
                            )}

                            {/* Social Share Group */}
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
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

                                {/* WhatsApp */}
                                <a
                                    href={shareLinks.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                    title="Partager sur WhatsApp"
                                >
                                    <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
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

                    <div className="space-y-6">
                        {/* Meta Badges */}
                        <div className="flex flex-wrap gap-2">
                            <span className={`px-5 py-2 rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-lg ${article.isFocus
                                ? 'bg-yellow-500 shadow-yellow-500/20'
                                : (article.category || '').toLowerCase() === 'musique'
                                    ? 'bg-neon-green shadow-neon-green/20'
                                    : 'bg-neon-red shadow-neon-red/20'
                                }`}>
                                {article.isFocus ? t('article_detail.focus').toUpperCase() : (article.category || (type === 'recap' ? 'Recap' : 'News'))}
                            </span>
                            <span className="px-5 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5 text-neon-red" />
                                {readingTime} {t('common.min_read')}
                            </span>
                            <span className="px-5 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest">
                                {new Date(article.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            {article.author && (
                                getAuthorInsta(article.author) ? (
                                    <a
                                        href={getAuthorInsta(article.author)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all group/author"
                                    >
                                        <svg className="w-3 h-3 text-neon-red flex-shrink-0 group-hover/author:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                                        {article.author}
                                    </a>
                                ) : (
                                    <span className="px-5 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest">
                                        <svg className="w-3 h-3 text-neon-red flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                                        {article.author}
                                    </span>
                                )
                            )}
                            {type === 'recap' && article.location && (
                                <span className="px-5 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/70 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest">
                                    <MapPin className="w-3.5 h-3.5 text-neon-red" />
                                    {article.location}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1
                            className="text-5xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl premium-h1"
                            dangerouslySetInnerHTML={{ __html: standardizeText(displayTitle) }}
                        />
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT CONTAINER (8/4 GRID) --- */}
            <main className="relative z-20 pb-16 -mt-10">
                <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24">
                    <div className="bg-dark-card border border-white/5 rounded-[2rem] p-6 md:p-10 lg:p-12 shadow-2xl backdrop-blur-md">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                            {/* LEFT COLUMN: Main Content (9 spans) */}
                            <div className="lg:col-span-9">
                                <div
                                    className="article-body-premium w-full"
                                    dangerouslySetInnerHTML={{ __html: displayContent }}
                                />

                                {/* Video Section - High Priority for Recap/Interview */}
                                {article.youtubeId && (
                                    <div className="mt-16 mb-16">
                                        <h3 className="text-3xl font-display font-black text-white mb-10 uppercase italic flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-2xl bg-neon-red/10 flex items-center justify-center border border-neon-red/30 group-hover:bg-neon-red/20 transition-all">
                                                <Play className="w-6 h-6 text-neon-red fill-neon-red animate-pulse" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-neon-red text-[10px] tracking-[0.4em] font-black mb-1">{t('article_detail.video_subtitle') || 'A NE PAS MANQUER'}</span>
                                                {t('article_detail.video_title')}
                                            </div>
                                        </h3>
                                        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,0,51,0.15)] group">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${article.youtubeId}`}
                                                className="absolute top-0 left-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Gallery - Show for all except specifically requested exclusions */}
                                {(article.images && article.images.length > 1 && type === 'recap') && (
                                    <div className="mt-20 pt-20 border-t border-white/5">
                                        <h3 className="text-2xl font-display font-black text-neon-red mb-10 flex items-center gap-3 uppercase italic">
                                            <Camera className="w-8 h-8 text-neon-red" />
                                            {t('article_detail.gallery_title')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {/* Skip first image as it's the cover */}
                                            {article.images.slice(1).map((img: string, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="aspect-square cursor-pointer overflow-hidden rounded-3xl border border-white/10 group shadow-2xl bg-black relative"
                                                    onClick={() => setSelectedImage(img)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Previous / Next Buttons */}
                                {(previousArticle || nextArticle) && (
                                    <div className="mt-16 pt-16 border-t border-white/5 grid grid-cols-2 gap-8">
                                        <div className="flex justify-start">
                                            {previousArticle && (
                                                <Link
                                                    to={type === 'recap' ? getRecapLink(previousArticle) : getArticleLink(previousArticle)}
                                                    className="group flex flex-col items-start gap-3 max-w-[150px]"
                                                    onMouseEnter={playHoverSound}
                                                >
                                                    <span className="text-[10px] font-black text-neon-red tracking-[0.2em] uppercase">{t('article_detail.previous')}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-neon-red group-hover:border-neon-red transition-all">
                                                            <ArrowLeft className="w-3 h-3 text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors line-clamp-1 uppercase">{translatedPrevTitle || previousArticle.title}</span>
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            {nextArticle && (
                                                <Link
                                                    to={type === 'recap' ? getRecapLink(nextArticle) : getArticleLink(nextArticle)}
                                                    className="group flex flex-col items-end gap-3 max-w-[150px]"
                                                    onMouseEnter={playHoverSound}
                                                >
                                                    <span className="text-[10px] font-black text-neon-red tracking-[0.2em] uppercase">{t('article_detail.next')}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors line-clamp-1 uppercase text-right">{translatedNextTitle || nextArticle.title}</span>
                                                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-neon-red group-hover:border-neon-red transition-all">
                                                            <ArrowRight className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}
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

                            {/* RIGHT COLUMN: Sidebar (3 spans, Sticky) */}
                            <aside className="lg:col-span-3 space-y-8">
                                <div className="sticky top-20 space-y-8">
                                    {/* Related Articles */}
                                    {relatedArticles.length > 0 && (
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                            {/* Titre fixé en haut, hors du scroll */}
                                            <div className="px-6 pt-4 pb-3 border-b border-white/5">
                                                <h3 className="text-base font-display font-black text-neon-red uppercase tracking-tighter italic text-center">
                                                    {isInterview ? t('article_detail.other_interviews') : t('article_detail.related_title')}
                                                </h3>
                                            </div>
                                            {/* Liste scrollable */}
                                            <div className="space-y-0 max-h-[460px] overflow-y-auto custom-scrollbar scroll-smooth snap-y snap-mandatory related-articles-container">
                                                {relatedArticles.map(rel => (
                                                    <Link
                                                        key={rel.id}
                                                        to={type === 'recap' ? getRecapLink(rel) : getArticleLink(rel)}
                                                        className="group flex flex-col items-center text-center gap-1 px-6 py-4 border-b border-white/5 last:border-0 snap-start hover:bg-white/[0.03] transition-colors"
                                                        onMouseEnter={playHoverSound}
                                                    >
                                                        <span className="text-[9px] font-black text-neon-red tracking-widest uppercase">
                                                            {rel.category || (type === 'recap' ? 'Recap' : 'News')}
                                                        </span>
                                                        <h4 className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors leading-snug uppercase tracking-tight line-clamp-2 italic">
                                                            {translatedRelatedTitles[rel.id] || rel.title}
                                                        </h4>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Newsletter Widget (Interview Style) */}
                                    <div className="bg-gradient-to-br from-neon-red/10 to-neon-purple/10 border border-neon-red/20 rounded-2xl px-5 py-6 text-center space-y-4 relative overflow-hidden origin-top newsletter-sidebar-compact">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-neon-red/20 blur-3xl rounded-full" />
                                        <div className="relative z-10 space-y-2">
                                            <div className="w-10 h-10 mx-auto bg-neon-red/20 rounded-full flex items-center justify-center border border-neon-red/30">
                                                <Mail className="w-5 h-5 text-neon-red" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-display font-black text-white uppercase italic tracking-tight" dangerouslySetInnerHTML={{ __html: t('article_detail.newsletter_title') }} />
                                                <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-relaxed">
                                                    {t('article_detail.newsletter_subtitle')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <NewsletterForm variant="compact" />
                                            </div>
                                            <p className="text-[8px] text-gray-600 uppercase tracking-widest mt-1">
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
