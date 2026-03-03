import { Link } from 'react-router-dom';
import { Newspaper, Music, Calendar, Video, Camera, ArrowRight, TrendingUp, Star } from 'lucide-react';
import newsData from '../../data/news.json';
import { getArticleLink } from '../../utils/slugify';
import { useLanguage } from '../../context/LanguageContext';
import { useMemo } from 'react';

export function MobileHome() {
    const { t } = useLanguage();
    const sortedNews = useMemo(() => {
        return [...newsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);

    const featuredNews = sortedNews.filter(n => n.isFeatured).slice(0, 5);
    const hotNews = sortedNews.slice(0, 10);

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
                            className="min-w-[280px] aspect-[4/5] relative rounded-[2.5rem] overflow-hidden snap-center border border-white/10 group shadow-2xl"
                        >
                            <img src={news.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-active:scale-110" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <span className="px-2 py-1 bg-neon-red text-white text-[8px] font-black uppercase rounded-md mb-2 inline-block">
                                    {news.category}
                                </span>
                                <h3 className="text-xl font-display font-black text-white italic leading-tight uppercase line-clamp-2">
                                    {news.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="px-6 grid grid-cols-2 gap-4">
                <QuickAction
                    to="/musique"
                    icon={Music}
                    label={t('nav.music')}
                    color="bg-neon-green/10 border-neon-green/20 text-neon-green"
                />
                <QuickAction
                    to="/agenda"
                    icon={Calendar}
                    label={t('nav.agenda')}
                    color="bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan"
                />
                <QuickAction
                    to="/recaps"
                    icon={Video}
                    label={t('nav.recaps')}
                    color="bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
                />
                <QuickAction
                    to="/communaute"
                    icon={Camera}
                    label={t('nav.communaute')}
                    color="bg-neon-pink/10 border-neon-pink/20 text-neon-pink"
                />
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
                            className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-3xl active:bg-white/10 transition-all shadow-lg"
                        >
                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                                <img src={news.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-neon-red uppercase">{news.category}</span>
                                    <span className="text-[8px] text-gray-500 font-bold uppercase">{news.date}</span>
                                </div>
                                <h3 className="text-sm font-black text-white uppercase italic leading-tight line-clamp-2">{news.title}</h3>
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

function QuickAction({ to, icon: Icon, label, color }: { to: string, icon: any, label: string, color: string }) {
    return (
        <Link
            to={to}
            className={`flex flex-col items-center justify-center p-6 border rounded-[2rem] gap-3 transition-all active:scale-95 ${color}`}
        >
            <div className="p-3 bg-white/10 rounded-2xl">
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        </Link>
    );
}
