import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight, Play, Camera, Share2, Check, MapPin, X, Edit2, Instagram, Facebook, Globe, Youtube, Link2 } from 'lucide-react';
import { useHoverSound } from '../hooks/useHoverSound';
import { useLanguage } from '../context/LanguageContext';
import { standardizeContent as standardizeText } from '../utils/standardizer';
import { translateText, translateHTML } from '../utils/translate';
import { getArticleLink, getRecapLink } from '../utils/slugify';
import { resolveImageUrl } from '../utils/image';
import { ArticleReader } from '../components/widgets/ArticleReader';
import settings from '../data/settings.json';
import '../styles/article-premium.css';

const extractId = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/))([\w-]{11})/);
    return match ? match[1] : url.trim();
};

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
        <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z" />
    </svg>
);

const BeatportIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M21.429 17.055a7.114 7.114 0 0 1-.794 3.246 6.917 6.917 0 0 1-2.181 2.492 6.698 6.698 0 0 1-3.063 1.163 6.653 6.653 0 0 1-3.239-.434 6.796 6.796 0 0 1-2.668-1.932 7.03 7.03 0 0 1-1.481-2.983 7.124 7.124 0 0 1 .049-3.345 7.015 7.015 0 0 1 1.566-2.937l-4.626 4.73-2.421-2.479 5.201-5.265a3.791 3.791 0 0 0 1.066-2.675V0h3.41v6.613a7.172 7.172 0 0 1-.519 2.794 7.02 7.02 0 0 1-1.559 2.353l-.153.156a6.768 6.768 0 0 1 3.49-1.725 6.687 6.687 0 0 1 3.845.5 6.873 6.873 0 0 1 2.959 2.564 7.118 7.118 0 0 1 1.118 3.8Zm-3.089 0a3.89 3.89 0 0 0-.611-2.133 3.752 3.752 0 0 0-1.666-1.424 3.65 3.65 0 0 0-2.158-.233 3.704 3.704 0 0 0-1.92 1.037 3.852 3.852 0 0 0-1.031 1.955 3.908 3.908 0 0 0 .205 2.213c.282.7.76 1.299 1.374 1.721a3.672 3.672 0 0 0 2.076.647 3.637 3.637 0 0 0 2.635-1.096c.347-.351.622-.77.81-1.231.188-.461.285-.956.286-1.456Z" />
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
    isLoading?: boolean;
}

