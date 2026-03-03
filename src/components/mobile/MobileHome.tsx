import { Link } from 'react-router-dom';
import { Newspaper, ArrowRight, TrendingUp, Star } from 'lucide-react';
import newsData from '../../data/news.json';
import { getArticleLink } from '../../utils/slugify';
import { useLanguage } from '../../context/LanguageContext';
import { useMemo } from 'react';

export function MobileHome() {
    const { t } = useLanguage();
    const sortedNews = useMemo(() => {
        return [...newsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);

    const featuredNews = sortedNews.filter(n => n.isFeatured).slice(0, 3);
    const hotNews = sortedNews.slice(0, 5);

    return (
        <div className="flex flex-col gap-8 pb-20 bg-black min-h-screen">
            {/* Top Stories - Horizontal Scroll */}
            <section className="pt-6">
                <div className="px-6 mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-neon-red" />
                        {t('home.featured').toUpperCase()}
                    </h2>
                    <Link to="/news" className="text-[10px] font-black uppercase tracking-widest text-neon-red">Voir tout</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-6 scrollbar-hide snap-x">
                    {featuredNews.map((news) => (
                        <Link
                            key={news.id}
                            to={getArticleLink(news)}
                            className="min-w-[140px] aspect-[4/5] relative rounded-3xl overflow-hidden snap-center border border-white/10 group shadow-xl"
                        >
                            <img src={news.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-active:scale-110" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                                <span className="px-1.5 py-0.5 bg-neon-red text-white text-[7px] font-black uppercase rounded mb-1.5 inline-block">
                                    {news.category}
                                </span>
                                <h3 className="text-[1px] md:text-[11px] font-display font-black text-white italic leading-tight uppercase line-clamp-3">
                                    {news.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>



            {/* The Feed - News List */}
            <section className="px-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-neon-red" />
                    ACTUALITÉS RÉCENTES
                </h2>
                <div className="flex flex-col gap-4">
                    {hotNews.map((news) => (
                        <Link
                            key={news.id}
                            to={getArticleLink(news)}
                            className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-2xl active:bg-white/10 transition-all shadow-md"
                        >
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                <img src={news.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[7px] font-black text-neon-red uppercase">{news.category}</span>
                                    <span className="text-[7px] text-gray-500 font-bold uppercase">{news.date}</span>
                                </div>
                                <h3 className="text-[1px] md:text-[10px] font-black text-white uppercase italic leading-snug line-clamp-2">{news.title}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    to="/news"
                    className="mt-8 w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                >
                    Voir toute l'actu <ArrowRight className="w-4 h-4 text-neon-red" />
                </Link>
            </section>

            {/* Premium Section / Teaser */}
            <section className="px-6 pb-12">
                <div className="bg-gradient-to-br from-neon-red to-neon-purple p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                    <Star className="absolute top-6 right-6 w-8 h-8 text-white/20" />
                    <h3 className="text-2xl font-display font-black text-white italic uppercase leading-none mb-2">DROPSIDERS<br />PREMIUM</h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-6">Accès exclusif, interviews, et concours.</p>
                    <button className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest">S'abonner</button>
                </div>
            </section>
        </div>
    );
}
