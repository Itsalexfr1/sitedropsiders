import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import newsData from '../../data/news.json';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getArticleLink } from '../../utils/slugify';
import { translateText } from '../../utils/translate';

export function RecentNews({ accentColor = 'blue', resolvedColor }: { accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t, language } = useLanguage();

    const recentNews = useMemo(() => {
        const all = [...(newsData as any[])];
        const featured = all.find(item => item.isFeatured);

        // Logical fallback to identify which one is in the Hero slot
        const heroItem = featured || all.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return cat.includes('news') || cat.includes('musique') || cat.includes('music');
        })[0];

        return all
            .filter((item: any) => {
                // Skip the hero item
                if (heroItem && item.id === heroItem.id) return false;

                const cat = (item.category || '').toLowerCase();
                return cat.includes('news') || cat.includes('musique') || cat.includes('music');
            })
            .slice(0, 8);
    }, []);

    const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({});

    useEffect(() => {
        if (language === 'en') {
            Promise.all(
                recentNews.map((item: any) =>
                    translateText(item.title, 'en').then(translated => ({ id: item.id, title: translated }))
                )
            ).then(results => {
                const titleMap: Record<number, string> = {};
                results.forEach((res: any) => {
                    titleMap[res.id] = res.title;
                });
                setTranslatedTitles(titleMap);
            });
        } else {
            setTranslatedTitles({});
        }
    }, [language, recentNews]);

    if (recentNews.length === 0) {
        return (
            <div className="h-[750px] flex flex-col overflow-hidden">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.latest_news').toUpperCase()}
                </h3>
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_article')}</p>
                </div>
            </div>
        );
    }

    const playHoverSound = useHoverSound();

    return (
        <div className="h-auto flex flex-col">
            {/* Header with title + "Toutes les actualités" link */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.latest_news').toUpperCase()}
                </h3>
                <Link
                    to="/news"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 group"
                    style={{ borderColor: `${color}4D`, color: color }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.boxShadow = `0 0 20px ${color}33`;
                        e.currentTarget.style.backgroundColor = `${color}1A`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${color}4D`;
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <span className="hidden sm:inline">{t('home.all_news')}</span>
                    <span className="sm:hidden">{t('home.view_all')}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-6 md:h-[calc(750px-56px)] relative">
                    {recentNews.slice(0, 2).map((item, index) => (
                        <Link to={getArticleLink(item)} key={item.id} className="block group relative flex-1 min-h-[220px] md:min-h-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className={`h-full relative rounded-3xl overflow-hidden border border-white/10 bg-dark-bg/40 backdrop-blur-md transition-all duration-500 shadow-2xl glow-card-${accentColor}`}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[-1]"
                                    style={{
                                        background: `radial-gradient(circle at center, ${color}33 0%, transparent 70%)`,
                                        filter: 'blur(40px)'
                                    }}
                                />
                                <img
                                    src={item.image}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent opacity-80" />

                                {/* Content Overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end">
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        <span style={{ color: color }}>{item.category}</span>
                                        <span>•</span>
                                        <span>{new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    <h4 className="text-white font-display font-bold text-sm md:text-lg leading-tight transition-colors group-hover:text-white line-clamp-2 uppercase italic tracking-tight">
                                        {translatedTitles[item.id] || item.title}
                                    </h4>
                                </div>

                                <div className="absolute top-4 right-4">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-white group-hover:border-white transition-all duration-300"
                                    >
                                        <ArrowUpRight className="w-4 h-4 text-white group-hover:text-black transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