const ArticlePremiumTemplate: React.FC<ArticlePremiumTemplateProps> = ({ article, content, type, relatedArticles = [], previousArticle, nextArticle, isLoading }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const playHoverSound = useHoverSound();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [team, setTeam] = useState<any[]>([]);
    const [siteSocials, setSiteSocials] = useState<any>((settings as any).socials || {});

    useEffect(() => {
        setIsAdmin(localStorage.getItem('admin_auth') === 'true');
        const fetchData = async () => {
            try {
                const teamRes = await fetch('/api/team');
                if (teamRes.ok) setTeam(await teamRes.json());

                const settingsRes = await fetch('/api/settings');
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    if (data.socials) setSiteSocials(data.socials);
                }
            } catch (e: any) {
                console.error("Error fetching data:", e);
            }
        };
        fetchData();
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
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        if (language === 'en') {
            setIsTranslating(true);
            // Translate main article
            if (article) {
                translateText(article.title, 'en').then(setTranslatedTitle);
                translateHTML(content, 'en').then((translated) => {
                    setTranslatedBody(translated);
                    setIsTranslating(false);
                });
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
            setIsTranslating(false);
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
        instagram: `https://www.instagram.com/${(siteSocials.instagram || 'dropsiders.fr').replace('@', '')}/`
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
        } catch (err: any) {
            console.error('Error sharing:', err);
            // Fallback for desktop if navigator.share fails or is not present
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleInstagramShare = async () => {
        // Preference for Story/Publication: try native share first (best for mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: translatedTitle || article.title,
                    text: shareText,
                    url: shareUrl
                });
                return;
            } catch (err: any) {
                console.error('Share failed', err);
            }
        }

        // Fallback for desktop or failed share: Copy link and Notify
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            // On pourrait aussi ouvrir Instagram, mais copier le lien est plus utile pour les Stories
            window.open(`https://www.instagram.com/`, '_blank');
        } catch (err: any) {
            window.open(shareLinks.instagram, '_blank');
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

        // Normalize All Images in Content
        doc.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src') || '';
            if (src) {
                // Use the ultra-safe resolveImageUrl utility for all body images
                const resolvedSrc = resolveImageUrl(src);
                img.setAttribute('src', resolvedSrc);
                
                // Add styling and loading attributes
                img.loading = 'lazy';
                img.classList.add('premium-body-img');
            }
        });

        // Specific iframe handling: only remove if they are NOT inside our premium wrappers
        // OR if they are from a trusted source (YouTube, Spotify, Beatport)
        doc.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.src || '';
            const isYouTube = src.includes('youtube.com') || src.includes('youtu.be') || src.includes('youtube-nocookie.com');

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

        // Remove links with data-href-template (legacy share links)
        doc.querySelectorAll('a[data-href-template]').forEach(link => {
            const parent = link.parentElement;
            link.remove();
            if (parent && parent.children.length === 0 && parent.textContent?.trim() === '') {
                parent.remove();
            }
        });

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
            .replace(/à/g, 'à')
            .replace(/é/g, 'é')
            .replace(/è/g, 'è')
            .replace(/ê/g, 'ê')
            .replace(/ç/g, 'ç')
            .replace(/https?:\/\/(www\.)?dropsiders\.fr/g, '');

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

        // Pre-clean: fix malformed HTML from older publications (spaces in tags/attributes)
        const fixedHtml = html
            .replace(/< (\w)/g, '<$1')           // "< div" -> "<div", "< a" -> "<a"
            .replace(/<\/(\w+) >/g, '</$1>')      // "</div >" -> "</div>", "</a >" -> "</a>"
            .replace(/data - platform=/g, 'data-platform=')  // "data - platform" -> "data-platform"
            .replace(/ href\s*=\s*"/g, ' href="')  // 'href = "' -> 'href="'
            .replace(/ target\s*=\s*"/g, ' target="')
            .replace(/ style\s*=\s*"/g, ' style="')
            .replace(/ class\s*=\s*"/g, ' class="');

        const doc = new DOMParser().parseFromString(fixedHtml, 'text/html');

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
        let festivalLabel = language === 'en' ? "THE FESTIVAL" : "LE FESTIVAL";
        if (festSocialsContainer) {
            const h3 = festSocialsContainer.querySelector('h3');
            if (h3) {
                festivalLabel = h3.textContent?.replace(/SUIVEZ\s+/i, '').replace(/FOLLOW\s+/i, '').trim() || (language === 'en' ? "THE FESTIVAL" : "LE FESTIVAL");
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

    // Article content processing utils

    return (
        <div className={`min-h-screen bg-dark-bg selection:bg-neon-red selection:text-white ${type === 'recap' ? 'article-type-recap' : isInterview ? 'article-type-interview' : isMusic ? 'article-type-music' : 'article-type-news'}`}>
            {/* Reading Progress Bar (Neon) */}
            <div className="fixed top-0 left-0 right-0 h-1 z-[200] pointer-events-none mb-20 md:mb-0">
                <motion.div
                    className="h-full bg-neon-red shadow-[0_0_15px_rgba(255,0,51,0.8)]"
                    style={{
                        scaleX: 0,
                        transformOrigin: "left",
                    }}
                    id="reading-progress-bar"
                />
            </div>
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

            <script dangerouslySetInnerHTML={{
                __html: `
                window.addEventListener('scroll', () => {
                    const bar = document.getElementById('reading-progress-bar');
                    if (bar) {
                        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                        const scrolled = (winScroll / height);
                        bar.style.transform = 'scaleX(' + scrolled + ')';
                    }
                });
            `}} />

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
                            src={resolveImageUrl(article.image)}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                            }}
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
                                {/* Facebook */}
                                <a
                                    href={shareLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                    title="Partager sur Facebook"
                                >
                                    <Facebook className="w-4 h-4 text-white group-hover:text-blue-500 transition-colors" />
                                </a>

                                {/* Instagram */}
                                <button
                                    onClick={handleInstagramShare}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                    title="Partager en Story ou Publication Instagram"
                                >
                                    <Instagram className="w-4 h-4 text-white group-hover:text-pink-500 transition-colors" />
                                </button>

                                {/* X (Twitter) */}
                                <a
                                    href={shareLinks.x}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                    title="Partager sur X"
                                >
                                    <XIcon className="w-4 h-4 text-white group-hover:text-gray-400 transition-colors" />
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
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className={`inline-flex items-center justify-center px-6 py-2.5 rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-lg ${article.isFocus
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

                            {/* Audio Reader */}
                            <ArticleReader
                                content={displayContent}
                                title={displayTitle}
                                author={article.author}
                            />
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
                            <>
                                {isTranslating && (
                                    <div className="mb-6 py-3 px-4 bg-neon-red/10 border border-neon-red/20 rounded-2xl flex items-center gap-3 animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-neon-red animate-ping" />
                                        <span className="text-[10px] font-black text-neon-red uppercase tracking-widest">
                                            {language === 'en' ? 'Translating content...' : 'Traduction en cours...'}
                                        </span>
                                    </div>
                                )}
                                <h1
                                    className="text-3xl sm:text-4xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter leading-[0.9] drop-shadow-2xl premium-h1"
                                    dangerouslySetInnerHTML={{ __html: standardizeText(displayTitle) }}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT CONTAINER (8/4 GRID) --- */}
            <motion.main
                className="relative z-20 pb-16 -mt-10"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_e, info) => {
                    if (info.offset.x < -100 && nextArticle) {
                        // Swipe Left -> Next Article
                        navigate(type === 'recap' ? getRecapLink(nextArticle) : getArticleLink(nextArticle));
                        window.scrollTo(0, 0);
                    } else if (info.offset.x > 100 && previousArticle) {
                        // Swipe Right -> Previous Article
                        navigate(type === 'recap' ? getRecapLink(previousArticle) : getArticleLink(previousArticle));
                        window.scrollTo(0, 0);
                    }
                }}
            >
                <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
                    <div className="bg-dark-card border border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-5 sm:p-6 md:p-10 lg:p-12 shadow-2xl backdrop-blur-md">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

                            {/* LEFT COLUMN: Main Content (9 spans) */}
                            <div className="lg:col-span-9">
                                <div className="article-body-premium w-full">
                                    {isLoading && !content ? (
                                        <div className="space-y-4 animate-pulse">
                                            <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                            <div className="h-4 bg-white/5 rounded w-full"></div>
                                            <div className="h-4 bg-white/5 rounded w-5/6"></div>
                                            <div className="h-64 bg-white/5 rounded-2xl w-full my-8"></div>
                                            <div className="h-4 bg-white/5 rounded w-2/3"></div>
                                            <div className="h-4 bg-white/5 rounded w-full"></div>
                                        </div>
                                    ) : (
                                        <div dangerouslySetInnerHTML={{ __html: displayContent }} />
                                    )}
                                </div>
                                {artistSocials && artistSocials.length > 0 && (
                                    <div className="artist-socials-premium mt-12 pt-8 border-t border-white/10">
                                        <div className="flex flex-col items-center mb-8">
                                            <div className="inline-block px-4 py-2 bg-neon-red/10 border border-neon-red/20 rounded-lg group/label relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/label:translate-x-full transition-transform duration-1000" />
                                                <h3 className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] relative z-10">
                                                    {language === 'en' ? 'FOLLOW' : 'SUIVEZ'} {artistLabel}
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
                                                    {language === 'en' ? 'FOLLOW' : 'SUIVEZ'} {festivalLabel}
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
                                    !article.category?.includes('Interview Video') && (
                                        <div className="mt-16 mb-16">
                                            <h3 className="text-3xl font-display font-black text-white mb-10 uppercase italic flex items-center gap-4 group">
                                                <div className="w-12 h-12 rounded-2xl bg-neon-red/10 flex items-center justify-center border border-neon-red/30 group-hover:bg-neon-red/20 transition-all">
                                                    <Play className="w-6 h-6 text-neon-red fill-neon-red animate-pulse" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-neon-red text-[10px] tracking-[0.4em] font-black mb-1">{t('article_detail.must_watch')}</span>
                                                    {isInterview ? "VIDÉO DE L'INTERVIEW" : t('article_detail.video_title')}
                                                </div>
                                            </h3>
                                            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,0,51,0.15)] group">
                                                <iframe
                                                    src={`https://www.youtube-nocookie.com/embed/${extractId(article.youtubeId)}`}
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
                                                        src={resolveImageUrl(img)}
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop';
                                                        }}
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
                                                                        src={resolveImageUrl(previousArticle.image)}
                                                                        alt=""
                                                                        className="w-full h-full object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-500"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                                                        }}
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
                                                                        src={resolveImageUrl(nextArticle.image)}
                                                                        alt=""
                                                                        className="w-full h-full object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-500"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                                                        }}
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


                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </motion.main>
        </div>
    );
};

export default ArticlePremiumTemplate;
