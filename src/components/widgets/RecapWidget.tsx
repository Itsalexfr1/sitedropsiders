import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowUpRight } from 'lucide-react';
import recapsData from '../../data/recaps.json';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { getRecapLink } from '../../utils/slugify';
import { translateText } from '../../utils/translate';

export function RecapWidget({ accentColor = 'orange', resolvedColor }: { accentColor?: string, resolvedColor?: string }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t, language } = useLanguage();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const latestRecaps = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return (recapsData as any[])
            .filter(item => item.date <= today)
            .slice(0, isMobile ? 4 : 8);
    }, [isMobile]);

    const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({});

    useEffect(() => {
        if (language === 'en') {
            Promise.all(
                latestRecaps.map(item =>
                    translateText(item.title, 'en').then(translated => ({ id: item.id, title: translated }))
                )
            ).then(results => {
                const titleMap: Record<string, string> = {};
                results.forEach(res => {
                    titleMap[res.id] = res.title;
                });
                setTranslatedTitles(titleMap);
            });
        }
    }, [language, latestRecaps]);

    const playHoverSound = useHoverSound();

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.latest_recaps').toUpperCase()}
                </h3>
                <Link
                    to="/recaps"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 group bg-white/5"
                    style={{ borderColor: `${color}66`, color: 'white' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.boxShadow = `0 0 20px ${color}4D`;
                        e.currentTarget.style.backgroundColor = `${color}26`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${color}66`;
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                >
                    {t('home.view_all')} <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>

            {latestRecaps.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-lg bg-dark-bg/40 backdrop-blur-md min-h-[400px]">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_recap')}</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {latestRecaps.map((item: any, index: number) => (
                        <Link to={getRecapLink(item)} key={item.id} className="block group">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/50 transition-all duration-300 shadow-xl flex items-stretch glow-card-${accentColor}`}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = color}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[-1]"
                                    style={{
                                        background: `radial-gradient(circle at center, ${color}33 0%, transparent 70%)`,
                                        filter: 'blur(20px)'
                                    }}
                                />
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center z-10">
                                    <div
                                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all duration-300"
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = `${color}33`}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                    >
                                        <Play className="w-4 h-4 text-white fill-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                    </div>
                                </div>
                                <div className="absolute top-2 left-2 z-20">
                                    <span
                                        className="px-1.5 py-0.5 bg-dark-bg/80 backdrop-blur-md border text-[7px] font-black rounded uppercase tracking-tighter"
                                        style={{
                                            borderColor: color,
                                            color: color,
                                            boxShadow: `0 0 10px ${color}4D`
                                        }}
                                    >
                                        {t('home.recap_badge')}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-20">
                                    <h4
                                        className="text-[13px] font-display font-bold text-white leading-tight transition-colors line-clamp-2 uppercase italic tracking-tighter"
                                        onMouseEnter={(e) => e.currentTarget.style.color = color}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                                    >
                                        {translatedTitles[item.id] || item.title}
                                    </h4>
                                    <p className="text-[8px] text-gray-500 mt-1 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
