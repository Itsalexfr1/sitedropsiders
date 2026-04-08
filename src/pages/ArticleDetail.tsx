import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { extractIdFromSlug } from '../utils/slugify';
import { getNewsContent } from '../utils/contentLoader';
import { trackPageView } from '../utils/analytics';
import ArticlePremiumTemplate from '../templates/ArticlePremiumTemplate';
import { SEO } from '../components/utils/SEO';

export function ArticleDetail() {
    const { t } = useLanguage();
    const { id } = useParams();

    const articleId = extractIdFromSlug(id || '');
    const [newsData, setNewsData] = useState<any[]>([]);
    const [isNewsLoading, setIsNewsLoading] = useState(true);
    const article = newsData.find(item => 
        item.id === articleId || 
        (item.link && item.link.includes(`/${articleId}_`)) ||
        (item.link && item.link.endsWith(`-${articleId}`))
    );

    const [liveContent, setLiveContent] = useState<string | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    setNewsData(await res.json());
                }
            } catch (e) {
                console.error('Failed to fetch news data:', e);
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

    // Fetch live content from API so edits are always reflected without redeploy
    useEffect(() => {
        if (!articleId) {
            setIsLoadingContent(false);
            return;
        }
        setIsLoadingContent(true);
        const fetchContent = async () => {
            try {
                const res = await fetch(`/api/news/content?id=${articleId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.content) {
                        setLiveContent(data.content);
                        setIsLoadingContent(false);
                        return;
                    }
                }
            } catch (e) {
                console.warn('[ArticleDetail] API content fetch failed, falling back to static bundle.', e);
            }
            // Fallback: use bundled content
            setLiveContent(null);
            setIsLoadingContent(false);
        };
        fetchContent();
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

    return (
        <>
            <SEO
                title={article.title}
                description={article.summary}
                image={article.image}
                article={true}
            />
            <ArticlePremiumTemplate
                article={article}
                content={liveContent || (bundledContent ?? '')}
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
