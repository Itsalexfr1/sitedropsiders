import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { extractIdFromSlug } from '../utils/slugify';
import { getNewsContent } from '../utils/contentLoader';
import { trackPageView } from '../utils/analytics';
import { getInitialNews, fetchWithFallback } from '../utils/fetcher';
import ArticlePremiumTemplate from '../templates/ArticlePremiumTemplate';
import { SEO } from '../components/utils/SEO';

export function ArticleDetail() {
    const { t } = useLanguage();
    const { id } = useParams();

    const articleId = extractIdFromSlug(id || '');
    
    // Initialisation synchrone instantanée (0ms) depuis le cache LocalStorage ou le bundle
    const [newsData, setNewsData] = useState<any[]>(() => getInitialNews());

    const article = useMemo(() => {
        return newsData.find(item => 
            String(item.id) === String(articleId) || 
            (item.link && item.link.includes(`/${articleId}_`)) ||
            (item.link && item.link.endsWith(`-${articleId}`))
        );
    }, [newsData, articleId]);

    // Contenu synchrone compilé disponible en 0ms
    const staticContent = useMemo(() => {
        if (!articleId) return '';
        return getNewsContent(articleId) || '';
    }, [articleId]);

    const [liveContent, setLiveContent] = useState<string | null>(staticContent || null);
    const [isNewsLoading, setIsNewsLoading] = useState<boolean>(!article && newsData.length === 0);
    const [isLoadingContent, setIsLoadingContent] = useState<boolean>(!staticContent);

    // Revalidation des news en arrière-plan (sans bloquer l'affichage)
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const fresh = await fetchWithFallback('/api/news', {}, (updated) => {
                    if (Array.isArray(updated) && updated.length > 0) {
                        setNewsData(updated);
                    }
                });
                if (Array.isArray(fresh) && fresh.length > 0) {
                    setNewsData(fresh);
                }
            } catch (e) {
                console.warn('[ArticleDetail] Failed to revalidate news list:', e);
            } finally {
                setIsNewsLoading(false);
            }
        };
        fetchNews();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (article) {
            trackPageView(article.id.toString(), 'article');
        }
    }, [articleId, article]);

    // Vérification du contenu mis à jour en direct (ex: modification admin) en arrière-plan
    useEffect(() => {
        if (!articleId) {
            setIsLoadingContent(false);
            return;
        }

        let isMounted = true;
        const fetchContent = async () => {
            try {
                const res = await fetch(`/api/news/content?id=${articleId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && data.content && data.content.trim()) {
                        setLiveContent(data.content);
                    }
                }
            } catch (e) {
                // Silencieux : on a déjà le contenu statique affiché
            } finally {
                if (isMounted) {
                    setIsLoadingContent(false);
                }
            }
        };

        fetchContent();
        return () => {
            isMounted = false;
        };
    }, [articleId]);

    if (isNewsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Chargement...</p>
                </div>
            </div>
        );
    }

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

    // Related articles — same category, excluding current
    const relatedArticles = newsData
        .filter(item => item.id !== article.id && item.category === article.category)
        .slice(0, 3);

    // Navigation prev/next — same category, sorted by year and date desc (same as list page)
    const categoryArticles = [...newsData]
        .filter(item => item.category === article.category)
        .sort((a, b) => {
            const yearA = Number(a.year) || new Date(a.date).getFullYear();
            const yearB = Number(b.year) || new Date(b.date).getFullYear();
            
            if (yearB !== yearA) return yearB - yearA;
            
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
    const currentIndex = categoryArticles.findIndex(item => item.id === article.id);
    const previousArticle = currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null;
    const nextArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;

    // Priority: live API content > bundled content files > article content field > summary
    const bundledContent = getNewsContent(article.id);
    const resolvedContent = liveContent || (bundledContent ?? '') || article.content || (article.summary ? `<div class="article-section"><p class="text-base sm:text-lg leading-relaxed text-gray-200">${article.summary}</p></div>` : '');

    return (
        <>
            <SEO
                title={article.title}
                description={article.summary}
                image={article.image}
                article={true}
                date={article.date}
            />
            <ArticlePremiumTemplate
                article={article}
                content={resolvedContent}
                type="news"
                relatedArticles={relatedArticles}
                previousArticle={previousArticle}
                nextArticle={nextArticle}
                isLoading={isLoadingContent}
            />
        </>
    );
}

export default ArticleDetail;
