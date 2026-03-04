import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import newsDataStatic from '../../data/news.json';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getArticleLink } from '../../utils/slugify';
import { translateText } from '../../utils/translate';
import { useState, useEffect, useMemo } from 'react';

export function FeaturedNews({ accentColor = 'red', resolvedColor }: { accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t, language } = useLanguage();
    const [newsData, setNewsData] = useState<any[]>(newsDataStatic);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('/api/news');
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setNewsData(data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch news for featured widget:', err);
            }
        };
        fetchNews();
    }, []);

    const heroNews = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const all = [...(newsData as any[])]
            .filter(item => (item.date || '').substring(0, 10) <= today)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const featured = all.find(item => item.isFeatured);
        if (featured) return featured;

        // Fallback to latest news/music/focus if none marked as isFeatured
        const filtered = all.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return cat.includes('news') || cat.includes('musique') || cat.includes('music') || item.isFocus || cat.includes('focus');
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

    const playHoverSound = useHoverSound();

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
                        src={heroNews.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
