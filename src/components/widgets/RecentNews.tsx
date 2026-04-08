import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getArticleLink } from '../../utils/slugify';
import { translateText } from '../../utils/translate';
import { resolveImageUrl } from '../../utils/image';

export function RecentNews({ accentColor = 'blue', resolvedColor }: { accentColor?: string, resolvedColor?: string }) {
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
                        // Filter "written" recaps only (those with non-empty summary or content)
                        const writtenRecaps = recaps.filter(r => (r.summary && r.summary.trim().length > 10) || (r.content && r.content.trim().length > 10));
                        combinedData = [...combinedData, ...writtenRecaps];
                    }
                }

                setNewsData(combinedData);
            } catch (err) {
                console.error('Failed to fetch data for recent widget:', err);
            }
        };
        fetchData();
    }, []);

    const recentNews = useMemo(() => {
        const all = [...(newsData as any[])]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (all.length === 0) return [];

        const featured = all.find(item => item.isFeatured);

        // Logical fallback to identify which one is in the Hero slot
        const heroItem = featured || all.filter((item: any) => {
            const cat = (item.category || '').toLowerCase();
            return cat.includes('news') || cat.includes('musique') || cat.includes('music') || cat.includes('focus') || cat.includes('recap');
        })[0];

        return all
            .filter((item: any) => {
                // Skip the hero item
                if (heroItem && item.id === heroItem.id) return false;

                const cat = (item.category || '').toLowerCase();
                return cat.includes('news') || cat.includes('musique') || cat.includes('music') || cat.includes('focus') || cat.includes('recap');
            })
            .slice(0, 8);
    }, [newsData]);

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

    // playHoverSound moved to top

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
                    style={{ borderColor: `${color}66`, color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.boxShadow = `0 0 20px ${color}4D`;
                        e.currentTarget.style.backgroundColor = `${color}26`;
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${color}66`;
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'white';
                    }}
                >
                    <span className="hidden sm:inline">{t('home.all_news')}</span>
                    <span className="sm:hidden">{t('home.view_all')}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:h-[calc(750px-56px)] relative">
                    {/* First 2 items with rich visuals */}
                    {recentNews.slice(0, 2).map((item, index) => (
                        <Link to={getArticleLink(item)} key={item.id} className="block group relative flex-1 min-h-[180px] md:min-h-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className={`h-full relative rounded-2xl overflow-hidden border border-white/10 bg-dark-bg/40 backdrop-blur-md transition-all duration-500 shadow-xl glow-card-${accentColor}`}
                            >
                                <img
                                    src={resolveImageUrl(item.image || item.cover)}
                                    alt={item.title || ""}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end">
                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        <span style={{ color: color }}>{item.category}</span>
                                        <span>•</span>
                                        <span>{new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    <h4 className="text-white font-display font-bold text-xs md:text-sm leading-tight uppercase italic tracking-tight">
                                        {translatedTitles[item.id] || item.title}
                                    </h4>
                                </div>
                            </motion.div>
                        </Link>
                    ))}

                    {/* Next items in a compact list format for mobile */}
                    <div className="flex flex-col gap-3 mt-2 md:hidden">
                        {recentNews.slice(2, 6).map((item) => (
                            <Link to={getArticleLink(item)} key={item.id} className="flex items-center gap-4 p-2 bg-white/5 border border-white/5 rounded-2xl active:bg-white/10 transition-all">
                                <img 
                                    src={resolveImageUrl(item.image || item.cover)} 
                                    className="w-16 h-16 rounded-xl object-cover shrink-0" 
                                    alt={item.title || ""} 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                        <span style={{ color: color }}>{item.category}</span>
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                    </div>
                                    <h5 className="text-[11px] font-bold text-white line-clamp-4 leading-tight uppercase italic">{translatedTitles[item.id] || item.title}</h5>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
