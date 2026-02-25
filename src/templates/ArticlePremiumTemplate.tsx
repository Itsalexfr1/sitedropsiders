import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight, Play, Camera, Share2, Check, MapPin, X, Mail, Edit2, Instagram, Facebook, Globe, Youtube, Link2 } from 'lucide-react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { standardizeContent as standardizeText } from '../utils/standardizer';
import { translateText, translateHTML } from '../utils/translate';
import { getArticleLink, getRecapLink } from '../utils/slugify';
import '../styles/article-premium.css';

// Custom Icons for Official Brands
const TikTokIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
    </svg>
);

const SpotifyIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.4-2.1-10.6-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.7-1.1 8.7-.6 11.8 1.3.2.2.3.5.1.8zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-2-8.2-2.6-12-1.4-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 4.4-1.3 9.9-.7 13.6 1.6.3.3.4.8.1 1zM19.2 10.6c-3.9-2.3-10.3-2.5-14.1-1.4-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 4.3-1.3 11.4-1.1 16 1.6.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4v.1z" />
    </svg>
);

const SoundCloudIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M1 14.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5S1 15.33 1 14.5zm3.5.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm2 0c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm2 0c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm2 .5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm11.5-2c-.12 0-.25.01-.37.03-.43-1.74-2-3.03-3.88-3.03-.31 0-.61.04-.9.11-.64-1.63-2.23-2.77-4.1-2.77-.18 0-.36.01-.53.03C12.44 6.13 10.87 5 9 5c-.32 0-.63.04-.92.11C7.43 3.96 6.04 3 4.5 3c-.1 0-.19 0-.29.01C3.79 1.28 2.05 0 0 0v24h24c.55 0 1-.45 1-1s-.45-1-1-1h-6.2c.11-.32.2-.65.2-1 0-1.66-1.34-3-3-3s-3 1.34-3 3c0 .35.09.68.2 1H2z" />
    </svg>
);

const BeatportIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.237 0a9.074 9.074 0 0 1 1.708.157c.548.106.945.454.945.832 0 .341-.336.634-.841.733-.284.053-.594.08-.888.08-2.603 0-4.634.426-6.177 1.309-1.31.734-2.123 1.942-2.583 3.864-.173.746-.226 1.385-.226 2.662 0 1.144.053 1.838.2 2.608.28 1.411.85 2.502 1.748 3.328.7.64 1.763 1.09 3.033 1.31 1.542.266 3.033.2 4.5-.18a12.18 12.18 0 0 0 4.095-1.922c1.085-.758 1.594-1.185 1.874-1.571.24-.319.31-.559.31-.958s-.07-.64-.31-.958c-.28-.386-.79-1.011-1.874-1.78a12.18 12.18 0 0 0-4.095-1.922c-1.467-.38-2.958-.452-4.5-.18-1.27.227-2.333.67-3.033 1.31-.898.826-1.468 1.917-1.748 3.328-.147.77-.2 1.464-.2 2.608 0 1.277.053 1.916.226 2.662.46 1.922 1.273 3.13 2.583 3.864 1.543.883 3.574 1.309 6.177 1.309.294 0 .604.027.888.08a.952.952 0 0 1 .841.733c0 .378-.397.726-.945.832a9.073 9.073 0 0 1-1.708.157z" />
    </svg>
);

const XIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);


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
            finalHtml = finalHtml.replace(/<strong([^>]*)>(.*?)<\/strong>/gi, '<span class="interview-q" $1>$2</span>');
        }

        return finalHtml;
    };

    const platformIcons: Record<string, any> = {
        website: Globe,
        instagram: Instagram,
        tiktok: TikTokIcon,
        youtube: Youtube,
        facebook: Facebook,
        x: XIcon,
        twitter: XIcon,
        spotify: SpotifyIcon,
        soundcloud: SoundCloudIcon,
        beatport: BeatportIcon
    };

    const processContent = (html: string) => {
        if (!html) return { cleanHtml: '', socials: [], artistLabel: "L'ARTISTE", festivalSocials: [], festivalLabel: "LE FESTIVAL" };
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const socialsContainer = doc.querySelector('.artist-socials-premium');
        let socials: { platform: string, url: string }[] = [];
        let artistLabel = "L'ARTISTE";
        if (socialsContainer) {
            const h3 = socialsContainer.querySelector('h3');
            if (h3) {
                artistLabel = h3.textContent?.replace(/SUIVEZ\s+/i, '').trim() || "L'ARTISTE";
            }
            socials = Array.from(socialsContainer.querySelectorAll('a')).map(a => ({
                platform: a.getAttribute('data-platform') || '',
                url: a.getAttribute('href') || ''
            }));
            socialsContainer.remove();
        }

        const festSocialsContainer = doc.querySelector('.festival-socials-premium');
        let festivalSocials: { platform: string, url: string }[] = [];
        let festivalLabel = "LE FESTIVAL";
        if (festSocialsContainer) {
            const h3 = festSocialsContainer.querySelector('h3');
            if (h3) {
                festivalLabel = h3.textContent?.replace(/SUIVEZ\s+/i, '').trim() || "LE FESTIVAL";
            }
            festivalSocials = Array.from(festSocialsContainer.querySelectorAll('a')).map(a => ({
                platform: a.getAttribute('data-platform') || '',
                url: a.getAttribute('href') || ''
            }));
            festSocialsContainer.remove();
        }

        return { cleanHtml: doc.body.innerHTML, socials, artistLabel, festivalSocials, festivalLabel };
    };

    const rawDisplayContent = language === 'en' && translatedBody ? cleanHTML(translatedBody) : cleanHTML(content);
    const processedContent = processContent(rawDisplayContent);
    let displayContent = processedContent.cleanHtml;
    const artistSocials = processedContent.socials;
    const artistLabel = processedContent.artistLabel;
    const festivalSocials = processedContent.festivalSocials;
    const festivalLabel = processedContent.festivalLabel;
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


    const getThumbUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('cloudinary.com')) {
            // Add face-centered square crop if it's a Cloudinary URL
            return url.replace('/upload/', '/upload/ar_1:1,c_fill,g_auto,w_200/');
        }
        return url;
    };

    return (
        <div className={`min-h-screen bg-dark-bg selection:bg-neon-red selection:text-white ${type === 'recap' ? 'article-type-recap' : isInterview ? 'article-type-interview' : isMusic ? 'article-type-music' : 'article-type-news'}`}>
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
                                    <span>{t('admin.modify')}</span>
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
                                            <span className="text-green-400">{t('article_detail.copied_btn')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-3.5 h-3.5 group-hover:text-neon-red transition-colors" />
                                            <span>{t('article_detail.share_btn')}</span>
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
                        {!isInterview && (
                            <h1
                                className="text-5xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl premium-h1"
                                dangerouslySetInnerHTML={{ __html: standardizeText(displayTitle) }}
                            />
                        )}
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

                                {artistSocials && artistSocials.length > 0 && (
                                    <div className="artist-socials-premium mt-12 pt-8 border-t border-white/10">
                                        <div className="flex flex-col items-center mb-8">
                                            <div className="inline-block px-4 py-2 bg-neon-red/10 border border-neon-red/20 rounded-lg group/label relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/label:translate-x-full transition-transform duration-1000" />
                                                <h3 className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] relative z-10">
                                                    SUIVEZ {artistLabel}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {artistSocials.map((social, idx) => {
                                                const Icon = platformIcons[social.platform] || Link2;
                                                return (
                                                    <a
                                                        key={idx}
                                                        href={social.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group hover:border-neon-red/50 hover:shadow-[0_0_20px_rgba(255,18,65,0.2)]"
                                                    >
                                                        <Icon className="w-4 h-4 text-neon-red group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{social.platform}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {festivalSocials && festivalSocials.length > 0 && (
                                    <div className="festival-socials-premium mt-12 pt-8 border-t border-white/10">
                                        <div className="flex flex-col items-center mb-8">
                                            <div className="inline-block px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg group/label relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/label:translate-x-full transition-transform duration-1000" />
                                                <h3 className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.3em] relative z-10">
                                                    SUIVEZ {festivalLabel}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {festivalSocials.map((social, idx) => {
                                                const Icon = platformIcons[social.platform] || Link2;
                                                return (
                                                    <a
                                                        key={idx}
                                                        href={social.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group hover:border-neon-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                                                    >
                                                        <Icon className="w-4 h-4 text-neon-cyan group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{social.platform}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}



                                {/* Video Section - High Priority for Recap/Interview */}
                                {article.youtubeId &&
                                    (article.category === 'Interview' || article.category === 'Interviews' ? article.showVideo === true : article.showVideo !== false) &&
                                    article.category !== 'Interview Video' && (
                                        <div className="mt-16 mb-16">
                                            <h3 className="text-3xl font-display font-black text-white mb-10 uppercase italic flex items-center gap-4 group">
                                                <div className="w-12 h-12 rounded-2xl bg-neon-red/10 flex items-center justify-center border border-neon-red/30 group-hover:bg-neon-red/20 transition-all">
                                                    <Play className="w-6 h-6 text-neon-red fill-neon-red animate-pulse" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-neon-red text-[10px] tracking-[0.4em] font-black mb-1">{t('article_detail.must_watch')}</span>
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
                                    <div className="mt-16 pt-16 border-t border-white/5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {/* Précédent */}
                                            <div>
                                                {previousArticle ? (
                                                    <Link
                                                        to={type === 'recap' ? getRecapLink(previousArticle) : getArticleLink(previousArticle)}
                                                        className="group flex flex-col gap-4 p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-neon-red/40 hover:bg-neon-red/5 transition-all duration-300"
                                                        onMouseEnter={playHoverSound}
                                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                    >
                                                        <span className="text-[10px] font-black text-neon-red tracking-[0.2em] uppercase flex items-center gap-2">
                                                            <ArrowLeft className="w-3 h-3" /> {t('article_detail.previous')}
                                                        </span>
                                                        <div className="flex items-center gap-4">
                                                            {previousArticle.image && (
                                                                <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                                                    <img
                                                                        src={getThumbUrl(previousArticle.image)}
                                                                        alt=""
                                                                        className="w-full h-full object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-500"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{previousArticle.category}</span>
                                                                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors line-clamp-2 uppercase leading-tight">{translatedPrevTitle || previousArticle.title}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ) : <div />}
                                            </div>

                                            {/* Suivant */}
                                            <div>
                                                {nextArticle ? (
                                                    <Link
                                                        to={type === 'recap' ? getRecapLink(nextArticle) : getArticleLink(nextArticle)}
                                                        className="group flex flex-col gap-4 p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-neon-red/40 hover:bg-neon-red/5 transition-all duration-300"
                                                        onMouseEnter={playHoverSound}
                                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                    >
                                                        <span className="text-[10px] font-black text-neon-red tracking-[0.2em] uppercase flex items-center justify-end gap-2">
                                                            {t('article_detail.next')} <ArrowRight className="w-3 h-3" />
                                                        </span>
                                                        <div className="flex items-center gap-4 flex-row-reverse">
                                                            {nextArticle.image && (
                                                                <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                                                    <img
                                                                        src={getThumbUrl(nextArticle.image)}
                                                                        alt=""
                                                                        className="w-full h-full object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-500"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-1 min-w-0 text-right">
                                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{nextArticle.category}</span>
                                                                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors line-clamp-2 uppercase leading-tight">{translatedNextTitle || nextArticle.title}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ) : <div />}
                                            </div>
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
