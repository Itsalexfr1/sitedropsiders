import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import recapsData from '../data/recaps.json';
import { useLanguage } from '../context/LanguageContext';
import { extractIdFromSlug } from '../utils/slugify';
import { getRecapContent } from '../utils/contentLoader';
import { trackPageView } from '../utils/analytics';
import ArticlePremiumTemplate from '../templates/ArticlePremiumTemplate';
import { useHoverSound } from '../hooks/useHoverSound';

export function RecapDetail() {
    const { t } = useLanguage();
    const { id } = useParams();
    const playHoverSound = useHoverSound();

    const recapId = extractIdFromSlug(id || '');
    const recap = (recapsData as any[]).find((item: any) => item.id === recapId);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (recap) {
            trackPageView(recap.id.toString(), 'recap');
        }
    }, [recapId, recap]);

    if (!recap) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-dark-bg min-h-screen">
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

    // Navigation
    const allRecaps = recapsData as any[];
    const currentIndex = allRecaps.findIndex((item: any) => item.id === recap.id);
    const previousRecap = currentIndex > 0 ? allRecaps[currentIndex - 1] : null;
    const nextRecap = currentIndex < allRecaps.length - 1 ? allRecaps[currentIndex + 1] : null;

    // Get Content
    const fullContent = getRecapContent(recap.id);
    const rawContent = fullContent || (recap as any).content || '';

    return (
        <ArticlePremiumTemplate
            article={recap}
            content={rawContent}
            type="recap"
            relatedArticles={relatedRecaps}
            previousArticle={previousRecap}
            nextArticle={nextRecap}
        />
    );
}
