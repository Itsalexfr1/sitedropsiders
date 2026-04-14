import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useLanguage } from '../../context/LanguageContext';
import { resolveImageUrl } from '../../utils/image';

export function InterviewWidget({ accentColor = 'purple', resolvedColor, featuredInterviews }: { accentColor?: string, resolvedColor?: string, featuredInterviews?: string[] }) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t, language } = useLanguage();
    const [newsData, setNewsData] = useState<any[]>([]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) setNewsData(await res.json());
            } catch (err) {
                console.error('Failed to fetch news for interview widget:', err);
            }
        };
        fetchNews();
    }, []);

    const displayInterviews = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const all = newsData as any[];
        const baseInterviews = all.filter((item: any) => {
            if ((item.date || '').substring(0, 10) > today) return false;
            return item.category === 'Interview' ||
                item.category === 'Interviews' ||
                item.category === 'Interview Video';
        }).sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return b.id - a.id;
        });

        if (featuredInterviews && featuredInterviews.length > 0) {
            const selected = featuredInterviews
                .map(id => baseInterviews.find(item => String(item.id) === String(id)))
                .filter(Boolean);

            if (selected.length < 4) {
                const remaining = baseInterviews
                    .filter(item => !featuredInterviews.includes(String(item.id)))
                    .slice(0, 4 - selected.length);
                return [...selected, ...remaining];
            }
            return selected.slice(0, 4);
        }

        return baseInterviews.slice(0, 4);
    }, [newsData, featuredInterviews]);

    const playHoverSound = useHoverSound();

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`
                        }}
                    />
                    {t('home.latest_interviews')}
                </h3>
                <Link
                    to="/interviews"
                    className="text-sm hover:underline transition-all flex items-center gap-1 font-bold tracking-tight uppercase italic"
                    style={{ color: color }}
                >
                    {t('home.view_all')} <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            {displayInterviews.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-3xl bg-dark-bg/40 backdrop-blur-md min-h-[400px]">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">{t('home.no_interview')}</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayInterviews.map((item: any, index: number) => (
                        <Link to={`/interviews/${item.id}`} key={item.id} className="block group relative">
                            {/* Lueur externe derrière la carte */}
                            <div
                                className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none blur-[25px] rounded-3xl z-0"
                                style={{ background: `${color}50` }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className="h-full relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 shadow-xl z-10"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = color;
                                    e.currentTarget.style.boxShadow = `0 0 30px ${color}60`;
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Glow overlay */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[1]"
                                    style={{
                                        background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
                                    }}
                                />
                                <img
                                    src={resolveImageUrl(item.image)}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center z-[2]">
                                    <div
                                        className="w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border group-hover:scale-110 transition-all duration-300"
                                        style={{
                                            backgroundColor: `${color}33`,
                                            borderColor: color
                                        }}
                                    >
                                        <Mic2 className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span
                                        className="px-3 py-1 text-white text-[9px] font-black rounded-full uppercase tracking-widest"
                                        style={{
                                            backgroundColor: color,
                                            boxShadow: `0 0 15px ${color}`
                                        }}
                                    >
                                        {t('home.interview_badge')}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/40 to-transparent">
                                    <h4
                                        className="text-white font-bold text-sm leading-tight transition-colors line-clamp-1 uppercase italic tracking-tight"
                                        onMouseEnter={(e) => e.currentTarget.style.color = color}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                                    >
                                        {item.title}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
