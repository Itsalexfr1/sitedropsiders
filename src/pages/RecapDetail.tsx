import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { extractIdFromSlug } from '../utils/slugify';
import { getRecapContent } from '../utils/contentLoader';
import { trackPageView } from '../utils/analytics';
import ArticlePremiumTemplate from '../templates/ArticlePremiumTemplate';
import { useHoverSound } from '../hooks/useHoverSound';
import { SEO } from '../components/utils/SEO';

export function RecapDetail() {
    const { t } = useLanguage();
    const { id } = useParams();
    const playHoverSound = useHoverSound();
    const [recapsData, setRecapsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const recapId = extractIdFromSlug(id || '');
    const recap = (recapsData as any[]).find((item: any) => 
        item.id === recapId || 
        (item.link && item.link.includes(`/${recapId}_`)) ||
        (item.link && item.link.endsWith(`-${recapId}`))
    );

    useEffect(() => {
        const fetchRecaps = async () => {
            try {
                const res = await fetch('/api/recaps');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const formatted = data.map(item => {
                            let title = item.title || "";
                            if (!title.toLowerCase().startsWith('récap') && !title.toLowerCase().startsWith('recap')) {
                                title = `Récap : ${title}`;
                            }
                            return { ...item, title: title.toUpperCase() };
                        });
                        setRecapsData(formatted);
                    }
                }
            } catch (e) {
                console.error('Error fetching recaps:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecaps();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (recap) {
            trackPageView(recap.id.toString(), 'recap');
        }
    }, [recapId, recap]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-neon-red animate-spin" />
            </div>
        );
    }

    if (!recap) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-20 bg-dark-bg min-h-screen">
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

    // Navigation - Sort by year and date desc to match list page
    const allRecaps = [...(recapsData as any[])]
        .sort((a, b) => {
            const yearA = Number(a.year) || new Date(a.date).getFullYear();
            const yearB = Number(b.year) || new Date(b.date).getFullYear();
            
            if (yearB !== yearA) return yearB - yearA;
            
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
    const currentIndex = allRecaps.findIndex((item: any) => item.id === recap.id);
    const previousRecap = currentIndex < allRecaps.length - 1 ? allRecaps[currentIndex + 1] : null; // Older
    const nextRecap = currentIndex > 0 ? allRecaps[currentIndex - 1] : null; // Newer

    // Get Content
    const fullContent = getRecapContent(recap.id);
    const rawContent = fullContent || (recap as any).content || '';

    return (
        <>
            <SEO
                title={`Recap : ${recap.title}`}
                description={recap.summary}
                image={recap.image}
                article={true}
            />
            <ArticlePremiumTemplate
                article={recap}
                content={rawContent}
                type="recap"
                relatedArticles={relatedRecaps}
                previousArticle={previousRecap}
                nextArticle={nextRecap}
            />
        </>
    );
}
