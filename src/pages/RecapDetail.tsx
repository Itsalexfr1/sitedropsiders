import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { extractIdFromSlug } from '../utils/slugify';
import { getRecapContent } from '../utils/contentLoader';
import { trackPageView } from '../utils/analytics';
import { getInitialRecaps, fetchWithFallback } from '../utils/fetcher';
import ArticlePremiumTemplate from '../templates/ArticlePremiumTemplate';
import { useHoverSound } from '../hooks/useHoverSound';
import { SEO } from '../components/utils/SEO';

const formatRecapTitle = (item: any) => {
    let title = item.title || "";
    if (!title.toLowerCase().startsWith('récap') && !title.toLowerCase().startsWith('recap')) {
        title = `Récap : ${title}`;
    }
    return { ...item, title: title.toUpperCase() };
};

export function RecapDetail() {
    const { t } = useLanguage();
    const { id } = useParams();
    const playHoverSound = useHoverSound();
    const recapId = extractIdFromSlug(id || '');

    // Initialisation instantanée 0ms depuis le cache persistant ou le bundle
    const [recapsData, setRecapsData] = useState<any[]>(() => {
        return getInitialRecaps().map(formatRecapTitle);
    });

    const recap = useMemo(() => {
        return (recapsData as any[]).find((item: any) => 
            String(item.id) === String(recapId) || 
            (item.link && item.link.includes(`/${recapId}_`)) ||
            (item.link && item.link.endsWith(`-${recapId}`))
        );
    }, [recapsData, recapId]);

    // Contenu synchrone compilé disponible en 0ms
    const staticContent = useMemo(() => {
        if (!recapId) return '';
        return getRecapContent(recapId) || '';
    }, [recapId]);

    const [liveContent, setLiveContent] = useState<string | null>(staticContent || null);
    const [isLoading, setIsLoading] = useState<boolean>(!recap && recapsData.length === 0);
    const [isLoadingContent, setIsLoadingContent] = useState<boolean>(!staticContent);

    // Revalidation silencieuse en arrière-plan
    useEffect(() => {
        const fetchRecaps = async () => {
            try {
                const fresh = await fetchWithFallback('/api/recaps', {}, (updated) => {
                    if (Array.isArray(updated) && updated.length > 0) {
                        setRecapsData(updated.map(formatRecapTitle));
                    }
                });
                if (Array.isArray(fresh) && fresh.length > 0) {
                    setRecapsData(fresh.map(formatRecapTitle));
                }
            } catch (e) {
                console.warn('[RecapDetail] Failed to revalidate recaps:', e);
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

    // Vérification de contenu live mis à jour en tâche de fond (ex: admin edit)
    useEffect(() => {
        if (!recapId) {
            setIsLoadingContent(false);
            return;
        }

        let isMounted = true;
        const fetchContent = async () => {
            try {
                const res = await fetch(`/api/recaps/content?id=${recapId}`);
                if (res.ok) {
                    const data = await res.json();
                    const content = data.content || (data.recap && data.recap.content) || '';
                    if (isMounted && content && content.trim()) {
                        setLiveContent(content);
                    }
                }
            } catch (e) {
                // Silencieux : contenu statique déjà affiché en 0ms
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
    }, [recapId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-neon-purple animate-spin" />
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
                        className="text-neon-purple hover:underline font-bold"
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

    // Get Content — Priority: live API > bundled JSON > empty
    const bundledContent = getRecapContent(recap.id);

    return (
        <>
            <SEO
                title={`Recap : ${recap.title}`}
                description={recap.summary}
                image={recap.image}
                article={true}
                date={recap.date}
            />
            <ArticlePremiumTemplate
                article={recap}
                content={liveContent || (bundledContent ?? '')}
                type="recap"
                relatedArticles={relatedRecaps}
                previousArticle={previousRecap}
                nextArticle={nextRecap}
                isLoading={isLoadingContent}
            />
        </>
    );
}
