import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getArticleLink } from '../../utils/slugify';
import { translateText } from '../../utils/translate';
import { resolveImageUrl } from '../../utils/image';
import { useState, useEffect, useMemo } from 'react';

export function FeaturedNews({ accentColor = 'red', resolvedColor }: { accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t, language } = useLanguage();
    const playHoverSound = useHoverSound();
    const [newsData, setNewsData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [newsRes, recapsRes] = await Promise.all([
                    fetch('/api/news'),
                    fetch('/api/recaps')
                ]);

                let combinedData: any[] = [];

                if (newsRes.ok) {
                    const news = await newsRes.json();
                    if (Array.isArray(news)) combinedData = [...combinedData, ...news];
                }

                if (recapsRes.ok) {
                    const recaps = await recapsRes.json();
                    if (Array.isArray(recaps)) {
                        // Filter "written" recaps only
                        const writtenRecaps = recaps
                            .filter(r => (r.summary && r.summary.trim().length > 10) || (r.content && r.content.trim().length > 10))
                            .map(r => {
                                let title = r.title || "";
                                // Check if it already has the prefix
                                if (!title.toLowerCase().startsWith('récap') && !title.toLowerCase().startsWith('recap')) {
                                    title = `Récap : ${title}`;
                                }
                                return { ...r, title: title.toUpperCase() };
                            });
                        combinedData = [...combinedData, ...writtenRecaps];
                    }
                }

                setNewsData(combinedData);
            } catch (err) {
                console.error('Failed to fetch data for featured widget:', err);
            }
        };
        fetchData();
    }, []);

    const heroNews = useMemo(() => {
        const all = [...(newsData as any[])]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
        if (all.length === 0) return null;

        const featured = all.find(item => item.isFeatured);
        if (featured) return featured;

        // Fallback to latest news/music/focus if none marked as isFeatured
        const filtered = all.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return cat.includes('news') || 
                   cat.includes('musique') || 
                   cat.includes('music') || 
                   cat.includes('actu') || 
                   cat.includes('festival') || 
                   cat.includes('artist') ||
                   cat.includes('recap') ||
                   item.isFocus || 
                   cat.includes('focus');
        });
        // If still nothing, take the absolute latest article
        return filtered[0] || all[0];
    }, [newsData]);

    const [translatedTitle, setTranslatedTitle] = useState<string>('');

    useEffect(() => {
        if (heroNews && language === 'en') {
            translateText(heroNews.title, 'en').then(setTranslatedTitle);
        } else if (heroNews) {
            setTranslatedTitle(heroNews.title);
        }
    }, [heroNews, language]);

    if (!heroNews) {
        return (
            <div className="h-auto lg:h-[750px] flex flex-col overflow-hidden">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 mb-6">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.featured')}
                </h3>
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_article')}</p>
                </div>
            </div>
        );
    }

    // playHoverSound moved to top

    return (
        <div className="h-[450px] md:h-[750px] flex flex-col">
            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3 mb-6">
                <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}`
                    }}
                />
                {t('home.featured')}
            </h3>

            <Link to={getArticleLink(heroNews)} className="flex-1 block group relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    onMouseEnter={playHoverSound}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`h-full relative rounded-3xl overflow-hidden border border-white/10 bg-dark-bg/40 backdrop-blur-md transition-all duration-500 shadow-2xl glow-card-${accentColor}`}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = `${color}80`}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[-1]"
                        style={{
                            background: `radial-gradient(circle at center, ${color}4D 0%, transparent 70%)`,
                            filter: 'blur(40px)'
                        }}
                    />
                    <img
                        src={resolveImageUrl(heroNews.image || heroNews.cover)}
                        alt={heroNews.title || ""}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                        }}
                    />

                    {/* Overlay Content */}
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent">
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                            <span
                                className="font-black"
                                style={{ color: color }}
                            >
                                {heroNews.isFocus ? t('article_detail.focus').toUpperCase() : heroNews.category}
                            </span>
                            <span>•</span>
                            <span>{new Date(heroNews.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-display font-bold text-white leading-tight transition-colors group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {translatedTitle || heroNews.title}
                        </h2>
                    </div>

                    <div className="absolute top-6 left-6">
                        <span
                            className="px-4 py-1.5 bg-dark-bg/60 backdrop-blur-md border text-[10px] font-black uppercase tracking-tighter rounded-full"
                            style={{
                                borderColor: color,
                                color: color,
                                boxShadow: `0 0 15px ${color}4D`
                            }}
                        >
                            {t('home.hot')}
                        </span>
                    </div>
                </motion.div>
            </Link>
        </div>
    );
}
