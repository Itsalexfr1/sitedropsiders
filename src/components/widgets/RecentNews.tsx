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
        <div className="h-[750px] flex flex-col overflow-hidden">
            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3 mb-6">
                <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}`
                    }}
                />
                {t('home.latest_news').toUpperCase()}
            </h3>

            <div className="flex-1 bg-dark-bg/40 border border-white/10 rounded-3xl p-4 md:p-5 backdrop-blur-md shadow-xl flex flex-col justify-between overflow-hidden">
                <div className="divide-y divide-white/5">
                    {recentNews.map((item, index) => (
                        <Link to={getArticleLink(item)} key={item.id} className="block group py-2 md:py-2.5 first:pt-0 last:pb-0">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-4 items-center origin-left"
                            >
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative bg-black/40 flex items-center justify-center">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-1 left-1">
                                        <span
                                            className="px-1.5 py-0.5 bg-dark-bg/60 backdrop-blur-md border text-[7px] font-black rounded"
                                            style={{
                                                borderColor: color,
                                                color: color
                                            }}
                                        >
                                            {t('home.new')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span
                                        className="text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase mb-1 block leading-none"
                                        style={{ color: color }}
                                    >
                                        {new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <h4
                                        className="text-white font-display font-bold text-[12px] md:text-sm leading-tight transition-colors line-clamp-2 uppercase italic tracking-tight"
                                        onMouseEnter={(e) => e.currentTarget.style.color = color}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                                    >
                                        {translatedTitles[item.id] || item.title}
                                    </h4>
                                </div>
                                <ArrowUpRight
                                    className="w-4 h-4 text-gray-700 transition-all"
                                    onMouseOver={(e) => e.currentTarget.style.color = color}
                                />
                            </motion.div>
                        </Link>
                    ))}
                </div>

                <Link
                    to="/news"
                    className="w-full mt-6 py-4 border bg-dark-bg text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group"
                    style={{
                        borderColor: `${color}4D`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.boxShadow = `0 0 30px ${color}33`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${color}4D`;
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {t('home.all_news')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
