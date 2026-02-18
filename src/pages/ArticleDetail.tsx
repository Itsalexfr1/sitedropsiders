import { useParams, Link } from 'react-router-dom';
import newsData from '../data/news.json';
import { useLanguage } from '../context/LanguageContext';
import { extractIdFromSlug } from '../utils/slugify';
import { getNewsContent } from '../utils/contentLoader';
import ArticlePremiumTemplate from '../templates/ArticlePremiumTemplate';


export function ArticleDetail() {
    const { t } = useLanguage();
    const { id } = useParams();

    const articleId = extractIdFromSlug(id || '');
    const article = newsData.find(item => item.id === articleId);

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

    const relatedArticles = newsData
        .filter(item => item.id !== article.id && item.category === article.category)
        .slice(0, 3);

    // Navigation: Same Category
    const categoryArticles = newsData.filter(item => item.category === article.category);
    const currentIndex = categoryArticles.findIndex(item => item.id === article.id);
    const previousArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
    const nextArticle = currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null;

    // Get content from separate files
    const fullContent = getNewsContent(article.id);
    const rawContent = fullContent || (article as any).content || (article as any).summary || '';

    return (
        <ArticlePremiumTemplate
            article={article}
            content={rawContent}
            type="news"
            relatedArticles={relatedArticles}
            previousArticle={previousArticle}
            nextArticle={nextArticle}
        />
    );
}
